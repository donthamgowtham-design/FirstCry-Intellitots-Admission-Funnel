const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { requireFields } = require('../middleware/validate');

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id,full_name,email,phone,is_active,created_at
       FROM counsellors WHERE is_active=true ORDER BY full_name`
    );
    return res.json({ success:true, counsellors:result.rows });
  } catch (err) {
    return res.status(500).json({ success:false, error:'Server error.' });
  }
});

router.post('/',
  requireFields(['full_name','email','phone']),
  async (req, res) => {
    const { full_name, email, phone } = req.body;
    try {
      const result = await db.query(
        `INSERT INTO counsellors (full_name,email,phone)
         VALUES ($1,$2,$3)
         RETURNING id,full_name,email,phone`,
        [full_name.trim(), email.trim().toLowerCase(), phone.trim()]
      );
      return res.status(201).json({ success:true, counsellor:result.rows[0] });
    } catch (err) {
      if (err.code==='23505')
        return res.status(409).json({ success:false, error:'Email already exists.' });
      return res.status(500).json({ success:false, error:'Server error.' });
    }
  }
);

module.exports = router;