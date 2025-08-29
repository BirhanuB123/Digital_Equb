//  Ekub Frontend Application
class DigitalEkub {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.languageManager = new LanguageManager();
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
        this.loadDashboardData();
    }

    bindEvents() {
        // Navigation buttons
        document.getElementById('loginBtn').addEventListener('click', () => this.showModal('loginModal'));
        document.getElementById('registerBtn').addEventListener('click', () => this.showModal('registerModal'));
        document.getElementById('getStartedBtn').addEventListener('click', () => this.showModal('registerModal'));
        document.getElementById('learnMoreBtn').addEventListener('click', () => this.scrollToSection('how-it-works'));
        
        // Language switching
        document.getElementById('languageBtn').addEventListener('click', () => this.languageManager.toggleLanguage());

        // Modal close buttons
        document.getElementById('closeLoginModal').addEventListener('click', () => this.hideModal('loginModal'));
        document.getElementById('closeRegisterModal').addEventListener('click', () => this.hideModal('registerModal'));
        document.getElementById('closeDashboardModal').addEventListener('click', () => this.hideModal('dashboardModal'));

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));

        // Modal switching
        document.getElementById('switchToRegister').addEventListener('click', () => this.switchModal('loginModal', 'registerModal'));
        document.getElementById('switchToLogin').addEventListener('click', () => this.switchModal('registerModal', 'loginModal'));

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('hidden');
        modal.classList.add('modal-enter');
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('hidden');
        modal.classList.remove('modal-enter');
    }

    switchModal(fromModalId, toModalId) {
        this.hideModal(fromModalId);
        setTimeout(() => this.showModal(toModalId), 300);
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        
        if (type === 'error') {
            toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 z-50';
        } else {
            toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 z-50';
        }
        
        toast.classList.add('toast-show');
        
        setTimeout(() => {
            toast.classList.remove('toast-show');
            toast.classList.add('toast-hide');
        }, 3000);
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (response.ok) {
                this.showToast('Registration successful! Please login.');
                this.hideModal('registerModal');
                this.showModal('loginModal');
                e.target.reset();
            } else {
                this.showToast(result.error || 'Registration failed', 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (response.ok) {
                this.currentUser = result.member;
                this.isAuthenticated = true;
                this.showToast('Login successful!');
                this.hideModal('loginModal');
                this.updateUIAfterLogin();
                this.loadDashboardData();
            } else {
                this.showToast(result.error || 'Login failed', 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        }
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/me');
            if (response.ok) {
                const result = await response.json();
                this.currentUser = result.member;
                this.isAuthenticated = true;
                this.updateUIAfterLogin();
            }
        } catch (error) {
            // User not authenticated
        }
    }

    updateUIAfterLogin() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        
        loginBtn.innerHTML = '<i class="fas fa-user mr-2"></i><span data-translate="nav_dashboard">Dashboard</span>';
        loginBtn.className = 'bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors';
        loginBtn.addEventListener('click', () => this.showDashboard());
        
        registerBtn.innerHTML = '<i class="fas fa-sign-out-alt mr-2"></i><span data-translate="nav_logout">Logout</span>';
        registerBtn.className = 'bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors';
        registerBtn.addEventListener('click', () => this.handleLogout());
    }

    async handleLogout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            this.currentUser = null;
            this.isAuthenticated = false;
            this.showToast('Logout successful');
            this.resetUI();
        } catch (error) {
            this.showToast('Logout failed', 'error');
        }
    }

    resetUI() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i><span data-translate="nav_login">Login</span>';
        loginBtn.className = 'bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors';
        loginBtn.addEventListener('click', () => this.showModal('loginModal'));
        
        registerBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i><span data-translate="nav_register">Register</span>';
        registerBtn.className = 'bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors';
        registerBtn.addEventListener('click', () => this.showModal('registerModal'));
    }

    async showDashboard() {
        this.showModal('dashboardModal');
        await this.loadDashboardData();
    }

    async loadDashboardData() {
        if (!this.isAuthenticated) return;

        try {
            const [dashboardResponse, membersResponse, paymentsResponse, roundsResponse, luckyResponse] = await Promise.all([
                fetch('/api/dashboard'),
                fetch('/api/members'),
                fetch('/api/payments'),
                fetch('/api/rounds/current'),
                fetch('/api/lucky-selections')
            ]);

            const dashboardData = await dashboardResponse.json();
            const membersData = await membersResponse.json();
            const paymentsData = await paymentsResponse.json();
            const roundsData = await roundsResponse.json();
            const luckyData = await luckyResponse.json();

            this.renderDashboard(dashboardData, membersData, paymentsData, roundsData, luckyData);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    renderDashboard(dashboard, members, payments, rounds, lucky) {
        const dashboardContent = document.getElementById('dashboardContent');
        
        dashboardContent.innerHTML = `
            <div class="grid md:grid-cols-4 gap-6 mb-8">
                <div class="dashboard-card">
                    <div class="dashboard-stat">
                        <div class="dashboard-stat-number">${dashboard.totalMembers}</div>
                        <div class="dashboard-stat-label">Total Members</div>
                    </div>
                </div>
                <div class="dashboard-card">
                    <div class="dashboard-stat">
                        <div class="dashboard-stat-number">${dashboard.monthlyTotal.toLocaleString()} ብር</div>
                        <div class="dashboard-stat-label">Monthly Collection</div>
                    </div>
                </div>
                <div class="dashboard-card">
                    <div class="dashboard-stat">
                        <div class="dashboard-stat-number">${dashboard.totalSelections}</div>
                        <div class="dashboard-stat-label">Total Selections</div>
                    </div>
                </div>
                <div class="dashboard-card">
                    <div class="dashboard-stat">
                        <div class="dashboard-stat-number">${dashboard.currentMonth}</div>
                        <div class="dashboard-stat-label">Current Month</div>
                    </div>
                </div>
            </div>

            <div class="grid md:grid-cols-2 gap-6 mb-8">
                <div class="dashboard-card">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Current Round Status</h3>
                    ${this.renderRoundStatus(rounds)}
                </div>
                <div class="dashboard-card">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div class="space-y-3">
                        <button onclick="app.makePayment()" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                            <i class="fas fa-credit-card mr-2"></i>Make Payment
                        </button>
                        <button onclick="app.selectLuckyMember()" class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                            <i class="fas fa-random mr-2"></i>Select Lucky Member
                        </button>
                    </div>
                </div>
            </div>

            <div class="grid md:grid-cols-2 gap-6">
                <div class="dashboard-card">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Recent Payments</h3>
                    ${this.renderPaymentsTable(payments.payments.slice(0, 5))}
                </div>
                <div class="dashboard-card">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Lucky Selections History</h3>
                    ${this.renderLuckySelectionsTable(lucky.selections.slice(0, 5))}
                </div>
            </div>

            <div class="dashboard-card mt-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">All Members</h3>
                ${this.renderMembersTable(members.members)}
            </div>
        `;
    }

    renderRoundStatus(rounds) {
        if (rounds.currentRound === 0) {
            return `
                <div class="text-center py-4">
                    <div class="text-2xl font-bold text-gray-400 mb-2">Between Rounds</div>
                    <p class="text-gray-600">Next round starts: ${rounds.nextRound.start}</p>
                </div>
            `;
        }

        return `
            <div class="text-center py-4">
                <div class="text-2xl font-bold text-blue-600 mb-2">Round ${rounds.currentRound}</div>
                <p class="text-gray-600 mb-2">${rounds.startDate} - ${rounds.endDate}</p>
                <div class="text-lg font-semibold text-green-600">
                    Collected: ${rounds.totalCollected.toLocaleString()} ብር
                </div>
                <div class="text-sm text-gray-500">
                    Lucky member will receive: ${rounds.estimatedLuckyAmount.toLocaleString()} ብር
                </div>
            </div>
        `;
    }

    renderPaymentsTable(payments) {
        if (!payments || payments.length === 0) {
            return '<p class="text-gray-500 text-center py-4">No payments found</p>';
        }

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Member</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${payments.map(payment => `
                        <tr>
                            <td>${payment.member_name}</td>
                            <td>${payment.amount.toLocaleString()} ብር</td>
                            <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
                            <td><span class="status-badge status-${payment.status}">${payment.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderLuckySelectionsTable(selections) {
        if (!selections || selections.length === 0) {
            return '<p class="text-gray-500 text-center py-4">No lucky selections found</p>';
        }

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Member</th>
                        <th>Amount</th>
                        <th>Round</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${selections.map(selection => `
                        <tr>
                            <td>${selection.member_name}</td>
                            <td>${selection.amount_received.toLocaleString()} ብር</td>
                            <td>${selection.round_number}</td>
                            <td>${new Date(selection.selection_date).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderMembersTable(members) {
        if (!members || members.length === 0) {
            return '<p class="text-gray-500 text-center py-4">No members found</p>';
        }

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Joined</th>
                        <th>Total Paid</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${members.map(member => `
                        <tr>
                            <td>${member.name}</td>
                            <td>${member.email}</td>
                            <td>${member.phone || '-'}</td>
                            <td>${new Date(member.joined_date).toLocaleDateString()}</td>
                            <td>${member.total_paid.toLocaleString()} ብር</td>
                            <td><span class="status-badge status-${member.is_active ? 'active' : 'pending'}">${member.is_active ? 'Active' : 'Inactive'}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async makePayment() {
        const amount = prompt('Enter payment amount (in Birr):', '5000');
        if (!amount || isNaN(amount)) return;

        const month = prompt('Enter month (e.g., January):', new Date().toLocaleDateString('en-US', { month: 'long' }));
        if (!month) return;

        const year = prompt('Enter year:', new Date().getFullYear());
        if (!year || isNaN(year)) return;

        try {
            const response = await fetch('/api/payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: parseFloat(amount), month, year: parseInt(year) })
            });

            const result = await response.json();

            if (response.ok) {
                this.showToast('Payment successful!');
                this.loadDashboardData();
            } else {
                this.showToast(result.error || 'Payment failed', 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        }
    }

    async selectLuckyMember() {
        if (!confirm('Are you sure you want to select a lucky member for the current round?')) {
            return;
        }

        try {
            const response = await fetch('/api/rounds/select-lucky', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                this.showToast(`Lucky member selected: ${result.luckyMember.name}! They will receive ${result.amount.toLocaleString()} ብር`);
                this.loadDashboardData();
            } else {
                this.showToast(result.error || 'Selection failed', 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DigitalEkub();
});

// Add smooth scrolling for all internal links
document.addEventListener('DOMContentLoaded', () => {
    // Add fade-in animation to sections when they come into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
});
