const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: 'digital-ekub-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database initialization
const db = new sqlite3.Database('./ekub.db');

db.serialize(() => {
    // Members table
    db.run(`CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        joined_date TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        total_paid REAL DEFAULT 0,
        last_payment_date TEXT
    )`);

    // Payments table
    db.run(`CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_date TEXT NOT NULL,
        month TEXT NOT NULL,
        year INTEGER NOT NULL,
        status TEXT DEFAULT 'completed',
        FOREIGN KEY (member_id) REFERENCES members (id)
    )`);

    // Lucky selections table
    db.run(`CREATE TABLE IF NOT EXISTS lucky_selections (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        selection_date TEXT NOT NULL,
        round_number INTEGER NOT NULL,
        amount_received REAL NOT NULL,
        total_pool REAL NOT NULL,
        FOREIGN KEY (member_id) REFERENCES members (id)
    )`);

    // Rounds table
    db.run(`CREATE TABLE IF NOT EXISTS rounds (
        id TEXT PRIMARY KEY,
        round_number INTEGER UNIQUE NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_collected REAL DEFAULT 0,
        lucky_member_id TEXT,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (lucky_member_id) REFERENCES members (id)
    )`);
});

// Helper functions
function calculateRoundDates() {
    const now = moment();
    const startOfMonth = moment().startOf('month');
    const firstRoundStart = startOfMonth.clone();
    const firstRoundEnd = startOfMonth.clone().add(13, 'days');
    const secondRoundStart = firstRoundEnd.clone().add(1, 'day');
    const secondRoundEnd = startOfMonth.clone().endOf('month');
    
    return {
        firstRound: { start: firstRoundStart, end: firstRoundEnd },
        secondRound: { start: secondRoundStart, end: secondRoundEnd }
    };
}

function getCurrentRound() {
    const now = moment();
    const roundDates = calculateRoundDates();
    
    if (now.isBetween(roundDates.firstRound.start, roundDates.firstRound.end, null, '[]')) {
        return 1;
    } else if (now.isBetween(roundDates.secondRound.start, roundDates.secondRound.end, null, '[]')) {
        return 2;
    }
    return 0; // Between rounds
}

// Routes

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes

// Member registration
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const memberId = uuidv4();
        const joinedDate = moment().format('YYYY-MM-DD HH:mm:ss');

        db.run(
            'INSERT INTO members (id, name, email, phone, password, joined_date) VALUES (?, ?, ?, ?, ?, ?)',
            [memberId, name, email, phone, hashedPassword, joinedDate],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Email already exists' });
                    }
                    return res.status(500).json({ error: 'Registration failed' });
                }
                res.json({ 
                    message: 'Registration successful', 
                    memberId: memberId,
                    member: { id: memberId, name, email, phone, joinedDate }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Member login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM members WHERE email = ? AND is_active = 1', [email], async (err, member) => {
        if (err) {
            return res.status(500).json({ error: 'Login failed' });
        }
        
        if (!member) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, member.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.memberId = member.id;
        req.session.memberName = member.name;
        
        res.json({ 
            message: 'Login successful',
            member: {
                id: member.id,
                name: member.name,
                email: member.email,
                phone: member.phone
            }
        });
    });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logout successful' });
});

// Get current user
app.get('/api/me', (req, res) => {
    if (!req.session.memberId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    db.get('SELECT id, name, email, phone, joined_date, total_paid, last_payment_date FROM members WHERE id = ?', 
        [req.session.memberId], (err, member) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to get user info' });
        }
        res.json({ member });
    });
});

// Make payment
app.post('/api/payment', (req, res) => {
    if (!req.session.memberId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { amount, month, year } = req.body;
    const memberId = req.session.memberId;
    
    if (!amount || !month || !year) {
        return res.status(400).json({ error: 'Amount, month, and year are required' });
    }

    const paymentId = uuidv4();
    const paymentDate = moment().format('YYYY-MM-DD HH:mm:ss');

    db.run(
        'INSERT INTO payments (id, member_id, amount, payment_date, month, year, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [paymentId, memberId, amount, paymentDate, month, year, 'completed'],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Payment failed' });
            }

            // Update member's total paid
            db.run(
                'UPDATE members SET total_paid = total_paid + ?, last_payment_date = ? WHERE id = ?',
                [amount, paymentDate, memberId]
            );

            res.json({ 
                message: 'Payment successful', 
                paymentId: paymentId,
                payment: { id: paymentId, amount, month, year, date: paymentDate }
            });
        }
    );
});

// Get all members (admin only)
app.get('/api/members', (req, res) => {
    if (!req.session.memberId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    db.all('SELECT id, name, email, phone, joined_date, total_paid, last_payment_date, is_active FROM members ORDER BY joined_date', (err, members) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to get members' });
        }
        res.json({ members });
    });
});

// Get current round info
app.get('/api/rounds/current', (req, res) => {
    const currentRound = getCurrentRound();
    const roundDates = calculateRoundDates();
    
    if (currentRound === 0) {
        return res.json({ 
            currentRound: 0, 
            message: 'Currently between rounds',
            nextRound: moment().isBefore(roundDates.firstRound.start) ? 
                { round: 1, start: roundDates.firstRound.start.format('YYYY-MM-DD') } :
                { round: 1, start: moment().add(1, 'month').startOf('month').format('YYYY-MM-DD') }
        });
    }

    // Get total collected for current round
    const roundStart = currentRound === 1 ? roundDates.firstRound.start : roundDates.secondRound.start;
    const roundEnd = currentRound === 1 ? roundDates.firstRound.end : roundDates.secondRound.end;

    db.get(
        'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date BETWEEN ? AND ?',
        [roundStart.format('YYYY-MM-DD'), roundEnd.format('YYYY-MM-DD')],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to get round info' });
            }

            res.json({
                currentRound,
                startDate: roundStart.format('YYYY-MM-DD'),
                endDate: roundEnd.format('YYYY-MM-DD'),
                totalCollected: result.total,
                estimatedLuckyAmount: result.total / 2
            });
        }
    );
});

// Select lucky member
app.post('/api/rounds/select-lucky', (req, res) => {
    if (!req.session.memberId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const currentRound = getCurrentRound();
    if (currentRound === 0) {
        return res.status(400).json({ error: 'No active round currently' });
    }

    const roundDates = calculateRoundDates();
    const roundStart = currentRound === 1 ? roundDates.firstRound.start : roundDates.secondRound.start;
    const roundEnd = currentRound === 1 ? roundDates.firstRound.end : roundDates.secondRound.end;

    // Get total collected for current round
    db.get(
        'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date BETWEEN ? AND ?',
        [roundStart.format('YYYY-MM-DD'), roundEnd.format('YYYY-MM-DD')],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to get round info' });
            }

            const totalCollected = result.total;
            if (totalCollected === 0) {
                return res.status(400).json({ error: 'No payments collected for this round' });
            }

            // Get members who haven't been selected yet in previous rounds
            db.all(
                `SELECT m.id, m.name, m.email 
                 FROM members m 
                 WHERE m.is_active = 1 
                 AND m.id NOT IN (
                     SELECT DISTINCT member_id FROM lucky_selections
                 )`,
                (err, eligibleMembers) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to get eligible members' });
                    }

                    if (eligibleMembers.length === 0) {
                        // All members have been selected, reset and start over
                        db.run('DELETE FROM lucky_selections', (err) => {
                            if (err) {
                                return res.status(500).json({ error: 'Failed to reset selections' });
                            }
                            
                            // Get all active members again
                            db.all('SELECT id, name, email FROM members WHERE is_active = 1', (err, allMembers) => {
                                if (err) {
                                    return res.status(500).json({ error: 'Failed to get members' });
                                }
                                
                                const luckyMember = allMembers[Math.floor(Math.random() * allMembers.length)];
                                const selectionId = uuidv4();
                                const selectionDate = moment().format('YYYY-MM-DD HH:mm:ss');
                                
                                db.run(
                                    'INSERT INTO lucky_selections (id, member_id, selection_date, round_number, amount_received, total_pool) VALUES (?, ?, ?, ?, ?, ?)',
                                    [selectionId, luckyMember.id, selectionDate, currentRound, totalCollected / 2, totalCollected],
                                    function(err) {
                                        if (err) {
                                            return res.status(500).json({ error: 'Failed to record lucky selection' });
                                        }
                                        
                                        res.json({
                                            message: 'Lucky member selected!',
                                            luckyMember,
                                            amount: totalCollected / 2,
                                            round: currentRound,
                                            totalPool: totalCollected
                                        });
                                    }
                                );
                            });
                        });
                    } else {
                        // Select from eligible members
                        const luckyMember = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];
                        const selectionId = uuidv4();
                        const selectionDate = moment().format('YYYY-MM-DD HH:mm:ss');
                        
                        db.run(
                            'INSERT INTO lucky_selections (id, member_id, selection_date, round_number, amount_received, total_pool) VALUES (?, ?, ?, ?, ?, ?)',
                            [selectionId, luckyMember.id, selectionDate, currentRound, totalCollected / 2, totalCollected],
                            function(err) {
                                if (err) {
                                    return res.status(500).json({ error: 'Failed to record lucky selection' });
                                }
                                
                                res.json({
                                    message: 'Lucky member selected!',
                                    luckyMember,
                                    amount: totalCollected / 2,
                                    round: currentRound,
                                    totalPool: totalCollected
                                });
                            }
                        );
                    }
                }
            );
        }
    );
});

// Get lucky selections history
app.get('/api/lucky-selections', (req, res) => {
    if (!req.session.memberId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    db.all(
        `SELECT ls.*, m.name as member_name, m.email as member_email 
         FROM lucky_selections ls 
         JOIN members m ON ls.member_id = m.id 
         ORDER BY ls.selection_date DESC`,
        (err, selections) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to get lucky selections' });
            }
            res.json({ selections });
        }
    );
});

// Get payment history
app.get('/api/payments', (req, res) => {
    if (!req.session.memberId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { memberId } = req.query;
    let query = 'SELECT p.*, m.name as member_name FROM payments p JOIN members m ON p.member_id = m.id';
    let params = [];

    if (memberId) {
        query += ' WHERE p.member_id = ?';
        params.push(memberId);
    }

    query += ' ORDER BY p.payment_date DESC';

    db.all(query, params, (err, payments) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to get payments' });
        }
        res.json({ payments });
    });
});

// Dashboard stats
app.get('/api/dashboard', (req, res) => {
    if (!req.session.memberId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const currentMonth = moment().format('MMMM');
    const currentYear = moment().year();

    db.get(
        'SELECT COUNT(*) as total_members FROM members WHERE is_active = 1',
        (err, memberCount) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to get member count' });
            }

            db.get(
                'SELECT COALESCE(SUM(amount), 0) as monthly_total FROM payments WHERE month = ? AND year = ?',
                [currentMonth, currentYear],
                (err, monthlyTotal) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to get monthly total' });
                    }

                    db.get(
                        'SELECT COUNT(*) as total_selections FROM lucky_selections',
                        (err, selectionCount) => {
                            if (err) {
                                return res.status(500).json({ error: 'Failed to get selection count' });
                            }

                            res.json({
                                totalMembers: memberCount.total_members,
                                monthlyTotal: monthlyTotal.monthly_total,
                                totalSelections: selectionCount.total_selections,
                                currentMonth,
                                currentYear
                            });
                        }
                    );
                }
            );
        }
    );
});

// Start server
const PORT = process.env.PORT || 3000;

// For Vercel deployment
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Digital Ekub server running on port ${PORT}`);
        console.log(`Visit http://localhost:${PORT} to access the website`);
    });
}

// Export for Vercel
module.exports = app;
