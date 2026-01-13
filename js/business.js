// Business Directory Management
class BusinessManager {
    constructor() {
        this.businesses = [];
        this.filteredBusinesses = [];
        this.currentCategory = 'all';
        this.currentBusinessId = null;
        this.trackedBusinesses = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadBusinesses();
        this.loadTrackedBusinesses();
    }
    
    setupEventListeners() {
        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setCategory(e.target.dataset.category);
            });
        });
        
        // Search input
        document.getElementById('businessSearch').addEventListener('input', (e) => {
            this.searchBusinesses(e.target.value);
        });
        
        // Sort select
        document.getElementById('sortBusinesses').addEventListener('change', (e) => {
            this.sortBusinesses(e.target.value);
        });
        
        // Add business button
        document.getElementById('addBusinessBtn').addEventListener('click', () => {
            this.showBusinessModal();
        });
        
        // Close buttons
        document.querySelectorAll('.close-business, .close-review').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });
        
        // Business form
        document.getElementById('businessForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBusiness();
        });
        
        // Review form
        document.getElementById('reviewForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitReview();
        });
        
        // Rating stars
        document.querySelectorAll('#ratingStars i').forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.setRating(rating);
            });
            
            star.addEventListener('mouseover', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.hoverRating(rating);
            });
            
            star.addEventListener('mouseout', () => {
                this.resetHoverRating();
            });
        });
        
        // Click outside modals to close
        window.addEventListener('click', (e) => {
            const modals = ['businessModal', 'reviewModal'];
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }
    
    async loadBusinesses() {
        try {
            this.businesses = JSON.parse(localStorage.getItem('umburio_businesses') || '[]');
            
            // If no businesses, load sample data
            if (this.businesses.length === 0) {
                this.businesses = this.getSampleBusinesses();
                localStorage.setItem('umburio_businesses', JSON.stringify(this.businesses));
            }
            
            this.renderBusinesses();
            this.updateStatistics();
            
        } catch (error) {
            console.error('Error loading businesses:', error);
        }
    }
    
    getSampleBusinesses() {
        return [
            {
                id: 1,
                name: "Rhino Inn Restaurant",
                owner: "John Maroa",
                category: "food",
                description: "Family restaurant serving local and international cuisine. Open daily for breakfast, lunch, and dinner.",
                location: "Kehancha Town, Behind Primara Hotel",
                phone: "0728 560 925",
                email: "rhinoinn@example.com",
                website: "",
                hours: "Mon-Sun: 6AM-10PM",
                image: "",
                memberNumber: "UMB001",
                rating: 4.5,
                reviews: 24,
                views: 156,
                listed_date: "2024-11-15",
                verified: true
            },
            {
                id: 2,
                name: "Maroa Hardware & Construction",
                owner: "James Maroa",
                category: "construction",
                description: "Quality hardware supplies and construction services. We specialize in building materials and construction projects.",
                location: "Kehancha Market, Shop 45",
                phone: "0712 345 678",
                email: "maroahardware@example.com",
                website: "",
                hours: "Mon-Sat: 8AM-6PM, Sun: 9AM-4PM",
                image: "",
                memberNumber: "UMB002",
                rating: 4.8,
                reviews: 18,
                views: 89,
                listed_date: "2024-12-05",
                verified: true
            },
            {
                id: 3,
                name: "Green Valley Farm Produce",
                owner: "Sarah Kemunto",
                category: "agriculture",
                description: "Fresh farm produce including vegetables, fruits, and dairy products. We deliver to homes and businesses.",
                location: "Bukira East Ward, Kehancha",
                phone: "0733 987 654",
                email: "greenvalley@example.com",
                website: "",
                hours: "Mon-Fri: 7AM-7PM, Sat: 7AM-5PM",
                image: "",
                memberNumber: "UMB003",
                rating: 4.3,
                reviews: 12,
                views: 67,
                listed_date: "2025-01-10",
                verified: true
            }
        ];
    }
    
    renderBusinesses() {
        const container = document.getElementById('businessesGrid');
        if (!container) return;
        
        const businessesToShow = this.filteredBusinesses.length > 0 ? 
            this.filteredBusinesses : this.businesses;
        
        if (businessesToShow.length === 0) {
            container.innerHTML = `
                <div class="no-businesses">
                    <i class="fas fa-store-slash"></i>
                    <h3>No businesses found</h3>
                    <p>Be the first to list your business!</p>
                    <button class="btn-primary" id="firstBusinessBtn">
                        <i class="fas fa-plus"></i> Add Your Business
                    </button>
                </div>
            `;
            
            document.getElementById('firstBusinessBtn')?.addEventListener('click', () => {
                this.showBusinessModal();
            });
            
            return;
        }
        
        container.innerHTML = businessesToShow.map(business => this.createBusinessCard(business)).join('');
        
        // Add event listeners to cards
        this.attachBusinessCardListeners();
    }
    
    createBusinessCard(business) {
        const categoryNames = {
            'retail': 'Retail Shop',
            'services': 'Services',
            'food': 'Food & Beverage',
            'agriculture': 'Agriculture',
            'manufacturing': 'Manufacturing',
            'transport': 'Transport',
            'construction': 'Construction',
            'other': 'Other'
        };
        
        const isTracked = this.trackedBusinesses.includes(business.id);
        
        return `
            <div class="business-card" data-id="${business.id}">
                ${business.image ? `
                    <img src="${business.image}" alt="${business.name}" class="business-image">
                ` : `
                    <div class="business-image">
                        <i class="fas fa-store"></i>
                    </div>
                `}
                <div class="business-content">
                    <span class="business-category">${categoryNames[business.category] || business.category}</span>
                    <h3 class="business-title">${business.name}</h3>
                    <div class="business-owner">
                        <i class="fas fa-user-tie"></i>
                        <span>${business.owner}</span>
                        ${business.verified ? '<i class="fas fa-check-circle verified" title="Verified Member"></i>' : ''}
                    </div>
                    <div class="business-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${business.location}</span>
                    </div>
                    <div class="business-description">
                        ${business.description}
                    </div>
                    <div class="business-contact">
                        <div class="contact-item">
                            <i class="fas fa-phone"></i>
                            <span>${business.phone}</span>
                        </div>
                        ${business.hours ? `
                            <div class="contact-item">
                                <i class="fas fa-clock"></i>
                                <span>${business.hours}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="business-rating">
                        <div class="stars">
                            ${this.generateStarRating(business.rating)}
                        </div>
                        <span class="rating-value">${business.rating.toFixed(1)}</span>
                        <span class="review-count">(${business.reviews} reviews)</span>
                    </div>
                    <div class="business-actions">
                        <button class="business-btn view-btn" data-id="${business.id}">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        <button class="business-btn review-btn" data-id="${business.id}">
                            <i class="fas fa-star"></i> Review
                        </button>
                        <button class="business-btn track-btn ${isTracked ? 'tracked' : ''}" data-id="${business.id}">
                            <i class="fas fa-${isTracked ? 'heart' : 'heartbeat'}"></i> 
                            ${isTracked ? 'Tracked' : 'Track'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    generateStarRating(rating) {
        let stars = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars += '<i class="fas fa-star"></i>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        
        return stars;
    }
    
    attachBusinessCardListeners() {
        // View buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const businessId = parseInt(e.target.closest('button').dataset.id);
                this.viewBusinessDetails(businessId);
            });
        });
        
        // Review buttons
        document.querySelectorAll('.review-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const businessId = parseInt(e.target.closest('button').dataset.id);
                this.showReviewModal(businessId);
            });
        });
        
        // Track buttons
        document.querySelectorAll('.track-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const businessId = parseInt(e.target.closest('button').dataset.id);
                this.toggleTrackBusiness(businessId);
            });
        });
    }
    
    setCategory(category) {
        this.currentCategory = category;
        
        // Update active button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        if (category === 'all') {
            this.filteredBusinesses = [];
        } else {
            this.filteredBusinesses = this.businesses.filter(
                business => business.category === category
            );
        }
        
        this.renderBusinesses();
    }
    
    searchBusinesses(query) {
        if (!query.trim()) {
            this.filteredBusinesses = this.currentCategory === 'all' ? [] : 
                this.businesses.filter(b => b.category === this.currentCategory);
        } else {
            const term = query.toLowerCase();
            this.filteredBusinesses = this.businesses.filter(business => 
                business.name.toLowerCase().includes(term) ||
                business.owner.toLowerCase().includes(term) ||
                business.description.toLowerCase().includes(term) ||
                business.location.toLowerCase().includes(term) ||
                business.category.toLowerCase().includes(term)
            );
        }
        
        this.renderBusinesses();
    }
    
    sortBusinesses(criteria) {
        let sorted = [...this.businesses];
        
        switch (criteria) {
            case 'newest':
                sorted.sort((a, b) => new Date(b.listed_date) - new Date(a.listed_date));
                break;
            case 'popular':
                sorted.sort((a, b) => b.views - a.views);
                break;
            case 'rating':
                sorted.sort((a, b) => b.rating - a.rating);
                break;
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }
        
        this.businesses = sorted;
        this.renderBusinesses();
    }
    
    updateStatistics() {
        const totalBusinesses = this.businesses.length;
        const totalMembers = new Set(this.businesses.map(b => b.memberNumber)).size;
        
        const totalRating = this.businesses.reduce((sum, b) => sum + b.rating, 0);
        const averageRating = totalBusinesses > 0 ? totalRating / totalBusinesses : 0;
        
        const totalViews = this.businesses.reduce((sum, b) => sum + (b.views || 0), 0);
        
        document.getElementById('totalBusinesses').textContent = totalBusinesses;
        document.getElementById('totalMembers').textContent = totalMembers;
        document.getElementById('averageRating').textContent = averageRating.toFixed(1);
        document.getElementById('totalViews').textContent = totalViews;
    }
    
    viewBusinessDetails(businessId) {
        const business = this.businesses.find(b => b.id === businessId);
        if (!business) return;
        
        // Increment view count
        business.views = (business.views || 0) + 1;
        localStorage.setItem('umburio_businesses', JSON.stringify(this.businesses));
        this.updateStatistics();
        
        // Show details in modal or new page
        alert(`Business Details:\n\nName: ${business.name}\nOwner: ${business.owner}\nCategory: ${business.category}\nLocation: ${business.location}\nPhone: ${business.phone}\n\nDescription: ${business.description}`);
    }
    
    showBusinessModal(business = null) {
        this.currentBusinessId = business?.id || null;
        
        const modal = document.getElementById('businessModal');
        const title = document.getElementById('businessModalTitle');
        
        if (business) {
            title.textContent = 'Edit Business';
            this.populateBusinessForm(business);
        } else {
            title.textContent = 'List Your Business';
            this.resetBusinessForm();
        }
        
        modal.style.display = 'flex';
    }
    
    populateBusinessForm(business) {
        document.getElementById('businessName').value = business.name;
        document.getElementById('businessOwner').value = business.owner;
        document.getElementById('businessCategory').value = business.category;
        document.getElementById('businessPhone').value = business.phone;
        document.getElementById('businessEmail').value = business.email || '';
        document.getElementById('businessWebsite').value = business.website || '';
        document.getElementById('businessLocation').value = business.location;
        document.getElementById('businessDescription').value = business.description;
        document.getElementById('businessImage').value = business.image || '';
        document.getElementById('businessHours').value = business.hours || '';
        document.getElementById('memberNumber').value = business.memberNumber || '';
    }
    
    resetBusinessForm() {
        document.getElementById('businessForm').reset();
        this.currentBusinessId = null;
    }
    
    saveBusiness() {
        const businessData = {
            name: document.getElementById('businessName').value,
            owner: document.getElementById('businessOwner').value,
            category: document.getElementById('businessCategory').value,
            phone: document.getElementById('businessPhone').value,
            email: document.getElementById('businessEmail').value || '',
            website: document.getElementById('businessWebsite').value || '',
            location: document.getElementById('businessLocation').value,
            description: document.getElementById('businessDescription').value,
            image: document.getElementById('businessImage').value || '',
            hours: document.getElementById('businessHours').value || '',
            memberNumber: document.getElementById('memberNumber').value,
            rating: 0,
            reviews: 0,
            views: 0,
            listed_date: new Date().toISOString().split('T')[0],
            verified: false
        };
        
        // Verify member number (in real app, check against database)
        if (!this.verifyMemberNumber(businessData.memberNumber)) {
            alert('Invalid member number. Please enter a valid Umburio member number.');
            return;
        }
        
        if (this.currentBusinessId) {
            // Update existing business
            const index = this.businesses.findIndex(b => b.id === this.currentBusinessId);
            if (index !== -1) {
                businessData.id = this.currentBusinessId;
                businessData.rating = this.businesses[index].rating || 0;
                businessData.reviews = this.businesses[index].reviews || 0;
                businessData.views = this.businesses[index].views || 0;
                businessData.verified = this.businesses[index].verified || false;
                this.businesses[index] = businessData;
            }
        } else {
            // Create new business
            businessData.id = Date.now();
            this.businesses.unshift(businessData);
        }
        
        // Save to localStorage
        localStorage.setItem('umburio_businesses', JSON.stringify(this.businesses));
        
        // Close modal and refresh
        document.getElementById('businessModal').style.display = 'none';
        this.renderBusinesses();
        this.updateStatistics();
        
        alert('Business submitted successfully! It will be visible after verification.');
    }
    
    verifyMemberNumber(memberNumber) {
        // In real app, this would check against Google Sheets
        // For now, accept any number starting with UMB
        return memberNumber.trim().toUpperCase().startsWith('UMB');
    }
    
    showReviewModal(businessId) {
        const business = this.businesses.find(b => b.id === businessId);
        if (!business) return;
        
        this.currentBusinessId = businessId;
        
        document.getElementById('reviewBusinessName').textContent = `Review: ${business.name}`;
        document.getElementById('reviewModal').style.display = 'flex';
    }
    
    setRating(rating) {
        document.getElementById('reviewRating').value = rating;
        
        // Update star display
        const stars = document.querySelectorAll('#ratingStars i');
        stars.forEach((star, index) => {
            const starRating = index + 1;
            if (starRating <= rating) {
                star.classList.remove('far');
                star.classList.add('fas', 'active');
            } else {
                star.classList.remove('fas', 'active');
                star.classList.add('far');
            }
        });
    }
    
    hoverRating(rating) {
        const stars = document.querySelectorAll('#ratingStars i');
        stars.forEach((star, index) => {
            const starRating = index + 1;
            if (starRating <= rating) {
                star.classList.add('hovered');
            } else {
                star.classList.remove('hovered');
            }
        });
    }
    
    resetHoverRating() {
        document.querySelectorAll('#ratingStars i').forEach(star => {
            star.classList.remove('hovered');
        });
    }
    
    submitReview() {
        const rating = parseInt(document.getElementById('reviewRating').value);
        const name = document.getElementById('reviewerName').value.trim();
        const title = document.getElementById('reviewTitle').value.trim();
        const text = document.getElementById('reviewText').value.trim();
        
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }
        
        if (!name) {
            alert('Please enter your name');
            return;
        }
        
        if (!text) {
            alert('Please enter your review');
            return;
        }
        
        const business = this.businesses.find(b => b.id === this.currentBusinessId);
        if (!business) return;
        
        // Save review
        const review = {
            id: Date.now(),
            businessId: this.currentBusinessId,
            businessName: business.name,
            reviewerName: name,
            rating: rating,
            title: title,
            text: text,
            date: new Date().toISOString()
        };
        
        const reviews = JSON.parse(localStorage.getItem(`business_reviews_${this.currentBusinessId}`) || '[]');
        reviews.unshift(review);
        localStorage.setItem(`business_reviews_${this.currentBusinessId}`, JSON.stringify(reviews));
        
        // Update business rating
        this.updateBusinessRating(business);
        
        // Close modal and reset form
        document.getElementById('reviewModal').style.display = 'none';
        document.getElementById('reviewForm').reset();
        this.setRating(0);
        
        alert('Thank you for your review!');
        this.renderBusinesses();
        this.updateStatistics();
    }
    
    updateBusinessRating(business) {
        const reviews = JSON.parse(localStorage.getItem(`business_reviews_${business.id}`) || '[]');
        
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            business.rating = totalRating / reviews.length;
            business.reviews = reviews.length;
            
            localStorage.setItem('umburio_businesses', JSON.stringify(this.businesses));
        }
    }
    
    loadTrackedBusinesses() {
        this.trackedBusinesses = JSON.parse(localStorage.getItem('tracked_businesses') || '[]');
    }
    
    toggleTrackBusiness(businessId) {
        const index = this.trackedBusinesses.indexOf(businessId);
        
        if (index === -1) {
            // Track business
            this.trackedBusinesses.push(businessId);
            alert('Business added to your tracked list!');
        } else {
            // Untrack business
            this.trackedBusinesses.splice(index, 1);
            alert('Business removed from your tracked list!');
        }
        
        localStorage.setItem('tracked_businesses', JSON.stringify(this.trackedBusinesses));
        this.renderBusinesses();
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
}

// Initialize Business Manager
let businessManager;

document.addEventListener('DOMContentLoaded', () => {
    businessManager = new BusinessManager();
    window.businessManager = businessManager;
});
