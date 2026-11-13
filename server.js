const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;
const SESSION_COOKIE = 'sid';
const SESSION_TTL_MS = 60 * 60 * 1000; // sessions last one hour
const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,30}$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72; // bcrypt ignores anything past 72 bytes

/**
 * Builds the Express app. `dataFile` is the JSON file that holds the users,
 * so tests can point it at a temporary file.
 */
function createApp({ dataFile = path.join(__dirname, 'data.json') } = {}) {
    const app = express();
    const sessions = new Map(); // token -> { username, expires }
    let writeQueue = Promise.resolve();

    async function readUsers() {
        try {
            return JSON.parse(await fs.readFile(dataFile, 'utf8'));
        } catch (err) {
            if (err.code === 'ENOENT') return [];
            throw err;
        }
    }

    // Run read-modify-write updates one at a time, so two sign-ups that
    // arrive together cannot overwrite each other.
    function updateUsers(change) {
        const run = writeQueue.then(async () => {
            const users = await readUsers();
            const result = await change(users);
            await fs.writeFile(dataFile, JSON.stringify(users, null, 2));
            return result;
        });
        writeQueue = run.catch(() => {});
        return run;
    }

    function getSession(req) {
        const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
        const session = token && sessions.get(token);
        if (!session) return null;
        if (session.expires < Date.now()) {
            sessions.delete(token);
            return null;
        }
        return { token, ...session };
    }

    function requireLogin(req, res, next) {
        const session = getSession(req);
        if (!session) return res.redirect('/');
        req.session = session;
        next();
    }

    app.use(express.json({ limit: '10kb' }));
    app.use(express.static(path.join(__dirname, 'public')));

    app.post('/register', async (req, res) => {
        const { username, password } = req.body || {};
        const problem = validateCredentials(username, password);
        if (problem) return res.status(400).json({ message: problem });

        try {
            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
            const created = await updateUsers((users) => {
                const taken = users.some(
                    (user) => user.username.toLowerCase() === username.toLowerCase()
                );
                if (taken) return false;
                // Store only what we need: never the plain password or extra fields.
                users.push({ username, passwordHash, createdAt: new Date().toISOString() });
                return true;
            });
            if (!created) {
                return res.status(409).json({ message: 'That username is already taken.' });
            }
            res.status(201).json({ message: 'Account created. You can log in now.' });
        } catch (err) {
            console.error('Error registering user:', err);
            res.status(500).json({ message: 'Something went wrong. Please try again.' });
        }
    });

    app.post('/login', async (req, res) => {
        const { username, password } = req.body || {};
        if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        try {
            const users = await readUsers();
            const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
            // Same message for an unknown user and a wrong password, so the
            // response does not reveal which usernames exist.
            // Older data.json files kept the hash under `password`.
            const hash = user && (user.passwordHash || user.password);
            const valid = Boolean(hash) && (await bcrypt.compare(password, hash));
            if (!valid) {
                return res.status(401).json({ message: 'Invalid username or password.' });
            }

            const token = crypto.randomBytes(32).toString('hex');
            sessions.set(token, { username: user.username, expires: Date.now() + SESSION_TTL_MS });
            res.cookie(SESSION_COOKIE, token, {
                httpOnly: true,
                sameSite: 'strict',
                secure: process.env.NODE_ENV === 'production',
                maxAge: SESSION_TTL_MS,
            });
            res.json({ message: 'Login successful.' });
        } catch (err) {
            console.error('Error during login:', err);
            res.status(500).json({ message: 'Something went wrong. Please try again.' });
        }
    });

    app.get('/dashboard', requireLogin, (req, res) => {
        res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
    });

    app.get('/api/me', (req, res) => {
        const session = getSession(req);
        if (!session) return res.status(401).json({ message: 'Not logged in.' });
        res.json({ username: session.username });
    });

    app.post('/logout', (req, res) => {
        const session = getSession(req);
        if (session) sessions.delete(session.token);
        res.clearCookie(SESSION_COOKIE);
        res.json({ message: 'Logged out.' });
    });

    return app;
}

function validateCredentials(username, password) {
    if (typeof username !== 'string' || typeof password !== 'string') {
        return 'Username and password are required.';
    }
    if (!USERNAME_PATTERN.test(username)) {
        return 'Usernames are 3 to 30 characters: letters, numbers, dots, dashes and underscores.';
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
        return 'Passwords can be at most 72 characters.';
    }
    return null;
}

function parseCookies(header = '') {
    const cookies = {};
    for (const part of header.split(';')) {
        const index = part.indexOf('=');
        if (index === -1) continue;
        cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
    }
    return cookies;
}

module.exports = { createApp, validateCredentials };

if (require.main === module) {
    const port = process.env.PORT || 3000;
    createApp().listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}
