// UI Controls Module - Handles user interface controls
const uiControlsModule = (() => {
  // Module state
  let sortingModule;
  let priorityRoomsModule;
  let themeModule;
  
  // Initialize the module
  function init(sorting, priorityRooms, theme) {
    sortingModule = sorting;
    priorityRoomsModule = priorityRooms;
    themeModule = theme;
    
    console.log("UI Controls module initialized");
    
    createSortControls();
  }
  
  // Create UI controls for sorting and room management - USING ORIGINAL DIRECT DOM MANIPULATION
  function createSortControls() {
    // Create container for controls - USING DIRECT STYLING LIKE ORIGINAL
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
    
    // Create priority rooms textarea label
    const priorityRoomsLabel = document.createElement('div');
    priorityRoomsLabel.textContent = 'Priority Rooms (comma-separated):';
    priorityRoomsLabel.style.marginTop = '5px';
    controlsContainer.appendChild(priorityRoomsLabel);
    
    // Create priority rooms textarea
    const priorityRoomsInput = document.createElement('textarea');
    priorityRoomsInput.value = priorityRoomsModule.getAllPriorityRooms().join(', ');
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
    
    // Create content container for collapsible content
    const contentContainer = document.createElement('div');
    contentContainer.style.display = 'block';
    controlsContainer.appendChild(contentContainer);
    
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
    
    // Keep track of current sort settings
    let currentSortSettings = sortingModule.getCurrentSortSettings();
    
    // Add click event listener for time sort button
    timeSortButton.addEventListener('click', function() {
      const currentSettings = sortingModule.getCurrentSortSettings();
      const newOrder = currentSettings.sortBy === 'time' && currentSettings.timeOrder === 'desc' ? 'asc' : 'desc';
      
      currentSortSettings = sortingModule.sortListItems('time', newOrder);
      
      // Update button text
      timeSortButton.textContent = `Sort by Time ${currentSortSettings.timeOrder === 'desc' ? '↓' : '↑'}`;
      viewersSortButton.textContent = `Sort by Viewers ${currentSortSettings.viewersOrder === 'desc' ? '↓' : '↑'}`;
      
      // Highlight active sort button
      timeSortButton.style.backgroundColor = '#306A91';
      viewersSortButton.style.backgroundColor = '#888888';
    });
    
    // Add click event listener for viewers sort button
    viewersSortButton.addEventListener('click', function() {
      const currentSettings = sortingModule.getCurrentSortSettings();
      const newOrder = currentSettings.sortBy === 'viewers' && currentSettings.viewersOrder === 'desc' ? 'asc' : 'desc';
      
      currentSortSettings = sortingModule.sortListItems('viewers', newOrder);
      
      // Update button text
      timeSortButton.textContent = `Sort by Time ${currentSortSettings.timeOrder === 'desc' ? '↓' : '↑'}`;
      viewersSortButton.textContent = `Sort by Viewers ${currentSortSettings.viewersOrder === 'desc' ? '↓' : '↑'}`;
      
      // Highlight active sort button
      timeSortButton.style.backgroundColor = '#888888';
      viewersSortButton.style.backgroundColor = '#306A91';
    });
    
    // Add click event listener for apply button
    applyButton.addEventListener('click', function() {
      // Parse the input value to get the priority rooms
      const inputValue = priorityRoomsInput.value.trim();
      if (inputValue) {
        // Split the value by commas and trim each item
        const newPriorityRooms = inputValue.split(',').map(item => item.trim().toLowerCase());
        
        // Get the current priority rooms
        const currentPriorityRooms = priorityRoomsModule.getAllPriorityRooms();
        
        // Remove any rooms that are no longer in the list
        currentPriorityRooms.forEach(room => {
          if (!newPriorityRooms.includes(room)) {
            priorityRoomsModule.removePriorityRoom(room);
          }
        });
        
        // Add any new rooms to the list
        newPriorityRooms.forEach(room => {
          if (!currentPriorityRooms.includes(room)) {
            priorityRoomsModule.addPriorityRoom(room);
          }
        });
        
        // Re-sort the list
        sortingModule.sortListItems(currentSortSettings.sortBy, 
                                   currentSortSettings.sortBy === 'time' ? 
                                   currentSortSettings.timeOrder : 
                                   currentSortSettings.viewersOrder);
        
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
      minimized = !minimized;
      
      if (minimized) {
        contentContainer.style.display = 'none';
        minimizeButton.textContent = '+';
      } else {
        contentContainer.style.display = 'block';
        minimizeButton.textContent = '−';
      }
    });
    
    // Add theme toggle button
    const themeToggleButton = document.createElement('button');
    themeToggleButton.textContent = 'Toggle Theme';
    themeToggleButton.style.padding = '5px 10px';
    themeToggleButton.style.backgroundColor = '#888888';
    themeToggleButton.style.color = 'white';
    themeToggleButton.style.border = 'none';
    themeToggleButton.style.borderRadius = '4px';
    themeToggleButton.style.cursor = 'pointer';
    themeToggleButton.style.marginTop = '10px';
    contentContainer.appendChild(themeToggleButton);
    
    // Add click event for theme toggle
    themeToggleButton.addEventListener('click', function() {
      const newMode = themeModule.toggleColorMode();
      
      // Show feedback
      const originalText = themeToggleButton.textContent;
      
      themeToggleButton.textContent = `Theme: ${newMode.charAt(0).toUpperCase() + newMode.slice(1)}`;
      
      setTimeout(() => {
        themeToggleButton.textContent = originalText;
      }, 1500);
    });
    
    // Add export URLs button
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export Priority URLs';
    exportButton.style.padding = '5px 10px';
    exportButton.style.backgroundColor = '#888888';
    exportButton.style.color = 'white';
    exportButton.style.border = 'none';
    exportButton.style.borderRadius = '4px';
    exportButton.style.cursor = 'pointer';
    exportButton.style.marginTop = '5px';
    contentContainer.appendChild(exportButton);
    
    // Add click event for export button
    exportButton.addEventListener('click', function() {
      const rooms = priorityRoomsModule.getAllPriorityRooms();
      let urlsText = '';
      
      rooms.forEach(room => {
        urlsText += `https://chaturbate.com/${room}/\n`;
      });
      
      // Import URL module to create popup
      import(chrome.runtime.getURL('content/modules/urlModule.js'))
        .then(module => {
          const urlModule = module.default;
          urlModule.createUrlsPopup(urlsText, themeModule);
        })
        .catch(err => console.error("Error loading URL module:", err));
    });
    
    // Add container to the page
    document.body.appendChild(controlsContainer);
    
    // Show priority room count
    const countLabel = document.createElement('div');
    countLabel.textContent = `Priority rooms visible: ${priorityRoomsModule.getVisibleCount()}`;
    countLabel.style.marginTop = '10px';
    countLabel.style.fontSize = '12px';
    contentContainer.appendChild(countLabel);
    
    // Update the count occasionally
    setInterval(() => {
      countLabel.textContent = `Priority rooms visible: ${priorityRoomsModule.getVisibleCount()}`;
    }, 2000);
  }
  
  // Public API
  return {
    init
  };
})();

export default uiControlsModule;