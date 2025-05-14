// priorityRoomsModule.js - Updated isPriorityRoom function
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

// priorityRoomsModule.js - Updated highlightPriorityRoom function
function highlightPriorityRoom(li, isPriority) {
  // Safety check for li
  if (!li || !(li instanceof Element)) {
    console.warn("Invalid list item passed to highlightPriorityRoom");
    return;
  }

  if (isPriority) {
    try {
      li.style.backgroundColor = highlightColor;
      li.style.border = "3px solid #FFD700"; // Gold border
      li.style.boxShadow = "0 0 10px rgba(255, 215, 0, 0.6)"; // Glowing effect
      visiblePriorityRoomsCount++;
    } catch (error) {
      console.warn("Error applying priority room styling:", error);
    }
  } else {
    try {
      li.style.backgroundColor = "";
      li.style.border = "";
      li.style.boxShadow = "";
    } catch (error) {
      console.warn("Error resetting room styling:", error);
    }
  }
}