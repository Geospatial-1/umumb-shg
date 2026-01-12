// Payment Processing System
class PaymentManager {
    constructor() {
        this.paymentMethods = {
            mpesa: {
                name: 'M-Pesa',
                icon: 'fas fa-mobile-alt',
                description: 'Mobile money payment via M-Pesa',
                currency: 'KES'
            },
            paypal: {
                name: 'PayPal',
                icon: 'fab fa-paypal',
                description: 'International payments via PayPal',
                currency: 'USD'
            },
            bank: {
                name: 'Bank Transfer',
                icon: 'fas fa-university',
                description: 'Direct bank deposit',
                currency: 'KES'
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupPaymentButtons();
    }
    
    setupPaymentButtons() {
        // Payment method selection
        document.querySelectorAll('.payment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const method = e.target.closest('button').dataset.method;
                this.handlePaymentMethod(method);
            });
        });
        
        // Payment form submission
        document.getElementById('paymentForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processPayment();
        });
    }
    
    handlePaymentMethod(method) {
        switch (method) {
            case 'mpesa':
                this.showMpesaPayment();
                break;
            case 'paypal':
                this.showPaypalPayment();
                break;
            case 'bank':
                this.showBankDetails();
                break;
        }
    }
    
    showMpesaPayment() {
        const modal = document.getElementById('paymentModal');
        const title = document.getElementById('paymentTitle');
        const form = document.getElementById('paymentForm');
        
        title.textContent = 'M-Pesa Payment';
        
        // Show M-Pesa specific fields
        document.getElementById('mpesaFields').style.display = 'block';
        
        // Update form for M-Pesa
        form.dataset.method = 'mpesa';
        
        modal.style.display = 'flex';
    }
    
    showPaypalPayment() {
        const amount = document.getElementById('paymentAmount')?.value || 500;
        const email = authManager?.getProfile()?.email || '';
        
        // In a real app, this would redirect to PayPal
        // For demo, show instructions
        alert(`PayPal Payment\n\nAmount: $${(amount / 100).toFixed(2)} USD\n\nIn a real implementation, this would redirect to PayPal checkout.\n\nYour payment email: ${email}`);
    }
    
    showBankDetails() {
        const bankDetails = `
            Umburio Self-Help Group - Bank Transfer Details:
            
            Bank Name: Kenya Commercial Bank (KCB)
            Account Name: Umburio Self-Help Group
            Account Number: 1234567890
            Branch: Kehancha
            Swift Code: KCBLKENX
            
            After making payment:
            1. Email receipt to payments@umburio.org
            2. Include your name and email
            3. Allow 24-48 hours for processing
            
            For inquiries: finance@umburio.org
        `;
        
        alert(bankDetails);
    }
    
    async processPayment() {
        const amount = document.getElementById('paymentAmount').value;
        const method = document.getElementById('paymentForm').dataset.method || 'mpesa';
        const mpesaNumber = document.getElementById('mpesaNumber')?.value;
        const email = document.getElementById('paymentEmail')?.value || 
                     authManager?.getProfile()?.email;
        
        if (!amount || amount < 100) {
            alert('Minimum payment amount is KSh 100');
            return;
        }
        
        if (method === 'mpesa' && (!mpesaNumber || mpesaNumber.length !== 10)) {
            alert('Please enter a valid M-Pesa number (10 digits)');
            return;
        }
        
        // Show processing
        const submitBtn = document.querySelector('.payment-submit');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;
        
        try {
            // Process payment through Google Apps Script
            const paymentData = {
                user_id: authManager?.getUser()?.id,
                amount: parseInt(amount),
                method: method,
                mpesa_number: mpesaNumber,
                email: email,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };
            
            // Send to Google Sheets
            const response = await this.sendPaymentToGoogleSheets(paymentData);
            
            // Simulate payment processing
            await this.simulatePaymentProcessing(paymentData);
            
            // Update user balance
            await this.updateUserBalance(parseInt(amount));
            
            // Show success
            this.showPaymentSuccess(paymentData);
            
            // Close modal
            document.getElementById('paymentModal').style.display = 'none';
            
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed. Please try again.');
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async sendPaymentToGoogleSheets(paymentData) {
        try {
            // In a real app, this would be your Google Apps Script endpoint
            await fetch('YOUR_GOOGLE_SCRIPT_URL/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
            });
        } catch (error) {
            console.error('Error saving payment:', error);
            // Store offline for later sync
            this.storeOfflinePayment(paymentData);
        }
    }
    
    async simulatePaymentProcessing(paymentData) {
        // Simulate payment processing delay
        return new Promise(resolve => {
            setTimeout(() => {
                // In a real app, this would check with payment gateway
                paymentData.status = 'completed';
                paymentData.transaction_id = 'TXN_' + Date.now();
                paymentData.processed_at = new Date().toISOString();
                resolve(paymentData);
            }, 2000);
        });
    }
    
    async updateUserBalance(amount) {
        if (!authManager?.getUser()) return;
        
        try {
            // Update in Supabase
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('balance')
                .eq('id', authManager.getUser().id)
                .single();
            
            if (error) throw error;
            
            const newBalance = (profile.balance || 0) + amount;
            
            await supabase
                .from('profiles')
                .update({ balance: newBalance })
                .eq('id', authManager.getUser().id);
            
            // Update local profile
            if (authManager.userProfile) {
                authManager.userProfile.balance = newBalance;
                document.getElementById('userBalance').textContent = newBalance;
            }
            
        } catch (error) {
            console.error('Error updating balance:', error);
        }
    }
    
    showPaymentSuccess(paymentData) {
        const successMessage = `
            Payment Successful! ✅
            
            Transaction Details:
            Amount: KSh ${paymentData.amount.toLocaleString()}
            Method: ${this.paymentMethods[paymentData.method]?.name || paymentData.method}
            Transaction ID: ${paymentData.transaction_id}
            Date: ${new Date(paymentData.processed_at).toLocaleString()}
            
            Your account balance has been updated.
            
            A receipt has been sent to ${paymentData.email}
        `;
        
        alert(successMessage);
        
        // Show notification
        this.showNotification('Payment successful! Balance updated.');
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
    
    storeOfflinePayment(paymentData) {
        const offlinePayments = JSON.parse(localStorage.getItem('offlinePayments') || '[]');
        offlinePayments.push(paymentData);
        localStorage.setItem('offlinePayments', JSON.stringify(offlinePayments));
    }
    
    async syncOfflinePayments() {
        const offlinePayments = JSON.parse(localStorage.getItem('offlinePayments') || '[]');
        
        if (offlinePayments.length === 0) return;
        
        for (const payment of offlinePayments) {
            try {
                await this.sendPaymentToGoogleSheets(payment);
                
                // Remove successfully synced payment
                const updatedPayments = offlinePayments.filter(p => 
                    p.timestamp !== payment.timestamp
                );
                localStorage.setItem('offlinePayments', JSON.stringify(updatedPayments));
                
            } catch (error) {
                console.error('Failed to sync payment:', error);
            }
        }
    }
}

// Initialize Payment Manager
let paymentManager;

document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to initialize
    const checkAuth = setInterval(() => {
        if (window.authManager && authManager.isLoggedIn()) {
            clearInterval(checkAuth);
            paymentManager = new PaymentManager();
            window.paymentManager = paymentManager;
        }
    }, 100);
});
