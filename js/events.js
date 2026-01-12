// Events Management
class EventsManager {
    constructor() {
        this.events = [];
        this.currentCategory = 'all';
        this.isAdminLoggedIn = false;
        this.adminUsername = 'admin'; // In real app, this should be from secure source
        this.adminPassword = 'password'; // In real app, this should be from secure source

        // Quill editor instance
        this.quill = new Quill('#editor-container', {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    ['link', 'blockquote', 'code-block'],
                    [{ list: 'ordered' }, { list: 'bullet' }]
                ]
            }
        });

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadEvents();
        this.checkAdminLogin();
    }

    setupEventListeners() {
        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.setCategory(category);
            });
        });

        // Admin login button
        document.getElementById('loginAdminBtn').addEventListener('click', () => {
            this.showAdminLoginModal();
        });

        // Add event button
        document.getElementById('addEventBtn').addEventListener('click', () => {
            this.showEventModal();
        });

        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Admin login form
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdminLogin();
        });

        // Event form
        document.getElementById('eventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent();
        });

        // When the modal is closed, reset the form
        document.getElementById('eventModal').addEventListener('hidden.bs.modal', () => {
            this.resetEventForm();
        });

        // Update hidden textarea with Quill content
        this.quill.on('text-change', () => {
            document.getElementById('eventDescription').value = this.quill.root.innerHTML;
        });
    }

    setCategory(category) {
        this.currentCategory = category;
        
        // Update active button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        this.renderEvents();
    }

    async loadEvents() {
        try {
            // In a real app, fetch from Google Sheets via Apps Script
            // For now, use sample data
            this.events = [
                {
                    id: 1,
                    title: 'Monthly Group Meeting',
                    date: '2024-01-15',
                    time: '14:00',
                    location: 'Rhino Inn Restaurant',
                    description: 'Regular monthly meeting to discuss group progress and plans.',
                    image: 'https://via.placeholder.com/350x200',
                    category: 'past'
                },
                {
                    id: 2,
                    title: 'Financial Literacy Workshop',
                    date: '2024-02-20',
                    time: '10:00',
                    location: 'Community Hall',
                    description: 'Workshop on financial management and investment strategies.',
                    image: 'https://via.placeholder.com/350x200',
                    category: 'upcoming'
                }
            ];

            this.renderEvents();
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    renderEvents() {
        const container = document.getElementById('eventsContainer');
        container.innerHTML = '';

        const filteredEvents = this.events.filter(event => {
            if (this.currentCategory === 'all') return true;
            return event.category === this.currentCategory;
        });

        filteredEvents.forEach(event => {
            const eventCard = this.createEventCard(event);
            container.appendChild(eventCard);
        });
    }

    createEventCard(event) {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.dataset.id = event.id;

        const date = new Date(event.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        card.innerHTML = `
            <img src="${event.image}" alt="${event.title}" class="event-image">
            <div class="event-content">
                <div class="event-date">
                    <i class="fas fa-calendar-alt"></i>
                    ${formattedDate} at ${event.time}
                </div>
                <h3 class="event-title">${event.title}</h3>
                <div class="event-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${event.location}
                </div>
                <div class="event-description">${event.description}</div>
                <div class="event-actions">
                    <div class="event-interactions">
                        <button class="like-btn"><i class="far fa-heart"></i> Like</button>
                        <button class="comment-btn"><i class="far fa-comment"></i> Comment</button>
                        <button class="share-btn"><i class="fas fa-share"></i> Share</button>
                    </div>
                    ${this.isAdminLoggedIn ? `
                        <div class="event-admin-actions">
                            <button class="edit-btn" data-id="${event.id}">Edit</button>
                            <button class="delete-btn" data-id="${event.id}">Delete</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Add event listeners for admin buttons
        if (this.isAdminLoggedIn) {
            card.querySelector('.edit-btn').addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.editEvent(id);
            });

            card.querySelector('.delete-btn').addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.deleteEvent(id);
            });
        }

        // Add event listeners for like, comment, share
        card.querySelector('.like-btn').addEventListener('click', () => {
            this.likeEvent(event.id);
        });

        card.querySelector('.comment-btn').addEventListener('click', () => {
            this.showComments(event.id);
        });

        card.querySelector('.share-btn').addEventListener('click', () => {
            this.shareEvent(event);
        });

        return card;
    }

    checkAdminLogin() {
        // Check if admin is already logged in (from sessionStorage)
        const adminLoggedIn = sessionStorage.getItem('adminLoggedIn');
        if (adminLoggedIn === 'true') {
            this.isAdminLoggedIn = true;
            this.showAdminControls();
        }
    }

    showAdminControls() {
        document.getElementById('loginAdminBtn').style.display = 'none';
        document.getElementById('addEventBtn').style.display = 'inline-block';
    }

    showAdminLoginModal() {
        document.getElementById('adminLoginModal').style.display = 'flex';
    }

    showEventModal(event = null) {
        this.currentEvent = event;
        const modal = document.getElementById('eventModal');
        const title = document.getElementById('modalTitle');
        
        if (event) {
            title.textContent = 'Edit Event';
            this.populateEventForm(event);
        } else {
            title.textContent = 'Add New Event';
            this.resetEventForm();
        }
        
        modal.style.display = 'flex';
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    resetEventForm() {
        document.getElementById('eventForm').reset();
        this.quill.setContents([]);
        this.currentEvent = null;
    }

    populateEventForm(event) {
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventTime').value = event.time;
        document.getElementById('eventLocation').value = event.location;
        this.quill.root.innerHTML = event.description;
        document.getElementById('eventImage').value = event.image;
        document.getElementById('eventCategory').value = event.category;
    }

    async handleAdminLogin() {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;

        // In a real app, this should be a secure API call
        if (username === this.adminUsername && password === this.adminPassword) {
            this.isAdminLoggedIn = true;
            sessionStorage.setItem('adminLoggedIn', 'true');
            this.showAdminControls();
            this.closeModals();
            alert('Admin login successful!');
            this.renderEvents(); // Re-render to show admin buttons
        } else {
            alert('Invalid admin credentials');
        }
    }

    async saveEvent() {
        const eventData = {
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            time: document.getElementById('eventTime').value,
            location: document.getElementById('eventLocation').value,
            description: this.quill.root.innerHTML,
            image: document.getElementById('eventImage').value,
            category: document.getElementById('eventCategory').value
        };

        try {
            if (this.currentEvent) {
                // Update existing event
                eventData.id = this.currentEvent.id;
                await this.updateEvent(eventData);
            } else {
                // Add new event
                await this.addEvent(eventData);
            }

            this.closeModals();
            this.loadEvents(); // Reload events
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Failed to save event. Please try again.');
        }
    }

    async addEvent(eventData) {
        // In a real app, send to Google Sheets via Apps Script
        eventData.id = Date.now(); // Temporary ID
        this.events.push(eventData);
    }

    async updateEvent(eventData) {
        // In a real app, update in Google Sheets via Apps Script
        const index = this.events.findIndex(e => e.id === eventData.id);
        if (index !== -1) {
            this.events[index] = eventData;
        }
    }

    async deleteEvent(id) {
        if (!confirm('Are you sure you want to delete this event?')) return;

        // In a real app, delete from Google Sheets via Apps Script
        this.events = this.events.filter(event => event.id !== id);
        this.renderEvents();
    }

    likeEvent(eventId) {
        // Implement like functionality
        console.log('Liked event:', eventId);
    }

    showComments(eventId) {
        // Implement comment functionality
        console.log('Show comments for event:', eventId);
    }

    shareEvent(event) {
        // Implement share functionality
        if (navigator.share) {
            navigator.share({
                title: event.title,
                text: event.description,
                url: window.location.href
            });
        } else {
            // Fallback
            prompt('Copy this link to share:', window.location.href);
        }
    }

    editEvent(id) {
        const event = this.events.find(e => e.id === id);
        if (event) {
            this.showEventModal(event);
        }
    }
}

// Initialize Events Manager
document.addEventListener('DOMContentLoaded', () => {
    const eventsManager = new EventsManager();
    window.eventsManager = eventsManager;
});
