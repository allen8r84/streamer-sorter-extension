// Pagination Module - Handles multi-page processing
const paginationModule = (() => {
  // Module state
  let isProcessingPages = false;
  let currentProcessingPage = 1;
  let totalPagesToProcess = 1;
  let allStreamsList = [];
  let sortingModule;
  let priorityRoomsModule;
  let completionCallback;

  // Initialize the module
  function init(sorting, priorityRooms, callback) {
    sortingModule = sorting;
    priorityRoomsModule = priorityRooms;
    completionCallback = callback;
    
    console.log("Pagination module initialized");
    
    // Start processing
    checkPaginationAndCollect();
  }

  // Check if pagination exists and start collection process if needed
  function checkPaginationAndCollect() {
    // Check if pagination exists with fallbacks
    let paginationElement = document.querySelector('#roomlist_pagination');
    
    // Try alternative selectors if not found
    if (!paginationElement) {
      paginationElement = document.querySelector('[class*="pagination"]');
      
      if (!paginationElement) {
        // Look for anything that might be pagination
        const potentialPagination = document.querySelectorAll('ul.paging, .paging, nav, [class*="page"], [data-testid*="pagination"]');
        
        for (const elem of potentialPagination) {
          // Check if it contains page numbers or navigation elements
          if (elem.querySelectorAll('a, li, .page, [class*="page"], [data-testid*="page"]').length > 0) {
            paginationElement = elem;
            console.warn("Using alternative pagination element:", elem);
            break;
          }
        }
      }
    }
    
    if (!paginationElement) {
      console.log("No pagination found, just applying sort");
      
      if (sortingModule && typeof sortingModule.sortListItems === 'function') {
        sortingModule.sortListItems('time', 'desc');
      } else {
        console.warn("Sorting module not available or missing sortListItems function");
      }
      
      if (completionCallback && typeof completionCallback === 'function') {
        completionCallback();
      }
      
      return;
    }

    // Find the total number of pages
    totalPagesToProcess = findTotalPages(paginationElement);

    if (totalPagesToProcess <= 1) {
      console.log("Only one page found, just applying sort");
      
      if (sortingModule) {
        sortingModule.sortListItems('time', 'desc');
      }
      
      if (completionCallback) {
        completionCallback();
      }
      
      return;
    }

    console.log(`Found ${totalPagesToProcess} pages of followed streams. Starting collection process...`);

    // Create and show the progress indicator
    const progressIndicator = createProgressIndicator(totalPagesToProcess);
    document.body.appendChild(progressIndicator);

    // Start collecting streams from all pages
    collectAllStreams(progressIndicator);
  }

  // Find the total number of pages from the pagination element
  function findTotalPages(paginationElement) {
    if (!paginationElement || !(paginationElement instanceof Element)) {
      console.warn("Invalid pagination element in findTotalPages");
      return 1; // Default to 1 page
    }
  
    let maxPage = 1;
  
    try {
      // Method 1: Check for LastPage attribute
      const lastPageElement = paginationElement.querySelector('[data-paction-name="LastPage"] a, .active a, .current a, li:last-child a');
      
      if (lastPageElement && lastPageElement.textContent) {
        const pageNum = parseInt(lastPageElement.textContent.trim(), 10);
        if (!isNaN(pageNum)) {
          maxPage = pageNum;
        }
      } else {
        // Method 2: Check all links for page numbers
        const pageSelectors = [
          'a[data-testid="page-number-button"]',
          'a[href*="page="]',
          'a[class*="page"]',
          'li[class*="page"] a',
          'a'
        ];
        
        // Try each selector until we find page links
        let pageLinks = [];
        for (const selector of pageSelectors) {
          pageLinks = paginationElement.querySelectorAll(selector);
          if (pageLinks.length > 0) {
            console.log(`Found page links using selector: ${selector}`);
            break;
          }
        }
        
        pageLinks.forEach(link => {
          // Try to extract page number from various sources
          let pageNum;
          
          // Try from text content
          pageNum = parseInt(link.textContent.trim(), 10);
          
          // If not a number, try from href with page parameter
          if (isNaN(pageNum) && link.href) {
            const pageMatch = link.href.match(/[?&]page=(\d+)/);
            if (pageMatch && pageMatch[1]) {
              pageNum = parseInt(pageMatch[1], 10);
            }
          }
          
          // Update max page if we found a valid number
          if (!isNaN(pageNum) && pageNum > maxPage) {
            maxPage = pageNum;
          }
        });
      }
      
      // Check if we might have missed pages by looking for "Next" or "Last" links
      const nextLinks = paginationElement.querySelectorAll('a.next, a[class*="next"], a[data-testid*="next"]');
      if (nextLinks.length > 0 && maxPage === 1) {
        // If we have a next button but only found 1 page, assume at least 2 pages
        maxPage = 2;
        console.warn("Using minimum of 2 pages based on Next button presence");
      }
      
    } catch (error) {
      console.warn("Error finding total pages:", error);
      // Default to 1 page
    }
  
    return maxPage;
  }

  // Create a progress indicator element
  function createProgressIndicator(totalPages) {
    const progressIndicator = document.createElement('div');
    progressIndicator.id = "stream-collector-indicator";
    progressIndicator.className = "progress-indicator";

    progressIndicator.innerHTML = `
      <div>Loading all followed streams</div>
      <div style="margin: 10px 0;">Page <span id="load-progress">1</span> of ${totalPages}</div>
      <div style="margin-bottom: 10px;">Found <span id="streams-count">0</span> streams</div>
      <div class="progress-bar-container">
        <div id="progress-fill" class="progress-bar-fill" style="width: 0%;"></div>
      </div>
    `;
    
    return progressIndicator;
  }

  // Collect streams from all pagination pages
  function collectAllStreams(progressIndicator) {
    if (isProcessingPages) {
      return; // Already processing
    }

    isProcessingPages = true;
    currentProcessingPage = 1;
    allStreamsList = [];

    // Get streams from the current page (page 1)
    const streamsList = document.querySelector('ul.list.endless_page_template.show-location');
    if (!streamsList) {
      console.error("Could not find the stream list container");
      isProcessingPages = false;
      if (document.body.contains(progressIndicator)) {
        document.body.removeChild(progressIndicator);
      }
      
      if (completionCallback) {
        completionCallback();
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

  // Process the next page in the pagination
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
    fetchPageWithXHR(currentProcessingPage, progressIndicator);
  }

  // Fetch a page using XMLHttpRequest
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

  // Finish the collection process and combine all streams
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
      
      if (completionCallback) {
        completionCallback();
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
      paginationElement.classList.add('sorter-hidden');
    }

    // Update loading message
    progressIndicator.innerHTML = `<div>Successfully combined ${allStreamsList.length} streams!</div>`;

    // Remove loading indicator after a short delay
    setTimeout(() => {
      if (document.body.contains(progressIndicator)) {
        document.body.removeChild(progressIndicator);
      }

      // Now apply sorting 
      if (sortingModule) {
        sortingModule.sortListItems('time', 'desc');
      }
      
      // Call completion callback to create UI
      if (completionCallback) {
        completionCallback();
      }

      // Reset processing flag
      isProcessingPages = false;
    }, 1500);
  }

  // Public API
  return {
    init
  };
})();

export default paginationModule;