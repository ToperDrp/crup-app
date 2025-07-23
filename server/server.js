
require('dotenv').config({ path: '../.env' });

const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Import bcryptjs


const app = express();
const port = 3001;

app.set('trust proxy', true);
app.options('*', cors()); 

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
    const existingUsers = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUsers.rows.length > 0) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

    // Insert new user into database
    const result = await pool.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id', [username, hashedPassword]);
    res.status(201).json({ message: 'User registered successfully', userId: result.rows[0].id });
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
    const users = await pool.query('SELECT id, username, password FROM users WHERE username = $1', [username]);

    if (users.rows.length === 0) {
      console.log('User not found in database.');
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = users.rows[0];

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
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432, // Default PostgreSQL port
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// API endpoint to get sales data, with optional date filtering
app.get('/api/sales', (req, res) => {
  const { startDate, endDate } = req.query;

  let query = 'SELECT id, sale_date, table_number, customer_count, buffet_type, price_per_person, payment_method, total_amount FROM sales';
  const params = [];

  if (startDate && endDate) {
    query += ' WHERE sale_date >= $1 AND sale_date < ($2::date + INTERVAL \'1 day\')';
    params.push(startDate, endDate);
  }

  pool.query(query, params, (err, result) => {
    if (err) {
      console.error('Error fetching sales data:', err);
      return res.status(500).send('Error fetching sales data');
    }
    // Format sale_date to ISO string for consistency with frontend Date object
    const formattedResults = result.rows.map(sale => ({
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

  const query = 'INSERT INTO sales (sale_date, table_number, customer_count, buffet_type, price_per_person, payment_method, total_amount) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id';
  pool.query(query, [sale_date, tableNumber, customerCount, buffetType, pricePerPerson, paymentMethod, totalAmount], (err, result) => {
    if (err) {
      console.error('Error inserting new sale:', err);
      return res.status(500).send('Error adding new sale');
    }
    // Respond with the newly created sale including its ID from the database
    res.status(201).json({ id: result.rows[0].id, ...req.body });
  });
});

// API endpoint to update a sale
app.put('/api/sales/:id', (req, res) => {
  const { id } = req.params;
  const { date, tableNumber, customerCount, buffetType, pricePerPerson, paymentMethod, totalAmount } = req.body;
  const sale_date = new Date(date); // Convert date string to Date object

  const query = 'UPDATE sales SET sale_date = $1, table_number = $2, customer_count = $3, buffet_type = $4, price_per_person = $5, payment_method = $6, total_amount = $7 WHERE id = $8';
  pool.query(query, [sale_date, tableNumber, customerCount, buffetType, pricePerPerson, paymentMethod, totalAmount, id], (err, result) => {
    if (err) {
      console.error('Error updating sale:', err);
      return res.status(500).send('Error updating sale');
    }
    if (result.rowCount === 0) {
      return res.status(404).send('Sale not found');
    }
    res.json({ id, ...req.body });
  });
});

// API endpoint to delete a sale
app.delete('/api/sales/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM sales WHERE id = $1';
  pool.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting sale:', err);
      return res.status(500).send('Error deleting sale');
    }
    if (result.rowCount === 0) {
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

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
