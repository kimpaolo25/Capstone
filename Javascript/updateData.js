document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('dataTable');
    updateModal = document.getElementById('updateBillModal');
    const updateForm = document.getElementById('updateBillForm');

    nameField = document.getElementById('updateName');
    areaField = document.getElementById('updateArea');
    currentField = document.getElementById('updateCurrent');
    previousField = document.getElementById('updatePrevious');
    dateField = document.getElementById('updateDate');
    initialAmountField = document.getElementById('updateInitialAmount');
    cuMField = document.getElementById('updateCuM');
    amountField = document.getElementById('updateAmount');

    // Regular Expression for date validation (YYYY-MMM format)
    const dateRegex = /^\d{4}-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/;

    table.addEventListener('click', function(event) {
        const target = event.target;
        const id = target.getAttribute('data-id');

        if (target.classList.contains('update-btn')) {
            currentId = id;
            populateModalFromDatabase(id);
        }
    });

    updateForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const date = dateField.value;

        // Validate the date format using regex
        if (!dateRegex.test(date)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Date Format',
                text: 'Please enter the date in the format YYYY-MMM (e.g., 2024-Nov).',
            });
            return;  // Prevent form submission if the date is invalid
        }

        // Display SweetAlert confirmation dialog
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to update this record?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, update it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                // Proceed with the update if confirmed
                const name = nameField.value;
                const area = areaField.value;
                const current = currentField.value;
                const previous = previousField.value;
                const initialAmount = initialAmountField.value;
                const cuM = cuMField.value;
                const amount = amountField.value;

                fetch('./php/updateBill.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'update',
                        id: currentId,
                        name: name,
                        area: area,
                        current: current,
                        previous: previous,
                        date: date,  // Send the date as is in "YYYY-MMM" format
                        initialAmount: initialAmount,
                        cuM: cuM,
                        amount: amount
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Your record has been updated!',
                            showConfirmButton: false,
                            timer: 1500
                        }).then(() => {
                            updateModal.style.display = 'none';
                            updateForm.reset();
                            fetchDataAndReloadTable();
                        });
                    } else {
                        Swal.fire('Error!', data.message || 'There was a problem updating the record.', 'error');
                    }
                })
                .catch(error => Swal.fire('Error!', 'An error occurred while updating the record.', 'error'));
            }
        });
    });

    // Function to update cuM and amount dynamically
    function updateCuMAndAmount() {
        const current = parseFloat(currentField.value) || 0;
        const previous = parseFloat(previousField.value) || 0;
        const cuM = (current - previous).toFixed(2);
        cuMField.value = cuM;

        const initial = parseFloat(initialAmountField.value) || 0;
        const amount = (parseFloat(cuM) - 8) * 20 + initial;
        amountField.value = amount > 179 ? amount.toFixed(2) : initial.toFixed(2);
    }

    // Add event listeners to the fields that affect cuM and amount calculation
    currentField.addEventListener('input', updateCuMAndAmount);
    previousField.addEventListener('input', updateCuMAndAmount);
    initialAmountField.addEventListener('input', updateCuMAndAmount);

    // Close the modal and reset the form
    updateModal.querySelector('.close').addEventListener('click', function() {
        updateModal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === updateModal) {
            updateModal.style.display = 'none';
        }
    });
});

// Function to populate the modal with data from the database
function populateModalFromDatabase(id) {
    fetch('./php/updateBill.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ id: id })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response data:', data); // Debug: check the response data

        if (data.error) {
            Swal.fire('Error!', data.error, 'error');
            return;
        }

        // Populate the modal fields with the fetched data
        nameField.value = data.Name;
        currentField.value = data.Present || '';
        previousField.value = data.Previous || '';
        cuMField.value = data.CU_M || '';
        amountField.value = data.Amount || '';
        areaField.value = data.Area_Number || '';
        dateField.value = formatDateString(data.Date_column) || ''; // Format date before populating
        initialAmountField.value = data.Initial || '';

        // Show the modal
        updateModal.style.display = 'block';
    })
    .catch(error => {
        console.error('Fetch error:', error);
        Swal.fire('Error!', 'An error occurred while fetching the record.', 'error');
    });
}

// Function to format the date in "YYYY-MMM" format
function formatDateString(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.toLocaleString('en-us', { month: 'short' });

    return `${year}-${month}`;
}
