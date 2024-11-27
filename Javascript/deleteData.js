document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('dataTable'); // Ensure this ID matches your table

    table.addEventListener('click', function(event) {
        const target = event.target;
        
        // Check if the clicked target is a delete button
        if (target.classList.contains('delete-btn')) {
            const id = target.getAttribute('data-id'); // Use getAttribute to retrieve data-id
            const row = target.closest('tr'); // Get the row of the clicked button
            const cells = row.cells; // Get the cells of the row
            const recordName = cells[1].textContent.trim(); // Fetch the text content of the second cell (index 1)

            console.log("Clicked button ID:", id); // Debug log
            console.log("Record Name:", recordName); // Debug log to see the fetched name

            handleDelete(id, recordName);
        }
    });

    function handleDelete(id, recordName) {
        console.log("Attempting to delete record with ID:", id); // Debug log

        if (!id) {
            Swal.fire(
                'Error!',
                'Invalid record ID.',
                'error'
            );
            return;
        }

        Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                // First, delete the bill
                fetch('./php/deleteBill.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({ id: id }) // Ensure ID is correctly passed
                })
                .then(response => response.json())
                .then(data => {
                    console.log("Response from server:", data); // Debug log
                    if (data.success) {
                        // If bill deletion is successful, log the action
                        return fetch('./php/logs.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            body: new URLSearchParams({
                                action: 'deleted',
                                recordAffected: recordName
                            })
                        })
                        .then(logResponse => logResponse.json())
                        .then(logData => {
                            if (!logData.success) {
                                console.warn('Logging failed, but bill was deleted successfully');
                            }
                            return data;
                        });
                    } else {
                        throw new Error(data.message || 'Failed to delete bill');
                    }
                })
                .then(() => {
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'Your record has been deleted.',
                        icon: 'success',
                        showConfirmButton: false,
                        timer: 1500  
                    }).then(() => {
                        fetchDataAndReloadTable();
                    });
                    // Remove the row from the table
                    const row = document.querySelector(`button.delete-btn[data-id="${id}"]`).closest('tr');
                    row.remove();
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire(
                        'Error!',
                        'An error occurred while deleting the record.',
                        'error'
                    );
                });
            }
        });
    }
});