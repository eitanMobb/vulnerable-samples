# 🎬 BLOCKBUSTED - Retro 80s Video Rental App

Welcome to **BLOCKBUSTED**, a retro 80s-themed video rental application designed specifically for educational purposes to demonstrate security vulnerabilities, particularly **Improper Cryptographic Implementation**.

## ⚠️ IMPORTANT SECURITY NOTICE

**THIS APPLICATION CONTAINS INTENTIONAL SECURITY VULNERABILITIES FOR EDUCATIONAL PURPOSES ONLY.**

**DO NOT USE IN PRODUCTION ENVIRONMENTS.**

This application is designed to teach developers about common security vulnerabilities, specifically focusing on improper cryptographic implementations. It should only be used in controlled educational environments.

## 🎯 Educational Purpose

This application demonstrates the **OWASP Top 10** vulnerability:
- **A02:2021 – Cryptographic Failures** (formerly known as Sensitive Data Exposure)

### Vulnerability Details

The application implements several intentionally weak cryptographic practices:

1. **Weak Encryption Algorithm**: Uses a simple Caesar cipher instead of strong encryption
2. **Hardcoded Encryption Key**: The encryption key is hardcoded in the source code
3. **Predictable Salt**: Uses the same "salt" for all encrypted data
4. **Weak Password Hashing**: Passwords are "hashed" using the same weak Caesar cipher
5. **Insecure Data Storage**: Sensitive user data (emails) are encrypted with weak crypto

### What This Teaches

- Why proper encryption algorithms (AES, RSA) should be used
- The importance of proper key management
- Why salts should be unique and random
- How to implement secure password hashing (bcrypt, Argon2)
- The risks of implementing custom cryptography

## 🎮 Features

- **Retro 80s Design**: Neon colors, scanlines, and VHS-style aesthetics
- **User Registration & Authentication**: Account creation and login system
- **Movie Catalog**: Browse movies by category or search by name
- **Rental System**: Rent and return movies with due dates
- **Rental Feedback**: Track user behavior (overdue returns, not rewinding tapes)
- **Profile Management**: View rental statistics and current rentals

## 🛠️ Technology Stack

- **Backend**: Node.js with Express
- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **Data Storage**: JSON files (for simplicity)
- **Styling**: Custom CSS with retro 80s theme
- **Fonts**: Google Fonts (Orbitron, Courier Prime)

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Blockbusted
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Development Mode

For development with auto-restart:
```bash
npm run dev
```

## 📁 Project Structure

```
Blockbusted/
├── server.js              # Main server file with vulnerable crypto
├── package.json           # Dependencies and scripts
├── public/                 # Frontend files
│   ├── index.html         # Main HTML file
│   ├── css/
│   │   └── style.css      # 80s retro styling
│   ├── js/
│   │   └── app.js         # Frontend JavaScript
│   └── images/            # Image assets
├── data/                  # JSON data storage
│   ├── users.json         # User data (encrypted with weak crypto)
│   ├── movies.json        # Movie catalog
│   └── rentals.json       # Rental records
└── README.md              # This file
```

## 🎯 Educational Exercises

### For Students/Developers:

1. **Identify the Vulnerabilities**:
   - Examine the `VulnerableCrypto` class in `server.js`
   - Find all the security issues in the implementation

2. **Analyze the Impact**:
   - What data could be compromised?
   - How easy would it be to decrypt user information?

3. **Fix the Vulnerabilities**:
   - Replace Caesar cipher with proper encryption (AES)
   - Implement secure password hashing (bcrypt)
   - Use proper key management
   - Add unique salts for each user

4. **Test Your Fixes**:
   - Verify that the application still works
   - Ensure encrypted data is properly protected

### Sample Vulnerable Code Analysis:

```javascript
// VULNERABLE - DO NOT USE IN PRODUCTION
encrypt(text) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        // Simple Caesar cipher - extremely weak!
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
    // Predictable salt - everyone gets the same!
    return `SALT1985_${result}`;
}
```

## 🔒 Security Best Practices (What This App Doesn't Do)

1. **Use Strong Encryption**:
   ```javascript
   // Good: Use crypto module with AES
   const crypto = require('crypto');
   const algorithm = 'aes-256-gcm';
   ```

2. **Proper Password Hashing**:
   ```javascript
   // Good: Use bcrypt
   const bcrypt = require('bcrypt');
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

3. **Secure Key Management**:
   ```javascript
   // Good: Use environment variables
   const secretKey = process.env.SECRET_KEY;
   ```

4. **Unique Salts**:
   ```javascript
   // Good: Generate unique salt per user
   const salt = crypto.randomBytes(16);
   ```

## 🎨 Design Features

- **Neon Color Scheme**: Pink, cyan, green, and yellow neon colors
- **Scanline Effects**: Retro CRT monitor simulation
- **Grid Overlay**: 80s computer interface aesthetic
- **VHS-Style Graphics**: Tape deck and retro elements
- **Glitch Effects**: Text animations and hover effects
- **Responsive Design**: Works on desktop and mobile

## 📚 Learning Resources

- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Node.js Crypto Module Documentation](https://nodejs.org/api/crypto.html)
- [bcrypt Library](https://www.npmjs.com/package/bcrypt)
- [OWASP Top 10 2021](https://owasp.org/Top10/)

## 🤝 Contributing

This is an educational project. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Please maintain the educational nature of the vulnerabilities while improving the codebase.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This application is created solely for educational purposes to demonstrate security vulnerabilities. The developers are not responsible for any misuse of the code or concepts presented. Always follow security best practices in production applications.

---

**Remember**: The goal is to learn from these mistakes, not to repeat them! 🚀

Made with ❤️ for security education
