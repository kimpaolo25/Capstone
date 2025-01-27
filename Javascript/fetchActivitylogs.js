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
                    logEntry.textContent = `${log.Name} ${log.Action} bill for ${log.recordAffected} on ${log.timestamp}`;
                    
                    // Color the log entry based on the action
                    switch(log.Action.toLowerCase()) {
                        case 'added':
                            logEntry.style.color = 'blue';
                            break;
                        case 'updated':
                            logEntry.style.color = 'green';
                            break;
                        case 'deleted':
                            logEntry.style.color = 'red';
                            break;
                        default:
                            logEntry.style.color = 'black';
                    }
                    
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