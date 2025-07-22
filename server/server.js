
require('dotenv').config({ path: '../.env' });

const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Import bcryptjs


const app = express();
const port = 3001;



// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// API endpoint for user registration
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Check if user already exists
    const [existingUsers] = await pool.promise().query('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

    // Insert new user into database
    const [result] = await pool.promise().query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// API endpoint for user login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('Login attempt for username:', username);
  console.log('Password received (plain text):', password);

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Find user by username
    const [users] = await pool.promise().query('SELECT id, username, password FROM users WHERE username = ?', [username]);

    if (users.length === 0) {
      console.log('User not found in database.');
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = users[0];

    console.log('User found in database:', user.username);
    console.log('Hashed password from DB:', user.password);

    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password comparison result (isMatch):', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.status(200).json({ message: 'Login successful', username: user.username });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// API endpoint to get sales data, with optional date filtering
app.get('/api/sales', (req, res) => {
  const { startDate, endDate } = req.query;

  let query = 'SELECT id, sale_date, table_number, customer_count, buffet_type, price_per_person, payment_method, total_amount FROM sales';
  const params = [];

  if (startDate && endDate) {
    // Modify the query to correctly handle the date range for DATETIME columns
    query += ' WHERE sale_date >= ? AND sale_date < DATE_ADD(?, INTERVAL 1 DAY)';
    params.push(startDate, endDate);
  }

  pool.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching sales data:', err);
      return res.status(500).send('Error fetching sales data');
    }
    // Format sale_date to ISO string for consistency with frontend Date object
    const formattedResults = results.map(sale => ({
      id: sale.id,
      date: new Date(sale.sale_date).toISOString().split('T')[0], // Format to YYYY-MM-DD
      tableNumber: sale.table_number,
      customerCount: sale.customer_count,
      buffetType: sale.buffet_type,
      pricePerPerson: sale.price_per_person,
      paymentMethod: sale.payment_method,
      totalAmount: sale.total_amount,
    }));
    res.json(formattedResults);
  });
});

// API endpoint to add a new sale
app.post('/api/sales', (req, res) => {
  const { date, tableNumber, customerCount, buffetType, pricePerPerson, paymentMethod, totalAmount } = req.body;
  const sale_date = new Date(date); // Convert date string to Date object

  const query = 'INSERT INTO sales (sale_date, table_number, customer_count, buffet_type, price_per_person, payment_method, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)';
  pool.query(query, [sale_date, tableNumber, customerCount, buffetType, pricePerPerson, paymentMethod, totalAmount], (err, result) => {
    if (err) {
      console.error('Error inserting new sale:', err);
      return res.status(500).send('Error adding new sale');
    }
    // Respond with the newly created sale including its ID from the database
    res.status(201).json({ id: result.insertId, ...req.body });
  });
});

// API endpoint to update a sale
app.put('/api/sales/:id', (req, res) => {
  const { id } = req.params;
  const { date, tableNumber, customerCount, buffetType, pricePerPerson, paymentMethod, totalAmount } = req.body;
  const sale_date = new Date(date); // Convert date string to Date object

  const query = 'UPDATE sales SET sale_date = ?, table_number = ?, customer_count = ?, buffet_type = ?, price_per_person = ?, payment_method = ?, total_amount = ? WHERE id = ?';
  pool.query(query, [sale_date, tableNumber, customerCount, buffetType, pricePerPerson, paymentMethod, totalAmount, id], (err, result) => {
    if (err) {
      console.error('Error updating sale:', err);
      return res.status(500).send('Error updating sale');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('Sale not found');
    }
    res.json({ id, ...req.body });
  });
});

// API endpoint to delete a sale
app.delete('/api/sales/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM sales WHERE id = ?';
  pool.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting sale:', err);
      return res.status(500).send('Error deleting sale');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('Sale not found');
    }
    res.status(204).send(); // No Content
  });
});





// Load the chatbot handler
require('./chatbotHandler')(app, pool, port);

// Catch-all handler for any requests that don't match one above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Export the app for Vercel
module.exports = app;

// Only listen if not in a Vercel environment (i.e., local development)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV) {
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}
