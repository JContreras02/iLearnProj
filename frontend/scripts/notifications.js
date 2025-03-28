// Add this to your student.js file

// Update notification counter
function updateNotificationCounter() {
    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Get all notification bell elements
    const notificationBells = document.querySelectorAll('.notification-bell');
    
    // Update each notification bell
    notificationBells.forEach(bell => {
      // Remove existing badge if present
      const existingBadge = bell.querySelector('.notification-badge');
      if (existingBadge) {
        existingBadge.remove();
      }
      
      // Add badge if there are unread notifications
      if (unreadCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'notification-badge';
        badge.textContent = unreadCount;
        bell.appendChild(badge);
        
        // Add pulse animation
        setTimeout(() => {
          badge.classList.add('pulse');
        }, 100);
      }
    });
  }
  
  // This function will be called when marking notifications as read
  function markNotificationAsRead(id) {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      updateNotificationCounter(); // Update the counter
      
      // Save to localStorage
      localStorage.setItem('notifications', JSON.stringify(notifications));
      
      // Update UI
      const item = document.querySelector(`.notification-item[data-id="${id}"]`);
      if (item) {
        item.classList.remove('unread');
        item.classList.add('read');
      }
    }
  }
  
  // This function will be called when marking all notifications as read
  function markAllNotificationsAsRead() {
    notifications.forEach(notification => {
      notification.read = true;
    });
    updateNotificationCounter(); // Update the counter
    
    // Save to localStorage
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Update UI
    document.querySelectorAll('.notification-item').forEach(item => {
      item.classList.remove('unread');
      item.classList.add('read');
    });
  }
  
  // Initialize notifications with counter
  function initializeNotifications() {
    // Check local storage for saved notifications
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      // Use saved notifications if they exist
      notifications = JSON.parse(savedNotifications);
    } else {
      // For demo purposes, let's create some sample notifications
      notifications = [
        {
          id: 1,
          type: 'assignment',
          title: 'New Assignment Added',
          message: 'Web Development Fundamentals: Portfolio Project has been assigned.',
          timestamp: Date.now() - 30 * 60 * 1000, // 30 minutes ago
          read: false
        },
        {
          id: 2,
          type: 'grade',
          title: 'Assignment Graded',
          message: 'Your Algorithm Analysis assignment has been graded. You received 92%.',
          timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
          read: false
        },
        {
          id: 3,
          type: 'announcement',
          title: 'Class Canceled',
          message: 'Tomorrow\'s Web Development lecture has been canceled.',
          timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
          read: true
        }
      ];
      
      // Save to localStorage
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  
    // Update notification counter
    updateNotificationCounter();
  }
  
  // Add CSS for notification badge with pulse animation
  function addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .notification-bell {
        position: relative;
        cursor: pointer;
      }
      
      .notification-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      
      .notification-badge.pulse {
        animation: pulse 0.5s ease-in-out;
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.3); }
        100% { transform: scale(1); }
      }
      
      .notification-panel {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        width: 320px;
        max-width: 90vw;
        max-height: 80vh;
        overflow: hidden;
        z-index: 1000;
      }
      
      .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .notification-header h3 {
        margin: 0;
        color: #1a365d;
        font-size: 1rem;
      }
      
      .mark-all-read {
        background: none;
        border: none;
        color: #4993ee;
        cursor: pointer;
        font-size: 0.875rem;
      }
      
      .notification-list {
        max-height: 360px;
        overflow-y: auto;
      }
      
      .notification-item {
        display: flex;
        padding: 12px 16px;
        border-bottom: 1px solid #f0f4f8;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .notification-item:hover {
        background-color: #f8fafc;
      }
      
      .notification-item.unread {
        background-color: #f0f7ff;
      }
      
      .notification-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        margin-right: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      
      .notification-icon.assignment {
        background-color: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }
      
      .notification-icon.assignment::before {
        content: "📝";
      }
      
      .notification-icon.grade {
        background-color: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }
      
      .notification-icon.grade::before {
        content: "📊";
      }
      
      .notification-icon.announcement {
        background-color: rgba(73, 147, 238, 0.1);
        color: #4993ee;
      }
      
      .notification-icon.announcement::before {
        content: "📢";
      }
      
      .notification-content {
        flex: 1;
      }
      
      .notification-title {
        color: #1a365d;
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      .notification-message {
        color: #64748b;
        font-size: 0.875rem;
        margin-bottom: 4px;
      }
      
      .notification-time {
        color: #94a3b8;
        font-size: 0.75rem;
      }
      
      .notification-footer {
        padding: 12px 16px;
        text-align: center;
        border-top: 1px solid #e2e8f0;
      }
      
      .view-all-notifications {
        color: #4993ee;
        text-decoration: none;
        font-size: 0.875rem;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Setup notification handlers
  function setupNotifications() {
    // Add event listeners to notification bells
    document.querySelectorAll('.notification-bell').forEach(bell => {
      bell.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event from bubbling up
        showNotificationPanel(this);
      });
    });
    
    // Close notification panel when clicking outside
    document.addEventListener('click', function(event) {
      const panels = document.querySelectorAll('.notification-panel');
      const bells = document.querySelectorAll('.notification-bell');
      
      // Don't close if clicking inside a panel or on a bell
      let shouldClose = true;
      
      panels.forEach(panel => {
        if (panel.contains(event.target)) {
          shouldClose = false;
        }
      });
      
      bells.forEach(bell => {
        if (bell.contains(event.target)) {
          shouldClose = false;
        }
      });
      
      if (shouldClose) {
        panels.forEach(panel => panel.remove());
      }
    });
    
    // Add notification counter to all notification bells in the navbar
    updateNotificationCounter();
  }
  
  // Create and show notification panel
  function showNotificationPanel(bell) {
    // Remove any existing notification panels
    document.querySelectorAll('.notification-panel').forEach(panel => panel.remove());
    
    // Create notification panel
    const panel = document.createElement('div');
    panel.className = 'notification-panel';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'notification-header';
    header.innerHTML = `
      <h3>Notifications</h3>
      <button class="mark-all-read">Mark all as read</button>
    `;
    panel.appendChild(header);
    
    // Add notification list
    const list = document.createElement('div');
    list.className = 'notification-list';
    
    if (notifications.length === 0) {
      list.innerHTML = '<div class="empty-state">No notifications</div>';
    } else {
      // Sort notifications by timestamp (newest first)
      const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);
      
      sortedNotifications.forEach(notification => {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
        item.setAttribute('data-id', notification.id);
        
        item.innerHTML = `
          <div class="notification-icon ${notification.type}"></div>
          <div class="notification-content">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${formatTimeAgo(notification.timestamp)}</div>
          </div>
        `;
        
        // Mark notification as read when clicked
        item.addEventListener('click', function() {
          markNotificationAsRead(notification.id);
        });
        
        list.appendChild(item);
      });
    }
    
    panel.appendChild(list);
    
    // Add footer
    const footer = document.createElement('div');
    footer.className = 'notification-footer';
    footer.innerHTML = `
      <a href="#notifications" class="view-all-notifications">View all notifications</a>
    `;
    panel.appendChild(footer);
    
    // Position the panel relative to the bell
    const bellRect = bell.getBoundingClientRect();
    panel.style.position = 'absolute';
    panel.style.top = `${bellRect.bottom + window.scrollY + 10}px`;
    panel.style.right = `${window.innerWidth - bellRect.right - window.scrollX}px`;
    
    // Add panel to the body
    document.body.appendChild(panel);
    
    // Add event listeners
    panel.querySelector('.mark-all-read').addEventListener('click', markAllNotificationsAsRead);
    
    panel.querySelector('.view-all-notifications').addEventListener('click', function(e) {
      e.preventDefault();
      // Navigate to notifications section
      const navLink = document.querySelector('.nav-link[href="#notifications"]');
      if (navLink) {
        navLink.click();
      } else {
        // If no direct link, try to navigate to settings section first
        const settingsLink = document.querySelector('.nav-link[href="#settings"]');
        if (settingsLink) {
          settingsLink.click();
          
          // Then try to click on the notifications tab in settings
          setTimeout(() => {
            const notificationsTab = document.querySelector('.settings-link[href="#notifications"]');
            if (notificationsTab) {
              notificationsTab.click();
            }
          }, 100);
        }
      }
      
      // Remove the notification panel
      panel.remove();
    });
  }
  
  // Format timestamp to relative time
  function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    // If more than a week, show actual date
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  }
  
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Add notification styles
    addNotificationStyles();
    
    // Initialize notifications
    initializeNotifications();
    
    // Setup notification handlers
    setupNotifications();
  });
  
  // Function to add a new notification (can be called from anywhere in your code)
  function addNotification(notification) {
    // Generate a unique ID for the new notification
    const newId = notifications.length > 0 
      ? Math.max(...notifications.map(n => n.id)) + 1 
      : 1;
    
    // Create the notification object
    const newNotification = {
      id: newId,
      type: notification.type || 'announcement',
      title: notification.title || 'New Notification',
      message: notification.message || '',
      timestamp: notification.timestamp || Date.now(),
      read: false
    };
    
    // Add to notifications array
    notifications.unshift(newNotification);
    
    // Save to localStorage
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Update counter
    updateNotificationCounter();
    
    // Add pulse animation to notification bells
    document.querySelectorAll('.notification-badge').forEach(badge => {
      badge.classList.remove('pulse');
      setTimeout(() => {
        badge.classList.add('pulse');
      }, 100);
    });
    
    return newId; // Return the ID of the new notification
  }

// Add this to your student.js file or notifications.js

// Create and show notifications history page
function showNotificationsHistory() {
  // Hide all other content sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Create notifications history section if it doesn't exist
  let notificationsSection = document.getElementById('notifications-history-section');
  
  if (!notificationsSection) {
    notificationsSection = document.createElement('section');
    notificationsSection.id = 'notifications-history-section';
    notificationsSection.className = 'content-section';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'dashboard-header';
    header.innerHTML = `
      <h1 class="page-title">Notifications History</h1>
    `;
    
    // Create notifications container
    const container = document.createElement('div');
    container.className = 'notifications-container';
    
    // Create filters for notifications
    const filters = document.createElement('div');
    filters.className = 'notification-filters';
    filters.innerHTML = `
      <div class="filter-group">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="assignment">Assignments</button>
        <button class="filter-btn" data-filter="grade">Grades</button>
        <button class="filter-btn" data-filter="message">Messages</button>
        <button class="filter-btn" data-filter="announcement">Announcements</button>
        <button class="filter-btn" data-filter="course">Courses</button>
      </div>
      <div class="filter-actions">
        <button class="btn-secondary mark-all-read-btn">Mark All as Read</button>
        <button class="btn-secondary clear-all-btn">Clear All</button>
      </div>
    `;
    
    // Create notifications list
    const notificationsList = document.createElement('div');
    notificationsList.id = 'notifications-history-list';
    notificationsList.className = 'notifications-list';
    
    // Append elements
    container.appendChild(filters);
    container.appendChild(notificationsList);
    notificationsSection.appendChild(header);
    notificationsSection.appendChild(container);
    
    // Add the section to the main content
    document.querySelector('.main-content').appendChild(notificationsSection);
    
    // Add event listeners for filters
    filters.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        // Remove active class from all buttons
        filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Filter notifications
        const filter = this.getAttribute('data-filter');
        filterNotifications(filter);
      });
    });
    
    // Add event listener for "Mark All as Read" button
    filters.querySelector('.mark-all-read-btn').addEventListener('click', function() {
      markAllNotificationsAsRead();
      loadNotificationsHistory();
    });
    
    // Add event listener for "Clear All" button
    filters.querySelector('.clear-all-btn').addEventListener('click', function() {
      if (confirm('Are you sure you want to clear all notifications? This cannot be undone.')) {
        notifications = [];
        localStorage.setItem('notifications', JSON.stringify(notifications));
        updateNotificationCounter();
        loadNotificationsHistory();
      }
    });
  }
  
  // Show notifications section
  notificationsSection.classList.add('active');
  
  // Update notifications list
  loadNotificationsHistory();
  
  // Update active navigation item
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  
  // Try to find and activate a notifications nav link if it exists
  const notificationsLink = document.querySelector('.nav-link[href="#notifications-history"]');
  if (notificationsLink) {
    notificationsLink.classList.add('active');
  }
}

// Load notifications history
function loadNotificationsHistory() {
  const notificationsList = document.getElementById('notifications-history-list');
  if (!notificationsList) return;
  
  // Clear current list
  notificationsList.innerHTML = '';
  
  // Get active filter
  const activeFilter = document.querySelector('.notification-filters .filter-btn.active');
  const filter = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
  
  // Filter and sort notifications
  let filteredNotifications = [...notifications];
  
  if (filter !== 'all') {
    filteredNotifications = filteredNotifications.filter(n => n.type === filter);
  }
  
  // Sort by timestamp (newest first)
  filteredNotifications.sort((a, b) => b.timestamp - a.timestamp);
  
  // Check if there are any notifications
  if (filteredNotifications.length === 0) {
    notificationsList.innerHTML = `
      <div class="empty-state">
        <p>No notifications to display</p>
      </div>
    `;
    return;
  }
  
  // Add notifications to the list
  filteredNotifications.forEach(notification => {
    const notificationItem = document.createElement('div');
    notificationItem.className = `notification-history-item ${notification.read ? 'read' : 'unread'}`;
    notificationItem.setAttribute('data-id', notification.id);
    
    notificationItem.innerHTML = `
      <div class="notification-icon ${notification.type}"></div>
      <div class="notification-content">
        <div class="notification-title">${notification.title}</div>
        <div class="notification-message">${notification.message}</div>
        <div class="notification-time">${formatDate(notification.timestamp)}</div>
      </div>
      <div class="notification-actions">
        ${notification.read ? 
          `<button class="mark-unread-btn" title="Mark as unread">📧</button>` : 
          `<button class="mark-read-btn" title="Mark as read">✓</button>`
        }
        <button class="delete-notification-btn" title="Delete">🗑️</button>
      </div>
    `;
    
    // Add event listeners
    notificationItem.querySelector(notification.read ? '.mark-unread-btn' : '.mark-read-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      if (notification.read) {
        markNotificationAsUnread(notification.id);
      } else {
        markNotificationAsRead(notification.id);
      }
      loadNotificationsHistory();
    });
    
    notificationItem.querySelector('.delete-notification-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      deleteNotification(notification.id);
      loadNotificationsHistory();
    });
    
    notificationsList.appendChild(notificationItem);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // Add event listeners to notification filters
  document.querySelectorAll('.notification-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // Remove active class from all buttons
      document.querySelectorAll('.notification-filters .filter-btn').forEach(b => {
        b.classList.remove('active');
      });
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Filter notifications
      const filter = this.getAttribute('data-filter');
      loadNotificationsHistory();
    });
  });
  // Add event listener for "Mark All as Read" button
  const markAllReadBtn = document.querySelector('.mark-all-read-btn');
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', function() {
      markAllNotificationsAsRead();
      loadNotificationsHistory();
    });
  }

  // Add event listener for "Clear All" button
  const clearAllBtn = document.querySelector('.clear-all-btn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to clear all notifications? This cannot be undone.')) {
        notifications = [];
        localStorage.setItem('notifications', JSON.stringify(notifications));
        updateNotificationCounter();
        loadNotificationsHistory();
      }
    });
  }
  
  // Initialize the notifications system
  initializeNotifications();
  setupNotifications();
});

// Filter notifications
function filterNotifications(filter) {
  loadNotificationsHistory();
}

// Mark notification as unread
function markNotificationAsUnread(id) {
  const notification = notifications.find(n => n.id === id);
  if (notification) {
    notification.read = false;
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationCounter();
  }
}

// Delete notification
function deleteNotification(id) {
  const index = notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications.splice(index, 1);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationCounter();
  }
}

// Format date for notification history
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit'
  });
}

// Update the showNotificationPanel function to modify the "View all notifications" link
function showNotificationPanel(bell) {
  // Remove any existing notification panels
  document.querySelectorAll('.notification-panel').forEach(panel => panel.remove());
  
  // Create notification panel
  const panel = document.createElement('div');
  panel.className = 'notification-panel';
  
  // Add header
  const header = document.createElement('div');
  header.className = 'notification-header';
  header.innerHTML = `
    <h3>Notifications</h3>
    <button class="mark-all-read">Mark all as read</button>
  `;
  panel.appendChild(header);
  
  // Add notification list
  const list = document.createElement('div');
  list.className = 'notification-list';
  
  if (notifications.length === 0) {
    list.innerHTML = '<div class="empty-state">No notifications</div>';
  } else {
    // Sort notifications by timestamp (newest first)
    const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);
    
    sortedNotifications.forEach(notification => {
      const item = document.createElement('div');
      item.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
      item.setAttribute('data-id', notification.id);
      
      item.innerHTML = `
        <div class="notification-icon ${notification.type}"></div>
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-message">${notification.message}</div>
          <div class="notification-time">${formatTimeAgo(notification.timestamp)}</div>
        </div>
      `;
      
      // Mark notification as read when clicked
      item.addEventListener('click', function() {
        markNotificationAsRead(notification.id);
      });
      
      list.appendChild(item);
    });
  }
  
  panel.appendChild(list);
  
  // Add footer
  const footer = document.createElement('div');
  footer.className = 'notification-footer';
  footer.innerHTML = `
    <a href="#" class="view-all-notifications">View all notifications</a>
  `;
  panel.appendChild(footer);
  
  // Position the panel relative to the bell
  const bellRect = bell.getBoundingClientRect();
  panel.style.position = 'absolute';
  panel.style.top = `${bellRect.bottom + window.scrollY + 10}px`;
  panel.style.right = `${window.innerWidth - bellRect.right - window.scrollX}px`;
  
  // Add panel to the body
  document.body.appendChild(panel);
  
  // Add event listeners
  panel.querySelector('.mark-all-read').addEventListener('click', markAllNotificationsAsRead);
  
  panel.querySelector('.view-all-notifications').addEventListener('click', function(e) {
    e.preventDefault();
    // Navigate to notifications section
    const navLink = document.querySelector('.nav-link[href="#notifications"]');
    if (navLink) {
      navLink.click();
    } else {
      // If no direct link, try to navigate to settings section first
      const settingsLink = document.querySelector('.nav-link[href="#settings"]');
      if (settingsLink) {
        settingsLink.click();
        
        // Then try to click on the notifications tab in settings
        setTimeout(() => {
          const notificationsTab = document.querySelector('.settings-link[href="#notifications"]');
          if (notificationsTab) {
            notificationsTab.click();
          }
        }, 100);
      }
    }
    
    // Remove the notification panel
    panel.remove();
  });
}

// Function to navigate to a specific section
function navigateToSection(sectionName) {
  // Hide all content sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show the requested section
  const section = document.getElementById(sectionName + '-section');
  if (section) {
    section.classList.add('active');
  }
  
  // Update active navigation link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  const navLink = document.querySelector(`.nav-link[href="#${sectionName}"]`);
  if (navLink) {
    navLink.classList.add('active');
  }
  
  // If it's the notifications section, load the notifications history
  if (sectionName === 'notifications-history') {
    loadNotificationsHistory();
  }
}

// Add CSS for the notifications history page
function addNotificationsHistoryStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Notifications History Styles */
    .notifications-container {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      margin-bottom: 2rem;
    }
    
    .notification-filters {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .filter-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    .filter-btn {
      padding: 0.5rem 1rem;
      border: 2px solid #e2e8f0;
      background: white;
      color: #64748b;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .filter-btn.active {
      background: #4993ee;
      color: white;
      border-color: #4993ee;
    }
    
    .filter-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .notification-history-item {
      display: flex;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      border-left: 4px solid transparent;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      align-items: center;
    }
    
    .notification-history-item.unread {
      border-left-color: #4993ee;
      background: rgba(73, 147, 238, 0.05);
    }
    
    .notification-history-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .notification-history-item .notification-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      margin-right: 1rem;
    }
    
    .notification-history-item .notification-content {
      flex: 1;
    }
    
    .notification-history-item .notification-title {
      font-weight: 600;
      color: #1a365d;
      margin-bottom: 0.25rem;
    }
    
    .notification-history-item .notification-message {
      color: #64748b;
      margin-bottom: 0.5rem;
    }
    
    .notification-history-item .notification-time {
      color: #94a3b8;
      font-size: 0.75rem;
    }
    
    .notification-history-item .notification-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .notification-history-item .notification-actions button {
      padding: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      border-radius: 4px;
      transition: all 0.3s ease;
    }
    
    .notification-history-item .notification-actions button:hover {
      background: #f8fafc;
      color: #1a365d;
    }
    
    .empty-state {
      padding: 2rem;
      text-align: center;
      color: #64748b;
      background: #f8fafc;
      border-radius: 8px;
    }
    
    @media (max-width: 768px) {
      .notification-filters {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .filter-group, .filter-actions {
        width: 100%;
        justify-content: center;
      }
    }
  `;
  
  document.head.appendChild(style);
}

// Add a navigation item for notifications if it doesn't exist
function addNotificationsNavItem() {
  const navMenu = document.querySelector('.nav-menu');
  if (!navMenu) return;
  
  // Check if notifications nav item already exists
  if (!document.querySelector('.nav-link[href="#notifications-history"]')) {
    // Find where to insert the new item (before settings)
    const settingsItem = navMenu.querySelector('.nav-link[href="#settings"]')?.closest('.nav-item');
    
    // Create new nav item
    const notificationsItem = document.createElement('li');
    notificationsItem.className = 'nav-item';
    notificationsItem.innerHTML = `
      <a href="#notifications-history" class="nav-link">
        <span class="nav-icon">🔔</span>
        Notifications
      </a>
    `;
    
    // Add event listener
    notificationsItem.querySelector('.nav-link').addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active class from all nav links
      document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
      
      // Add active class to this link
      this.classList.add('active');
      
      // Show notifications history
      showNotificationsHistory();
    });
    
    // Insert before settings or append to menu
    if (settingsItem) {
      navMenu.insertBefore(notificationsItem, settingsItem);
    } else {
      navMenu.appendChild(notificationsItem);
    }
  }
}

// Update the initialization code
document.addEventListener('DOMContentLoaded', function() {
  // Add notification styles
  addNotificationStyles();
  
  // Add notifications history styles
  addNotificationsHistoryStyles();
  
  // Add notifications navigation item
  addNotificationsNavItem();
  
  // Initialize notifications
  initializeNotifications();
  
  // Setup notification handlers
  setupNotifications();
});

// Create and show notification panel
function showNotificationPanel(bell) {
  // Remove any existing notification panels
  document.querySelectorAll('.notification-panel').forEach(panel => panel.remove());
  
  // Create notification panel
  const panel = document.createElement('div');
  panel.className = 'notification-panel';
  
  // Add header
  const header = document.createElement('div');
  header.className = 'notification-header';
  header.innerHTML = `
    <h3>Notifications</h3>
    <button class="mark-all-read">Mark all as read</button>
  `;
  panel.appendChild(header);
  
  // Add notification list
  const list = document.createElement('div');
  list.className = 'notification-list';
  
  if (notifications.length === 0) {
    list.innerHTML = '<div class="empty-state">No notifications</div>';
  } else {
    // Sort notifications by timestamp (newest first)
    const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);
    
    sortedNotifications.forEach(notification => {
      const item = document.createElement('div');
      item.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
      item.setAttribute('data-id', notification.id);
      
      item.innerHTML = `
        <div class="notification-icon ${notification.type}"></div>
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-message">${notification.message}</div>
          <div class="notification-time">${formatTimeAgo(notification.timestamp)}</div>
        </div>
      `;
      
      // Mark notification as read when clicked
      item.addEventListener('click', function() {
        markNotificationAsRead(notification.id);
      });
      
      list.appendChild(item);
    });
  }
  
  panel.appendChild(list);
  
  // Add footer
  const footer = document.createElement('div');
  footer.className = 'notification-footer';
  footer.innerHTML = `
    <a href="#notifications-history" class="view-all-notifications">View all notifications</a>
  `;
  panel.appendChild(footer);
  
  // Position the panel relative to the bell
  const bellRect = bell.getBoundingClientRect();
  panel.style.position = 'absolute';
  panel.style.top = `${bellRect.bottom + window.scrollY + 10}px`;
  panel.style.right = `${window.innerWidth - bellRect.right - window.scrollX}px`;
  
  // Add panel to the body
  document.body.appendChild(panel);
  
  // Add event listener for mark all read button
  panel.querySelector('.mark-all-read').addEventListener('click', function() {
    markAllNotificationsAsRead();
  });
  
  // Update the "View all notifications" link event handler
  panel.querySelector('.view-all-notifications').addEventListener('click', function(e) {
    e.preventDefault();
    
    // Remove the notification panel
    panel.remove();
    
    // Navigate to notifications history section
    navigateToSection('notifications-history');
  });
  
  // Add event listener to close when clicking outside
  setTimeout(() => {
    document.addEventListener('click', closeNotificationPanel);
  }, 10);
}
