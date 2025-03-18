document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    // Get the form data
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Create an object with the form data
    const data = {
        username: username,
        password: password
    };

    // Send the data to the server using fetch
    fetch('/save-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log('Success:', result);
        alert('Data saved successfully!');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving data.');
    });
});