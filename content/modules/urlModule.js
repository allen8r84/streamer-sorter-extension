// URL Module - Handles URL processing
const urlModule = (() => {
    // Initialize module
    function init() {
      console.log("URL Module initialized");
    }
  
    // Extract room name from a URL
    function extractRoomNameFromUrl(url) {
      try {
        // Create a URL object
        const urlObj = new URL(url);
  
        // Extract room name from pathname
        // This assumes URLs like "https://domain.com/somepath/roomname" where roomname is the last part
        const pathParts = urlObj.pathname.split('/').filter(part => part !== '');
        if (pathParts.length > 0) {
          return pathParts[pathParts.length - 1].toLowerCase();
        }
      } catch (e) {
        console.error("Error extracting room name from URL:", e);
      }
      return null;
    }
  
    // Create a popup with URLs and copy functionality
    function createUrlsPopup(urls, themeModule) {
      // Create container for popup
      const popupContainer = document.createElement('div');
      popupContainer.style.position = 'fixed';
      popupContainer.style.top = '50%';
      popupContainer.style.left = '50%';
      popupContainer.style.transform = 'translate(-50%, -50%)';
      popupContainer.style.zIndex = '10000';
      popupContainer.style.padding = '15px';
      popupContainer.style.borderRadius = '5px';
      popupContainer.style.width = '500px'; // Fixed width
      popupContainer.style.maxHeight = '80%';
      popupContainer.style.overflow = 'auto';
      popupContainer.style.boxSizing = 'border-box';
  
      // Apply color scheme if theme module available
      if (themeModule) {
        themeModule.applyColorScheme(popupContainer, themeModule.getElementColorScheme('popup'));
      } else {
        // Fallback styling
        popupContainer.style.backgroundColor = '#f0f0f0';
        popupContainer.style.color = '#000000';
        popupContainer.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
      }
  
      // Create title container with X button
      const titleContainer = document.createElement('div');
      titleContainer.style.display = 'flex';
      titleContainer.style.justifyContent = 'space-between';
      titleContainer.style.alignItems = 'center';
      titleContainer.style.marginBottom = '10px';
      titleContainer.style.paddingBottom = '5px';
      titleContainer.style.borderBottom = themeModule ? 
        `1px solid ${themeModule.getCurrentColorScheme().border}` : 
        '1px solid #ccc';
      popupContainer.appendChild(titleContainer);
  
      // Create title
      const title = document.createElement('div');
      title.textContent = 'Favorite Streamer URLs';
      title.style.fontWeight = 'bold';
      titleContainer.appendChild(title);
  
      // Create X button
      const closeX = document.createElement('div');
      closeX.textContent = '✕';
      closeX.style.cursor = 'pointer';
      closeX.style.fontWeight = 'bold';
      closeX.style.fontSize = '16px';
      closeX.style.padding = '0 5px';
      closeX.addEventListener('click', function() {
        if (document.body.contains(popupContainer)) {
          document.body.removeChild(popupContainer);
          document.removeEventListener('mousedown', closePopupOnOutsideClick);
        }
      });
      closeX.addEventListener('mouseover', function() {
        closeX.style.opacity = '0.7';
      });
      closeX.addEventListener('mouseout', function() {
        closeX.style.opacity = '1';
      });
      titleContainer.appendChild(closeX);
  
      // Create URL content area
      const urlContent = document.createElement('div');
      urlContent.style.padding = '10px';
      urlContent.style.borderRadius = '4px';
      urlContent.style.marginBottom = '10px';
      urlContent.style.overflowWrap = 'break-word';
      urlContent.style.maxHeight = '200px';
      urlContent.style.overflowY = 'auto';
      urlContent.style.whiteSpace = 'pre'; // Preserve line breaks
      urlContent.style.fontFamily = 'monospace'; // Use monospace font for better URL display
      urlContent.style.border = themeModule ? 
        `1px solid ${themeModule.getCurrentColorScheme().border}` : 
        '1px solid #ccc';
      urlContent.textContent = urls;
  
      // Apply color scheme to content if theme module available
      if (themeModule) {
        themeModule.applyColorScheme(urlContent, themeModule.getElementColorScheme('popupContent'));
      } else {
        // Fallback styling
        urlContent.style.backgroundColor = '#ffffff';
      }
  
      popupContainer.appendChild(urlContent);
  
      // Create buttons container
      const buttonsContainer = document.createElement('div');
      buttonsContainer.style.display = 'flex';
      buttonsContainer.style.justifyContent = 'space-between';
      popupContainer.appendChild(buttonsContainer);
  
      // Create copy button
      const copyButton = document.createElement('button');
      copyButton.textContent = 'Copy URLs to Clipboard';
      copyButton.style.padding = '8px 12px';
      copyButton.style.border = 'none';
      copyButton.style.borderRadius = '4px';
      copyButton.style.cursor = 'pointer';
  
      // Apply color scheme if theme module available
      if (themeModule) {
        themeModule.applyColorScheme(copyButton, themeModule.getElementColorScheme('primaryButton'));
      } else {
        // Fallback styling
        copyButton.style.backgroundColor = '#306A91';
        copyButton.style.color = 'white';
      }
  
      buttonsContainer.appendChild(copyButton);
  
      // Create close button
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.style.padding = '8px 12px';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '4px';
      closeButton.style.cursor = 'pointer';
  
      // Apply color scheme if theme module available
      if (themeModule) {
        themeModule.applyColorScheme(closeButton, themeModule.getElementColorScheme('secondaryButton'));
      } else {
        // Fallback styling
        closeButton.style.backgroundColor = '#888888';
        closeButton.style.color = 'white';
      }
  
      buttonsContainer.appendChild(closeButton);
  
      // Add click event for copy button
      copyButton.addEventListener('click', function() {
        navigator.clipboard.writeText(urls)
          .then(() => {
            // Temporarily change the button text to indicate success
            const originalText = copyButton.textContent;
            copyButton.textContent = 'Copied!';
  
            // Change style temporarily
            const originalBg = copyButton.style.backgroundColor;
            copyButton.style.backgroundColor = themeModule ? 
              themeModule.getCurrentColorScheme().actionButtonBackground : 
              '#4CAF50';
  
            // Change back after 2 seconds
            setTimeout(() => {
              copyButton.textContent = originalText;
              copyButton.style.backgroundColor = originalBg;
            }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy text: ', err);
            copyButton.textContent = 'Failed to Copy';
            copyButton.style.backgroundColor = '#f44336';
          });
      });
  
      // Add click event for close button
      closeButton.addEventListener('click', function() {
        if (document.body.contains(popupContainer)) {
          document.body.removeChild(popupContainer);
          document.removeEventListener('mousedown', closePopupOnOutsideClick);
        }
      });
  
      // Add click event for closing when clicking outside the popup
      const closePopupOnOutsideClick = function(event) {
        if (!popupContainer.contains(event.target)) {
          if (document.body.contains(popupContainer)) {
            document.body.removeChild(popupContainer);
            document.removeEventListener('mousedown', closePopupOnOutsideClick);
          }
        }
      };
  
      // Add the popup to the page
      document.body.appendChild(popupContainer);
  
      // Add event listener for outside clicks, but delay it slightly
      setTimeout(() => {
        document.addEventListener('mousedown', closePopupOnOutsideClick);
      }, 100);
  
      return popupContainer;
    }
  
    // Public API
    return {
      init,
      extractRoomNameFromUrl,
      createUrlsPopup
    };
  })();
  
  export default urlModule;