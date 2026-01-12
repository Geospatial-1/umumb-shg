// Supabase Authentication Configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Supabase anon key

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authModal = document.getElementById('authModal');
        this.authButton = document.getElementById('authButton');
        this.authText = document.getElementById('authText');
        this.authIcon = document.getElementById('authIcon');
        this.protectedContent = document.getElementById('protectedContent');
        this.resourcesContent = document.getElementById('resourcesContent');
        this.loadingState = document.getElementById('loadingState');
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.checkAuthState();
    }
    
    setupEventListeners() {
        // Auth button click
        this.authButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.isAuthenticated) {
                this.showUserMenu();
            } else {
                this.showAuthModal();
            }
        });
        
        // Close auth modal
        document.querySelector('.close-auth').addEventListener('click', () => {
            this.hideAuthModal();
        });
        
        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchAuthTab(tabName);
            });
        });
        
        // Login form submission
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
        
        // Register form submission
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegistration();
        });
        
        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.handleLogout();
        });
        
        // Toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                const icon = this.querySelector('i');
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
        
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === this.authModal) {
                this.hideAuthModal();
            }
        });
    }
    
    async checkAuthState() {
        try {
            // Check for existing session
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;
            
            if (session) {
                this.currentUser = session.user;
                this.isAuthenticated = true;
                this.updateUI();
                await this.loadUserProfile();
            } else {
                this.showAuthModal();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.showAuthModal();
        }
    }
    
    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        const loginSpinner = document.getElementById('loginSpinner');
        const loginError = document.getElementById('loginError');
        
        loginSpinner.classList.remove('hidden');
        loginError.style.display = 'none';
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            this.currentUser = data.user;
            this.isAuthenticated = true;
            
            // Set session expiration based on remember me
            if (rememberMe) {
                await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token
                });
            }
            
            this.updateUI();
            this.hideAuthModal();
            await this.loadUserProfile();
            
            // Track login in Google Sheets
            await this.trackActivity('login');
            
        } catch (error) {
            loginError.textContent = error.message;
            loginError.style.display = 'block';
        } finally {
            loginSpinner.classList.add('hidden');
        }
    }
    
    async handleRegistration() {
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('registerEmail').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        const registerSpinner = document.getElementById('registerSpinner');
        const registerError = document.getElementById('registerError');
        
        // Basic validation
        if (password !== confirmPassword) {
            registerError.textContent = 'Passwords do not match';
            registerError.style.display = 'block';
            return;
        }
        
        if (password.length < 8) {
            registerError.textContent = 'Password must be at least 8 characters';
            registerError.style.display = 'block';
            return;
        }
        
        registerSpinner.classList.remove('hidden');
        registerError.style.display = 'none';
        
        try {
            // Register user with Supabase
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        phone: phone,
                        balance: 0,
                        download_count: 0,
                        registered_at: new Date().toISOString()
                    }
                }
            });
            
            if (authError) throw authError;
            
            // Create user profile in database
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    email: email,
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    balance: 0,
                    download_count: 0,
                    created_at: new Date().toISOString(),
                    device_info: this.getDeviceInfo()
                });
            
            if (profileError) throw profileError;
            
            // Show success message and switch to login
            alert('Registration successful! Please check your email to confirm your account.');
            this.switchAuthTab('login');
            
            // Clear form
            document.getElementById('registerForm').reset();
            
        } catch (error) {
            registerError.textContent = error.message;
            registerError.style.display = 'block';
        } finally {
            registerSpinner.classList.add('hidden');
        }
    }
    
    async handleLogout() {
        try {
            await supabase.auth.signOut();
            this.currentUser = null;
            this.isAuthenticated = false;
            this.updateUI();
            this.showAuthModal();
            
            // Track logout in Google Sheets
            await this.trackActivity('logout');
            
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    async loadUserProfile() {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();
            
            if (error) throw error;
            
            // Update UI with user data
            document.getElementById('userGreeting').textContent = 
                `Welcome, ${profile.first_name}!`;
            document.getElementById('userEmail').textContent = profile.email;
            document.getElementById('downloadCount').textContent = profile.download_count || 0;
            document.getElementById('userBalance').textContent = profile.balance || 0;
            
            // Store profile in memory
            this.userProfile = profile;
            
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }
    
    updateUI() {
        if (this.isAuthenticated) {
            // User is logged in
            this.authText.textContent = 'Account';
            this.authIcon.className = 'fas fa-user-check';
            this.loadingState.classList.add('hidden');
            this.protectedContent.classList.remove('hidden');
            
            // Hide auth modal if open
            this.hideAuthModal();
            
        } else {
            // User is not logged in
            this.authText.textContent = 'Login';
            this.authIcon.className = 'fas fa-user';
            this.loadingState.classList.remove('hidden');
            this.protectedContent.classList.add('hidden');
        }
    }
    
    showAuthModal() {
        this.authModal.style.display = 'flex';
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
        document.querySelectorAll('.auth-error').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    hideAuthModal() {
        this.authModal.style.display = 'none';
    }
    
    switchAuthTab(tabName) {
        // Update tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === `${tabName}Form`);
        });
    }
    
    showUserMenu() {
        // Create user menu dropdown
        const userMenu = document.createElement('div');
        userMenu.className = 'user-menu';
        userMenu.innerHTML = `
            <div class="menu-header">
                <i class="fas fa-user-circle"></i>
                <div>
                    <strong>${this.userProfile?.first_name || 'User'}</strong>
                    <small>${this.currentUser?.email}</small>
                </div>
            </div>
            <div class="menu-items">
                <a href="#profile"><i class="fas fa-user"></i> Profile</a>
                <a href="#settings"><i class="fas fa-cog"></i> Settings</a>
                <a href="#history"><i class="fas fa-history"></i> History</a>
                <hr>
                <a href="#logout" id="menuLogout"><i class="fas fa-sign-out-alt"></i> Logout</a>
            </div>
        `;
        
        // Position and show menu
        const rect = this.authButton.getBoundingClientRect();
        userMenu.style.position = 'absolute';
        userMenu.style.top = `${rect.bottom + 5}px`;
        userMenu.style.right = `${window.innerWidth - rect.right}px`;
        userMenu.style.zIndex = '1000';
        
        document.body.appendChild(userMenu);
        
        // Handle logout from menu
        userMenu.querySelector('#menuLogout').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
            userMenu.remove();
        });
        
        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!userMenu.contains(e.target) && e.target !== this.authButton) {
                userMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    }
    
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookiesEnabled: navigator.cookieEnabled,
            online: navigator.onLine,
            localStorage: !!window.localStorage
        };
    }
    
    async trackActivity(action) {
        const deviceInfo = this.getDeviceInfo();
        const activityData = {
            user_id: this.currentUser?.id || 'anonymous',
            action: action,
            timestamp: new Date().toISOString(),
            device_info: deviceInfo,
            ip_address: await this.getIPAddress()
        };
        
        // Send to Google Sheets via Apps Script
        try {
            await fetch('YOUR_GOOGLE_SCRIPT_URL', {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'activity',
                    data: activityData
                })
            });
        } catch (error) {
            console.error('Error tracking activity:', error);
            // Store locally for later sync
            this.storeOfflineActivity(activityData);
        }
    }
    
    async getIPAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }
    
    storeOfflineActivity(data) {
        const offlineActivities = JSON.parse(localStorage.getItem('offlineActivities') || '[]');
        offlineActivities.push(data);
        localStorage.setItem('offlineActivities', JSON.stringify(offlineActivities));
    }
    
    // Public methods for other scripts to use
    getUser() {
        return this.currentUser;
    }
    
    getProfile() {
        return this.userProfile;
    }
    
    isLoggedIn() {
        return this.isAuthenticated;
    }
}

// Initialize Auth Manager
let authManager;

document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
    
    // Make auth manager globally available
    window.authManager = authManager;
});
