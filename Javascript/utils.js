// Get the current URL path
const currentPath = window.location.pathname;

// Check if the current path ends with 'billManager.php'
if (currentPath.endsWith('billManager.php')) {
    // Add the 'active' class to the button
    document.getElementById('billsButton').classList.add('active');
}


// Dashboard active class logic
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const accsButton = document.getElementById('accsButton');

    // Check if the current page is the manage account page
    if (currentPath.includes('manage_acc')) {
        if (accsButton) {
            accsButton.classList.add('active');
        }
    } else {
        if (accsButton) {
            accsButton.classList.remove('active');
        }
    }
});

// Active state for dashboard button (if applicable)
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const dashButton = document.getElementById('userManage');
    
    // Check if the current page is the dashboard
    if (currentPath.includes('manage_user')) {
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


// Show Password Functionality for Update Modal
    const currentPassword = document.getElementById("modalCurrentpass");
    const newPassword = document.getElementById("modalNewpass");
    const confirmPassword = document.getElementById("modalConfirmpass");
    const chk = document.getElementById("chk"); // Checkbox for updating password

    if (chk) { // Check if the checkbox exists before adding the event listener
        chk.onchange = function() {
            currentPassword.type = chk.checked ? "text" : "password";
            newPassword.type = chk.checked ? "text" : "password";
            confirmPassword.type = chk.checked ? "text" : "password";
        };
    }

    // Show Password Functionality for Add Modal
    const newAddPassword = document.getElementById("modalPass");
    const confirmAddPassword = document.getElementById("modalAddConfirmpass");
    const addChk = document.getElementById("addChk"); // Checkbox for adding password

    if (addChk) { // Check if the checkbox exists before adding the event listener
        addChk.onchange = function() {
            newAddPassword.type = addChk.checked ? "text" : "password";
            confirmAddPassword.type = addChk.checked ? "text" : "password";
        };
    }