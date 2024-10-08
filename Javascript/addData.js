// Function to toggle between full and minimal input modes
function toggleInputMode(mode) {
    const fullFields = ['current', 'previous', 'cuM', 'amount'];
    
    fullFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (mode === 'minimal') {
            field.value = ''; // Clear the field's value
            field.readOnly = true; // Set fields to read-only in minimal mode
            field.disabled = true; // Disable the fields to prevent data entry
        } else {
            field.readOnly = false; // Enable fields in full mode
            field.disabled = false; // Allow data entry
        }
    });
}

// Function to check if all required fields are filled out
function validateFormFields(formData) {
    const inputMode = document.querySelector('input[name="inputMode"]:checked').value;
    const requiredFields = inputMode === 'full' 
        ? ['name', 'area', 'current', 'previous', 'date', 'initialAmount', 'cuM', 'amount']
        : ['name', 'area', 'date', 'initialAmount']; // Minimal mode requires only these fields

    for (const field of requiredFields) {
        const fieldElement = document.querySelector(`[name="${field}"]`);
        if (!formData.get(field) && !fieldElement.disabled) {  // Ignore disabled fields
            return false; // Return false if any required field is empty
        }
    }
    return true; // All required fields are filled
}

// Function to reset the add bill modal
function resetAddBillModal() {
    // Reset the radio buttons to default (Active)
    document.getElementById("activeRadio").checked = true;

    // Reset the form fields
    const form = document.getElementById("addBillForm");
    form.reset(); // Reset all fields in the form

    // Reset input mode to full
    toggleInputMode('full'); // Reset to full mode on opening the modal

    // Set the current date as default for the date field
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    form.date.value = today; // Set the current date
}

// Handle form submission
form.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default form submission

    // Collect form data
    const formData = new FormData(this);
    const newRowData = {
        name: formData.get('name'),
        area: formData.get('area'),
        current: formData.get('current') || null, // Optional in minimal mode
        previous: formData.get('previous') || null, // Optional in minimal mode
        date: formData.get('date'),
        initialAmount: formData.get('initialAmount'),
        cuM: formData.get('cuM') || null, // Optional in minimal mode
        amount: formData.get('amount') || null // Optional in minimal mode
    };

    // Check if all required fields are filled
    if (!validateFormFields(formData)) {
        Swal.fire({
            title: 'Incomplete Form',
            text: 'Please fill out all required fields before submitting.',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        return; // Stop form submission
    }

    // URL and method for adding a new entry
    const url = './php/addBill.php';
    const method = 'POST';

    // Show confirmation dialog
    Swal.fire({
        title: 'Are you sure you want to add this entry?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, add it!',
        cancelButtonText: 'No, cancel',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            // Proceed with the fetch request
            fetch(url, {
                method: method,
                body: new URLSearchParams(formData) // Convert FormData to URLSearchParams
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update tableData with newRowData
                    tableData.push(newRowData);

                    // Show success message and reload table
                    Swal.fire({
                        icon: 'success',
                        title: 'Entry added successfully!',
                        showConfirmButton: false,
                        timer: 1500
                    }).then(() => {
                        // Close the modal and reset the form
                        modal.style.display = 'none';
                        resetAddBillModal(); // Call reset function
                        fetchDataAndReloadTable(); // Function to refresh data
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Failed to process the request',
                        text: data.message || 'Something went wrong.',
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to process the request. Please try again later.',
                });
            });
        } else {
            // If the user cancels, do nothing or handle the cancellation
            Swal.fire({
                title: 'Action canceled',
                icon: 'info',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
});

// Auto-fill fields when the name input changes
form.name.addEventListener('input', function () {
    const name = this.value.trim();
    autoFillFields(name); // Function to auto-fill fields based on name input
});

// Set default input mode on page load
document.addEventListener('DOMContentLoaded', function() {
    toggleInputMode('full'); // Set default mode to full/active
});

// Close modal functionality
document.querySelectorAll('.close').forEach(closeButton => {
    closeButton.addEventListener('click', function() {
        // Close the modal
        document.getElementById('addBillModal').style.display = 'none';
        
        // Reset the modal fields
        resetAddBillModal(); // Ensure fields reset on close
    });
});

// Open modal functionality
document.getElementById("addButton").addEventListener('click', function() {
    document.getElementById('addBillModal').style.display = 'block';
    
    // Reset the modal fields when opening
    resetAddBillModal();
});
