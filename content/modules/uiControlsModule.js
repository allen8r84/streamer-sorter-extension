// UI Controls Module - Handles user interface controls
const uiControlsModule = (() => {
  // Module state
  let sortingModule;
  let priorityRoomsModule;
  let themeModule;
  let controlsContainer = null;
  let minimized = false;
  
  // Initialize the module
  function init(sorting, priorityRooms, theme) {
    sortingModule = sorting;
    priorityRoomsModule = priorityRooms;
    themeModule = theme;
    
    console.log("UI Controls module initialized");
    
    createSortControls();
  }
  
  // Create UI controls for sorting and room management
  function createSortControls() {
    // Create container for controls
    controlsContainer = document.createElement('div');
    controlsContainer.className = 'fssorter-controls-container';
    
    // Apply theme
    themeModule.applyTheme(controlsContainer, 'controls-container');
    
    // Create title
    const title = document.createElement('div');
    title.textContent = 'Room List Sorter';
    title.className = 'fssorter-title';
    controlsContainer.appendChild(title);
    
    // Create sort buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'fssorter-button-container';
    controlsContainer.appendChild(buttonContainer);
    
    // Create time sort button
    const timeSortButton = document.createElement('button');
    timeSortButton.textContent = 'Sort by Time ↓';
    timeSortButton.className = 'fssorter-button fssorter-primary-button';
    buttonContainer.appendChild(timeSortButton);
    
    // Create viewers sort button
    const viewersSortButton = document.createElement('button');
    viewersSortButton.textContent = 'Sort by Viewers ↓';
    viewersSortButton.className = 'fssorter-button fssorter-secondary-button';
    buttonContainer.appendChild(viewersSortButton);
    
    // Create content container for collapsible content
    const contentContainer = document.createElement('div');
    contentContainer.className = 'fssorter-content-container';
    controlsContainer.appendChild(contentContainer);
    
    // Create priority rooms textarea label
    const priorityRoomsLabel = document.createElement('div');
    priorityRoomsLabel.textContent = 'Priority Rooms (comma-separated):';
    priorityRoomsLabel.className = 'fssorter-label';
    contentContainer.appendChild(priorityRoomsLabel);
    
    // Create priority rooms textarea
    const priorityRoomsInput = document.createElement('textarea');
    priorityRoomsInput.value = priorityRoomsModule.getAllPriorityRooms().join(', ');
    priorityRoomsInput.className = 'fssorter-textarea';
    contentContainer.appendChild(priorityRoomsInput);
    
    // Create apply button
    const applyButton = document.createElement('button');
    applyButton.textContent = 'Apply Priority Rooms';
    applyButton.className = 'fssorter-button fssorter-action-button';
    contentContainer.appendChild(applyButton);
    
    // Add minimize/maximize button
    const minimizeButton = document.createElement('button');
    minimizeButton.textContent = '−';
    minimizeButton.className = 'fssorter-minimize-button';
    controlsContainer.appendChild(minimizeButton);
    
    // Keep track of current sort settings
    let currentSortSettings = sortingModule.getCurrentSortSettings();
    
    // Update button text based on current sort
    updateSortButtonsState(timeSortButton, viewersSortButton, currentSortSettings);
    
    // Add click event listener for time sort button
    timeSortButton.addEventListener('click', function() {
      const currentSettings = sortingModule.getCurrentSortSettings();
      const newOrder = currentSettings.sortBy === 'time' && currentSettings.timeOrder === 'desc' ? 'asc' : 'desc';
      
      currentSortSettings = sortingModule.sortListItems('time', newOrder);
      
      updateSortButtonsState(timeSortButton, viewersSortButton, currentSortSettings);
    });
    
    // Add click event listener for viewers sort button
    viewersSortButton.addEventListener('click', function() {
      const currentSettings = sortingModule.getCurrentSortSettings();
      const newOrder = currentSettings.sortBy === 'viewers' && currentSettings.viewersOrder === 'desc' ? 'asc' : 'desc';
      
      currentSortSettings = sortingModule.sortListItems('viewers', newOrder);
      
      updateSortButtonsState(timeSortButton, viewersSortButton, currentSortSettings);
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
        showFeedbackMessage(applyButton, 'Applied!');
      }
    });
    
    // Add click event listener for minimize/maximize button
    minimizeButton.addEventListener('click', function() {
      minimized = !minimized;
      
      if (minimized) {
        contentContainer.classList.add('fssorter-hidden');
        minimizeButton.textContent = '+';
      } else {
        contentContainer.classList.remove('fssorter-hidden');
        minimizeButton.textContent = '−';
      }
    });
    
    // Add theme toggle button
    const themeToggleButton = document.createElement('button');
    themeToggleButton.textContent = 'Toggle Theme';
    themeToggleButton.className = 'fssorter-button fssorter-secondary-button';
    themeToggleButton.style.marginTop = '10px';
    contentContainer.appendChild(themeToggleButton);
    
    // Add click event for theme toggle
    themeToggleButton.addEventListener('click', function() {
      const newMode = themeModule.toggleColorMode();
      
      // Update theme on all elements
      themeModule.applyTheme(controlsContainer, 'controls-container');
      
      // Show feedback
      showFeedbackMessage(themeToggleButton, `Theme: ${newMode.charAt(0).toUpperCase() + newMode.slice(1)}`);
    });
    
    // Add export URLs button
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export Priority URLs';
    exportButton.className = 'fssorter-button fssorter-secondary-button';
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
    countLabel.className = 'fssorter-label';
    countLabel.style.marginTop = '10px';
    contentContainer.appendChild(countLabel);
    
    // Update the count occasionally
    setInterval(() => {
      countLabel.textContent = `Priority rooms visible: ${priorityRoomsModule.getVisibleCount()}`;
    }, 2000);
  }
  
  // Helper function to update sort button state
  function updateSortButtonsState(timeButton, viewersButton, settings) {
    // Reset both buttons to secondary style
    timeButton.className = 'fssorter-button fssorter-secondary-button';
    viewersButton.className = 'fssorter-button fssorter-secondary-button';
    
    // Update text and highlight active sort
    if (settings.sortBy === 'time') {
      timeButton.className = 'fssorter-button fssorter-primary-button';
      timeButton.textContent = `Sort by Time ${settings.timeOrder === 'desc' ? '↓' : '↑'}`;
      viewersButton.textContent = `Sort by Viewers ${settings.viewersOrder === 'desc' ? '↓' : '↑'}`;
    } else {
      viewersButton.className = 'fssorter-button fssorter-primary-button';
      timeButton.textContent = `Sort by Time ${settings.timeOrder === 'desc' ? '↓' : '↑'}`;
      viewersButton.textContent = `Sort by Viewers ${settings.viewersOrder === 'desc' ? '↓' : '↑'}`;
    }
  }
  
  // Helper function to show temporary feedback on a button
  function showFeedbackMessage(button, message) {
    const originalText = button.textContent;
    const originalClass = button.className;
    
    button.textContent = message;
    
    // Apply feedback style
    button.classList.remove('fssorter-primary-button', 'fssorter-secondary-button');
    button.classList.add('fssorter-action-button');
    
    // Restore original state after delay
    setTimeout(() => {
      button.textContent = originalText;
      button.className = originalClass;
    }, 1500);
  }
  
  // Public API
  return {
    init
  };
})();

export default uiControlsModule;