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

                    // Show success message, print invoice, and reload table
                    Swal.fire({
                        icon: 'success',
                        title: 'Entry added successfully!',
                        showConfirmButton: false,
                        timer: 1500
                    }).then(() => {
                        window.location.reload();
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

            // Close the modal and reset the form
            modal.style.display = 'none';
            form.reset();
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
    autoFillFields(name);
});