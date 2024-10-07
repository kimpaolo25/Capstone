// Add event listener to the exit button
document.getElementById('exitButton').addEventListener('click', function (event) {
    // Prevent the default action (navigation) to handle it manually
    event.preventDefault();

    // Show SweetAlert2 confirmation dialog
    Swal.fire({
        title: 'Are you sure you want to logout?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        reverseButtons: true
    }).then(result => {
        if (result.isConfirmed) {
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Logged out successfully!',
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                // Redirect to the logout.php page after the success message disappears
                window.location.href = '../php/logout.php';
            });
        }
    });
});

// Active state for dashboard button (if applicable)
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const dashButton = document.getElementById('dashButton');
    
    // Check if the current page is the dashboard
    if (currentPath.includes('admin')) {
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

document.addEventListener("DOMContentLoaded", function() {
    var addModal = document.getElementById("addModal");
    var updateModal = document.getElementById("updateModal");
    var addButton = document.getElementById("addButton");

    // Function to open the Add Account modal
    addButton.addEventListener("click", function() {
        addModal.style.display = "flex"; // Show the add modal
    });

    // Close modal when clicking outside the modal content for both modals
    window.onclick = function(event) {
        if (event.target === addModal) {
            closeModal(); // Close add modal on outside click
        } else if (event.target === updateModal) {
            closeModal(); // Close update modal on outside click
        }
    };

    // Fetch user data and populate the table
    fetchUserData(); // Call this directly when DOM is loaded
});

function closeModal() {
    addModal.style.display = "none"; // Hide the add modal
    updateModal.style.display = "none"; // Hide the update modal
}

// Fetch user data and populate the table
function fetchUserData() {
    fetch('./php/manage_acc.php')
        .then(response => response.json())
        .then(data => {
            let tableBody = document.querySelector("#dataTable tbody");
            tableBody.innerHTML = ''; // Clear any existing rows

            data.forEach(user => {
                let row = document.createElement('tr');

                // Create cells for id, name, username, and action
                let idCell = document.createElement('td');
                idCell.textContent = user.id;

                let nameCell = document.createElement('td');
                nameCell.textContent = user.name;

                let areaCell = document.createElement('td');
                areaCell.textContent = user.area;

                let statusCell = document.createElement('td');
                statusCell.textContent = user.status;

                let actionCell = document.createElement('td');

                // Modify Button
                let modifyButton = document.createElement('button');
                modifyButton.textContent = "Update";
                modifyButton.classList.add('modify-btn');
                modifyButton.setAttribute('data-id', user.id);

                // Add event listener to modify button to open modal
                modifyButton.addEventListener('click', function() {
                    openUpdateModal(user.id); // Call function to open modal with user ID
                });


                actionCell.appendChild(modifyButton);
               

                // Append cells to row
                row.appendChild(idCell);
                row.appendChild(nameCell);
                row.appendChild(areaCell);
                row.appendChild(statusCell);
                row.appendChild(actionCell);

                // Append row to table body
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Function to open update modal
function openUpdateModal(id) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "./php/fetchAllUser.php", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onload = function() {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response) {
                // Populate modal fields with data
                document.getElementById("modalUpdateName").value = response.name;
                document.getElementById("modalUpdateArea").value = response.name;
                document.getElementById("modalUserStats").value = "";
  

                // Show the modal
                updateModal.style.display = "flex"; // Show update modal
            }
        } else {
            console.error("Error fetching data:", xhr.status, xhr.statusText);
        }
    };

    xhr.send("id=" + id);
}




// Listen for form submission for adding a user
const addUserForm = document.getElementById('addUserForm');

if (addUserForm) { // Ensure the form exists before adding event listener
    addUserForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        // Get password and confirm password fields
        const password = document.getElementById('modalPass').value;
        const confirmPassword = document.getElementById('modalAddConfirmpass').value;

        // Check if password and confirm password match
        if (password !== confirmPassword) {
            Swal.fire('Error!', 'Passwords do not match.', 'error');
            return; // Stop form submission if passwords don't match
        }

        // Gather form data
        const formData = new FormData(addUserForm);

        // Send AJAX request to addUser.php
        fetch('./php/addUser.php', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire('Success!', data.message, 'success');
                fetchUserData(); // Refresh user data
                closeModal(); // Close the modal
                addUserForm.reset(); // Reset form fields
            } else {
                Swal.fire('Error!', data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire('Error!', 'An error occurred while adding the user: ' + error.message, 'error');
        });
    });
}


// Listen for form submission for updating a user
const updateForm = document.getElementById('updateUserForm'); // Ensure this ID matches

if (updateForm) { // Ensure the form exists before adding event listener
    updateForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // SweetAlert confirmation dialog
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to update this account?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, update it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                // Gather form data
                const formData = new FormData(updateForm);
                formData.append('action', 'update'); // Ensure the action is included

                // Send AJAX request to updateUser.php
                fetch('./php/updateUser.php', {
                    method: 'POST',
                    body: formData,
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire('Updated!', data.message, 'success');
                        fetchUserData(); // Refresh user data
                        closeModal(); // Close the modal
                    } else {
                        Swal.fire('Error!', data.message, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire('Error!', 'An error occurred while updating the user: ' + error.message, 'error');
                });
            }
        });
    });
};


