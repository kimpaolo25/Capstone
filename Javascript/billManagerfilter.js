// Function to filter table rows based on selected filters
function filterTable() {
    const year = document.getElementById('yearFilter').value.toLowerCase();
    const area = document.getElementById('areaFilter').value.toLowerCase();
    const month = document.getElementById('monthFilter').value.toLowerCase();
    
    const rows = document.querySelectorAll('#dataTable tbody tr');
    
    rows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        
        // Adjust these indices based on where the data is in your table
        const rowYear = cells[5] ? cells[5].innerText.toLowerCase() : '';
        const rowArea = cells[2] ? cells[2].innerText.toLowerCase() : '';
        // Extract month from a date string, assuming date format is 'YYYY-MM-DD' or similar
        const rowDate = cells[5] ? new Date(cells[5].innerText) : null;
        const rowMonth = rowDate ? rowDate.toLocaleString('default', { month: 'long' }).toLowerCase() : '';
        
        const yearMatch = year === '' || rowYear.includes(year);
        const areaMatch = area === '' || rowArea.includes(area);
        const monthMatch = month === '' || rowMonth.includes(month);
        
        if (yearMatch && areaMatch && monthMatch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Function to reset all filters
function resetFilters() {
    document.getElementById('yearFilter').value = '';
    document.getElementById('areaFilter').value = '';
    document.getElementById('monthFilter').value = '';
    filterTable(); // Reapply the filter to show all rows
}

// Add event listeners to filter dropdowns
document.getElementById('yearFilter').addEventListener('change', filterTable);
document.getElementById('areaFilter').addEventListener('change', filterTable);
document.getElementById('monthFilter').addEventListener('change', filterTable);

// Add event listener to reset button
document.getElementById('resetFilters').addEventListener('click', resetFilters);


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

