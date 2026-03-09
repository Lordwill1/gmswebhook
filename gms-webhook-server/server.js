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
            <!-- Optional: Add Font Awesome for icons -->
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
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
                .btn { display: inline-block; background: #667eea; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; margin-right: 10px; }
                .btn:hover { background: #5a67d8; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>GMS Webhook Server</h1>
                    <p>Global Message Services Integration [Fabletics]</p>
                </div>
                
                <div class="url-box">
                    <h2>Your Callback URL:</h2>
                    <div class="url">${callbackUrl}</div>
                    <p><small>Use this URL in your GMS application settings for message status callbacks</small></p>
                </div>

                <div class="nav">
                    <a href="/view-events" class="btn">View Events</a>
                    <a href="/view-messages" class="btn">View Messages</a>
                    <a href="/stats" class="btn">Statistics</a>
                    <a href="/test-webhook" class="btn">Test Webhook</a>
                    <a href="/health" class="btn">Health Check</a>
                </div>

                <h2>Available Endpoints:</h2>
                <ul>
                    <li><code>GET /</code> - This page</li>
                    <li><code>POST /webhook</code> - Main webhook endpoint for GMS</li>
                    <li><code>GET /events</code> - View all webhook events (JSON)</li>
                    <li><code>GET /view-events</code> - View events in browser (HTML)</li>
                    <li><code>GET /messages</code> - View message logs (JSON)</li>
                    <li><code>GET /view-messages</code> - View messages in browser (HTML)</li>
                    <li><code>GET /messages/:id</code> - Get specific message</li>
                    <li><code>GET /stats</code> - View statistics</li>
                    <li><code>GET /callback-url</code> - Get callback URL in JSON format</li>
                    <li><code>GET /test-webhook</code> - Test page for sending sample webhooks</li>
                    <li><code>GET /health</code> - Health check endpoint</li>
                </ul>

                <h2>GMS Webhook Formats Accepted:</h2>
                <ul>
                    <li><strong>Message Status</strong> - delivery reports, status updates</li>
                    <li><strong>Inbound Messages</strong> - received SMS/MMS</li>
                    <li><strong>Message Events</strong> - queued, sent, delivered, failed, etc.</li>
                </ul>

<!-- Status section -->
<h2><i class="fas fa-heartbeat" style="color: #ff6b6b; margin-right: 10px;"></i>System Health</h2>
<div style="background: white; border-radius: 15px; padding: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-top: 20px;">
    
    <!-- Server Status Bar -->
    <div style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="width: 100px; font-weight: 600; color: #555;">
                <i class="fas fa-server" style="margin-right: 5px; color: #4CAF50;"></i> Server:
            </span>
            <span style="color: #4CAF50; margin-right: 10px; font-size: 20px;">●</span>
            <span style="font-weight: 500;">Running</span>
            <span style="margin-left: auto; background: #4CAF50; color: white; padding: 4px 15px; border-radius: 25px; font-size: 12px; font-weight: 600;">
                <i class="fas fa-check-circle" style="margin-right: 5px;"></i>Active
            </span>
        </div>
        <div style="height: 10px; background: #e0e0e0; border-radius: 5px; overflow: hidden;">
            <div style="height: 10px; width: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); border-radius: 5px;"></div>
        </div>
    </div>
    
    <!-- Database Status Bar -->
    <div style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="width: 100px; font-weight: 600; color: #555;">
                <i class="fas fa-database" style="margin-right: 5px; color: #2196F3;"></i> Database:
            </span>
            <span style="color: #4CAF50; margin-right: 10px; font-size: 20px;">●</span>
            <span style="font-weight: 500;">SQLite Connected</span>
            <span style="margin-left: auto; background: #2196F3; color: white; padding: 4px 15px; border-radius: 25px; font-size: 12px; font-weight: 600;">
                <i class="fas fa-plug" style="margin-right: 5px;"></i>Online
            </span>
        </div>
        <div style="height: 10px; background: #e0e0e0; border-radius: 5px; overflow: hidden;">
            <div style="height: 10px; width: 100%; background: linear-gradient(90deg, #2196F3, #64B5F6); border-radius: 5px;"></div>
        </div>
    </div>
    
    <!-- Statistics Row -->
    <div style="display: flex; justify-content: space-between; margin-top: 25px; padding-top: 20px; border-top: 2px dashed #e0e0e0;">
        
        <div style="text-align: center; flex: 1;">
            <div style="background: #f8f9fa; border-radius: 10px; padding: 15px; margin: 0 5px;">
                <i class="fas fa-clock" style="font-size: 24px; color: #ff9800; margin-bottom: 8px;"></i>
                <div style="color: #666; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Current Time</div>
                <div style="font-size: 18px; font-weight: bold; color: #333; margin-top: 5px;">${new Date().toLocaleTimeString()}</div>
                <div style="font-size: 14px; color: #666;">${new Date().toLocaleDateString()}</div>
            </div>
        </div>
        
        <div style="text-align: center; flex: 1;">
            <div style="background: #f8f9fa; border-radius: 10px; padding: 15px; margin: 0 5px;">
                <i class="fas fa-chart-line" style="font-size: 24px; color: #9c27b0; margin-bottom: 8px;"></i>
                <div style="color: #666; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Uptime</div>
                <div style="font-size: 22px; font-weight: bold; color: #9c27b0; margin-top: 5px;">${Math.floor(process.uptime() / 60)} <span style="font-size: 14px;">min</span></div>
                <div style="font-size: 13px; color: #666;">${Math.floor(process.uptime())} seconds</div>
            </div>
        </div>
        
        <div style="text-align: center; flex: 1;">
            <div style="background: #f8f9fa; border-radius: 10px; padding: 15px; margin: 0 5px;">
                <i class="fas fa-check-circle" style="font-size: 24px; color: #4CAF50; margin-bottom: 8px;"></i>
                <div style="color: #666; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Status</div>
                <div style="font-size: 20px; font-weight: bold; color: #4CAF50; margin-top: 8px;">
                    <span style="color: #4CAF50;">●</span> Healthy
                </div>
                <div style="font-size: 13px; color: #666;">All Systems Go</div>
            </div>
        </div>
    </div>
    
    <!-- Optional: Small footer note -->
    <div style="margin-top: 15px; text-align: right; font-size: 12px; color: #999;">
        <i class="fas fa-sync-alt" style="margin-right: 5px;"></i> Auto-refresh every 30s
    </div>
</div>
            </div>
        </body>
        </html>
    `);
});

// View events in browser (HTML format)
app.get('/view-events', (req, res) => {
    const limit = req.query.limit || 20;
    
    db.all('SELECT * FROM webhook_events ORDER BY received_at DESC LIMIT ?', [limit], (err, rows) => {
        if (err) {
            return res.status(500).send('Database error: ' + err.message);
        }
        
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Recent Events - GMS Webhook</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                    .event-row:hover { background-color: #e0e0e0; cursor: pointer; }
                    .nav { margin: 20px 0; }
                    .nav a { margin-right: 15px; color: #667eea; text-decoration: none; }
                    .nav a:hover { text-decoration: underline; }
                    .payload { display: none; background: #f9f9f9; padding: 10px; margin: 5px 0; border-left: 3px solid #667eea; font-family: monospace; white-space: pre-wrap; }
                </style>
                <script>
                    function togglePayload(id) {
                        var element = document.getElementById('payload-' + id);
                        if (element.style.display === 'none' || element.style.display === '') {
                            element.style.display = 'block';
                        } else {
                            element.style.display = 'none';
                        }
                    }
                </script>
            </head>
            <body>
                <h1>Recent Webhook Events</h1>
                <div class="nav">
                    <a href="/">[Back to Home]</a>
                    <a href="/view-events?limit=50">Show 50</a>
                    <a href="/view-events?limit=100">Show 100</a>
                    <a href="/events">View as JSON</a>
                </div>
                
                <table>
                    <tr>
                        <th>ID</th>
                        <th>Event Type</th>
                        <th>Message ID</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Status</th>
                        <th>Received</th>
                    </tr>
        `;
        
        if (rows.length === 0) {
            html += `<tr><td colspan="7" style="text-align: center;">No events yet. Send a test webhook!</td></tr>`;
        } else {
            rows.forEach(row => {
                html += `
                    <tr class="event-row" onclick="togglePayload(${row.id})">
                        <td>${row.id}</td>
                        <td>${row.event_type || '-'}</td>
                        <td>${row.message_id || '-'}</td>
                        <td>${row.from_number || '-'}</td>
                        <td>${row.to_number || '-'}</td>
                        <td>${row.status || '-'}</td>
                        <td>${row.received_at}</td>
                    </tr>
                    <tr id="payload-${row.id}" class="payload">
                        <td colspan="7">
                            <strong>Raw Payload:</strong>
                            <pre>${JSON.stringify(JSON.parse(row.raw_payload || '{}'), null, 2)}</pre>
                        </td>
                    </tr>
                `;
            });
        }
        
        html += `</table>
                <p><small>Click on any row to view the full payload</small></p>
                </body></html>`;
        res.send(html);
    });
});

// View messages in browser (HTML format)
app.get('/view-messages', (req, res) => {
    const limit = req.query.limit || 20;
    
    db.all('SELECT * FROM message_logs ORDER BY created_at DESC LIMIT ?', [limit], (err, rows) => {
        if (err) {
            return res.status(500).send('Database error: ' + err.message);
        }
        
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Message Logs - GMS Webhook</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                    .delivered { color: green; font-weight: bold; }
                    .failed { color: red; font-weight: bold; }
                    .pending { color: orange; font-weight: bold; }
                    .nav { margin: 20px 0; }
                    .nav a { margin-right: 15px; color: #667eea; text-decoration: none; }
                </style>
            </head>
            <body>
                <h1>Message Logs</h1>
                <div class="nav">
                    <a href="/">[Back to Home]</a>
                    <a href="/view-messages?limit=50">Show 50</a>
                    <a href="/view-messages?limit=100">Show 100</a>
                    <a href="/messages">View as JSON</a>
                </div>
                
                <table>
                    <tr>
                        <th>ID</th>
                        <th>Message ID</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Direction</th>
                        <th>Content</th>
                        <th>Status</th>
                        <th>Created</th>
                    </tr>
        `;
        
        if (rows.length === 0) {
            html += `<tr><td colspan="8" style="text-align: center;">No messages yet.</td></tr>`;
        } else {
            rows.forEach(row => {
                const statusClass = row.status === 'delivered' ? 'delivered' : 
                                   row.status === 'failed' ? 'failed' : 'pending';
                
                html += `
                    <tr>
                        <td>${row.id}</td>
                        <td>${row.message_id || '-'}</td>
                        <td>${row.from_number || '-'}</td>
                        <td>${row.to_number || '-'}</td>
                        <td>${row.direction || '-'}</td>
                        <td>${(row.message_content || '').substring(0, 30)}${(row.message_content || '').length > 30 ? '...' : ''}</td>
                        <td class="${statusClass}">${row.status || '-'}</td>
                        <td>${row.created_at}</td>
                    </tr>
                `;
            });
        }
        
        html += `</table></body></html>`;
        res.send(html);
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    db.get('SELECT 1', [], (err) => {
        if (err) {
            return res.status(500).json({ 
                status: 'unhealthy', 
                database: 'disconnected',
                error: err.message
            });
        }
        res.json({ 
            status: 'healthy', 
            database: 'connected',
            uptime: process.uptime(),
            uptime_formatted: Math.floor(process.uptime() / 60) + ' minutes',
            timestamp: new Date().toISOString(),
            endpoints: {
                webhook: '/webhook',
                events: '/events',
                messages: '/messages',
                stats: '/stats'
            }
        });
    });
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
                body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #333; margin-top: 0; }
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
                input, select, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
                input:focus, select:focus, textarea:focus { outline: none; border-color: #667eea; }
                button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; width: 100%; }
                button:hover { opacity: 0.9; }
                .result { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #667eea; }
                pre { background: #e9ecef; padding: 10px; border-radius: 4px; overflow-x: auto; }
                .nav { margin-bottom: 20px; }
                .nav a { color: #667eea; text-decoration: none; }
                .nav a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="nav">
                    <a href="/">[Back to Home]</a>
                </div>
                
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
                        <small style="color: #666;">Auto-generated</small>
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
                        <label>Direction:</label>
                        <select id="direction">
                            <option value="outbound">Outbound</option>
                            <option value="inbound">Inbound</option>
                        </select>
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
                        <textarea id="content" rows="3">Test message from GMS webhook tester</textarea>
                    </div>
                    
                    <button type="submit">Send Test Webhook</button>
                </form>
                
                <div id="result" class="result" style="display: none;"></div>
            </div>
            
            <script>
                document.getElementById('webhookForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const payload = {
                        eventType: document.getElementById('eventType').value,
                        messageId: document.getElementById('messageId').value,
                        from: document.getElementById('fromNumber').value,
                        to: document.getElementById('toNumber').value,
                        direction: document.getElementById('direction').value,
                        status: document.getElementById('status').value,
                        content: document.getElementById('content').value,
                        timestamp: new Date().toISOString()
                    };
                    
                    const resultDiv = document.getElementById('result');
                    resultDiv.innerHTML = '<p>Sending...</p>';
                    resultDiv.style.display = 'block';
                    
                    try {
                        const response = await fetch('/webhook', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        
                        const text = await response.text();
                        
                        resultDiv.innerHTML = 
                            '<h3>Response:</h3>' + 
                            '<p><strong>Status:</strong> ' + response.status + ' ' + response.statusText + '</p>' +
                            '<p><strong>Response:</strong> ' + text + '</p>' +
                            '<h3>Payload Sent:</h3>' +
                            '<pre>' + JSON.stringify(payload, null, 2) + '</pre>' +
                            '<p><a href="/view-events">View Events →</a></p>';
                    } catch (error) {
                        resultDiv.innerHTML = '<h3>Error:</h3><p>' + error.message + '</p>';
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// ========== FIXED WEBHOOK ENDPOINT ==========
// Main webhook endpoint for GMS/Bandwidth
app.post('/webhook', (req, res) => {
    console.log('=== GMS Webhook Received ===');
    console.log('Time:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // Check if payload is an array (Bandwidth sends array)
    const payload = req.body;
    console.log('Payload type:', Array.isArray(payload) ? 'Array' : 'Object');
    console.log('Raw Body:', JSON.stringify(payload, null, 2));

    // Handle both array and single object
    const events = Array.isArray(payload) ? payload : [payload];
    
    events.forEach(event => {
        // Extract fields based on Bandwidth's structure
        let eventType = event.type || 'unknown';
        let messageId = event.message?.id || event.messageId || null;
        let fromNumber = event.message?.from || event.from || null;
        
        // Handle 'to' field which could be array or string
        let toNumber = null;
        if (event.message?.to) {
            toNumber = Array.isArray(event.message.to) ? event.message.to[0] : event.message.to;
        } else {
            toNumber = event.to || null;
        }
        
        let status = event.type?.replace('message-', '') || event.status || null;
        let direction = event.message?.direction || event.direction || null;
        
        // Determine direction if not provided
        if (!direction) {
            // If from number is our own number, it's outbound
            direction = (fromNumber === '+12135373887' ? 'outbound' : 'inbound');
        }

        console.log('Processed Event:', {
            eventType,
            messageId,
            fromNumber,
            toNumber,
            direction,
            status
        });

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
            JSON.stringify(event)  // Store individual event, not the whole array
        );

        stmt.finalize();

        // Update message logs if this is a message-related event
        if (messageId) {
            updateMessageLog(messageId, eventType, fromNumber, toNumber, direction, status, event);
        }
    });

    // Always return 200 OK
    res.status(200).send('OK');
});
// ========== END FIXED WEBHOOK ENDPOINT ==========

// ========== UPDATED HELPER FUNCTION ==========
// Helper function to update message logs
function updateMessageLog(messageId, eventType, fromNumber, toNumber, direction, status, payload) {
    // Check if message exists
    db.get('SELECT * FROM message_logs WHERE message_id = ?', [messageId], (err, row) => {
        if (err) {
            console.error('Error checking message log:', err);
            return;
        }

        // Extract message content
        let messageContent = payload.message?.text || payload.text || payload.content || '';
        
        // Handle empty text (like in your example)
        if (messageContent === '') {
            messageContent = '[No text content]';
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
                messageContent,
                'sms',  // Default to sms
                status || 'pending',
                payload.message?.time || payload.time || new Date().toISOString()
            ], function(err) {
                if (err) {
                    console.error('Error inserting message log:', err);
                } else {
                    console.log('Message log created for:', messageId);
                }
            });
        } else {
            // Update existing message based on event type
            if (eventType === 'message-delivered' || status === 'delivered') {
                db.run(`
                    UPDATE message_logs 
                    SET status = ?, delivered_time = ?
                    WHERE message_id = ?
                `, ['delivered', payload.time || new Date().toISOString(), messageId], function(err) {
                    if (err) {
                        console.error('Error updating message log:', err);
                    } else {
                        console.log('Message status updated to delivered:', messageId);
                    }
                });
            } else if (eventType === 'message-failed' || status === 'failed' || status === 'REJECTED') {
                db.run(`
                    UPDATE message_logs 
                    SET status = ?
                    WHERE message_id = ?
                `, ['failed', messageId]);
            } else if (eventType === 'message-sent' || status === 'sent') {
                db.run(`
                    UPDATE message_logs 
                    SET status = ?
                    WHERE message_id = ?
                `, ['sent', messageId]);
            }
        }
    });
}
// ========== END UPDATED HELPER FUNCTION ==========

// View all webhook events (JSON)
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

// View message logs (JSON)
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
            stats.totalEvents = row ? row.total : 0;
        });
        
        // Events by type
        db.all('SELECT event_type, COUNT(*) as count FROM webhook_events GROUP BY event_type', [], (err, rows) => {
            stats.eventsByType = rows || [];
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
            stats.messageStats = row || {
                totalMessages: 0,
                deliveredMessages: 0,
                failedMessages: 0,
                pendingMessages: 0,
                inboundMessages: 0,
                outboundMessages: 0
            };
        });
        
        // Recent activity
        db.get('SELECT MAX(received_at) as lastEvent FROM webhook_events', [], (err, row) => {
            stats.lastEvent = row ? row.lastEvent : null;
            
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
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not found',
        message: `Endpoint ${req.method} ${req.url} does not exist`
    });
});

// Start server
app.listen(PORT, () => {
    console.log('\n=== GMS Webhook Server ===');
    console.log(`Server running on port ${PORT}`);
    console.log(`Local URL: http://localhost:${PORT}`);
    console.log(`\nYour callback URL endpoint:`);
    console.log(`   POST http://localhost:${PORT}/webhook`);
    console.log(`\nManagement endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/ - Home page`);
    console.log(`   GET  http://localhost:${PORT}/view-events - View events in browser`);
    console.log(`   GET  http://localhost:${PORT}/view-messages - View messages in browser`);
    console.log(`   GET  http://localhost:${PORT}/events - View webhook events (JSON)`);
    console.log(`   GET  http://localhost:${PORT}/messages - View message logs (JSON)`);
    console.log(`   GET  http://localhost:${PORT}/stats - View statistics`);
    console.log(`   GET  http://localhost:${PORT}/callback-url - Get callback URL`);
    console.log(`   GET  http://localhost:${PORT}/test-webhook - Test page`);
    console.log(`   GET  http://localhost:${PORT}/health - Health check`);
    
    console.log('\nTo expose this to the internet (for GMS):');
    console.log('   npx ngrok http 3000');
    console.log('\nWaiting for GMS webhooks...\n');
});