// Function to initialize table data with SweetAlert2 loading notification
function initializeTableData() {
    const limit = 1000; // Example limit
    const offset = 0; // Example offset

    // Show loading alert
    Swal.fire({
        title: 'Loading Data',
        text: 'Please wait while we fetch the data.',
        icon: 'info',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading(); // Show the loading spinner
        }
    });

    fetch(`./php/fetch_data.php?limit=${limit}&offset=${offset}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Hide loading alert
            Swal.close(); 

            // Sort data by date in descending order
            tableData = data.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Reload the table with the sorted data
            reloadTable();
        })
        .catch(error => {
            // Hide loading alert and show error message
            Swal.close();
            console.error('Error fetching data:', error.message);
            Swal.fire({
                title: 'Error',
                text: 'Failed to fetch data. Please try again later.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
}

// Function to search and filter table rows by name
function searchTable() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#dataTable tbody tr');
    let recordsFound = false;

    rows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        
        // Assuming 'name' is in the second cell (index 1)
        const nameCell = cells[1];
        
        if (nameCell) {
            const nameText = nameCell.textContent.toLowerCase();
            if (nameText.includes(searchQuery)) {
                row.style.display = '';
                recordsFound = true;
            } else {
                row.style.display = 'none';
            }
        }
    });

    if (!recordsFound && searchQuery !== '') {
        // Show SweetAlert2 if no records are found
        Swal.fire({
            title: 'No Records Found',
            text: 'No records match your search criteria.',
            icon: 'info',
            confirmButtonText: 'OK'
        }).then(() => {
            // Reset the table after alert is dismissed
            resetTable();
        });
    }
}

// Function to reset the table (show all rows)
function resetTable() {
    const rows = document.querySelectorAll('#dataTable tbody tr');
    rows.forEach(row => {
        row.style.display = ''; // Show all rows
    });
    document.getElementById('searchInput').value = ''; // Clear the search input
}

// Add event listener to search input
document.getElementById('searchInput').addEventListener('input', searchTable);

// Function to reload table data (including search functionality)
function reloadTable() {
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    tableData.forEach((row) => {
        const newRow = tableBody.insertRow();

        // Create cells for each value in the row
        Object.keys(row).forEach((key) => {
            const cell = newRow.insertCell();
            cell.textContent = row[key];

            // Add a class to identify Bill ID cells
            if (key === 'bill_id') { // Adjust if your key is different
                cell.classList.add('bill-id'); // Add a class to identify Bill ID cells
            }
        });

        // Add action buttons with correct data-id
        const actionCell = newRow.insertCell();
        actionCell.innerHTML = `
            <button class="update-btn" data-id="${row['bill_id']}">Update</button>
            <button class="delete-btn" data-id="${row['bill_id']}">Delete</button><br>
            <button class="print-btn" data-id="${row['bill_id']}">Print Invoice</button>
        `;
    });

    // Reapply search filter after reloading table
    searchTable();
}

// Mapping of area names to numbers
const areaNameToNumber = {
    "Kanluran": "1",
    "Gitna": "2",
    "Silangan": "3",
    "Marmaine": "4",
    "Patik": "5",
    "Purok 6": "6"
    // Add more mappings as needed
};

// Function to auto-fill the form fields based on the most recent record for the same name
function autoFillFields(name) {
    const sortedRecords = tableData
        .filter(record => record.name === name)
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Ensure sorting by date if applicable

    const latestRecord = sortedRecords[0];

    if (latestRecord) {
        const areaNumber = areaNameToNumber[latestRecord.Area_Number] || '';

        form.area.value = areaNumber;
        form.previous.value = latestRecord.present || ''; // Fill previous with latest record's current
        
        // Update cuM and amount if the current value is already set
        updateCuM();
    } else {
        form.area.value = '';
        form.previous.value = '';
        form.cuM.value = ''; // Clear cuM field
        form.amount.value = ''; // Clear amount field
    }
}

// Function to update the cuM field based on the current and previous values
function updateCuM() {
    const current = parseFloat(document.querySelector('#current').value) || 0;
    const previous = parseFloat(document.querySelector('#previous').value) || 0;
    const cuM = (current - previous).toFixed(2); // Calculate cuM and format it
    document.querySelector('#cuM').value = cuM;

    // Calculate amount based on cuM
    const cuMValue = parseFloat(cuM);
    const initial = parseFloat(document.querySelector('#initialAmount').value) || 0;
    const amount = (cuMValue - 8) * 20 + 180;

    // Set amount based on the condition
    document.querySelector('#amount').value = amount > 179 ? amount.toFixed(2) : initial.toFixed(2);
}

// Add event listeners to the fields that affect the amount calculation
document.querySelector('#current').addEventListener('input', updateCuM);
document.querySelector('#previous').addEventListener('input', updateCuM); // Ensure this triggers updateCuM
document.querySelector('#initialAmount').addEventListener('input', updateCuM);

// Initialize table data when the document is loaded
document.addEventListener('DOMContentLoaded', initializeTableData);

// Function to provide autocomplete suggestions based on the name input
function autocompleteSuggestions() {
    const input = document.getElementById('name');
    const suggestionsList = document.getElementById('suggestions');
    const query = input.value.toLowerCase();
    
    // Clear previous suggestions
    suggestionsList.innerHTML = '';

    if (query.length > 0) {
        // Filter table data to find matching names
        const matchingNames = tableData
            .filter(record => record.name.toLowerCase().includes(query))
            .map(record => record.name)
            .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

        if (matchingNames.length > 0) {
            // Display suggestions
            suggestionsList.style.display = 'block';
            matchingNames.forEach(name => {
                const li = document.createElement('li');
                li.textContent = name;
                li.style.padding = '8px';
                li.style.cursor = 'pointer';
                li.addEventListener('click', () => {
                    input.value = name;
                    suggestionsList.style.display = 'none';
                    autoFillFields(name); // Auto-fill fields based on the selected name
                });
                suggestionsList.appendChild(li);
            });
        } else {
            suggestionsList.style.display = 'none';
        }
    } else {
        suggestionsList.style.display = 'none';
    }
}

// Function to hide suggestions list when clicking outside
document.addEventListener('click', (event) => {
    const suggestionsList = document.getElementById('suggestions');
    const name = document.getElementById('name');
    if (!name.contains(event.target) && !suggestionsList.contains(event.target)) {
        suggestionsList.style.display = 'none';
    }
});

// Add event listener to the name input field for autocomplete
document.getElementById('name').addEventListener('input', autocompleteSuggestions);
