document.addEventListener('DOMContentLoaded', () => {
    // Get the current year
    const currentYear = new Date().getFullYear();
    const yearFilter = document.getElementById('yearFilter');

    // Dynamically generate options for the past 10 years
    for (let year = currentYear; year >= currentYear - 4; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    }
    
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
                    window.location.href = '../Capstone/php/logout.php';
                });
            }
        });
    });

    // Active state for dashboard button
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
