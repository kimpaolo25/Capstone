// Get the current URL path
const currentPath = window.location.pathname;

// Check if the current path ends with 'billManager.php'
if (currentPath.endsWith('billManager.php')) {
    // Add the 'active' class to the button
    document.getElementById('billsButton').classList.add('active');
}
