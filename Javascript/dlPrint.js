document.addEventListener('DOMContentLoaded', function() {
    // Function to fetch and process data
    function fetchData(year, selectedArea, month) {
        const params = new URLSearchParams({ year, area: selectedArea, months: month });
        
        return fetch(`../Capstone/php/filter_fetch.php?${params.toString()}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Ensure the data has a bill_id field and sort in descending order based on bill_id
                if (data.length > 0 && data[0].hasOwnProperty('bill_id')) {
                    console.log("Fetched data before sorting:", data); // Debug log for fetched data
                    return data.sort((a, b) => b.bill_id - a.bill_id); // Apply specified sorting
                } else {
                    throw new Error('No valid data received or bill_id is missing.');
                }
            });
    }

    // Function to print the data directly from the server
    function printData() {
        const year = document.getElementById('yearFilter').value || ''; 
        const selectedArea = document.getElementById('areaFilter').value || ''; 
        const month = document.getElementById('monthFilter').value || ''; 

        console.log(`Printing data - Year: ${year}, Area: ${selectedArea}, Month: ${month}`); // Debugging log

        fetchData(year, selectedArea, month)
            .then(data => {
                const currentTime = new Date().toLocaleString();
                const printWindow = window.open('', '', 'height=600,width=800');
                printWindow.document.write('<html><head><title>Bill Report</title>');
                printWindow.document.write('<style>');
                printWindow.document.write('table { width: 100%; border-collapse: collapse; }');
                printWindow.document.write('th, td { border: 1px solid black; padding: 8px; text-align: left; }');
                printWindow.document.write('th { background-color: #f2f2f2; }');
                printWindow.document.write('h1 { font-family: "Times New Roman", Times, serif; font-weight: bold; }');
                printWindow.document.write('p { font-family: "Times New Roman", Times, serif; }');
                printWindow.document.write('</style>');
                printWindow.document.write('</head><body>');
                printWindow.document.write('<h1>Pansol Rural Waterworks Association Incorporation</h1>');
                printWindow.document.write('<p><strong>Bill Reports</strong></p>');
                
                // Display "All Areas" if no specific area is selected
                const areaDisplay = selectedArea ? selectedArea : 'All Areas';
                const yearDisplay = year ? year : 'All Year';
                // Adjusting the month display
                // Assuming month is a number from 1 to 12
                const monthNames = [
                    '',    // Placeholder for index 0 (not used)
                    'January', // January
                    'February', // February
                    'March', // March
                    'April', // April
                    'May', // May
                    'May', // June
                    'July', // July
                    'August', // August
                    'September', // September
                    'October', // October
                    'November', // November
                    'December'  // December
                ];

                // Use the month number to get the month abbreviation
                const formattedMonthDisplay = month >= 1 && month <= 12 ? monthNames[month] : 'All Months';

                // Print the output
                printWindow.document.write('<p><strong>Area:</strong> ' + areaDisplay + '</p>');
                printWindow.document.write('<p><strong>Month:</strong> ' + formattedMonthDisplay + '</p>');
                printWindow.document.write('<p><strong>Year:</strong> ' + yearDisplay + '</p>');

                printWindow.document.write('<p><strong>Printed on:</strong> ' + currentTime + '</p>');
                printWindow.document.write('<table><thead><tr>');

                // Add table headers
                for (const key in data[0]) {
                    printWindow.document.write(`<th>${key}</th>`);
                }
                printWindow.document.write('</tr></thead><tbody>');

                // Add rows of data
                data.forEach(row => {
                    printWindow.document.write('<tr>');
                    for (const key in row) {
                        printWindow.document.write(`<td>${row[key]}</td>`);
                    }
                    printWindow.document.write('</tr>');
                });

                printWindow.document.write('</tbody></table>');
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
            })
            .catch(error => console.error('Error fetching data for print:', error));
    }

    // Function to download the data as PDF
    const { jsPDF } = window.jspdf;

    function downloadDataAsPDF() {
        const year = document.getElementById('yearFilter').value || ''; 
        const selectedArea = document.getElementById('areaFilter').value || ''; 
        const month = document.getElementById('monthFilter').value || ''; 

        fetchData(year, selectedArea, month)
            .then(data => {
                if (!data || data.length === 0) {
                    console.error('No valid data received or bill_id is missing');
                    alert('No data found for the selected filters. The PDF will still be generated with no data.');
                    return;
                }

                const doc = new jsPDF();
                let headers = Object.keys(data[0]).filter(header => header !== 'bill_id');

                // Rename headers for 'Area_Number' and 'Date_column'
                headers.forEach((header, index) => {
                    if (header === 'Area_Number') {
                        headers[index] = 'Area'; // Rename to 'Area'
                    }
                    if (header === 'Date_column') {
                        headers[index] = 'Date'; // Rename to 'Date'
                    }
                });

                // Update the data row keys as well to match the new headers
                data = data.map(row => {
                    const updatedRow = {};
                    Object.keys(row).forEach(key => {
                        if (key === 'Area_Number') {
                            updatedRow['Area'] = row[key];
                        } else if (key === 'Date_column') {
                            updatedRow['Date'] = row[key];
                        } else {
                            updatedRow[key] = row[key];
                        }
                    });
                    return updatedRow;
                });

                const monthNames = [
                    '',    // Placeholder for index 0 (not used)
                    'January', // January
                    'February', // February
                    'March', // March
                    'April', // April
                    'May', // May
                    'May', // June
                    'July', // July
                    'August', // August
                    'September', // September
                    'October', // October
                    'November', // November
                    'December'  // December
                ];

                let yOffset = 20;

                // Title and filter information on the first page only
                doc.setFontSize(16);
                doc.text('Pansol Rural Waterworks Association Incorporation', 20, yOffset);
                doc.setFontSize(12);
                doc.text('Bill Reports', 20, yOffset + 10);
                doc.text(`Area: ${selectedArea || 'All Areas'}`, 20, yOffset + 20);
                doc.text(`Month: ${month >= 1 && month <= 12 ? monthNames[month] : 'All Months'}`, 20, yOffset + 30);
                doc.text(`Year: ${year || 'All Year'}`, 20, yOffset + 40);

                // Move down to after title section
                yOffset += 50;

                // Use autoTable to add the table with data
                doc.autoTable({
                    head: [headers],
                    body: data.map(row => headers.map(header => row[header])),
                    startY: yOffset,
                    margin: { top: 10, left: 10, right: 10 },
                    tableWidth: 'auto',
                    columnStyles: {
                        0: { cellWidth: 'auto' },  // 'Area' column
                        1: { cellWidth: 'auto' },  // 'Present' column
                        2: { cellWidth: 'auto' },  // 'Previous' column
                        3: { cellWidth: 'auto' },  // 'Date' column
                        4: { cellWidth: 'auto' },  // 'Date' column (adjust if you have more columns)
                        5: { cellWidth: 'auto' },  // 'Date' column
                        6: { cellWidth: 'auto' },  // 'Date' column
                        7: { cellWidth: 'auto' },  // 'Date' column
                    },
                    styles: {
                        cellPadding: 2,
                        fontSize: 10,
                        valign: 'middle',
                        overflow: 'linebreak',
                        lineWidth: 0.1,
                        lineColor: [0, 0, 0],
                        halign: 'center',
                    },
                    headStyles: {
                        fillColor: [173, 216, 230],
                        fontSize: 12,
                        textColor: [0, 0, 0],
                    },
                    didDrawPage: function (data) {
                        if (data.pageNumber > 1) {
                            // If it's page 2 or later, don't draw the header or the page number
                        } 
                        
                    },
                    // Disable repeating headers on every page after the first one
                    showHead: 'firstPage'
                });

                doc.save(`prwai_data_${selectedArea || 'all_areas'}.pdf`);
            })
            .catch(error => console.error('Error fetching data for PDF download:', error));
    }

    // Function to download the data as Excel from the server
    function downloadDataAsExcel() {
        const year = document.getElementById('yearFilter').value || ''; 
        const selectedArea = document.getElementById('areaFilter').value || ''; 
        const month = document.getElementById('monthFilter').value || ''; 

        console.log(`Downloading Excel - Year: ${year}, Area: ${selectedArea}, Month: ${month}`); // Debugging log

        fetchData(year, selectedArea, month)
            .then(data => {
                // Create an Excel file (XLSX format) using a library like SheetJS (xlsx.js)
                const worksheet = XLSX.utils.json_to_sheet(data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

                // Export the Excel file
                XLSX.writeFile(workbook, `prwai_data_${selectedArea || 'all_areas'}.xlsx`);
            })
            .catch(error => console.error('Error fetching data for Excel download:', error));
    }

    // Event listeners for print and download options
    document.getElementById('printOption').addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default anchor behavior
        printData(); // Call printData function
    });
    document.getElementById('downloadPDFOption').addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default anchor behavior
        downloadDataAsPDF(); // Call downloadDataAsCSV function
    });
    document.getElementById('downloadExcelOption').addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default anchor behavior
        downloadDataAsExcel(); // Call downloadDataAsExcel function
    });
});
