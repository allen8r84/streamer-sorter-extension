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
    
    // Set CSS custom property for highlight color
    document.documentElement.style.setProperty('--fssorter-highlight-color', highlightColor);
    
    console.log("Priority Rooms module initialized with", priorityRooms.length, "rooms");
    return { priorityRooms, highlightColor };
  }

  // Check if a room is in the priority list
  function isPriorityRoom(li) {
    // Safety check for li
    if (!li || !(li instanceof Element)) {
      console.warn("Invalid list item passed to isPriorityRoom");
      return false;
    }

    // Try multiple selectors to find room name
    let roomElement = li.querySelector('div.details > div > a');
    let roomName = null;
    
    // Primary attempt: data-room attribute
    if (roomElement && roomElement.hasAttribute('data-room')) {
      roomName = roomElement.getAttribute('data-room');
    } else {
      // Fallback methods:
      
      // Try direct href attribute on any anchor
      const anchors = li.querySelectorAll('a');
      for (const anchor of anchors) {
        if (anchor.href) {
          const pathMatch = anchor.href.match(/\/([^\/]+)\/?$/);
          if (pathMatch && pathMatch[1]) {
            roomName = pathMatch[1];
            break;
          }
        }
      }
      
      // If still not found, try looking for any element with room data
      if (!roomName) {
        const roomDataElements = li.querySelectorAll('[data-room], [data-roomname], [data-model], [data-username]');
        for (const elem of roomDataElements) {
          for (const attr of ['data-room', 'data-roomname', 'data-model', 'data-username']) {
            if (elem.hasAttribute(attr)) {
              roomName = elem.getAttribute(attr);
              break;
            }
          }
          if (roomName) break;
        }
        
        // Last resort: try to extract from any text content that looks like a username
        if (!roomName) {
          const allText = li.textContent;
          const usernameMatch = allText.match(/\b[a-zA-Z0-9_]{3,20}\b/);
          if (usernameMatch) {
            roomName = usernameMatch[0];
            console.warn("Extracted potential room name from text:", roomName);
          }
        }
      }
    }
    
    if (!roomName) {
      console.warn("Could not identify room name for list item", li);
      return false;
    }
    
    return priorityRooms.includes(roomName.toLowerCase());
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
    if (storageModule) {
      storageModule.saveSettings('priorityRooms', priorityRooms);
    } else {
      // Fallback if storage module not available
      chrome.runtime.sendMessage({ 
        action: "saveSettings", 
        data: { priorityRooms: priorityRooms } 
      });
    }
  }

  // Update highlight color
  function setHighlightColor(color) {
    highlightColor = color;
    
    // Update CSS custom property for highlight color
    document.documentElement.style.setProperty('--fssorter-highlight-color', highlightColor);
    
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

  // Apply highlighting to a priority room element
  function highlightPriorityRoom(li, isPriority) {
    // Safety check for li
    if (!li || !(li instanceof Element)) {
      console.warn("Invalid list item passed to highlightPriorityRoom");
      return;
    }

    try {
      if (isPriority) {
        li.classList.add('fssorter-priority-room');
        visiblePriorityRoomsCount++;
      } else {
        li.classList.remove('fssorter-priority-room');
      }
    } catch (error) {
      console.warn("Error applying priority room styling:", error);
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