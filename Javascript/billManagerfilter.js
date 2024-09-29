function filterTable() {
    Swal.fire({
        title: 'Filtering Data',
        text: 'Please wait while we apply the filters.',
        icon: 'info',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    const year = document.getElementById('yearFilter').value;
    const area = document.getElementById('areaFilter').value;
    const month = document.getElementById('monthFilter').value;

    console.log(`Fetching data with filters - Year: ${year}, Area: ${area}, Month: ${month}`);

    fetch(`../Capstone/php/filter_fetch.php?year=${year}&area=${area}&months=${month}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched data:', data);
            updateTable(data);
            Swal.close();

            if (data.length === 0) {
                Swal.fire({
                    title: 'No Records Found',
                    text: 'No records match your filter criteria.',
                    icon: 'info',
                    confirmButtonText: 'OK'
                });
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            Swal.close();
            Swal.fire({
                title: 'Error',
                text: `Failed to retrieve data from server: ${error.message}`,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
}

// Function to update the HTML table with filtered data
function updateTable(data) {
    const tableBody = document.getElementById('tableBody'); // Ensure this matches your actual table body ID
    tableBody.innerHTML = ''; // Clear existing table rows

    // Sort data by bill_id in descending order
    data.sort((a, b) => b.bill_id - a.bill_id);

    data.forEach(record => {
        const row = document.createElement('tr');

        // Use innerHTML to populate the row with table data
        row.innerHTML = `
            <td style="display:none;">${record.bill_id}</td>  <!-- Hidden Bill ID -->
            <td>${record.Name}</td>
            <td>${record.Area_Number}</td>  <!-- Use mapped area name here -->
            <td>${record.Present}</td>
            <td>${record.Previous}</td>
            <td>${record.Date_column}</td>
            <td>${record.Initial}</td>
            <td>${record.CU_M}</td>
            <td>${record.Amount}</td>
        `;

        // Add action buttons with correct data-id
        const actionCell = row.insertCell(); // Create a new cell for actions
        actionCell.innerHTML = `
            <button class="update-btn" data-id="${record.bill_id}" onclick="editRecord(${record.bill_id})">Update</button>
            <button class="delete-btn" data-id="${record.bill_id}" onclick="deleteRecord(${record.bill_id})">Delete</button><br>
            <button class="print-btn" data-id="${record.bill_id}" onclick="printInvoice(${record.bill_id})">Print Invoice</button>
        `;

        // Append the new row to the table body
        tableBody.appendChild(row);
    });
}


// Function to reset all filters
function resetFilters() {
    document.getElementById('yearFilter').value = '';
    document.getElementById('areaFilter').value = '';
    document.getElementById('monthFilter').value = '';
    loadTableData(); // Reapply the filter to show all rows
}

// Add event listeners to filter dropdowns
document.getElementById('yearFilter').addEventListener('change', filterTable);
document.getElementById('areaFilter').addEventListener('change', filterTable);
document.getElementById('monthFilter').addEventListener('change', filterTable);

// Add event listener to reset button
document.getElementById('resetFilters').addEventListener('click', resetFilters);

// Initialize year options on document load
document.addEventListener('DOMContentLoaded', function() {
    const yearSelect = document.getElementById('yearFilter');
    const startYear = 2020;
    const currentYear = new Date().getFullYear();

    for (let year = startYear; year <= currentYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
});
