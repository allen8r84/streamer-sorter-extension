// Priority Rooms Module - Manages favorite streamers
const priorityRoomsModule = (() => {
  // Module state
  let priorityRooms = [];
  let highlightColor = "#FFFF00";
  let visiblePriorityRoomsCount = 0;
  let storageModule; // Reference to storage module

  // Initialize module
  function init(initialRooms, initialColor) {
    // Import storage module if needed
    import(chrome.runtime.getURL('content/modules/storageModule.js'))
      .then(module => {
        storageModule = module.default;
      });
    
    priorityRooms = Array.isArray(initialRooms) ? initialRooms : [];
    highlightColor = initialColor || "#FFFF00";
    visiblePriorityRoomsCount = 0;
    
    console.log("Priority Rooms module initialized with", priorityRooms.length, "rooms");
    return { priorityRooms, highlightColor };
  }

  // Check if a room is in the priority list
  function isPriorityRoom(li) {
    const roomElement = li.querySelector('div.details > div > a');
    if (roomElement && roomElement.getAttribute('data-room')) {
      const roomName = roomElement.getAttribute('data-room');
      return priorityRooms.includes(roomName);
    }
    return false;
  }

  // Add a room to priority list
  function addPriorityRoom(roomName) {
    if (!priorityRooms.includes(roomName)) {
      priorityRooms.push(roomName);
      savePriorityRooms();
      return true;
    }
    return false;
  }

  // Remove room from priority list
  function removePriorityRoom(roomName) {
    const index = priorityRooms.indexOf(roomName);
    if (index !== -1) {
      priorityRooms.splice(index, 1);
      savePriorityRooms();
      return true;
    }
    return false;
  }

  // Save priority rooms to storage
  function savePriorityRooms() {
    // Save to Chrome storage
    if (storageModule) {
      storageModule.saveSettings('priorityRooms', priorityRooms);
    } else {
      // Fallback if storage module not available
      chrome.runtime.sendMessage({ 
        action: "saveSettings", 
        data: { priorityRooms: priorityRooms } 
      });
    }
    
    // Also save to localStorage for compatibility with original function
    try {
      localStorage.setItem('priorityRooms', JSON.stringify(priorityRooms));
    } catch (e) {
      console.error("Error saving to localStorage:", e);
    }
    
    // Also save to cookie as backup (like original function)
    try {
      setCookie('priorityRooms', JSON.stringify(priorityRooms), 365); // expires in 365 days
    } catch (e) {
      console.error("Error saving to cookie:", e);
    }
  }

  // Helper function to set a cookie
  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
  }

  // Update highlight color
  function setHighlightColor(color) {
    highlightColor = color;
    
    if (storageModule) {
      storageModule.saveSettings('highlightColor', color);
    } else {
      // Fallback if storage module not available
      chrome.runtime.sendMessage({ 
        action: "saveSettings", 
        data: { highlightColor: color } 
      });
    }
  }

  // Apply highlighting to a priority room element - USING DIRECT STYLING like original
  function highlightPriorityRoom(li, isPriority) {
    if (isPriority) {
      // Direct styling exactly like the original function
      li.style.backgroundColor = highlightColor; // Use the configured color
      li.style.border = "3px solid #FFD700"; // Gold border
      li.style.boxShadow = "0 0 10px rgba(255, 215, 0, 0.6)"; // Glowing effect
      visiblePriorityRoomsCount++;
    } else {
      // Reset styles
      li.style.backgroundColor = "";
      li.style.border = "";
      li.style.boxShadow = "";
    }
  }

  // Reset visible priority rooms counter
  function resetVisibleCount() {
    visiblePriorityRoomsCount = 0;
  }

  // Get all priority rooms
  function getAllPriorityRooms() {
    return [...priorityRooms];
  }

  // Get the number of visible priority rooms
  function getVisibleCount() {
    return visiblePriorityRoomsCount;
  }

  // Public API
  return {
    init,
    isPriorityRoom,
    addPriorityRoom,
    removePriorityRoom,
    setHighlightColor,
    highlightPriorityRoom,
    resetVisibleCount,
    getAllPriorityRooms,
    getVisibleCount
  };
})();

export default priorityRoomsModule;