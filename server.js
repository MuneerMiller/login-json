const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static('public'));

// Endpoint to handle form submission
app.post('/save-data', async (req, res) => {
    const data = req.body;

    // Back-end validation
    if (!data.username || !data.password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Hash the password
        const saltRounds = 10; // Number of salt rounds for hashing
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        // Replace the plain text password with the hashed password
        data.password = hashedPassword;

        // Read existing data from the file (if it exists)
        fs.readFile('data.json', 'utf8', (err, fileData) => {
            let jsonData = [];
            if (!err && fileData) {
                jsonData = JSON.parse(fileData);
            }

            // Add the new data to the array
            jsonData.push(data);

            // Write the updated data back to the file
            fs.writeFile('data.json', JSON.stringify(jsonData, null, 2), (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                    return res.status(500).json({ message: 'Error saving data' });
                }
                res.json({ message: 'Data saved successfully' });
            });
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).json({ message: 'Error processing data' });
    }
});

// Endpoint to handle user login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Back-end validation
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Read existing data from the file
        const fileData = await fs.promises.readFile('data.json', 'utf8');
        const jsonData = JSON.parse(fileData);

        // Find the user by username
        const user = jsonData.find(user => user.username === username);
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Compare the submitted password with the hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // If everything is correct, return a success message
        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Error during login' });
    }
});

// Serve the dashboard page
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});