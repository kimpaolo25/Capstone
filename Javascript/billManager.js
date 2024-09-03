// Data structure to store table data
let tableData = [];

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

// Variable to store the current row being edited
let currentRowIndex = null;

// Function to initialize table data and populate it
function initializeTableData() {
    const rows = document.querySelectorAll('#dataTable tbody tr');
    tableData = Array.from(rows).map(row => {
        const cells = row.getElementsByTagName('td');
        return {
            name: cells[0].textContent,
            area: cells[1].textContent,
            current: cells[2].textContent,
            previous: cells[3].textContent,
            date: cells[4].textContent,
            initialAmount: cells[5].textContent,
            cuM: cells[6].textContent,
            amount: cells[7].textContent
        };
    });
}

// Function to reload table data
function reloadTable() {
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    tableData.forEach((row, index) => {
        const newRow = tableBody.insertRow();
        Object.values(row).forEach(value => {
            const cell = newRow.insertCell();
            cell.textContent = value;
        });

        // Add action buttons
        const actionCell = newRow.insertCell();
        actionCell.innerHTML = `
            <button class="update-btn">Update</button>
            <button class="delete-btn">Delete</button>
        `;
    });
}

// Function to auto-fill the form fields based on the latest record for the same name
function autoFillFields(name) {
    const latestRecord = tableData
        .filter(record => record.name === name)
        .pop(); // Get the most recent record for that name

    if (latestRecord) {
        form.area.value = latestRecord.area;
        form.previous.value = latestRecord.current; // Previous should be filled with the current value of the latest record
    } else {
        form.area.value = '';
        form.previous.value = '';
    }
}



function openAndPrintInvoice(data) {
    
    // Create a new iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    // Ensure data.dueDate is defined and has a correct format
    function formatDate(dateString) {
        if (!dateString) {
            console.error('Date string is undefined or empty');
            return 'Invalid Date';
        }

        // Assuming dateString is in mm/dd/yyyy format
        const parts = dateString.split('/');
        if (parts.length !== 3) {
            console.error('Date string is not in mm/dd/yyyy format');
            return 'Invalid Date';
        }

        const [month, day, year] = parts;
        return `${month}/${day}/${year}`;
    }

    // Debugging to check the data
    console.log('Invoice Data:', data);
    console.log('Formatted Due Date:', formatDate(data.dueDate));

    // Define the content of the invoice
    const invoiceContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Disconnection Notice</title>
        <link rel="stylesheet" href="./css/invoice.css">
    </head>
    <body>
        <table class="main-table">
            <tr>
                <td colspan="2" class="header">
                    <h2>PANSOL RURAL WATERWORKS ASSOCIATION INC.</h2>
                    <p>Pansol, Padre Garcia, Batangas</p>
                    <p>Tel. No.: (043) 515-8533 / CEL. No.: 09084088762</p>
                    <p>GCASH NO. 09464608562 AIZA D. WITH 10.00 service fee</p>
                    <h3>BABALA</h3>
                    <h3>COLLECTION/DISCONNECTION NOTICE</h3>
                </td>
            </tr>
            <tr>
                <td class="content">
                    <p><strong>${data.name}</strong><br>Pansol, Padre Garcia, Batangas</p>
                    <p>Ipinagbibigay-alam po namin sa inyo na sa darating na <strong>${data.billMonth}</strong> ay magkakaroon po ulit tayo ng <strong>disconnection o pamumutol</strong> para sa mga hindi nakabayad ng utang sa ating patubig. Mula ika-21-25 ng buwan may penalty na po tayo na 100.00 piso at mula 26-31 ay tuluyan ng tatanggalin ang serbisyo ng patubig at may reconnection na po na 500.00.</p>
                    <p>Ang inyo pong pagkakautang na dapat mabayaran ay nagkakahalaga ng <strong>${data.amount}</strong> para sa buwan/ mga buwan ng <strong>${data.date}</strong>.</p>
                    <p>Ang inyo pong pagwawalang bahala sa paalalang ito ay magiging dahilan upang kayo ay alisan ng serbisyo ng tubig may tao man o wala sa inyong tahanan.</p>
                    <p class="warning"><strong>IPAGPAPAWALANG-BAHALA NA LAMANG PO ANG PAALALANG ITO KUNG KAYO AY NAKABAYAD NA.</strong></p>
                    <p>Lubos na gumagalang,<br>Pamunuan ng Patubig</p>
                </td>
                <td class="invoice">
                    <table class="invoice-table">
                        <tr>
                            <th colspan="2">BILLING INVOICE</th>
                        </tr>
                        <tr>
                            <td>Name:</td>
                            <td><strong>${data.name}</strong></td>
                        </tr>
                        <tr>
                            <td>Bill Month:</td>
                            <td><strong>${data.date}</strong></td>
                        </tr>
                        <tr>
                            <td>Due Date:</td>
                            <td><strong>${formatDate(data.dueDate)}</strong></td>
                        </tr>
                        <tr>
                            <th colspan="2">READING</th>
                        </tr>
                        <tr>
                            <td>Present:</td>
                            <td><strong>${data.current}</strong></td>
                        </tr>
                        <tr>
                            <td>Previous:</td>
                            <td><strong>${data.previous}</strong></td>
                        </tr>
                        <tr>
                            <td>C.U.M:</td>
                            <td><strong>${data.cuM}</strong></td>
                        </tr>
                        <tr>
                            <th colspan="2" class="total-bill">Total Bill:</th>
                        </tr>
                        <tr>
                            <td></td>
                            <td><strong>${data.amount}</strong></td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    // Write content to the iframe
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(invoiceContent);
    iframe.contentWindow.document.close();

    // Print the document from the iframe
    iframe.onload = function() {
        setTimeout(() => {
            iframe.contentWindow.print();
            // Redirect after printing
        }, 500); // Delay to ensure content is fully loaded
    };

    // Redirect if the window is closed before printing starts
    iframe.onbeforeunload = function () {
        window.location.href = 'billManager.php';
    };
}






// Update the modal display logic to include auto-fill functionality
addButton.addEventListener('click', function () {
    form.reset(); // Clear the form
    currentRowIndex = null; // Reset currentRowIndex to null for adding a new entry
    modal.style.display = 'block';
});


// Function to set the date input to today's date
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    form.date.value = today; // Set the value of the date input
}

// Update the modal display logic to include auto-fill functionality
addButton.addEventListener('click', function () {
    form.reset(); // Clear the form
    setTodayDate(); // Set the date to today's date
    currentRowIndex = null; // Reset currentRowIndex to null for adding a new entry
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

// Auto-fill fields when the name input changes
form.name.addEventListener('input', function () {
    const name = this.value.trim();
    autoFillFields(name);
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

    if (currentRowIndex !== null) {
        // Prompt user to confirm update
        Swal.fire({
            title: 'Are you sure you want to update this entry?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, update it!',
            cancelButtonText: 'No, cancel',
            reverseButtons: true
        }).then(result => {
            if (result.isConfirmed) {
                // Update existing row
                tableData[currentRowIndex] = newRowData;
                reloadTable(); // Reload the table with updated data
                currentRowIndex = null; // Reset currentRowIndex

                // Show success message and print invoice
                Swal.fire({
                    icon: 'success',
                    title: 'Entry updated successfully!',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    openAndPrintInvoice(newRowData); // Open and print invoice after updating
                });
            }
        });
    } else {
        // Prompt user to confirm adding
        Swal.fire({
            title: 'Are you sure you want to add this entry?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, add it!',
            cancelButtonText: 'No, cancel',
            reverseButtons: true
        }).then(result => {
            if (result.isConfirmed) {
                // Add new row
                tableData.push(newRowData);
                reloadTable(); // Reload the table with new data

                // Show success message and print invoice
                Swal.fire({
                    icon: 'success',
                    title: 'Entry added successfully!',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    openAndPrintInvoice(newRowData); // Open and print invoice after adding
                });
            }
        });
    }

    // Close the modal and reset the form
    modal.style.display = 'none';
    form.reset();
});

// Optional: Implement update and delete button functionality
document.querySelector('#dataTable').addEventListener('click', function (event) {
    if (event.target.classList.contains('delete-btn')) {
        // Prompt user to confirm deletion
        Swal.fire({
            title: 'Are you sure you want to delete this entry?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel',
            reverseButtons: true
        }).then(result => {
            if (result.isConfirmed) {
                const rowIndex = Array.from(event.target.closest('tr').parentNode.children).indexOf(event.target.closest('tr'));
                tableData.splice(rowIndex, 1); // Remove from data source
                reloadTable(); // Reload the table with updated data

                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Entry deleted successfully!',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    } else if (event.target.classList.contains('update-btn')) {
        currentRowIndex = Array.from(event.target.closest('tr').parentNode.children).indexOf(event.target.closest('tr'));
        const rowData = tableData[currentRowIndex];

        // Populate form fields with selected row data
        form.name.value = rowData.name;
        form.area.value = rowData.area;
        form.current.value = rowData.current;
        form.previous.value = rowData.previous;
        form.date.value = rowData.date;
        form.initialAmount.value = rowData.initialAmount;
        form.cuM.value = rowData.cuM;
        form.amount.value = rowData.amount;

        modal.style.display = 'block'; // Show the modal
    }
});
