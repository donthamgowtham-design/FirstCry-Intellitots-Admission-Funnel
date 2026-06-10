const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { requireFields, validateLeadSource, validatePhone, validateStageUpdate } = require('../middleware/validate');

router.post('/',
  requireFields(['child_name','parent_name','parent_phone','lead_source']),
  validateLeadSource,
  validatePhone,
  async (req, res) => {
    const {
      child_name, parent_name, parent_phone,
      parent_email=null, lead_source,
      child_age_months=null, notes=null, assigned_to=null
    } = req.body;
    try {
      const result = await db.query(
        `INSERT INTO leads
           (child_name,parent_name,parent_phone,parent_email,
            lead_source,child_age_months,notes,assigned_to)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id,child_name,parent_name,parent_phone,
                   lead_source,current_stage,created_at`,
        [child_name.trim(),parent_name.trim(),parent_phone.trim(),
         parent_email,lead_source,child_age_months,notes,assigned_to]
      );
      const lead = result.rows[0];
      await db.query(
        `INSERT INTO lead_status_logs (lead_id,from_stage,to_stage,note)
         VALUES ($1,NULL,'enquiry','Lead created')`,
        [lead.id]
      );
      return res.status(201).json({ success:true, lead });
    } catch (err) {
      console.error('Create lead error:', err.message);
      return res.status(500).json({ success:false, error:'Server error.' });
    }
  }
);

router.get('/', async (req, res) => {
  const { stage, source, page=1, limit=50 } = req.query;
  const conditions = [];
  const values     = [];
  let   idx        = 1;
  if (stage)  { conditions.push(`l.current_stage=$${idx++}`); values.push(stage); }
  if (source) { conditions.push(`l.lead_source=$${idx++}`);   values.push(source); }
  const where  = conditions.length ? 'WHERE '+conditions.join(' AND ') : '';
  const offset = (parseInt(page)-1) * parseInt(limit);
  try {
    const [countRes, dataRes] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM leads l ${where}`, values),
      db.query(
        `SELECT l.id,l.child_name,l.parent_name,l.parent_phone,
                l.lead_source,l.current_stage,l.is_priority,
                l.created_at,l.updated_at,c.full_name AS counsellor_name
         FROM leads l
         LEFT JOIN counsellors c ON l.assigned_to=c.id
         ${where}
         ORDER BY l.is_priority DESC, l.updated_at DESC
         LIMIT $${idx} OFFSET $${idx+1}`,
        [...values, parseInt(limit), offset]
      ),
    ]);
    return res.json({ success:true, total:parseInt(countRes.rows[0].count), leads:dataRes.rows });
  } catch (err) {
    console.error('Get leads error:', err.message);
    return res.status(500).json({ success:false, error:'Server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const leadRes = await db.query(
      `SELECT l.*,c.full_name AS counsellor_name
       FROM leads l
       LEFT JOIN counsellors c ON l.assigned_to=c.id
       WHERE l.id=$1`,
      [req.params.id]
    );
    if (!leadRes.rows.length)
      return res.status(404).json({ success:false, error:'Lead not found.' });
    const logRes = await db.query(
      `SELECT sl.*,c.full_name AS changed_by_name
       FROM lead_status_logs sl
       LEFT JOIN counsellors c ON sl.changed_by=c.id
       WHERE sl.lead_id=$1 ORDER BY sl.created_at ASC`,
      [req.params.id]
    );
    return res.json({ success:true, lead:leadRes.rows[0], statusLog:logRes.rows });
  } catch (err) {
    return res.status(500).json({ success:false, error:'Server error.' });
  }
});

router.patch('/:id/stage',
  requireFields(['to_stage']),
  validateStageUpdate,
  async (req, res) => {
    const { to_stage, changed_by=null, note=null } = req.body;
    try {
      const current = await db.query(
        'SELECT current_stage FROM leads WHERE id=$1',[req.params.id]
      );
      if (!current.rows.length)
        return res.status(404).json({ success:false, error:'Lead not found.' });
      const from_stage = current.rows[0].current_stage;
      const updated = await db.query(
        `UPDATE leads SET current_stage=$1 WHERE id=$2
         RETURNING id,child_name,current_stage,updated_at`,
        [to_stage, req.params.id]
      );
      await db.query(
        `INSERT INTO lead_status_logs (lead_id,from_stage,to_stage,changed_by,note)
         VALUES ($1,$2,$3,$4,$5)`,
        [req.params.id, from_stage, to_stage, changed_by, note]
      );
      return res.json({ success:true, lead:updated.rows[0] });
    } catch (err) {
      return res.status(500).json({ success:false, error:'Server error.' });
    }
  }
);

module.exports = router;