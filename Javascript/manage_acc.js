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
                window.location.href = '../Capstone/php/logout.php';
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
    var checkbox = document.getElementById("addChk");


    function resetPassword() {
        checkbox.checked = false; // Uncheck the "Show Password" checkbox
        document.getElementById('modalAddConfirmpass').type = "password"; // Reset password field to hidden
        document.getElementById('modalPass').type = "password"; // Reset password field to hidden
        document.getElementById('modalCurrentpass').type = "password"; // Reset password field to hidden
        document.getElementById('modalNewpass').type = "password"; // Reset password field to hidden
        document.getElementById('modalConfirmpass').type = "password"; // Reset password field to hidden
    }

    // Function to open the Add Account modal
    addButton.addEventListener("click", function() {
        addModal.style.display = "flex"; // Show the add modal
        resetPassword() 
        document.getElementById("modalAddName").value = "";
        document.getElementById("modalAddUname").value = "";
        document.getElementById("modalPass").value = "";
        document.getElementById("modalAddConfirmpass").value = "";
        document.getElementById("userLevel").value = "";
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
                idCell.style.display = "none"; // Hide the ID column

                let nameCell = document.createElement('td');
                nameCell.textContent = user.name;

                let usernameCell = document.createElement('td');
                usernameCell.textContent = user.username;

                let actionCell = document.createElement('td');

                // Modify Button
                let modifyButton = document.createElement('button');
                modifyButton.textContent = "Modify";
                modifyButton.classList.add('modify-btn');
                modifyButton.setAttribute('data-id', user.id);

                // Add event listener to modify button to open modal
                modifyButton.addEventListener('click', function() {
                    openUpdateModal(user.id); // Call function to open modal with user ID
                });

                // Delete Button
                let deleteButton = document.createElement('button');
                deleteButton.textContent = "Delete";
                deleteButton.classList.add('delete-btn');
                deleteButton.setAttribute('data-id', user.id);

                // Add event listener to delete button
                deleteButton.addEventListener('click', function() {
                    deleteUser(user.id); // Call function to delete user
                });

                actionCell.appendChild(modifyButton);
                actionCell.appendChild(deleteButton); // Append delete button to action cell

                // Append cells to row
                row.appendChild(idCell);
                row.appendChild(nameCell);
                row.appendChild(usernameCell);
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
    var checkbox = document.getElementById("chk");

        // Function to reset the form and uncheck the checkbox
        function resetPassword() {
            checkbox.checked = false; // Uncheck the "Show Password" checkbox
            document.getElementById('modalAddConfirmpass').type = "password"; // Reset password field to hidden
            document.getElementById('modalPass').type = "password"; // Reset password field to hidden
            document.getElementById('modalCurrentpass').type = "password"; // Reset password field to hidden
            document.getElementById('modalNewpass').type = "password"; // Reset password field to hidden
            document.getElementById('modalConfirmpass').type = "password"; // Reset password field to hidden
        }

    xhr.onload = function() {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response) {
                // Set the user_level value in the dropdown
                if (response.user_level == 1) {
                    document.getElementById("modalUserLevel").value = "Admin"; // Set to "Admin"
                } else if (response.user_level == 2) {
                    document.getElementById("modalUserLevel").value = "Staff"; // Set to "Staff"
                }
    
                // Populate other modal fields with data
                document.getElementById("modalName").value = response.name;
                document.getElementById("modalCurrentuname").value = response.username;
    
                // Clear password fields
                resetPassword()
                document.getElementById("modalUname").value = "";
                document.getElementById("modalCurrentpass").value = "";
                document.getElementById("modalNewpass").value = "";
                document.getElementById("modalConfirmpass").value = "";
                
    
                // Show the modal
                updateModal.style.display = "flex"; // Show update modal
            }
        } else {
            console.error("Error fetching data:", xhr.status, xhr.statusText);
        }
    };
    
    xhr.send("id=" + id);
}    

// Function to delete a user
function deleteUser(userId) {
    // Fetch user details to check user level
    fetch(`./php/getUser.php?id=${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.user_level === 1) {
                Swal.fire({
                    title: 'Restricted!',
                    text: 'Deleting admin account is prohibited!    ',
                    icon: 'warning',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                });
                return; // Stop further execution
            }

            // Show confirmation prompt if user level is not 1
            Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Perform the delete request
                    fetch('./php/deleteUser.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({ id: userId }) // Send user ID
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire('Deleted!', 'User has been deleted.', 'success');
                            fetchUserData(); // Refresh user data
                        } else {
                            Swal.fire('Error!', data.message, 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        Swal.fire('Error!', 'An error occurred: ' + error.message, 'error');
                    });
                }
            });
        })
        .catch(error => {
            console.error('Error fetching user details:', error);
            Swal.fire('Error!', 'Could not retrieve user details.', 'error');
        });
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




