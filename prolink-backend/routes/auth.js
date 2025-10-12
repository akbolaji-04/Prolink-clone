// routes/auth.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // This points to the db.js file in the main folder

const router = express.Router();

// ==> REGISTER A NEW USER <==
router.post('/register', async (req, res) => {
  try {
    const { email, password, user_type } = req.body;

    // 1. Check if user already exists
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 3. Insert the new user into the database
    const newUser = await db.query(
      'INSERT INTO users (email, password_hash, user_type) VALUES ($1, $2, $3) RETURNING id, email',
      [email, password_hash, user_type]
    );

    // 4. Also create a blank profile for them
    await db.query(
      'INSERT INTO profiles (user_id) VALUES ($1)',
      [newUser.rows[0].id]
    );

    res.status(201).json({ message: "User created successfully!", user: newUser.rows[0] });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ==> LOGIN A USER <==
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(401).json({ error: "Invalid Credentials" });
    }

    // 2. Compare the submitted password with the stored hash
    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid Credentials" });
    }

    // 3. Create and sign a JWT (the keycard 🔑)
    const payload = {
      user: {
        id: user.rows[0].id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' }, // Token expires in 5 hours
      (err, token) => {
        if (err) throw err;
        res.json({ token }); // Send the token back to the client
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;