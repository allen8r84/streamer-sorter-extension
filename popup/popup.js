document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggleButton');
    const optionsButton = document.getElementById('optionsButton');
    const statusElement = document.getElementById('status');
    const priorityCountElement = document.getElementById('priorityCount');
    
    // Get extension state from storage
    chrome.storage.sync.get(['extensionEnabled', 'priorityRooms'], function(result) {
      const enabled = result.extensionEnabled !== false; // Default to enabled
      updateUI(enabled);
      
      if (result.priorityRooms) {
        priorityCountElement.textContent = result.priorityRooms.length;
      }
    });
    
    // Toggle extension state
    toggleButton.addEventListener('click', function() {
      chrome.storage.sync.get(['extensionEnabled'], function(result) {
        const currentState = result.extensionEnabled !== false;
        const newState = !currentState;
        
        chrome.storage.sync.set({ extensionEnabled: newState }, function() {
          updateUI(newState);
          
          // Notify content scripts about the change
          chrome.tabs.query({url: "*://*.chaturbate.com/*"}, function(tabs) {
            tabs.forEach(function(tab) {
              chrome.tabs.sendMessage(tab.id, { action: "toggleExtension", enabled: newState });
            });
          });
        });
      });
    });
    
    // Open options page
    optionsButton.addEventListener('click', function() {
      chrome.runtime.openOptionsPage();
    });
    
    // Update UI based on extension state
    function updateUI(enabled) {
      if (enabled) {
        statusElement.textContent = 'Enabled';
        statusElement.classList.remove('disabled');
        toggleButton.textContent = 'Disable';
        toggleButton.classList.remove('disabled');
      } else {
        statusElement.textContent = 'Disabled';
        statusElement.classList.add('disabled');
        toggleButton.textContent = 'Enable';
        toggleButton.classList.add('disabled');
      }
    }
  });