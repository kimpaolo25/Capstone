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

            if (data && data.dates && data.predictions) {
                const dates = data.dates;
                const predictions = data.predictions.map(value => parseFloat(value).toFixed(2));
                const cumPredictions = data.cum_predictions.map(value => parseFloat(value).toFixed(2));
                const areaIncomePredictions = data.area_income_predictions;
                const areaCumPredictions = data.area_cum_predictions;

                // Define a color map
                const colorMap = {};
                const colorList = [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(201, 203, 207, 1)'
                ];

                // Generate a color map based on unique areas
                Object.keys(areaIncomePredictions).forEach((area, index) => {
                    colorMap[area] = colorList[index % colorList.length];
                });

                // Display Monthly Income Chart
                const incomeCtx = document.getElementById('monthlyIncomeChart');
                if (incomeCtx) {
                    const incomeChart = incomeCtx.getContext('2d');
                    new Chart(incomeChart, {
                        type: 'line',
                        data: {
                            labels: dates,
                            datasets: [{
                                label: 'Predicted Income per Month',
                                data: predictions,
                                borderColor: 'rgba(75, 192, 192, 1)',
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                borderWidth: 1
                            }]
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
                            datasets: [{
                                label: 'Predicted CU_M per Month',
                                data: cumPredictions,
                                borderColor: 'rgba(54, 162, 235, 1)',
                                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                borderWidth: 1
                            }]
                        },
                        options: chartOptions('Cubic per Meter', 'm³')
                    });
                }

                // Display Income per Area Chart
                const areaCtx = document.getElementById('incomePerAreaChart');
                if (areaCtx) {
                    const areaChart = areaCtx.getContext('2d');
                    const datasets = Object.keys(areaIncomePredictions).map(area => ({
                        label: area,
                        data: areaIncomePredictions[area].map(value => parseFloat(value).toFixed(2)), // Format to 2 decimal places
                        borderColor: colorMap[area],
                        backgroundColor: colorMap[area].replace('1)', '0.2)'),
                        borderWidth: 1
                    }));

                    new Chart(areaChart, {
                        type: 'bar',
                        data: {
                            labels: dates,
                            datasets: datasets
                        },
                        options: chartOptions('Income', '₱')
                    });
                }

                // Display CU_M per Area Chart
                const cumAreaCtx = document.getElementById('cumPerAreaChart');
                if (cumAreaCtx) {
                    const cumAreaChart = cumAreaCtx.getContext('2d');
                    const areaCumDatasets = Object.keys(areaCumPredictions).map(area => ({
                        label: area,
                        data: areaCumPredictions[area].map(value => parseFloat(value).toFixed(2)), // Format to 2 decimal places
                        borderColor: colorMap[area],
                        backgroundColor: colorMap[area].replace('1)', '0.2)'),
                        borderWidth: 1
                    }));

                    new Chart(cumAreaChart, {
                        type: 'bar',
                        data: {
                            labels: dates,
                            datasets: areaCumDatasets
                        },
                        options: chartOptions('Cubic per Meter', 'm³')
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

// Utility function to generate random colors
function getRandomColor(alpha = 1) {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
