// Background script
// Handles extension-level events and communication between components

chrome.runtime.onInstalled.addListener(() => {
    console.log('Followed Streamers Sorter extension installed');
    
    // Initialize default extension settings in chrome.storage
    chrome.storage.sync.get(['priorityRooms', 'highlightColor', 'colorMode'], (result) => {
      // Default priority rooms if nothing is stored
      if (!result.priorityRooms) {
        chrome.storage.sync.set({
          priorityRooms: ["katyerave","mishabrizo","mariannacruzz","jeangreybianca","ericamiracle15","bunnydollstella","emilylittle","sia_woori","dakota_blare","diamond_jo_","doseofhappiness","marcela_davila1"]
        });
      }
      
      // Default highlight color
      if (!result.highlightColor) {
        chrome.storage.sync.set({
          highlightColor: "#FFFF00" // Bright yellow
        });
      }
      
      // Default color theme
      if (!result.colorMode) {
        chrome.storage.sync.set({
          colorMode: "light"
        });
      }
    });
  });
  
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getSettings") {
      chrome.storage.sync.get(['priorityRooms', 'highlightColor', 'colorMode'], (result) => {
        sendResponse(result);
      });
      return true; // Required for async sendResponse
    }
    
    if (message.action === "saveSettings") {
      chrome.storage.sync.set(message.data, () => {
        sendResponse({ success: true });
      });
      return true; // Required for async sendResponse
    }
  });