// Data structure to store table data
let tableData = [];

// Ensure SweetAlert2 is included and available
if (typeof Swal === 'undefined') {
    console.error('SweetAlert2 is not included or not loaded properly.');
}

// Modal and form functionality
const modal = document.getElementById('addBillModal');
const addButton = document.getElementById('addButton');
const closeButton = document.querySelector('#addBillModal .close');
const saveButton = document.getElementById('saveButton');
const form = document.getElementById('addBillForm');

// Variable to store the current row being edited
let currentRowIndex = null;

// Function to initialize table data and populate it
function initializeTableData() {
    const rows = document.querySelectorAll('#dataTable tbody tr');
    tableData = Array.from(rows).map(row => {
        const cells = row.getElementsByTagName('td');
        return {
            name: cells[0].textContent,
            area: cells[1].textContent,
            current: cells[2].textContent,
            previous: cells[3].textContent,
            date: cells[4].textContent,
            initialAmount: cells[5].textContent,
            cuM: cells[6].textContent,
            amount: cells[7].textContent
        };
    });
}

// Function to reload table data
function reloadTable() {
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    tableData.forEach((row, index) => {
        const newRow = tableBody.insertRow();
        Object.values(row).forEach(value => {
            const cell = newRow.insertCell();
            cell.textContent = value;
        });

        // Add action buttons
        const actionCell = newRow.insertCell();
        actionCell.innerHTML = `
            <button class="update-btn">Update</button>
            <button class="delete-btn">Delete</button>
        `;
    });
}

// Show the modal for adding a new entry
addButton.addEventListener('click', function () {
    form.reset(); // Clear the form
    currentRowIndex = null; // Reset currentRowIndex to null for adding a new entry
    modal.style.display = 'block';
});

// Hide the modal
closeButton.addEventListener('click', function () {
    modal.style.display = 'none';
});

saveButton.addEventListener('click', function () {
    modal.style.display = 'none';
});

// Hide the modal when clicking outside of it
window.addEventListener('click', function (event) {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Handle form submission
form.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default form submission

    // Collect form data
    const formData = new FormData(this);
    const newRowData = {
        name: formData.get('name'),
        area: formData.get('area'),
        current: formData.get('current'),
        previous: formData.get('previous'),
        date: formData.get('date'),
        initialAmount: formData.get('initialAmount'),
        cuM: formData.get('cuM'),
        amount: formData.get('amount'),
    };

    if (currentRowIndex !== null) {
        // Prompt user to confirm update
        Swal.fire({
            title: 'Are you sure you want to update this entry?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, update it!',
            cancelButtonText: 'No, cancel',
            reverseButtons: true
        }).then(result => {
            if (result.isConfirmed) {
                // Update existing row
                tableData[currentRowIndex] = newRowData;
                reloadTable(); // Reload the table with updated data
                currentRowIndex = null; // Reset currentRowIndex

                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Entry updated successfully!',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    } else {
        // Prompt user to confirm adding
        Swal.fire({
            title: 'Are you sure you want to add this entry?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, add it!',
            cancelButtonText: 'No, cancel',
            reverseButtons: true
        }).then(result => {
            if (result.isConfirmed) {
                // Add new row
                tableData.push(newRowData);
                reloadTable(); // Reload the table with new data

                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Entry added successfully!',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    }

    // Close the modal and reset the form
    modal.style.display = 'none';
    form.reset();
});

// Optional: Implement update and delete button functionality
document.querySelector('#dataTable').addEventListener('click', function (event) {
    if (event.target.classList.contains('delete-btn')) {
        // Prompt user to confirm deletion
        Swal.fire({
            title: 'Are you sure you want to delete this entry?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel',
            reverseButtons: true
        }).then(result => {
            if (result.isConfirmed) {
                const rowIndex = Array.from(event.target.closest('tr').parentNode.children).indexOf(event.target.closest('tr'));
                tableData.splice(rowIndex, 1); // Remove from data source
                reloadTable(); // Reload the table with updated data

                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Entry deleted successfully!',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    } else if (event.target.classList.contains('update-btn')) {
        // Populate the modal with existing data
        currentRowIndex = Array.from(event.target.closest('tr').parentNode.children).indexOf(event.target.closest('tr'));
        const rowData = tableData[currentRowIndex];

        form.name.value = rowData.name;
        form.area.value = rowData.area;
        form.current.value = rowData.current;
        form.previous.value = rowData.previous;
        form.date.value = rowData.date;
        form.initialAmount.value = rowData.initialAmount;
        form.cuM.value = rowData.cuM;
        form.amount.value = rowData.amount;

        // Show the modal for editing
        modal.style.display = 'block';
    }
});

// Search functionality
const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', function () {
    const searchValue = this.value.toLowerCase();
    const rows = document.querySelectorAll('#dataTable tbody tr');
    let anyRowVisible = false;

    rows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        let match = false;

        // Assuming the name is in the first column (index 0)
        const nameCell = cells[0];
        
        if (nameCell) {
            if (nameCell.textContent.toLowerCase().includes(searchValue)) {
                match = true;
            }
        }

        row.style.display = match ? '' : 'none';
        if (match) {
            anyRowVisible = true;
        }
    });

    // Show SweetAlert2 and clear search input if no records are found
    if (!anyRowVisible && searchValue !== '') {
        Swal.fire({
            title: 'No records found',
            text: 'No results match your search criteria.',
            icon: 'info',
            confirmButtonText: 'OK'
        }).then(() => {
            // Clear the search input after showing the alert
            searchInput.value = '';
            reloadTable(); // Reload the table data
        });
    }
});

// Initialize table data on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTableData(); // Populate initial data
    reloadTable(); // Load table initially

    const currentPath = window.location.pathname;
    const dashButton = document.getElementById('billsButton');
    
    // Check if the current page is the dashboard
    if (currentPath.includes('billManager')) {
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


// Active state for bill manager
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const dashButton = document.getElementById('billsButton');
    
    // Check if the current page is the dashboard
    if (currentPath.includes('billManager')) {
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