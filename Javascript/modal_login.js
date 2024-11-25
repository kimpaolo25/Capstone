document.addEventListener("DOMContentLoaded", function() {
    var modal = document.getElementById("loginModal");
    var btn = document.getElementById("loginButton");
    var span = document.getElementsByClassName("close-button")[0];
    var checkbox = document.getElementById("chk");

    // Show the modal when the button is clicked
    btn.onclick = function() {
        modal.style.display = "flex";
        document.getElementById('footer').style.display = 'none';
    }

    // Hide the modal when the close button is clicked
    span.onclick = function() {
        hideLoginModal();
    }

    // Hide the modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target == modal) {
            hideLoginModal();
        }
    }

    // Function to hide the modal and reset the form
    function hideLoginModal() {
        modal.style.display = "none";
        resetLoginForm();
        document.getElementById('footer').style.display = 'inline-block';
    }

    // Function to reset the form and uncheck the checkbox
    function resetLoginForm() {
        document.getElementById('loginForm').reset(); // Reset all form fields
        checkbox.checked = false; // Uncheck the "Show Password" checkbox
        document.getElementById('password').type = "password"; // Reset password field to hidden
    }

    // Handle form submission
    document.getElementById('loginForm').addEventListener('submit', function (e) {
        e.preventDefault(); // Prevent default form submission
    
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
    
        fetch('./php/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Login Successful!',
                    text: 'You will be redirected shortly.',
                    timer: 1500,
                    showConfirmButton: false,
                }).then(() => {
                    // Redirect to the appropriate page based on user level
                    window.location.href = data.redirect; 
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: data.message,
                });
                resetLoginForm();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred. Please try again later.',
            });
        });
    });

    // Toggle password visibility
    document.getElementById('chk').onclick = function() {
        var passwordField = document.getElementById('password');
        passwordField.type = passwordField.type === "password" ? "text" : "password";
    };
});

