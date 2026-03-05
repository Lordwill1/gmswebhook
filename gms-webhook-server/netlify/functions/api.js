const express = require('express');
const serverless = require('serverless-http');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const router = express.Router();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup (note: SQLite has limitations on Netlify)
const db = new sqlite3.Database('/tmp/webhooks.db', (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to SQLite database');
        createTables();
    }
});

function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS webhook_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT,
            message_id TEXT,
            from_number TEXT,
            to_number TEXT,
            direction TEXT,
            status TEXT,
            raw_payload TEXT,
            received_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS message_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id TEXT UNIQUE,
            from_number TEXT,
            to_number TEXT,
            direction TEXT,
            message_content TEXT,
            message_type TEXT,
            status TEXT,
            sent_time DATETIME,
            delivered_time DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// Routes - Notice the path structure
router.get('/', (req, res) => {
    res.json({
        message: "GMS Webhook Server running on Netlify",
        endpoints: {
            webhook: "/.netlify/functions/api/webhook",
            events: "/.netlify/functions/api/events",
            messages: "/.netlify/functions/api/messages",
            stats: "/.netlify/functions/api/stats",
            "callback-url": "/.netlify/functions/api/callback-url"
        }
    });
});

// Get callback URL
router.get('/callback-url', (req, res) => {
    const callbackUrl = `${req.protocol}://${req.get('host')}/.netlify/functions/api/webhook`;
    res.json({
        success: true,
        callback_url: callbackUrl,
        timestamp: new Date().toISOString(),
        provider: "GMS (Global Message Services)"
    });
});

// Webhook endpoint
router.post('/webhook', (req, res) => {
    console.log('=== GMS Webhook Received ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    const payload = req.body;
    const eventType = payload.eventType || payload.type || 'unknown';
    const messageId = payload.messageId || payload.message_id || null;
    const fromNumber = payload.from || null;
    const toNumber = payload.to || null;
    const status = payload.status || null;

    // Store in database (simplified for Netlify)
    db.run(`
        INSERT INTO webhook_events 
        (event_type, message_id, from_number, to_number, status, raw_payload)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [eventType, messageId, fromNumber, toNumber, status, JSON.stringify(payload)]);

    res.status(200).send('OK');
});

// View events
router.get('/events', (req, res) => {
    db.all('SELECT * FROM webhook_events ORDER BY received_at DESC LIMIT 100', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            success: true,
            count: rows.length,
            events: rows
        });
    });
});

// View messages
router.get('/messages', (req, res) => {
    db.all('SELECT * FROM message_logs ORDER BY created_at DESC LIMIT 50', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            success: true,
            count: rows.length,
            messages: rows
        });
    });
});

// Statistics
router.get('/stats', (req, res) => {
    db.get('SELECT COUNT(*) as total FROM webhook_events', [], (err, row) => {
        const totalEvents = row ? row.total : 0;
        
        db.get('SELECT COUNT(*) as total FROM message_logs', [], (err, msgRow) => {
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                stats: {
                    totalEvents: totalEvents,
                    totalMessages: msgRow ? msgRow.total : 0
                }
            });
        });
    });
});

// Mount the router
app.use('/.netlify/functions/api', router);

// Export the serverless function
exports.handler = serverless(app);