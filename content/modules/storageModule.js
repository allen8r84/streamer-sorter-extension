// Storage Module - Handles settings storage
const storageModule = (() => {
    // Settings reference
    let settings = {};
  
    // Initialize the module
    function init(initialSettings) {
      settings = initialSettings || {};
      console.log("Storage module initialized with settings:", settings);
    }
  
    // Save settings to Chrome storage
    function saveSettings(key, value) {
      // Update local reference
      settings[key] = value;
      
      // Prepare data for saving
      const data = {};
      data[key] = value;
      
      // Save to Chrome storage
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ 
          action: "saveSettings", 
          data: data 
        }, (response) => {
          if (response && response.success) {
            console.log(`Successfully saved ${key} to Chrome storage`);
            resolve(true);
          } else {
            console.error(`Failed to save ${key} to Chrome storage`);
            reject(new Error("Save failed"));
          }
        });
      });
    }
  
    // Get a setting value
    function getSetting(key) {
      return settings[key];
    }
  
    // Update multiple settings at once
    function saveMultipleSettings(settingsObj) {
      // Update local reference for each key
      Object.keys(settingsObj).forEach(key => {
        settings[key] = settingsObj[key];
      });
      
      // Save to Chrome storage
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ 
          action: "saveSettings", 
          data: settingsObj 
        }, (response) => {
          if (response && response.success) {
            console.log("Successfully saved multiple settings to Chrome storage");
            resolve(true);
          } else {
            console.error("Failed to save multiple settings to Chrome storage");
            reject(new Error("Save failed"));
          }
        });
      });
    }
  
    // Public API
    return {
      init,
      saveSettings,
      getSetting,
      saveMultipleSettings
    };
  })();
  
  export default storageModule;