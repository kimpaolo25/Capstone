document.addEventListener('DOMContentLoaded', function () {
    fetch('./php/descriptiveData.php')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched data:', data);  // Log all data for debugging

            // Ensure data is in the correct format
            const overallIncome = parseFloat(data.overallIncome);
            const incomesThisMonth = parseFloat(data.incomesThisMonth);
            const billsThisMonth = parseInt(data.billsThisMonth, 10);
            const billsThisYear = parseInt(data.billsThisYear, 10);
            const activeCount = parseInt(data.activeCount, 10);
            const inactiveCount = parseInt(data.inactiveCount, 10);

            // Log values to check if they are valid
            console.log('Overall Income:', overallIncome);
            console.log('Overall Income This Month:', incomesThisMonth);
            console.log('Bills This Month:', billsThisMonth);
            console.log('Bills This Year:', billsThisYear);
            console.log('Active Count:', activeCount);
            console.log('Inactive Count:', inactiveCount);

            // Check for NaN values
            if (isNaN(activeCount) || isNaN(inactiveCount)) {
                console.error('Active or Inactive count is NaN');
                return; // Stop execution if values are invalid
            }

            // Create formatters
            const currencyFormatter = new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP'
            });
            const numberFormatter = new Intl.NumberFormat('en-PH');

            // Update HTML elements with the fetched data
            document.getElementById('billsThisMonth').innerText = `${numberFormatter.format(billsThisMonth)} bill/s`;
            document.getElementById('billsThisYear').innerText = `${numberFormatter.format(billsThisYear)} bill/s`;
            document.getElementById('overallIncome').innerText = currencyFormatter.format(overallIncome);
            document.getElementById('overallIncomeThisMonth').innerText = currencyFormatter.format(incomesThisMonth);


            // Create the pie chart for meter status
            const ctx = document.getElementById('meterStatusChart').getContext('2d');
            const meterStatusChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Active', 'Inactive'],
                    datasets: [{
                        label: 'Meter Status',
                        data: [activeCount, inactiveCount],
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.6)', // Active color
                            'rgba(255, 99, 132, 0.6)'  // Inactive color
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 99, 132, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Allow the chart to be responsive
                    layout: {
                        padding: {
                            top: 20,
                            bottom: 20,
                            left: 20,
                            right: 20
                        }
                    },
                    aspectRatio: 1, // Maintain a square shape for the pie chart
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Meter Status: Active vs Inactive'
                        },
                        datalabels: {
                            formatter: (value, context) => {
                                const total = context.chart.data.datasets[context.datasetIndex].data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(2) + '%'; // Calculate percentage
                                return percentage; // Return percentage as label
                            },
                            color: 'white', // Change text color as needed
                            anchor: 'center', // Set anchor to center
                            align: 'center', // Set alignment to center
                            font: {
                                weight: 'bold',
                            }
                        }
                    }
                },
                plugins: [ChartDataLabels] // Register the datalabels plugin
            });

            // Function to generate random RGBA color
            function getRandomColor() {
                const r = Math.floor(Math.random() * 256); // Random red
                const g = Math.floor(Math.random() * 256); // Random green
                const b = Math.floor(Math.random() * 256); // Random blue
                const a = 0.2; // Set a fixed alpha for transparency
                return `rgba(${r}, ${g}, ${b}, ${a})`; // Return random color
            }

            // Total income per year chart
            const labelsYear = data.totalIncomePerYear.map(item => item.year);
            const valuesYear = data.totalIncomePerYear.map(item => {
                const value = parseFloat(item.total);
                if (isNaN(value)) {
                    console.error(`Invalid total value for Year ${item.year}: ${item.total}`);
                }
                return isNaN(value) ? 0 : value;
            });

            // Prepare datasets for each year with random colors
            const datasets = labelsYear.map((year, index) => ({
                label: year, // Set the label for each year
                data: [valuesYear[index]], // Wrap the value in an array to match the x-axis labels
                backgroundColor: getRandomColor(), // Generate random background color
                borderColor: getRandomColor(), // Generate random border color
                borderWidth: 1
            }));

            const ctxYear = document.getElementById('incomeChart').getContext('2d');
            const incomeChart = new Chart(ctxYear, {
                type: 'bar', // Change to 'bar'
                data: {
                    labels: ['Income Per Year'],
                    datasets: datasets // Use the prepared datasets
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: true, // Show the legend
                            onClick: function (event, legendItem) {
                                const index = legendItem.datasetIndex;
                                const chart = this.chart;

                                // Toggle the dataset visibility
                                const meta = chart.getDatasetMeta(index);
                                meta.hidden = !meta.hidden; // Toggle the visibility
                                chart.update(); // Update the chart
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            title: {
                                display: false,
                                text: 'Year' // X-axis label
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return currencyFormatter.format(value);
                                }
                            },
                            title: {
                                display: true,
                                text: 'Total Income (PHP)' // Y-axis label
                            }
                        }
                    }
                }
            });


            // Ensure 'total_income' is parsed as a number
            const labelsArea = data.totalIncomePerArea.map(item => item.places_name);
            const valuesArea = data.totalIncomePerArea.map(item => parseFloat(item.total_income)); // Explicitly parse as float

            // Generate a color for each area
            const backgroundColorsArea = valuesArea.map((_, index) => {
                const colors = [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)',
                ];
                return colors[index % colors.length]; // Loop through the colors array
            });

            // Generate border colors
            const borderColorsArea = valuesArea.map((_, index) => {
                const borderColors = [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                ];
                return borderColors[index % borderColors.length];
            });

            const ctxArea = document.getElementById('incomeAreaChart').getContext('2d');

            // Create individual datasets for each area
            const datasetsArea = labelsArea.map((area, index) => ({
                label: area, // The area name will be used as the label for each dataset
                data: [valuesArea[index]], // Each dataset will contain the income value for that area
                backgroundColor: backgroundColorsArea[index], // Assign the specific background color
                borderColor: borderColorsArea[index], // Assign the specific border color
                borderWidth: 1
            }));

            const incomeAreaChart = new Chart(ctxArea, {
                type: 'bar',
                data: {
                    labels: ['Total Income per Area'], // We can use a generic label for the X-axis
                    datasets: datasetsArea // Use the individual datasets for each area
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: true, // Enable the legend to show area-based labels
                            onClick: function (e, legendItem) {
                                const chart = this.chart;
                                const datasetIndex = legendItem.datasetIndex;

                                // Toggle the visibility of the selected dataset (area)
                                const meta = chart.getDatasetMeta(datasetIndex);
                                meta.hidden = meta.hidden === null ? !chart.data.datasets[datasetIndex].hidden : null;

                                // Update the chart to reflect changes
                                chart.update();
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: false,
                                text: 'Area' // X-axis label (it will just display "Total Income" in this case)
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return currencyFormatter.format(value); // Format Y-axis values as currency
                                }
                            },
                            title: {
                                display: true,
                                text: 'Total Income (PHP)' // Y-axis label
                            }
                        }
                    }
                }
            });




            // Total income per month chart
const labelsMonth = data.incomePerMonth.map(item => {
    const date = new Date(item.Date_column);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
});
const valuesMonth = data.incomePerMonth.map(item => {
    const value = parseFloat(item.total);
    if (isNaN(value)) {
        console.error(`Invalid total value for Month ${item.Date_column}: ${item.total}`);
    }
    return isNaN(value) ? 0 : value;
});

const ctxMonth = document.getElementById('incomeMonthChart').getContext('2d');
totalIncomeChartInstance = new Chart(ctxMonth, {
    type: 'line',
    data: {
        labels: labelsMonth,
        datasets: [{
            label: 'Total Income per Month',
            data: valuesMonth,
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: false // Hide labels at the top
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Month' // X-axis label
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return currencyFormatter.format(value);
                    }
                },
                title: {
                    display: true,
                    text: 'Total Income (PHP)' // Y-axis label
                }
            }
        }
    }
});

// Cubic meter consumption per month chart
const labelsCubicMeter = data.cubicMeterPerMonth.map(item => {
    const date = new Date(item.Date_column);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
});
const valuesCubicMeter = data.cubicMeterPerMonth.map(item => {
    const value = parseFloat(item.total);
    if (isNaN(value)) {
        console.error(`Invalid total value for Month ${item.Date_column}: ${item.total}`);
    }
    return isNaN(value) ? 0 : value;
});

const ctxCubicMeter = document.getElementById('cubicMeterChart').getContext('2d');
cubicMeterChartInstance = new Chart(ctxCubicMeter, {
    type: 'line',
    data: {
        labels: labelsCubicMeter,
        datasets: [{
            label: 'Cubic Meter Consumption per Month',
            data: valuesCubicMeter,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: false // Hide labels at the top
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Month' // X-axis label
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return value + ' m³';  // Display cubic meters (m³)
                    }
                },
                title: {
                    display: true,
                    text: 'Cubic Meters (m³)' // Y-axis label
                }
            }
        }
    }
});



        })
        .catch(error => console.error('Error fetching data:', error));
});