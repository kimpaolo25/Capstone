document.addEventListener('DOMContentLoaded', function() {
    // Show SweetAlert2 loading alert
    Swal.fire({
        title: 'Loading...',
        text: 'Please wait while the charts are being loaded.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    fetch('http://127.0.0.1:5000/predict')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Fetched data:", data); // For debugging

            if (data && data.dates && data.historical_amounts && data.forecasted_amounts && data.historical_cum && data.forecasted_cum) {
                const dates = data.dates;
                const historicalAmounts = data.historical_amounts.map(value => parseFloat(value).toFixed(2));
                const forecastedAmounts = data.forecasted_amounts.map(value => value ? parseFloat(value).toFixed(2) : null);
                const historicalCUM = data.historical_cum.map(value => parseFloat(value).toFixed(2));
                const forecastedCUM = data.forecasted_cum.map(value => value ? parseFloat(value).toFixed(2) : null);

                // Display Monthly Income Chart
                const incomeCtx = document.getElementById('monthlyIncomeChart');
                if (incomeCtx) {
                    const incomeChart = incomeCtx.getContext('2d');
                    new Chart(incomeChart, {
                        type: 'line',
                        data: {
                            labels: dates,
                            datasets: [
                                {
                                    label: 'Historical Income per Month',
                                    data: historicalAmounts,
                                    borderColor: 'rgba(255, 99, 132, 1)',
                                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                    borderWidth: 1
                                },
                                {
                                    label: 'Forecasted Income per Month',
                                    data: forecastedAmounts,
                                    borderColor: 'rgba(75, 192, 192, 1)',
                                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                    borderWidth: 1,
                                    borderDash: [5, 5]
                                }
                            ]
                        },
                        options: chartOptions('Income', '₱')
                    });
                }

                // Display Monthly CU_M Chart
                const cumCtx = document.getElementById('monthlyCUMChart');
                if (cumCtx) {
                    const cumChart = cumCtx.getContext('2d');
                    new Chart(cumChart, {
                        type: 'line',
                        data: {
                            labels: dates,
                            datasets: [
                                {
                                    label: 'Historical Cubic Meter',
                                    data: historicalCUM,
                                    borderColor: 'rgba(54, 162, 235, 1)',
                                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                    borderWidth: 1
                                },
                                {
                                    label: 'Forecasted Cubic Meter',
                                    data: forecastedCUM,
                                    borderColor: 'rgba(255, 165, 0, 1)', // Change color to orange
                                    backgroundColor: 'rgba(255, 165, 0, 0.2)', // Change color to orange
                                    borderWidth: 1,
                                    borderDash: [5, 5]
                                }
                            ]
                        },
                        options: chartOptions('Cubic Meter', '')
                    });
                }

                // Close SweetAlert2 loading alert after rendering charts
                Swal.close();
            } else {
                console.error('Invalid data format:', data);
                alert('Invalid data format received.');
                Swal.close();
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('There was an error fetching the predictions.');
            Swal.close();
        });
});

// Utility function to create chart options
function chartOptions(label, unit) {
    return {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: function(tooltipItem) {
                        return `${unit}${parseFloat(tooltipItem.raw).toFixed(2)}`; // Format tooltips to 2 decimal places and append unit
                    }
                }
            }
        },
        scales: {
            x: { title: { display: true, text: 'Date' } },
            y: { 
                title: { display: true, text: label },
                ticks: {
                    callback: function(value) { return `${unit}${parseFloat(value).toFixed(2)}`; } // Format y-axis labels to 2 decimal places and append unit
                }
            }
        }
    };
}
