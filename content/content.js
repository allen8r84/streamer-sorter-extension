// Main content script - entry point that loads all modules dynamically
(function() {
  console.log("Followed Streamers Sorter Extension v1.0.0 initializing...");
  
  // Check if we're on the right page
  const isFollowedCamsPage = window.location.pathname.includes('/followed-cams/');
  const isStreamerPage = /^\/[a-zA-Z0-9_-]+\/?$/.test(window.location.pathname);
  
  // Only run on the followed-cams page, not on individual streamer pages
  if (!isFollowedCamsPage && isStreamerPage) {
    console.log("On individual streamer page - Extension not activated");
    return;
  }
  
  // Helper function to dynamically load modules
  function loadModule(moduleName) {
    return import(chrome.runtime.getURL(`content/modules/${moduleName}.js`))
      .then(module => module.default)
      .catch(err => {
        console.error(`Error loading module ${moduleName}:`, err);
        return null;
      });
  }
  
  // First, get settings from background script
  chrome.runtime.sendMessage({ action: "getSettings" }, (settings) => {
    if (!settings) {
      console.error("Failed to get settings, using defaults");
      settings = {
        priorityRooms: ["katyerave","mishabrizo","mariannacruzz","jeangreybianca","ericamiracle15"], // Default priority rooms
        highlightColor: "#FFFF00", // Default highlight color
        colorMode: "light" // Default color mode
      };
    }
    
    // Use a more synchronous-like approach for module loading
    loadModulesInOrder(settings);
  });
  
  // Load modules in a specific order with proper dependencies
  async function loadModulesInOrder(settings) {
    try {
      // Load modules in a specific order with wait
      const storageModule = await loadModule('storageModule');
      if (!storageModule) throw new Error("Failed to load storage module");
      storageModule.init(settings);
      
      const themeModule = await loadModule('themeModule');
      if (!themeModule) throw new Error("Failed to load theme module");
      themeModule.init(settings.colorMode);
      
      const priorityRoomsModule = await loadModule('priorityRoomsModule');
      if (!priorityRoomsModule) throw new Error("Failed to load priority rooms module");
      priorityRoomsModule.init(settings.priorityRooms, settings.highlightColor);
      
      const sortingModule = await loadModule('sortingModule');
      if (!sortingModule) throw new Error("Failed to load sorting module");
      sortingModule.init(
        priorityRoomsModule.isPriorityRoom, 
        priorityRoomsModule.highlightPriorityRoom
      );
      
      // Check for pagination
      const paginationModule = await loadModule('paginationModule');
      if (!paginationModule) throw new Error("Failed to load pagination module");
      
      const uiControlsModule = await loadModule('uiControlsModule');
      if (!uiControlsModule) throw new Error("Failed to load UI controls module");
      
      // Check if pagination exists
      const hasPagination = !!document.querySelector('#roomlist_pagination');
      
      if (hasPagination) {
        // Handle pagination
        paginationModule.init(sortingModule, priorityRoomsModule, () => {
          // Initialize UI after pagination is complete
          uiControlsModule.init(sortingModule, priorityRoomsModule, themeModule);
        });
      } else {
        // Just sort and create UI for single page
        sortingModule.sortListItems('time', 'desc');
        uiControlsModule.init(sortingModule, priorityRoomsModule, themeModule);
      }
      
    } catch (error) {
      console.error("Error initializing extension:", error);
    }
  }
})();