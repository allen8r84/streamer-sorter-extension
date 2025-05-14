// Storage Module - Handles settings storage
const storageModule = (() => {
  // Settings reference
  let settings = {};

  // Initialize the module
  function init(initialSettings) {
    settings = initialSettings || {};
    console.log("Storage module initialized with settings:", settings);
    
    // Sync with localStorage for compatibility
    syncToLocalStorage();
  }

  // Save settings to Chrome storage and local fallbacks
  function saveSettings(key, value) {
    // Update local reference
    settings[key] = value;
    
    // Prepare data for saving
    const data = {};
    data[key] = value;
    
    // Save to Chrome storage
    const chromePromise = new Promise((resolve, reject) => {
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
    
    // Also save to localStorage as fallback
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
    }
    
    return chromePromise;
  }

  // Get a setting value
  function getSetting(key) {
    // Try from memory cache first
    if (settings[key] !== undefined) {
      return settings[key];
    }
    
    // Try localStorage fallback
    try {
      const localValue = localStorage.getItem(key);
      if (localValue) {
        const parsedValue = JSON.parse(localValue);
        settings[key] = parsedValue; // Update memory cache
        return parsedValue;
      }
    } catch (e) {
      console.error(`Error getting ${key} from localStorage:`, e);
    }
    
    return undefined;
  }

  // Update multiple settings at once
  function saveMultipleSettings(settingsObj) {
    // Update local reference for each key
    Object.keys(settingsObj).forEach(key => {
      settings[key] = settingsObj[key];
    });
    
    // Save to Chrome storage
    const chromePromise = new Promise((resolve, reject) => {
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
    
    // Also save to localStorage as fallback
    try {
      Object.keys(settingsObj).forEach(key => {
        localStorage.setItem(key, JSON.stringify(settingsObj[key]));
      });
    } catch (e) {
      console.error("Error saving multiple settings to localStorage:", e);
    }
    
    return chromePromise;
  }
  
  // Sync current settings to localStorage for compatibility
  function syncToLocalStorage() {
    try {
      Object.keys(settings).forEach(key => {
        localStorage.setItem(key, JSON.stringify(settings[key]));
      });
    } catch (e) {
      console.error("Error syncing settings to localStorage:", e);
    }
  }

  // Public API
  return {
    init,
    saveSettings,
    getSetting,
    saveMultipleSettings,
    syncToLocalStorage
  };
})();

export default storageModule;