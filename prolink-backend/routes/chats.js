// routes/chats.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');

// @route   POST /api/chats/initiate
// @desc    Find or create a chat thread
router.post('/initiate', authMiddleware, async (req, res) => {
    try {
        const { jobId, providerId } = req.body;
        // The person initiating the chat is the job owner (client)
        const jobOwner = await db.query('SELECT client_id FROM jobs WHERE id = $1', [jobId]);
        if (jobOwner.rows.length === 0) {
            return res.status(404).json({ msg: 'Job not found.' });
        }
        const clientId = jobOwner.rows[0].client_id;
        
        // Security check: only the job owner can initiate a chat
        if (req.user.id !== clientId) {
            return res.status(403).json({ msg: 'You are not authorized to initiate this chat.' });
        }

        let thread = await db.query(
            'SELECT id FROM chat_threads WHERE job_id = $1 AND client_id = $2 AND provider_id = $3',
            [jobId, clientId, providerId]
        );

        if (thread.rows.length > 0) {
            return res.json({ threadId: thread.rows[0].id });
        } else {
            const newThread = await db.query(
                'INSERT INTO chat_threads (job_id, client_id, provider_id) VALUES ($1, $2, $3) RETURNING id',
                [jobId, clientId, providerId]
            );
            return res.status(201).json({ threadId: newThread.rows[0].id });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/chats/:threadId/messages
// @desc    Get all messages for a specific chat thread
router.get('/:threadId/messages', authMiddleware, async (req, res) => {
    try {
        const { threadId } = req.params;
        const messages = await db.query(
            'SELECT * FROM messages WHERE thread_id = $1 ORDER BY sent_at ASC',
            [threadId]
        );
        res.json(messages.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/chats
// @desc    Get all chat threads for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const threads = await db.query(
            `SELECT 
                ct.id as thread_id, 
                j.title as job_title,
                CASE
                    WHEN ct.client_id = $1 THEN p_provider.full_name
                    ELSE p_client.full_name
                END as other_user_name
             FROM chat_threads ct
             JOIN jobs j ON ct.job_id = j.id
             JOIN profiles p_client ON ct.client_id = p_client.user_id
             JOIN profiles p_provider ON ct.provider_id = p_provider.user_id
             WHERE ct.client_id = $1 OR ct.provider_id = $1
             ORDER BY ct.created_at DESC`,
            [userId]
        );
        res.json(threads.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

