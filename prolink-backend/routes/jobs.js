// routes/jobs.js
const express = require('express');
const router = express.Router(); // Corrected router initialization
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');
const jwt = require('jsonwebtoken'); // Import JWT to decode token manually

// POST api/jobs - Create a new job
router.post('/', authMiddleware, async (req, res) => {
  try {
    const clientId = req.user.id;
    const { title, description, budget, job_type } = req.body;
    if (!title || !description || !job_type) return res.status(400).json({ msg: 'Please provide a title, description, and job type.' });
    const newJob = await db.query(
      'INSERT INTO jobs (client_id, title, description, budget, job_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [clientId, title, description, budget, job_type]
    );
    res.status(201).json({ msg: 'Job posted successfully!', job: newJob.rows[0] });
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// GET api/jobs - Get all public job postings
router.get('/', async (req, res) => {
  try {
    const allJobs = await db.query(
      `SELECT j.id, j.title, j.description, j.budget, j.posted_at, p.full_name as client_name 
       FROM jobs j JOIN profiles p ON j.client_id = p.user_id
       WHERE j.job_type = 'digital' ORDER BY j.posted_at DESC`
    );
    res.json(allJobs.rows);
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// GET /api/jobs/my-jobs - Get all jobs posted by the logged-in client
router.get('/my-jobs', authMiddleware, async (req, res) => {
  try {
    const clientId = req.user.id;
    const myJobs = await db.query(
      `SELECT id, title, status, posted_at, (SELECT COUNT(*) FROM bids WHERE job_id = jobs.id) as bid_count 
       FROM jobs WHERE client_id = $1 ORDER BY posted_at DESC`, [clientId]
    );
    res.json(myJobs.rows);
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// GET api/jobs/:id - High-performance get single job with conditional bids
// THIS ROUTE IS NOW PUBLIC, BUT "TOKEN-AWARE"
router.get('/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    let userId = null;

    // Safely check for a token and decode it without crashing
    const authHeader = req.header('Authorization');
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.user.id;
            } catch (err) {
                console.log("Invalid token detected, serving public data.");
            }
        }
    }

    const query = `
      SELECT 
        j.id, j.client_id, j.title, j.description, j.budget, j.posted_at, j.status, p_client.full_name as client_name,
        CASE
          WHEN j.client_id = $2 THEN (
            SELECT COALESCE(json_agg(
              json_build_object('id', b.id, 'provider_id', b.provider_id, 'amount', b.amount, 'proposal', b.proposal, 'full_name', p_provider.full_name)
            ), '[]'::json)
            FROM bids b JOIN profiles p_provider ON b.provider_id = p_provider.user_id
            WHERE b.job_id = j.id
          )
          ELSE NULL
        END as bids
      FROM jobs j JOIN profiles p_client ON j.client_id = p_client.user_id
      WHERE j.id = $1
    `;
    const jobResult = await db.query(query, [jobId, userId]);
    if (jobResult.rows.length === 0) return res.status(404).json({ msg: 'Job not found' });
    res.json(jobResult.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// POST api/jobs/:id/bids - Submit a bid for a job (Protected)
router.post('/:id/bids', authMiddleware, async (req, res) => {
  try {
    const { id: jobId } = req.params; const { id: providerId } = req.user;
    const { amount, proposal } = req.body;
    if (!amount || !proposal) return res.status(400).json({ msg: 'Amount and proposal are required.' });
    const existingBid = await db.query('SELECT id FROM bids WHERE job_id = $1 AND provider_id = $2', [jobId, providerId]);
    if (existingBid.rows.length > 0) return res.status(400).json({ msg: 'You have already placed a bid on this job.' });
    const newBid = await db.query(
      'INSERT INTO bids (job_id, provider_id, amount, proposal) VALUES ($1, $2, $3, $4) RETURNING *',
      [jobId, providerId, amount, proposal]
    );
    res.status(201).json({ msg: 'Bid submitted!', bid: newBid.rows[0] });
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// POST api/jobs/:id/hire - Hire a provider for a job (Protected)
router.post('/:id/hire', authMiddleware, async (req, res) => {
  try {
    const { id: jobId } = req.params; const { id: clientId } = req.user;
    const { providerId, agreedAmount } = req.body;
    const job = await db.query('SELECT client_id, status FROM jobs WHERE id = $1', [jobId]);
    if (job.rows.length === 0) return res.status(404).json({ msg: 'Job not found.' });
    if (job.rows[0].client_id !== clientId) return res.status(403).json({ msg: 'Not authorized.' });
    if (job.rows[0].status !== 'open') return res.status(400).json({ msg: 'Job is not open for hiring.' });
    await db.query(`UPDATE jobs SET status = 'assigned' WHERE id = $1`, [jobId]);
    const newAssignment = await db.query(
      'INSERT INTO job_assignments (job_id, provider_id, agreed_amount) VALUES ($1, $2, $3) RETURNING *',
      [jobId, providerId, agreedAmount]
    );
    res.status(200).json({ msg: 'Freelancer hired!', assignment: newAssignment.rows[0] });
  } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

module.exports = router;

