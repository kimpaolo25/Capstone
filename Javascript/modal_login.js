document.addEventListener("DOMContentLoaded", function() {
    var modal = document.getElementById("loginModal");
    var btn = document.getElementById("loginButton");
    var span = document.getElementsByClassName("close-button")[0];

    // Show the modal when the button is clicked
    btn.onclick = function() {
        modal.style.display = "flex";
    }

    // Hide the modal when the close button is clicked
    span.onclick = function() {
        modal.style.display = "none";
    }

    // Hide the modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Handle form submission via AJAX
    document.getElementById('loginForm').addEventListener('submit', function (e) {
        e.preventDefault(); // Prevent default form submission

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        fetch('php/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = 'admin.php'; // Redirect to admin.php on success
            } else {
                document.getElementById('loginError').textContent = 'Invalid login credentials.';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('loginError').textContent = 'An error occurred. Please try again.';
        });
    });
});
