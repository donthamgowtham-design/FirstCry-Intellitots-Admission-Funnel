const VALID_SOURCES = ['walk_in','social_media','referral','google_ad','other'];
const VALID_STAGES  = [
  'enquiry','tour_scheduled','tour_done','demo_scheduled','demo_done',
  'follow_up','referral_check','seat_availability','confirmed','lost'
];

function requireFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => {
      const val = req.body[f];
      return val === undefined || val === null || String(val).trim() === '';
    });
    if (missing.length > 0) {
      return res.status(400).json({ success:false, error:`Missing: ${missing.join(', ')}` });
    }
    next();
  };
}

function validateLeadSource(req, res, next) {
  if (!VALID_SOURCES.includes(req.body.lead_source)) {
    return res.status(400).json({ success:false, error:'Invalid lead source.' });
  }
  next();
}

function validatePhone(req, res, next) {
  const phone = String(req.body.parent_phone || '').trim();
  if (!/^\+?[0-9]{10,15}$/.test(phone)) {
    return res.status(400).json({ success:false, error:'Phone must be 10-15 digits.' });
  }
  next();
}

function validateStageUpdate(req, res, next) {
  if (!VALID_STAGES.includes(req.body.to_stage)) {
    return res.status(400).json({ success:false, error:'Invalid stage.' });
  }
  next();
}

module.exports = { requireFields, validateLeadSource, validatePhone, validateStageUpdate };