// ==UserScript==
// @name         Followed Streamers Sorter
// @namespace    http://tampermonkey.net/
// @version      2025-05-07
// @description  try to take over the world!
// @author       You
// @match        https://chaturbate.com/followed-cams/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chaturbate.com
// @grant        none
// ==/UserScript==

// todo:
// 1. fix all buttons formatting to be the same
// 2. space buttons out a bit better
// **WONT DO**3. "in private" streams- avoid coppying when printing out URLs (as on option)
// 4. trigger priority rooms function when history changes
// **DONE**5. more than 90 rooms loaded...?
// 6. button for return to "default" color schemes
// 7. Organization of priority rooms into categories/folders
// 8. typing the enter key activates the "add priority room"
// **DONE**9. change "add priority room" to "add priority streamer"
// **DONE**10. Change name to "Followed Streamers Sorter"
// **DONE**11. Change anywhere it says "Priority" to "Favorite"
// **DONE**12. Change "print priority rooms" to "list live favorite streams"
// **DONE**13. change "current priority rooms" to "view all favorite streams"
// 14. add an undo button and functionality when deleting a favorite stream
// 15. on discover page, hide all "non followed" rooms
// 16. expand to work on a streamer page "more rooms"
// 17. expand to work on offline rooms
// 18, total rooms at bottom of all rurrent favorites
// 19. Statistics
// 20. refresh buttons
// 21. batch add urls (imprrt - possible proprietary)
// 22. export full favorites list
// 23. increase/decrease preview size



(function() {
    /**
     * Followed Streamers Sorter v58
     *
     * Self-executing function to sort room list items by streaming time or viewers
     * with priority for specific rooms and persistent storage of settings
     * Added dark mode support in v55
     * Fixed duplicate controls issue in v56
     * Fixed header spacing in minimized mode in v57
     * Fixed header title centering in v58
     *
     * Version history:
     * v52: Initial working version
     * v53: Version with issues (not used)
     * v54: Fixed version (equivalent to v52)
     * v55: Added dark mode toggle with persistent preferences
     * v56: Fixed issue with duplicate controls appearing on streamer pages
     * v57: Fixed header spacing in minimized mode to prevent overlap
     * v58: Fixed header title centering in all states
     */

    // Default priority rooms if nothing is stored
    const defaultPriorityRooms = ["katyerave","mishabrizo","mariannacruzz","jeangreybianca","ericamiracle15","bunnydollstella","emilylittle","sia_woori","dakota_blare","diamond_jo_","doseofhappiness","marcela_davila1"];

    // Default highlight color
    const defaultHighlightColor = "#FFFF00"; // Bright yellow

    // Default color theme
    const defaultColorMode = "light";

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

    // Load priority rooms from storage or use defaults
    let priorityRooms = loadPriorityRooms();

    // Load highlight color from storage or use default
    let highlightColor = loadHighlightColor();

    // Load color mode from storage or use default
    let colorMode = loadColorMode();
    let currentColorScheme = colorSchemes[colorMode];

    // Global flag to track if we've already created the controls
    let controlsCreated = false;

    // Flag to track if we're on the followed-cams page
    const isFollowedCamsPage = window.location.pathname.includes('/followed-cams/');

    // Storage for all streams from all pages
    const allStreamsList = [];

    // Current processing page
    let currentProcessingPage = 1;

    // Total pages to process
    let totalPagesToProcess = 1;

    // Flag to track if we're currently processing pages
    let isProcessingPages = false;

    console.log(`Starting Followed Streamers Sorter v58 in ${colorMode} mode...`);

    // Check if there are any existing controls and remove them before proceeding
    function removeExistingControls() {
        const existingControls = document.querySelector('#cb-streamer-sorter');
        if (existingControls) {
            console.log("Found existing controls, removing them first");
            document.body.removeChild(existingControls);
            controlsCreated = false;
        }
    }

    // Track visible priority rooms count
    let visiblePriorityRoomsCount = 0;

    // Add a check specifically for streamer pages
    const isStreamerPage = /^\/[a-zA-Z0-9_-]+\/?$/.test(window.location.pathname);

    // Determine if the sorter should be active on this page
    const shouldActivateSorter = isFollowedCamsPage || !isStreamerPage;

    // Only activate on appropriate pages, not on individual streamer pages
    if (shouldActivateSorter) {
        // Remove any existing instances first (important for navigation between pages)
        removeExistingControls();

        // If we're on the followed-cams page, check for pagination and collect streams if needed
        if (isFollowedCamsPage) {
            console.log("Detected followed-cams page, checking for pagination...");
            // Start the process after a short delay to ensure the page is fully loaded
            setTimeout(checkPaginationAndCollect, 500);
        } else {
            // For other applicable pages (but not individual streamer pages), run normal functionality
            sortListItems('time', 'desc');
            createSortControls();
        }
    } else {
        console.log("On individual streamer page - Followed Streamers Sorter not activated");
    }

    /**
     * Detect if the site is in dark mode
     * @returns {boolean} - True if the site appears to be in dark mode
     */
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

    /**
     * Apply color scheme to an element based on current mode
     * @param {Element} element - The element to style
     * @param {Object} styles - Styles to apply
     */
    function applyColorScheme(element, styles) {
        for (const [property, value] of Object.entries(styles)) {
            element.style[property] = value;
        }
    }

    /**
     * Get color scheme for a specific element
     * @param {string} elementType - Type of element (e.g., 'popup', 'button')
     * @returns {Object} - Style object
     */
    function getElementColorScheme(elementType) {
        // Each element type has its own style mapping
        const styleMap = {
            popup: {
                backgroundColor: currentColorScheme.popupBackground,
                color: currentColorScheme.text,
                boxShadow: currentColorScheme.boxShadow,
                borderColor: currentColorScheme.border,
                border: currentColorScheme.panelBorder
            },
            popupContent: {
                backgroundColor: currentColorScheme.popupContentBackground,
                color: currentColorScheme.text,
                borderColor: currentColorScheme.border
            },
            primaryButton: {
                backgroundColor: currentColorScheme.buttonBackground,
                color: "#ffffff"
            },
            secondaryButton: {
                backgroundColor: currentColorScheme.secondaryButtonBackground,
                color: "#ffffff"
            },
            actionButton: {
                backgroundColor: currentColorScheme.actionButtonBackground,
                color: "#ffffff"
            },
            controlPanel: {
                backgroundColor: currentColorScheme.controlBackground,
                color: currentColorScheme.text,
                boxShadow: currentColorScheme.boxShadow,
                border: currentColorScheme.panelBorder
            },
            inputField: {
                backgroundColor: currentColorScheme.inputBackground,
                color: currentColorScheme.text,
                borderColor: currentColorScheme.border
            },
            header: {
                backgroundColor: currentColorScheme.headerBackground,
                color: "#ffffff"
            },
            collapsedSection: {
                backgroundColor: currentColorScheme.collapsedBackground,
                color: currentColorScheme.text,
                border: colorMode === 'dark' ? "1px solid #666666" : "none"
            }
        };

        return styleMap[elementType] || {};
    }

    /**
     * Toggle the color mode between light and dark
     */
    function toggleColorMode() {
        // Toggle mode
        colorMode = colorMode === 'light' ? 'dark' : 'light';
        currentColorScheme = colorSchemes[colorMode];

        // Save preference
        saveColorMode(colorMode);

        console.log(`Switched to ${colorMode} mode`);

        // Re-apply styles to existing controls if they exist
        const controlsContainer = document.querySelector('#cb-streamer-sorter');
        if (controlsContainer) {
            // Set the global flag to false before removing
            controlsCreated = false;

            // Remove and recreate the controls
            document.body.removeChild(controlsContainer);
            createSortControls();

            // Re-sort the list to update highlights
            sortListItems('time', 'desc');
        }
    }

    /**
     * Load color mode preference from localStorage or cookies
     * @returns {string} - 'light' or 'dark'
     */
    function loadColorMode() {
        // Try to detect site mode first
        const siteIsDarkMode = detectSiteDarkMode();

        // Try localStorage first
        const storedMode = localStorage.getItem('cb-colorMode');
        if (storedMode) {
            console.log("Loaded color mode from localStorage:", storedMode);
            return storedMode;
        }

        // Fallback to cookies
        const cookieMode = getCookie('cb-colorMode');
        if (cookieMode) {
            console.log("Loaded color mode from cookie:", cookieMode);
            return cookieMode;
        }

        // If nothing stored, use site mode or default
        const detectedMode = siteIsDarkMode ? 'dark' : defaultColorMode;
        console.log("Using detected/default color mode:", detectedMode);
        return detectedMode;
    }

    /**
     * Save color mode preference to localStorage and cookie
     * @param {string} mode - 'light' or 'dark'
     */
    function saveColorMode(mode) {
        // Save to localStorage
        try {
            localStorage.setItem('cb-colorMode', mode);
            console.log("Saved color mode to localStorage");
        } catch (e) {
            console.error("Error saving color mode to localStorage:", e);
        }

        // Also save to cookie as backup
        try {
            setCookie('cb-colorMode', mode, 365); // expires in 365 days
            console.log("Saved color mode to cookie");
        } catch (e) {
            console.error("Error saving color mode to cookie:", e);
        }
    }

    /**
     * Check if pagination exists and start collection process if needed
     */
    function checkPaginationAndCollect() {
        // Check if pagination exists
        const paginationElement = document.querySelector('#roomlist_pagination');
        if (!paginationElement) {
            console.log("No pagination found, just applying sort");
            sortListItems('time', 'desc');
            createSortControls();
            return;
        }

        // Find the total number of pages
        totalPagesToProcess = findTotalPages(paginationElement);

        if (totalPagesToProcess <= 1) {
            console.log("Only one page found, just applying sort");
            sortListItems('time', 'desc');
            createSortControls();
            return;
        }

        console.log(`Found ${totalPagesToProcess} pages of followed streams. Starting collection process...`);

        // Create and show the progress indicator
        const progressIndicator = createProgressIndicator(totalPagesToProcess);
        document.body.appendChild(progressIndicator);

        // Start collecting streams from all pages
        collectAllStreams(progressIndicator);
    }

    /**
     * Find the total number of pages from the pagination element
     * @param {Element} paginationElement - The pagination element
     * @returns {number} - Total number of pages
     */
    function findTotalPages(paginationElement) {
        let maxPage = 1;

        // Method 1: Check for LastPage attribute
        const lastPageElement = paginationElement.querySelector('[data-paction-name="LastPage"] a');
        if (lastPageElement && lastPageElement.textContent) {
            const pageNum = parseInt(lastPageElement.textContent.trim(), 10);
            if (!isNaN(pageNum)) {
                maxPage = pageNum;
            }
        } else {
            // Method 2: Check all page links and find the highest number
            const pageLinks = paginationElement.querySelectorAll('a[data-testid="page-number-button"]');
            pageLinks.forEach(link => {
                const pageNum = parseInt(link.textContent.trim(), 10);
                if (!isNaN(pageNum) && pageNum > maxPage) {
                    maxPage = pageNum;
                }
            });
        }

        return maxPage;
    }

    /**
     * Create a progress indicator element
     * @param {number} totalPages - Total number of pages to process
     * @returns {Element} - The progress indicator element
     */
    function createProgressIndicator(totalPages) {
        const progressIndicator = document.createElement('div');
        progressIndicator.id = "stream-collector-indicator";
        progressIndicator.style.position = 'fixed';
        progressIndicator.style.top = '50%';
        progressIndicator.style.left = '50%';
        progressIndicator.style.transform = 'translate(-50%, -50%)';
        progressIndicator.style.padding = '20px';
        progressIndicator.style.zIndex = '10000';
        progressIndicator.style.textAlign = 'center';
        progressIndicator.style.width = '300px';

        // Apply color scheme
        applyColorScheme(progressIndicator, {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '5px'
        });

        progressIndicator.innerHTML = `<div>Loading all followed streams</div>
                                     <div style="margin: 10px 0;">Page <span id="load-progress">1</span> of ${totalPages}</div>
                                     <div style="margin-bottom: 10px;">Found <span id="streams-count">0</span> streams</div>
                                     <div class="progress-bar" style="width: 100%; height: 20px; background-color: #333; border-radius: 10px; overflow: hidden;">
                                        <div id="progress-fill" style="width: 0%; height: 100%; background-color: #4CAF50;"></div>
                                     </div>`;
        return progressIndicator;
    }

    /**
     * Collect streams from all pagination pages
     * @param {Element} progressIndicator - The progress indicator element
     */
    function collectAllStreams(progressIndicator) {
        if (isProcessingPages) {
            return; // Already processing
        }

        isProcessingPages = true;
        currentProcessingPage = 1;

        // Get streams from the current page (page 1)
        const streamsList = document.querySelector('ul.list.endless_page_template.show-location');
        if (!streamsList) {
            console.error("Could not find the stream list container");
            isProcessingPages = false;
            if (document.body.contains(progressIndicator)) {
                document.body.removeChild(progressIndicator);
            }
            return;
        }

        // Store page 1 streams
        const currentPageStreams = Array.from(streamsList.querySelectorAll('li.roomCard'));
        allStreamsList.push(...currentPageStreams.map(stream => stream.cloneNode(true)));

        // Update progress indicators
        document.getElementById('load-progress').textContent = "1";
        document.getElementById('streams-count').textContent = allStreamsList.length;
        document.getElementById('progress-fill').style.width = `${(1 / totalPagesToProcess) * 100}%`;

        console.log(`Collected ${currentPageStreams.length} streams from page 1`);

        // If there's more than one page, move to the next page
        if (totalPagesToProcess > 1) {
            // Proceed to next page after a delay to avoid overwhelming the server
            setTimeout(() => {
                processNextPage(progressIndicator);
            }, 500);
        } else {
            // Only one page, finish up
            finishCollection(progressIndicator);
        }
    }

    /**
     * Process the next page in the pagination
     * @param {Element} progressIndicator - The progress indicator element
     */
    function processNextPage(progressIndicator) {
        currentProcessingPage++;

        if (currentProcessingPage > totalPagesToProcess) {
            // We've processed all pages, combine the results
            finishCollection(progressIndicator);
            return;
        }

        // Update progress indicators
        document.getElementById('load-progress').textContent = currentProcessingPage;
        document.getElementById('progress-fill').style.width = `${(currentProcessingPage / totalPagesToProcess) * 100}%`;

        console.log(`Processing page ${currentProcessingPage} of ${totalPagesToProcess}`);

        // Navigate to the next page in the pagination
        navigateToPage(currentProcessingPage, progressIndicator);
    }

    /**
     * Navigate to a specific page and collect streams
     * @param {number} pageNum - The page number to navigate to
     * @param {Element} progressIndicator - The progress indicator element
     */
    function navigateToPage(pageNum, progressIndicator) {
        // Create a temporary iframe to load the page
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = `/followed-cams/?page=${pageNum}`;

        // Listen for the iframe to load
        iframe.onload = function() {
            try {
                // Get the content from the iframe
                const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

                // Find all stream cards in the iframe
                const streamCards = Array.from(iframeDocument.querySelectorAll('li.roomCard'));

                // Clone and store the stream cards
                const clonedCards = streamCards.map(card => card.cloneNode(true));
                allStreamsList.push(...clonedCards);

                console.log(`Collected ${streamCards.length} streams from page ${pageNum}`);

                // Update the streams count
                document.getElementById('streams-count').textContent = allStreamsList.length;

                // Remove the iframe
                document.body.removeChild(iframe);

                // Process the next page after a delay
                setTimeout(() => {
                    processNextPage(progressIndicator);
                }, 800);
            } catch (error) {
                console.error(`Error processing page ${pageNum}:`, error);

                // Remove the iframe
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }

                // Try an alternative method
                fetchPageWithXHR(pageNum, progressIndicator);
            }
        };

        // Handle iframe load errors
        iframe.onerror = function() {
            console.error(`Error loading iframe for page ${pageNum}`);

            // Remove the iframe
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }

            // Try an alternative method
            fetchPageWithXHR(pageNum, progressIndicator);
        };

        // Add the iframe to the document
        document.body.appendChild(iframe);

        // Set a timeout to catch if the iframe doesn't load properly
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                console.log(`Timeout reached for iframe loading page ${pageNum}, trying alternative method`);
                document.body.removeChild(iframe);
                fetchPageWithXHR(pageNum, progressIndicator);
            }
        }, 5000);
    }

    /**
     * Fetch a page using XMLHttpRequest instead of iframe
     * @param {number} pageNum - The page number to fetch
     * @param {Element} progressIndicator - The progress indicator element
     */
    function fetchPageWithXHR(pageNum, progressIndicator) {
        console.log(`Fetching page ${pageNum} with XHR`);

        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/followed-cams/?page=${pageNum}`, true);

        xhr.onload = function() {
            if (xhr.status === 200) {
                // Create a parser to parse the HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(xhr.responseText, 'text/html');

                // Find all stream cards in the fetched page
                const streamCards = Array.from(doc.querySelectorAll('li.roomCard'));

                // Clone and store the stream cards
                const clonedCards = streamCards.map(card => card.cloneNode(true));
                allStreamsList.push(...clonedCards);

                console.log(`Collected ${streamCards.length} streams from page ${pageNum} using XHR`);

                // Update the streams count
                document.getElementById('streams-count').textContent = allStreamsList.length;

                // Process the next page after a delay
                setTimeout(() => {
                    processNextPage(progressIndicator);
                }, 800);
            } else {
                console.error(`XHR request for page ${pageNum} failed with status ${xhr.status}`);
                // Move to the next page anyway
                setTimeout(() => {
                    processNextPage(progressIndicator);
                }, 800);
            }
        };

        xhr.onerror = function() {
            console.error(`XHR request for page ${pageNum} failed`);
            // Move to the next page anyway
            setTimeout(() => {
                processNextPage(progressIndicator);
            }, 800);
        };

        xhr.send();
    }

    /**
     * Finish the collection process and combine all streams
     * @param {Element} progressIndicator - The progress indicator element
     */
    function finishCollection(progressIndicator) {
        console.log(`Finished collecting streams from all ${totalPagesToProcess} pages`);
        console.log(`Total streams collected: ${allStreamsList.length}`);

        // Update loading message
        progressIndicator.innerHTML = `<div>Combining ${allStreamsList.length} streams...</div>`;

        // Get the main stream list container
        const streamsList = document.querySelector('ul.list.endless_page_template.show-location');
        if (!streamsList) {
            console.error("Could not find the stream list container");
            isProcessingPages = false;
            if (document.body.contains(progressIndicator)) {
                document.body.removeChild(progressIndicator);
            }
            return;
        }

        // Clear the current list
        while (streamsList.firstChild) {
            streamsList.removeChild(streamsList.firstChild);
        }

        // Add all collected streams to the main list
        allStreamsList.forEach(stream => {
            streamsList.appendChild(stream);
        });

        // Hide the pagination element
        const paginationElement = document.querySelector('#roomlist_pagination');
        if (paginationElement) {
            paginationElement.style.display = 'none';
        }

        // Update loading message
        progressIndicator.innerHTML = `<div>Successfully combined ${allStreamsList.length} streams!</div>`;

        // Remove loading indicator after a short delay
        setTimeout(() => {
            if (document.body.contains(progressIndicator)) {
                document.body.removeChild(progressIndicator);
            }

            // Now apply sorting and create controls
            sortListItems('time', 'desc');
            createSortControls();

            // Reset processing flag
            isProcessingPages = false;
        }, 1500);
    }

    /**
     * Load priority rooms from localStorage or cookies
     * @returns {Array} - Array of priority room names
     */
    function loadPriorityRooms() {
        // Try localStorage first
        const storedRooms = localStorage.getItem('cb-priorityRooms');
        if (storedRooms) {
            try {
                const parsedRooms = JSON.parse(storedRooms);
                console.log("Loaded priority rooms from localStorage:", parsedRooms);
                return parsedRooms;
            } catch (e) {
                console.error("Error parsing priority rooms from localStorage:", e);
            }
        }

        // Fallback to cookies
        const cookieRooms = getCookie('cb-priorityRooms');
        if (cookieRooms) {
            try {
                const parsedRooms = JSON.parse(cookieRooms);
                console.log("Loaded priority rooms from cookie:", parsedRooms);
                return parsedRooms;
            } catch (e) {
                console.error("Error parsing priority rooms from cookie:", e);
            }
        }

        // Use defaults if nothing is stored
        console.log("Using default priority rooms:", defaultPriorityRooms);
        return [...defaultPriorityRooms];
    }

    /**
     * Load highlight color from localStorage or cookies
     * @returns {string} - Color value for highlighting
     */
    function loadHighlightColor() {
        // Try localStorage first
        const storedColor = localStorage.getItem('cb-highlightColor');
        if (storedColor) {
            console.log("Loaded highlight color from localStorage:", storedColor);
            return storedColor;
        }

        // Fallback to cookies
        const cookieColor = getCookie('cb-highlightColor');
        if (cookieColor) {
            console.log("Loaded highlight color from cookie:", cookieColor);
            return cookieColor;
        }

        // Use default if nothing is stored
        console.log("Using default highlight color:", defaultHighlightColor);
        return defaultHighlightColor;
    }

    /**
     * Save priority rooms to localStorage and cookie
     * @param {Array} rooms - Array of room names to save
     */
    function savePriorityRooms(rooms) {
        const roomsJson = JSON.stringify(rooms);

        // Save to localStorage
        try {
            localStorage.setItem('cb-priorityRooms', roomsJson);
            console.log("Saved priority rooms to localStorage");
        } catch (e) {
            console.error("Error saving priority rooms to localStorage:", e);
        }

        // Also save to cookie as backup
        try {
            setCookie('cb-priorityRooms', roomsJson, 365); // expires in 365 days
            console.log("Saved priority rooms to cookie");
        } catch (e) {
            console.error("Error saving priority rooms to cookie:", e);
        }
    }

    /**
     * Save highlight color to localStorage and cookie
     * @param {string} color - Color value to save
     */
    function saveHighlightColor(color) {
        // Save to localStorage
        try {
            localStorage.setItem('cb-highlightColor', color);
            console.log("Saved highlight color to localStorage");
        } catch (e) {
            console.error("Error saving highlight color to localStorage:", e);
        }

        // Also save to cookie as backup
        try {
            setCookie('cb-highlightColor', color, 365); // expires in 365 days
            console.log("Saved highlight color to cookie");
        } catch (e) {
            console.error("Error saving highlight color to cookie:", e);
        }
    }

    /**
     * Set a cookie with a given name, value, and expiration days
     * @param {string} name - Cookie name
     * @param {string} value - Cookie value
     * @param {number} days - Number of days until expiration
     */
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
    }

    /**
     * Get a cookie value by name
     * @param {string} name - Cookie name
     * @returns {string|null} - Cookie value or null if not found
     */
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    }

    /**
     * Extract time value from an li element and convert it to minutes
     * @param {Element} li - The list item element
     * @returns {number} - Time value in minutes
     */
    function extractTimeInMinutes(li) {
        // Find the time span within the li
        const timeSpan = li.querySelector('div.details > ul.sub-info.camAltTextColor > li.cams > span.time');

        if (!timeSpan) {
            return 0; // Return 0 if time span not found
        }

        const timeText = timeSpan.textContent.trim();

        // Extract the numeric value and determine if it's hours or minutes
        let minutes = 0;

        if (timeText.includes('hrs') || timeText.includes('hr')) {
            // Convert hours to minutes
            const hours = parseFloat(timeText.split(' ')[0]);
            minutes = hours * 60;
        } else if (timeText.includes('mins') || timeText.includes('min')) {
            // Already in minutes
            minutes = parseFloat(timeText.split(' ')[0]);
        }

        return minutes;
    }

    /**
     * Extract viewer count from an li element
     * @param {Element} li - The list item element
     * @returns {number} - Viewer count as a number
     */
    function extractViewerCount(li) {
        // Find the viewers span within the li
        const viewersSpan = li.querySelector('div.details > ul.sub-info.camAltTextColor > li.cams > span.viewers');

        if (!viewersSpan) {
            return 0; // Return 0 if viewers span not found
        }

        const viewersText = viewersSpan.textContent.trim();

        // Extract just the number from text like "123 viewers"
        const viewersMatch = viewersText.match(/(\d+)/);
        if (viewersMatch && viewersMatch[1]) {
            return parseInt(viewersMatch[1], 10);
        }

        return 0;
    }

    /**
     * Check if a room is in the priority list
     * @param {Element} li - The list item element
     * @returns {boolean} - True if the room is in the priority list
     */
    function isPriorityRoom(li) {
        const roomElement = li.querySelector('div.details > div > a');
        if (roomElement && roomElement.getAttribute('data-room')) {
            const roomName = roomElement.getAttribute('data-room');
            return priorityRooms.includes(roomName);
        }
        return false;
    }

    /**
     * Extract room name from a URL
     * @param {string} url - URL to extract room name from
     * @returns {string|null} - Room name or null if not found
     */
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

    /**
     * Sort room list items by priority and selected sort criteria
     * @param {string} sortBy - 'time' or 'viewers'
     * @param {string} order - 'asc' for ascending or 'desc' for descending
     */
    function sortListItems(sortBy = 'time', order = 'desc') {
        // Select the main list
        const ul = document.querySelector('ul.list.endless_page_template.show-location');

        if (!ul) {
            console.error("Could not find the room list container!");
            return;
        }

        // Convert NodeList to array for easier manipulation
        const liItems = Array.from(ul.querySelectorAll('li.roomCard'));

        console.log(`Found ${liItems.length} room list items to sort by ${sortBy} (${order}).`);

        // Reset visible priority rooms count
        visiblePriorityRoomsCount = 0;

        // Sort the array based on priority and selected criteria
        liItems.sort((a, b) => {
            // Check if they are priority rooms
            const aIsPriority = isPriorityRoom(a);
            const bIsPriority = isPriorityRoom(b);

            // If one is priority and the other is not, prioritize the priority room
            if (aIsPriority && !bIsPriority) return -1;
            if (!aIsPriority && bIsPriority) return 1;

            // If both are priority or both are not, sort by selected criteria
            let valueA, valueB;

            if (sortBy === 'time') {
                valueA = extractTimeInMinutes(a);
                valueB = extractTimeInMinutes(b);
            } else { // sortBy === 'viewers'
                valueA = extractViewerCount(a);
                valueB = extractViewerCount(b);
            }

            if (order.toLowerCase() === 'asc') {
                return valueA - valueB;
            } else {
                return valueB - valueA;
            }
        });

        // Clear the ul and append the sorted li elements
        // Also highlight priority rooms and count visible priority rooms
        while (ul.firstChild) {
            ul.removeChild(ul.firstChild);
        }

        liItems.forEach(li => {
            // Add or reset background highlighting
            if (isPriorityRoom(li)) {
                li.style.backgroundColor = highlightColor; // Use selected highlight color
                li.style.border = "3px solid #FFD700"; // Gold border
                li.style.boxShadow = "0 0 10px rgba(255, 215, 0, 0.6)"; // Glowing effect
                visiblePriorityRoomsCount++; // Increment visible priority rooms count
            } else {
                li.style.backgroundColor = "";
                li.style.border = "";
                li.style.boxShadow = "";
            }

            // Append the li to the ul
            ul.appendChild(li);
        });

        console.log(`Successfully sorted ${liItems.length} room list items by ${sortBy} (${order}).`);
        console.log(`Visible priority rooms: ${visiblePriorityRoomsCount}`);

        // Update priority streams counter if it exists
        updatePriorityCounter();
    }

    /**
     * Update the priority streams counter
     */
    function updatePriorityCounter() {
        const counterElement = document.getElementById('priorityRoomsCounter');
        if (counterElement) {
            counterElement.textContent = visiblePriorityRoomsCount;
        }
    }

    /**
     * Create a popup with URLs and copy functionality
     * @param {string} urls - Space-separated URLs to display
     */
    function createUrlsPopup(urls) {
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

        // Apply color scheme
        applyColorScheme(popupContainer, getElementColorScheme('popup'));

        // Create title container with X button
        const titleContainer = document.createElement('div');
        titleContainer.style.display = 'flex';
        titleContainer.style.justifyContent = 'space-between';
        titleContainer.style.alignItems = 'center';
        titleContainer.style.marginBottom = '10px';
        titleContainer.style.paddingBottom = '5px';
        titleContainer.style.borderBottom = `1px solid ${currentColorScheme.border}`;
        popupContainer.appendChild(titleContainer);

        // Create title
        const title = document.createElement('div');
        title.textContent = 'Favorite Streamer URLs';
        title.style.fontWeight = 'bold';
        title.style.color = currentColorScheme.text;
        titleContainer.appendChild(title);

        // Create X button
        const closeX = document.createElement('div');
        closeX.textContent = '✕';
        closeX.style.cursor = 'pointer';
        closeX.style.fontWeight = 'bold';
        closeX.style.fontSize = '16px';
        closeX.style.padding = '0 5px';
        closeX.style.color = currentColorScheme.text;
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
        urlContent.style.border = `1px solid ${currentColorScheme.border}`;
        urlContent.textContent = urls;

        // Apply color scheme
        applyColorScheme(urlContent, getElementColorScheme('popupContent'));

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

        // Apply color scheme
        applyColorScheme(copyButton, getElementColorScheme('primaryButton'));

        buttonsContainer.appendChild(copyButton);

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.padding = '8px 12px';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';

        // Apply color scheme
        applyColorScheme(closeButton, getElementColorScheme('secondaryButton'));

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
                    copyButton.style.backgroundColor = currentColorScheme.actionButtonBackground;

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

    // Create UI controls for configuring and managing the sort
    function createSortControls() {
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
        controlsContainer.style.left = 'auto';
        controlsContainer.style.right = '10px';
        controlsContainer.style.zIndex = '9999';
        controlsContainer.style.padding = '10px';
        controlsContainer.style.borderRadius = '5px';
        controlsContainer.style.display = 'flex';
        controlsContainer.style.flexDirection = 'column';
        controlsContainer.style.gap = '5px';

        // Apply color scheme
        applyColorScheme(controlsContainer, getElementColorScheme('controlPanel'));

        // Create a very distinct header for dragging
        const dragHeader = document.createElement('div');
        dragHeader.style.padding = '8px 10px';
        dragHeader.style.fontWeight = 'bold';
        dragHeader.style.marginBottom = '10px';
        dragHeader.style.borderRadius = '3px';
        dragHeader.style.cursor = 'move';
        dragHeader.style.userSelect = 'none';
        dragHeader.style.position = 'relative';
        dragHeader.style.display = 'flex';
        dragHeader.style.justifyContent = 'center'; // Center the content
        dragHeader.style.alignItems = 'center';

        // Apply color scheme
        applyColorScheme(dragHeader, getElementColorScheme('header'));

        // Create title span that will remain centered
        const titleSpan = document.createElement('span');
        titleSpan.textContent = 'Followed Streamers Sorter';
        titleSpan.style.position = 'absolute';
        titleSpan.style.left = '50%';
        titleSpan.style.transform = 'translateX(-50%)';
        titleSpan.style.textAlign = 'center';
        titleSpan.style.pointerEvents = 'none'; // Prevent interfering with drag
        dragHeader.appendChild(titleSpan);

        controlsContainer.appendChild(dragHeader);

        // Create buttons container for dark mode toggle and minimize
        const headerButtonsContainer = document.createElement('div');
        headerButtonsContainer.style.position = 'absolute';
        headerButtonsContainer.style.right = '5px';
        headerButtonsContainer.style.top = '50%';
        headerButtonsContainer.style.transform = 'translateY(-50%)';
        headerButtonsContainer.style.display = 'flex';
        headerButtonsContainer.style.gap = '8px';
        headerButtonsContainer.style.alignItems = 'center';
        dragHeader.appendChild(headerButtonsContainer);

        // Create dark mode toggle button
        const darkModeToggle = document.createElement('button');
        darkModeToggle.innerHTML = colorMode === 'light' ? '🌙' : '☀️'; // Moon for light mode (switch to dark), Sun for dark mode (switch to light)
        darkModeToggle.style.padding = '2px 4px';
        darkModeToggle.style.backgroundColor = 'transparent';
        darkModeToggle.style.border = 'none';
        darkModeToggle.style.cursor = 'pointer';
        darkModeToggle.style.fontSize = '14px';
        darkModeToggle.style.color = '#fff';
        darkModeToggle.style.display = 'flex';
        darkModeToggle.style.alignItems = 'center';
        darkModeToggle.style.justifyContent = 'center';
        darkModeToggle.title = colorMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
        headerButtonsContainer.appendChild(darkModeToggle);

        // Add click event for dark mode toggle
        darkModeToggle.addEventListener('click', function(e) {
            // Stop propagation to prevent triggering drag
            e.stopPropagation();
            toggleColorMode();
        });

        // Add minimize button
        const minimizeButton = document.createElement('button');
        minimizeButton.textContent = '−';
        minimizeButton.style.backgroundColor = 'transparent';
        minimizeButton.style.border = 'none';
        minimizeButton.style.color = '#fff';
        minimizeButton.style.fontWeight = 'bold';
        minimizeButton.style.fontSize = '16px';
        minimizeButton.style.cursor = 'pointer';
        minimizeButton.style.padding = '0 5px';
        headerButtonsContainer.appendChild(minimizeButton);

        // Simple drag implementation
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        dragHeader.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            // Don't drag if clicking the minimize button or dark mode toggle
            if (e.target === minimizeButton || e.target === darkModeToggle) return;

            e = e || window.event;
            e.preventDefault();

            // Get the mouse cursor position at startup
            pos3 = e.clientX;
            pos4 = e.clientY;

            // Highlight during drag
            dragHeader.style.backgroundColor = colorMode === 'light' ? '#1c4061' : '#204060';

            // Stop moving when mouse button is released
            document.onmouseup = closeDragElement;
            // Call function on mouse movement
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();

            // Calculate the new cursor position
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            // Set the element's new position
            const top = (controlsContainer.offsetTop - pos2);
            const left = (controlsContainer.offsetLeft - pos1);

            controlsContainer.style.top = top + "px";
            controlsContainer.style.left = left + "px";
            controlsContainer.style.right = "auto";
        }

        function closeDragElement() {
            // Stop moving when mouse button is released
            document.onmouseup = null;
            document.onmousemove = null;

            // Restore original color
            applyColorScheme(dragHeader, getElementColorScheme('header'));
        }

        // Create sort buttons container - keep this separate for controlled visibility
        const sortButtonsContainer = document.createElement('div');
        sortButtonsContainer.style.display = 'flex';
        sortButtonsContainer.style.gap = '5px';
        sortButtonsContainer.style.marginBottom = '5px';
        controlsContainer.appendChild(sortButtonsContainer);

        // Create time sort button
        const timeSortButton = document.createElement('button');
        timeSortButton.textContent = 'Sort by Time ↓';
        timeSortButton.style.padding = '5px 10px';
        timeSortButton.style.border = 'none';
        timeSortButton.style.borderRadius = '4px';
        timeSortButton.style.cursor = 'pointer';
        timeSortButton.style.flex = '1';

        // Apply color scheme
        applyColorScheme(timeSortButton, getElementColorScheme('primaryButton'));

        sortButtonsContainer.appendChild(timeSortButton);

        // Create viewers sort button
        const viewersSortButton = document.createElement('button');
        viewersSortButton.textContent = 'Sort by Viewers ↓';
        viewersSortButton.style.padding = '5px 10px';
        viewersSortButton.style.border = 'none';
        viewersSortButton.style.borderRadius = '4px';
        viewersSortButton.style.cursor = 'pointer';
        viewersSortButton.style.flex = '1';

        // Apply color scheme
        applyColorScheme(viewersSortButton, getElementColorScheme('secondaryButton'));

        sortButtonsContainer.appendChild(viewersSortButton);

        // Create color selector section
        const colorLabel = document.createElement('div');
        colorLabel.textContent = 'Favorite Streamers Highlight Color:';
        colorLabel.style.marginTop = '5px';
        colorLabel.style.color = currentColorScheme.text;

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = highlightColor;
        colorInput.style.width = '100%';
        colorInput.style.marginBottom = '5px';
        colorInput.style.padding = '2px';
        colorInput.style.borderRadius = '4px';
        colorInput.style.border = `1px solid ${currentColorScheme.border}`;

        // Create a URL input section
        const urlLabel = document.createElement('div');
        urlLabel.textContent = 'Add Favorite Streamer URL:';
        urlLabel.style.marginTop = '5px';
        urlLabel.style.color = currentColorScheme.text;

        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.placeholder = 'Paste room URL here';
        urlInput.style.boxSizing = 'border-box'; // Include padding in width calculation
        urlInput.style.width = '100%';
        urlInput.style.padding = '5px';
        urlInput.style.marginBottom = '5px';
        urlInput.style.borderRadius = '4px';
        urlInput.style.border = `1px solid ${currentColorScheme.border}`;

        // Apply color scheme
        applyColorScheme(urlInput, getElementColorScheme('inputField'));

        // Create apply button container
        const applyContainer = document.createElement('div');
        applyContainer.style.display = 'flex';
        applyContainer.style.alignItems = 'center';
        applyContainer.style.gap = '10px';

        // Create apply button
        const applyButton = document.createElement('button');
        applyButton.textContent = 'Add Favorite Streamer';
        applyButton.style.padding = '5px 10px';
        applyButton.style.border = 'none';
        applyButton.style.borderRadius = '4px';
        applyButton.style.cursor = 'pointer';

        // Apply color scheme
        applyColorScheme(applyButton, getElementColorScheme('actionButton'));

        applyContainer.appendChild(applyButton);

        // Create priority counter (showing visible priority rooms)
        const priorityCounter = document.createElement('div');
        priorityCounter.innerHTML = 'Total Live Favorites: <span id="priorityRoomsCounter">' + visiblePriorityRoomsCount + '</span>';
        priorityCounter.style.marginLeft = '10px';
        priorityCounter.style.color = currentColorScheme.text;
        applyContainer.appendChild(priorityCounter);

        // Create priority rooms list section
        const priorityListLabelContainer = document.createElement('div');
        priorityListLabelContainer.style.display = 'flex';
        priorityListLabelContainer.style.justifyContent = 'space-between'; // Space items evenly
        priorityListLabelContainer.style.alignItems = 'center';
        priorityListLabelContainer.style.marginTop = '5px';
        priorityListLabelContainer.style.padding = '6px 10px'; // Increased padding
        priorityListLabelContainer.style.borderRadius = '4px';
        priorityListLabelContainer.style.boxSizing = 'border-box';

        // Apply color scheme
        applyColorScheme(priorityListLabelContainer, getElementColorScheme('collapsedSection'));

        // Create "Current Priority Rooms" button that functions as toggle
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'View All Favorite Streams';
        toggleButton.style.padding = '4px 8px'; // Same as Print Priority Rooms button
        toggleButton.style.fontSize = '12px';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '3px';
        toggleButton.style.cursor = 'pointer';

        // Apply color scheme
        applyColorScheme(toggleButton, getElementColorScheme('primaryButton'));

        priorityListLabelContainer.appendChild(toggleButton);

        // Create Print Priority Rooms button
        const printButton = document.createElement('button');
        printButton.textContent = 'List Live Favorite Streams';
        printButton.style.padding = '4px 8px';
        printButton.style.fontSize = '12px';
        printButton.style.border = 'none';
        printButton.style.borderRadius = '3px';
        printButton.style.cursor = 'pointer';
        printButton.style.marginLeft = 'auto'; // Push to the right

        // Apply color scheme
        applyColorScheme(printButton, getElementColorScheme('actionButton'));

        priorityListLabelContainer.appendChild(printButton);

        // Create priority list display with border in dark mode
        const priorityListDisplay = document.createElement('div');
        priorityListDisplay.id = 'priorityRoomsList';
        priorityListDisplay.style.maxHeight = '100px';
        priorityListDisplay.style.overflowY = 'auto';
        priorityListDisplay.style.padding = '5px';
        priorityListDisplay.style.borderRadius = '4px';
        priorityListDisplay.style.marginBottom = '5px';
        priorityListDisplay.style.display = 'none'; // Initially collapsed
        priorityListDisplay.style.border = colorMode === 'dark' ? '1px solid #777' : '1px solid #ccc';

        // Apply color scheme
        applyColorScheme(priorityListDisplay, getElementColorScheme('inputField'));

        // Add toggle functionality
        toggleButton.addEventListener('click', function() {
            if (priorityListDisplay.style.display === 'none') {
                priorityListDisplay.style.display = 'block';
                toggleButton.style.backgroundColor = colorMode === 'light' ? '#1c4061' : '#204060'; // Darker shade when expanded
            } else {
                priorityListDisplay.style.display = 'none';
                applyColorScheme(toggleButton, getElementColorScheme('primaryButton')); // Restore original color
            }
        });

        // Add click event for the print button
        printButton.addEventListener('click', function(event) {
            // Stop event propagation to prevent triggering the collapsible section
            event.stopPropagation();

            // Get all visible priority rooms from the page
            const ul = document.querySelector('ul.list.endless_page_template.show-location');
            if (!ul) {
                createUrlsPopup("No room list found on the page.");
                return;
            }

            // Get all visible room cards
            const visibleRooms = Array.from(ul.querySelectorAll('li.roomCard'));

            // Filter to only visible priority rooms
            const visiblePriorityRooms = [];
            visibleRooms.forEach(li => {
                const roomElement = li.querySelector('div.details > div > a');
                if (roomElement && roomElement.getAttribute('data-room')) {
                    const roomName = roomElement.getAttribute('data-room');
                    if (priorityRooms.includes(roomName)) {
                        visiblePriorityRooms.push(roomName);
                    }
                }
            });

            if (visiblePriorityRooms.length > 0) {
                // Construct URLs with each on its own line
                const urls = visiblePriorityRooms.map(room => `https://chaturbate.com/${room}/`).join('\n');

                // Create popup with the URLs
                createUrlsPopup(urls);
            } else {
                // Create popup with a message that no priority rooms are visible
                createUrlsPopup("No visible favorite streams on the current page.");
            }
        });

        // Function to update the priority rooms list display
        function updatePriorityRoomsList() {
            priorityListDisplay.innerHTML = '';

            if (priorityRooms.length === 0) {
                const noRoomsText = document.createElement('div');
                noRoomsText.textContent = 'No favorite streamers added';
                noRoomsText.style.color = currentColorScheme.text;
                priorityListDisplay.appendChild(noRoomsText);
                return;
            }

            // Create a list of rooms with delete buttons
            priorityRooms.forEach(room => {
                const roomItem = document.createElement('div');
                roomItem.style.display = 'flex';
                roomItem.style.justifyContent = 'space-between';
                roomItem.style.marginBottom = '2px';

                const roomName = document.createElement('span');
                roomName.textContent = room;
                roomName.style.color = currentColorScheme.text;
                roomItem.appendChild(roomName);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'X';
                deleteButton.style.color = 'white';
                deleteButton.style.border = 'none';
                deleteButton.style.borderRadius = '3px';
                deleteButton.style.padding = '0px 5px';
                deleteButton.style.cursor = 'pointer';
                deleteButton.style.fontSize = '12px';
                deleteButton.style.backgroundColor = currentColorScheme.deleteButtonBackground;

                deleteButton.addEventListener('click', function() {
                    // Remove the room from the priority list
                    const index = priorityRooms.indexOf(room);
                    if (index !== -1) {
                        priorityRooms.splice(index, 1);
                        savePriorityRooms(priorityRooms);
                        updatePriorityRoomsList();
                        updatePriorityCounter();
                        sortListItems(currentSortBy, currentSortBy === 'time' ? currentTimeOrder : currentViewersOrder);
                    }
                });

                roomItem.appendChild(deleteButton);
                priorityListDisplay.appendChild(roomItem);
            });
        }

        // Initial update of the priority rooms list
        updatePriorityRoomsList();

        // Keep track of current sort settings
        let currentSortBy = 'time';
        let currentTimeOrder = 'desc';
        let currentViewersOrder = 'desc';

        // Add click event listener for time sort button
        timeSortButton.addEventListener('click', function() {
            currentSortBy = 'time';
            currentTimeOrder = currentTimeOrder === 'desc' ? 'asc' : 'desc';

            sortListItems(currentSortBy, currentTimeOrder);

            // Update button text
            timeSortButton.textContent = `Sort by Time ${currentTimeOrder === 'desc' ? '↓' : '↑'}`;
            viewersSortButton.textContent = `Sort by Viewers ${currentViewersOrder === 'desc' ? '↓' : '↑'}`;

            // Highlight active sort button
            applyColorScheme(timeSortButton, getElementColorScheme('primaryButton'));
            applyColorScheme(viewersSortButton, getElementColorScheme('secondaryButton'));
        });

        // Add click event listener for viewers sort button
        viewersSortButton.addEventListener('click', function() {
            currentSortBy = 'viewers';
            currentViewersOrder = currentViewersOrder === 'desc' ? 'asc' : 'desc';

            sortListItems(currentSortBy, currentViewersOrder);

            // Update button text
            timeSortButton.textContent = `Sort by Time ${currentTimeOrder === 'desc' ? '↓' : '↑'}`;
            viewersSortButton.textContent = `Sort by Viewers ${currentViewersOrder === 'desc' ? '↓' : '↑'}`;

            // Highlight active sort button
            applyColorScheme(timeSortButton, getElementColorScheme('secondaryButton'));
            applyColorScheme(viewersSortButton, getElementColorScheme('primaryButton'));
        });

        // Add change event listener for color input
        colorInput.addEventListener('change', function() {
            highlightColor = colorInput.value;
            saveHighlightColor(highlightColor);
            sortListItems(currentSortBy, currentSortBy === 'time' ? currentTimeOrder : currentViewersOrder);
        });

        // Add click event listener for apply button
        applyButton.addEventListener('click', function() {
            const url = urlInput.value.trim();
            if (url) {
                const roomName = extractRoomNameFromUrl(url);
                if (roomName) {
                    // Check if room is already in the list
                    if (!priorityRooms.includes(roomName)) {
                        // Add the room to the priority list
                        priorityRooms.push(roomName);
                        savePriorityRooms(priorityRooms);

                        // Clear the input
                        urlInput.value = '';

                        // Update the priority rooms list display
                        updatePriorityRoomsList();

                        // Re-sort the list
                        sortListItems(currentSortBy, currentSortBy === 'time' ? currentTimeOrder : currentViewersOrder);

                        console.log(`Added new favorite streamer: ${roomName}`);
                    } else {
                        console.log(`Streamer ${roomName} is already in the favorites list`);
                        // Still clear the input
                        urlInput.value = '';
                    }
                } else {
                    console.error("Could not extract room name from URL:", url);
                }
            }
        });

        // Create content container for minimize/maximize
        const contentContainer = document.createElement('div');
        contentContainer.style.display = 'block';

        // Add content that should be hideable
        contentContainer.appendChild(colorLabel);
        contentContainer.appendChild(colorInput);
        contentContainer.appendChild(urlLabel);
        contentContainer.appendChild(urlInput);
        contentContainer.appendChild(applyContainer);
        contentContainer.appendChild(priorityListLabelContainer);
        contentContainer.appendChild(priorityListDisplay);

        // Add click event listener for minimize/maximize button
        let minimized = false;
        minimizeButton.addEventListener('click', function(e) {
            // Stop propagation to prevent triggering drag
            e.stopPropagation();

            if (minimized) {
                // Show full content except for already toggled sections
                contentContainer.style.display = 'block';
                minimizeButton.textContent = '−';
                controlsContainer.style.width = '';

                // Reset any layout changes we made when minimizing
                dragHeader.style.justifyContent = 'center';
                dragHeader.style.paddingLeft = '10px';
                dragHeader.style.paddingRight = '10px';
            } else {
                // Hide most content but keep sorting buttons visible
                contentContainer.style.display = 'none';
                sortButtonsContainer.style.display = 'flex'; // Keep sorting buttons visible
                minimizeButton.textContent = '+';

                // Set a minimum width to prevent elements from overlapping in the header
                controlsContainer.style.width = 'auto';
                controlsContainer.style.minWidth = '300px'; // Ensure minimum width when minimized

                // Title is absolutely positioned and centered, no need to adjust it
                // Just adjust spacing for the buttons
                dragHeader.style.paddingLeft = '20px';
                dragHeader.style.paddingRight = '20px';
            }
            minimized = !minimized;
        });

        controlsContainer.appendChild(contentContainer);

        // Add container to the page
        document.body.appendChild(controlsContainer);

        // Mark controls as created to prevent duplicates
        controlsCreated = true;
    }

    // Execute the sort function with default values if we're not on the followed-cams page
    // (otherwise it will be called after collecting all streams)
    if (!isFollowedCamsPage) {
        sortListItems('time', 'desc');
        createSortControls();
    }

})();