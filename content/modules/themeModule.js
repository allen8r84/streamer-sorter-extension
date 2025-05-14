// Theme Module - Handles color schemes and themes
const themeModule = (() => {
  // Theme state
  let colorMode = "light";
  let storageModule; // Reference to storage module

  // Initialize the module
  function init(initialColorMode) {
    // Import storage module if needed
    import(chrome.runtime.getURL('content/modules/storageModule.js'))
      .then(module => {
        storageModule = module.default;
      });
    
    colorMode = initialColorMode || (detectSiteDarkMode() ? "dark" : "light");
    console.log(`Theme module initialized with ${colorMode} mode`);
  }

  // Detect if the site is in dark mode
  function detectSiteDarkMode() {
    // Check if the body or html has .darkmode class
    const hasDarkModeClass = document.body.classList.contains('darkmode') ||
                            document.documentElement.classList.contains('darkmode');

    if (hasDarkModeClass) {
      console.log("Detected site dark mode via .darkmode class");
      return true;
    }

    // Fallback: Check if the body background is dark
    const bodyBgColor = window.getComputedStyle(document.body).backgroundColor;
    if (bodyBgColor) {
      // Parse RGB values
      const rgbMatch = bodyBgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 10);
        const g = parseInt(rgbMatch[2], 10);
        const b = parseInt(rgbMatch[3], 10);

        // Calculate brightness (simple formula)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        // If brightness is less than 128, consider it dark mode
        if (brightness < 128) {
          console.log("Detected site dark mode via background color brightness");
          return true;
        }
      }
    }

    return false;
  }

  // Toggle the color mode
  function toggleColorMode() {
    colorMode = colorMode === 'light' ? 'dark' : 'light';
    
    // Save to storage
    if (storageModule) {
      storageModule.saveSettings('colorMode', colorMode);
    } else {
      // Fallback if storage module not loaded yet
      chrome.runtime.sendMessage({ 
        action: "saveSettings", 
        data: { colorMode: colorMode } 
      });
    }
    
    console.log(`Switched to ${colorMode} mode`);
    return colorMode;
  }

  // Apply theme to an element
  function applyTheme(element, elementType) {
    if (!element || !(element instanceof Element)) {
      console.warn("Invalid element passed to applyTheme");
      return;
    }
    
    // Remove any existing theme classes first
    element.classList.remove('light-theme', 'dark-theme');
    
    // Add the current theme class
    element.classList.add(`${colorMode}-theme`);
    
    // Add specific element type class if provided
    if (elementType) {
      element.classList.add(`sorter-${elementType}`);
    }
  }

  // Get current mode
  function getCurrentMode() {
    return colorMode;
  }

  // Convert old style-based themes to CSS class-based themes
  function migrateElementStyles(element) {
    // Apply the appropriate theme class instead of direct styles
    applyTheme(element);
    
    // Clear any direct styles that might have been applied before
    const styleProps = [
      'backgroundColor', 'color', 'borderColor', 'boxShadow', 
      'border', 'borderRadius', 'padding', 'margin'
    ];
    
    styleProps.forEach(prop => {
      element.style[prop] = '';
    });
  }

  // Public API
  return {
    init,
    toggleColorMode,
    applyTheme,
    getCurrentMode,
    migrateElementStyles
  };
})();

export default themeModule;