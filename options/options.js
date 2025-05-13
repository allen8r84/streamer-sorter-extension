document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const newPriorityRoomInput = document.getElementById('newPriorityRoom');
    const addPriorityRoomButton = document.getElementById('addPriorityRoom');
    const priorityRoomsListElement = document.getElementById('priorityRoomsList');
    const highlightColorPicker = document.getElementById('highlightColor');
    const lightThemeButton = document.getElementById('lightTheme');
    const darkThemeButton = document.getElementById('darkTheme');
    const autoThemeButton = document.getElementById('autoTheme');
    const resetDefaultButton = document.getElementById('resetDefault');
    const saveOptionsButton = document.getElementById('saveOptions');
    
    // Default values
    const defaultPriorityRooms = ["katyerave","mishabrizo","mariannacruzz","jeangreybianca","ericamiracle15","bunnydollstella","emilylittle","sia_woori","dakota_blare","diamond_jo_","doseofhappiness","marcela_davila1"];
    const defaultHighlightColor = "#FFFF00"; // Bright yellow
    const defaultColorMode = "auto";
    
    // Local state
    let priorityRooms = [];
    let highlightColor = defaultHighlightColor;
    let colorMode = defaultColorMode;
    
    // Load stored options
    loadOptions();
    
    // Event listeners
    addPriorityRoomButton.addEventListener('click', addPriorityRoom);
    newPriorityRoomInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        addPriorityRoom();
      }
    });
    
    highlightColorPicker.addEventListener('change', function() {
      highlightColor = highlightColorPicker.value;
    });
    
    lightThemeButton.addEventListener('click', function() {
      setThemeMode('light');
    });
    
    darkThemeButton.addEventListener('click', function() {
      setThemeMode('dark');
    });
    
    autoThemeButton.addEventListener('click', function() {
      setThemeMode('auto');
    });
    
    resetDefaultButton.addEventListener('click', resetToDefaults);
    saveOptionsButton.addEventListener('click', saveOptions);
    
    // Functions
    function loadOptions() {
      chrome.storage.sync.get(['priorityRooms', 'highlightColor', 'colorMode'], function(result) {
        // Priority rooms
        priorityRooms = result.priorityRooms || [...defaultPriorityRooms];
        renderPriorityRoomsList();
        
        // Highlight color
        highlightColor = result.highlightColor || defaultHighlightColor;
        highlightColorPicker.value = highlightColor;
        
        // Color mode
        colorMode = result.colorMode || defaultColorMode;
        updateThemeButtons();
      });
    }
    
    function renderPriorityRoomsList() {
      priorityRoomsListElement.innerHTML = '';
      
      if (priorityRooms.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.textContent = 'No priority streamers added yet.';
        emptyMessage.style.padding = '10px';
        emptyMessage.style.color = '#666';
        priorityRoomsListElement.appendChild(emptyMessage);
        return;
      }
      
      priorityRooms.forEach(function(room) {
        const itemElement = document.createElement('div');
        itemElement.className = 'priority-item';
        
        const nameElement = document.createElement('span');
        nameElement.textContent = room;
        itemElement.appendChild(nameElement);
        
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-button';
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', function() {
          removePriorityRoom(room);
        });
        itemElement.appendChild(removeButton);
        
        priorityRoomsListElement.appendChild(itemElement);
      });
    }
    
    function addPriorityRoom() {
      const roomName = newPriorityRoomInput.value.trim().toLowerCase();
      
      if (!roomName) {
        return;
      }
      
      if (!priorityRooms.includes(roomName)) {
        priorityRooms.push(roomName);
        renderPriorityRoomsList();
        newPriorityRoomInput.value = '';
      } else {
        alert('This streamer is already in your priority list.');
      }
    }
    
    function removePriorityRoom(roomName) {
      const index = priorityRooms.indexOf(roomName);
      if (index !== -1) {
        priorityRooms.splice(index, 1);
        renderPriorityRoomsList();
      }
    }
    
    function setThemeMode(mode) {
      colorMode = mode;
      updateThemeButtons();
    }
    
    function updateThemeButtons() {
      lightThemeButton.classList.toggle('active', colorMode === 'light');
      darkThemeButton.classList.toggle('active', colorMode === 'dark');
      autoThemeButton.classList.toggle('active', colorMode === 'auto');
    }
    
    function resetToDefaults() {
      if (confirm('Are you sure you want to reset all options to default values?')) {
        priorityRooms = [...defaultPriorityRooms];
        highlightColor = defaultHighlightColor;
        colorMode = defaultColorMode;
        
        // Update UI
        highlightColorPicker.value = highlightColor;
        updateThemeButtons();
        renderPriorityRoomsList();
        
        // Save to storage
        saveOptions();
      }
    }
    
    function saveOptions() {
      chrome.storage.sync.set({
        priorityRooms: priorityRooms,
        highlightColor: highlightColor,
        colorMode: colorMode
      }, function() {
        showSaveMessage();
        
        // Notify any active tabs about the changes
        chrome.tabs.query({url: "*://*.chaturbate.com/*"}, function(tabs) {
          tabs.forEach(function(tab) {
            chrome.tabs.sendMessage(tab.id, { 
              action: "settingsUpdated",
              settings: {
                priorityRooms: priorityRooms,
                highlightColor: highlightColor,
                colorMode: colorMode
              }
            });
          });
        });
      });
    }
    
    function showSaveMessage() {
      // Create message element if it doesn't exist
      let messageElement = document.querySelector('.save-message');
      if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.className = 'save-message';
        messageElement.textContent = 'Options saved!';
        document.body.appendChild(messageElement);
      }
      
      // Show and then hide the message
      messageElement.style.display = 'block';
      setTimeout(function() {
        messageElement.style.display = 'none';
      }, 2000);
    }
  });