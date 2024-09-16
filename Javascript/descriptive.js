document.addEventListener('DOMContentLoaded', function() {
    fetch('./php/descriptiveData.php')
        .then(response => response.json())
        .then(data => {
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

            if (!isNaN(overallIncome)) {
                // Update HTML elements with the fetched data
                document.getElementById('billsThisMonth').innerText = `${numberFormatter.format(billsThisMonth)} bill/s`;
                document.getElementById('billsThisYear').innerText = `${numberFormatter.format(billsThisYear)} bill/s`;
                document.getElementById('overallIncome').innerText = currencyFormatter.format(overallIncome);
            } else {
                console.error('Overall income is not a valid number:', data.overallIncome);
                document.getElementById('overallIncome').innerText = 'Error loading data';
            }
        })
        .catch(error => console.error('Error fetching data:', error));
});
