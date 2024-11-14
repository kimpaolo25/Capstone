document.addEventListener('DOMContentLoaded', function() {
    const dropdown = document.getElementById('dateFilter');
    const overallIncomeThisMonthElement = document.getElementById('overallIncomeThisMonth');
    const billsThisMonthElement = document.getElementById('billsThisMonth');
    const incomeAreaChartElement = document.getElementById('incomeAreaChart');
    let meterStatusChart = null;
    let incomeAreaChart = null;

    // Populate dropdown with unique dates
    fetch('./php/upperFilter.php?action=getDates')
        .then(response => response.json())
        .then(dates => {
            dates.forEach(dateObj => {
                const option = document.createElement('option');
                option.value = dateObj.full;  // Use full date for backend calculations
                option.textContent = dateObj.display;  // Use display date for dropdown text
                dropdown.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching dates:', error));

    // Add event listener for dropdown changes
    dropdown.addEventListener('change', function() {
        const selectedDate = dropdown.value;
        console.log("Selected Date:", selectedDate);

        if (selectedDate) {
            // Fetch total amount for the selected date
            fetchTotalAmount(selectedDate);
            
            // Fetch total number of bills for the selected date
            fetchBillsCount(selectedDate);

            // Fetch active/inactive meter status for the selected date
            fetchMeterStatus(selectedDate);

            // Fetch total income per area for the selected date
            fetchIncomePerArea(selectedDate);
        } else {
            overallIncomeThisMonthElement.textContent = 'Please select a date';
            billsThisMonthElement.textContent = 'Please select a date';
        }
    });

    // Add the reset filter button functionality
    const resetButton = document.getElementById('resetFilter');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            console.log("Resetting filter to current month's data.");

            // Reset the date filter
            document.getElementById('dateFilter').selectedIndex = 0;

            // Fetch data for all years
            fetchIncomePerAreaAllYears();  // Fetch all data across all years

            // Fetch the current month's total bills and expected income
            fetch('./php/upperFilter.php?action=getCurrentMonthData')
                .then(response => response.json())
                .then(data => {
                    // Handle the data for current month
                    const billsCount = data.billsCount;
                    const expectedIncome = data.expectedIncome;

                    // Format the expected income to be in pesos format
                    const currencyFormatter = new Intl.NumberFormat('en-PH', {
                        style: 'currency',
                        currency: 'PHP'
                    });

                    // Display the current month's data on the page
                    document.getElementById('billsThisMonth').innerText = billsCount ? `${billsCount} bill/s` : 'No data available';
                    document.getElementById('overallIncomeThisMonth').innerText = expectedIncome ? currencyFormatter.format(expectedIncome) : 'No data available';
                })
                .catch(error => {
                    console.error('Error fetching current month data:', error);
                    document.getElementById('billsThisMonth').innerText = 'Error loading data';
                    document.getElementById('overallIncomeThisMonth').innerText = 'Error loading data';
                });

            // Fetch the meter status for the reset period
            fetchMeterStatusAllYears('currentMonth'); // Replace with a variable or method for your reset logic
        });
    }

    // Fetch total amount for the selected date
    function fetchTotalAmount(date) {
        fetch(`./php/upperFilter.php?date=${date}&action=getTotalAmount`)
            .then(response => response.json())
            .then(data => {
                const totalAmount = data.totalAmount || 0;
                overallIncomeThisMonthElement.textContent = `₱${totalAmount.toLocaleString()}`;
            })
            .catch(error => console.error('Error fetching total amount:', error));
    }

    // Fetch total number of bills for the selected date
    function fetchBillsCount(date) {
        fetch(`./php/upperFilter.php?date=${date}&action=getBillsCount`)
            .then(response => response.json())
            .then(data => {
                const billsCount = data.billsCount || 0;
                billsThisMonthElement.textContent = `${billsCount} bill(s)`;
            })
            .catch(error => console.error('Error fetching bills count:', error));
    }

    // Fetch meter status for the selected date
    function fetchMeterStatus(date) {
        fetch(`./php/upperFilter.php?date=${date}&action=getMeterStatus`)
            .then(response => response.json())
            .then(data => {
                const active = parseInt(data.active, 10);
                const inactive = parseInt(data.inactive, 10);
                console.log("Meter Status Data:", { active, inactive });

                const totalDataPoints = active + inactive;
                if (totalDataPoints === 0) {
                    console.log("No data available for the selected date.");
                    return;
                }

                const activePercentage = ((active / totalDataPoints) * 100).toFixed(2);
                const inactivePercentage = ((inactive / totalDataPoints) * 100).toFixed(2);

                const chartData = {
                    labels: ['Active', 'Inactive'],
                    datasets: [{
                        label: 'Meter Status',
                        data: [active, inactive],
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.6)',  // Active color
                            'rgba(255, 99, 132, 0.6)'   // Inactive color
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',  // Active border color
                            'rgba(255, 99, 132, 1)'   // Inactive border color
                        ],
                        borderWidth: 1
                    }]
                };

                const canvasContainer = document.querySelector('.descDashboardPie .card_chart');
                const oldCanvas = document.getElementById('meterStatusChart');

                // If the canvas exists, remove it to reset and create a fresh one
                if (oldCanvas) {
                    oldCanvas.remove();  // Remove the old canvas
                    console.log("Removed old canvas");
                }

                // Create a new canvas element
                const newCanvas = document.createElement('canvas');
                newCanvas.id = 'meterStatusChart';
                canvasContainer.appendChild(newCanvas);

                // Create the new chart instance
                meterStatusChart = new Chart(newCanvas.getContext('2d'), {
                    type: 'pie',
                    data: chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: {
                            padding: {
                                top: 20,
                                bottom: 20,
                                left: 20,
                                right: 20
                            }
                        },
                        plugins: {
                            legend: { position: 'top' },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.raw || 0;
                                        return `${label}: ${value}`;
                                    }
                                }
                            },
                            title: {
                                display: true,
                                text: 'Meter Status: Active vs Inactive'
                            },
                            datalabels: {
                                formatter: (value, context) => {
                                    const label = context.chart.data.labels[context.dataIndex];
                                    const percentage = label === 'Active' ? activePercentage : inactivePercentage;
                                    return `${percentage}%`;
                                },
                                color: 'white',
                                anchor: 'center',
                                align: 'center',
                                font: { weight: 'bold' }
                            }
                        }
                    },
                    plugins: [ChartDataLabels]
                });

                console.log("New chart instance created");
            })
            .catch(error => console.error('Error fetching meter status:', error));
    }

    // Function to fetch income per area for the selected date
    function fetchIncomePerArea(date) {
        fetch(`./php/upperFilter.php?date=${date}&action=getIncomePerArea`)
            .then(response => response.json())
            .then(data => {
                console.log("Income per Area Data (Filtered):", data);
                if (data && Array.isArray(data) && data.length > 0) {
                    const labels = data.map(item => item.area);
                    const incomes = data.map(item => item.income);
                    updateIncomeAreaChart(labels, incomes);
                } else {
                    console.error("Invalid or empty data received:", data);
                    incomeAreaChartElement.innerHTML = '<p>No data available for the selected date.</p>';
                    if (incomeAreaChart) {
                        incomeAreaChart.destroy();
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching income per area:', error);
                incomeAreaChartElement.innerHTML = '<p>Error fetching data. Please try again later.</p>';
            });
    }

    // Function to fetch all income per area data across all years (for the reset functionality)
    function fetchIncomePerAreaAllYears() {
        fetch('./php/upperFilter.php?action=getIncomePerAreaAllYears')
            .then(response => response.json())
            .then(data => {
                console.log("Income per Area Data (All Years):", data);
                if (data && Array.isArray(data) && data.length > 0) {
                    const labels = data.map(item => item.area);
                    const incomes = data.map(item => item.income);
                    updateIncomeAreaChart(labels, incomes);
                } else {
                    console.error("Invalid or empty data received:", data);
                    incomeAreaChartElement.innerHTML = '<p>No data available for all years.</p>';
                    if (incomeAreaChart) {
                        incomeAreaChart.destroy();
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching income per area for all years:', error);
                incomeAreaChartElement.innerHTML = '<p>Error fetching data. Please try again later.</p>';
            });
    }

    // Set fixed width and height (matching the initial chart's dimensions)
    const fixedWidth = 600; // Adjust as necessary
    const fixedHeight = 300; // Adjust as necessary

    // Update the income area chart with the selected data (filtered or all years)
    function updateIncomeAreaChart(labels, incomes) {
        // Destroy the previous chart if it exists
        if (incomeAreaChart) {
            incomeAreaChart.destroy(); // Destroy previous chart
        }

        // Get the canvas container
        const canvasContainer = document.querySelector('.card_chart');
        let canvas = document.getElementById('incomeAreaChart');

        if (!canvas) {
            // If the canvas doesn't exist, create a new one
            canvas = document.createElement('canvas');
            canvas.id = 'incomeAreaChart';
            canvasContainer.appendChild(canvas);
        } else {
            // Clear the canvas before creating a new chart
            canvas.width = canvas.width; // This resets the canvas
        }

        // Set the canvas size to fixed values
        canvas.width = fixedWidth;
        canvas.height = fixedHeight;

        // Generate a color for each area
        const backgroundColorsArea = incomes.map((_, index) => {
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
        const borderColorsArea = incomes.map((_, index) => {
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

        // Create individual datasets for each area
        const datasetsArea = labels.map((area, index) => ({
            label: area, // The area name will be used as the label for each dataset
            data: [incomes[index]], // Each dataset will contain the income value for that area
            backgroundColor: backgroundColorsArea[index], // Assign the specific background color
            borderColor: borderColorsArea[index], // Assign the specific border color
            borderWidth: 1
        }));

        // Generate the chart with the new data
        incomeAreaChart = new Chart(canvas.getContext('2d'), {
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
                                return `₱${value.toLocaleString()}`; // Format Y-axis values as currency
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
        console.log("New chart instance created with fixed size");
    }

    // Fetch meter status for all years
    function fetchMeterStatusAllYears() {
    fetch('./php/upperFilter.php?action=getCurrentMonthData')
        .then(response => response.json())
        .then(data => {
            const active = parseInt(data.activeMeters, 10);
            const inactive = parseInt(data.inactiveMeters, 10);
            console.log("Meter Status Data:", { active, inactive });

            const totalDataPoints = active + inactive;
            if (totalDataPoints === 0) {
                console.log("No data available for the selected year.");
                return;
            }

            const activePercentage = ((active / totalDataPoints) * 100).toFixed(2);
            const inactivePercentage = ((inactive / totalDataPoints) * 100).toFixed(2);

            const chartData = {
                labels: ['Active', 'Inactive'],
                datasets: [{
                    label: 'Meter Status',
                    data: [active, inactive],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',  // Active color
                        'rgba(255, 99, 132, 0.6)'   // Inactive color
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',  // Active border color
                        'rgba(255, 99, 132, 1)'   // Inactive border color
                    ],
                    borderWidth: 1
                }]
            };

            const canvasContainer = document.querySelector('.descDashboardPie .card_chart');
            const oldCanvas = document.getElementById('meterStatusChart');
            if (oldCanvas) {
                // Destroy the old chart before removing the canvas
                if (meterStatusChart) {
                    meterStatusChart.destroy();  // Destroy the existing chart
                }
                canvasContainer.removeChild(oldCanvas);  // Remove the old canvas
            }

            const newCanvas = document.createElement('canvas');
            newCanvas.id = 'meterStatusChart';
            canvasContainer.appendChild(newCanvas);

            meterStatusChart = new Chart(newCanvas.getContext('2d'), {
                type: 'pie',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 20,
                            bottom: 20,
                            left: 20,
                            right: 20
                        }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    return `${label}: ${value}`;
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: 'Meter Status: Active vs Inactive'
                        },
                        datalabels: {
                            formatter: (value, context) => {
                                const label = context.chart.data.labels[context.dataIndex];
                                const percentage = label === 'Active' ? activePercentage : inactivePercentage;
                                return `${percentage}%`;
                            },
                            color: 'white',
                            anchor: 'center',
                            align: 'center',
                            font: { weight: 'bold' }
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });
            console.log("New chart instance created");
        })
        .catch(error => console.error('Error fetching meter status:', error));
}

});
