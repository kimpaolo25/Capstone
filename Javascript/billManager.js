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
let currentRow = null;

// Show the modal for adding a new entry
addButton.addEventListener('click', function () {
    form.reset(); // Clear the form
    currentRow = null; // Reset currentRow to null for adding a new entry
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

    if (currentRow) {
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
                const cells = currentRow.getElementsByTagName('td');
                Object.values(newRowData).forEach((value, index) => {
                    cells[index].textContent = value;
                });
                currentRow = null; // Reset currentRow

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
                const tableBody = document.querySelector('#dataTable tbody');
                const newRow = tableBody.insertRow();

                Object.values(newRowData).forEach(value => {
                    const cell = newRow.insertCell();
                    cell.textContent = value;
                });

                // Add action buttons
                const actionCell = newRow.insertCell();
                actionCell.innerHTML = `
                    <button class="update-btn">Update</button>
                    <button class="delete-btn">Delete</button>
                `;

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
                const row = event.target.closest('tr');
                row.remove();

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
        currentRow = event.target.closest('tr');
        const cells = currentRow.getElementsByTagName('td');

        form.name.value = cells[0].textContent;
        form.area.value = cells[1].textContent;
        form.current.value = cells[2].textContent;
        form.previous.value = cells[3].textContent;
        form.date.value = cells[4].textContent;
        form.initialAmount.value = cells[5].textContent;
        form.cuM.value = cells[6].textContent;
        form.amount.value = cells[7].textContent;

        // Show the modal for editing
        modal.style.display = 'block';
    }
});

// Search functionality
document.getElementById('searchInput').addEventListener('input', function () {
    const searchValue = this.value.toLowerCase();
    const rows = document.querySelectorAll('#dataTable tbody tr');
    let anyRowVisible = false;

    rows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        let match = false;

        for (let i = 0; i < cells.length - 1; i++) { // Exclude the last cell which is the action cell
            if (cells[i].textContent.toLowerCase().includes(searchValue)) {
                match = true;
                break;
            }
        }

        row.style.display = match ? '' : 'none';
        if (match) {
            anyRowVisible = true;
        }
    });

    // Show SweetAlert2 and clear search input if no records are found
    if (!anyRowVisible) {
        Swal.fire({
            title: 'No records found',
            text: 'No results match your search criteria.',
            icon: 'info',
            confirmButtonText: 'OK'
        }).then(() => {
            // Clear the search input after showing the alert
            document.getElementById('searchInput').value = '';
        });
    }
});

//active for billmanager
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