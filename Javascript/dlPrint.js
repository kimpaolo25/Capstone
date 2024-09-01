// Function to print the table with title, area, and time
function printTable() {
    // Get the selected area from the filter
    const selectedArea = document.getElementById('areaFilter').value || 'All Areas';

    // Get the current time
    const currentTime = new Date().toLocaleString();

    // Create a new window for printing
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
    
    // Add title
    printWindow.document.write('<h1>Pansol Rural Waterworks Association Incorporation</h1>');

    printWindow.document.write('<p><strong>Bill Reports</strong> </p>');

    // Add area information
    printWindow.document.write('<p><strong>Area:</strong> ' + selectedArea + '</p>');

    // Add current time
    printWindow.document.write('<p><strong>Time:</strong> ' + currentTime + '</p>');

    // Create a copy of the table, excluding the last column
    const table = document.getElementById('dataTable').cloneNode(true);
    const headerCells = table.querySelectorAll('th');
    const rows = table.querySelectorAll('tbody tr');

    // Remove the last column from headers
    headerCells[headerCells.length - 1].style.display = 'none';

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells[cells.length - 1].style.display = 'none'; // Hide the last cell in each row
    });

    // Add the modified table to the document
    printWindow.document.write(table.outerHTML);

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}



// Function to download the table data as a CSV file
function downloadTableAsCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    const table = document.getElementById('dataTable');
    const rows = table.querySelectorAll('tr');

    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('th, td');
        const cellValues = Array.from(cells).map(cell => `"${cell.textContent.replace(/"/g, '""')}"`).join(',');
        if (index === 0) {
            csvContent += `${cellValues}\r\n`; // Add headers
        } else {
            csvContent += `${cellValues}\r\n`; // Add row values
        }
    });

    // Exclude the last column (Action column)
    csvContent = csvContent.split('\r\n').map(line => {
        const columns = line.split(',');
        return columns.slice(0, -1).join(','); // Remove the last column
    }).join('\r\n');

    // Create a downloadable link and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'table_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to download the table data as an Excel file
function downloadTableAsExcel() {
    const wb = XLSX.utils.book_new();
    const ws_data = [];

    // Get table headers
    const headers = Array.from(document.querySelectorAll('#dataTable thead th')).map(th => th.textContent);
    ws_data.push(headers);

    // Get table rows and their data
    document.querySelectorAll('#dataTable tbody tr').forEach(row => {
        const rowData = Array.from(row.querySelectorAll('td')).map(td => td.textContent);
        // Exclude the last column (Action column)
        rowData.pop();
        ws_data.push(rowData);
    });

    // Create a worksheet from the data
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Add worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Generate a binary Excel file and initiate download
    XLSX.writeFile(wb, 'table_data.xlsx');
}

// Event listeners for print and download options
document.getElementById('printOption').addEventListener('click', printTable);
document.getElementById('downloadCSVOption').addEventListener('click', downloadTableAsCSV);
document.getElementById('downloadExcelOption').addEventListener('click', downloadTableAsExcel);
