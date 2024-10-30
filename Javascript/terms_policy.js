   // Function to show the Terms and Conditions modal
   function showTermsModal() {
    document.getElementById('termsModal').style.display = 'flex';
}

// Function to hide the Terms and Conditions modal
function hideTermsModal() {
    document.getElementById('termsModal').style.display = 'none';
}

// Function to show the Privacy Policy modal
function showPrivacyModal() {
    document.getElementById('privacyModal').style.display = 'flex';
}

// Function to hide the Privacy Policy modal
function hidePrivacyModal() {
    document.getElementById('privacyModal').style.display = 'none';
}

// Function to close the modal when clicking outside of it
function closeModalOnOutsideClick(modalId) {
    const modal = document.getElementById(modalId);
    modal.addEventListener('click', function(event) {
        // Check if the click target is the modal itself (backdrop)
        if (event.target === modal) {
            hideTermsModal();  // Adjust this to hide the correct modal
            hidePrivacyModal();
        }
    });
}

// Call the function for both modals
closeModalOnOutsideClick('termsModal');
closeModalOnOutsideClick('privacyModal');