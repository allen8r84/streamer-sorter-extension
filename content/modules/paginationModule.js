// paginationModule.js - Updated checkPaginationAndCollect function
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

  // Rest of the function remains the same...
}

// paginationModule.js - Updated findTotalPages function
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