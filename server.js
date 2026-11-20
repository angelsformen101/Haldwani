/**
 * CityHaldwani - Lightweight Server & Flat-File API
 * Zero-dependency Node.js server. Run with: node server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const ROOT = __dirname;
const CONFIG_FILE = path.join(ROOT, 'admin', 'contacts-config.json');
const CONFIG_JS_FILE = path.join(ROOT, 'admin', 'contacts-config.js');
const CONFIG_PUBLIC_JS = path.join(ROOT, 'js', 'contacts-config.js');
const CLICKS_FILE = path.join(ROOT, 'admin', 'clicks.json');

// Ensure clicks.json exists
if (!fs.existsSync(CLICKS_FILE)) {
    fs.writeFileSync(CLICKS_FILE, '[]\n', 'utf-8');
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
    const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsed.pathname;
    const decodedPath = decodeURIComponent(pathname);

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // API: GET /api/config
    if (pathname === '/api/config' && req.method === 'GET') {
        try {
            const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(data);
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Failed to read config' }));
        }
    }

    // API: POST /api/config
    if (pathname === '/api/config' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const parsedConfig = JSON.parse(body);
                fs.writeFileSync(CONFIG_FILE, JSON.stringify(parsedConfig, null, 2) + '\n', 'utf-8');
                const jsContent = '// Master Contacts Configuration for CityHaldwani\nwindow.SITE_CONTACTS_CONFIG = ' +
                    JSON.stringify(parsedConfig, null, 2) + ';\n';
                fs.writeFileSync(CONFIG_JS_FILE, jsContent, 'utf-8');
                fs.writeFileSync(CONFIG_PUBLIC_JS, jsContent, 'utf-8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: true, message: 'Configuration saved on disk' }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Invalid JSON config' }));
            }
        });
        return;
    }

    // API: POST /api/track
    if (pathname === '/api/track' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const clickEvent = JSON.parse(body);
                let clicks = [];
                if (fs.existsSync(CLICKS_FILE)) {
                    clicks = JSON.parse(fs.readFileSync(CLICKS_FILE, 'utf-8'));
                }
                clicks.unshift(clickEvent);
                if (clicks.length > 5000) clicks = clicks.slice(0, 5000);
                fs.writeFileSync(CLICKS_FILE, JSON.stringify(clicks, null, 2) + '\n', 'utf-8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: true, id: clickEvent.id }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Invalid click tracking payload' }));
            }
        });
        return;
    }

    // API: GET /api/clicks
    if (pathname === '/api/clicks' && req.method === 'GET') {
        try {
            const data = fs.readFileSync(CLICKS_FILE, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(data);
        } catch (e) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end('[]');
        }
    }

    // API: POST /api/clicks
    if (pathname === '/api/clicks' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const parsedBody = JSON.parse(body);
                let updatedClicks = [];
                if (Array.isArray(parsedBody)) {
                    updatedClicks = parsedBody;
                } else if (parsedBody && parsedBody.action === 'clear_all') {
                    updatedClicks = [];
                } else if (parsedBody && parsedBody.action === 'clear_page' && parsedBody.page) {
                    let existing = [];
                    if (fs.existsSync(CLICKS_FILE)) existing = JSON.parse(fs.readFileSync(CLICKS_FILE, 'utf-8'));
                    updatedClicks = existing.filter(c => c.page !== parsedBody.page);
                } else if (parsedBody && parsedBody.action === 'clear_pages' && Array.isArray(parsedBody.pages)) {
                    let existing = [];
                    if (fs.existsSync(CLICKS_FILE)) existing = JSON.parse(fs.readFileSync(CLICKS_FILE, 'utf-8'));
                    const pageSet = new Set(parsedBody.pages);
                    updatedClicks = existing.filter(c => !pageSet.has(c.page));
                } else if (parsedBody && parsedBody.action === 'delete_ids' && Array.isArray(parsedBody.ids)) {
                    let existing = [];
                    if (fs.existsSync(CLICKS_FILE)) existing = JSON.parse(fs.readFileSync(CLICKS_FILE, 'utf-8'));
                    const idSet = new Set(parsedBody.ids);
                    updatedClicks = existing.filter(c => !idSet.has(c.id));
                }
                fs.writeFileSync(CLICKS_FILE, JSON.stringify(updatedClicks, null, 2) + '\n', 'utf-8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: true, count: updatedClicks.length }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // --- ADMIN SECRET ACCESS: ONLY /admin! OR /admin!/ SERVES THE ADMIN PANEL ---
    if (decodedPath === '/admin!' || decodedPath === '/admin!/') {
        const adminHtml = path.join(ROOT, 'admin!.html');
        const adminIndex = path.join(ROOT, 'admin', 'index.html');
        const target = fs.existsSync(adminHtml) ? adminHtml : adminIndex;
        if (fs.existsSync(target)) {
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'X-Frame-Options': 'DENY',
                'X-Content-Type-Options': 'nosniff'
            });
            return fs.createReadStream(target).pipe(res);
        }
    }

    // --- STRICT ACCESS CONTROL: BLOCK ANY DIRECT ACCESS TO /admin OR /admin/* OR /admin!.html ---
    if (decodedPath === '/admin' || decodedPath === '/admin/' || decodedPath.startsWith('/admin/') || decodedPath === '/admin!.html') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        const notFound = path.join(ROOT, '404.html');
        if (fs.existsSync(notFound)) {
            return res.end(fs.readFileSync(notFound));
        }
        return res.end('<h1>404 Not Found</h1>');
    }

    // Serve Static Files
    let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') {
        safePath = 'index.html';
    } else if (safePath.startsWith('/') || safePath.startsWith('\\')) {
        safePath = safePath.slice(1);
    }

    let filePath = path.join(ROOT, safePath);

    // Support clean URLs: if path has no extension and doesn't exist, check path + .html
    if (!fs.existsSync(filePath) && !path.extname(filePath)) {
        if (fs.existsSync(filePath + '.html')) {
            filePath = filePath + '.html';
        }
    }

    // Check directory with index.html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        const indexHtml = path.join(filePath, 'index.html');
        if (fs.existsSync(indexHtml)) {
            filePath = indexHtml;
        }
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        const notFound = path.join(ROOT, '404.html');
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        if (fs.existsSync(notFound)) {
            return res.end(fs.readFileSync(notFound));
        }
        return res.end('<h1>404 Not Found</h1>');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
    console.log(`CityHaldwani running at http://localhost:${PORT}`);
    console.log(`Secret Admin Access: http://localhost:${PORT}/admin!`);
});
