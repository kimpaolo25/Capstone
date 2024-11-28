// Function to open the activity logs modal
document.getElementById('activityLogsButton').addEventListener('click', function() {
    document.getElementById('activityLogsModal').style.display = 'block';
    
    // Call fetchActivityLogs when modal is opened
    fetchActivityLogs();
});

function fetchActivityLogs() {
    const logsList = document.getElementById('activityLogsList');
    
    // Clear existing logs
    logsList.innerHTML = '';

    // Fetch logs from the server
    fetch('./php/getLogs.php')
        .then(response => response.json())
        .then(logs => {
            console.log('Logs received:', logs);  // Debug logging
            
            // Check if logs exist and is an array
            if (Array.isArray(logs) && logs.length > 0) {
                // Render each log entry
                logs.forEach(log => {
                    const logEntry = document.createElement('li');
                    
                    // Create a span for the action with conditional coloring
                    const nameText = document.createTextNode(`${log.Name} `);
                    const actionSpan = document.createElement('span');
                    actionSpan.textContent = log.Action;
                    
                    // Color the action word
                    switch(log.Action.toLowerCase()) {
                        case 'added':
                            actionSpan.style.color = 'blue';
                            break;
                        case 'updated':
                            actionSpan.style.color = 'green';
                            break;
                        case 'deleted':
                            actionSpan.style.color = 'red';
                            break;
                    }
                    
                    const restText = document.createTextNode(` bill for ${log.recordAffected} on ${log.timestamp}`);
                    
                    // Combine the parts
                    logEntry.appendChild(nameText);
                    logEntry.appendChild(actionSpan);
                    logEntry.appendChild(restText);
                    
                    logsList.appendChild(logEntry);
                });
            } else {
                // Display a message if no logs are found
                const noLogsMessage = document.createElement('li');
                noLogsMessage.textContent = 'No activity logs found.';
                noLogsMessage.style.color = 'gray';
                logsList.appendChild(noLogsMessage);
            }
        })
        .catch(error => {
            console.error('Error fetching logs:', error);
            const errorMessage = document.createElement('li');
            errorMessage.textContent = 'Failed to load activity logs.';
            errorMessage.style.color = 'red';
            logsList.appendChild(errorMessage);
        });
}

// Function to close the activity logs modal
function closeActivityLogsModal() {
    document.getElementById('activityLogsModal').style.display = 'none';
}

// Close the modal when clicking outside of the modal content
window.addEventListener('click', function(event) {
    const modal = document.getElementById('activityLogsModal');
    if (event.target === modal) {
        closeActivityLogsModal();
    }
});