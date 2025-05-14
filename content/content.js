// content.js - Single file approach using the self-invoking function
(function() {
    console.log("Followed Streamers Sorter Extension v1.0.0 initializing...");
    
    // Only run on the followed-cams page, not on individual streamer pages
    const isFollowedCamsPage = window.location.pathname.includes('/followed-cams/');
    const isStreamerPage = /^\/[a-zA-Z0-9_-]+\/?$/.test(window.location.pathname);
    
    if (!isFollowedCamsPage && isStreamerPage) {
      console.log("On individual streamer page - Extension not activated");
      return;
    }
    
    // Get settings from Chrome storage or use defaults
    chrome.storage.sync.get(['priorityRooms', 'highlightColor'], function(result) {
      // Default priority rooms if nothing is stored
      let priorityRooms = result.priorityRooms || [
        "katyerave","mishabrizo","mariannacruzz","jeangreybianca","ericamiracle15",
        "bunnydollstella","emilylittle","sia_woori","dakota_blare","diamond_jo_",
        "doseofhappiness","marcela_davila1"
      ];
      
      // Default highlight color
      let highlightColor = result.highlightColor || "#FFFF00";
      
      // Save priority rooms to localStorage for compatibility with code
      try {
        localStorage.setItem('priorityRooms', JSON.stringify(priorityRooms));
      } catch (e) {
        console.error("Error saving to localStorage:", e);
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

      // Check if a room is in the priority list
      function isPriorityRoom(li) {
        const roomElement = li.querySelector('div.details > div > a');
        if (roomElement && roomElement.getAttribute('data-room')) {
          const roomName = roomElement.getAttribute('data-room');
          return priorityRooms.includes(roomName);
        }
        return false;
      }

      // Save priority rooms to storage
      function savePriorityRooms(rooms) {
        // Save to Chrome storage
        chrome.storage.sync.set({ priorityRooms: rooms }, function() {
          console.log("Saved priority rooms to Chrome storage");
        });
        
        // Also save to localStorage
        try {
          localStorage.setItem('priorityRooms', JSON.stringify(rooms));
        } catch (e) {
          console.error("Error saving to localStorage:", e);
        }
        
        // Update the local variable
        priorityRooms = [...rooms];
      }

      // Sort room list items by priority and selected sort criteria
      function sortListItems(sortBy = 'time', order = 'desc') {
        // Select the main list
        const ul = document.querySelector('ul.list.endless_page_template.show-location');

        if (!ul) {
          console.error("Could not find the room list container!");
          return;
        }

        // Convert NodeList to array for easier manipulation
        const liItems = Array.from(ul.querySelectorAll('li.roomCard'));

        console.log(`Found ${liItems.length} room list items to sort by ${sortBy} (${order}).`);

        // Sort the array based on priority and selected criteria
        liItems.sort((a, b) => {
          // Check if they are priority rooms
          const aIsPriority = isPriorityRoom(a);
          const bIsPriority = isPriorityRoom(b);

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
        // Also highlight priority rooms
        while (ul.firstChild) {
          ul.removeChild(ul.firstChild);
        }

        let visiblePriorityCount = 0;
        
        liItems.forEach(li => {
          // Add or reset background highlighting
          if (isPriorityRoom(li)) {
            li.style.backgroundColor = highlightColor; // Use the configured color
            li.style.border = "3px solid #FFD700"; // Gold border
            li.style.boxShadow = "0 0 10px rgba(255, 215, 0, 0.6)"; // Glowing effect
            visiblePriorityCount++;
          } else {
            li.style.backgroundColor = "";
            li.style.border = "";
            li.style.boxShadow = "";
          }

          // Append the li to the ul
          ul.appendChild(li);
        });

        console.log(`Successfully sorted ${liItems.length} room list items by ${sortBy} (${order}).`);
        
        return {
          sortBy,
          order,
          visiblePriorityCount
        };
      }

      // Create UI controls for configuring and managing the sort
      function createSortControls() {
        // Create container for controls
        const controlsContainer = document.createElement('div');
        controlsContainer.style.position = 'fixed';
        controlsContainer.style.top = '10px';
        controlsContainer.style.right = '10px';
        controlsContainer.style.zIndex = '9999';
        controlsContainer.style.backgroundColor = '#f0f0f0';
        controlsContainer.style.padding = '10px';
        controlsContainer.style.borderRadius = '5px';
        controlsContainer.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
        controlsContainer.style.display = 'flex';
        controlsContainer.style.flexDirection = 'column';
        controlsContainer.style.gap = '5px';

        // Create title
        const title = document.createElement('div');
        title.textContent = 'Room List Sorter';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '5px';
        controlsContainer.appendChild(title);

        // Create sort buttons container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '5px';
        buttonContainer.style.marginBottom = '5px';
        controlsContainer.appendChild(buttonContainer);

        // Create time sort button
        const timeSortButton = document.createElement('button');
        timeSortButton.textContent = 'Sort by Time ↓';
        timeSortButton.style.padding = '5px 10px';
        timeSortButton.style.backgroundColor = '#306A91';
        timeSortButton.style.color = 'white';
        timeSortButton.style.border = 'none';
        timeSortButton.style.borderRadius = '4px';
        timeSortButton.style.cursor = 'pointer';
        timeSortButton.style.flex = '1';
        buttonContainer.appendChild(timeSortButton);

        // Create viewers sort button
        const viewersSortButton = document.createElement('button');
        viewersSortButton.textContent = 'Sort by Viewers ↓';
        viewersSortButton.style.padding = '5px 10px';
        viewersSortButton.style.backgroundColor = '#888888';
        viewersSortButton.style.color = 'white';
        viewersSortButton.style.border = 'none';
        viewersSortButton.style.borderRadius = '4px';
        viewersSortButton.style.cursor = 'pointer';
        viewersSortButton.style.flex = '1';
        buttonContainer.appendChild(viewersSortButton);

        // Create priority rooms textarea
        const priorityRoomsLabel = document.createElement('div');
        priorityRoomsLabel.textContent = 'Priority Rooms (comma-separated):';
        priorityRoomsLabel.style.marginTop = '5px';
        controlsContainer.appendChild(priorityRoomsLabel);

        const priorityRoomsInput = document.createElement('textarea');
        priorityRoomsInput.value = priorityRooms.join(', ');
        priorityRoomsInput.style.width = '100%';
        priorityRoomsInput.style.minHeight = '60px';
        priorityRoomsInput.style.marginBottom = '5px';
        controlsContainer.appendChild(priorityRoomsInput);

        // Create apply button
        const applyButton = document.createElement('button');
        applyButton.textContent = 'Apply Priority Rooms';
        applyButton.style.padding = '5px 10px';
        applyButton.style.backgroundColor = '#4CAF50';
        applyButton.style.color = 'white';
        applyButton.style.border = 'none';
        applyButton.style.borderRadius = '4px';
        applyButton.style.cursor = 'pointer';
        controlsContainer.appendChild(applyButton);

        // Add minimize/maximize button
        const minimizeButton = document.createElement('button');
        minimizeButton.textContent = '−';
        minimizeButton.style.position = 'absolute';
        minimizeButton.style.top = '5px';
        minimizeButton.style.right = '5px';
        minimizeButton.style.padding = '0px 5px';
        minimizeButton.style.backgroundColor = 'transparent';
        minimizeButton.style.border = 'none';
        minimizeButton.style.cursor = 'pointer';
        minimizeButton.style.fontSize = '16px';
        controlsContainer.appendChild(minimizeButton);

        // Create content container for minimize/maximize
        const contentContainer = document.createElement('div');
        contentContainer.style.display = 'block';
        contentContainer.appendChild(priorityRoomsLabel);
        contentContainer.appendChild(priorityRoomsInput);
        contentContainer.appendChild(applyButton);
        controlsContainer.appendChild(contentContainer);

        // Keep track of current sort settings
        let currentSortBy = 'time';
        let currentTimeOrder = 'desc';
        let currentViewersOrder = 'desc';
        let visiblePriorityCount = 0;

        // Add click event listener for time sort button
        timeSortButton.addEventListener('click', function() {
          currentSortBy = 'time';
          currentTimeOrder = currentTimeOrder === 'desc' ? 'asc' : 'desc';

          const result = sortListItems(currentSortBy, currentTimeOrder);
          visiblePriorityCount = result.visiblePriorityCount;
          
          // Update button text
          timeSortButton.textContent = `Sort by Time ${currentTimeOrder === 'desc' ? '↓' : '↑'}`;
          viewersSortButton.textContent = `Sort by Viewers ${currentViewersOrder === 'desc' ? '↓' : '↑'}`;

          // Highlight active sort button
          timeSortButton.style.backgroundColor = '#306A91';
          viewersSortButton.style.backgroundColor = '#888888';
          
          // Update counter
          countLabel.textContent = `Priority rooms visible: ${visiblePriorityCount}`;
        });

        // Add click event listener for viewers sort button
        viewersSortButton.addEventListener('click', function() {
          currentSortBy = 'viewers';
          currentViewersOrder = currentViewersOrder === 'desc' ? 'asc' : 'desc';

          const result = sortListItems(currentSortBy, currentViewersOrder);
          visiblePriorityCount = result.visiblePriorityCount;

          // Update button text
          timeSortButton.textContent = `Sort by Time ${currentTimeOrder === 'desc' ? '↓' : '↑'}`;
          viewersSortButton.textContent = `Sort by Viewers ${currentViewersOrder === 'desc' ? '↓' : '↑'}`;

          // Highlight active sort button
          timeSortButton.style.backgroundColor = '#888888';
          viewersSortButton.style.backgroundColor = '#306A91';
          
          // Update counter
          countLabel.textContent = `Priority rooms visible: ${visiblePriorityCount}`;
        });

        // Add click event listener for apply button
        applyButton.addEventListener('click', function() {
          // Parse the input value to get the priority rooms
          const inputValue = priorityRoomsInput.value.trim();
          if (inputValue) {
            // Split the value by commas and trim each item
            const newPriorityRooms = inputValue.split(',').map(item => item.trim());

            // Save the updated priority rooms
            savePriorityRooms(newPriorityRooms);

            // Re-sort the list
            const result = sortListItems(currentSortBy, currentSortBy === 'time' ? currentTimeOrder : currentViewersOrder);
            visiblePriorityCount = result.visiblePriorityCount;

            console.log(`Updated and saved priority rooms: ${newPriorityRooms.join(', ')}`);
            
            // Update counter
            countLabel.textContent = `Priority rooms visible: ${visiblePriorityCount}`;
            
            // Show feedback
            const originalText = applyButton.textContent;
            const originalBg = applyButton.style.backgroundColor;
            
            applyButton.textContent = 'Applied!';
            applyButton.style.backgroundColor = '#4CAF50';
            
            setTimeout(() => {
              applyButton.textContent = originalText;
              applyButton.style.backgroundColor = originalBg;
            }, 1500);
          }
        });

        // Add click event listener for minimize/maximize button
        let minimized = false;
        minimizeButton.addEventListener('click', function() {
          if (minimized) {
            contentContainer.style.display = 'block';
            minimizeButton.textContent = '−';
            controlsContainer.style.width = '';
          } else {
            contentContainer.style.display = 'none';
            minimizeButton.textContent = '+';
            controlsContainer.style.width = 'auto';
          }
          minimized = !minimized;
        });
        
        // Show priority room count
        const countLabel = document.createElement('div');
        countLabel.textContent = `Priority rooms visible: ${visiblePriorityCount}`;
        countLabel.style.marginTop = '10px';
        countLabel.style.fontSize = '12px';
        contentContainer.appendChild(countLabel);

        // Add container to the page
        document.body.appendChild(controlsContainer);
      }

      // Handle URL parameter to set priority rooms
      function handleURLParameter() {
        const url = new URL(window.location.href);
        const roomsParam = url.searchParams.get('priority_rooms');
        
        if (roomsParam) {
          // Split the parameter value by commas and trim each item
          const newPriorityRooms = roomsParam.split(',').map(item => item.trim());
          
          // Save the updated priority rooms
          savePriorityRooms(newPriorityRooms);
          
          console.log(`Updated priority rooms from URL parameter: ${newPriorityRooms.join(', ')}`);
        }
      }
      
      // Check if pagination module is needed
      const paginationElement = document.querySelector('#roomlist_pagination');
      if (paginationElement) {
        // Handle pagination - only implementable in a proper extension with more complex code
        console.log("Pagination detected, but not handled in this version");
      }
      
      // Handle URL parameter
      handleURLParameter();
      
      // Execute the sort function with default values
      const initialSort = sortListItems('time', 'desc');
      
      // Create the UI controls
      createSortControls();
    });
})();