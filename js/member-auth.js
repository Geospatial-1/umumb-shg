// Member Authentication System
class MemberAuth {
    constructor() {
        this.currentMember = null;
        this.isLoggedIn = false;
        this.merryGoRoundNumber = 14; // Starting from 11/01/2026
        this.lastMeetingDate = new Date('2026-01-11');
        this.meetingInterval = 14; // days
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkLoginStatus();
    }
    
    setupEventListeners() {
        // Login type change
        document.getElementById('loginType')?.addEventListener('change', (e) => {
            this.updateLoginFields(e.target.value);
        });
        
        // Login form submission
        document.getElementById('memberLoginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Toggle password visibility
        document.querySelector('.toggle-password')?.addEventListener('click', function() {
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
    }
    
    updateLoginFields(loginType) {
        // Hide all fields first
        document.getElementById('memberNumberGroup').style.display = 'none';
        document.getElementById('idNumberGroup').style.display = 'none';
        document.getElementById('phoneGroup').style.display = 'none';
        document.getElementById('usernameGroup').style.display = 'none';
        
        // Show selected field
        document.getElementById(`${loginType}Group`).style.display = 'block';
    }
    
    async handleLogin() {
        const loginType = document.getElementById('loginType').value;
        let identifier = '';
        
        switch (loginType) {
            case 'member_number':
                identifier = document.getElementById('memberNumber').value.trim().toUpperCase();
                break;
            case 'id_number':
                identifier = document.getElementById('idNumber').value.trim();
                break;
            case 'phone':
                identifier = document.getElementById('phone').value.trim();
                break;
            case 'username':
                identifier = document.getElementById('username').value.trim();
                break;
        }
        
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberLogin').checked;
        
        const errorDiv = document.getElementById('loginError');
        errorDiv.style.display = 'none';
        
        // Validation
        if (!identifier || !password) {
            errorDiv.textContent = 'Please fill in all required fields';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Show loading
        const loginBtn = document.querySelector('.login-btn');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        loginBtn.disabled = true;
        
        try {
            // Check member credentials
            const member = await this.verifyMember(identifier, password, loginType);
            
            if (member) {
                // Login successful
                this.currentMember = member;
                this.isLoggedIn = true;
                
                // Save to session
                sessionStorage.setItem('member_logged_in', 'true');
                sessionStorage.setItem('member_data', JSON.stringify(member));
                
                if (rememberMe) {
                    localStorage.setItem('member_remember', 'true');
                    localStorage.setItem('member_identifier', identifier);
                }
                
                // Redirect to dashboard
                window.location.href = 'member-dashboard.html';
                
            } else {
                // Login failed
                errorDiv.textContent = 'Member details not found. Please enter correct details as required.';
                errorDiv.style.display = 'block';
                
                // Add warning effect
                document.getElementById('memberLoginForm').classList.add('shake');
                setTimeout(() => {
                    document.getElementById('memberLoginForm').classList.remove('shake');
                }, 500);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'An error occurred. Please try again.';
            errorDiv.style.display = 'block';
            
        } finally {
            // Reset button
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }
    
    async verifyMember(identifier, password, loginType) {
        // In real app, this would check against Google Sheets
        // For now, use sample data
        
        const sampleMembers = [
            {
                id: 1,
                member_number: 'UMB001',
                id_number: '12345678',
                phone: '0728560925',
                username: 'maroa',
                password: 'umburio2025',
                name: 'Gisiri Maroa',
                role: 'Communication Assistant',
                joined_date: '2024-01-15',
                status: 'active',
                loan_balance: 0,
                savings: 15000,
                merry_go_round: true
            },
            {
                id: 2,
                member_number: 'UMB002',
                id_number: '23456789',
                phone: '0712345678',
                username: 'kemunto',
                password: 'umburio2025',
                name: 'Sarah Kemunto',
                role: 'Member',
                joined_date: '2024-02-20',
                status: 'active',
                loan_balance: 5000,
                savings: 8000,
                merry_go_round: true
            },
            {
                id: 3,
                member_number: 'UMB003',
                id_number: '34567890',
                phone: '0733456789',
                username: 'omondi',
                password: 'umburio2025',
                name: 'James Omondi',
                role: 'Treasurer',
                joined_date: '2024-03-10',
                status: 'active',
                loan_balance: 0,
                savings: 20000,
                merry_go_round: true
            }
        ];
        
        const member = sampleMembers.find(m => {
            switch (loginType) {
                case 'member_number':
                    return m.member_number === identifier;
                case 'id_number':
                    return m.id_number === identifier;
                case 'phone':
                    return m.phone === identifier;
                case 'username':
                    return m.username === identifier;
                default:
                    return false;
            }
        });
        
        // Check password
        if (member && member.password === password) {
            return member;
        }
        
        return null;
    }
    
    checkLoginStatus() {
        const isLoggedIn = sessionStorage.getItem('member_logged_in');
        
        if (isLoggedIn === 'true') {
            const memberData = sessionStorage.getItem('member_data');
            if (memberData) {
                this.currentMember = JSON.parse(memberData);
                this.isLoggedIn = true;
                
                // If on login page, redirect to dashboard
                if (window.location.pathname.includes('member-login.html')) {
                    window.location.href = 'member-dashboard.html';
                }
            }
        } else if (localStorage.getItem('member_remember') === 'true') {
            // Auto-fill identifier
            const identifier = localStorage.getItem('member_identifier');
            if (identifier) {
                document.getElementById('memberNumber').value = identifier;
            }
        }
    }
    
    logout() {
        sessionStorage.removeItem('member_logged_in');
        sessionStorage.removeItem('member_data');
        this.currentMember = null;
        this.isLoggedIn = false;
        
        // Redirect to login page
        window.location.href = 'member-login.html';
    }
    
    calculateMerryGoRound() {
        const now = new Date();
        const daysSinceLastMeeting = Math.floor((now - this.lastMeetingDate) / (1000 * 60 * 60 * 24));
        const meetingsSince = Math.floor(daysSinceLastMeeting / this.meetingInterval);
        
        let currentNumber = this.merryGoRoundNumber + meetingsSince;
        
        // Reset at 24
        while (currentNumber > 24) {
            currentNumber -= 24;
        }
        
        return currentNumber;
    }
    
    getNextMeetingDate() {
        const nextMeeting = new Date(this.lastMeetingDate);
        
        while (nextMeeting <= new Date()) {
            nextMeeting.setDate(nextMeeting.getDate() + this.meetingInterval);
        }
        
        return nextMeeting;
    }
    
    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Initialize Member Authentication
let memberAuth;

document.addEventListener('DOMContentLoaded', () => {
    memberAuth = new MemberAuth();
    window.memberAuth = memberAuth;
});
