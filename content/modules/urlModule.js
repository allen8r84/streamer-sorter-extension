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
    popupContainer.className = 'popup-container';
    
    // Apply theme if theme module available
    if (themeModule && typeof themeModule.applyTheme === 'function') {
      themeModule.applyTheme(popupContainer);
    }

    // Create title container with X button
    const titleContainer = document.createElement('div');
    titleContainer.className = 'popup-title-container';
    popupContainer.appendChild(titleContainer);

    // Create title
    const title = document.createElement('div');
    title.textContent = 'Favorite Streamer URLs';
    title.className = 'popup-title';
    titleContainer.appendChild(title);

    // Create X button
    const closeX = document.createElement('div');
    closeX.textContent = '✕';
    closeX.className = 'popup-close';
    closeX.addEventListener('click', function() {
      if (document.body.contains(popupContainer)) {
        document.body.removeChild(popupContainer);
        document.removeEventListener('mousedown', closePopupOnOutsideClick);
      }
    });
    titleContainer.appendChild(closeX);

    // Create URL content area
    const urlContent = document.createElement('div');
    urlContent.className = 'popup-content';
    urlContent.textContent = urls;
    popupContainer.appendChild(urlContent);

    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'popup-buttons-container';
    popupContainer.appendChild(buttonsContainer);

    // Create copy button
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy URLs to Clipboard';
    copyButton.className = 'sorter-button sorter-primary-button';
    buttonsContainer.appendChild(copyButton);

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.className = 'sorter-button sorter-secondary-button';
    buttonsContainer.appendChild(closeButton);

    // Add click event for copy button
    copyButton.addEventListener('click', function() {
      navigator.clipboard.writeText(urls)
        .then(() => {
          // Temporarily change the button text to indicate success
          const originalText = copyButton.textContent;
          copyButton.textContent = 'Copied!';

          // Change style temporarily
          copyButton.classList.remove('sorter-primary-button');
          copyButton.classList.add('sorter-action-button');

          // Change back after 2 seconds
          setTimeout(() => {
            copyButton.textContent = originalText;
            copyButton.classList.remove('sorter-action-button');
            copyButton.classList.add('sorter-primary-button');
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          copyButton.textContent = 'Failed to Copy';
          copyButton.classList.remove('sorter-primary-button');
          copyButton.classList.add('sorter-delete-button');
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