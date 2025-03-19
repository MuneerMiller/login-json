# Login and Registration Application

This is a simple web application that allows users to register, log in, and view a dashboard. The application is built using **HTML**, **CSS**, **JavaScript** for the front-end, and **Node.js** with **Express** for the back-end. Passwords are securely hashed using **bcrypt**.

---

## Features

1. **User Registration:**
   - Users can register by providing a username and password.
   - Passwords are securely hashed using bcrypt before being stored.

2. **User Login:**
   - Registered users can log in using their credentials.
   - Passwords are verified against the hashed versions stored in the database.

3. **Dashboard:**
   - After successful login, users are redirected to a dashboard page.
   - The dashboard displays a success message and provides a **Log Out** button.

4. **User-Friendly UI:**
   - Clean and intuitive forms for registration and login.
   - Clear feedback for success and error states.
   - Responsive design that works on all screen sizes.

---

## Technologies Used

- **Front-End:**
  - HTML
  - CSS
  - JavaScript

- **Back-End:**
  - Node.js
  - Express
  - bcrypt (for password hashing)

- **Data Storage:**
  - JSON file (`data.json`) to store user data.

---

## Installation and Setup

Follow these steps to set up and run the application locally:

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/login-json.git
cd login-json
```

### 2. Install Dependencies

Make sure you have Node.js installed. Then, install the required dependencies:

```bash
npm install
```

### 3. Start the Server

Run the following command to start the server:

```bash
node server.js
```

The server will start on http://localhost:3000

### 4. Access the Application:

Open your browser and navigate to:

```
http://localhost:3000
```

---

## Usage

### Registration 

1. On the homepage, fill in the Username and Password fields in the registration form.

2. Click the Register button.

3. If successful, you will be prompted to log in.

### Login

1. On the homepage, fill in the Username and Password fields in the login form.

2. Click the Login button.

3. If the credentials are correct, you will be redirected to the dashboard.

### Dashboard

 - The dashboard displays a success message and a Log Out button.

 - Click the Log Out button to return to the login page.

---

## File Structure

```
login-json/
├── public/
│   ├── index.html          # Main HTML file for the login/registration forms
│   ├── dashboard.html      # Dashboard page for logged-in users
│   ├── styles.css          # CSS file for styling the application
│   └── script.js           # JavaScript file for handling form submissions
├── server.js               # Back-end server code
├── data.json               # JSON file to store user data
├── package.json            # Node.js project configuration
└── README.md               # Project documentation
```

---

## Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:

1. Fork the repository.

2. Create a new branch for your feature or bugfix.

3. Commit your changes.

4. Push your branch and submit a pull request.

---

## Licence

This project is licensed under the MIT License. See the LICENSE file for details.

---

## Acknowledgments

 - bcrypt: For securely hashing passwords.

 - Express: For simplifying the back-end server setup.

 - Flexbox: For creating a responsive and aligned layout.

---

## Contact

If you have any questions or feedback, feel free to reach out:

 - Email: muneermilleror@gmail.com

 - GitHub: https://github.com/MuneerMiller
