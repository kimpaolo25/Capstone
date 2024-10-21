function openAndPrintInvoice(data) {
    // Create a new iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
        
        // Fetch invoice details
        fetch('./php/fetctInvoiceToPrint.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(dataFromDb => {
                // Initialize variables from fetched data
                const gcashInf = dataFromDb.gcashNum || '';
                const gcashFee = dataFromDb.gcashFee || '';
                const firstPen = dataFromDb.firstPenalty || '';
                const secondPen = dataFromDb.secondPenalty || '';
    
                let cutoffDate;
                const savedDueDate = localStorage.getItem('dueDate');
    
                if (savedDueDate) {
                    cutoffDate = formatDatemDy(savedDueDate); // Use saved due date if it exists
                } else {
                    cutoffDate = calculateCutOff(data.date); // Fall back to coded function
                }
    
                // Calculate due date
                const dueDate = calculateDueDate(data.date); // Calculate the due date using the bill date
    
                // Define the content of the invoice
                const invoiceContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Billing Invoice</title>
                    <link rel="stylesheet" href="./css/invoice.css">
                    <link rel="stylesheet" href="./css/editInvoice.css">
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
                </head>
                <body>
                    <table class="main-table">
                        <tr>
                            <td colspan="2" class="header">
                                <h2 contenteditable="false">PANSOL RURAL WATERWORKS ASSOCIATION INC.</h2>
                                <p contenteditable="false">Pansol, Padre Garcia, Batangas</p>
                                <p contenteditable="false">Tel. No.: (043) 515-8533 / CEL. No.: 09084088762</p>
                                <p contenteditable="false">GCASH NO. ${gcashInf} WITH ${gcashFee} service fee</p>
                                <h3 contenteditable="false">BABALA</h3>
                                <h3 contenteditable="false">COLLECTION/DISCONNECTION NOTICE</h3>
                            </td>
                        </tr>
                        <tr>
                            <td class="content">
                                <p contenteditable="false"><strong>${data.name}</strong><br>Pansol, Padre Garcia, Batangas</p>
                                <p contenteditable="false">Ipinagbibigay-alam po namin sa inyo na sa darating na <strong>${cutoffDate}</strong> ay magkakaroon po ulit tayo ng <strong>disconnection o pamumutol</strong> para sa mga hindi nakabayad ng utang sa ating patubig. Mula ika-21-25 ng buwan may penalty na po tayo na ₱${firstPen} at mula 26-31 ay tuluyan ng tatanggalin ang serbisyo ng patubig at may reconnection na po na ₱${secondPen}.</p>
                                <p contenteditable="false">Ang inyo pong pagkakautang na dapat mabayaran ay nagkakahalaga ng <strong>${data.amount}</strong> para sa buwan/ mga buwan ng <strong>${formatDate(data.date)}</strong>.</p>
                                <p contenteditable="false">Ang inyo pong pagwawalang bahala sa paalalang ito ay magiging dahilan upang kayo ay alisan ng serbisyo ng tubig may tao man o wala sa inyong tahanan.</p>
                                <p class="warning" contenteditable="false"><strong>IPAGPAPAWALANG-BAHALA NA LAMANG PO ANG PAALALANG ITO KUNG KAYO AY NAKABAYAD NA.</strong></p>
                                <p contenteditable="false">Lubos na gumagalang,<br><strong>Pamunuan ng Patubig</strong></p>
                            </td>
                            <td class="invoice">
                                <table class="invoice-table">
                                    <tr>
                                        <th colspan="2">BILLING INVOICE</th>
                                    </tr>
                                    <tr>
                                        <td>Name:</td>
                                        <td contenteditable="false"><strong>${data.name}</strong></td>
                                    </tr>
                                    <tr>
                                        <td>Bill Month:</td>
                                        <td contenteditable="false"><strong>${formatDate(data.date)}</strong></td>
                                    </tr>
                                    <tr>
                                        <td>Due Date:</td>
                                        <td contenteditable="false"><strong>${dueDate}</strong></td>
                                    </tr>
                                    <tr>
                                        <th colspan="2">READING</th>
                                    </tr>
                                    <tr>
                                        <td>Present:</td>
                                        <td contenteditable="false"><strong>${data.current}</strong></td>
                                    </tr>
                                    <tr>
                                        <td>Previous:</td>
                                        <td contenteditable="false"><strong>${data.previous}</strong></td>
                                    </tr>
                                    <tr>
                                        <td>C.U.M:</td>
                                        <td contenteditable="false"><strong>${data.cuM}</strong></td>
                                    </tr>
                                    <tr>
                                        <th colspan="2" class="total-bill">Total Bill:</th>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td contenteditable="false"><strong>${data.amount}</strong></td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
    
    
                    <br></br>
                    <br></br>
                    <br></br>
                    <table class="main-table">
                        <tr>
                            <td colspan="2" class="header">
                                <h2 contenteditable="false">PANSOL RURAL WATERWORKS ASSOCIATION INC.</h2>
                                <p contenteditable="false">Pansol, Padre Garcia, Batangas</p>
                                <p contenteditable="false">Tel. No.: (043) 515-8533 / CEL. No.: 09084088762</p>
                                <p contenteditable="false">GCASH NO. ${gcashInf} WITH ${gcashFee} service fee</p>
                                <h3 contenteditable="false">BABALA</h3>
                                <h3 contenteditable="false">COLLECTION/DISCONNECTION NOTICE</h3>
                            </td>
                        </tr>
                        <tr>
                            <td class="content">
                                <p contenteditable="false"><strong>${data.name}</strong><br>Pansol, Padre Garcia, Batangas</p>
                                <p contenteditable="false">Ipinagbibigay-alam po namin sa inyo na sa darating na <strong>${cutoffDate}</strong> ay magkakaroon po ulit tayo ng <strong>disconnection o pamumutol</strong> para sa mga hindi nakabayad ng utang sa ating patubig. Mula ika-21-25 ng buwan may penalty na po tayo na ₱${firstPen} at mula 26-31 ay tuluyan ng tatanggalin ang serbisyo ng patubig at may reconnection na po na ₱${secondPen}.</p>
                                <p contenteditable="false">Ang inyo pong pagkakautang na dapat mabayaran ay nagkakahalaga ng <strong>${data.amount}</strong> para sa buwan/ mga buwan ng <strong>${formatDate(data.date)}</strong>.</p>
                                <p contenteditable="false">Ang inyo pong pagwawalang bahala sa paalalang ito ay magiging dahilan upang kayo ay alisan ng serbisyo ng tubig may tao man o wala sa inyong tahanan.</p>
                                <p class="warning" contenteditable="false"><strong>IPAGPAPAWALANG-BAHALA NA LAMANG PO ANG PAALALANG ITO KUNG KAYO AY NAKABAYAD NA.</strong></p>
                                <p contenteditable="false">Lubos na gumagalang,<br><strong>Pamunuan ng Patubig</strong></p>
                            </td>
                            <td class="invoice">
                                <table class="invoice-table">
                                    <tr>
                                        <th colspan="2">BILLING INVOICE</th>
                                    </tr>
                                    <tr>
                                        <td>Name:</td>
                                        <td contenteditable="false"><strong>${data.name}</strong></td>
                                    </tr>
                                    <tr>
                                        <td>Bill Month:</td>
                                        <td contenteditable="false"><strong>${formatDate(data.date)}</strong></td>
                                    </tr>
                                    <tr>
                                        <td>Due Date:</td>
                                        <td contenteditable="false"><strong>${dueDate}</strong></td>
                                    </tr>
                                    <tr>
                                        <th colspan="2">READING</th>
                                    </tr>
                                    <tr>
                                        <td>Present:</td>
                                        <td contenteditable="false"><strong>${data.current}</strong></td>
                                    </tr>
                                    <tr>
                                        <td>Previous:</td>
                                        <td contenteditable="false"><strong>${data.previous}</strong></td>
                                    </tr>
                                    <tr>
                                        <td>C.U.M:</td>
                                        <td contenteditable="false"><strong>${data.cuM}</strong></td>
                                    </tr>
                                    <tr>
                                        <th colspan="2" class="total-bill">Total Bill:</th>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td contenteditable="false"><strong>${data.amount}</strong></td>
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
    
    
            })
            .catch(error => {
                console.error('Error fetching invoice details:', error);
            });
        
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
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear();
            return `${month}-${day}-${year}`;
        }
    
        // Function to format the date in 'YYYY-Month' format
        function formatDate(dateString) {
            const options = { year: 'numeric', month: 'long' };
            return new Date(dateString).toLocaleDateString('en-US', options);
        }
    }
    