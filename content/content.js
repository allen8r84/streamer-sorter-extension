// Main content script - entry point that loads all modules dynamically
(function() {
    console.log("Followed Streamers Sorter Extension v1.0.0 initializing...");
    
    // Helper function to dynamically load modules
    function loadModule(moduleName) {
      return import(chrome.runtime.getURL(`content/modules/${moduleName}.js`))
        .then(module => module.default)
        .catch(err => console.error(`Error loading module ${moduleName}:`, err));
    }
    
    // Check if we're on the right pages to activate the extension
    const isFollowedCamsPage = window.location.pathname.includes('/followed-cams/');
    const isStreamerPage = /^\/[a-zA-Z0-9_-]+\/?$/.test(window.location.pathname);
    const shouldActivateSorter = isFollowedCamsPage || !isStreamerPage;
    
    if (!shouldActivateSorter) {
      console.log("On individual streamer page - Extension not activated");
      return;
    }
    
    // First, get settings from background script
    chrome.runtime.sendMessage({ action: "getSettings" }, async (settings) => {
      if (!settings) {
        console.error("Failed to get settings");
        return;
      }
      
      // Load modules
      const storageModule = await loadModule('storageModule');
      const themeModule = await loadModule('themeModule');
      const urlModule = await loadModule('urlModule');
      const sortingModule = await loadModule('sortingModule');
      const priorityRoomsModule = await loadModule('priorityRoomsModule');
      const uiControlsModule = await loadModule('uiControlsModule');
      const paginationModule = await loadModule('paginationModule');
      
      // Initialize modules (order matters)
      storageModule.init(settings);
      themeModule.init(settings.colorMode);
      urlModule.init();
      priorityRoomsModule.init(settings.priorityRooms, settings.highlightColor);
      sortingModule.init(priorityRoomsModule.isPriorityRoom, priorityRoomsModule.highlightPriorityRoom);
      
      // If on followed-cams page with pagination, handle it
      if (isFollowedCamsPage) {
        const hasPagination = document.querySelector('#roomlist_pagination');
        if (hasPagination) {
          paginationModule.init(sortingModule, priorityRoomsModule, () => {
            // Initialize UI after pagination is complete
            uiControlsModule.init(sortingModule, priorityRoomsModule, themeModule);
          });
          return;
        }
      }
      
      // For pages without pagination, just sort and create UI
      sortingModule.sortListItems('time', 'desc');
      uiControlsModule.init(sortingModule, priorityRoomsModule, themeModule);
    });
  })();