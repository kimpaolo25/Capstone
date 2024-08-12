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
        if (confirm('Are you sure you want to update this entry?')) {
            // Update existing row
            const cells = currentRow.getElementsByTagName('td');
            Object.values(newRowData).forEach((value, index) => {
                cells[index].textContent = value;
            });
            currentRow = null; // Reset currentRow
        }
    } else {
        // Prompt user to confirm adding
        if (confirm('Are you sure you want to add this entry?')) {
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
        }
    }

    // Close the modal and reset the form
    modal.style.display = 'none';
    form.reset();
});

// Optional: Implement update and delete button functionality
document.querySelector('#dataTable').addEventListener('click', function (event) {
    if (event.target.classList.contains('delete-btn')) {
        // Prompt user to confirm deletion
        if (confirm('Are you sure you want to delete this entry?')) {
            const row = event.target.closest('tr');
            row.remove();
        }
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
            });
        });


        