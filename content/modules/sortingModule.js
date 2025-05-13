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
      // Find the time span within the li
      const timeSpan = li.querySelector('div.details > ul.sub-info.camAltTextColor > li.cams > span.time');
  
      if (!timeSpan) {
        return 0; // Return 0 if time span not found
      }
  
      const timeText = timeSpan.textContent.trim();
  
      // Extract the numeric value and determine if it's hours or minutes
      let minutes = 0;
  
      if (timeText.includes('hrs') || timeText.includes('hr')) {
        // Convert hours to minutes
        const hours = parseFloat(timeText.split(' ')[0]);
        minutes = hours * 60;
      } else if (timeText.includes('mins') || timeText.includes('min')) {
        // Already in minutes
        minutes = parseFloat(timeText.split(' ')[0]);
      }
  
      return minutes;
    }
  
    // Extract viewer count from an li element
    function extractViewerCount(li) {
      // Find the viewers span within the li
      const viewersSpan = li.querySelector('div.details > ul.sub-info.camAltTextColor > li.cams > span.viewers');
  
      if (!viewersSpan) {
        return 0; // Return 0 if viewers span not found
      }
  
      const viewersText = viewersSpan.textContent.trim();
  
      // Extract just the number from text like "123 viewers"
      const viewersMatch = viewersText.match(/(\d+)/);
      if (viewersMatch && viewersMatch[1]) {
        return parseInt(viewersMatch[1], 10);
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
  
      // Select the main list
      const ul = document.querySelector('ul.list.endless_page_template.show-location');
  
      if (!ul) {
        console.error("Could not find the room list container!");
        return;
      }
  
      // Import priority rooms module if sorting functions not provided
      if (!isPriorityRoomFn || !highlightPriorityRoomFn) {
        console.error("Priority room functions not set in sorting module");
        return;
      }
  
      // Reset visible priority count if needed
      if (typeof priorityRoomsModule !== 'undefined' && 
          typeof priorityRoomsModule.resetVisibleCount === 'function') {
        priorityRoomsModule.resetVisibleCount();
      }
  
      // Convert NodeList to array for easier manipulation
      const liItems = Array.from(ul.querySelectorAll('li.roomCard'));
  
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