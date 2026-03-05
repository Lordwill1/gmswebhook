const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize SQLite database
const db = new sqlite3.Database('./webhooks.db', (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to SQLite database');
        createTables();
    }
});

// Create tables if they don't exist
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

    console.log('Database tables created/verified');
}

// Home page with callback URL information
app.get('/', (req, res) => {
    const callbackUrl = `${req.protocol}://${req.get('host')}/webhook`;
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>GMS Webhook Server</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .container { max-width: 800px; margin: 0 auto; }
                .url-box { background: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .url { font-size: 1.2em; font-weight: bold; color: #0066cc; }
                code { background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .nav { margin: 20px 0; }
                .nav a { margin-right: 15px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
                .header h1 { margin: 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>GMS Webhook Server</h1>
                    <p>Global Message Services Integration</p>
                </div>
                
                <div class="url-box">
                    <h2>Your Callback URL:</h2>
                    <div class="url">${callbackUrl}</div>
                    <p><small>Use this URL in your GMS application settings for message status callbacks</small></p>
                </div>

                <div class="nav">
                    <a href="/events">View Events</a> | 
                    <a href="/messages">View Messages</a> | 
                    <a href="/stats">Statistics</a> | 
                    <a href="/test-webhook">Test Webhook</a>
                </div>

                <h2>Available Endpoints:</h2>
                <ul>
                    <li><code>GET /</code> - This page</li>
                    <li><code>POST /webhook</code> - Main webhook endpoint for GMS</li>
                    <li><code>GET /events</code> - View all webhook events</li>
                    <li><code>GET /messages</code> - View message logs</li>
                    <li><code>GET /stats</code> - View statistics</li>
                    <li><code>GET /callback-url</code> - Get callback URL in JSON format</li>
                    <li><code>GET /test-webhook</code> - Test page for sending sample webhooks</li>
                </ul>

                <h2>GMS Webhook Formats Accepted:</h2>
                <ul>
                    <li><strong>Message Status</strong> - delivery reports, status updates</li>
                    <li><strong>Inbound Messages</strong> - received SMS/MMS</li>
                    <li><strong>Message Events</strong> - queued, sent, delivered, failed, etc.</li>
                </ul>

                <h2>Server Status:</h2>
                <p>✅ Server is running</p>
                <p>📡 Database: SQLite connected</p>
                <p>🕒 Current time: ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
    `);
});

// Get callback URL in JSON format
app.get('/callback-url', (req, res) => {
    const callbackUrl = `${req.protocol}://${req.get('host')}/webhook`;
    res.json({
        success: true,
        callback_url: callbackUrl,
        timestamp: new Date().toISOString(),
        provider: "GMS (Global Message Services)"
    });
});

// Test page for webhook
app.get('/test-webhook', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test GMS Webhook</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .container { max-width: 600px; margin: 0 auto; }
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; font-weight: bold; }
                input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
                button { background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
                button:hover { background: #5a67d8; }
                .result { margin-top: 20px; padding: 10px; background: #f0f0f0; border-radius: 4px; white-space: pre-wrap; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Test GMS Webhook</h1>
                <p>Send a test webhook to your server</p>
                
                <form id="webhookForm">
                    <div class="form-group">
                        <label>Event Type:</label>
                        <select id="eventType">
                            <option value="message.status">Message Status</option>
                            <option value="message.inbound">Inbound Message</option>
                            <option value="message.delivered">Message Delivered</option>
                            <option value="message.failed">Message Failed</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Message ID:</label>
                        <input type="text" id="messageId" value="msg_${Date.now()}" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label>From Number:</label>
                        <input type="text" id="fromNumber" value="+1234567890">
                    </div>
                    
                    <div class="form-group">
                        <label>To Number:</label>
                        <input type="text" id="toNumber" value="+0987654321">
                    </div>
                    
                    <div class="form-group">
                        <label>Status:</label>
                        <select id="status">
                            <option value="sent">Sent</option>
                            <option value="delivered">Delivered</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Message Content:</label>
                        <textarea id="content" rows="3">Test message from GMS</textarea>
                    </div>
                    
                    <button type="submit">Send Test Webhook</button>
                </form>
                
                <div id="result" class="result"></div>
            </div>
            
            <script>
                document.getElementById('webhookForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const payload = {
                        eventType: document.getElementById('eventType').value,
                        messageId: document.getElementById('messageId').value,
                        from: document.getElementById('fromNumber').value,
                        to: document.getElementById('toNumber').value,
                        status: document.getElementById('status').value,
                        content: document.getElementById('content').value,
                        timestamp: new Date().toISOString()
                    };
                    
                    try {
                        const response = await fetch('/webhook', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        
                        const text = await response.text();
                        document.getElementById('result').innerHTML = 
                            '<h3>Response:</h3>' + 
                            '<p>Status: ' + response.status + '</p>' +
                            '<p>Response: ' + text + '</p>' +
                            '<h3>Payload Sent:</h3>' +
                            '<pre>' + JSON.stringify(payload, null, 2) + '</pre>';
                    } catch (error) {
                        document.getElementById('result').innerHTML = 'Error: ' + error.message;
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// Main webhook endpoint for GMS
app.post('/webhook', (req, res) => {
    console.log('=== GMS Webhook Received ===');
    console.log('Time:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Extract common fields (GMS specific payload structure)
    const payload = req.body;
    
    // Try to determine event type based on common GMS patterns
    let eventType = payload.eventType || payload.type || payload.event || 'unknown';
    let messageId = payload.messageId || payload.message_id || payload.id || null;
    let fromNumber = payload.from || payload.source || payload.sender || null;
    let toNumber = payload.to || payload.destination || payload.recipient || null;
    let status = payload.status || payload.deliveryStatus || payload.state || null;
    let direction = payload.direction || (fromNumber ? 'outbound' : 'inbound');
    
    // Store in database
    const stmt = db.prepare(`
        INSERT INTO webhook_events 
        (event_type, message_id, from_number, to_number, direction, status, raw_payload)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
        eventType,
        messageId,
        fromNumber,
        toNumber,
        direction,
        status,
        JSON.stringify(payload)
    );

    stmt.finalize();

    // Update message logs if this is a message-related event
    if (messageId) {
        updateMessageLog(messageId, eventType, fromNumber, toNumber, direction, status, payload);
    }

    // Always return 200 OK
    res.status(200).send('OK');
});

// Helper function to update message logs
function updateMessageLog(messageId, eventType, fromNumber, toNumber, direction, status, payload) {
    // Check if message exists
    db.get('SELECT * FROM message_logs WHERE message_id = ?', [messageId], (err, row) => {
        if (err) {
            console.error('Error checking message log:', err);
            return;
        }

        if (!row) {
            // New message
            db.run(`
                INSERT INTO message_logs 
                (message_id, from_number, to_number, direction, message_content, message_type, status, sent_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                messageId, 
                fromNumber, 
                toNumber, 
                direction, 
                payload.content || payload.text || payload.message || null,
                payload.type || payload.messageType || 'sms',
                status || 'pending',
                new Date().toISOString()
            ]);
        } else {
            // Update existing message
            if (status === 'delivered' || status === 'DELIVRD') {
                db.run(`
                    UPDATE message_logs 
                    SET status = ?, delivered_time = ?
                    WHERE message_id = ?
                `, ['delivered', new Date().toISOString(), messageId]);
            } else if (status === 'failed' || status === 'REJECTED') {
                db.run(`
                    UPDATE message_logs 
                    SET status = ?
                    WHERE message_id = ?
                `, ['failed', messageId]);
            } else if (status === 'sent') {
                db.run(`
                    UPDATE message_logs 
                    SET status = ?
                    WHERE message_id = ?
                `, ['sent', messageId]);
            }
        }
    });
}

// View all webhook events
app.get('/events', (req, res) => {
    const limit = req.query.limit || 100;
    
    db.all('SELECT * FROM webhook_events ORDER BY received_at DESC LIMIT ?', [limit], (err, rows) => {
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

// View message logs
app.get('/messages', (req, res) => {
    const limit = req.query.limit || 50;
    
    db.all('SELECT * FROM message_logs ORDER BY created_at DESC LIMIT ?', [limit], (err, rows) => {
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

// Get message by ID
app.get('/messages/:messageId', (req, res) => {
    db.get('SELECT * FROM message_logs WHERE message_id = ?', [req.params.messageId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Message not found' });
        }
        res.json({
            success: true,
            message: row
        });
    });
});

// Get statistics
app.get('/stats', (req, res) => {
    const stats = {};
    
    db.serialize(() => {
        // Total events
        db.get('SELECT COUNT(*) as total FROM webhook_events', [], (err, row) => {
            stats.totalEvents = row.total;
        });
        
        // Events by type
        db.all('SELECT event_type, COUNT(*) as count FROM webhook_events GROUP BY event_type', [], (err, rows) => {
            stats.eventsByType = rows;
        });
        
        // Message statistics
        db.get(`
            SELECT 
                COUNT(*) as totalMessages,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as deliveredMessages,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedMessages,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingMessages,
                SUM(CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END) as inboundMessages,
                SUM(CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END) as outboundMessages
            FROM message_logs
        `, [], (err, row) => {
            stats.messageStats = row;
        });
        
        // Recent activity
        db.get('SELECT MAX(received_at) as lastEvent FROM webhook_events', [], (err, row) => {
            stats.lastEvent = row.lastEvent;
            
            // Send response after all queries are done
            setTimeout(() => {
                res.json({
                    success: true,
                    timestamp: new Date().toISOString(),
                    provider: "GMS (Global Message Services)",
                    stats: stats
                });
            }, 100);
        });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log('\n=== GMS Webhook Server ===');
    console.log(`Server running on port ${PORT}`);
    console.log(`Local URL: http://localhost:${PORT}`);
    console.log(`\n📋 Your callback URL endpoint:`);
    console.log(`   POST http://localhost:${PORT}/webhook`);
    console.log(`\n📊 Management endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/events - View webhook events`);
    console.log(`   GET  http://localhost:${PORT}/messages - View message logs`);
    console.log(`   GET  http://localhost:${PORT}/stats - View statistics`);
    console.log(`   GET  http://localhost:${PORT}/callback-url - Get callback URL`);
    console.log(`   GET  http://localhost:${PORT}/test-webhook - Test page`);
    
    console.log('\n🌐 To expose this to the internet (for GMS):');
    console.log('   npx ngrok http 3000');
    console.log('\n📥 Waiting for GMS webhooks...\n');
});