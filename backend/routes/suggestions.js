const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// Rule-based logic — generates next action suggestion for a lead
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l.*, 
              NOW() - l.updated_at AS time_since_update
       FROM leads l WHERE l.id = $1`,
      [req.params.id]
    );

    if (!result.rows.length)
      return res.status(404).json({ success:false, error:'Lead not found.' });

    const lead       = result.rows[0];
    const hoursStuck = Math.floor(lead.time_since_update.hours || 0);
    const daysStuck  = Math.floor((lead.time_since_update.days || 0));

    let suggestion   = '';
    let urgency      = 'normal';
    let nextStage    = '';

    // Rule-based logic based on current stage
    switch (lead.current_stage) {
      case 'enquiry':
        suggestion = `Call ${lead.parent_name} to schedule a campus tour. Introduce the school's programs and ask about the child's interests.`;
        nextStage  = 'tour_scheduled';
        if (daysStuck > 1) urgency = 'high';
        break;
      case 'tour_scheduled':
        suggestion = `Send a reminder WhatsApp to ${lead.parent_name} about the upcoming tour. Confirm date and time.`;
        nextStage  = 'tour_done';
        if (daysStuck > 2) urgency = 'high';
        break;
      case 'tour_done':
        suggestion = `Follow up with ${lead.parent_name} about their tour experience. Invite them for a demo class with ${lead.child_name}.`;
        nextStage  = 'demo_scheduled';
        if (daysStuck > 1) urgency = 'high';
        break;
      case 'demo_scheduled':
        suggestion = `Send demo class details to ${lead.parent_name}. Mention what ${lead.child_name} will experience.`;
        nextStage  = 'demo_done';
        break;
      case 'demo_done':
        suggestion = `Call ${lead.parent_name} to get feedback on the demo. Address any concerns and discuss admission process.`;
        nextStage  = 'follow_up';
        if (daysStuck > 1) urgency = 'high';
        break;
      case 'follow_up':
        suggestion = `This lead needs immediate attention! Call ${lead.parent_name} and offer a special early admission benefit if they decide this week.`;
        nextStage  = 'seat_availability';
        urgency    = daysStuck > 2 ? 'critical' : 'high';
        break;
      case 'referral_check':
        suggestion = `Verify referral details and apply any referral discount for ${lead.parent_name}. This can speed up the decision.`;
        nextStage  = 'seat_availability';
        break;
      case 'seat_availability':
        suggestion = `Confirm seat availability for ${lead.child_name}'s age group. Create urgency — limited seats available!`;
        nextStage  = 'confirmed';
        urgency    = 'high';
        break;
      case 'confirmed':
        suggestion = `Welcome ${lead.child_name} to FirstCry Intellitots! Send welcome kit details and fee payment instructions to ${lead.parent_name}.`;
        nextStage  = '';
        urgency    = 'normal';
        break;
      case 'lost':
        suggestion = `Re-engage ${lead.parent_name} after 30 days with a new offer or updated program information.`;
        nextStage  = 'enquiry';
        urgency    = 'low';
        break;
      default:
        suggestion = `Review this lead and determine the next best action for ${lead.parent_name}.`;
    }

    // Add urgency warning if stuck too long
    let stuckWarning = '';
    if (daysStuck >= 3) {
      stuckWarning = `⚠️ WARNING: This lead has been at "${lead.current_stage}" stage for ${daysStuck} days without movement!`;
      urgency = 'critical';
    } else if (daysStuck >= 1) {
      stuckWarning = `This lead has been waiting for ${daysStuck} day(s). Act soon!`;
    }

    return res.json({
      success: true,
      suggestion: {
        action:       suggestion,
        urgency:      urgency,
        nextStage:    nextStage,
        stuckWarning: stuckWarning,
        currentStage: lead.current_stage,
        childName:    lead.child_name,
        parentName:   lead.parent_name,
      }
    });

  } catch (err) {
    console.error('Suggestion error:', err.message);
    return res.status(500).json({ success:false, error:'Server error.' });
  }
});

module.exports = router;