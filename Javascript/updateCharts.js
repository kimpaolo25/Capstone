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
    if (selectedYear === '--Select Year--') {
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

            // Check if the totalIncomePerYear data exists
            if (data.totalIncomePerYear) {
                console.log('Total Income Data:', data.totalIncomePerYear); // Log total income data
                updateTotalIncomeChart(data.totalIncomePerYear);
            } else {
                console.warn('Total Income data is not available for the selected year.');
            }

            // Check if the cubicMeterConsumptionPerYear data exists
            if (data.cubicMeterConsumptionPerYear) {
                console.log('Cubic Meter Consumption Data:', data.cubicMeterConsumptionPerYear); // Log consumption data
                updateCubicMeterChart(data.cubicMeterConsumptionPerYear);
            } else {
                console.warn('Cubic Meter Consumption data is not available for the selected year.');
            }
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
    resetTotalIncomeChart();
    resetCubicMeterChart();
}

// Function to reset Total Income Chart to initial state
function resetTotalIncomeChart() {
    const canvas = document.getElementById('incomeMonthChart');
    const ctx = canvas.getContext('2d');

    // Destroy existing chart instance if it exists
    if (totalIncomeChartInstance) {
        totalIncomeChartInstance.destroy();
        totalIncomeChartInstance = null;
    }

    // Create an empty chart or set it to initial state
    totalIncomeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [], // Empty labels
            datasets: [{
                label: 'Total Income (₱)',
                data: [], // Empty data
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
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

// Function to reset Cubic Meter Consumption Chart to initial state
function resetCubicMeterChart() {
    const canvas = document.getElementById('cubicMeterChart');
    const ctx = canvas.getContext('2d');

    // Destroy existing chart instance if it exists
    if (cubicMeterChartInstance) {
        cubicMeterChartInstance.destroy();
        cubicMeterChartInstance = null;
    }

    // Create an empty chart or set it to initial state
    cubicMeterChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Empty labels
            datasets: [{
                label: 'Cubic Meter Consumption',
                data: [], // Empty data
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
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
        totalIncomeChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: incomeData.labels,
                datasets: [{
                    label: 'Total Income (₱)',
                    data: incomeData.values,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
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
        cubicMeterChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: consumptionData.labels,
                datasets: [{
                    label: 'Cubic Meter Consumption',
                    data: consumptionData.values,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
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
}

// Event listener for the dropdown change
document.addEventListener('DOMContentLoaded', () => {
    const yearDropdown = document.getElementById('yearFilter');
    yearDropdown.addEventListener('change', updateCharts);
    
    // Initial call to populate the charts
    updateCharts();

    // Add event listener for the reset button
    document.getElementById('resetButton').addEventListener('click', function () {
        // Fetch data from resetFilter.php
        fetch('./php/getChartData.php')
            .then(response => response.json())
            .then(data => {
                // Ensure totalIncomeData is defined
                if (data.totalIncomeData && Array.isArray(data.totalIncomeData)) {
                    createIncomeChart(data.totalIncomeData);
                } else {
                    console.error('totalIncomeData is not available or is not an array:', data.totalIncomeData);
                }

                // Ensure totalCubicMeterData is defined
                if (data.totalCubicMeterData && Array.isArray(data.totalCubicMeterData)) {
                    createCubicMeterChart(data.totalCubicMeterData);
                } else {
                    console.error('totalCubicMeterData is not available or is not an array:', data.totalCubicMeterData);
                }
            })
            .catch(error => console.error('Error fetching data:', error));
    });
});

// Function to create or replace the income chart
function createIncomeChart(data) {
    const ctx = document.getElementById('incomeMonthChart').getContext('2d');

    // Check if incomeChart already exists and destroy it if it does
    if (totalIncomeChartInstance) {
        totalIncomeChartInstance.destroy();
        totalIncomeChartInstance = null; // Ensure it's fully cleared
    }

    // Create the new chart
    totalIncomeChartInstance = new Chart(ctx, {
        type: 'bar', // or 'line', depending on your preference
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Total Income (₱)',
                data: data.values,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
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

// Function to create or replace the cubic meter chart
function createCubicMeterChart(data) {
    const ctx = document.getElementById('cubicMeterChart').getContext('2d');

    // Check if cubicMeterChart already exists and destroy it if it does
    if (cubicMeterChartInstance) {
        cubicMeterChartInstance.destroy();
        cubicMeterChartInstance = null; // Ensure it's fully cleared
    }

    // Create the new chart
    cubicMeterChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Cubic Meter Consumption',
                data: data.values,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
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
