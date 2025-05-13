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
      if (isPriority) {
        li.style.backgroundColor = highlightColor;
        li.style.border = "3px solid #FFD700"; // Gold border
        li.style.boxShadow = "0 0 10px rgba(255, 215, 0, 0.6)"; // Glowing effect
        visiblePriorityRoomsCount++;
      } else {
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