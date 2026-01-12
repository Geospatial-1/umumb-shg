// Meeting Date Calculator
class MeetingCalculator {
    constructor() {
        this.lastMeeting = new Date('2026-01-11'); // Last meeting was on 11/01/2026
        this.meetingInterval = 14; // Every fortnight (14 days)
        this.meetingWidget = document.getElementById('meetingWidget');
        this.nextMeetingDate = document.getElementById('nextMeetingDate');
        
        this.init();
    }
    
    init() {
        this.calculateNextMeeting();
        this.setupEventListeners();
    }
    
    calculateNextMeeting() {
        const today = new Date();
        let nextMeeting = new Date(this.lastMeeting);
        
        // Find the next meeting date
        while (nextMeeting <= today) {
            nextMeeting.setDate(nextMeeting.getDate() + this.meetingInterval);
        }
        
        // Format the date
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        const formattedDate = nextMeeting.toLocaleDateString('en-US', options);
        this.nextMeetingDate.textContent = formattedDate;
        
        // Store the calculated date for future use
        this.nextMeeting = nextMeeting;
    }
    
    setupEventListeners() {
        // Close widget button
        const closeBtn = document.getElementById('closeWidget');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.meetingWidget.style.display = 'none';
            });
        }
        
        // RSVP button
        const rsvpBtn = document.querySelector('.rsvp-btn');
        if (rsvpBtn) {
            rsvpBtn.addEventListener('click', (e) => {
                e.preventDefault();
                alert('RSVP feature will be available soon!');
            });
        }
    }
    
    // Get the next meeting date as a Date object
    getNextMeetingDate() {
        return this.nextMeeting;
    }
    
    // Get all meeting dates for the next 6 months
    getUpcomingMeetings(numMeetings = 12) {
        const meetings = [];
        let nextDate = new Date(this.lastMeeting);
        
        for (let i = 0; i < numMeetings; i++) {
            nextDate.setDate(nextDate.getDate() + this.meetingInterval);
            if (nextDate > new Date()) {
                meetings.push(new Date(nextDate));
            }
        }
        
        return meetings;
    }
}

// Initialize the meeting calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const meetingCalculator = new MeetingCalculator();
    
    // Make it available globally if needed
    window.meetingCalculator = meetingCalculator;
});
