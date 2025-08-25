// BLOCKBUSTED - Frontend JavaScript Application
// Retro 80s Video Rental Experience

class BlockbustedApp {
    constructor() {
        this.currentUser = null;
        this.movies = [];
        this.categories = [];
        this.userRentals = [];
        this.currentRental = null;
        this.ageVerified = false;
        this.showingAdultContent = false;
        
        this.init();
    }

    init() {
        // Load categories and movies on app start
        this.loadCategories();
        this.loadMovies();
        
        // Set up form event listeners
        this.setupEventListeners();
        
        // Check if user is logged in (simple session storage check)
        const savedUser = localStorage.getItem('blockbusted_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.updateNavigation();
                this.showMovies();
            } catch (e) {
                localStorage.removeItem('blockbusted_user');
            }
        }
    }

    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Register form
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Search functionality
        document.getElementById('movie-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchMovies();
            }
        });

        // Admin feedback form
        document.getElementById('admin-feedback-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitAdminFeedback();
        });
    }

    // Navigation functions
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show selected screen
        document.getElementById(screenId).classList.add('active');
    }

    updateNavigation() {
        const guestNav = document.getElementById('nav-guest');
        const userNav = document.getElementById('nav-user');
        const usernameDisplay = document.getElementById('username-display');
        const adminBtn = document.getElementById('admin-panel-btn');

        if (this.currentUser) {
            guestNav.style.display = 'none';
            userNav.style.display = 'flex';
            usernameDisplay.textContent = `WELCOME, ${this.currentUser.username.toUpperCase()}`;
            
            // Show admin button only for admin users
            if (this.currentUser.isAdmin) {
                adminBtn.style.display = 'inline-block';
            } else {
                adminBtn.style.display = 'none';
            }
        } else {
            guestNav.style.display = 'flex';
            userNav.style.display = 'none';
            adminBtn.style.display = 'none';
        }
    }

    // Authentication functions
    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = data.user;
                localStorage.setItem('blockbusted_user', JSON.stringify(this.currentUser));
                this.updateNavigation();
                this.showMovies();
                this.showMessage('Login successful! Welcome to BLOCKBUSTED!', 'success');
                
                // Clear form
                document.getElementById('login-form').reset();
            } else {
                this.showMessage(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (!username || !email || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Registration successful! Please log in.', 'success');
                this.showLogin();
                
                // Clear form
                document.getElementById('register-form').reset();
            } else {
                this.showMessage(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('blockbusted_user');
        this.updateNavigation();
        this.showScreen('welcome-screen');
        this.showMessage('Logged out successfully', 'success');
    }

    // Movie functions
    async loadCategories() {
        try {
            const response = await fetch('/api/categories');
            const categories = await response.json();
            
            this.categories = categories;
            this.populateCategories();
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    populateCategories() {
        const categoryFilter = document.getElementById('category-filter');
        
        // Clear existing options (except "All Categories")
        while (categoryFilter.children.length > 1) {
            categoryFilter.removeChild(categoryFilter.lastChild);
        }
        
        // Add category options (exclude Adult category from regular filter)
        this.categories.forEach(category => {
            if (category !== 'Adult') {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category.toUpperCase();
                categoryFilter.appendChild(option);
            }
        });
    }

    async loadMovies(category = null, search = null, includeAdult = false) {
        try {
            let url = '/api/movies';
            const params = new URLSearchParams();
            
            if (category && category !== 'all') {
                params.append('category', category);
            }
            
            if (search) {
                params.append('search', search);
            }
            
            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetch(url);
            let movies = await response.json();
            
            // Filter out adult content unless specifically requested and age verified
            if (!includeAdult || !this.ageVerified) {
                movies = movies.filter(movie => movie.category !== 'Adult');
            }
            
            // If showing only adult content
            if (includeAdult && this.showingAdultContent) {
                movies = movies.filter(movie => movie.category === 'Adult');
            }
            
            this.movies = movies;
            this.displayMovies();
        } catch (error) {
            console.error('Error loading movies:', error);
            this.showMessage('Error loading movies', 'error');
        }
    }

    displayMovies() {
        const moviesGrid = document.getElementById('movies-grid');
        
        if (this.movies.length === 0) {
            const message = this.showingAdultContent ? 'NO ADULT MOVIES FOUND' : 'NO MOVIES FOUND';
            moviesGrid.innerHTML = `<div class="loading">${message}</div>`;
            return;
        }
        
        let html = '';
        
        // Add adult section header if showing adult content
        if (this.showingAdultContent && this.movies.some(movie => movie.category === 'Adult')) {
            html += `
                <div class="adult-section-header">
                    <h2>🔞 ADULT SECTION 🔞</h2>
                    <p>MATURE CONTENT - VIEWERS MUST BE 18+</p>
                </div>
            `;
        }
        
        html += this.movies.map(movie => {
            const isAdult = movie.category === 'Adult';
            return `
                <div class="movie-card ${movie.available ? '' : 'unavailable'} ${isAdult ? 'adult' : ''}">
                    <div class="movie-status ${movie.available ? 'available' : 'rented'}">
                        ${movie.available ? 'AVAILABLE' : 'RENTED'}
                    </div>
                    <h3 class="movie-title">${movie.title}</h3>
                    <div class="movie-info">
                        <div class="movie-category">${movie.category}${isAdult ? ' 🔞' : ''}</div>
                        <div class="movie-year">${movie.year}</div>
                        <div class="movie-price">$${movie.price}</div>
                    </div>
                    ${movie.available && this.currentUser ? 
                        `<button class="neon-btn" onclick="app.rentMovie('${movie.id}')">RENT NOW</button>` : 
                        movie.available ? 
                            `<button class="neon-btn" onclick="app.showLogin()">LOGIN TO RENT</button>` :
                            `<button class="neon-btn secondary" disabled>NOT AVAILABLE</button>`
                    }
                </div>
            `;
        }).join('');
        
        moviesGrid.innerHTML = html;
    }

    async rentMovie(movieId) {
        if (!this.currentUser) {
            this.showLogin();
            return;
        }

        // Store the movie ID for the rental process
        this.currentRentalMovieId = movieId;
        
        // Find the movie details
        const movie = this.movies.find(m => m.id === movieId);
        if (!movie) {
            this.showMessage('Movie not found', 'error');
            return;
        }

        // Show rental options modal
        this.showRentalOptionsModal(movie);
    }

    async loadUserRentals() {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`/api/rentals/${this.currentUser.id}`);
            const rentals = await response.json();
            
            this.userRentals = rentals;
            this.displayUserRentals();
            this.displayRentalStats();
        } catch (error) {
            console.error('Error loading rentals:', error);
        }
    }

    displayUserRentals() {
        const rentalsList = document.getElementById('current-rentals-list');
        const currentRentals = this.userRentals.filter(rental => !rental.returned);

        if (currentRentals.length === 0) {
            rentalsList.innerHTML = '<div class="loading">NO CURRENT RENTALS</div>';
            return;
        }

        rentalsList.innerHTML = currentRentals.map(rental => {
            const dueDate = new Date(rental.dueDate);
            const now = new Date();
            const isOverdue = now > dueDate;
            const deliveryInfo = rental.deliveryOption === 'delivery' ? '🚚 Home Delivery' : '🏪 Store Pickup';
            
            return `
                <div class="rental-item">
                    <div class="rental-title">${rental.movieTitle}</div>
                    <div class="rental-info">
                        <div class="rental-dates">
                            Rented: ${new Date(rental.rentDate).toLocaleDateString()}
                        </div>
                        <div class="rental-delivery-type">
                            ${deliveryInfo}
                        </div>
                    </div>
                    <div class="rental-due ${isOverdue ? 'overdue' : ''}">
                        Due: ${dueDate.toLocaleDateString()} ${isOverdue ? '(OVERDUE!)' : ''}
                    </div>
                    <button class="neon-btn" onclick="app.showReturnModal('${rental.id}', '${rental.movieTitle}')">
                        RETURN MOVIE
                    </button>
                </div>
            `;
        }).join('');
    }

    displayRentalStats() {
        const statsContainer = document.getElementById('rental-stats');
        const stats = this.currentUser.feedback;

        statsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${stats.totalRentals}</div>
                <div class="stat-label">Total Rentals</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.overdueReturns}</div>
                <div class="stat-label">Overdue Returns</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.notRewound}</div>
                <div class="stat-label">Not Rewound</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.lateReturns}</div>
                <div class="stat-label">Late Returns</div>
            </div>
        `;
    }

    async returnMovie(rentalId, rewound) {
        try {
            const response = await fetch('/api/return', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    rentalId: rentalId,
                    rewound: rewound
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Update user feedback
                this.currentUser.feedback = data.feedback;
                localStorage.setItem('blockbusted_user', JSON.stringify(this.currentUser));
                
                this.showMessage('Movie returned successfully!', 'success');
                this.loadUserRentals();
                this.loadMovies(); // Refresh movies list
            } else {
                this.showMessage(data.error || 'Return failed', 'error');
            }
        } catch (error) {
            console.error('Return error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    // Search and filter functions
    searchMovies() {
        const searchTerm = document.getElementById('movie-search').value;
        const category = document.getElementById('category-filter').value;
        
        this.loadMovies(category, searchTerm, this.showingAdultContent);
    }

    filterMovies() {
        const category = document.getElementById('category-filter').value;
        const searchTerm = document.getElementById('movie-search').value;
        
        this.loadMovies(category, searchTerm, this.showingAdultContent);
    }

    // Modal functions
    showRentalOptionsModal(movie) {
        const modal = document.getElementById('rental-options-modal');
        const movieInfo = document.getElementById('rental-movie-info');
        
        movieInfo.innerHTML = `
            <div class="rental-movie-details">
                <h4>${movie.title}</h4>
                <p>Category: ${movie.category} | Year: ${movie.year} | Price: $${movie.price}</p>
            </div>
        `;
        
        // Set up delivery option change listener
        const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
        const addressSection = document.getElementById('delivery-address-section');
        
        deliveryRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'delivery') {
                    addressSection.style.display = 'block';
                    document.getElementById('delivery-address').required = true;
                } else {
                    addressSection.style.display = 'none';
                    document.getElementById('delivery-address').required = false;
                    document.getElementById('delivery-address').value = '';
                }
            });
        });
        
        // Reset form
        document.querySelector('input[value="pickup"]').checked = true;
        addressSection.style.display = 'none';
        document.getElementById('delivery-address').value = '';
        
        modal.style.display = 'block';
    }

    showRentalModal(rental) {
        const modal = document.getElementById('rental-modal');
        const message = document.getElementById('rental-message');
        
        const dueDate = new Date(rental.dueDate).toLocaleDateString();
        let messageText = `Successfully rented "${rental.movieTitle}"! Please return by ${dueDate}.`;
        
        if (rental.deliveryOption === 'delivery') {
            messageText += ' Your movie will be delivered within 24 hours.';
        } else {
            messageText += ' Please pick up your movie at our store.';
        }
        
        message.textContent = messageText;
        modal.style.display = 'block';
    }

    showReturnModal(rentalId, movieTitle) {
        this.currentRental = rentalId;
        const modal = document.getElementById('return-modal');
        const message = document.getElementById('return-message');
        
        message.textContent = `Return "${movieTitle}"?`;
        
        modal.style.display = 'block';
    }

    async confirmRental() {
        const deliveryOption = document.querySelector('input[name="delivery"]:checked').value;
        const deliveryAddress = document.getElementById('delivery-address').value;
        
        // Validate delivery address if delivery is selected
        if (deliveryOption === 'delivery' && !deliveryAddress.trim()) {
            this.showMessage('Please enter a delivery address', 'error');
            return;
        }
        
        try {
            const requestBody = {
                userId: this.currentUser.id,
                movieId: this.currentRentalMovieId,
                deliveryOption: deliveryOption
            };
            
            if (deliveryOption === 'delivery') {
                requestBody.deliveryAddress = deliveryAddress.trim();
            }
            
            const response = await fetch('/api/rent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (response.ok) {
                this.closeRentalOptionsModal();
                this.showRentalModal(data.rental);
                this.loadMovies(); // Refresh movies list
            } else {
                this.showMessage(data.error || 'Rental failed', 'error');
            }
        } catch (error) {
            console.error('Rental error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    closeRentalOptionsModal() {
        document.getElementById('rental-options-modal').style.display = 'none';
        this.currentRentalMovieId = null;
    }

    closeModal() {
        document.getElementById('rental-modal').style.display = 'none';
    }

    closeReturnModal() {
        document.getElementById('return-modal').style.display = 'none';
        this.currentRental = null;
    }

    confirmReturn() {
        if (this.currentRental) {
            const rewound = document.getElementById('rewound-checkbox').checked;
            this.returnMovie(this.currentRental, rewound);
            this.closeReturnModal();
        }
    }

    // Utility functions
    showMessage(message, type = 'info') {
        // Simple alert for now - could be enhanced with a custom notification system
        const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        alert(`${icon} ${message}`);
    }

    // Screen navigation functions (called from HTML)
    showWelcome() {
        this.showScreen('welcome-screen');
    }

    showLogin() {
        this.showScreen('login-screen');
    }

    showRegister() {
        this.showScreen('register-screen');
    }

    showMovies() {
        this.showingAdultContent = false;
        this.showScreen('movies-screen');
        this.loadMovies();
        
        // Reset page title
        const header = document.querySelector('.movies-header h2');
        if (header) {
            header.textContent = 'MOVIE CATALOG';
            header.style.color = '';
        }
    }

    showProfile() {
        if (!this.currentUser) {
            this.showLogin();
            return;
        }
        
        this.showScreen('profile-screen');
        this.loadUserRentals();
    }

    // Adult section functions
    showAdultSection() {
        if (!this.ageVerified) {
            this.showAgeVerificationModal();
        } else {
            this.enterAdultSection();
        }
    }

    showAgeVerificationModal() {
        const modal = document.getElementById('age-verification-modal');
        modal.style.display = 'block';
        
        // Clear previous input
        document.getElementById('birth-year').value = '';
    }

    verifyAge() {
        const birthYear = parseInt(document.getElementById('birth-year').value);
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;

        if (!birthYear || birthYear < 1900 || birthYear > currentYear) {
            this.showMessage('Please enter a valid birth year', 'error');
            return;
        }

        if (age < 18) {
            this.showMessage('You must be 18 or older to access this section', 'error');
            this.closeAgeModal();
            return;
        }

        // Age verified
        this.ageVerified = true;
        this.closeAgeModal();
        this.enterAdultSection();
        this.showMessage('Age verified. Welcome to the adult section.', 'success');
    }

    enterAdultSection() {
        this.showingAdultContent = true;
        this.showScreen('movies-screen');
        this.loadMovies(null, null, true);
        
        // Update page title
        const header = document.querySelector('.movies-header h2');
        if (header) {
            header.textContent = '🔞 ADULT MOVIE CATALOG 🔞';
            header.style.color = '#ff1744';
        }
    }

    closeAgeModal() {
        document.getElementById('age-verification-modal').style.display = 'none';
    }

    // Admin functions
    showAdminPanel() {
        if (!this.currentUser || !this.currentUser.isAdmin) {
            this.showMessage('Access denied. Admin privileges required.', 'error');
            return;
        }
        
        this.showScreen('admin-screen');
        this.loadAdminUsers();
        this.loadAnalytics();
    }

    showAdminTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.admin-tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab content
        document.getElementById(`admin-${tabName}-tab`).classList.add('active');
        
        // Add active class to clicked tab
        event.target.classList.add('active');
        
        if (tabName === 'users') {
            this.loadAdminUsers();
        } else if (tabName === 'analytics') {
            this.loadAnalytics();
        }
    }

    async loadAdminUsers() {
        try {
            const response = await fetch('/api/admin/users');
            const users = await response.json();
            
            this.displayAdminUsers(users);
        } catch (error) {
            console.error('Error loading admin users:', error);
            this.showMessage('Failed to load users', 'error');
        }
    }

    displayAdminUsers(users) {
        const usersContainer = document.getElementById('admin-users-list');
        
        if (users.length === 0) {
            usersContainer.innerHTML = '<div class="loading">NO USERS FOUND</div>';
            return;
        }
        
        usersContainer.innerHTML = users.map(user => {
            const isSuspended = user.suspended || false;
            const registrationDate = new Date(user.registrationDate).toLocaleDateString();
            
            return `
                <div class="admin-user-card ${isSuspended ? 'suspended' : ''}">
                    <div class="admin-user-header">
                        <div class="admin-username">${user.username}</div>
                        <div class="user-status ${isSuspended ? 'suspended' : 'active'}">
                            ${isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                        </div>
                    </div>
                    
                    <div class="admin-user-info">
                        <div><strong>Email:</strong> ${user.email}</div>
                        <div><strong>Registered:</strong> ${registrationDate}</div>
                        <div><strong>User ID:</strong> ${user.id}</div>
                    </div>
                    
                    <div class="admin-user-stats">
                        <div class="admin-stat">
                            <div class="admin-stat-value">${user.feedback.totalRentals}</div>
                            <div>Total Rentals</div>
                        </div>
                        <div class="admin-stat">
                            <div class="admin-stat-value">${user.feedback.overdueReturns}</div>
                            <div>Overdue</div>
                        </div>
                        <div class="admin-stat">
                            <div class="admin-stat-value">${user.feedback.notRewound}</div>
                            <div>Not Rewound</div>
                        </div>
                        <div class="admin-stat">
                            <div class="admin-stat-value">${user.feedback.warnings || 0}</div>
                            <div>Warnings</div>
                        </div>
                    </div>
                    
                    ${user.adminFeedback && user.adminFeedback.length > 0 ? `
                        <div class="admin-feedback-section">
                            <strong>Admin Feedback:</strong>
                            ${user.adminFeedback.slice(-3).map(feedback => `
                                <div class="admin-feedback-item">
                                    <div class="admin-feedback-type">${feedback.type}</div>
                                    <div>${feedback.notes}</div>
                                    <div class="admin-feedback-date">${new Date(feedback.timestamp).toLocaleDateString()}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="admin-user-actions">
                        <button class="admin-action-btn" onclick="app.showAdminFeedbackModal('${user.id}', '${user.username}')">
                            ADD FEEDBACK
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadAnalytics() {
        try {
            const [usersResponse, rentalsResponse] = await Promise.all([
                fetch('/api/admin/users'),
                fetch('/api/rentals/all') // We need to add this endpoint
            ]);
            
            const users = await usersResponse.json();
            // For now, calculate analytics from user data
            
            const totalUsers = users.length;
            const totalRentals = users.reduce((sum, user) => sum + user.feedback.totalRentals, 0);
            const suspendedUsers = users.filter(user => user.suspended).length;
            const overdueItems = users.reduce((sum, user) => sum + user.feedback.overdueReturns, 0);
            
            document.getElementById('total-users').textContent = totalUsers;
            document.getElementById('total-rentals').textContent = totalRentals;
            document.getElementById('overdue-items').textContent = overdueItems;
            document.getElementById('suspended-users').textContent = suspendedUsers;
            
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    showAdminFeedbackModal(userId, username) {
        this.currentAdminFeedbackUserId = userId;
        
        const modal = document.getElementById('admin-feedback-modal');
        const userInfo = document.getElementById('admin-feedback-user-info');
        
        userInfo.innerHTML = `
            <h4>User: ${username}</h4>
            <p>ID: ${userId}</p>
        `;
        
        // Clear form
        document.getElementById('admin-feedback-form').reset();
        
        modal.style.display = 'block';
    }

    async submitAdminFeedback() {
        const feedbackType = document.getElementById('feedback-type').value;
        const notes = document.getElementById('feedback-notes').value;
        
        if (!feedbackType) {
            this.showMessage('Please select a feedback type', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/admin/user-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.currentAdminFeedbackUserId,
                    feedbackType: feedbackType,
                    notes: notes
                }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showMessage('Feedback submitted successfully', 'success');
                this.closeAdminFeedbackModal();
                this.loadAdminUsers(); // Refresh user list
                this.loadAnalytics(); // Refresh analytics
            } else {
                this.showMessage(data.error || 'Failed to submit feedback', 'error');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    closeAdminFeedbackModal() {
        document.getElementById('admin-feedback-modal').style.display = 'none';
        this.currentAdminFeedbackUserId = null;
    }
}

// Global app instance
const app = new BlockbustedApp();

// Global functions for HTML onclick handlers
function showLogin() {
    app.showLogin();
}

function showRegister() {
    app.showRegister();
}

function showMovies() {
    app.showMovies();
}

function showProfile() {
    app.showProfile();
}

function logout() {
    app.logout();
}

function searchMovies() {
    app.searchMovies();
}

function filterMovies() {
    app.filterMovies();
}

function closeModal() {
    app.closeModal();
}

function closeReturnModal() {
    app.closeReturnModal();
}

function confirmReturn() {
    app.confirmReturn();
}

function confirmRental() {
    app.confirmRental();
}

function closeRentalOptionsModal() {
    app.closeRentalOptionsModal();
}

// Adult section functions
function showAdultSection() {
    app.showAdultSection();
}

function verifyAge() {
    app.verifyAge();
}

function closeAgeModal() {
    app.closeAgeModal();
}

// Admin functions
function showAdminPanel() {
    app.showAdminPanel();
}

function showAdminTab(tabName) {
    app.showAdminTab(tabName);
}

function closeAdminFeedbackModal() {
    app.closeAdminFeedbackModal();
}

// Close modals when clicking outside
window.onclick = function(event) {
    const rentalOptionsModal = document.getElementById('rental-options-modal');
    const rentalModal = document.getElementById('rental-modal');
    const returnModal = document.getElementById('return-modal');
    const ageModal = document.getElementById('age-verification-modal');
    const adminFeedbackModal = document.getElementById('admin-feedback-modal');
    
    if (event.target === rentalOptionsModal) {
        rentalOptionsModal.style.display = 'none';
        app.currentRentalMovieId = null;
    }
    
    if (event.target === rentalModal) {
        rentalModal.style.display = 'none';
    }
    
    if (event.target === returnModal) {
        returnModal.style.display = 'none';
    }
    
    if (event.target === ageModal) {
        ageModal.style.display = 'none';
    }
    
    if (event.target === adminFeedbackModal) {
        adminFeedbackModal.style.display = 'none';
    }
}

// Add some fun console messages
console.log(`
    ██████╗ ██╗      ██████╗  ██████╗██╗  ██╗██████╗ ██╗   ██╗███████╗████████╗███████╗██████╗ 
    ██╔══██╗██║     ██╔═══██╗██╔════╝██║ ██╔╝██╔══██╗██║   ██║██╔════╝╚══██╔══╝██╔════╝██╔══██╗
    ██████╔╝██║     ██║   ██║██║     █████╔╝ ██████╔╝██║   ██║███████╗   ██║   █████╗  ██║  ██║
    ██╔══██╗██║     ██║   ██║██║     ██╔═██╗ ██╔══██╗██║   ██║╚════██║   ██║   ██╔══╝  ██║  ██║
    ██████╔╝███████╗╚██████╔╝╚██████╗██║  ██╗██████╔╝╚██████╔╝███████║   ██║   ███████╗██████╔╝
    ╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝   ╚═╝   ╚══════╝╚═════╝ 
    
    🎬 Welcome to BLOCKBUSTED - The Ultimate 80s Video Rental Experience!
    🎮 Ready to take you back to the golden age of video rentals!
    📼 Rewind your way back to 1985!
`);

console.log('📼 Enjoy the nostalgic video rental experience! Remember to rewind your tapes!');
