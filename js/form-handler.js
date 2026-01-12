// Form Submission Handler for Google Sheets Integration
class FormHandler {
    constructor() {
        // Google Apps Script Web App URL (you'll update this later)
        this.scriptURL = 'YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL';
        this.isOnline = navigator.onLine;
        
        this.init();
    }
    
    init() {
        this.setupOnlineStatus();
        this.setupServiceWorker();
    }
    
    setupOnlineStatus() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncOfflineData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineMessage();
        });
    }
    
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registered');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }
    
    async submitToGoogleSheets(formData, formType) {
        if (!this.isOnline) {
            this.saveOffline(formData, formType);
            return { success: false, offline: true };
        }
        
        try {
            const response = await fetch(this.scriptURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    formType: formType,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    deviceInfo: this.getDeviceInfo()
                })
            });
            
            // Since we're using no-cors, we can't read the response
            // But we assume it was successful if no error was thrown
            this.showSuccessMessage(formType);
            return { success: true };
            
        } catch (error) {
            console.error('Error submitting form:', error);
            this.saveOffline(formData, formType);
            return { success: false, error: error.message };
        }
    }
    
    saveOffline(formData, formType) {
        const offlineData = JSON.parse(localStorage.getItem('offlineSubmissions') || '[]');
        offlineData.push({
            data: formData,
            type: formType,
            savedAt: new Date().toISOString()
        });
        localStorage.setItem('offlineSubmissions', JSON.stringify(offlineData));
        
        this.showOfflineMessage('Form saved locally. Will sync when online.');
    }
    
    async syncOfflineData() {
        const offlineData = JSON.parse(localStorage.getItem('offlineSubmissions') || '[]');
        
        if (offlineData.length === 0) return;
        
        for (const submission of offlineData) {
            try {
                await this.submitToGoogleSheets(submission.data, submission.type);
                
                // Remove successfully synced item
                const updatedData = offlineData.filter(item => 
                    item.savedAt !== submission.savedAt
                );
                localStorage.setItem('offlineSubmissions', JSON.stringify(updatedData));
                
            } catch (error) {
                console.error('Failed to sync offline submission:', error);
            }
        }
    }
    
    getDeviceInfo() {
        return {
            platform: navigator.platform,
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }
    
    showSuccessMessage(formType) {
        const messages = {
            contact: 'Thank you for your message! We will get back to you soon.',
            registration: 'Registration successful! You can now access our contact details.',
            newsletter: 'Thank you for subscribing to our newsletter!',
            phone_access: 'Phone access request submitted successfully.'
        };
        
        alert(messages[formType] || 'Submission successful!');
    }
    
    showOfflineMessage(customMessage) {
        const message = customMessage || 'You are offline. Form data will be saved locally and submitted when you are back online.';
        console.log(message);
        
        // You could show a more elegant offline notification
        const notification = document.createElement('div');
        notification.className = 'offline-notification';
        notification.innerHTML = `
            <i class="fas fa-wifi-slash"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    // Method to handle different form types
    async handleFormSubmission(formData, formType) {
        return await this.submitToGoogleSheets(formData, formType);
    }
}

// Cookie Management for Resource Access Tracking
class CookieManager {
    constructor() {
        this.cookieName = 'umburio_tracker';
        this.cookieExpiry = 365; // days
    }
    
    setTrackingCookie() {
        const cookieValue = {
            userId: this.generateUserId(),
            firstVisit: new Date().toISOString(),
            lastVisit: new Date().toISOString(),
            deviceId: this.getDeviceFingerprint()
        };
        
        this.setCookie(this.cookieName, JSON.stringify(cookieValue), this.cookieExpiry);
    }
    
    getTrackingCookie() {
        const cookie = this.getCookie(this.cookieName);
        return cookie ? JSON.parse(cookie) : null;
    }
    
    updateVisit() {
        const cookie = this.getTrackingCookie();
        if (cookie) {
            cookie.lastVisit = new Date().toISOString();
            cookie.visitCount = (cookie.visitCount || 0) + 1;
            this.setCookie(this.cookieName, JSON.stringify(cookie), this.cookieExpiry);
        }
    }
    
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }
    
    getDeviceFingerprint() {
        // Simple device fingerprint (for demo purposes)
        const components = [
            navigator.userAgent,
            navigator.platform,
            navigator.language,
            screen.width + 'x' + screen.height
        ].join('|');
        
        return this.hashString(components);
    }
    
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }
    
    setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
    }
    
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    }
}

// Initialize form handler and cookie manager
document.addEventListener('DOMContentLoaded', () => {
    const formHandler = new FormHandler();
    const cookieManager = new CookieManager();
    
    // Set tracking cookie on first visit
    if (!cookieManager.getTrackingCookie()) {
        cookieManager.setTrackingCookie();
    } else {
        cookieManager.updateVisit();
    }
    
    // Make available globally
    window.formHandler = formHandler;
    window.cookieManager = cookieManager;
    
    // Update form submissions to use the form handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };
            
            await formHandler.handleFormSubmission(formData, 'contact');
            contactForm.reset();
        });
    }
});
