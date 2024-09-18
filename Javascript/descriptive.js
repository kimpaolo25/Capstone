document.addEventListener('DOMContentLoaded', function() {
    fetch('./php/descriptiveData.php')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched data:', data);  // Log all data for debugging

            // Ensure data is in the correct format
            const overallIncome = parseFloat(data.overallIncome);
            const billsThisMonth = parseInt(data.billsThisMonth, 10);
            const billsThisYear = parseInt(data.billsThisYear, 10);

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

            // Total income per year chart
            const labelsYear = data.totalIncomePerYear.map(item => item.year);
            const valuesYear = data.totalIncomePerYear.map(item => {
                const value = parseFloat(item.total);
                if (isNaN(value)) {
                    console.error(`Invalid total value for Year ${item.year}: ${item.total}`);
                }
                return isNaN(value) ? 0 : value;
            });

            const ctxYear = document.getElementById('incomeChart').getContext('2d');
            new Chart(ctxYear, {
                type: 'line',
                data: {
                    labels: labelsYear,
                    datasets: [{
                        label: 'Total Income per Year',
                        data: valuesYear,
                        borderColor: 'rgba(0, 123, 255, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
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
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Year' // X-axis label
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
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
            new Chart(ctxArea, {
                type: 'bar',
                data: {
                    labels: labelsArea,
                    datasets: [{
                        data: valuesArea,
                        backgroundColor: backgroundColorsArea,
                        borderColor: borderColorsArea,
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
                                text: 'Area' // X-axis label
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
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
            
            
            


            // Total income per month chart
            const labelsMonth = data.incomePerMonth.map(item => item.Date_column);
            const valuesMonth = data.incomePerMonth.map(item => {
                const value = parseFloat(item.total);
                if (isNaN(value)) {
                    console.error(`Invalid total value for Month ${item.Date_column}: ${item.total}`);
                }
                return isNaN(value) ? 0 : value;
            });

            const ctxMonth = document.getElementById('incomeMonthChart').getContext('2d');
            new Chart(ctxMonth, {
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
                                callback: function(value) {
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
            const labelsCubicMeter = data.cubicMeterPerMonth.map(item => item.Date_column);
            const valuesCubicMeter = data.cubicMeterPerMonth.map(item => {
                const value = parseFloat(item.total);
                if (isNaN(value)) {
                    console.error(`Invalid total value for Month ${item.Date_column}: ${item.total}`);
                }
                return isNaN(value) ? 0 : value;
            });

            const ctxCubicMeter = document.getElementById('cubicMeterChart').getContext('2d');
            new Chart(ctxCubicMeter, {
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
                                callback: function(value) {
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
