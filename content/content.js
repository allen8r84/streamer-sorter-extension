// content.js - Updated page detection
(function() {
  console.log("Followed Streamers Sorter Extension v1.0.0 initializing...");
  
  // Helper function to dynamically load modules
  function loadModule(moduleName) {
    return import(chrome.runtime.getURL(`content/modules/${moduleName}.js`))
      .then(module => module.default)
      .catch(err => {
        console.error(`Error loading module ${moduleName}:`, err);
        // Return a fallback empty module to prevent crashes
        return {
          init: () => console.warn(`Using fallback empty module for ${moduleName}`)
        };
      });
  }
  
  // More robust page detection
  function detectPageType() {
    const pathname = window.location.pathname;
    
    // Check for followed-cams page variations
    const isFollowedCamsPage = (
      pathname.includes('/followed-cams/') || 
      pathname.includes('/followed/') || 
      pathname.includes('/followedcams') ||
      (pathname === '/' && document.title.toLowerCase().includes('follow'))
    );
    
    // Check for individual streamer page with more specific patterns
    const isStreamerPage = (
      /^\/[a-zA-Z0-9_-]{3,20}\/?$/.test(pathname) &&
      !pathname.includes('/followed') &&
      !pathname.includes('/tags/') &&
      !pathname.includes('/categories/')
    );
    
    // Additional checks for common sections that shouldn't activate the sorter
    const isExcludedSection = (
      pathname.includes('/tags/') ||
      pathname.includes('/categories/') ||
      pathname.includes('/explore/') ||
      pathname.includes('/accounts/') ||
      pathname.includes('/auth/') ||
      pathname.includes('/settings/')
    );
    
    // Look for DOM evidence that we're on the correct page
    const hasRoomListElement = !!document.querySelector(
      'ul.list.endless_page_template, div.room-list, .endless_page_template, [class*="room-list"]'
    );
    
    console.log(`Page detection: followed=${isFollowedCamsPage}, streamer=${isStreamerPage}, excluded=${isExcludedSection}, hasRoomList=${hasRoomListElement}`);
    
    return {
      isFollowedCamsPage,
      isStreamerPage,
      isExcludedSection,
      hasRoomListElement,
      shouldActivateSorter: (isFollowedCamsPage || hasRoomListElement) && !isExcludedSection && !isStreamerPage
    };
  }
  
  // Get page type
  const pageType = detectPageType();
  
  if (!pageType.shouldActivateSorter) {
    console.log("Extension not activated for this page type");
    return;
  }
  
  // Rest of the script remains the same, but with added error handling
  chrome.runtime.sendMessage({ action: "getSettings" }, async (settings) => {
    if (!settings) {
      console.error("Failed to get settings, using defaults");
      settings = {
        priorityRooms: [],
        highlightColor: "#FFFF00",
        colorMode: "light"
      };
    }
    
    try {
      // Load modules with better error handling
      const modules = {};
      const moduleNames = ['storageModule', 'themeModule', 'urlModule', 'sortingModule', 
                          'priorityRoomsModule', 'uiControlsModule', 'paginationModule'];
      
      for (const name of moduleNames) {
        modules[name] = await loadModule(name);
        if (!modules[name]) {
          console.warn(`Module ${name} failed to load properly`);
        }
      }
      
      // Initialize modules with existence checks
      if (modules.storageModule) modules.storageModule.init(settings);
      if (modules.themeModule) modules.themeModule.init(settings.colorMode);
      if (modules.urlModule) modules.urlModule.init();
      
      // Initialize modules with dependencies, checking each exists first
      if (modules.priorityRoomsModule) {
        modules.priorityRoomsModule.init(settings.priorityRooms, settings.highlightColor);
      }
      
      if (modules.sortingModule && modules.priorityRoomsModule) {
        modules.sortingModule.init(
          modules.priorityRoomsModule.isPriorityRoom, 
          modules.priorityRoomsModule.highlightPriorityRoom
        );
      }
      
      // Handle pagination if needed
      if (pageType.isFollowedCamsPage) {
        const hasPagination = !!document.querySelector('#roomlist_pagination, [class*="pagination"]');
        if (hasPagination && modules.paginationModule) {
          modules.paginationModule.init(
            modules.sortingModule, 
            modules.priorityRoomsModule, 
            () => {
              // Initialize UI after pagination is complete
              if (modules.uiControlsModule) {
                modules.uiControlsModule.init(
                  modules.sortingModule, 
                  modules.priorityRoomsModule, 
                  modules.themeModule
                );
              }
            }
          );
          return;
        }
      }
      
      // For pages without pagination, just sort and create UI
      if (modules.sortingModule) {
        modules.sortingModule.sortListItems('time', 'desc');
      }
      
      if (modules.uiControlsModule) {
        modules.uiControlsModule.init(
          modules.sortingModule, 
          modules.priorityRoomsModule, 
          modules.themeModule
        );
      }
    } catch (error) {
      console.error("Error initializing extension:", error);
    }
  });
})();