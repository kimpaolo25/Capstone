// Global chart instances
let totalIncomeChartInstance = null;
let cubicMeterChartInstance = null;

// Function to update the charts based on the selected year
function updateCharts() {
    console.log('updateCharts function called');
    const yearDropdown = document.getElementById('yearFilter');
    const selectedYear = yearDropdown.value;
    console.log('Selected year:', selectedYear);

    // Check if the selected year is the default option
    if (selectedYear === '') { // Adjusted to check for an empty value
        console.log('Default option selected. Resetting charts.');
        resetCharts(); // Call the function to reset the charts
        return; // Exit the function early
    }

    if (selectedYear) {
        fetch(`./php/getChartData.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ year: selectedYear })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Data received from server:', data); // Log the response data

            // Update the Total Number of Bills This Year card
            if (data.totalBills !== undefined) {
                document.getElementById('billsThisYear').innerText = data.totalBills.toLocaleString();
            } else {
                console.warn('Total Bills data is not available for the selected year.');
            }

            // Update the Expected Income This Year card
            if (data.expectedIncome !== undefined) {
                const currencyFormatter = new Intl.NumberFormat('en-PH', {
                    style: 'currency',
                    currency: 'PHP'
                });
                document.getElementById('overallIncome').innerText = currencyFormatter.format(data.expectedIncome);
            } else {
                console.warn('Expected Income data is not available for the selected year.');
            }

            // Check if the totalIncomePerYear data exists
            if (data.totalIncomePerYear && data.totalIncomePerYear.labels && data.totalIncomePerYear.values) {
                console.log('Total Income Data:', data.totalIncomePerYear);
                updateTotalIncomeChart(data.totalIncomePerYear);
            } else {
                console.warn('Total Income data is not available for the selected year.');
            }

            // Check if the cubicMeterConsumptionPerYear data exists
            if (data.cubicMeterConsumptionPerYear && data.cubicMeterConsumptionPerYear.labels && data.cubicMeterConsumptionPerYear.values) {
                console.log('Cubic Meter Consumption Data:', data.cubicMeterConsumptionPerYear);
                updateCubicMeterChart(data.cubicMeterConsumptionPerYear);
            } else {
                console.warn('Cubic Meter Consumption data is not available for the selected year.');
            }

            // Update the cards with number of bills and overall income for the selected year
            updateCards(data);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    } else {
        console.warn('No year selected in the dropdown.');
    }
}

// Function to reset the charts to initial state
function resetCharts() {
    resetCards();  // Reset the cards to show data for the current year
    resetTotalIncomeChart();
    resetCubicMeterChart();
}

// Event listener for the reset button
document.getElementById('resetButton').addEventListener('click', function () {
    // Reset the dropdown to the default option
    const yearDropdown = document.getElementById('yearFilter');
    yearDropdown.value = ''; // Set the value to empty to return to --Select Year--

    // Reset cards to display data for the current year
    fetch('./php/getChartData.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reset: true })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Data received from server:', data);

        // Update the cards with total bills and expected income for the current year
        updateCards(data);

        // Ensure totalIncomeData is defined and has labels and values
        if (data.totalIncomeData && Array.isArray(data.totalIncomeData.labels) && Array.isArray(data.totalIncomeData.values)) {
            createIncomeChart(data.totalIncomeData);
        } else {
            console.error('totalIncomeData is not available or is not correctly structured:', data.totalIncomeData);
        }

        // Ensure totalCubicMeterData is defined and has labels and values
        if (data.totalCubicMeterData && Array.isArray(data.totalCubicMeterData.labels) && Array.isArray(data.totalCubicMeterData.values)) {
            createCubicMeterChart(data.totalCubicMeterData);
        } else {
            console.error('totalCubicMeterData is not available or is not correctly structured:', data.totalCubicMeterData);
        }
    })
    .catch(error => console.error('Error fetching data:', error));
});

// Function to create or replace the income chart (as a line chart with consistent color)
function createIncomeChart(data) {
    const ctx = document.getElementById('incomeMonthChart').getContext('2d');

    // Check if incomeChart already exists and destroy it if it does
    if (totalIncomeChartInstance) {
        totalIncomeChartInstance.destroy();
        totalIncomeChartInstance = null; // Ensure it's fully cleared
    }

    // Create the new chart as a line chart with the orange color
    totalIncomeChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: '', // Set to empty to prevent showing undefined
                data: data.values,
                backgroundColor: 'rgba(255, 165, 0, 0.2)', // Light orange background
                borderColor: 'rgba(255, 165, 0, 1)', // Orange border
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false // Hide legend entirely
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Function to create or replace the cubic meter chart (consistent light blue color)
function createCubicMeterChart(data) {
    const ctx = document.getElementById('cubicMeterChart').getContext('2d');

    // Check if cubicMeterChart already exists and destroy it if it does
    if (cubicMeterChartInstance) {
        cubicMeterChartInstance.destroy();
        cubicMeterChartInstance = null; // Ensure it's fully cleared
    }

    // Create the new chart with the light blue color
    cubicMeterChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: '', // Set to empty to prevent showing undefined
                data: data.values,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false // Hide legend entirely
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' m³';
                        }
                    }
                }
            }
        }
    });
}

// Function to update Total Income per Month chart
function updateTotalIncomeChart(incomeData) {
    const canvas = document.getElementById('incomeMonthChart');
    const ctx = canvas.getContext('2d');

    if (totalIncomeChartInstance) {
        totalIncomeChartInstance.data.labels = incomeData.labels;
        totalIncomeChartInstance.data.datasets[0].data = incomeData.values;
        console.log('Updating existing Total Income chart with new data.');
        totalIncomeChartInstance.update();
    } else {
        console.log('Creating new Total Income chart instance.');
        createIncomeChart(incomeData);
    }
}

// Function to update Cubic Meter Consumption per Month chart
function updateCubicMeterChart(consumptionData) {
    const canvas = document.getElementById('cubicMeterChart');
    const ctx = canvas.getContext('2d');

    if (cubicMeterChartInstance) {
        cubicMeterChartInstance.data.labels = consumptionData.labels;
        cubicMeterChartInstance.data.datasets[0].data = consumptionData.values;
        console.log('Updating existing Cubic Meter Consumption chart with new data.');
        cubicMeterChartInstance.update();
    } else {
        console.log('Creating new Cubic Meter Consumption chart instance.');
        createCubicMeterChart(consumptionData);
    }
}

// Function to update the cards with number of bills and overall income
function updateCards(data) {
    const billsThisYearElement = document.getElementById('billsThisYear');
    const overallIncomeElement = document.getElementById('overallIncome');
    
    // Update the number of bills this year if data is available
    if (data.totalBills !== undefined) {
        billsThisYearElement.innerText = `${data.totalBills.toLocaleString()} bill(s)`;
    } else {
        billsThisYearElement.innerText = 'No data';
    }

    // Update the overall income for the selected year
    if (data.expectedIncome !== undefined) {
        const currencyFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
        overallIncomeElement.innerText = currencyFormatter.format(data.expectedIncome);
    } else {
        overallIncomeElement.innerText = 'No data';
    }
}

// Call the updateCharts function initially when the page loads
document.addEventListener('DOMContentLoaded', updateCharts);

