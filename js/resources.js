// Resources Management
class ResourcesManager {
    constructor() {
        this.resources = [];
        this.filteredResources = [];
        this.currentFilter = 'all';
        this.userBalance = 0;
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadResources();
        await this.loadDownloadHistory();
    }
    
    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
        
        // Search input
        document.getElementById('resourceSearch').addEventListener('input', (e) => {
            this.filterResources(e.target.value);
        });
        
        // Initialize payment modal
        this.initPaymentModal();
        
        // Initialize download modal
        this.initDownloadModal();
    }
    
    async loadResources() {
        try {
            // In a real app, this would come from your API/Google Sheets
            // For now, we'll use static data
            this.resources = [
                {
                    id: 1,
                    name: 'Membership Registration Form',
                    type: 'free',
                    format: 'PDF',
                    size: '250KB',
                    price: 0,
                    description: 'Official membership application form',
                    download_url: '#',
                    preview_url: '#'
                },
                {
                    id: 2,
                    name: 'Loan Application Form',
                    type: 'free',
                    format: 'PDF',
                    size: '300KB',
                    price: 0,
                    description: 'Apply for group loans',
                    download_url: '#',
                    preview_url: '#'
                },
                {
                    id: 3,
                    name: 'Loan Qualifications Form',
                    type: 'free',
                    format: 'PDF',
                    size: '200KB',
                    price: 0,
                    description: 'Check loan eligibility criteria',
                    download_url: '#',
                    preview_url: '#'
                },
                {
                    id: 4,
                    name: 'Calendar of Events',
                    type: 'free',
                    format: 'PDF',
                    size: '150KB',
                    price: 0,
                    description: 'Yearly event schedule',
                    download_url: '#',
                    preview_url: '#'
                },
                {
                    id: 5,
                    name: 'Privacy Statement',
                    type: 'free',
                    format: 'PDF',
                    size: '180KB',
                    price: 0,
                    description: 'Data protection policy',
                    download_url: '#',
                    preview_url: '#'
                },
                {
                    id: 6,
                    name: 'Group By-Laws',
                    type: 'paid',
                    format: 'PDF',
                    size: '1.2MB',
                    price: 500,
                    description: 'Official group constitution',
                    download_url: '#',
                    preview_url: '#'
                },
                {
                    id: 7,
                    name: 'Services Request Form',
                    type: 'paid',
                    format: 'PDF',
                    size: '350KB',
                    price: 100,
                    description: 'Request group services',
                    download_url: '#',
                    preview_url: '#'
                },
                {
                    id: 8,
                    name: 'Rules and Regulations',
                    type: 'paid',
                    format: 'PDF',
                    size: '400KB',
                    price: 100,
                    description: 'Group operational guidelines',
                    download_url: '#',
                    preview_url: '#'
                },
                {
                    id: 9,
                    name: 'Financial Statements',
                    type: 'paid',
                    format: 'PDF',
                    size: '2.5MB',
                    price: 1000,
                    description: 'Annual financial reports',
                    download_url: '#',
                    preview_url: '#'
                },
                {
                    id: 10,
                    name: 'Registration Certificate',
                    type: 'paid',
                    format: 'PDF',
                    size: '500KB',
                    price: 250,
                    description: 'Official registration document',
                    download_url: '#',
                    preview_url: '#'
                },
                {
                    id: 11,
                    name: 'Merchandise Request Form',
                    type: 'paid',
                    format: 'PDF',
                    size: '300KB',
                    price: 200,
                    description: 'Order group merchandise',
                    download_url: '#',
                    preview_url: '#'
                }
            ];
            
            this.renderResources();
            
        } catch (error) {
            console.error('Error loading resources:', error);
            this.showError('Failed to load resources. Please try again.');
        }
    }
    
    renderResources() {
        const tableBody = document.getElementById('resourcesTableBody');
        tableBody.innerHTML = '';
        
        const resourcesToShow = this.filteredResources.length > 0 ? 
            this.filteredResources : this.resources;
        
        resourcesToShow.forEach(resource => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>
                    <strong>${resource.name}</strong>
                    <small class="resource-description">${resource.description}</small>
                </td>
                <td>
                    <span class="resource-${resource.type}">
                        ${resource.type === 'free' ? 'Free' : 'Paid'}
                    </span>
                </td>
                <td>${resource.format}</td>
                <td>${resource.size}</td>
                <td>
                    ${resource.type === 'free' ? 
                        'FREE' : 
                        `KSh ${resource.price.toLocaleString()}`
                    }
                </td>
                <td>
                    <i class="fas fa-${this.getResourceStatusIcon(resource)} ${this.getResourceStatusClass(resource)}"></i>
                    ${this.getResourceStatus(resource)}
                </td>
                <td>
                    <div class="resource-action">
                        ${this.getActionButtons(resource)}
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        this.attachActionListeners();
    }
    
    getResourceStatus(resource) {
        if (resource.type === 'free') return 'Available';
        
        const userProfile = authManager?.getProfile();
        if (userProfile && userProfile.balance >= resource.price) {
            return 'Available';
        }
        return 'Payment Required';
    }
    
    getResourceStatusIcon(resource) {
        if (resource.type === 'free') return 'check-circle';
        
        const userProfile = authManager?.getProfile();
        if (userProfile && userProfile.balance >= resource.price) {
            return 'check-circle';
        }
        return 'lock';
    }
    
    getResourceStatusClass(resource) {
        if (resource.type === 'free') return 'available';
        
        const userProfile = authManager?.getProfile();
        if (userProfile && userProfile.balance >= resource.price) {
            return 'available';
        }
        return 'pending';
    }
    
    getActionButtons(resource) {
        if (resource.type === 'free') {
            return `
                <button class="action-btn download-btn" data-id="${resource.id}" data-type="free">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="action-btn preview-btn" data-id="${resource.id}">
                    <i class="fas fa-eye"></i> Preview
                </button>
            `;
        } else {
            const userProfile = authManager?.getProfile();
            if (userProfile && userProfile.balance >= resource.price) {
                return `
                    <button class="action-btn download-btn" data-id="${resource.id}" data-type="paid">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="action-btn preview-btn" data-id="${resource.id}">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                `;
            } else {
                return `
                    <button class="action-btn pay-btn" data-id="${resource.id}">
                        <i class="fas fa-shopping-cart"></i> Purchase
                    </button>
                    <button class="action-btn preview-btn" data-id="${resource.id}">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                `;
            }
        }
    }
    
    attachActionListeners() {
        // Download buttons
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const resourceId = parseInt(e.target.closest('button').dataset.id);
                const resourceType = e.target.closest('button').dataset.type;
                this.handleDownload(resourceId, resourceType);
            });
        });
        
        // Purchase buttons
        document.querySelectorAll('.pay-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const resourceId = parseInt(e.target.closest('button').dataset.id);
                this.showPaymentModal(resourceId);
            });
        });
        
        // Preview buttons
        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const resourceId = parseInt(e.target.closest('button').dataset.id);
                this.previewResource(resourceId);
            });
        });
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        // Filter resources
        if (filter === 'all') {
            this.filteredResources = [];
        } else {
            this.filteredResources = this.resources.filter(
                resource => resource.type === filter
            );
        }
        
        this.renderResources();
    }
    
    filterResources(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredResources = this.currentFilter === 'all' ? 
                [] : this.resources.filter(r => r.type === this.currentFilter);
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredResources = this.resources.filter(resource => 
                resource.name.toLowerCase().includes(term) ||
                resource.description.toLowerCase().includes(term)
            );
        }
        
        this.renderResources();
    }
    
    async handleDownload(resourceId, resourceType) {
        const resource = this.resources.find(r => r.id === resourceId);
        if (!resource) return;
        
        // For paid resources, check balance
        if (resourceType === 'paid') {
            const userProfile = authManager?.getProfile();
            if (!userProfile || userProfile.balance < resource.price) {
                this.showPaymentModal(resourceId);
                return;
            }
        }
        
        // Show download modal
        this.showDownloadModal(resource);
    }
    
    async previewResource(resourceId) {
        const resource = this.resources.find(r => r.id === resourceId);
        if (!resource) return;
        
        // In a real app, this would open a preview
        alert(`Preview of "${resource.name}" would open here.\n\nDescription: ${resource.description}`);
    }
    
    async loadDownloadHistory() {
        try {
            const user = authManager?.getUser();
            if (!user) return;
            
            // In a real app, this would come from your API
            const history = JSON.parse(localStorage.getItem(`download_history_${user.id}`) || '[]');
            
            const historyContainer = document.getElementById('downloadHistory');
            if (history.length === 0) {
                historyContainer.innerHTML = '<p class="empty-history">No downloads yet</p>';
                return;
            }
            
            historyContainer.innerHTML = history.map(item => `
                <div class="history-item">
                    <div class="history-info">
                        <h4>${item.resource_name}</h4>
                        <div class="history-meta">
                            <span><i class="fas fa-calendar"></i> ${new Date(item.downloaded_at).toLocaleDateString()}</span>
                            <span><i class="fas fa-file"></i> ${item.format}</span>
                            <span><i class="fas fa-${item.type === 'free' ? 'gift' : 'coins'}"></i> ${item.type === 'free' ? 'Free' : `KSh ${item.price}`}</span>
                        </div>
                    </div>
                    <div class="history-action">
                        <a href="${item.download_url}" class="btn-secondary" download>
                            <i class="fas fa-redo"></i> Re-download
                        </a>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }
    
    async recordDownload(resource) {
        try {
            const user = authManager?.getUser();
            if (!user) return;
            
            const downloadRecord = {
                resource_id: resource.id,
                resource_name: resource.name,
                type: resource.type,
                price: resource.price,
                format: resource.format,
                downloaded_at: new Date().toISOString(),
                device_info: this.getDeviceInfo(),
                user_id: user.id
            };
            
            // Save to local storage
            const history = JSON.parse(localStorage.getItem(`download_history_${user.id}`) || '[]');
            history.unshift(downloadRecord);
            localStorage.setItem(`download_history_${user.id}`, JSON.stringify(history));
            
            // Update download count in profile
            if (authManager?.userProfile) {
                authManager.userProfile.download_count = (authManager.userProfile.download_count || 0) + 1;
                document.getElementById('downloadCount').textContent = authManager.userProfile.download_count;
                
                // Deduct balance for paid resources
                if (resource.type === 'paid') {
                    authManager.userProfile.balance -= resource.price;
                    document.getElementById('userBalance').textContent = authManager.userProfile.balance;
                }
            }
            
            // Send to Google Sheets
            await this.trackDownload(resource);
            
            // Reload history
            await this.loadDownloadHistory();
            
        } catch (error) {
            console.error('Error recording download:', error);
        }
    }
    
    async trackDownload(resource) {
        const deviceInfo = this.getDeviceInfo();
        const downloadData = {
            resource_id: resource.id,
            resource_name: resource.name,
            type: resource.type,
            price: resource.price,
            user_id: authManager?.getUser()?.id,
            timestamp: new Date().toISOString(),
            device_info: deviceInfo
        };
        
        try {
            await fetch('YOUR_GOOGLE_SCRIPT_URL', {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'download',
                    data: downloadData
                })
            });
        } catch (error) {
            console.error('Error tracking download:', error);
            this.storeOfflineDownload(downloadData);
        }
    }
    
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookies: document.cookie ? 'enabled' : 'disabled',
            localStorage: !!window.localStorage,
            sessionStorage: !!window.sessionStorage,
            online: navigator.onLine
        };
    }
    
    storeOfflineDownload(data) {
        const offlineDownloads = JSON.parse(localStorage.getItem('offlineDownloads') || '[]');
        offlineDownloads.push(data);
        localStorage.setItem('offlineDownloads', JSON.stringify(offlineDownloads));
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        document.querySelector('.resources-section .container').prepend(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
    
    initPaymentModal() {
        const modal = document.getElementById('paymentModal');
        const closeBtn = document.querySelector('.close-payment');
        const amountButtons = document.querySelectorAll('.amount-btn');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        amountButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = btn.dataset.amount;
                document.getElementById('paymentAmount').value = amount;
            });
        });
        
        document.getElementById('paymentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processPayment();
        });
    }
    
    initDownloadModal() {
        const modal = document.getElementById('downloadModal');
        const closeBtn = document.querySelector('.close-download');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    showPaymentModal(resourceId) {
        const resource = this.resources.find(r => r.id === resourceId);
        if (!resource) return;
        
        const modal = document.getElementById('paymentModal');
        const title = document.getElementById('paymentTitle');
        
        title.textContent = `Purchase: ${resource.name}`;
        modal.style.display = 'flex';
        
        // Store current resource for payment processing
        this.currentPaymentResource = resource;
    }
    
    showDownloadModal(resource) {
        const modal = document.getElementById('downloadModal');
        const title = document.getElementById('downloadTitle');
        const resourceName = document.getElementById('resourceName');
        const resourcePrice = document.getElementById('resourcePrice');
        const currentBalance = document.getElementById('currentBalance');
        const options = document.getElementById('downloadOptions');
        
        title.textContent = `Download ${resource.name}`;
        resourceName.textContent = resource.name;
        resourcePrice.textContent = resource.type === 'free' ? '0' : resource.price.toLocaleString();
        
        const userProfile = authManager?.getProfile();
        currentBalance.textContent = userProfile?.balance || 0;
        
        // Set download options
        options.innerHTML = `
            <button class="option-btn" data-method="email">
                <i class="fas fa-envelope"></i>
                <div>
                    <strong>Send to Email</strong>
                    <small>Download link will be sent to your registered email</small>
                </div>
            </button>
            <button class="option-btn" data-method="whatsapp">
                <i class="fab fa-whatsapp"></i>
                <div>
                    <strong>Send to WhatsApp</strong>
                    <small>Download link will be sent to your phone number</small>
                </div>
            </button>
            <button class="option-btn" data-method="direct">
                <i class="fas fa-download"></i>
                <div>
                    <strong>Direct Download</strong>
                    <small>Download immediately to your device</small>
                </div>
            </button>
        `;
        
        // Add event listeners to options
        options.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const method = btn.dataset.method;
                this.processDownload(resource, method);
            });
        });
        
        modal.style.display = 'flex';
        this.currentDownloadResource = resource;
    }
    
    async processPayment() {
        const amount = document.getElementById('paymentAmount').value;
        const method = 'mpesa'; // In a real app, this would be dynamic
        
        try {
            // Show processing message
            alert(`Payment of KSh ${amount} via ${method} is being processed.\n\nYou will receive a confirmation shortly.`);
            
            // In a real app, this would process payment through your API
            // For now, simulate payment success
            
            // Update user balance
            if (authManager?.userProfile) {
                authManager.userProfile.balance += parseInt(amount);
                document.getElementById('userBalance').textContent = authManager.userProfile.balance;
                
                // Close modal
                document.getElementById('paymentModal').style.display = 'none';
                
                // Show success message
                this.showPaymentSuccess(amount);
                
                // If there's a pending resource purchase, trigger download
                if (this.currentPaymentResource) {
                    setTimeout(() => {
                        this.handleDownload(this.currentPaymentResource.id, 'paid');
                    }, 2000);
                }
            }
            
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed. Please try again.');
        }
    }
    
    async processDownload(resource, method) {
        // Record the download
        await this.recordDownload(resource);
        
        // Show appropriate message based on method
        let message = '';
        switch (method) {
            case 'email':
                message = `Download link for "${resource.name}" has been sent to your email.`;
                break;
            case 'whatsapp':
                message = `Download link for "${resource.name}" has been sent to your WhatsApp.`;
                break;
            case 'direct':
                message = `"${resource.name}" is now downloading...`;
                // Simulate download start
                this.simulateDownload(resource);
                break;
        }
        
        alert(message);
        
        // Close modal
        document.getElementById('downloadModal').style.display = 'none';
    }
    
    simulateDownload(resource) {
        // In a real app, this would initiate actual download
        console.log(`Downloading: ${resource.name}`);
        
        // For demo purposes, create a temporary download link
        const content = `This is a sample of "${resource.name}".\n\nIn the real application, this would be the actual resource file.\n\n---\nUmburio Self-Help Group\n${new Date().toLocaleDateString()}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${resource.name.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    showPaymentSuccess(amount) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <div>
                <strong>Payment Successful!</strong>
                <p>KSh ${amount} has been added to your account balance.</p>
            </div>
        `;
        
        document.querySelector('.payment-section .container').prepend(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }
}

// Initialize Resources Manager
let resourcesManager;

document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to initialize
    const checkAuth = setInterval(() => {
        if (window.authManager && authManager.isLoggedIn()) {
            clearInterval(checkAuth);
            resourcesManager = new ResourcesManager();
            window.resourcesManager = resourcesManager;
        }
    }, 100);
});
