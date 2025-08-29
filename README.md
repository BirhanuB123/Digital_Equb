# Digital Ekub - Digital Money Collection Platform

A modern digital platform that brings the traditional Ethiopian Ekub system into the 21st century. Digital Ekub combines community spirit with cutting-edge technology to create a secure, transparent, and fair money collection and distribution system.

## 🌟 Features

### Core Functionality
- **Member Management**: Secure registration and authentication system
- **Monthly Collection**: Each member contributes 5,000 Birr monthly
- **Bi-weekly Distribution**: Lucky member selection every 2 weeks
- **Fair Rotation**: Ensures all members get a chance before repeating
- **Real-time Dashboard**: Comprehensive overview of all activities

### Technical Features
- **Responsive Design**: Mobile-first approach with modern UI/UX
- **Secure Authentication**: Password hashing and session management
- **Database Storage**: SQLite database for data persistence
- **API-driven**: RESTful API architecture
- **Real-time Updates**: Instant notifications and status updates
- **Bilingual Support**: Full English and Amharic language support
- **Localization**: Automatic language detection and preference saving

## 🚀 How It Works

### 1. Monthly Collection
- Each member contributes 5,000 Birr monthly
- Example: 12 members = 60,000 Birr total pool
- Collection period: Monthly

### 2. Bi-weekly Distribution
- **Round 1** (1st-14th of month): 30,000 Birr to lucky member
- **Round 2** (15th-end of month): 30,000 Birr to lucky member
- Total distribution: 60,000 Birr per month

### 3. Fair Selection System
- Lucky member selection is completely random
- Once selected, a member cannot be selected again until all members get a chance
- When all members have been selected, the cycle resets

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd Digital_Ekub
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the Application
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### Step 4: Access the Website
Open your browser and navigate to: `http://localhost:3000`

## 📁 Project Structure

```
Digital_Ekub/
├── server.js              # Main server file with Express.js
├── package.json           # Project dependencies and scripts
├── public/                # Frontend assets
│   ├── index.html        # Main HTML file
│   ├── css/
│   │   └── style.css     # Custom CSS styles
│   └── js/
│       └── app.js        # Frontend JavaScript application
├── ekub.db               # SQLite database (created automatically)
└── README.md             # This file
```

## 🗄️ Database Schema

### Members Table
- `id`: Unique identifier
- `name`: Full name
- `email`: Email address (unique)
- `phone`: Phone number
- `password`: Hashed password
- `joined_date`: Registration date
- `is_active`: Account status
- `total_paid`: Total amount paid
- `last_payment_date`: Last payment date

### Payments Table
- `id`: Unique identifier
- `member_id`: Reference to member
- `amount`: Payment amount
- `payment_date`: Payment date
- `month`: Payment month
- `year`: Payment year
- `status`: Payment status

### Lucky Selections Table
- `id`: Unique identifier
- `member_id`: Lucky member reference
- `selection_date`: Selection date
- `round_number`: Round number (1 or 2)
- `amount_received`: Amount received
- `total_pool`: Total pool amount

## 🔧 Configuration

### Environment Variables
The application uses default values but can be configured via environment variables:

```bash
PORT=3000                    # Server port (default: 3000)
SESSION_SECRET=your-secret   # Session secret key
```

### Database Configuration
The application automatically creates a SQLite database (`ekub.db`) in the root directory. For production, consider using PostgreSQL or MySQL.

## 📱 Usage Guide

### For Members

1. **Registration**
   - Click "Register" button
   - Fill in your details (name, email, phone, password)
   - Submit the form

2. **Login**
   - Click "Login" button
   - Enter your email and password
   - Access your dashboard

3. **Making Payments**
   - Navigate to dashboard
   - Click "Make Payment" button
   - Enter amount (typically 5,000 Birr)
   - Specify month and year
   - Confirm payment

4. **Viewing History**
   - Dashboard shows payment history
   - View lucky selections
   - Check round status

### For Administrators

1. **Member Management**
   - View all registered members
   - Monitor payment status
   - Track member activity

2. **Lucky Member Selection**
   - Click "Select Lucky Member" during active rounds
   - System automatically ensures fair distribution
   - View selection history

3. **Round Management**
   - Monitor current round status
   - Track collection amounts
   - View round schedules

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **Session Management**: Secure session handling
- **Rate Limiting**: API request throttling
- **Input Validation**: Server-side validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy headers

## 🌐 API Endpoints

### Authentication
- `POST /api/register` - Member registration
- `POST /api/login` - Member login
- `POST /api/logout` - Member logout
- `GET /api/me` - Get current user info

### Payments
- `POST /api/payment` - Make payment
- `GET /api/payments` - Get payment history

### Members
- `GET /api/members` - Get all members

### Rounds
- `GET /api/rounds/current` - Get current round info
- `POST /api/rounds/select-lucky` - Select lucky member

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics
- `GET /api/lucky-selections` - Get lucky selections history

## 🎨 Customization

### Styling
- Modify `public/css/style.css` for custom styles
- Update Tailwind CSS classes in HTML files
- Customize color schemes and animations

### Functionality
- Extend `public/js/app.js` for additional features
- Modify `server.js` for backend changes
- Add new API endpoints as needed

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
```bash
npm start
```

### Docker Deployment (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Monitoring & Maintenance

### Database Maintenance
- Regular backups of `ekub.db`
- Monitor database size and performance
- Clean up old records if needed

### Log Monitoring
- Check server logs for errors
- Monitor API usage and performance
- Track user activity patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Email: info@digitalekub.com
- Phone: +251 911 123 456
- Location: Addis Ababa, Ethiopia

## 🔮 Future Enhancements

- **Mobile App**: Native iOS and Android applications
- **Payment Gateway**: Integration with local banks and mobile money
- **Notifications**: SMS and email notifications
- **Analytics**: Advanced reporting and analytics dashboard
- **Multi-language**: Full English and Amharic support with language switching
- **Blockchain**: Integration for enhanced transparency

---

**Digital Ekub** - Modernizing traditional ekub for the digital age. 🚀
