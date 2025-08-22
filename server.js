const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// User Authentication and Data Protection
class UserCrypto {
    constructor() {
        // Encryption configuration
        this.secretKey = "BLOCKBUSTER1985";
        this.shift = 13;
    }

    // Text encoding for data storage
    encrypt(text) {
        if (!text) return '';
        let result = '';
        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            if (char.match(/[a-z]/i)) {
                const code = text.charCodeAt(i);
                const isUpperCase = (code >= 65 && code <= 90);
                const base = isUpperCase ? 65 : 97;
                result += String.fromCharCode(((code - base + this.shift) % 26) + base);
            } else {
                result += char;
            }
        }
        // Add encoding prefix
        return `SALT1985_${result}`;
    }

    // Text decoding for data retrieval
    decrypt(encryptedText) {
        if (!encryptedText || !encryptedText.startsWith('SALT1985_')) return '';
        const text = encryptedText.replace('SALT1985_', '');
        let result = '';
        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            if (char.match(/[a-z]/i)) {
                const code = text.charCodeAt(i);
                const isUpperCase = (code >= 65 && code <= 90);
                const base = isUpperCase ? 65 : 97;
                result += String.fromCharCode(((code - base - this.shift + 26) % 26) + base);
            } else {
                result += char;
            }
        }
        return result;
    }

    // Password encoding
    hashPassword(password) {
        return this.encrypt(password + this.secretKey);
    }

    // Password verification
    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }
}

const crypto = new UserCrypto();

// Data file paths
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const MOVIES_FILE = path.join(__dirname, 'data', 'movies.json');
const RENTALS_FILE = path.join(__dirname, 'data', 'rentals.json');

// Initialize data files
function initializeDataFiles() {
    if (!fs.existsSync(path.dirname(USERS_FILE))) {
        fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
    }

    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }

    if (!fs.existsSync(MOVIES_FILE)) {
        const initialMovies = [
            {
                id: '1',
                title: 'Back to the Future',
                category: 'Sci-Fi',
                year: 1985,
                available: true,
                price: 2.99
            },
            {
                id: '2',
                title: 'The Breakfast Club',
                category: 'Drama',
                year: 1985,
                available: true,
                price: 2.99
            },
            {
                id: '3',
                title: 'Ghostbusters',
                category: 'Comedy',
                year: 1984,
                available: true,
                price: 2.99
            },
            {
                id: '4',
                title: 'Ferris Bueller\'s Day Off',
                category: 'Comedy',
                year: 1986,
                available: false,
                price: 2.99
            },
            {
                id: '5',
                title: 'The Goonies',
                category: 'Adventure',
                year: 1985,
                available: true,
                price: 2.99
            }
        ];
        fs.writeFileSync(MOVIES_FILE, JSON.stringify(initialMovies, null, 2));
    }

    if (!fs.existsSync(RENTALS_FILE)) {
        fs.writeFileSync(RENTALS_FILE, JSON.stringify([]));
    }
}

// Helper functions
function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading file ${String(filePath).replace(/\n|\r/g, '')}:`, error);
        return [];
    }
}

function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing file ${String(filePath).replace(/\n|\r/g, '')}:`, error);
        return false;
    }
}

// API Routes

// User Registration
app.post('/api/register', (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const users = readJsonFile(USERS_FILE);
    
    // Check if user already exists
    if (users.find(u => u.username === username || u.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user with encoded data
    const newUser = {
        id: uuidv4(),
        username,
        email: crypto.encrypt(email), // Encoding sensitive data for storage
        password: crypto.hashPassword(password),
        registrationDate: new Date().toISOString(),
        rentalHistory: [],
        feedback: {
            overdueReturns: 0,
            notRewound: 0,
            lateReturns: 0,
            totalRentals: 0
        }
    };

    users.push(newUser);
    
    if (writeJsonFile(USERS_FILE, users)) {
        res.status(201).json({ 
            message: 'User registered successfully',
            userId: newUser.id,
            username: newUser.username
        });
    } else {
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// User Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check for admin credentials
    if (username === 'admin' && password === 'admin') {
        return res.json({
            message: 'Admin login successful',
            user: {
                id: 'admin',
                username: 'admin',
                email: 'admin@blockbusted.com',
                isAdmin: true,
                feedback: { totalRentals: 0, overdueReturns: 0, notRewound: 0, lateReturns: 0 }
            }
        });
    }

    const users = readJsonFile(USERS_FILE);
    const user = users.find(u => u.username === username);

    if (!user || !crypto.verifyPassword(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user info with decoded email
    res.json({
        message: 'Login successful',
        user: {
            id: user.id,
            username: user.username,
            email: crypto.decrypt(user.email),
            feedback: user.feedback,
            isAdmin: false
        }
    });
});

// Get Movies
app.get('/api/movies', (req, res) => {
    const { category, search } = req.query;
    let movies = readJsonFile(MOVIES_FILE);

    if (category && category !== 'all') {
        movies = movies.filter(movie => movie.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
        movies = movies.filter(movie => 
            movie.title.toLowerCase().includes(search.toLowerCase())
        );
    }

    res.json(movies);
});

// Get Movie Categories
app.get('/api/categories', (req, res) => {
    const movies = readJsonFile(MOVIES_FILE);
    const categories = [...new Set(movies.map(movie => movie.category))];
    res.json(categories);
});

// Rent Movie
app.post('/api/rent', (req, res) => {
    const { userId, movieId } = req.body;

    if (!userId || !movieId) {
        return res.status(400).json({ error: 'User ID and Movie ID are required' });
    }

    const users = readJsonFile(USERS_FILE);
    const movies = readJsonFile(MOVIES_FILE);
    const rentals = readJsonFile(RENTALS_FILE);

    const user = users.find(u => u.id === userId);
    const movie = movies.find(m => m.id === movieId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    if (!movie) {
        return res.status(404).json({ error: 'Movie not found' });
    }

    if (!movie.available) {
        return res.status(400).json({ error: 'Movie not available' });
    }

    // Create rental record
    const rental = {
        id: uuidv4(),
        userId,
        movieId,
        movieTitle: movie.title,
        rentDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        returned: false,
        rewound: false
    };

    // Update movie availability
    movie.available = false;

    // Add to user's rental history
    user.rentalHistory.push(rental.id);
    user.feedback.totalRentals++;

    // Save updates
    rentals.push(rental);
    writeJsonFile(USERS_FILE, users);
    writeJsonFile(MOVIES_FILE, movies);
    writeJsonFile(RENTALS_FILE, rentals);

    res.json({ message: 'Movie rented successfully', rental });
});

// Return Movie
app.post('/api/return', (req, res) => {
    const { userId, rentalId, rewound } = req.body;

    const users = readJsonFile(USERS_FILE);
    const movies = readJsonFile(MOVIES_FILE);
    const rentals = readJsonFile(RENTALS_FILE);

    const user = users.find(u => u.id === userId);
    const rental = rentals.find(r => r.id === rentalId && r.userId === userId);

    if (!user || !rental) {
        return res.status(404).json({ error: 'Rental not found' });
    }

    if (rental.returned) {
        return res.status(400).json({ error: 'Movie already returned' });
    }

    const movie = movies.find(m => m.id === rental.movieId);
    const returnDate = new Date();
    const dueDate = new Date(rental.dueDate);

    // Update rental record
    rental.returned = true;
    rental.returnDate = returnDate.toISOString();
    rental.rewound = rewound || false;

    // Update user feedback
    if (returnDate > dueDate) {
        user.feedback.overdueReturns++;
        if (returnDate.getTime() - dueDate.getTime() > 24 * 60 * 60 * 1000) {
            user.feedback.lateReturns++;
        }
    }

    if (!rental.rewound) {
        user.feedback.notRewound++;
    }

    // Make movie available again
    if (movie) {
        movie.available = true;
    }

    // Save updates
    writeJsonFile(USERS_FILE, users);
    writeJsonFile(MOVIES_FILE, movies);
    writeJsonFile(RENTALS_FILE, rentals);

    res.json({ 
        message: 'Movie returned successfully',
        feedback: user.feedback
    });
});

// Get User Rentals
app.get('/api/rentals/:userId', (req, res) => {
    const { userId } = req.params;
    const rentals = readJsonFile(RENTALS_FILE);
    
    const userRentals = rentals.filter(r => r.userId === userId);
    res.json(userRentals);
});

// Admin Routes
// Get All Users (Admin Only)
app.get('/api/admin/users', (req, res) => {
    const users = readJsonFile(USERS_FILE);
    
    // Return users with decoded emails for admin view
    const usersWithDecryptedData = users.map(user => ({
        ...user,
        email: crypto.decrypt(user.email)
    }));
    
    res.json(usersWithDecryptedData);
});

// Add Admin Feedback to User
app.post('/api/admin/user-feedback', (req, res) => {
    const { userId, feedbackType, notes } = req.body;
    
    if (!userId || !feedbackType) {
        return res.status(400).json({ error: 'User ID and feedback type are required' });
    }
    
    const users = readJsonFile(USERS_FILE);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Initialize adminFeedback array if it doesn't exist
    if (!user.adminFeedback) {
        user.adminFeedback = [];
    }
    
    // Add new admin feedback
    const feedback = {
        id: uuidv4(),
        type: feedbackType,
        notes: notes || '',
        timestamp: new Date().toISOString(),
        adminUser: 'admin'
    };
    
    user.adminFeedback.push(feedback);
    
    // Update user's behavioral feedback based on admin action
    switch (feedbackType) {
        case 'warning':
            user.feedback.warnings = (user.feedback.warnings || 0) + 1;
            break;
        case 'suspension':
            user.suspended = true;
            user.suspensionDate = new Date().toISOString();
            break;
        case 'commendation':
            user.feedback.commendations = (user.feedback.commendations || 0) + 1;
            break;
    }
    
    if (writeJsonFile(USERS_FILE, users)) {
        res.json({ 
            message: 'Admin feedback added successfully',
            feedback: feedback
        });
    } else {
        res.status(500).json({ error: 'Failed to add feedback' });
    }
});

// Get User Details for Admin
app.get('/api/admin/user/:userId', (req, res) => {
    const { userId } = req.params;
    const users = readJsonFile(USERS_FILE);
    const rentals = readJsonFile(RENTALS_FILE);
    
    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const userRentals = rentals.filter(r => r.userId === userId);
    
    res.json({
        ...user,
        email: crypto.decrypt(user.email),
        rentals: userRentals
    });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize and start server
initializeDataFiles();

app.listen(PORT, () => {
    console.log(`🎬 Blockbusted server running on port ${String(PORT).replace(/\n|\r/g, '')}`);
    console.log('🎞️  Ready to serve the ultimate retro video rental experience!');
});
