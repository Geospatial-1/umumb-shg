// Carousel Functionality
class ImageCarousel {
    constructor() {
        this.carousel = document.getElementById('imageCarousel');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.currentIndex = 0;
        this.autoScrollInterval = null;
        this.scrollDelay = 5000; // 5 seconds
        
        this.images = [
            {
                src: 'images/activity1.jpg',
                alt: 'Group Meeting',
                title: 'Weekly Group Meeting',
                description: 'Members discussing development projects'
            },
            {
                src: 'images/activity2.jpg',
                alt: 'Training Session',
                title: 'Financial Literacy Training',
                description: 'Members learning about savings and investments'
            },
            {
                src: 'images/activity3.jpg',
                alt: 'Community Service',
                title: 'Community Clean-up',
                description: 'Members participating in environmental conservation'
            },
            {
                src: 'images/activity4.jpg',
                alt: 'Business Exhibition',
                title: 'Business Exhibition',
                description: 'Showcasing member businesses and products'
            },
            {
                src: 'images/activity5.jpg',
                alt: 'Loan Disbursement',
                title: 'Loan Disbursement Ceremony',
                description: 'Supporting member businesses through loans'
            }
        ];
        
        this.init();
    }
    
    init() {
        this.createCarouselItems();
        this.setupEventListeners();
        this.startAutoScroll();
    }
    
    createCarouselItems() {
        // Clear existing items
        this.carousel.innerHTML = '';
        
        // Create carousel items
        this.images.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'carousel-item';
            item.dataset.index = index;
            
            // Use placeholder if image doesn't exist
            const imgSrc = image.src;
            const placeholderColor = this.getPlaceholderColor(index);
            
            item.innerHTML = `
                <div style="width: 100%; height: 100%; background: ${placeholderColor}; 
                     display: flex; align-items: center; justify-content: center; 
                     border-radius: 15px;">
                    <div style="text-align: center; color: white; padding: 20px;">
                        <i class="fas fa-image" style="font-size: 4rem; margin-bottom: 1rem;"></i>
                        <h3>${image.title}</h3>
                        <p>${image.description}</p>
                        <small>Image ${index + 1} of ${this.images.length}</small>
                    </div>
                </div>
                <div class="carousel-item-content">
                    <h3>${image.title}</h3>
                    <p>${image.description}</p>
                </div>
            `;
            
            this.carousel.appendChild(item);
        });
        
        this.updateCarousel();
    }
    
    getPlaceholderColor(index) {
        const colors = [
            'linear-gradient(135deg, #1a5a1a 0%, #0a2f0a 100%)',
            'linear-gradient(135deg, #2d7a2d 0%, #1a5a1a 100%)',
            'linear-gradient(135deg, #3f9a3f 0%, #2d7a2d 100%)',
            'linear-gradient(135deg, #52ba52 0%, #3f9a3f 100%)',
            'linear-gradient(135deg, #39ff14 0%, #52ba52 100%)'
        ];
        return colors[index % colors.length];
    }
    
    updateCarousel() {
        const items = this.carousel.querySelectorAll('.carousel-item');
        items.forEach((item, index) => {
            item.style.transform = `translateX(${(index - this.currentIndex) * 100}%)`;
            
            // Center image effect
            if (index === this.currentIndex) {
                item.style.zIndex = '2';
                item.style.opacity = '1';
            } else {
                item.style.zIndex = '1';
                item.style.opacity = '0.7';
            }
        });
    }
    
    nextSlide() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.updateCarousel();
    }
    
    prevSlide() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.updateCarousel();
    }
    
    goToSlide(index) {
        this.currentIndex = index;
        this.updateCarousel();
    }
    
    setupEventListeners() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => {
                this.prevSlide();
                this.resetAutoScroll();
            });
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                this.nextSlide();
                this.resetAutoScroll();
            });
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prevSlide();
                this.resetAutoScroll();
            } else if (e.key === 'ArrowRight') {
                this.nextSlide();
                this.resetAutoScroll();
            }
        });
        
        // Touch/swipe support
        let touchStartX = 0;
        let touchEndX = 0;
        
        this.carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        this.carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        });
    }
    
    handleSwipe(startX, endX) {
        const swipeThreshold = 50;
        
        if (startX - endX > swipeThreshold) {
            // Swipe left - next slide
            this.nextSlide();
            this.resetAutoScroll();
        } else if (endX - startX > swipeThreshold) {
            // Swipe right - previous slide
            this.prevSlide();
            this.resetAutoScroll();
        }
    }
    
    startAutoScroll() {
        this.autoScrollInterval = setInterval(() => {
            this.nextSlide();
        }, this.scrollDelay);
    }
    
    resetAutoScroll() {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
            this.startAutoScroll();
        }
    }
    
    stopAutoScroll() {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
        }
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const carousel = new ImageCarousel();
    
    // Pause auto-scroll on hover
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', () => {
            carousel.stopAutoScroll();
        });
        
        carouselContainer.addEventListener('mouseleave', () => {
            carousel.startAutoScroll();
        });
    }
});
