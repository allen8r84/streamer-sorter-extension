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
      // Check if pagination exists
      const paginationElement = document.querySelector('#roomlist_pagination');
      if (!paginationElement) {
        console.log("No pagination found, just applying sort");
        
        if (sortingModule) {
          sortingModule.sortListItems('time', 'desc');
        }
        
        if (completionCallback) {
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
  
    // Create a progress indicator element
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
  
      // Apply styling
      Object.assign(progressIndicator.style, {
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
        paginationElement.style.display = 'none';
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