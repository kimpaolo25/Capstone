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
const initialAmountInput = document.getElementById('initialAmount'); // Assuming the input has an id 'initialAmount'

// Function to set the date input to today's date
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    form.date.value = today; // Set the value of the date input
}

// Function to fetch the latest amount from the database
function fetchLatestAmount() {
    fetch('./php/fetch_latest_bill.php')
        .then(response => response.json())
        .then(data => {
            initialAmountInput.value = data.Initial || 0; // Auto-fill initialAmount based on the latest record
        })
        .catch(error => {
            console.error('Error fetching the latest amount:', error);
        });
}

// Update the modal display logic to include auto-fill functionality
addButton.addEventListener('click', function () {
    form.reset(); // Clear the form
    setTodayDate(); // Set the date to today's date
    fetchLatestAmount(); // Fetch and set the latest amount
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

// Event listener for the print button inside the data table
document.querySelector('#dataTable').addEventListener('click', function (event) {
    if (event.target.classList.contains('print-btn')) {
        const row = event.target.closest('tr');

        // Ensure the row is valid and contains data
        if (row) {
            const cells = row.children;

            const newRowData = {
                name: cells[1] ? cells[1].textContent.trim() : 'N/A',
                area: cells[2] ? cells[2].textContent.trim() : 'N/A',
                current: cells[3] ? cells[3].textContent.trim() : '0',
                previous: cells[4] ? cells[4].textContent.trim() : '0',
                date: cells[5] ? cells[5].textContent.trim() : 'N/A',
                initialAmount: cells[6] ? cells[6].textContent.trim() : '0',
                cuM: cells[7] ? cells[7].textContent.trim() : '0',
                amount: cells[8] ? cells[8].textContent.trim() : '0'
            };

            // Debugging: Log the data to be printed
            console.log('Row Data:', newRowData);

            // Call the function to print the invoice
            openAndPrintInvoice(newRowData);
        }
    }
});





document.addEventListener("DOMContentLoaded", function() {
    var modal = document.getElementById("printModal");
    var printAllButton = document.getElementById("PrintAll");
    var closeButton = document.querySelector(".close-button");
    var submitButton = document.getElementById("submitPrint");

    // Show modal when "Print All" button is clicked
    printAllButton.onclick = function() {
        modal.style.display = "flex";
    }

    // Hide modal when close button is clicked
    closeButton.onclick = function() {
        modal.style.display = "none";
    }

    // Hide modal when clicking outside of the modal content
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Handle submit button click
    submitButton.onclick = function() {
        var date = document.getElementById("printDate").value;
        var area = document.getElementById("areaSelect").value;

        if (date && area) {
            alert("Date: " + date + "\nArea: " + area);
            modal.style.display = "none"; // Close modal after submission
        } else {
            alert("Please select both date and area.");
        }
    }
});

