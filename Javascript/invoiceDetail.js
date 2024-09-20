document.addEventListener('DOMContentLoaded', () => {
    const setButton = document.getElementById('setButton');
    const dueDateModal = document.getElementById('invDateModal');
    const saveDateButton = document.getElementById('updateButton'); // ID corrected to updateDateButton
    const dueDateInput = document.getElementById('invDateInput');
    const resetModalButton = document.getElementById('resetModalButton');

    // Clear due date on page load
    localStorage.removeItem('dueDate');
    dueDateInput.value = '';

    // Open the modal
    setButton.addEventListener('click', () => {
        dueDateModal.style.display = 'block';
    });

    // Save the date
    saveDateButton.addEventListener('click', () => {
        const dueDate = dueDateInput.value;
        if (dueDate) {
            localStorage.setItem('dueDate', dueDate);
        } else {
            localStorage.removeItem('dueDate');
        }
        Swal.fire({
            title: 'Success!',
            text: 'Due date saved!',
            icon: 'success',
            timer: 1000, // 1 second
            showConfirmButton: false // Remove the OK button
        })
        dueDateModal.style.display = 'none';
    });

    // Reset the due date
    resetModalButton.addEventListener('click', () => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This will reset the due date and cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, reset it!',
            cancelButtonText: 'No, keep it',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                // Clear the due date from localStorage
                localStorage.removeItem('dueDate');
                // Clear the due date input field
                dueDateInput.value = '';
                Swal.fire({
                    title: 'Reset!',
                    text: 'Due date has been reset.',
                    icon: 'success',
                    timer: 1000, // 1 second
                    showConfirmButton: false // Remove the OK button
                }).then(() => {
                    dueDateModal.style.display = 'none';
                });
            }
        });
    });

        // Close the modal when clicking outside of it
        window.addEventListener('click', (event) => {
            if (event.target === dueDateModal) {
                dueDateModal.style.display = 'none';
            }
        });

    let detailId = '1'; // Define detailId with an appropriate initial value

    // Function to update invoice details
    function updateInvoiceDetails() {
        // Collect data from inputs
        const firstPenaltyInput = document.getElementById('firstPen');
        const secondPenaltyInput = document.getElementById('secondPen');
        const gcashInfInput = document.getElementById('gcashInf');
        const gcashFeeInput = document.getElementById('gcashFee');
    
        const firstPenalty = firstPenaltyInput.value;
        const secondPenalty = secondPenaltyInput.value;
        const gcashInf = gcashInfInput.value;
        const gcashFee = gcashFeeInput.value;
        const dueDate = dueDateInput.value;
    
        if (firstPenalty && secondPenalty && gcashInf && gcashFee) {
            const requestBody = `detailId=${detailId}&firstPenalty=${firstPenalty}&secondPenalty=${secondPenalty}&gcashInf=${gcashInf}&gcashFee=${gcashFee}`;
    
            fetch('./php/update_invoice.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: requestBody
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Invoice updated and due date saved!',
                        icon: 'success',
                        timer: 2000, // 2 seconds
                        showConfirmButton: false
                    }).then(() => {
                        dueDateModal.style.display = 'none';
                    });
                } else {
                    Swal.fire({
                        title: 'Error!',
                        text: 'Failed to update invoice.',
                        icon: 'error',
                        timer: 2000, // 2 seconds
                        showConfirmButton: false
                    });
                }
            })
            .catch(error => {
                Swal.fire({
                    title: 'Error!',
                    text: 'An error occurred while updating.',
                    icon: 'error',
                    timer: 2000, // 2 seconds
                    showConfirmButton: false
                });
                console.error('Error:', error);
            });
        } else {
            Swal.fire({
                title: 'Error!',
                text: 'Please fill all fields.',
                icon: 'error',
                timer: 2000, // 2 seconds
                showConfirmButton: false
            });
        }
    }
    

    // Add event listener for the save button to update details
    saveDateButton.addEventListener('click', () => {
        updateInvoiceDetails(); // Call update function
    });
});





document.getElementById('setButton').addEventListener('click', function() {
    const detailId = 1; // Replace with the actual detailId, you may want to get it dynamically

    fetch('./php/fetch_invoice_data.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'detailId=' + detailId
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error fetching data:', data.error);
        } else {
            // Populate the fields with the fetched data
            document.getElementById('firstPen').value = data.firstPenalty || '';
            document.getElementById('secondPen').value = data.secondPenalty || '';
            document.getElementById('gcashInf').value = data.gcashNum || '';
            document.getElementById('gcashFee').value = data.gcashFee || '';
        }
    })
    .catch(error => console.error('Error:', error));

    // Display the modal
    document.getElementById('invDateModal').style.display = 'block';
});


