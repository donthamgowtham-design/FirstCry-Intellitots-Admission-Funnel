const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

router.get('/summary', async (req, res) => {
  try {
    const [funnelRes, sourceRes, totalRes, confirmedRes] = await Promise.all([
      db.query(`SELECT current_stage AS stage, COUNT(*) AS count
                FROM leads GROUP BY current_stage ORDER BY count DESC`),
      db.query(`SELECT lead_source AS source, COUNT(*) AS count
                FROM leads GROUP BY lead_source ORDER BY count DESC`),
      db.query(`SELECT COUNT(*) FROM leads`),
      db.query(`SELECT COUNT(*) FROM leads WHERE current_stage='confirmed'`),
    ]);
    const total     = parseInt(totalRes.rows[0].count);
    const confirmed = parseInt(confirmedRes.rows[0].count);
    const rate      = total > 0 ? ((confirmed/total)*100).toFixed(1) : '0.0';
    return res.json({
      success:true,
      funnelCounts:    funnelRes.rows,
      sourceBreakdown: sourceRes.rows,
      totalLeads:      total,
      confirmedLeads:  confirmed,
      conversionRate:  `${rate}%`,
    });
  } catch (err) {
    return res.status(500).json({ success:false, error:'Server error.' });
  }
});

module.exports = router;