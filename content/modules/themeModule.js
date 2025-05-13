// Theme Module - Handles color schemes and themes
const themeModule = (() => {
    // Theme state
    let colorMode = "light";
    let storageModule; // Reference to storage module
  
    // Color schemes
    const colorSchemes = {
      light: {
        background: "#f0f0f0",
        text: "#000000",
        border: "#cccccc",
        controlBackground: "#f0f0f0",
        buttonBackground: "#306A91",
        secondaryButtonBackground: "#888888",
        actionButtonBackground: "#4CAF50",
        deleteButtonBackground: "#ff4d4d",
        inputBackground: "#ffffff",
        headerBackground: "#306A91",
        collapsedBackground: "#e0e0e0",
        popupBackground: "#f0f0f0",
        popupContentBackground: "#ffffff",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        panelBorder: "none"
      },
      dark: {
        background: "#222222",
        text: "#f0f0f0",
        border: "#555555",
        controlBackground: "#333333",
        buttonBackground: "#0c6a93",
        secondaryButtonBackground: "#555555",
        actionButtonBackground: "#2d6e31",
        deleteButtonBackground: "#8B0000",
        inputBackground: "#444444",
        headerBackground: "#0c6a93",
        collapsedBackground: "#3a3a3a",
        popupBackground: "#333333",
        popupContentBackground: "#444444",
        boxShadow: "0 0 10px rgba(0,0,0,0.5)",
        panelBorder: "1px solid #777777"
      }
    };
  
    // Initialize the module
    function init(initialColorMode) {
      // Import storage module if needed
      import(chrome.runtime.getURL('content/modules/storageModule.js'))
        .then(module => {
          storageModule = module.default;
        });
      
      colorMode = initialColorMode || detectSiteDarkMode() ? "dark" : "light";
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
  
    // Get color scheme for current mode
    function getCurrentColorScheme() {
      return colorSchemes[colorMode];
    }
  
    // Get color scheme for a specific element
    function getElementColorScheme(elementType) {
      const currentScheme = colorSchemes[colorMode];
      
      // Each element type has its own style mapping
      const styleMap = {
        popup: {
          backgroundColor: currentScheme.popupBackground,
          color: currentScheme.text,
          boxShadow: currentScheme.boxShadow,
          borderColor: currentScheme.border,
          border: currentScheme.panelBorder
        },
        popupContent: {
          backgroundColor: currentScheme.popupContentBackground,
          color: currentScheme.text,
          borderColor: currentScheme.border
        },
        primaryButton: {
          backgroundColor: currentScheme.buttonBackground,
          color: "#ffffff"
        },
        secondaryButton: {
          backgroundColor: currentScheme.secondaryButtonBackground,
          color: "#ffffff"
        },
        actionButton: {
          backgroundColor: currentScheme.actionButtonBackground,
          color: "#ffffff"
        },
        controlPanel: {
          backgroundColor: currentScheme.controlBackground,
          color: currentScheme.text,
          boxShadow: currentScheme.boxShadow,
          border: currentScheme.panelBorder
        },
        inputField: {
          backgroundColor: currentScheme.inputBackground,
          color: currentScheme.text,
          borderColor: currentScheme.border
        },
        header: {
          backgroundColor: currentScheme.headerBackground,
          color: "#ffffff"
        },
        collapsedSection: {
          backgroundColor: currentScheme.collapsedBackground,
          color: currentScheme.text,
          border: colorMode === 'dark' ? "1px solid #666666" : "none"
        }
      };
  
      return styleMap[elementType] || {};
    }
  
    // Apply color scheme to an element
    function applyColorScheme(element, styles) {
      for (const [property, value] of Object.entries(styles)) {
        element.style[property] = value;
      }
    }
  
    // Get current mode
    function getCurrentMode() {
      return colorMode;
    }
  
    // Public API
    return {
      init,
      toggleColorMode,
      getCurrentColorScheme,
      getElementColorScheme,
      applyColorScheme,
      getCurrentMode
    };
  })();
  
  export default themeModule;