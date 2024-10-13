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
                throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Fetched data:", data); // For debugging

            // Validate the received data structure
            if (data && data.dates && data.test_original_amounts && data.forecasted_amounts && data.test_original_cum && data.forecasted_cum && data.accuracy) {
                const dates = data.dates;
                const testOriginalAmounts = data.test_original_amounts.map(value => parseFloat(value).toFixed(2));
                const forecastedAmounts = data.forecasted_amounts.map(value => parseFloat(value).toFixed(2));
                const testOriginalCUM = data.test_original_cum.map(value => parseFloat(value).toFixed(2));
                const forecastedCUM = data.forecasted_cum.map(value => parseFloat(value).toFixed(2));

                // Display Monthly Income Chart (Amount)
                const incomeCtx = document.getElementById('monthlyIncomeChart');
                if (incomeCtx) {
                    const incomeChart = incomeCtx.getContext('2d');
                    new Chart(incomeChart, {
                        type: 'line',
                        data: {
                            labels: dates,
                            datasets: [
                                {
                                    label: 'Original Testing Income',
                                    data: testOriginalAmounts,
                                    borderColor: 'rgba(54, 162, 235, 1)',  // Blue for actual test values
                                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                    borderWidth: 1,
                                    borderDash: [5, 5]
                                },
                                {
                                    label: 'Forecasted Income per Month',
                                    data: forecastedAmounts,
                                    borderColor: 'rgba(255, 0, 0, 1)',  // Red for forecasted values
                                    backgroundColor: 'rgba(255, 0, 0, 0.2)',  // Light red background
                                    borderWidth: 1,
                                    borderDash: [10, 5]
                                }
                            ]
                        },
                        options: chartOptions('Income', '₱')
                    });
                }

                // Display Monthly CU_M Chart (CU_M)
                const cumCtx = document.getElementById('monthlyCUMChart');
                if (cumCtx) {
                    const cumChart = cumCtx.getContext('2d');
                    new Chart(cumChart, {
                        type: 'line',
                        data: {
                            labels: dates,
                            datasets: [
                                {
                                    label: 'Original Testing Cubic Meter',
                                    data: testOriginalCUM,
                                    borderColor: 'rgba(54, 162, 235, 1)',  // Blue for actual test values
                                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                    borderWidth: 1,
                                    borderDash: [5, 5]
                                },
                                {
                                    label: 'Forecasted Cubic Meter',
                                    data: forecastedCUM,
                                    borderColor: 'rgba(255, 0, 0, 1)',  // Red for forecasted values
                                    backgroundColor: 'rgba(255, 0, 0, 0.2)',  // Light red background
                                    borderWidth: 1,
                                    borderDash: [10, 5]
                                }
                            ]
                        },
                        options: chartOptions('Cubic Meter', '')
                    });
                }

                // Display accuracy metrics
                const accuracyDiv = document.getElementById('accuracyMetrics');
                if (accuracyDiv) {
                    const accuracyAmount = data.accuracy.amount;
                    const accuracyCUM = data.accuracy.cum;
                    accuracyDiv.innerHTML = `
                        <h3>Accuracy Metrics (Testing Data)</h3>
                        <p><strong>Amount Model:</strong></p>
                        <ul>
                            <li>MSE: ${accuracyAmount.mse.toFixed(2)}</li>
                            <li>RMSE: ${accuracyAmount.rmse.toFixed(2)}</li>
                            <li>MAE: ${accuracyAmount.mae.toFixed(2)}</li>
                            <li>MAPE: ${accuracyAmount.mape.toFixed(2)}%</li>
                        </ul>
                        <p><strong>CU_M Model:</strong></p>
                        <ul>
                            <li>MSE: ${accuracyCUM.mse.toFixed(2)}</li>
                            <li>RMSE: ${accuracyCUM.rmse.toFixed(2)}</li>
                            <li>MAE: ${accuracyCUM.mae.toFixed(2)}</li>
                            <li>MAPE: ${accuracyCUM.mape.toFixed(2)}%</li>
                        </ul>
                    `;
                }

                // Close SweetAlert2 loading alert after rendering charts and metrics
                Swal.close();
            } else {
                console.error('Invalid data format:', data);
                Swal.fire('Error', 'Invalid data format received.', 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            Swal.fire('Error', `There was an error fetching the predictions: ${error.message}`, 'error');
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
