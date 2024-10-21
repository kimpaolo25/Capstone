document.getElementById('PrintAll').addEventListener('click', function() { 
    openAndPrintInvoicesForCurrentMonth();
});

function openAndPrintInvoicesForCurrentMonth() {
    fetch('./php/printAll.php')
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
                allInvoicesContent += createInvoiceHTML(combinedData);
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
                    iframe.contentWindow.print();
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
