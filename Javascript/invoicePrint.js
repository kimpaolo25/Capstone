function openAndPrintInvoice(data) {
    // Create a new iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.zIndex = '1000'; // Ensure the iframe is on top
    document.body.appendChild(iframe);

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

    // Function to format the date in 'YYYY-Month' format
    function formatDate(billDate) {
        const dateObj = new Date(billDate);
        const year = dateObj.getFullYear();
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const month = monthNames[dateObj.getMonth()];
        return `${year}-${month}`;
    }

    // Define the content of the invoice including buttons
    const invoiceContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Billing Invoice</title>
        <link rel="stylesheet" href="./css/invoice.css">
        <link rel="stylesheet" href="./css/editInvoice.css">
        <!-- SweetAlert2 CSS -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
        <!-- SweetAlert2 JS -->
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.js"></script>

            
    </head>
    <body>
        <div class="button-container">
            <button id="editButton">Edit</button>
            <button id="printButton">Print</button>
            <button id="cancelButton">Cancel</button>
        </div>
        <table class="main-table">
            <tr>
                <td colspan="2" class="header">
                    <h2 contenteditable="false">PANSOL RURAL WATERWORKS ASSOCIATION INC.</h2>
                    <p contenteditable="false">Pansol, Padre Garcia, Batangas</p>
                    <p contenteditable="false">Tel. No.: (043) 515-8533 / CEL. No.: 09084088762</p>
                    <p contenteditable="false">GCASH NO. 09464608562 AIZA D. WITH 10.00 service fee</p>
                    <h3 contenteditable="false">BABALA</h3>
                    <h3 contenteditable="false">COLLECTION/DISCONNECTION NOTICE</h3>
                </td>
            </tr>
            <tr>
                <td class="content">
                    <p contenteditable="false"><strong>${data.name}</strong><br>Pansol, Padre Garcia, Batangas</p>
                    <p contenteditable="false">Ipinagbibigay-alam po namin sa inyo na sa darating na <strong>${calculateCutOff(data.date)}</strong> ay magkakaroon po ulit tayo ng <strong>disconnection o pamumutol</strong> para sa mga hindi nakabayad ng utang sa ating patubig. Mula ika-21-25 ng buwan may penalty na po tayo na 100.00 piso at mula 26-31 ay tuluyan ng tatanggalin ang serbisyo ng patubig at may reconnection na po na 500.00.</p>
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
                            <td contenteditable="false"><strong>${calculateDueDate(data.date)}</strong></td>
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
        <script>
            document.getElementById('editButton').addEventListener('click', function() {
            // Toggle contenteditable state
            const editableElements = document.querySelectorAll('[contenteditable]');
            editableElements.forEach(element => {
                const isEditable = element.getAttribute('contenteditable') === 'true';
                element.setAttribute('contenteditable', !isEditable);
                });
                // Show SweetAlert2 message for 2 seconds
                Swal.fire({
                title: 'You can now edit this invoice!',
                icon: 'success',
                timer: 1000, //
                willClose: () => {
            // Optionally perform actions after the alert closes
        }
    });
});



            document.getElementById('printButton').addEventListener('click', function() {
                const iframe = window.frameElement;
                if (!iframe) {
                    console.error('Iframe not found');
                    return;
                }
                const iframeWindow = iframe.contentWindow;
                const iframeDocument = iframeWindow.document;

                iframeWindow.focus();
                iframeWindow.print();

                // Remove the iframe after printing
                setTimeout(() => {
                    iframe.remove();
                }, 500); // Delay to ensure the print dialog appears
            });

            document.getElementById('cancelButton').addEventListener('click', function() {
            Swal.fire({
            title: 'Are you sure?',
            text: "Your changes will not be saved.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, cancel it!',
            cancelButtonText: 'No, keep it',
            reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                // Navigate away from the page if confirmed
                window.location.href = 'billManager.php';
        }
        // Optionally handle the case where the user chooses to keep the page
    });
});

        </script>
    </body>
    </html>
    `;

    // Write content to the iframe
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(invoiceContent);
    iframe.contentWindow.document.close();
}
