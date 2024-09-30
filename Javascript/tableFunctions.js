// Declare necessary variables
let tableData = []; 
let limit = 100; // Set the number of records to load per request
let offset = 0; // Initialize offset for pagination
let isLoading = false; // Flag to prevent multiple fetch calls
let allDataLoaded = false; // Flag to indicate if all data has been loaded
let hasFilteredData = false; // Flag to indicate if data has been filtered

// Function to initialize table data
function initializeTableData() {
    loadTableData(); // Load initial data
    const container = document.querySelector('.table-container');
    container.addEventListener('scroll', handleScroll); // Add scroll event listener to the table container
}

function loadTableData() {
    if (isLoading || allDataLoaded) return; // Prevent loading if already in progress or if all data is loaded
    isLoading = true; // Set loading flag

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

    // Fetch data from the server
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

            console.log('Data received:', data); // Log the data received for debugging

            // If no data is returned, set flag and alert user
            if (data.length === 0) {
                allDataLoaded = true; // Mark all data as loaded
                console.log('All data has been loaded.'); // Log for debugging

                // Alert user that all data has been loaded
                Swal.fire({
                    title: 'End of Data',
                    text: 'You have reached the end of the data.',
                    icon: 'info',
                    confirmButtonText: 'OK'
                }).then(() => {
                    isLoading = false; // Reset loading flag after alert is closed
                });
                return; // Exit function if no more data
            }

            // Concatenate new data to existing tableData
            tableData = tableData.concat(data);

            // Sort data by date in descending order
            tableData.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Reload the table with the sorted data
            reloadTable();

            // Increment offset for the next request
            offset += limit;
            isLoading = false; // Reset loading flag
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
            }).then(() => {
                isLoading = false; // Reset loading flag on error
            });
        });
}

// Function to handle scroll event for lazy loading
function handleScroll() {
    const container = document.querySelector('.table-container');
    const scrollPosition = container.scrollTop + container.clientHeight;
    const threshold = container.scrollHeight - 500; // Trigger loading when nearing bottom

    console.log('Scroll position:', scrollPosition, 'Threshold:', threshold); // Log for debugging

    // Check if we should load more data
    const searchQuery = document.getElementById('searchInput').value;
    if (scrollPosition >= threshold && !allDataLoaded && !hasFilteredData && searchQuery.length === 0) {
        loadTableData(); // Load more data when threshold is reached
    }
}

// Mapping of area numbers to names
const areaNumberToName = {
    "1": "Kanluran",
    "2": "Gitna",
    "3": "Silangan",
    "4": "Marmaine",
    "5": "Patik",
    "6": "Purok 6"
    // Add more mappings as needed
};

// Function to search and filter table rows by name
function searchTable() {
    const searchQuery = document.getElementById('searchInput').value;

    if (searchQuery.length === 0) {
        // When search input is empty, reset the table and fetch original data
        resetTable(); // This should fetch the original data
        return;
    }

    // Reset pagination when searching
    offset = 0;
    allDataLoaded = false;

    // Make an AJAX request to search in the database
    fetch(`./php/search.php?query=${encodeURIComponent(searchQuery)}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#dataTable tbody');
            tableBody.innerHTML = ''; // Clear the existing rows

            if (data.length === 0) {
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
            } else {
                // Sort data by ID in descending order
                data.sort((a, b) => b.bill_id - a.bill_id);

                // Populate the table with the search results
                data.forEach(record => {
                    const row = document.createElement('tr');

                    // Convert area number to area name using the mapping
                    const areaName = areaNumberToName[record.Area_Number] || record.Area_Number; // Default to original if not found

                    row.innerHTML = `
                        <td>${record.Name}</td>
                        <td>${areaName}</td>  <!-- Use mapped area name here -->
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
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}


// Function to reset the table (show all rows)
function resetTable() {
    const rows = Array.from(document.querySelectorAll('#dataTable tbody tr'));

    // Show all rows
    rows.forEach(row => {
        row.style.display = ''; // Show all rows
    });

    // Clear the search input
    document.getElementById('searchInput').value = ''; 

    // Sort rows by ID in descending order (assuming ID is in the first column)
    rows.sort((a, b) => {
        const idA = parseInt(a.cells[0].textContent); // Get ID from the first column
        const idB = parseInt(b.cells[0].textContent);
        return idB - idA; // Sort in descending order
    });

    // Append sorted rows back to the table body
    const tbody = document.querySelector('#dataTable tbody');
    tbody.innerHTML = ''; // Clear existing rows
    rows.forEach(row => {
        tbody.appendChild(row); // Append sorted rows
    });
}

// Add event listener to search input for Enter key press
document.getElementById('searchInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        searchTable(); // Call search function when Enter is pressed
        event.preventDefault(); // Prevent default action if necessary
    }
});


// Function to reload table data (including search functionality)
function reloadTable() {
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    document.getElementById('searchInput').value = '';

    // Sort tableData in descending order by bill_id
    tableData.sort((a, b) => {
        // Ensure bill_id is treated as a number
        const idA = Number(a.bill_id);
        const idB = Number(b.bill_id);
        return idB - idA;
    });

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


// Example function to fetch data and reload table
async function fetchDataAndReloadTable() {
    try {
        const response = await fetch('./php/fetch_data.php'); // Adjust the URL and parameters
        const data = await response.json();
        tableData = data; // Update tableData with fetched data
        reloadTable(); // Call your function to update the table
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
