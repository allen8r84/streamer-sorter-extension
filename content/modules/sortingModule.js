// Sorting Module - Handles room list sorting
const sortingModule = (() => {
  // Module state
  let currentSortBy = 'time';
  let currentTimeOrder = 'desc';
  let currentViewersOrder = 'desc';
  let isPriorityRoomFn = null;
  let highlightPriorityRoomFn = null;

  // Initialize the module with dependency functions
  function init(isPriorityRoom, highlightPriorityRoom) {
    isPriorityRoomFn = isPriorityRoom;
    highlightPriorityRoomFn = highlightPriorityRoom;
    console.log("Sorting module initialized");
  }

  // Extract time value from an li element and convert it to minutes
  function extractTimeInMinutes(li) {
    // Safety check for li
    if (!li || !(li instanceof Element)) {
      console.warn("Invalid list item passed to extractTimeInMinutes");
      return 0;
    }
  
    // Find the time span within the li with expanded selector fallbacks
    let timeSpan = li.querySelector('div.details > ul.sub-info.camAltTextColor > li.cams > span.time');
    
    // Try alternative selectors if the primary one fails
    if (!timeSpan) {
      // Try a less specific selector
      timeSpan = li.querySelector('span.time');
      
      // If still not found, try other potential selectors
      if (!timeSpan) {
        timeSpan = li.querySelector('[class*="time"]');
        
        // If we still can't find it, log and return default
        if (!timeSpan) {
          console.warn("Time element not found in list item", li);
          return 0;
        }
      }
    }
  
    const timeText = timeSpan.textContent.trim();
    
    // Extract the numeric value and determine if it's hours or minutes
    let minutes = 0;
  
    try {
      if (timeText.includes('hrs') || timeText.includes('hr')) {
        // Convert hours to minutes
        const hours = parseFloat(timeText.split(' ')[0]) || 0;
        minutes = hours * 60;
      } else if (timeText.includes('mins') || timeText.includes('min')) {
        // Already in minutes
        minutes = parseFloat(timeText.split(' ')[0]) || 0;
      }
    } catch (error) {
      console.warn("Error parsing time text:", timeText, error);
      // Return 0 on parsing error
    }
  
    return minutes;
  }

  // Extract viewer count from an li element
  function extractViewerCount(li) {
    // Safety check for li
    if (!li || !(li instanceof Element)) {
      console.warn("Invalid list item passed to extractViewerCount");
      return 0;
    }
  
    // Find the viewers span with expanded selector fallbacks
    let viewersSpan = li.querySelector('div.details > ul.sub-info.camAltTextColor > li.cams > span.viewers');
    
    // Try alternative selectors if the primary one fails
    if (!viewersSpan) {
      // Try a less specific selector
      viewersSpan = li.querySelector('span.viewers');
      
      // If still not found, try other potential selectors
      if (!viewersSpan) {
        viewersSpan = li.querySelector('[class*="viewer"]');
        
        // If we still can't find it, log and return default
        if (!viewersSpan) {
          console.warn("Viewers element not found in list item", li);
          return 0;
        }
      }
    }
  
    const viewersText = viewersSpan.textContent.trim();
  
    // Extract just the number from text like "123 viewers"
    try {
      const viewersMatch = viewersText.match(/(\d+)/);
      if (viewersMatch && viewersMatch[1]) {
        return parseInt(viewersMatch[1], 10);
      }
    } catch (error) {
      console.warn("Error parsing viewers text:", viewersText, error);
    }
  
    return 0;
  }

  // Sort room list items by priority and selected sort criteria
  function sortListItems(sortBy = 'time', order = 'desc') {
    // Update current sort settings
    if (sortBy === 'time') {
      currentSortBy = 'time';
      currentTimeOrder = order;
    } else {
      currentSortBy = 'viewers';
      currentViewersOrder = order;
    }
  
    // Select the main list with fallbacks
    let ul = document.querySelector('ul.list.endless_page_template.show-location');
    
    // Try alternative selectors if the primary one fails
    if (!ul) {
      // Try less specific selectors
      ul = document.querySelector('ul.list');
      
      if (!ul) {
        ul = document.querySelector('.endless_page_template');
        
        if (!ul) {
          // If still not found, try to find any list that might contain rooms
          const possibleLists = document.querySelectorAll('ul');
          for (const list of possibleLists) {
            if (list.querySelector('li.roomCard') || list.querySelector('[class*="room"]')) {
              ul = list;
              break;
            }
          }
          
          // If we still can't find it, log error and return
          if (!ul) {
            console.error("Could not find the room list container or any suitable alternative!");
            return null;
          }
        }
      }
      
      console.warn("Using alternative selector for room list:", ul);
    }
  
    // Import priority rooms module if sorting functions not provided
    if (!isPriorityRoomFn || !highlightPriorityRoomFn) {
      console.error("Priority room functions not set in sorting module");
      return null;
    }
  
    // Reset visible priority count if needed
    if (typeof priorityRoomsModule !== 'undefined' && 
        typeof priorityRoomsModule.resetVisibleCount === 'function') {
      priorityRoomsModule.resetVisibleCount();
    }
  
    // Find room cards with fallbacks
    let roomCardSelector = 'li.roomCard';
    let liItems = Array.from(ul.querySelectorAll(roomCardSelector));
    
    // Try alternative selectors if no items found
    if (liItems.length === 0) {
      roomCardSelector = 'li[class*="room"]';
      liItems = Array.from(ul.querySelectorAll(roomCardSelector));
      
      if (liItems.length === 0) {
        // Last attempt - try to find any list items that might be room cards
        liItems = Array.from(ul.querySelectorAll('li')).filter(li => {
          return li.querySelector('a') && (
            li.querySelector('img') || 
            li.querySelector('[class*="detail"]') || 
            li.querySelector('[class*="info"]')
          );
        });
        
        if (liItems.length === 0) {
          console.error("Could not find any room list items!");
          return null;
        }
        
        console.warn("Using generic list items as room cards:", liItems.length);
      } else {
        console.warn("Using alternative selector for room cards:", liItems.length);
      }
    }
  
    console.log(`Found ${liItems.length} room list items to sort by ${sortBy} (${order}).`);
  
    // Sort the array based on priority and selected criteria
    liItems.sort((a, b) => {
      // Check if they are priority rooms
      const aIsPriority = isPriorityRoomFn(a);
      const bIsPriority = isPriorityRoomFn(b);
  
      // If one is priority and the other is not, prioritize the priority room
      if (aIsPriority && !bIsPriority) return -1;
      if (!aIsPriority && bIsPriority) return 1;
  
      // If both are priority or both are not, sort by selected criteria
      let valueA, valueB;
  
      if (sortBy === 'time') {
        valueA = extractTimeInMinutes(a);
        valueB = extractTimeInMinutes(b);
      } else { // sortBy === 'viewers'
        valueA = extractViewerCount(a);
        valueB = extractViewerCount(b);
      }
  
      if (order.toLowerCase() === 'asc') {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });
  
    // Clear the ul and append the sorted li elements
    while (ul.firstChild) {
      ul.removeChild(ul.firstChild);
    }
  
    liItems.forEach(li => {
      const isPriority = isPriorityRoomFn(li);
      highlightPriorityRoomFn(li, isPriority);
      
      // Append the li to the ul
      ul.appendChild(li);
    });
  
    console.log(`Successfully sorted ${liItems.length} room list items by ${sortBy} (${order}).`);
    
    // Update UI with new sort state
    return { 
      sortBy: currentSortBy, 
      timeOrder: currentTimeOrder, 
      viewersOrder: currentViewersOrder 
    };
  }

  // Get current sort settings
  function getCurrentSortSettings() {
    return {
      sortBy: currentSortBy,
      timeOrder: currentTimeOrder,
      viewersOrder: currentViewersOrder
    };
  }

  // Public API
  return {
    init,
    sortListItems,
    getCurrentSortSettings,
    extractTimeInMinutes,
    extractViewerCount
  };
})();

export default sortingModule;