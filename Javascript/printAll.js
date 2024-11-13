document.getElementById('submitPrint').addEventListener('click', function() { 
    openAndPrintInvoicesForSelectedDateAndArea();
});

// Function to fetch the available date options and display the print modal
function fetchAvailableDates() {
    fetch('./php/printAll.php')  // The PHP script will return available dates
        .then(response => response.json())
        .then(dataFromDb => {
            if (dataFromDb.dates && dataFromDb.dates.length > 0) {
                const dateDropdown = document.getElementById('printDate');
                dataFromDb.dates.forEach(date => {
                    const option = document.createElement('option');
                    option.value = date.Date_column;
                    option.textContent = date.Date_column;  // Assuming dates are in 'YYYY-MMM' format like '2020-Jan'
                    dateDropdown.appendChild(option);
                });
            } else {
                console.error('No dates found in the database.');
            }
        })
        .catch(error => {
            console.error('Error fetching dates:', error);
        });
}

// Call to load available dates when the modal is shown
fetchAvailableDates();

// Function to print invoices based on selected date and area
function openAndPrintInvoicesForSelectedDateAndArea() {
    // Get selected date and area values
    const selectedDate = document.getElementById('printDate').value; // Get the selected date from the dropdown
    const selectedArea = document.getElementById('printArea').value; // Get the selected area from the dropdown
    
    // Ensure that both fields have values
    if (!selectedDate || !selectedArea) {
        Swal.fire({
            title: 'Missing Information',
            text: 'Please select both a date and an area.',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        return;
    }

    // Construct the URL with query parameters for date and area
    const url = `./php/printAll.php?date=${encodeURIComponent(selectedDate)}&area=${encodeURIComponent(selectedArea)}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(dataFromDb => {
            if (dataFromDb.error) {
                console.error(dataFromDb.error);
                return;
            }

            const invoiceDetails = dataFromDb.invoice;
            const customers = dataFromDb.customers;

            if (!customers.length) {
                // Show SweetAlert if no customers found
                Swal.fire({
                    title: 'No Invoices',
                    text: 'No invoices found for this month.',
                    icon: 'warning',
                    confirmButtonText: 'OK'
                });
                return;
            }

            // Create a single iframe to hold all invoices
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            document.body.appendChild(iframe);

            // Build the invoice content
            let allInvoicesContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link rel="stylesheet" href="./css/invoice.css">
                    <link rel="stylesheet" href="./css/editInvoice.css">
                </head>
                <body>
            `;

            customers.forEach(customer => {
                const combinedData = { ...customer, ...invoiceDetails };
                allInvoicesContent += createInvoiceHTML(combinedData); // Assuming createInvoiceHTML is a function to generate the invoice HTML
            });

            allInvoicesContent += `
                </body>
                </html>
            `;

            // Write all invoices content to the iframe
            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(allInvoicesContent);
            iframe.contentWindow.document.close();
            
            iframe.onload = function() {
                setTimeout(() => {
                    iframe.contentWindow.print(); // Trigger the print dialog
                }, 500);
            };
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}


function createInvoiceHTML(data) {
    const gcashInf = data.gcashNum || '';
    const gcashFee = data.gcashFee || '';
    const firstPen = data.firstPenalty || '';
    const secondPen = data.secondPenalty || '';

    let cutoffDate;
    const savedDueDate = localStorage.getItem('dueDate');

    if (savedDueDate) {
        cutoffDate = formatDatemDy(savedDueDate);
    } else {
        cutoffDate = calculateCutOff(data.Date_column);
    }

    const dueDate = calculateDueDate(data.Date_column);

    return `
        <div style="margin-bottom: 40px; page-break-inside: avoid;">
            <table class="main-table">
                <tr>
                    <td colspan="2" class="header">
                        <h2>PANSOL RURAL WATERWORKS ASSOCIATION INC.</h2>
                        <p>Pansol, Padre Garcia, Batangas</p>
                        <p>Tel. No.: (043) 515-8533 / CEL. No.: 09084088762</p>
                        <p>GCASH NO. ${gcashInf} WITH ${gcashFee} service fee</p>
                        <h3>BABALA</h3>
                        <h3>COLLECTION/DISCONNECTION NOTICE</h3>
                    </td>
                </tr>
                <tr>
                    <td class="content">
                        <p><strong>${data.Name}</strong><br>Pansol, Padre Garcia, Batangas</p>
                        <p>Ipinagbibigay-alam po namin sa inyo na sa darating na <strong>${cutoffDate}</strong> ay magkakaroon po ulit tayo ng <strong>disconnection o pamumutol</strong> para sa mga hindi nakabayad ng utang sa ating patubig. Mula ika-21-25 ng buwan may penalty na po tayo na ₱${firstPen} at mula 26-31 ay tuluyan ng tatanggalin ang serbisyo ng patubig at may reconnection na po na ₱${secondPen}.</p>
                        <p>Ang inyo pong pagkakautang na dapat mabayaran ay nagkakahalaga ng <strong>${data.Amount}</strong> para sa buwan/ mga buwan ng <strong>${formatDate(data.Date_column)}</strong>.</p>
                        <p>Ang inyo pong pagwawalang bahala sa paalalang ito ay magiging dahilan upang kayo ay alisan ng serbisyo ng tubig may tao man o wala sa inyong tahanan.</p>
                        <p class="warning"><strong>IPAGPAPAWALANG-BAHALA NA LAMANG PO ANG PAALALANG ITO KUNG KAYO AY NAKABAYAD NA.</strong></p>
                        <p>Lubos na gumagalang,<br><strong>Pamunuan ng Patubig</strong></p>
                    </td>
                    <td class="invoice">
                        <table class="invoice-table">
                            <tr>
                                <th colspan="2">BILLING INVOICE</th>
                            </tr>
                            <tr>
                                <td>Name:</td>
                                <td><strong>${data.Name}</strong></td>
                            </tr>
                            <tr>
                                <td>Bill Month:</td>
                                <td><strong>${formatDate(data.Date_column)}</strong></td>
                            </tr>
                            <tr>
                                <td>Due Date:</td>
                                <td><strong>${dueDate}</strong></td>
                            </tr>
                            <tr>
                                <th colspan="2">READING</th>
                            </tr>
                            <tr>
                                <td>Present:</td>
                                <td><strong>${data.Present}</strong></td>
                            </tr>
                            <tr>
                                <td>Previous:</td>
                                <td><strong>${data.Previous}</strong></td>
                            </tr>
                            <tr>
                                <td>C.U.M:</td>
                                <td><strong>${data.CU_M}</strong></td>
                            </tr>
                            <tr>
                                <th colspan="2" class="total-bill">Total Bill:</th>
                            </tr>
                            <tr>
                                <td></td>
                                <td><strong>${data.Amount}</strong></td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            <br></br>
            <br></br>
            <table class="main-table">
                <tr>
                    <td colspan="2" class="header">
                        <h2>PANSOL RURAL WATERWORKS ASSOCIATION INC.</h2>
                        <p>Pansol, Padre Garcia, Batangas</p>
                        <p>Tel. No.: (043) 515-8533 / CEL. No.: 09084088762</p>
                        <p>GCASH NO. ${gcashInf} WITH ${gcashFee} service fee</p>
                        <h3>BABALA</h3>
                        <h3>COLLECTION/DISCONNECTION NOTICE</h3>
                    </td>
                </tr>
                <tr>
                    <td class="content">
                        <p><strong>${data.Name}</strong><br>Pansol, Padre Garcia, Batangas</p>
                        <p>Ipinagbibigay-alam po namin sa inyo na sa darating na <strong>${cutoffDate}</strong> ay magkakaroon po ulit tayo ng <strong>disconnection o pamumutol</strong> para sa mga hindi nakabayad ng utang sa ating patubig. Mula ika-21-25 ng buwan may penalty na po tayo na ₱${firstPen} at mula 26-31 ay tuluyan ng tatanggalin ang serbisyo ng patubig at may reconnection na po na ₱${secondPen}.</p>
                        <p>Ang inyo pong pagkakautang na dapat mabayaran ay nagkakahalaga ng <strong>${data.Amount}</strong> para sa buwan/ mga buwan ng <strong>${formatDate(data.Date_column)}</strong>.</p>
                        <p>Ang inyo pong pagwawalang bahala sa paalalang ito ay magiging dahilan upang kayo ay alisan ng serbisyo ng tubig may tao man o wala sa inyong tahanan.</p>
                        <p class="warning"><strong>IPAGPAPAWALANG-BAHALA NA LAMANG PO ANG PAALALANG ITO KUNG KAYO AY NAKABAYAD NA.</strong></p>
                        <p>Lubos na gumagalang,<br><strong>Pamunuan ng Patubig</strong></p>
                    </td>
                    <td class="invoice">
                        <table class="invoice-table">
                            <tr>
                                <th colspan="2">BILLING INVOICE</th>
                            </tr>
                            <tr>
                                <td>Name:</td>
                                <td><strong>${data.Name}</strong></td>
                            </tr>
                            <tr>
                                <td>Bill Month:</td>
                                <td><strong>${formatDate(data.Date_column)}</strong></td>
                            </tr>
                            <tr>
                                <td>Due Date:</td>
                                <td><strong>${dueDate}</strong></td>
                            </tr>
                            <tr>
                                <th colspan="2">READING</th>
                            </tr>
                            <tr>
                                <td>Present:</td>
                                <td><strong>${data.Present}</strong></td>
                            </tr>
                            <tr>
                                <td>Previous:</td>
                                <td><strong>${data.Previous}</strong></td>
                            </tr>
                            <tr>
                                <td>C.U.M:</td>
                                <td><strong>${data.CU_M}</strong></td>
                            </tr>
                            <tr>
                                <th colspan="2" class="total-bill">Total Bill:</th>
                            </tr>
                            <tr>
                                <td></td>
                                <td><strong>${data.Amount}</strong></td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
    `;
}

// Function to calculate the due date (15th of the next month)
function calculateDueDate(billDate) {
    const bill = new Date(billDate);
    let dueMonth = bill.getMonth() + 1;
    let dueYear = bill.getFullYear();

    if (dueMonth > 11) {
        dueMonth = 0;
        dueYear += 1;
    }

    const dueDate = new Date(dueYear, dueMonth, 15);
    return dueDate.toLocaleDateString('en-US');
}

// Function to calculate the cutoff date (21st of the next month)
function calculateCutOff(billDate) {
    const bill = new Date(billDate);
    let cutMonth = bill.getMonth() + 1;
    let cutYear = bill.getFullYear();

    if (cutMonth > 11) {
        cutMonth = 0;
        cutYear += 1;
    }

    const cutDate = new Date(cutYear, cutMonth, 21);
    return cutDate.toLocaleDateString('en-US');
}

// Function to format the date in 'MM-DD-YYYY' format
function formatDatemDy(dateString) {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
}

// Function to format the date in 'YYYY-Month' format
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

document.addEventListener('DOMContentLoaded', function () {
    fetch('./php/printAll.php')
        .then(response => response.json())
        .then(data => {
            const dateDropdown = document.getElementById('printDate');

            // Clear existing options except for the default one
            dateDropdown.innerHTML = '<option value="">Select Date</option>';

            if (data.dates && data.dates.length > 0) {
                data.dates.forEach(date => {
                    if (date && /^[0-9]{4}-[A-Za-z]{3}$/.test(date.trim())) {  // Check date format
                        const option = document.createElement('option');
                        option.value = date.trim();
                        option.textContent = date.trim();
                        dateDropdown.appendChild(option);
                    }
                });
            } else {
                console.log('No dates found');
            }
        })
        .catch(error => console.error('Error fetching dates:', error));
});








