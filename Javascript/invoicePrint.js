function openAndPrintInvoice(data) {
    
    // Create a new iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    // Calculate the due date as the 15th of the next month
    function calculateDueDate() {
        const today = new Date();
        let dueMonth = today.getMonth() + 1; // Next month (0-11)
        let dueYear = today.getFullYear();

        // If the current month is December, set dueMonth to January of next year
        if (dueMonth > 11) {
            dueMonth = 0;
            dueYear += 1;
        }

        // Create the due date as the 15th of the next month
        const dueDate = new Date(dueYear, dueMonth, 15);
        return dueDate.toLocaleDateString('en-US'); // Format mm/dd/yyyy
    }

    // Calculate the due date as the 15th of the next month
    function calculateCutOff() {
        const today = new Date();
        let cutMonth = today.getMonth() + 1; // Next month (0-11)
        let cutYear = today.getFullYear();

        // If the current month is December, set dueMonth to January of next year
        if (cutMonth > 11) {
            cutMonth = 0;
            cutYear += 1;
        }

        // Create the due date as the 15th of the next month
        const cutDate = new Date(cutYear, cutMonth, 21);
        return cutDate.toLocaleDateString('en-US'); // Format mm/dd/yyyy
    }

     // Function to get the current date in mm/dd/yyyy format
function formatDate() {
    const today = new Date(); // Get the current date
    const month = today.getMonth() + 1; // getMonth() returns month index (0-11), so add 1
    const day = today.getDate(); // Get the day of the month (1-31)
    const year = today.getFullYear(); // Get the full year (e.g., 2024)

    // Format the date as mm/dd/yyyy
    return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
}

 // Function to format the amount as PHP currency
 function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount);
}

    // Debugging to check the data
    console.log('Invoice Data:', data);
    console.log('Calculated Due Date:', calculateDueDate());
    console.log('Formatted Bill Month:', formatDate(data.date));

    // Define the content of the invoice
    const invoiceContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Billing Invoice</title>
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
                    <p>Ipinagbibigay-alam po namin sa inyo na sa darating na <strong>${calculateCutOff()}</strong> ay magkakaroon po ulit tayo ng <strong>disconnection o pamumutol</strong> para sa mga hindi nakabayad ng utang sa ating patubig. Mula ika-21-25 ng buwan may penalty na po tayo na 100.00 piso at mula 26-31 ay tuluyan ng tatanggalin ang serbisyo ng patubig at may reconnection na po na 500.00.</p>
                    <p>Ang inyo pong pagkakautang na dapat mabayaran ay nagkakahalaga ng <strong>${data.amount}</strong> para sa buwan/ mga buwan ng <strong>${formatDate(data.date)}</strong>.</p>
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
                            <td><strong>${data.name}</strong></td>
                        </tr>
                        <tr>
                            <td>Bill Month:</td>
                            <td><strong>${formatDate(data.date)}</strong></td>
                        </tr>
                        <tr>
                            <td>Due Date:</td>
                            <td><strong>${calculateDueDate()}</strong></td>
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
                            <td><strong>${formatCurrency(data.amount)}</strong></td>
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