// UI Controls Module - Handles the creation and management of UI elements
const uiControlsModule = (() => {
    // Module state
    let controlsCreated = false;
    let sortingModule;
    let priorityRoomsModule;
    let themeModule;
    let urlModule;
    
    // Initialize the module
    async function init(sorting, priority, theme) {
      // Store module references
      sortingModule = sorting;
      priorityRoomsModule = priority;
      themeModule = theme;
      
      // Import URL module if needed for popups
      urlModule = await import(chrome.runtime.getURL('content/modules/urlModule.js'))
        .then(module => module.default)
        .catch(err => console.error("Error loading URL module:", err));
      
      console.log("UI Controls module initialized");
      
      // Create controls if they don't exist yet
      if (!controlsCreated) {
        createControls();
      }
    }
    
    // Create the main UI controls
    function createControls() {
      // Check if controls already exist to prevent duplicates
      if (controlsCreated || document.querySelector('#cb-streamer-sorter')) {
        console.log("Controls already exist, not creating duplicates");
        return;
      }
      
      // Create container for controls
      const controlsContainer = document.createElement('div');
      controlsContainer.id = 'cb-streamer-sorter';
      controlsContainer.style.position = 'fixed';
      controlsContainer.style.top = '10px';
      controlsContainer.style.right = '10px';
      controlsContainer.style.zIndex = '9999';
      controlsContainer.style.padding = '10px';
      controlsContainer.style.borderRadius = '5px';
      controlsContainer.style.display = 'flex';
      controlsContainer.style.flexDirection = 'column';
      controlsContainer.style.gap = '5px';
      
      // Apply theme
      themeModule.applyColorScheme(controlsContainer, themeModule.getElementColorScheme('controlPanel'));
      
      // Create header with drag functionality
      createHeader(controlsContainer);
      
      // Create sort buttons container
      const sortButtonsContainer = createSortButtons(controlsContainer);
      
      // Create content container (for elements that can be hidden when minimized)
      const contentContainer = document.createElement('div');
      contentContainer.style.display = 'block';
      
      // Add highlight color selector
      createColorSelector(contentContainer);
      
      // Add URL input for adding favorite streamers
      createUrlInput(contentContainer);
      
      // Add priority rooms section
      createPriorityRoomsSection(contentContainer);
      
      // Add content container to main container
      controlsContainer.appendChild(contentContainer);
      
      // Add container to the page
      document.body.appendChild(controlsContainer);
      
      // Mark controls as created
      controlsCreated = true;
    }
    
    // Create the draggable header with title and buttons
    function createHeader(parentContainer) {
      // Create header container
      const header = document.createElement('div');
      header.style.padding = '8px 10px';
      header.style.fontWeight = 'bold';
      header.style.marginBottom = '10px';
      header.style.borderRadius = '3px';
      header.style.cursor = 'move';
      header.style.userSelect = 'none';
      header.style.position = 'relative';
      header.style.display = 'flex';
      header.style.justifyContent = 'center';
      header.style.alignItems = 'center';
      
      // Apply theme
      themeModule.applyColorScheme(header, themeModule.getElementColorScheme('header'));
      
      // Create title
      const title = document.createElement('span');
      title.textContent = 'Followed Streamers Sorter';
      title.style.position = 'absolute';
      title.style.left = '50%';
      title.style.transform = 'translateX(-50%)';
      title.style.textAlign = 'center';
      title.style.pointerEvents = 'none';
      header.appendChild(title);
      
      // Create buttons container
      const buttonsContainer = document.createElement('div');
      buttonsContainer.style.position = 'absolute';
      buttonsContainer.style.right = '5px';
      buttonsContainer.style.top = '50%';
      buttonsContainer.style.transform = 'translateY(-50%)';
      buttonsContainer.style.display = 'flex';
      buttonsContainer.style.gap = '8px';
      buttonsContainer.style.alignItems = 'center';
      header.appendChild(buttonsContainer);
      
      // Create dark mode toggle
      const darkModeToggle = document.createElement('button');
      darkModeToggle.innerHTML = themeModule.getCurrentMode() === 'light' ? '🌙' : '☀️';
      darkModeToggle.style.padding = '2px 4px';
      darkModeToggle.style.backgroundColor = 'transparent';
      darkModeToggle.style.border = 'none';
      darkModeToggle.style.cursor = 'pointer';
      darkModeToggle.style.fontSize = '14px';
      darkModeToggle.style.color = '#fff';
      darkModeToggle.style.display = 'flex';
      darkModeToggle.style.alignItems = 'center';
      darkModeToggle.style.justifyContent = 'center';
      darkModeToggle.title = themeModule.getCurrentMode() === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
      buttonsContainer.appendChild(darkModeToggle);
      
      // Create minimize button
      const minimizeButton = document.createElement('button');
      minimizeButton.textContent = '−';
      minimizeButton.style.backgroundColor = 'transparent';
      minimizeButton.style.border = 'none';
      minimizeButton.style.color = '#fff';
      minimizeButton.style.fontWeight = 'bold';
      minimizeButton.style.fontSize = '16px';
      minimizeButton.style.cursor = 'pointer';
      minimizeButton.style.padding = '0 5px';
      buttonsContainer.appendChild(minimizeButton);
      
      // Add event listeners
      darkModeToggle.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent triggering drag
        const newMode = themeModule.toggleColorMode();
        darkModeToggle.innerHTML = newMode === 'light' ? '🌙' : '☀️';
        darkModeToggle.title = newMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
        
        // Recreate controls with new theme
        const container = document.querySelector('#cb-streamer-sorter');
        if (container) {
          controlsCreated = false;
          document.body.removeChild(container);
          createControls();
        }
      });
      
      // Minimize/maximize functionality
      let minimized = false;
      minimizeButton.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent triggering drag
        
        const contentContainer = parentContainer.querySelector('div:not(:first-child)');
        if (!contentContainer) return;
        
        if (minimized) {
          contentContainer.style.display = 'block';
          minimizeButton.textContent = '−';
          parentContainer.style.width = '';
        } else {
          contentContainer.style.display = 'none';
          minimizeButton.textContent = '+';
          parentContainer.style.width = 'auto';
        }
        minimized = !minimized;
      });
      
      // Drag functionality
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      
      header.onmousedown = function(e) {
        // Don't drag if clicking on buttons
        if (e.target === minimizeButton || e.target === darkModeToggle) return;
        
        e.preventDefault();
        
        // Get mouse position
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Add events for drag
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
      };
      
      function elementDrag(e) {
        e.preventDefault();
        
        // Calculate new position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Set new position
        const top = parentContainer.offsetTop - pos2;
        const left = parentContainer.offsetLeft - pos1;
        parentContainer.style.top = top + 'px';
        parentContainer.style.left = left + 'px';
        parentContainer.style.right = 'auto';
      }
      
      function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
      }
      
      // Add header to parent container
      parentContainer.appendChild(header);
      
      return header;
    }
    
    // Create sort buttons
    function createSortButtons(parentContainer) {
      const sortButtonsContainer = document.createElement('div');
      sortButtonsContainer.style.display = 'flex';
      sortButtonsContainer.style.gap = '5px';
      sortButtonsContainer.style.marginBottom = '5px';
      
      // Get current sort settings
      const currentSettings = sortingModule.getCurrentSortSettings();
      
      // Time sort button
      const timeSortButton = document.createElement('button');
      timeSortButton.textContent = `Sort by Time ${currentSettings.timeOrder === 'desc' ? '↓' : '↑'}`;
      timeSortButton.style.padding = '5px 10px';
      timeSortButton.style.border = 'none';
      timeSortButton.style.borderRadius = '4px';
      timeSortButton.style.cursor = 'pointer';
      timeSortButton.style.flex = '1';
      themeModule.applyColorScheme(
        timeSortButton, 
        currentSettings.sortBy === 'time' 
          ? themeModule.getElementColorScheme('primaryButton')
          : themeModule.getElementColorScheme('secondaryButton')
      );
      
      // Viewers sort button
      const viewersSortButton = document.createElement('button');
      viewersSortButton.textContent = `Sort by Viewers ${currentSettings.viewersOrder === 'desc' ? '↓' : '↑'}`;
      viewersSortButton.style.padding = '5px 10px';
      viewersSortButton.style.border = 'none';
      viewersSortButton.style.borderRadius = '4px';
      viewersSortButton.style.cursor = 'pointer';
      viewersSortButton.style.flex = '1';
      themeModule.applyColorScheme(
        viewersSortButton, 
        currentSettings.sortBy === 'viewers' 
          ? themeModule.getElementColorScheme('primaryButton')
          : themeModule.getElementColorScheme('secondaryButton')
      );
      
      // Add click event for time sort
      timeSortButton.addEventListener('click', function() {
        // Get current settings
        const settings = sortingModule.getCurrentSortSettings();
        // Toggle order
        const newOrder = settings.timeOrder === 'desc' ? 'asc' : 'desc';
        
        // Perform sort and get updated settings
        const newSettings = sortingModule.sortListItems('time', newOrder);
        
        // Update button text based on new settings
        timeSortButton.textContent = `Sort by Time ${newSettings.timeOrder === 'desc' ? '↓' : '↑'}`;
        viewersSortButton.textContent = `Sort by Viewers ${newSettings.viewersOrder === 'desc' ? '↓' : '↑'}`;
        
        // Update button styles
        themeModule.applyColorScheme(timeSortButton, themeModule.getElementColorScheme('primaryButton'));
        themeModule.applyColorScheme(viewersSortButton, themeModule.getElementColorScheme('secondaryButton'));
      });
      
      // Add click event for viewers sort
      viewersSortButton.addEventListener('click', function() {
        // Get current settings
        const settings = sortingModule.getCurrentSortSettings();
        // Toggle order
        const newOrder = settings.viewersOrder === 'desc' ? 'asc' : 'desc';
        
        // Perform sort and get updated settings
        const newSettings = sortingModule.sortListItems('viewers', newOrder);
        
        // Update button text based on new settings
        timeSortButton.textContent = `Sort by Time ${newSettings.timeOrder === 'desc' ? '↓' : '↑'}`;
        viewersSortButton.textContent = `Sort by Viewers ${newSettings.viewersOrder === 'desc' ? '↓' : '↑'}`;
        
        // Update button styles
        themeModule.applyColorScheme(timeSortButton, themeModule.getElementColorScheme('secondaryButton'));
        themeModule.applyColorScheme(viewersSortButton, themeModule.getElementColorScheme('primaryButton'));
      });
      
      // Add buttons to container
      sortButtonsContainer.appendChild(timeSortButton);
      sortButtonsContainer.appendChild(viewersSortButton);
      
      // Add to parent
      parentContainer.appendChild(sortButtonsContainer);
      
      return sortButtonsContainer;
    }
    
    // Create color selector
    function createColorSelector(parentContainer) {
      // Label
      const colorLabel = document.createElement('div');
      colorLabel.textContent = 'Favorite Streamers Highlight Color:';
      colorLabel.style.marginTop = '5px';
      colorLabel.style.color = themeModule.getCurrentColorScheme().text;
      parentContainer.appendChild(colorLabel);
      
      // Color input
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = priorityRoomsModule.getAllPriorityRooms().highlightColor || '#FFFF00';
      colorInput.style.width = '100%';
      colorInput.style.marginBottom = '5px';
      colorInput.style.padding = '2px';
      colorInput.style.borderRadius = '4px';
      colorInput.style.border = `1px solid ${themeModule.getCurrentColorScheme().border}`;
      parentContainer.appendChild(colorInput);
      
      // Event handler
      colorInput.addEventListener('change', function() {
        const newColor = colorInput.value;
        priorityRoomsModule.setHighlightColor(newColor);
        
        // Re-apply highlighting
        const settings = sortingModule.getCurrentSortSettings();
        sortingModule.sortListItems(settings.sortBy, settings.sortBy === 'time' ? settings.timeOrder : settings.viewersOrder);
      });
    }
    
    // Create URL input
    function createUrlInput(parentContainer) {
      // Label
      const urlLabel = document.createElement('div');
      urlLabel.textContent = 'Add Favorite Streamer URL:';
      urlLabel.style.marginTop = '5px';
      urlLabel.style.color = themeModule.getCurrentColorScheme().text;
      parentContainer.appendChild(urlLabel);
      
      // URL input
      const urlInput = document.createElement('input');
      urlInput.type = 'text';
      urlInput.placeholder = 'Paste room URL here';
      urlInput.style.boxSizing = 'border-box';
      urlInput.style.width = '100%';
      urlInput.style.padding = '5px';
      urlInput.style.marginBottom = '5px';
      urlInput.style.borderRadius = '4px';
      urlInput.style.border = `1px solid ${themeModule.getCurrentColorScheme().border}`;
      themeModule.applyColorScheme(urlInput, themeModule.getElementColorScheme('inputField'));
      parentContainer.appendChild(urlInput);
      
      // Container for apply button and counter
      const applyContainer = document.createElement('div');
      applyContainer.style.display = 'flex';
      applyContainer.style.alignItems = 'center';
      applyContainer.style.gap = '10px';
      parentContainer.appendChild(applyContainer);
      
      // Apply button
      const applyButton = document.createElement('button');
      applyButton.textContent = 'Add Favorite Streamer';
      applyButton.style.padding = '5px 10px';
      applyButton.style.border = 'none';
      applyButton.style.borderRadius = '4px';
      applyButton.style.cursor = 'pointer';
      themeModule.applyColorScheme(applyButton, themeModule.getElementColorScheme('actionButton'));
      applyContainer.appendChild(applyButton);
      
      // Priority counter
      const priorityCounter = document.createElement('div');
      priorityCounter.innerHTML = 'Total Live Favorites: <span id="priorityRoomsCounter">' + priorityRoomsModule.getVisibleCount() + '</span>';
      priorityCounter.style.marginLeft = '10px';
      priorityCounter.style.color = themeModule.getCurrentColorScheme().text;
      applyContainer.appendChild(priorityCounter);
      
      // Event handler
      applyButton.addEventListener('click', function() {
        const url = urlInput.value.trim();
        if (url) {
          const roomName = urlModule.extractRoomNameFromUrl(url);
          if (roomName) {
            // Add room to priority list
            if (priorityRoomsModule.addPriorityRoom(roomName)) {
              // Update priority room display
              updatePriorityRoomsList();
              
              // Re-sort to apply highlighting
              const settings = sortingModule.getCurrentSortSettings();
              sortingModule.sortListItems(settings.sortBy, settings.sortBy === 'time' ? settings.timeOrder : settings.viewersOrder);
              
              // Update counter
              document.getElementById('priorityRoomsCounter').textContent = priorityRoomsModule.getVisibleCount();
              
              // Clear input
              urlInput.value = '';
              
              console.log(`Added new favorite streamer: ${roomName}`);
            } else {
              console.log(`Streamer ${roomName} is already in favorites list`);
              urlInput.value = '';
            }
          } else {
            console.error("Could not extract room name from URL:", url);
          }
        }
      });
    }
    
    // Create priority rooms section
    function createPriorityRoomsSection(parentContainer) {
      // Create label container with buttons
      const labelContainer = document.createElement('div');
      labelContainer.style.display = 'flex';
      labelContainer.style.justifyContent = 'space-between';
      labelContainer.style.alignItems = 'center';
      labelContainer.style.marginTop = '5px';
      labelContainer.style.padding = '6px 10px';
      labelContainer.style.borderRadius = '4px';
      labelContainer.style.boxSizing = 'border-box';
      themeModule.applyColorScheme(labelContainer, themeModule.getElementColorScheme('collapsedSection'));
      parentContainer.appendChild(labelContainer);
      
      // Toggle button
      const toggleButton = document.createElement('button');
      toggleButton.textContent = 'View All Favorite Streams';
      toggleButton.style.padding = '4px 8px';
      toggleButton.style.fontSize = '12px';
      toggleButton.style.border = 'none';
      toggleButton.style.borderRadius = '3px';
      toggleButton.style.cursor = 'pointer';
      themeModule.applyColorScheme(toggleButton, themeModule.getElementColorScheme('primaryButton'));
      labelContainer.appendChild(toggleButton);
      
      // Print button
      const printButton = document.createElement('button');
      printButton.textContent = 'List Live Favorite Streams';
      printButton.style.padding = '4px 8px';
      printButton.style.fontSize = '12px';
      printButton.style.border = 'none';
      printButton.style.borderRadius = '3px';
      printButton.style.cursor = 'pointer';
      printButton.style.marginLeft = 'auto';
      themeModule.applyColorScheme(printButton, themeModule.getElementColorScheme('actionButton'));
      labelContainer.appendChild(printButton);
      
      // Priority list display
      const priorityListDisplay = document.createElement('div');
      priorityListDisplay.id = 'priorityRoomsList';
      priorityListDisplay.style.maxHeight = '100px';
      priorityListDisplay.style.overflowY = 'auto';
      priorityListDisplay.style.padding = '5px';
      priorityListDisplay.style.borderRadius = '4px';
      priorityListDisplay.style.marginBottom = '5px';
      priorityListDisplay.style.display = 'none'; // Initially collapsed
      priorityListDisplay.style.border = themeModule.getCurrentMode() === 'dark' ? '1px solid #777' : '1px solid #ccc';
      themeModule.applyColorScheme(priorityListDisplay, themeModule.getElementColorScheme('inputField'));
      parentContainer.appendChild(priorityListDisplay);
      
      // Toggle event
      toggleButton.addEventListener('click', function() {
        if (priorityListDisplay.style.display === 'none') {
          priorityListDisplay.style.display = 'block';
          toggleButton.style.backgroundColor = themeModule.getCurrentMode() === 'light' ? '#1c4061' : '#204060';
          
          // Update list when shown
          updatePriorityRoomsList();
        } else {
          priorityListDisplay.style.display = 'none';
          themeModule.applyColorScheme(toggleButton, themeModule.getElementColorScheme('primaryButton'));
        }
      });
      
      // Print event
      printButton.addEventListener('click', function(event) {
        event.stopPropagation();
        
        // Get all visible priority rooms
        const ul = document.querySelector('ul.list.endless_page_template.show-location');
        if (!ul) {
          urlModule.createUrlsPopup("No room list found on the page.", themeModule);
          return;
        }
        
        // Find priority rooms
        const visibleRooms = Array.from(ul.querySelectorAll('li.roomCard'));
        const visiblePriorityRooms = [];
        
        visibleRooms.forEach(li => {
          if (priorityRoomsModule.isPriorityRoom(li)) {
            const roomElement = li.querySelector('div.details > div > a');
            if (roomElement && roomElement.getAttribute('data-room')) {
              visiblePriorityRooms.push(roomElement.getAttribute('data-room'));
            }
          }
        });
        
        // Show popup with URLs
        if (visiblePriorityRooms.length > 0) {
          const urls = visiblePriorityRooms.map(room => `https://chaturbate.com/${room}/`).join('\n');
          urlModule.createUrlsPopup(urls, themeModule);
        } else {
          urlModule.createUrlsPopup("No visible favorite streams on the current page.", themeModule);
        }
      });
    }
    
    // Update priority rooms list
    function updatePriorityRoomsList() {
      const listElement = document.getElementById('priorityRoomsList');
      if (!listElement) return;
      
      listElement.innerHTML = '';
      const priorityRooms = priorityRoomsModule.getAllPriorityRooms();
      
      if (!priorityRooms || priorityRooms.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.textContent = 'No favorite streamers added';
        emptyMessage.style.color = themeModule.getCurrentColorScheme().text;
        listElement.appendChild(emptyMessage);
        return;
      }
      
      // Add each room with delete button
      priorityRooms.forEach(room => {
        const itemElement = document.createElement('div');
        itemElement.style.display = 'flex';
        itemElement.style.justifyContent = 'space-between';
        itemElement.style.marginBottom = '2px';
        
        const roomName = document.createElement('span');
        roomName.textContent = room;
        roomName.style.color = themeModule.getCurrentColorScheme().text;
        itemElement.appendChild(roomName);
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'X';
        deleteButton.style.color = 'white';
        deleteButton.style.border = 'none';
        deleteButton.style.borderRadius = '3px';
        deleteButton.style.padding = '0px 5px';
        deleteButton.style.cursor = 'pointer';
        deleteButton.style.fontSize = '12px';
        deleteButton.style.backgroundColor = themeModule.getCurrentColorScheme().deleteButtonBackground;
        
        deleteButton.addEventListener('click', function() {
          // Remove room
          if (priorityRoomsModule.removePriorityRoom(room)) {
            // Update list
            updatePriorityRoomsList();
            
            // Re-sort
            const settings = sortingModule.getCurrentSortSettings();
            sortingModule.sortListItems(settings.sortBy, settings.sortBy === 'time' ? settings.timeOrder : settings.viewersOrder);
            
            // Update counter
            const counterElement = document.getElementById('priorityRoomsCounter');
            if (counterElement) {
              counterElement.textContent = priorityRoomsModule.getVisibleCount();
            }
          }
        });
        
        itemElement.appendChild(deleteButton);
        listElement.appendChild(itemElement);
      });
    }
    
    // Public API
    return {
      init,
      updatePriorityRoomsList
    };
  })();
  
  export default uiControlsModule;