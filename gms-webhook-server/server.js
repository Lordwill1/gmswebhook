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

// Professional Home Page with Modern UI
app.get('/', (req, res) => {
    const callbackUrl = `${req.protocol}://${req.get('host')}/webhook`;
    
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>GMS Webhook Server | Fabletics Integration</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Inter', sans-serif;
                    background: #f8fafc;
                    color: #1e293b;
                    line-height: 1.6;
                }

                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                /* Header */
                .header {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    color: white;
                    padding: 3rem 2rem;
                    border-radius: 1.5rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                    position: relative;
                    overflow: hidden;
                }

                .header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 300px;
                    height: 300px;
                    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                    border-radius: 50%;
                    opacity: 0.1;
                    transform: translate(100px, -100px);
                }

                .header h1 {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    position: relative;
                }

                .header p {
                    font-size: 1.1rem;
                    color: #cbd5e1;
                    position: relative;
                }

                .header .badge {
                    display: inline-block;
                    background: rgba(255,255,255,0.1);
                    padding: 0.25rem 1rem;
                    border-radius: 2rem;
                    font-size: 0.875rem;
                    margin-top: 1rem;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                /* Callback URL Card */
                .callback-card {
                    background: white;
                    border-radius: 1rem;
                    padding: 2rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1);
                    border: 1px solid #e2e8f0;
                }

                .callback-card h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #0f172a;
                }

                .callback-card h2 i {
                    color: #3b82f6;
                }

                .url-container {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    background: #f1f5f9;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.75rem;
                    border: 1px solid #e2e8f0;
                }

                .url {
                    flex: 1;
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 1rem;
                    color: #2563eb;
                    word-break: break-all;
                }

                .copy-btn {
                    background: white;
                    border: 1px solid #e2e8f0;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                }

                .copy-btn:hover {
                    background: #f8fafc;
                    border-color: #94a3b8;
                }

                /* Navigation */
                .nav-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .nav-card {
                    background: white;
                    border-radius: 0.75rem;
                    padding: 1.5rem;
                    text-decoration: none;
                    color: #1e293b;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                }

                .nav-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                    border-color: #3b82f6;
                }

                .nav-card i {
                    font-size: 2rem;
                }

                .nav-card span {
                    font-weight: 600;
                }

                .nav-card small {
                    color: #64748b;
                    font-size: 0.75rem;
                }

                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin: 2rem 0;
                }

                .stat-card {
                    background: white;
                    border-radius: 1rem;
                    padding: 1.5rem;
                    box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);
                    border: 1px solid #e2e8f0;
                }

                .stat-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }

                .stat-icon.server { background: #dbeafe; color: #2563eb; }
                .stat-icon.database { background: #dcfce7; color: #16a34a; }
                .stat-icon.uptime { background: #fef9c3; color: #ca8a04; }
                .stat-icon.status { background: #f3e8ff; color: #9333ea; }

                .stat-title {
                    font-size: 0.875rem;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #0f172a;
                }

                /* Progress Bar */
                .progress-bar {
                    width: 100%;
                    height: 8px;
                    background: #e2e8f0;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 1rem;
                }

                .progress-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }

                .progress-fill.server { background: linear-gradient(90deg, #2563eb, #3b82f6); width: 100%; }
                .progress-fill.database { background: linear-gradient(90deg, #16a34a, #22c55e); width: 100%; }

                /* Endpoints Section */
                .endpoints-section {
                    background: white;
                    border-radius: 1rem;
                    padding: 2rem;
                    margin: 2rem 0;
                    border: 1px solid #e2e8f0;
                }

                .section-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .endpoint-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .endpoint-table th {
                    text-align: left;
                    padding: 0.75rem;
                    background: #f8fafc;
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: #475569;
                    border-bottom: 2px solid #e2e8f0;
                }

                .endpoint-table td {
                    padding: 0.75rem;
                    border-bottom: 1px solid #e2e8f0;
                    font-size: 0.875rem;
                }

                .endpoint-table code {
                    background: #f1f5f9;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 0.75rem;
                    color: #2563eb;
                }

                .method-badge {
                    display: inline-block;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    font-weight: 600;
                    font-size: 0.75rem;
                }

                .method-badge.get { background: #dbeafe; color: #2563eb; }
                .method-badge.post { background: #dcfce7; color: #16a34a; }

                /* Footer */
                .footer {
                    text-align: center;
                    padding: 2rem;
                    color: #64748b;
                    font-size: 0.875rem;
                    border-top: 1px solid #e2e8f0;
                    margin-top: 2rem;
                }

                .footer i {
                    color: #ef4444;
                }

                /* Status Badge */
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.25rem 0.75rem;
                    border-radius: 2rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .status-badge.success { background: #dcfce7; color: #166534; }
                .status-badge.warning { background: #fef9c3; color: #854d0e; }
                .status-badge i { font-size: 0.5rem; }

                /* Responsive */
                @media (max-width: 768px) {
                    .container { padding: 1rem; }
                    .header h1 { font-size: 1.8rem; }
                    .url-container { flex-direction: column; }
                    .copy-btn { width: 100%; justify-content: center; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Header -->
                <div class="header">
                    <h1>GMS Webhook Server</h1>
                    <p>Enterprise Message Integration for Fabletics</p>
                    <span class="badge">
                        <i class="fas fa-shield-alt" style="margin-right: 0.5rem;"></i>
                        Production Ready • v2.0
                    </span>
                </div>

                <!-- Callback URL Card -->
                <div class="callback-card">
                    <h2>
                        <i class="fas fa-link"></i>
                        Callback Endpoint
                    </h2>
                    <div class="url-container">
                        <span class="url" id="callbackUrl">${callbackUrl}</span>
                        <button class="copy-btn" onclick="copyToClipboard()">
                            <i class="far fa-copy"></i>
                            Copy
                        </button>
                    </div>
                    <p style="margin-top: 1rem; color: #64748b; font-size: 0.875rem;">
                        <i class="fas fa-info-circle"></i>
                        Configure this URL in your Bandwidth application settings for message status callbacks
                    </p>
                </div>

                <!-- Navigation Grid -->
                <div class="nav-grid">
                    <a href="/view-events" class="nav-card">
                        <i class="fas fa-list-ul" style="color: #3b82f6;"></i>
                        <span>Events</span>
                        <small>View webhook events</small>
                    </a>
                    <a href="/view-messages" class="nav-card">
                        <i class="fas fa-envelope" style="color: #16a34a;"></i>
                        <span>Messages</span>
                        <small>Message logs</small>
                    </a>
                    <a href="/stats" class="nav-card">
                        <i class="fas fa-chart-pie" style="color: #9333ea;"></i>
                        <span>Analytics</span>
                        <small>Statistics</small>
                    </a>
                    <a href="/test-webhook" class="nav-card">
                        <i class="fas fa-flask" style="color: #ea580c;"></i>
                        <span>Test</span>
                        <small>Webhook simulator</small>
                    </a>
                    <a href="/health" class="nav-card">
                        <i class="fas fa-heartbeat" style="color: #ef4444;"></i>
                        <span>Health</span>
                        <small>System status</small>
                    </a>
                    <a href="/export-data" class="nav-card">
                        <i class="fas fa-download" style="color: #0891b2;"></i>
                        <span>Export</span>
                        <small>Backup data</small>
                    </a>
                </div>

                <!-- System Health Dashboard -->
                <h2 class="section-title">
                    <i class="fas fa-heartbeat" style="color: #ef4444;"></i>
                    System Health
                </h2>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon server">
                                <i class="fas fa-server"></i>
                            </div>
                            <div>
                                <div class="stat-title">Server Status</div>
                                <div class="stat-value">
                                    <span class="status-badge success">
                                        <i class="fas fa-circle"></i>
                                        Operational
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill server" style="width: 100%;"></div>
                        </div>
                        <p style="margin-top: 0.75rem; color: #475569; font-size: 0.875rem;">
                            <i class="far fa-clock"></i> Running since ${new Date(Date.now() - process.uptime() * 1000).toLocaleTimeString()}
                        </p>
                    </div>

                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon database">
                                <i class="fas fa-database"></i>
                            </div>
                            <div>
                                <div class="stat-title">Database</div>
                                <div class="stat-value">
                                    <span class="status-badge success">
                                        <i class="fas fa-circle"></i>
                                        Connected
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill database" style="width: 100%;"></div>
                        </div>
                        <p style="margin-top: 0.75rem; color: #475569; font-size: 0.875rem;">
                            <i class="fas fa-table"></i> SQLite • Ephemeral Storage
                        </p>
                    </div>

                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon uptime">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div>
                                <div class="stat-title">Uptime</div>
                                <div class="stat-value">${Math.floor(process.uptime() / 60)} <span style="font-size: 0.875rem;">minutes</span></div>
                            </div>
                        </div>
                        <p style="margin-top: 1rem; color: #475569; font-size: 0.875rem;">
                            <i class="fas fa-hourglass-half"></i> ${Math.floor(process.uptime())} seconds total
                        </p>
                    </div>

                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon status">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div>
                                <div class="stat-title">System Status</div>
                                <div class="stat-value">
                                    <span class="status-badge success">
                                        <i class="fas fa-circle"></i>
                                        Healthy
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p style="margin-top: 1rem; color: #475569; font-size: 0.875rem;">
                            <i class="fas fa-bolt"></i> All systems operational
                        </p>
                    </div>
                </div>

                <!-- Quick Stats from Database -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 1rem 0;">
                    <div style="background: #f8fafc; padding: 1rem; border-radius: 0.75rem; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #0f172a;" id="eventCount">0</div>
                        <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Total Events</div>
                    </div>
                    <div style="background: #f8fafc; padding: 1rem; border-radius: 0.75rem; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #0f172a;" id="messageCount">0</div>
                        <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Messages</div>
                    </div>
                    <div style="background: #f8fafc; padding: 1rem; border-radius: 0.75rem; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #0f172a;" id="deliveredCount">0</div>
                        <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Delivered</div>
                    </div>
                    <div style="background: #f8fafc; padding: 1rem; border-radius: 0.75rem; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #0f172a;" id="pendingCount">0</div>
                        <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Pending</div>
                    </div>
                </div>

                <script>
                    // Fetch and update stats
                    async function updateStats() {
                        try {
                            const response = await fetch('/stats');
                            const data = await response.json();
                            
                            document.getElementById('eventCount').textContent = data.stats.totalEvents || 0;
                            document.getElementById('messageCount').textContent = data.stats.messageStats?.totalMessages || 0;
                            document.getElementById('deliveredCount').textContent = data.stats.messageStats?.deliveredMessages || 0;
                            document.getElementById('pendingCount').textContent = data.stats.messageStats?.pendingMessages || 0;
                        } catch (e) {
                            console.error('Failed to fetch stats');
                        }
                    }

                    updateStats();
                    setInterval(updateStats, 10000); // Update every 10 seconds

                    // Copy to clipboard function
                    function copyToClipboard() {
                        const url = document.getElementById('callbackUrl').textContent;
                        navigator.clipboard.writeText(url).then(() => {
                            const btn = document.querySelector('.copy-btn');
                            const originalText = btn.innerHTML;
                            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                            setTimeout(() => {
                                btn.innerHTML = originalText;
                            }, 2000);
                        });
                    }
                </script>

                <!-- Endpoints Documentation -->
                <div class="endpoints-section">
                    <h2 class="section-title">
                        <i class="fas fa-code"></i>
                        API Endpoints
                    </h2>
                    <table class="endpoint-table">
                        <thead>
                            <tr>
                                <th>Method</th>
                                <th>Endpoint</th>
                                <th>Description</th>
                                <th>Format</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><span class="method-badge post">POST</span></td>
                                <td><code>/webhook</code></td>
                                <td>Main webhook receiver for Bandwidth</td>
                                <td>JSON</td>
                            </tr>
                            <tr>
                                <td><span class="method-badge get">GET</span></td>
                                <td><code>/events</code></td>
                                <td>View all webhook events</td>
                                <td>JSON</td>
                            </tr>
                            <tr>
                                <td><span class="method-badge get">GET</span></td>
                                <td><code>/view-events</code></td>
                                <td>View events in browser</td>
                                <td>HTML</td>
                            </tr>
                            <tr>
                                <td><span class="method-badge get">GET</span></td>
                                <td><code>/messages</code></td>
                                <td>View message logs</td>
                                <td>JSON</td>
                            </tr>
                            <tr>
                                <td><span class="method-badge get">GET</span></td>
                                <td><code>/view-messages</code></td>
                                <td>View messages in browser</td>
                                <td>HTML</td>
                            </tr>
                            <tr>
                                <td><span class="method-badge get">GET</span></td>
                                <td><code>/stats</code></td>
                                <td>System statistics</td>
                                <td>JSON</td>
                            </tr>
                            <tr>
                                <td><span class="method-badge get">GET</span></td>
                                <td><code>/health</code></td>
                                <td>Health check endpoint</td>
                                <td>JSON</td>
                            </tr>
                            <tr>
                                <td><span class="method-badge get">GET</span></td>
                                <td><code>/test-webhook</code></td>
                                <td>Webhook testing interface</td>
                                <td>HTML</td>
                            </tr>
                            <tr>
                                <td><span class="method-badge get">GET</span></td>
                                <td><code>/export-data</code></td>
                                <td>Export all data as JSON</td>
                                <td>JSON</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <p>
                        <i class="fas fa-heart"></i> 
                        GMS Webhook Server • Fabletics Integration • v2.0
                    </p>
                    <p style="margin-top: 0.5rem;">
                        <i class="fas fa-clock"></i> Server Time: ${new Date().toLocaleString()} • 
                        <i class="fas fa-database"></i> Ephemeral Storage (Render Free Tier)
                    </p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// View events in browser with enhanced UI
app.get('/view-events', (req, res) => {
    const limit = req.query.limit || 50;
    
    db.all('SELECT * FROM webhook_events ORDER BY received_at DESC LIMIT ?', [limit], (err, rows) => {
        if (err) {
            return res.status(500).send('Database error: ' + err.message);
        }
        
        let html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Webhook Events | GMS Server</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; }
                    .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
                    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                    .header h1 { font-size: 1.8rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
                    .header h1 i { color: #3b82f6; }
                    .nav-links { display: flex; gap: 1rem; }
                    .nav-link { padding: 0.5rem 1rem; border-radius: 0.5rem; text-decoration: none; color: #475569; transition: all 0.2s; }
                    .nav-link:hover { background: white; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                    .nav-link.active { background: #3b82f6; color: white; }
                    .table-container { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
                    table { width: 100%; border-collapse: collapse; }
                    th { text-align: left; padding: 1rem; background: #f8fafc; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
                    td { padding: 1rem; border-bottom: 1px solid #e2e8f0; }
                    tr { cursor: pointer; transition: background 0.2s; }
                    tr:hover { background: #f1f5f9; }
                    .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 600; }
                    .badge.delivered { background: #dcfce7; color: #166534; }
                    .badge.failed { background: #fee2e2; color: #991b1b; }
                    .badge.pending { background: #fef9c3; color: #854d0e; }
                    .badge.sent { background: #dbeafe; color: #1e40af; }
                    .payload-view { display: none; background: #0f172a; color: #e2e8f0; padding: 1.5rem; border-radius: 0.5rem; margin-top: 0.5rem; }
                    .payload-view pre { background: #1e293b; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; font-family: 'Monaco', monospace; font-size: 0.85rem; }
                    .payload-view.show { display: table-row; }
                    .empty-state { text-align: center; padding: 3rem; color: #94a3b8; }
                    .empty-state i { font-size: 3rem; margin-bottom: 1rem; }
                    .filter-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; align-items: center; }
                    .limit-select { padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; background: white; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>
                            <i class="fas fa-list-ul"></i>
                            Webhook Events
                        </h1>
                        <div class="nav-links">
                            <a href="/" class="nav-link"><i class="fas fa-home"></i> Home</a>
                            <a href="/view-events?limit=25" class="nav-link ${limit == 25 ? 'active' : ''}">25</a>
                            <a href="/view-events?limit=50" class="nav-link ${limit == 50 ? 'active' : ''}">50</a>
                            <a href="/view-events?limit=100" class="nav-link ${limit == 100 ? 'active' : ''}">100</a>
                            <a href="/events" class="nav-link"><i class="fas fa-code"></i> JSON</a>
                        </div>
                    </div>

                    <div class="table-container">
                        <div class="filter-bar">
                            <i class="fas fa-filter" style="color: #64748b;"></i>
                            <span style="color: #475569;">${rows.length} events found</span>
                            <select class="limit-select" onchange="window.location.href = '/view-events?limit=' + this.value">
                                <option value="25" ${limit == 25 ? 'selected' : ''}>Show 25</option>
                                <option value="50" ${limit == 50 ? 'selected' : ''}>Show 50</option>
                                <option value="100" ${limit == 100 ? 'selected' : ''}>Show 100</option>
                                <option value="250" ${limit == 250 ? 'selected' : ''}>Show 250</option>
                            </select>
                        </div>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Event Type</th>
                                    <th>Message ID</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Status</th>
                                    <th>Received</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        if (rows.length === 0) {
            html += `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>No Events Yet</h3>
                        <p>Send a test webhook or wait for Bandwidth to send events</p>
                        <a href="/test-webhook" style="display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 0.5rem;">
                            <i class="fas fa-flask"></i> Test Webhook
                        </a>
                    </td>
                </tr>
            `;
        } else {
            rows.forEach(row => {
                let badgeClass = 'pending';
                if (row.status === 'delivered') badgeClass = 'delivered';
                else if (row.status === 'failed') badgeClass = 'failed';
                else if (row.status === 'sent') badgeClass = 'sent';
                
                html += `
                    <tr onclick="togglePayload(${row.id})">
                        <td>#${row.id}</td>
                        <td><span class="badge ${badgeClass}">${row.event_type || '-'}</span></td>
                        <td><code style="background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">${row.message_id ? row.message_id.substring(0, 20) + '...' : '-'}</code></td>
                        <td>${row.from_number || '-'}</td>
                        <td>${row.to_number || '-'}</td>
                        <td><span class="badge ${badgeClass}">${row.status || '-'}</span></td>
                        <td><i class="far fa-clock" style="margin-right: 0.25rem;"></i>${new Date(row.received_at).toLocaleString()}</td>
                    </tr>
                    <tr id="payload-${row.id}" class="payload-view">
                        <td colspan="7">
                            <strong style="display: block; margin-bottom: 0.5rem; color: #94a3b8;">
                                <i class="fas fa-code"></i> Raw Payload:
                            </strong>
                            <pre>${JSON.stringify(JSON.parse(row.raw_payload || '{}'), null, 2)}</pre>
                        </td>
                    </tr>
                `;
            });
        }
        
        html += `
                            </tbody>
                        </table>
                    </div>

                    <div style="margin-top: 1rem; text-align: right; color: #64748b; font-size: 0.875rem;">
                        <i class="fas fa-info-circle"></i> Click any row to view the full payload
                    </div>
                </div>

                <script>
                    function togglePayload(id) {
                        const element = document.getElementById('payload-' + id);
                        element.classList.toggle('show');
                    }
                </script>
            </body>
            </html>
        `;
        
        res.send(html);
    });
});

// View messages in browser with enhanced UI
app.get('/view-messages', (req, res) => {
    const limit = req.query.limit || 50;
    
    db.all('SELECT * FROM message_logs ORDER BY created_at DESC LIMIT ?', [limit], (err, rows) => {
        if (err) {
            return res.status(500).send('Database error: ' + err.message);
        }
        
        let html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Message Logs | GMS Server</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; }
                    .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
                    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                    .header h1 { font-size: 1.8rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
                    .header h1 i { color: #16a34a; }
                    .nav-links { display: flex; gap: 1rem; }
                    .nav-link { padding: 0.5rem 1rem; border-radius: 0.5rem; text-decoration: none; color: #475569; transition: all 0.2s; }
                    .nav-link:hover { background: white; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                    .nav-link.active { background: #16a34a; color: white; }
                    .table-container { background: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
                    table { width: 100%; border-collapse: collapse; }
                    th { text-align: left; padding: 1rem; background: #f8fafc; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
                    td { padding: 1rem; border-bottom: 1px solid #e2e8f0; }
                    .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 600; }
                    .badge.delivered { background: #dcfce7; color: #166534; }
                    .badge.failed { background: #fee2e2; color: #991b1b; }
                    .badge.pending { background: #fef9c3; color: #854d0e; }
                    .badge.sent { background: #dbeafe; color: #1e40af; }
                    .badge.inbound { background: #f3e8ff; color: #6b21a8; }
                    .badge.outbound { background: #dbeafe; color: #1e40af; }
                    .empty-state { text-align: center; padding: 3rem; color: #94a3b8; }
                    .empty-state i { font-size: 3rem; margin-bottom: 1rem; }
                    .message-preview { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>
                            <i class="fas fa-envelope"></i>
                            Message Logs
                        </h1>
                        <div class="nav-links">
                            <a href="/" class="nav-link"><i class="fas fa-home"></i> Home</a>
                            <a href="/view-messages?limit=25" class="nav-link ${limit == 25 ? 'active' : ''}">25</a>
                            <a href="/view-messages?limit=50" class="nav-link ${limit == 50 ? 'active' : ''}">50</a>
                            <a href="/view-messages?limit=100" class="nav-link ${limit == 100 ? 'active' : ''}">100</a>
                            <a href="/messages" class="nav-link"><i class="fas fa-code"></i> JSON</a>
                        </div>
                    </div>

                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Message ID</th>
                                    <th>Direction</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Content</th>
                                    <th>Status</th>
                                    <th>Sent</th>
                                    <th>Delivered</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        if (rows.length === 0) {
            html += `
                <tr>
                    <td colspan="9" class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>No Messages Yet</h3>
                        <p>Send a test message to see logs here</p>
                        <a href="/test-webhook" style="display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: #16a34a; color: white; text-decoration: none; border-radius: 0.5rem;">
                            <i class="fas fa-flask"></i> Test Webhook
                        </a>
                    </td>
                </tr>
            `;
        } else {
            rows.forEach(row => {
                let statusClass = 'pending';
                if (row.status === 'delivered') statusClass = 'delivered';
                else if (row.status === 'failed') statusClass = 'failed';
                else if (row.status === 'sent') statusClass = 'sent';
                
                let directionClass = row.direction === 'inbound' ? 'inbound' : 'outbound';
                
                // Format content display
                let displayContent = row.message_content || '';
                if (displayContent === '[Pending content]') {
                    displayContent = '<span style="color: #ca8a04;"><i class="fas fa-clock"></i> Pending</span>';
                } else if (displayContent.length > 50) {
                    displayContent = displayContent.substring(0, 50) + '...';
                }
                
                html += `
                    <tr>
                        <td>#${row.id}</td>
                        <td><code style="background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">${row.message_id ? row.message_id.substring(0, 15) + '...' : '-'}</code></td>
                        <td><span class="badge ${directionClass}">${row.direction || '-'}</span></td>
                        <td>${row.from_number || '-'}</td>
                        <td>${row.to_number || '-'}</td>
                        <td class="message-preview">${displayContent}</td>
                        <td><span class="badge ${statusClass}">${row.status || '-'}</span></td>
                        <td>${row.sent_time ? new Date(row.sent_time).toLocaleString() : '-'}</td>
                        <td>${row.delivered_time ? new Date(row.delivered_time).toLocaleString() : '-'}</td>
                    </tr>
                `;
            });
        }
        
        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        res.send(html);
    });
});

// Export data endpoint
app.get('/export-data', (req, res) => {
    const exportData = {
        export_date: new Date().toISOString(),
        source: "GMS Webhook Server",
        data: {}
    };
    
    db.serialize(() => {
        db.all('SELECT * FROM webhook_events ORDER BY received_at DESC', [], (err, events) => {
            exportData.data.webhook_events = events || [];
            
            db.all('SELECT * FROM message_logs ORDER BY created_at DESC', [], (err, messages) => {
                exportData.data.message_logs = messages || [];
                
                res.json(exportData);
            });
        });
    });
});

// Health check endpoint with enhanced response
app.get('/health', (req, res) => {
    db.get('SELECT COUNT(*) as count FROM webhook_events', [], (err, eventCount) => {
        db.get('SELECT COUNT(*) as count FROM message_logs', [], (err2, messageCount) => {
            res.json({ 
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'GMS Webhook Server',
                version: '2.0',
                uptime: {
                    seconds: process.uptime(),
                    formatted: Math.floor(process.uptime() / 60) + 'm ' + Math.floor(process.uptime() % 60) + 's'
                },
                database: {
                    status: 'connected',
                    type: 'SQLite',
                    persistence: 'ephemeral',
                    event_count: eventCount?.count || 0,
                    message_count: messageCount?.count || 0
                },
                hosting: {
                    platform: 'Render',
                    tier: 'Free',
                    note: 'Data is ephemeral - export regularly'
                },
                endpoints: {
                    webhook: '/webhook',
                    events: '/events',
                    messages: '/messages',
                    stats: '/stats',
                    export: '/export-data'
                }
            });
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
        provider: "GMS Webhook Server",
        version: "2.0"
    });
});

// Test page for webhook with enhanced UI
app.get('/test-webhook', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Test Webhook | GMS Server</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; }
                .container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
                .header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
                .header h1 { font-size: 2rem; font-weight: 600; }
                .header i { color: #ea580c; }
                .card { background: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
                .form-group { margin-bottom: 1.5rem; }
                label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #475569; }
                input, select, textarea { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-family: 'Inter', sans-serif; transition: all 0.2s; }
                input:focus, select:focus, textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
                button { width: 100%; padding: 1rem; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
                button:hover { opacity: 0.9; }
                .result { margin-top: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 0.5rem; border-left: 4px solid #3b82f6; }
                .result pre { background: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-top: 1rem; }
                .nav { margin-bottom: 2rem; }
                .nav a { color: #64748b; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; }
                .nav a:hover { color: #0f172a; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="nav">
                    <a href="/"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>
                </div>

                <div class="header">
                    <i class="fas fa-flask fa-2x"></i>
                    <h1>Webhook Test Console</h1>
                </div>

                <div class="card">
                    <form id="webhookForm">
                        <div class="form-group">
                            <label><i class="fas fa-tag"></i> Webhook Type</label>
                            <select id="webhookType">
                                <option value="message">📱 Message Creation (with text content)</option>
                                <option value="status">📊 Status Update (delivery receipt)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label><i class="fas fa-id-card"></i> Message ID</label>
                            <input type="text" id="messageId" value="msg_${Date.now()}" readonly>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label><i class="fas fa-phone"></i> From</label>
                                <input type="text" id="fromNumber" value="+12135373887">
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-phone"></i> To</label>
                                <input type="text" id="toNumber" value="+16263192970">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label><i class="fas fa-exchange-alt"></i> Direction</label>
                                <select id="direction">
                                    <option value="out">Outbound</option>
                                    <option value="in">Inbound</option>
                                </select>
                            </div>
                            <div class="form-group" id="statusGroup">
                                <label><i class="fas fa-check-circle"></i> Status</label>
                                <select id="status">
                                    <option value="delivered">Delivered</option>
                                    <option value="sent">Sent</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group" id="contentGroup">
                            <label><i class="fas fa-comment"></i> Message Content</label>
                            <textarea id="content" rows="4">Hello this is a test message from Fabletics</textarea>
                        </div>

                        <button type="submit">
                            <i class="fas fa-paper-plane"></i>
                            Send Test Webhook
                        </button>
                    </form>

                    <div id="result" class="result" style="display: none;"></div>
                </div>
            </div>

            <script>
                // Toggle between message and status views
                document.getElementById('webhookType').addEventListener('change', function(e) {
                    const statusGroup = document.getElementById('statusGroup');
                    const contentGroup = document.getElementById('contentGroup');
                    
                    if (e.target.value === 'status') {
                        statusGroup.style.display = 'block';
                        contentGroup.style.display = 'none';
                    } else {
                        statusGroup.style.display = 'none';
                        contentGroup.style.display = 'block';
                    }
                });
                
                document.getElementById('webhookType').dispatchEvent(new Event('change'));

                document.getElementById('webhookForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const webhookType = document.getElementById('webhookType').value;
                    const messageId = document.getElementById('messageId').value;
                    const fromNumber = document.getElementById('fromNumber').value;
                    const toNumber = document.getElementById('toNumber').value;
                    const direction = document.getElementById('direction').value;
                    
                    let payload;
                    
                    if (webhookType === 'message') {
                        payload = [{
                            "id": messageId,
                            "owner": fromNumber,
                            "applicationId": "584ea43f-39e2-4f18-b01f-20737c617bb1",
                            "time": new Date().toISOString(),
                            "segmentCount": 1,
                            "direction": direction,
                            "to": [toNumber],
                            "from": fromNumber,
                            "text": document.getElementById('content').value,
                            "tag": "test-webhook"
                        }];
                    } else {
                        payload = [{
                            "time": new Date().toISOString(),
                            "type": "message-" + document.getElementById('status').value,
                            "to": toNumber,
                            "description": "Message status update",
                            "message": {
                                "id": messageId,
                                "owner": fromNumber,
                                "applicationId": "584ea43f-39e2-4f18-b01f-20737c617bb1",
                                "time": new Date().toISOString(),
                                "segmentCount": 1,
                                "direction": direction,
                                "to": [toNumber],
                                "from": fromNumber,
                                "text": "",
                                "tag": "test-webhook"
                            }
                        }];
                    }
                    
                    const resultDiv = document.getElementById('result');
                    resultDiv.innerHTML = '<p><i class="fas fa-spinner fa-pulse"></i> Sending webhook...</p>';
                    resultDiv.style.display = 'block';
                    
                    try {
                        const response = await fetch('/webhook', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        
                        const text = await response.text();
                        
                        resultDiv.innerHTML = \`
                            <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #16a34a;">
                                <i class="fas fa-check-circle"></i> Webhook Sent Successfully
                            </h3>
                            <p><strong>Status:</strong> \${response.status} \${response.statusText}</p>
                            <p><strong>Response:</strong> \${text}</p>
                            <h4 style="margin-top: 1rem;">Payload Sent:</h4>
                            <pre>\${JSON.stringify(payload, null, 2)}</pre>
                            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                                <a href="/view-events" style="flex: 1; text-align: center; padding: 0.75rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 0.5rem;">
                                    <i class="fas fa-list"></i> View Events
                                </a>
                                <a href="/view-messages" style="flex: 1; text-align: center; padding: 0.75rem; background: #16a34a; color: white; text-decoration: none; border-radius: 0.5rem;">
                                    <i class="fas fa-envelope"></i> View Messages
                                </a>
                            </div>
                        \`;
                    } catch (error) {
                        resultDiv.innerHTML = \`
                            <h3 style="display: flex; align-items: center; gap: 0.5rem; color: #dc2626;">
                                <i class="fas fa-exclamation-circle"></i> Error
                            </h3>
                            <p>\${error.message}</p>
                        \`;
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
    console.log('\n=== GMS Webhook Received ===');
    console.log('Time:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // Check if payload is an array (Bandwidth sends array)
    const payload = req.body;
    console.log('Payload type:', Array.isArray(payload) ? 'Array' : 'Object');
    console.log('Raw Body:', JSON.stringify(payload, null, 2));

    // Handle both array and single object
    const events = Array.isArray(payload) ? payload : [payload];
    
    events.forEach(event => {
        // Check if this is a status update (has nested message object) or message creation
        const isStatusUpdate = event.type && event.type.startsWith('message-') && event.message;
        const isMessageCreation = event.id && event.text !== undefined;
        
        // Extract fields based on Bandwidth's structure
        let eventType = event.type || 'message-created';
        
        // For status updates, the message ID is in event.message.id
        // For message creation, the ID is at the root
        let messageId = event.message?.id || event.id || null;
        
        // For status updates, from/to are in event.message
        // For message creation, they're at the root
        let fromNumber = event.message?.from || event.from || null;
        
        // Handle 'to' field which could be array or string
        let toNumber = null;
        if (event.message?.to) {
            toNumber = Array.isArray(event.message.to) ? event.message.to[0] : event.message.to;
        } else if (event.to) {
            toNumber = Array.isArray(event.to) ? event.to[0] : event.to;
        }
        
        let status = event.type?.replace('message-', '') || event.status || null;
        let direction = event.message?.direction || event.direction || null;
        
        // Get message text - check multiple locations
        let messageText = '';
        
        if (isMessageCreation) {
            // This is the actual message creation with text at root level
            messageText = event.text || '';
            console.log('✅ Message creation detected with text:', messageText);
        } else if (isStatusUpdate && event.message) {
            // This is a status update with message object containing text
            messageText = event.message.text || '';
            console.log('📊 Status update detected with message text:', messageText);
        } else {
            // Fallback: check other possible locations
            messageText = event.text || event.content || event.message?.content || '';
            console.log('⚠️ Using fallback text extraction:', messageText);
        }
        
        // Determine direction if not provided
        if (!direction) {
            // If from number is our own number, it's outbound
            direction = (fromNumber === '+12135373887' ? 'outbound' : 'inbound');
        }

        console.log('📝 Processed Event:', {
            eventType,
            messageId,
            fromNumber,
            toNumber,
            direction,
            status,
            isStatusUpdate,
            isMessageCreation,
            messageText: messageText || '[Empty]'
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
            JSON.stringify(event)
        );

        stmt.finalize();

        // Update message logs if this is a message-related event
        if (messageId) {
            updateMessageLog(messageId, eventType, fromNumber, toNumber, direction, status, event, messageText, isMessageCreation);
        }
    });

    // Always return 200 OK
    res.status(200).send('OK');
});
// ========== END FIXED WEBHOOK ENDPOINT ==========

// ========== FIXED HELPER FUNCTION ==========
// Helper function to update message logs
function updateMessageLog(messageId, eventType, fromNumber, toNumber, direction, status, payload, messageText, isMessageCreation) {
    // Check if message exists
    db.get('SELECT * FROM message_logs WHERE message_id = ?', [messageId], (err, row) => {
        if (err) {
            console.error('Error checking message log:', err);
            return;
        }

        // Determine the correct message content
        let finalMessageText = '';
        
        if (isMessageCreation) {
            // This is the actual message creation - use the text we extracted
            finalMessageText = messageText;
            console.log('📝 Message creation - using text:', finalMessageText);
        } else if (messageText && messageText !== '') {
            // We have text from somewhere
            finalMessageText = messageText;
        } else if (payload.message?.text) {
            // Text is in nested message object
            finalMessageText = payload.message.text;
        } else if (payload.text) {
            // Text is at root level
            finalMessageText = payload.text;
        } else if (payload.content) {
            // Text is in content field
            finalMessageText = payload.content;
        } else if (row) {
            // Message exists in database, keep existing content
            finalMessageText = row.message_content;
            console.log('💾 Using existing message content:', finalMessageText);
        } else {
            // New message but no text - might be status update arriving before message
            finalMessageText = '[Pending content]';
            console.log('⏳ No text found, marking as pending');
        }

        // If we still don't have text and this is a status update, check if we have the message in database
        if ((!finalMessageText || finalMessageText === '') && row) {
            finalMessageText = row.message_content;
        }

        console.log(`🔄 Updating message log for ${messageId}:`, {
            exists: !!row,
            finalMessageText: finalMessageText || '[Empty]',
            status: status,
            isMessageCreation
        });

        if (!row) {
            // New message
            const sentTime = payload.message?.time || payload.time || new Date().toISOString();
            
            db.run(`
                INSERT INTO message_logs 
                (message_id, from_number, to_number, direction, message_content, message_type, status, sent_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                messageId, 
                fromNumber, 
                toNumber, 
                direction, 
                finalMessageText || '[No content]',
                'sms',
                status || 'pending',
                sentTime
            ], function(err) {
                if (err) {
                    console.error('❌ Error inserting message log:', err);
                } else {
                    console.log('✅ Message log created for:', messageId, 'with content:', finalMessageText);
                }
            });
        } else {
            // Update existing message based on event type
            let updateFields = [];
            let updateValues = [];
            
            // Update status based on event type
            if (eventType === 'message-delivered' || status === 'delivered') {
                updateFields.push('status = ?', 'delivered_time = ?');
                updateValues.push('delivered', payload.time || new Date().toISOString());
                console.log('📬 Updating status to delivered for:', messageId);
            } else if (eventType === 'message-failed' || status === 'failed' || status === 'REJECTED') {
                updateFields.push('status = ?');
                updateValues.push('failed');
                console.log('❌ Updating status to failed for:', messageId);
            } else if (eventType === 'message-sent' || status === 'sent') {
                updateFields.push('status = ?');
                updateValues.push('sent');
                console.log('📤 Updating status to sent for:', messageId);
            }
            
            // If we have actual message text and the existing one is placeholder, update it
            if (finalMessageText && 
                finalMessageText !== '[Pending content]' && 
                finalMessageText !== '[No content]' &&
                finalMessageText !== '' &&
                row.message_content !== finalMessageText) {
                
                // Check if existing content is placeholder or empty
                if (row.message_content === '[Pending content]' || 
                    row.message_content === '[No content]' || 
                    row.message_content === '' ||
                    row.message_content !== finalMessageText) {
                    
                    updateFields.push('message_content = ?');
                    updateValues.push(finalMessageText);
                    console.log('📝 Updating message content from', row.message_content, 'to', finalMessageText);
                }
            }
            
            if (updateFields.length > 0) {
                const query = `UPDATE message_logs SET ${updateFields.join(', ')} WHERE message_id = ?`;
                updateValues.push(messageId);
                
                db.run(query, updateValues, function(err) {
                    if (err) {
                        console.error('❌ Error updating message log:', err);
                    } else {
                        console.log('✅ Message log updated for:', messageId);
                    }
                });
            } else {
                console.log('⏸️ No updates needed for:', messageId);
            }
        }
    });
}
// ========== END FIXED HELPER FUNCTION ==========

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
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sentMessages,
                SUM(CASE WHEN direction = 'in' OR direction = 'inbound' THEN 1 ELSE 0 END) as inboundMessages,
                SUM(CASE WHEN direction = 'out' OR direction = 'outbound' THEN 1 ELSE 0 END) as outboundMessages
            FROM message_logs
        `, [], (err, row) => {
            stats.messageStats = row || {
                totalMessages: 0,
                deliveredMessages: 0,
                failedMessages: 0,
                pendingMessages: 0,
                sentMessages: 0,
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
                    provider: "GMS Webhook Server",
                    version: "2.0",
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
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n=== GMS Webhook Server v2.0 ===');
    console.log(`Server running on port ${PORT}`);
    console.log(`Local URL: http://localhost:${PORT}`);
    console.log(`\nYour callback URL endpoint:`);
    console.log(`   POST http://localhost:${PORT}/webhook`);
    console.log(`\nManagement endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/ - Professional Dashboard`);
    console.log(`   GET  http://localhost:${PORT}/view-events - Enhanced Events View`);
    console.log(`   GET  http://localhost:${PORT}/view-messages - Enhanced Messages View`);
    console.log(`   GET  http://localhost:${PORT}/stats - Analytics`);
    console.log(`   GET  http://localhost:${PORT}/test-webhook - Test Console`);
    console.log(`   GET  http://localhost:${PORT}/export-data - Export Data`);
    
    console.log('\nRENDER FREE TIER WARNING:');
    console.log('   • Data is EPHEMERAL - will be lost after 15 mins inactivity');
    console.log('   • Export important data using /export-data endpoint');
    console.log('   • Set up Uptime Robot to ping every 5 mins to keep alive');
    
    console.log('\nTo expose this to the internet (for Bandwidth):');
    console.log('   npx ngrok http 3000');
    console.log('\nWaiting for Bandwidth webhooks...\n');
});