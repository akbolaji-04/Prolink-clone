// routes/profiles.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');

// --- (Your other routes like GET /me, PUT /me, etc. remain unchanged) ---
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // authMiddleware attaches req.user with the token payload (user.id)
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ msg: 'Unauthorized' });

    const query = `
      SELECT
        p.user_id,
        p.full_name,
        p.bio,
        p.profile_picture_url,
        u.email,
        u.user_type,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'title', pi.title,
              'description', pi.description,
              'file_url_or_link', pi.file_url_or_link
            )
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'::json
        ) as portfolio
      FROM profiles p
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN portfolio_items pi ON p.id = pi.profile_id
      WHERE p.user_id = $1
      GROUP BY p.id, u.email, u.user_type;
    `;

    const result = await db.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[profiles] GET /me error', err.message);
    res.status(500).send('Server Error');
  }
});
router.put('/me', authMiddleware, async (req, res) => { /* ... existing code ... */ });
router.put('/me/picture', authMiddleware, async (req, res) => { /* ... existing code ... */ });
router.post('/me/portfolio', authMiddleware, async (req, res) => { /* ... existing code ... */ });


// ==> THE NEW, HIGH-PERFORMANCE PUBLIC PROFILE ROUTE <==
// @route   GET api/profiles/:id
// @desc    Get a user's complete public profile in a single query
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const query = `
      SELECT
        p.user_id,
        p.full_name,
        p.bio,
        p.profile_picture_url,
        -- This aggregates all matching portfolio items into a single JSON array
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'title', pi.title,
              'description', pi.description,
              'file_url_or_link', pi.file_url_or_link
            )
          ) FILTER (WHERE pi.id IS NOT NULL), 
          '[]'::json
        ) as portfolio
      FROM profiles p
      -- LEFT JOIN is crucial: it returns the profile even if there are no portfolio items
      LEFT JOIN portfolio_items pi ON p.id = pi.profile_id
      WHERE p.user_id = $1
      GROUP BY p.id;
    `;

    const result = await db.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    // The result is now a single object with all the data
    res.json(result.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

