document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('dataTable'); // Ensure this ID matches your table


    table.addEventListener('click', function(event) {
        const target = event.target;
        const id = target.getAttribute('data-id'); // Use getAttribute to retrieve data-id

        console.log("Clicked button ID:", id); // Debug log

        if (target.classList.contains('delete-btn')) {
            handleDelete(id);
        }
    });


function handleDelete(id) {
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
                    Swal.fire({
                        title:'Deleted!',
                        text:'Your record has been deleted.',
                        icon:'success',
                        showConfirmButton: false,
                        timer: 1500  
                });
                    // Remove the row from the table
                    const row = document.querySelector(`button.delete-btn[data-id="${id}"]`).closest('tr');
                    row.remove();
                } else {
                    Swal.fire(
                        'Error!',
                        data.message || 'There was a problem deleting the record.',
                        'error'
                    );
                }
            })
            .catch(error => Swal.fire(
                'Error!',
                'An error occurred while deleting the record.',
                'error'
            ));
        }
    });
}
})