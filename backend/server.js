const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const initWebSocket = require('./wsSocket.js');
const wsServer = initWebSocket();


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET_KEY;

// Close any existing connections
let db;
if (db) {
   db.close();
}

// Create new database connection with proper configuration
db = new sqlite3.Database('./finance.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
   if (err) {
       console.error(err.message);
   }
   console.log('Connected to the finance database.');
});

// Configure database
db.configure('busyTimeout', 3000);
db.run('PRAGMA foreign_keys = ON');

// Create tables
db.serialize(() => {
   // Users table
   db.run(`CREATE TABLE IF NOT EXISTS users (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       username VARCHAR(50) UNIQUE NOT NULL,
       password_hash VARCHAR(255) NOT NULL,
       email VARCHAR(100) NOT NULL,
       current_budget DECIMAL(10,2) DEFAULT 0,
       initial_budget DECIMAL(10,2) DEFAULT 0
   )`);

   // Categories table


   // Transactions table
   db.run(`CREATE TABLE IF NOT EXISTS transactions (
       id INTEGER PRIMARY KEY,
       user_id INTEGER NOT NULL,
       amount DECIMAL(10,2) NOT NULL,
       type VARCHAR(20) NOT NULL,
       description TEXT,
       date TIMESTAMP NOT NULL,
       category VARCHAR(20) NOT NULL NOT NULL,
       FOREIGN KEY (user_id) REFERENCES users(id)
   )`);

   db.run(`CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    due_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)`);

   // Insert default categories
   
});

// Test route
const publicPaths = ['/login', '/register', '/verify-token', '/protected-example'];

const authenticateToken = (req, res, next) => {
    if (publicPaths.includes(req.path)) {
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

// Apply authentication middleware to all routes
app.use(authenticateToken);

// Public routes
app.post('/register', async (req, res) => {
   const { username, password, email } = req.body;

   if (!username || !password || !email) {
       return res.status(400).json({ error: 'Username, password, and email are required' });
   }

   try {
       // Check if username exists
       db.get('SELECT username FROM users WHERE username = ?', [username], async (err, row) => {
           if (err) {
               return res.status(500).json({ error: 'Internal server error' });
           }

           if (row) {
               return res.status(400).json({ error: 'Username already exists' });
           }

           // Hash the password
           const saltRounds = 10;
           const hashedPassword = await bcrypt.hash(password, saltRounds);

           // Insert new user
           const sql = `
               INSERT INTO users (username, password_hash, email)
               VALUES (?, ?, ?)
           `;

           db.run(sql, [username, hashedPassword, email], function(err) {
               if (err) {
                   console.error('Registration error:', err);
                   return res.status(500).json({ error: 'Internal server error' });
               }

               // Create token for immediate login after registration
               const authToken = jwt.sign(
                   { 
                       user_id: this.lastID,
                       username: username
                   },
                   JWT_SECRET,
                   { expiresIn: '24h' }
               );

               res.json({ 
                   success: true, 
                   message: 'User registered successfully',
                   authToken,
                   user: {
                       user_id: this.lastID,
                       username: username
                   }
               });
           });
       });

   } catch (error) {
       console.error('Registration error:', error);
       res.status(500).json({ error: 'Internal server error' });
   }
});

app.post('/login', async (req, res) => {
   const { username, password } = req.body;

   if (!username || !password) {
       return res.status(400).json({ error: 'Username and password are required' });
   }

   try {
       // Get user from database
       db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
           if (err) {
               console.error('Database error:', err);
               return res.status(500).json({ error: 'Internal server error' });
           }

           if (!user) {
               return res.status(401).json({ error: 'Invalid username or password' });
           }

           // Compare password
           const passwordMatch = await bcrypt.compare(password, user.password_hash);

           if (!passwordMatch) {
               return res.status(401).json({ error: 'Invalid username or password' });
           }

           // Create JWT token
           const authToken = jwt.sign(
               { 
                   user_id: user.id,
                   username: user.username
               },
               JWT_SECRET,
               { expiresIn: '24h' }
           );

           res.json({
               success: true,
               authToken,
               user: {
                   user_id: user.id,
                   username: user.username
               }
           });
       });

   } catch (error) {
       console.error('Login error:', error);
       res.status(500).json({ error: 'Internal server error' });
   }
});

app.get('/verify-token', (req, res) => {
   const authHeader = req.headers['authorization'];
   const token = authHeader && authHeader.split(' ')[1];
   
   if (!token) {
       return res.status(401).json({ error: 'No token provided' });
   }

   try {
       const decoded = jwt.verify(token, JWT_SECRET);
       res.json({ valid: true, user: decoded });
   } catch (error) {
       res.status(401).json({ error: 'Invalid token' });
   }
});

// Example protected route
app.get('/protected-example', (req, res) => {
   res.json({ message: 'This is a protected route', user: req.user });
});



// GET route for fetching budget
app.get('/budget', (req, res) => {
    console.log('Full user object from token:', req.user);
    const userId = req.user.user_id;
    console.log('Attempting to find user with ID:', userId);

    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {  // Note: using 'user' here
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        console.log('Found user:', user);

        if (!user) {
            // Let's check what users exist in the database
            db.all('SELECT id, username FROM users', [], (err, users) => {
                console.log('All users in database:', users);
                return res.status(404).json({ 
                    error: 'User not found',
                    debugInfo: {
                        requestedId: userId,
                        availableUsers: users
                    }
                });
            });
            return;
        }

        res.json({
            current_budget: user.current_budget || 0,
            initial_budget: user.initial_budget || 0,
            username: user.username  // Changed from row.username to user.username
        });
    });
});

// POST route for updating budget
app.post('/add-budget', (req, res) => {
    const userId = req.user.user_id;  // Using 'id' from token
    const {initial_budget } = req.body;

    if (initial_budget === undefined) {
        return res.status(400).json({ error: 'No budget values provided' });
    }

    let updateQuery = 'UPDATE users SET';
    const params = [];
    const updates = [];

   

    if (initial_budget !== undefined) {
        updates.push(' initial_budget = ?');
        params.push(initial_budget);
    }

    updateQuery += updates.join(',') + ' WHERE id = ?';
    params.push(userId);

    db.run(updateQuery, params, function(err) {
        if (err) {
            console.error('Error updating budget:', err);
            return res.status(500).json({ error: 'Failed to update budget' });
        }

        res.json({
            success: true,
            message: 'Budget updated successfully'
        });
    });
});


// GET route for fetching transactions
app.get('/transactions', (req, res) => {
    const userId = req.user.user_id; // Get user_id from the token

    db.all(
        'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', 
        [userId], 
        (err, rows) => {
            if (err) {
                console.error('Error fetching transactions:', err);
                return res.status(500).json({ error: 'Failed to fetch transactions' });
            }

            res.json(rows); // Return the transactions as JSON
        }
    );
});


// POST route for adding a transaction
app.post('/add-transactions', (req, res) => {
    const userId = req.user.user_id;
    const { amount, type, description, category } = req.body;
    const date = new Date().toISOString();

    // Format amount based on transaction type
    let formattedAmount = parseFloat(amount);
    if (type === 'outcome') {  // Changed from 'expense' to 'outcome'
        formattedAmount = -Math.abs(formattedAmount); // Ensure negative for outcomes
    } else {
        formattedAmount = Math.abs(formattedAmount); // Ensure positive for income
    }

    db.run(
        'INSERT INTO transactions (user_id, amount, type, description, date, category) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, formattedAmount, type, description, date, category],
        function(err) {
            if (err) {
                console.error('Error adding transaction:', err);
                return res.status(500).json({ error: 'Failed to add transaction' });
            }

            const transactionData = {
                id: this.lastID,
                amount: formattedAmount,
                type,
                description,
                date,
                category
            };

            // Broadcast the new transaction
            wsServer.broadcastTransactionUpdate(userId, {
                action: 'add',
                transaction: transactionData
            });

            res.json({
                success: true,
                transactionId: this.lastID,
                message: 'Transaction added successfully'
            });
        }
    );
});


// PUT route to edit transaction
app.put('/edit-transaction/:id', (req, res) => {
    const userId = req.user.user_id;
    const transactionId = req.params.id;
    const { amount, type, description, category } = req.body;

    // Format amount based on type
    let formattedAmount = parseFloat(amount);
    if (type === 'outcome') {
        formattedAmount = -Math.abs(formattedAmount); // Force negative for outcomes
    } else {
        formattedAmount = Math.abs(formattedAmount);  // Force positive for incomes
    }

    db.run(
        'UPDATE transactions SET amount = ?, type = ?, description = ?, category = ? WHERE id = ? AND user_id = ?',
        [formattedAmount, type, description, category, transactionId, userId],
        function(err) {
            if (err) {
                console.error('Error updating transaction:', err);
                return res.status(500).json({ error: 'Failed to update transaction' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Transaction not found or unauthorized' });
            }

            // Broadcast the update
            wsServer.broadcastTransactionUpdate(userId, {
                action: 'edit',
                transaction: {
                    id: transactionId,
                    amount: formattedAmount,
                    type,
                    description,
                    category,
                    date: new Date().toISOString()
                }
            });

            res.json({ success: true });
        }
    );
});

// DELETE route to remove transaction
app.delete('/delete-transaction/:id', (req, res) => {
    const userId = req.user.user_id;
    const transactionId = req.params.id;

    db.run(
        'DELETE FROM transactions WHERE id = ? AND user_id = ?',
        [transactionId, userId],
        function(err) {
            if (err) return res.status(500).json({ error: 'Failed to delete transaction' });
            
            // Broadcast the deletion
            wsServer.broadcastTransactionUpdate(userId, {
                action: 'delete',
                transactionId: transactionId
            });
            
            res.json({ success: true });
        }
    );
});


app.get('/goals', authenticateToken, (req, res) => {
    const userId = req.user.user_id;
  
    db.all('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch goals.' });
      }
      res.json(rows);
    });
  });
  
  app.post('/add-goal', (req, res) => {
    const userId = req.user.user_id;
    const { name, target_amount, due_date } = req.body;
  
    if (!name || !target_amount || !due_date) {
      return res.status(400).json({ error: 'Goal name, target amount, and due date are required.' });
    }
  
    const sql = `
      INSERT INTO goals (user_id, name, target_amount, due_date)
      VALUES (?, ?, ?, ?)
    `;
  
    db.run(sql, [userId, name, target_amount, due_date], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add goal.' });
      }

      const newGoal = {
        id: this.lastID,
        name,
        target_amount,
        due_date,
        created_at: new Date().toISOString()
    };

    wsServer.broadcastGoalUpdate(userId, {
        action: 'add',
        goal: newGoal
    });
  
      res.json({
        success: true,
        goalId: this.lastID,
        message: 'Goal added successfully.',
      });
    });
  });
  app.put('/edit-goal/:id', (req, res) => {
    const userId = req.user.user_id;
    const goalId = req.params.id;
    const { name, target_amount, due_date } = req.body;
  
    if (!name && !target_amount && !due_date) {
      return res.status(400).json({ error: 'At least one field must be provided.' });
    }
  
    let updateQuery = 'UPDATE goals SET';
    const params = [];
    const updates = [];
  
    if (name) {
      updates.push(' name = ?');
      params.push(name);
    }
    if (target_amount) {
      updates.push(' target_amount = ?');
      params.push(target_amount);
    }
    if (due_date) {
      updates.push(' due_date = ?');
      params.push(due_date);
    }
  
    updateQuery += updates.join(',') + ' WHERE id = ? AND user_id = ?';
    params.push(goalId, userId);
  
    db.run(updateQuery, params, function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update goal.' });
      }
  
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Goal not found or unauthorized.' });
      }
  
      res.json({ success: true, message: 'Goal updated successfully.' });
    });
  });
  
  app.delete('/delete-goal/:id', authenticateToken, (req, res) => {
    const userId = req.user.user_id;
    const goalId = req.params.id;
  
    db.run('DELETE FROM goals WHERE id = ? AND user_id = ?', [goalId, userId], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete goal.' });
      }
  
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Goal not found or unauthorized.' });
      }
  
      res.json({ success: true, message: 'Goal deleted successfully.' });
    });
  });
  // GET route for user details
// GET route for user details
app.get('/user-details', (req, res) => {
    const userId = req.user.user_id;
    
    db.get('SELECT username, email FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Error fetching user details:', err);
            return res.status(500).json({ error: 'Failed to fetch user details' });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    });
});

// PUT route for updating user details
app.put('/update-user', async (req, res) => {
    const userId = req.user.user_id;
    const { username, email } = req.body;

    if (!username && !email) {
        return res.status(400).json({ error: 'No update data provided' });
    }

    try {
        // Check if username is taken (if username is being updated)
        if (username) {
            const existingUser = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM users WHERE username = ? AND id != ?', 
                    [username, userId], 
                    (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    });
            });

            if (existingUser) {
                return res.status(400).json({ error: 'Username already taken' });
            }
        }

        // Build update query dynamically
        const updates = [];
        const params = [];
        
        if (username) {
            updates.push('username = ?');
            params.push(username);
        }
        if (email) {
            updates.push('email = ?');
            params.push(email);
        }
        
        params.push(userId);

        const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

        db.run(updateQuery, params, function(err) {
            if (err) {
                console.error('Error updating user:', err);
                return res.status(500).json({ error: 'Failed to update user details' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ 
                success: true, 
                message: 'User details updated successfully',
                updated: { username, email }
            });
        });
    } catch (error) {
        console.error('Error in update process:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Handle graceful shutdown
process.on('SIGINT', () => {
   db.close((err) => {
       if (err) {
           console.error(err.message);
       }
       console.log('Closed the database connection.');
       process.exit(0);
   });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});