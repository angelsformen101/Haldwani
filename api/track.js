const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const clicksPath = path.join(process.cwd(), 'admin', 'clicks.json');
        const clickEvent = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        let clicks = [];
        if (fs.existsSync(clicksPath)) {
            clicks = JSON.parse(fs.readFileSync(clicksPath, 'utf-8'));
        }
        clicks.unshift(clickEvent);
        if (clicks.length > 5000) clicks = clicks.slice(0, 5000);
        fs.writeFileSync(clicksPath, JSON.stringify(clicks, null, 2), 'utf-8');
        return res.status(200).json({ success: true, id: clickEvent.id });
    } catch (e) {
        return res.status(200).json({ success: false, note: e.message });
    }
};
