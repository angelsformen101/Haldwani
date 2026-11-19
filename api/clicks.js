const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const clicksPath = path.join(process.cwd(), 'admin', 'clicks.json');
        if (fs.existsSync(clicksPath)) {
            const data = fs.readFileSync(clicksPath, 'utf-8');
            return res.status(200).json(JSON.parse(data));
        }
        return res.status(200).json([]);
    } catch (e) {
        return res.status(200).json([]);
    }
};
