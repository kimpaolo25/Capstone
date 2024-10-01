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

    // Function to download the data as CSV from the server
    function downloadDataAsCSV() {
        const year = document.getElementById('yearFilter').value || ''; 
        const selectedArea = document.getElementById('areaFilter').value || ''; 
        const month = document.getElementById('monthFilter').value || ''; 

        console.log(`Downloading CSV - Year: ${year}, Area: ${selectedArea}, Month: ${month}`); // Debugging log

        fetchData(year, selectedArea, month)
            .then(data => {
                // Convert data to CSV format
                const csvRows = [];
                const headers = Object.keys(data[0]);
                csvRows.push(headers.join(',')); // Add header row

                data.forEach(row => {
                    csvRows.push(headers.map(field => JSON.stringify(row[field], (key, value) => value === null ? '' : value)).join(','));
                });

                const csvString = csvRows.join('\n');
                const blob = new Blob([csvString], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `prwai_data_${selectedArea || 'all_areas'}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(error => console.error('Error fetching data for CSV download:', error));
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
    document.getElementById('downloadCSVOption').addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default anchor behavior
        downloadDataAsCSV(); // Call downloadDataAsCSV function
    });
    document.getElementById('downloadExcelOption').addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default anchor behavior
        downloadDataAsExcel(); // Call downloadDataAsExcel function
    });
});
