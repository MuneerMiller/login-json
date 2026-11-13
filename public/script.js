const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

// Toggle between the registration and login forms
function showForm(formToShow, formToHide) {
    formToHide.classList.add('hidden');
    formToShow.classList.remove('hidden');
    setMessage(formToShow, '');
    formToShow.querySelector('input').focus();
}

document.getElementById('showLogin').addEventListener('click', (event) => {
    event.preventDefault();
    showForm(loginForm, registerForm);
});

document.getElementById('showRegister').addEventListener('click', (event) => {
    event.preventDefault();
    showForm(registerForm, loginForm);
});

// Show a message inside a form, styled as an error or a success
function setMessage(form, text, type = 'error') {
    const message = form.querySelector('.message');
    message.textContent = text;
    message.className = `message ${text ? type : ''}`;
}

// Send the form's username and password as JSON and return the server's reply
async function submitCredentials(url, form, usernameId, passwordId) {
    const username = document.getElementById(usernameId).value.trim();
    // Passwords are sent exactly as typed: spaces can be part of a password.
    const password = document.getElementById(passwordId).value;

    if (!username || !password) {
        setMessage(form, 'Please fill in both username and password.');
        return null;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const result = await response.json().catch(() => ({}));
        return { ok: response.ok, message: result.message || 'Something went wrong. Please try again.' };
    } catch (error) {
        console.error('Error:', error);
        return { ok: false, message: 'Could not reach the server. Is it running?' };
    } finally {
        button.disabled = false;
    }
}

registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await submitCredentials('/register', registerForm, 'regUsername', 'regPassword');
    if (!result) return;
    if (!result.ok) {
        setMessage(registerForm, result.message);
        return;
    }
    registerForm.reset();
    showForm(loginForm, registerForm);
    setMessage(loginForm, result.message, 'success');
});

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await submitCredentials('/login', loginForm, 'loginUsername', 'loginPassword');
    if (!result) return;
    if (!result.ok) {
        setMessage(loginForm, result.message);
        return;
    }
    window.location.href = '/dashboard';
});
