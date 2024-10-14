let tableData = [];
let limit = 300; // Set the number of records to load per page
let currentPage = 1; // Initialize page number
let totalRecords = 0; // Total records will be calculated later
let totalPages = 1; // Total pages will be calculated later
let isLoading = false; // Tracks if data is currently being loaded
let allDataLoaded = false; // Tracks if all available data has been loaded
let offset = 0; // Tracks the current offset for pagination

// Function to initialize table data
function initializeTableData() {
    loadTableData(); // Load initial data
}

// Function to load table data based on page
function loadTableData() {
    if (isLoading || allDataLoaded) return; // Prevent loading if already in progress or all data loaded
    isLoading = true; // Set loading flag

    Swal.fire({
        title: 'Loading Data',
        text: 'Please wait while we fetch the data.',
        icon: 'info',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Fetch data from the server with limit and offset
    fetch(`./php/fetch_data.php?limit=${limit}&offset=${offset}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json(); // Parse response as JSON
        })
        .then(data => {
            console.log('Data received:', data); // Log the raw data to inspect it

            // Check if the data is an object with the expected structure
            if (!data || typeof data !== 'object' || !Array.isArray(data.data) || typeof data.total !== 'string') {
                throw new Error('Invalid data format');
            }
            scrollToTop();

            const records = data.data; // Extract records from the response
            totalRecords = parseInt(data.total); // Get total records
            totalPages = Math.ceil(totalRecords / limit); // Calculate total pages

            Swal.close();
            console.log('Processed records:', records); // Log the processed records

            // Check if any data is received
            if (records.length === 0) {
                allDataLoaded = true; // Set flag to prevent further fetches
                console.log('All data has been loaded.');

                Swal.fire({
                    title: 'End of Data',
                    text: 'You have reached the end of the data.',
                    icon: 'info',
                    confirmButtonText: 'OK'
                }).then(() => {
                    isLoading = false;
                    checkPaginationButtons(); // Update button states
                });
                return;
            }

            // Update table data with new records
            tableData = records; // Replace existing data with the new records
            reloadTable(); // Reload the table with new data

            // Update offset and currentPage after fetching new data
            offset = (currentPage - 1) * limit; // Calculate offset for the current page
            currentPage = Math.ceil(offset / limit) + 1; // Update currentPage based on offset
            isLoading = false; // Reset loading state
            checkPaginationButtons(); // Update pagination buttons
        })
        .catch(error => {
            Swal.close();
            console.error('Error fetching data:', error.message);
            Swal.fire({
                title: 'Error',
                text: 'Failed to fetch data. Please try again later.',
                icon: 'error',
                confirmButtonText: 'OK'
            }).then(() => {
                isLoading = false;
            });
        });
}

// Function to scroll to the top of the table
function scrollToTop() {
    const table = document.getElementById('dataTable'); // Ensure this is the correct ID
    const container = document.querySelector('.table-container'); // Your scrollable container ID
    
    if (container) {
        // Scroll to the top of the container
        container.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (table) {
        // If container is not set, scroll to the table
        const tableOffset = table.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: tableOffset, behavior: 'smooth' });
    }
}

// Pagination controls
function prevPage() {
    if (currentPage > 1) {
        currentPage--; // Decrement current page
        offset -= limit; // Decrement offset to load the previous set of data
        loadPageData(); // Fetch new data
    }
}

function nextPage() {
    if (currentPage < totalPages && !allDataLoaded) {
        currentPage++; // Increment current page
        offset += limit; // Increment offset to load the next set of data
        loadPageData(); // Fetch new data
    } else if (allDataLoaded) {
        Swal.fire({
            title: 'End of Data',
            text: 'You have reached the end of the data.',
            icon: 'info',
            confirmButtonText: 'OK'
        });
    } else {
        Swal.fire({
            title: 'No More Pages',
            text: 'No more pages to load.',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    }
}

// Function to go to the first page
function firstPage() {
    if (currentPage > 1) {
        currentPage = 1; // Set current page to the first page
        offset = 0; // Reset offset for the first page
        loadPageData(); // Fetch new data
    }
}

// Function to go to the last page
function lastPage() {
    if (currentPage < totalPages) {
        currentPage = totalPages; // Set current page to the last page
        offset = (totalPages - 1) * limit; // Calculate offset for the last page
        loadPageData(); // Fetch new data
    } else {
        Swal.fire({
            title: 'Already on Last Page',
            text: 'You are already on the last page.',
            icon: 'info',
            confirmButtonText: 'OK'
        });
    }
}


// Function to load data based on the current filters or original data
function loadPageData() {
    const year = document.getElementById('yearFilter').value; // Get the selected year
    const area = document.getElementById('areaFilter').value; // Get the selected area
    const month = document.getElementById('monthFilter').value; // Get the selected month

    // Create search query from selected filters
    const searchQuery = {
        year: year,
        area: area,
        month: month
    };

    // Check if any filter is applied
    if (year || area || month) {
        searchTable(searchQuery); // Pass the search query to the searchTable function
        hidePaginationControls(); // Hide pagination controls when filtering
    } else {
        loadTableData(); // Fetch original data if no filters are applied
        showPaginationControls(); // Show pagination controls when not filtering
    }
}

// Function to hide pagination controls
function hidePaginationControls() {
    document.getElementById('paginationControls').style.display = 'none'; // Hide pagination controls
}

// Function to show pagination controls
function showPaginationControls() {
    document.getElementById('paginationControls').style.display = 'block'; // Show pagination controls
}


// Function to enable/disable pagination buttons based on page and available data
function checkPaginationButtons(totalCount) {
    document.getElementById('prevPageBtn').disabled = currentPage === 1; // Disable Prev on first page
    document.getElementById('nextPageBtn').disabled = (currentPage * limit) >= totalCount; // Disable Next if there are no more pages
    document.getElementById('firstPageBtn').disabled = currentPage === 1; // Disable First on first page
    document.getElementById('lastPageBtn').disabled = (currentPage * limit) >= totalCount; // Disable Last if on last page
}

// Helper function to check if there's no more data available
function noMoreData() {
    return tableData.length === 0; // Check if the current page has any data
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
    const searchQuery = document.getElementById('searchInput').value.trim(); // Trim to avoid unnecessary spaces

    // When search input is empty, reset the table and fetch original data
    if (searchQuery.length === 0) {
        resetTable();
    }

    // Reset pagination when searching
    offset = 0; // Reset to the first page
    currentPage = 1; // Set current page to 1
    limit = 1500; // Define the limit for the search

    // Make an AJAX request to search in the database
    fetch(`./php/search.php?query=${encodeURIComponent(searchQuery)}&offset=${offset}&limit=${limit}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#dataTable tbody');
            tableBody.innerHTML = ''; // Clear the existing rows

            if (data.records.length === 0) {
                // Show SweetAlert2 if no records are found
                Swal.fire({
                    title: 'No Records Found',
                    text: 'No records match your search criteria.',
                    icon: 'info',
                    confirmButtonText: 'OK'
                }).then(() => {
                    // Reset the table after alert is dismissed
                    resetTable();
                    document.getElementById('tableBody').scrollIntoView({ behavior: 'smooth' });
                });
            } else {
                // Update total records count
                totalRecords = data.totalCount; // Assuming your PHP returns totalCount

                // Populate the table with the search results
                data.records.forEach(record => {
                    const row = document.createElement('tr');

                    // Convert area number to area name using the mapping
                    const areaName = areaNumberToName[record.Area_Number] || record.Area_Number; // Default to original if not found

                    row.innerHTML = `
                        <td>${record.Name}</td>
                        <td>${areaName}</td>
                        <td>${record.Present}</td>
                        <td>${record.Previous}</td>
                        <td>${record.Date_column}</td>
                        <td>${record.Initial}</td>
                        <td>${record.CU_M}</td>
                        <td>₱${parseFloat(record.Amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>  <!-- Add Peso sign -->
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

                // Update pagination controls based on the new total records
                totalPages = Math.ceil(totalRecords / limit);
                checkPaginationButtons(totalRecords); // Update buttons' state
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            Swal.fire({
                title: 'Error',
                text: 'An error occurred while fetching data.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
}

// Add an event listener to trigger search on pressing Enter
document.getElementById('searchInput').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        // Reset pagination when searching
        document.getElementById('searchSuggestions').style.display = 'none'; // Hide search suggestions after pressing Enter
        offset = 0; // Reset offset
        currentPage = 1; // Reset current page
        searchTable(); // Call search function
    }
});

// Function to reset the table (show all rows)
function resetTable() {
    // Resetting logic to show all rows goes here (similar to your original code)
    const rows = Array.from(document.querySelectorAll('#dataTable tbody tr'));

    // Show all rows
    rows.forEach(row => {
        row.style.display = ''; // Show all rows
    });

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

    // Reset pagination info
    totalRecords = rows.length; // Assuming original data is all rows
    totalPages = Math.ceil(totalRecords / limit); // Calculate total pages based on original data
    currentPage = 1; // Reset current page
    checkPaginationButtons(totalRecords); // Update buttons' state

    scrollToTop()
}





// Function to reload table data while preserving the search filter
function reloadTable() {
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    // Clear filter selections (if needed)
    document.getElementById('yearFilter').value = '';
    document.getElementById('areaFilter').value = '';
    document.getElementById('monthFilter').value = '';


    // Get the current search query
    const searchQuery = document.getElementById('searchInput').value.trim().toLowerCase();

    // Sort tableData in descending order by bill_id
    tableData.sort((a, b) => {
        const idA = Number(a.bill_id);
        const idB = Number(b.bill_id);
        return idB - idA;
    });

    // Filter the data based on the search query, if any
    const filteredData = tableData.filter(row => {
        return Object.values(row).some(value =>
            value.toString().toLowerCase().includes(searchQuery)
        );
    });

    // Use filtered data to populate the table
    filteredData.forEach((row) => {
        const newRow = tableBody.insertRow();

        // Create cells for each value in the row
        Object.keys(row).forEach((key) => {
            const cell = newRow.insertCell();
            cell.textContent = row[key];

            // Add a class to identify Bill ID cells
            if (key === 'bill_id') {
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

    // Reset to first page after reloading the table
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
    const amount = (cuMValue - 8) * 20 + initial;

    // Set amount based on the condition
    document.querySelector('#amount').value = amount > 179 ? amount.toFixed(2) : initial.toFixed(2);
}


// Add event listeners to the fields that affect the amount calculation
document.querySelector('#current').addEventListener('input', updateCuM);
document.querySelector('#previous').addEventListener('input', updateCuM); // Ensure this triggers updateCuM
document.querySelector('#initialAmount').addEventListener('input', updateCuM);

// Initialize table data when the document is loaded
document.addEventListener('DOMContentLoaded', initializeTableData);

// Function to handle autocomplete suggestions for 'name' input
function autocompleteSuggestions() {
    const input = document.getElementById('name');
    const suggestionsList = document.getElementById('suggestions');
    
    generateSuggestions(input, suggestionsList, (name) => {
        input.value = name; // Set input value to selected name
        suggestionsList.style.display = 'none'; // Hide suggestions
        // Optional: Perform an action when the name is selected
    });
}

// Function to handle autocomplete for 'searchInput'
function autocompleteSearchSuggestions() {
    const input = document.getElementById('searchInput');
    const suggestionsList = document.getElementById('searchSuggestions');
    
    generateSuggestions(input, suggestionsList, (name) => {
        input.value = name; // Set input value to selected suggestion
        suggestionsList.style.display = 'none'; // Hide suggestions
        searchTable(); // Trigger search immediately
    });
}

// Reusable function to generate suggestions
function generateSuggestions(input, suggestionsList, callback) {
    const query = input.value.toLowerCase();
    suggestionsList.innerHTML = ''; // Clear previous suggestions

    if (query.length > 0) {
        const matchingNames = tableData
            .filter(record => record.name.toLowerCase().includes(query))
            .map(record => record.name)
            .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

        if (matchingNames.length > 0) {
            suggestionsList.style.display = 'block';
            matchingNames.forEach(name => {
                const li = document.createElement('li');
                li.textContent = name;
                li.classList.add('suggestion-item'); // Add class for styling
                li.addEventListener('click', () => {
                    callback(name); // Trigger the callback with selected name
                    autoFillFields(name);
                    resetFilters();
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

// Add an event listener to trigger search on pressing Enter
document.getElementById('searchInput').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        // Reset pagination when searching
        offset = 0; // Reset offset
        currentPage = 1; // Reset current page
        searchTable(); // Call search function
    }
});

// Attach autocomplete suggestions on input for 'name' input field
document.getElementById('name').addEventListener('input', autocompleteSuggestions);

// Attach autocomplete suggestions on input for 'searchInput' field
document.getElementById('searchInput').addEventListener('input', autocompleteSearchSuggestions);



// Function to hide suggestions list when clicking outside
document.addEventListener('click', (event) => {
    const nameSuggestionsList = document.getElementById('suggestions');
    const searchSuggestionsList = document.getElementById('searchSuggestions');
    const nameInput = document.getElementById('name');
    const searchInput = document.getElementById('searchInput');

    // Check if the click was outside both the name input and its suggestions
    if (!nameInput.contains(event.target) && !nameSuggestionsList.contains(event.target)) {
        nameSuggestionsList.style.display = 'none'; // Hide name suggestions
    }

    // Check if the click was outside both the search input and its suggestions
    if (!searchInput.contains(event.target) && !searchSuggestionsList.contains(event.target)) {
        searchSuggestionsList.style.display = 'none'; // Hide search suggestions
    }
});

// Add event listener to the name input field for autocomplete
document.getElementById('name').addEventListener('input', autocompleteSuggestions);

// Add event listener to the search input field for autocomplete
document.getElementById('searchInput').addEventListener('input', autocompleteSearchSuggestions);




// Example function to fetch data and reload table
async function fetchDataAndReloadTable() {
    try {
        const response = await fetch('./php/fetch_data.php'); // Adjust the URL and parameters
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if the fetched data is an array or contains an array
        if (Array.isArray(data)) {
            tableData = data; // If data is an array, assign it directly
        } else if (data && Array.isArray(data.data)) {
            tableData = data.data; // If data has a 'data' property, assign that array
        } else {
            console.error('Fetched data is not in the expected format:', data);
            tableData = []; // Reset to an empty array if the structure is unexpected
        }

        reloadTable(); // Call your function to update the table
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}



// Function to reload table data (including search functionality)
function clearFilter() {
    const tableBody = document.querySelector('#dataTable tbody');

    // Clear the search input
    document.getElementById('searchInput').value = '';

    // Clear filter selections
    document.getElementById('yearFilter').value = '';
    document.getElementById('areaFilter').value = '';
    document.getElementById('monthFilter').value = '';
    firstPage(); 
    scrollToTop();
    reloadTable();
    showPaginationControls();
}
