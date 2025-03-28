document.addEventListener('DOMContentLoaded', function() {
    // Initialize calendar
    const calendar = {
      currentDate: new Date(),
      currentView: 'month',
      
      // DOM Elements
      elements: {
        calendarDays: document.getElementById('calendarDays'),
        monthTitle: document.getElementById('currentMonth'),
        prevButton: document.querySelector('.month-nav:first-child'),
        nextButton: document.querySelector('.month-nav:last-child'),
        viewButtons: document.querySelectorAll('.view-btn'),
        upcomingEvents: document.getElementById('upcomingEvents')
      },
      
      // Initialize calendar
      init: function() {
        // Set initial view
        this.render();
        
        // Add event listeners
        this.addEventListeners();
      },
      
      // Add event listeners
      addEventListeners: function() {
        // Previous button
        this.elements.prevButton.addEventListener('click', () => {
          this.navigatePrevious();
        });
        
        // Next button
        this.elements.nextButton.addEventListener('click', () => {
          this.navigateNext();
        });
        
        // View buttons
        this.elements.viewButtons.forEach(button => {
          button.addEventListener('click', () => {
            // Remove active class from all buttons
            this.elements.viewButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Set current view
            this.currentView = button.textContent.toLowerCase();
            
            // Render calendar
            this.render();
          });
        });
      },
      
      // Navigate to previous period
      navigatePrevious: function() {
        switch(this.currentView) {
          case 'month':
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            break;
          case 'week':
            this.currentDate.setDate(this.currentDate.getDate() - 7);
            break;
          case 'day':
            this.currentDate.setDate(this.currentDate.getDate() - 1);
            break;
        }
        
        this.render();
      },
      
      // Navigate to next period
      navigateNext: function() {
        switch(this.currentView) {
          case 'month':
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            break;
          case 'week':
            this.currentDate.setDate(this.currentDate.getDate() + 7);
            break;
          case 'day':
            this.currentDate.setDate(this.currentDate.getDate() + 1);
            break;
        }
        
        this.render();
      },
      
      // Get formatted title based on current view
      getTitle: function() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const year = this.currentDate.getFullYear();
        const month = months[this.currentDate.getMonth()];
        
        switch(this.currentView) {
          case 'month':
            return `${month} ${year}`;
          case 'week':
            // Calculate start and end of week
            const weekStart = new Date(this.currentDate);
            weekStart.setDate(this.currentDate.getDate() - this.currentDate.getDay());
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            // Format week range
            if (weekStart.getMonth() === weekEnd.getMonth()) {
              return `${month} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${year}`;
            } else {
              const endMonth = months[weekEnd.getMonth()];
              if (weekStart.getFullYear() === weekEnd.getFullYear()) {
                return `${month} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}, ${year}`;
              } else {
                return `${month} ${weekStart.getDate()}, ${weekStart.getFullYear()} - ${endMonth} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
              }
            }
          case 'day':
            const day = this.currentDate.getDate();
            const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][this.currentDate.getDay()];
            return `${dayOfWeek}, ${month} ${day}, ${year}`;
        }
      },
      
      // Render the calendar based on current view
      render: function() {
        // Update title
        this.elements.monthTitle.textContent = this.getTitle();
        
        // Clear calendar
        this.elements.calendarDays.innerHTML = '';
        
        // Render based on current view
        switch(this.currentView) {
          case 'month':
            this.renderMonthView();
            break;
          case 'week':
            this.renderWeekView();
            break;
          case 'day':
            this.renderDayView();
            break;
        }
        
        // Update upcoming events
        this.renderUpcomingEvents();
      },
      
      // Render month view
      renderMonthView: function() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Get current date for highlighting today
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
        
        // Create calendar days
        let dayCount = 1;
        const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
        
        for (let i = 0; i < totalCells; i++) {
          const dayElement = document.createElement('div');
          dayElement.className = 'calendar-day';
          
          if (i >= firstDay && dayCount <= daysInMonth) {
            // Date cells
            dayElement.innerHTML = `<span class="day-number">${dayCount}</span>`;
            
            // Highlight today
            if (isCurrentMonth && dayCount === today.getDate()) {
              dayElement.classList.add('today');
            }
            
            // Mock events (replace with actual events in a real implementation)
            if (Math.random() > 0.85) {
              const eventTypes = ['assignment', 'lecture', 'exam', 'meeting'];
              const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
              dayElement.innerHTML += `<div class="calendar-event ${randomType}"></div>`;
            }
            
            dayCount++;
          } else {
            // Empty cells
            dayElement.classList.add('empty');
          }
          
          this.elements.calendarDays.appendChild(dayElement);
        }
      },
      
      // Render week view
      renderWeekView: function() {
        // Calculate start of week (Sunday)
        const weekStart = new Date(this.currentDate);
        weekStart.setDate(this.currentDate.getDate() - this.currentDate.getDay());
        
        // Create week header
        const weekHeader = document.createElement('div');
        weekHeader.className = 'week-header';
        
        for (let i = 0; i < 7; i++) {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + i);
          
          const dayElement = document.createElement('div');
          dayElement.className = 'week-day';
          
          // Check if this is today
          const today = new Date();
          if (day.getDate() === today.getDate() && 
              day.getMonth() === today.getMonth() && 
              day.getFullYear() === today.getFullYear()) {
            dayElement.classList.add('today');
          }
          
          // Format the day
          const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getDay()];
          dayElement.innerHTML = `
            <div class="week-day-header">
              <div class="day-name">${dayOfWeek}</div>
              <div class="day-number">${day.getDate()}</div>
            </div>
            <div class="day-events">
              <!-- Mock events, replace with real events -->
              ${i === 2 ? '<div class="week-event assignment">Assignment Due: Web Development</div>' : ''}
              ${i === 4 ? '<div class="week-event lecture">Lecture: Database Design</div>' : ''}
            </div>
          `;
          
          weekHeader.appendChild(dayElement);
        }
        
        this.elements.calendarDays.appendChild(weekHeader);
      },
      
      // Render day view
      renderDayView: function() {
        const today = new Date();
        const isToday = this.currentDate.getDate() === today.getDate() && 
                        this.currentDate.getMonth() === today.getMonth() && 
                        this.currentDate.getFullYear() === today.getFullYear();
        
        const dayElement = document.createElement('div');
        dayElement.className = 'day-view' + (isToday ? ' today' : '');
        
        // Create time slots (hourly from 8am to 8pm)
        for (let hour = 8; hour <= 20; hour++) {
          const timeSlot = document.createElement('div');
          timeSlot.className = 'time-slot';
          
          // Format time (12-hour format with am/pm)
          const displayHour = hour > 12 ? hour - 12 : hour;
          const amPm = hour >= 12 ? 'PM' : 'AM';
          
          timeSlot.innerHTML = `
            <div class="time-slot-time">${displayHour}:00 ${amPm}</div>
            <div class="time-slot-content">
              <!-- Mock events, replace with real events -->
              ${hour === 10 ? '<div class="day-event lecture">Lecture: Introduction to Web Development</div>' : ''}
              ${hour === 14 ? '<div class="day-event assignment">Assignment Due: JavaScript Basics</div>' : ''}
              ${hour === 16 ? '<div class="day-event meeting">Office Hours</div>' : ''}
            </div>
          `;
          
          dayElement.appendChild(timeSlot);
        }
        
        this.elements.calendarDays.appendChild(dayElement);
      },
      
      // Render upcoming events
      renderUpcomingEvents: function() {
        // Clear events
        this.elements.upcomingEvents.innerHTML = '';
        
        // Mock events (replace with actual events in a real implementation)
        const mockEvents = [
          {
            title: 'Assignment Due: Web Development',
            date: new Date(new Date().setDate(new Date().getDate() + 3)),
            type: 'assignment'
          },
          {
            title: 'Lecture: Database Design',
            date: new Date(new Date().setDate(new Date().getDate() + 5)),
            type: 'lecture'
          },
          {
            title: 'Final Exam',
            date: new Date(new Date().setDate(new Date().getDate() + 10)),
            type: 'exam'
          }
        ];
        
        // Sort by date
        mockEvents.sort((a, b) => a.date - b.date);
        
        // Add events to list
        if (mockEvents.length === 0) {
          this.elements.upcomingEvents.innerHTML = '<div class="empty-state">No upcoming events</div>';
        } else {
          mockEvents.forEach(event => {
            // Format date
            const date = event.date;
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
            
            const eventElement = document.createElement('div');
            eventElement.className = 'event-item';
            eventElement.innerHTML = `
              <div class="event-dot ${event.type}"></div>
              <div class="event-info">
                <div class="event-title">${event.title}</div>
                <div class="event-time">${formattedDate}</div>
              </div>
              <button class="event-action">View</button>
            `;
            
            this.elements.upcomingEvents.appendChild(eventElement);
          });
        }
      }
    };
    
    // Initialize calendar
    calendar.init();
    
    // Add some styles for the new views
    const style = document.createElement('style');
    style.textContent = `
      /* Week View Styles */
      .week-header {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
      }
      
      .week-day {
        background: white;
        border-radius: 8px;
        min-height: 300px;
        padding: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      
      .week-day.today {
        background: rgba(73, 147, 238, 0.05);
        border: 1px solid rgba(73, 147, 238, 0.3);
      }
      
      .week-day-header {
        text-align: center;
        padding-bottom: 0.5rem;
        margin-bottom: 0.5rem;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .week-event {
        background: rgba(73, 147, 238, 0.1);
        color: #4993ee;
        padding: 0.5rem;
        border-radius: 6px;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
      }
      
      .week-event.assignment {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }
      
      .week-event.lecture {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }
      
      .week-event.exam {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }
      
      /* Day View Styles */
      .day-view {
        background: white;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      
      .day-view.today {
        background: rgba(73, 147, 238, 0.05);
        border: 1px solid rgba(73, 147, 238, 0.3);
      }
      
      .time-slot {
        display: flex;
        padding: 0.75rem 0;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .time-slot-time {
        width: 100px;
        color: #64748b;
        font-size: 0.875rem;
      }
      
      .time-slot-content {
        flex: 1;
      }
      
      .day-event {
        background: rgba(73, 147, 238, 0.1);
        color: #4993ee;
        padding: 0.5rem;
        border-radius: 6px;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
      }
      
      .day-event.assignment {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }
      
      .day-event.lecture {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }
      
      .day-event.meeting {
        background: rgba(124, 58, 237, 0.1);
        color: #7c3aed;
      }
      
      /* Event styles */
      .event-item {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        background: white;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      
      .event-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 0.75rem;
        background: #4993ee;
      }
      
      .event-dot.assignment {
        background: #f59e0b;
      }
      
      .event-dot.lecture {
        background: #22c55e;
      }
      
      .event-dot.exam {
        background: #ef4444;
      }
      
      .event-info {
        flex: 1;
      }
      
      .event-title {
        color: #1a365d;
        font-weight: 500;
        margin-bottom: 0.25rem;
      }
      
      .event-time {
        color: #64748b;
        font-size: 0.75rem;
      }
      
      .event-action {
        padding: 0.35rem 0.75rem;
        background: rgba(73, 147, 238, 0.1);
        color: #4993ee;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.75rem;
      }
      
      .calendar-event {
        height: 8px;
        width: 8px;
        border-radius: 50%;
        background: #4993ee;
        margin: 2px;
        display: inline-block;
      }
      
      .calendar-event.assignment {
        background: #f59e0b;
      }
      
      .calendar-event.lecture {
        background: #22c55e;
      }
      
      .calendar-event.exam {
        background: #ef4444;
      }
      
      .calendar-event.meeting {
        background: #7c3aed;
      }
    `;
    document.head.appendChild(style);
  });
