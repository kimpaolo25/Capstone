// Add event listener to the exit button
document.getElementById('exitButton').addEventListener('click', function (event) {
    // Prevent the default action (navigation) to handle it manually
    event.preventDefault();

    // Show SweetAlert2 confirmation dialog
    Swal.fire({
        title: 'Are you sure you want to logout?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        reverseButtons: true
    }).then(result => {
        if (result.isConfirmed) {
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Logged out successfully!',
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                // Redirect to the logout.php page after the success message disappears
                window.location.href = '../php/logout.php';
            });
        }
    });
});

// Active state for dashboard button
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const dashButton = document.getElementById('dashButton');
    
    // Check if the current page is the dashboard
    if (currentPath.includes('admin')) {
        if (dashButton) {
            dashButton.classList.add('active');
        }
    } else {
        // Remove the active class if not on the dashboard page
        if (dashButton) {
            dashButton.classList.remove('active');
        }
    }
});
