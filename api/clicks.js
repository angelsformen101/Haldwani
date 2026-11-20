const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();

    const clicksPath = path.join(process.cwd(), 'admin', 'clicks.json');

    // GET /api/clicks: Retrieve all clicks
    if (req.method === 'GET') {
        try {
            if (fs.existsSync(clicksPath)) {
                const data = fs.readFileSync(clicksPath, 'utf-8');
                return res.status(200).json(JSON.parse(data));
            }
            return res.status(200).json([]);
        } catch (e) {
            return res.status(200).json([]);
        }
    }

    // POST /api/clicks: Save, update, or clear click logs
    if (req.method === 'POST') {
        try {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            let updatedClicks = [];

            if (Array.isArray(body)) {
                updatedClicks = body;
            } else if (body && body.action === 'clear_all') {
                updatedClicks = [];
            } else if (body && body.action === 'clear_page' && body.page) {
                let existing = [];
                if (fs.existsSync(clicksPath)) existing = JSON.parse(fs.readFileSync(clicksPath, 'utf-8'));
                updatedClicks = existing.filter(c => c.page !== body.page);
            } else if (body && body.action === 'clear_pages' && Array.isArray(body.pages)) {
                let existing = [];
                if (fs.existsSync(clicksPath)) existing = JSON.parse(fs.readFileSync(clicksPath, 'utf-8'));
                const pageSet = new Set(body.pages);
                updatedClicks = existing.filter(c => !pageSet.has(c.page));
            } else if (body && body.action === 'delete_ids' && Array.isArray(body.ids)) {
                let existing = [];
                if (fs.existsSync(clicksPath)) existing = JSON.parse(fs.readFileSync(clicksPath, 'utf-8'));
                const idSet = new Set(body.ids);
                updatedClicks = existing.filter(c => !idSet.has(c.id));
            } else {
                return res.status(400).json({ error: 'Invalid click operation payload' });
            }

            fs.writeFileSync(clicksPath, JSON.stringify(updatedClicks, null, 2) + '\n', 'utf-8');
            return res.status(200).json({ success: true, count: updatedClicks.length });
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
