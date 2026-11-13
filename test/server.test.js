const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp, validateCredentials } = require('../server');

let server;
let baseUrl;
let dataFile;

before(async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'login-json-'));
    dataFile = path.join(dir, 'data.json');
    server = createApp({ dataFile }).listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

function post(url, body, cookie) {
    return fetch(baseUrl + url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(cookie && { cookie }) },
        body: JSON.stringify(body),
        redirect: 'manual',
    });
}

test('rejects weak or malformed credentials', () => {
    assert.match(validateCredentials('ab', 'longenough'), /3 to 30/);
    assert.match(validateCredentials('good_name', 'short'), /at least 8/);
    assert.match(validateCredentials('bad name!', 'longenough'), /letters, numbers/);
    assert.equal(validateCredentials('good_name', 'longenough'), null);
});

test('registers a user and stores only a password hash', async () => {
    const res = await post('/register', { username: 'muneer', password: 'correct horse', isAdmin: true });
    assert.equal(res.status, 201);

    const users = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    assert.equal(users.length, 1);
    assert.equal(users[0].username, 'muneer');
    assert.notEqual(users[0].passwordHash, 'correct horse');
    assert.equal(users[0].password, undefined);
    assert.equal(users[0].isAdmin, undefined, 'extra fields from the request are not saved');
});

test('refuses a username that is already taken, ignoring case', async () => {
    const res = await post('/register', { username: 'MUNEER', password: 'another pass' });
    assert.equal(res.status, 409);
});

test('rejects a wrong password with a generic message', async () => {
    const wrong = await post('/login', { username: 'muneer', password: 'wrong password' });
    const unknown = await post('/login', { username: 'nobody', password: 'wrong password' });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.deepEqual(await wrong.json(), await unknown.json());
});

test('the dashboard needs a login, and logging out ends the session', async () => {
    const anonymous = await fetch(`${baseUrl}/dashboard`, { redirect: 'manual' });
    assert.equal(anonymous.status, 302);

    const login = await post('/login', { username: 'muneer', password: 'correct horse' });
    assert.equal(login.status, 200);
    const setCookie = login.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/i);
    const cookie = setCookie.split(';')[0];

    const dashboard = await fetch(`${baseUrl}/dashboard`, { headers: { cookie }, redirect: 'manual' });
    assert.equal(dashboard.status, 200);

    const me = await fetch(`${baseUrl}/api/me`, { headers: { cookie } });
    assert.deepEqual(await me.json(), { username: 'muneer' });

    await post('/logout', {}, cookie);
    const afterLogout = await fetch(`${baseUrl}/dashboard`, { headers: { cookie }, redirect: 'manual' });
    assert.equal(afterLogout.status, 302);
});

test('the dashboard page is not served as a public file', async () => {
    const res = await fetch(`${baseUrl}/dashboard.html`, { redirect: 'manual' });
    assert.equal(res.status, 404);
});
