import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const STAGES = ['enquiry','tour_scheduled','tour_done','demo_scheduled','demo_done','follow_up','referral_check','seat_availability','confirmed','lost'];
const STAGE_BADGE = {enquiry:'badge-blue',tour_scheduled:'badge-yellow',tour_done:'badge-yellow',demo_scheduled:'badge-purple',demo_done:'badge-purple',follow_up:'badge-orange',referral_check:'badge-orange',seat_availability:'badge-orange',confirmed:'badge-green',lost:'badge-red'};

export default function LeadDetailPage() {
  const {id} = useParams();
  const navigate = useNavigate();
  const [lead,setLead]         = useState(null);
  const [log,setLog]           = useState([]);
  const [loading,setLoading]   = useState(true);
  const [error,setError]       = useState('');
  const [newStage,setNewStage] = useState('');
  const [note,setNote]         = useState('');
  const [updating,setUpdating] = useState(false);
  const [msg,setMsg]           = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  
  useEffect(() => {
  axiosClient.get(`/leads/${id}`)
    .then(res => { setLead(res.data.lead); setLog(res.data.statusLog); })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, [id]);

useEffect(() => {
  if (!id) return;
  setLoadingSuggestion(true);
  axiosClient.get(`/suggestions/${id}`)
    .then(res => setSuggestion(res.data.suggestion))
    .catch(() => setSuggestion(null))
    .finally(() => setLoadingSuggestion(false));
}, [id]);

  async function handleUpdate(e) {
    e.preventDefault();
    if (!newStage) return;
    setUpdating(true); setMsg(null);
    try {
      const res = await axiosClient.patch(`/leads/${id}/stage`, {to_stage:newStage,note:note||null});
      setLead(p => ({...p,current_stage:res.data.lead.current_stage,updated_at:res.data.lead.updated_at}));
      setLog(p => [...p,{id:Date.now(),from_stage:lead.current_stage,to_stage:newStage,note,created_at:new Date().toISOString()}]);
      setMsg({type:'success',text:`Stage updated to "${newStage.replace(/_/g,' ')}"`});
      setNewStage(''); setNote('');
    } catch (err) { setMsg({type:'error',text:err.message}); }
    finally { setUpdating(false); }
  }

  if (loading) return <div className="page" style={{color:'var(--muted)'}}>Loading…</div>;
  if (error)   return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!lead)   return null;

  return (
    <div className="page">
      <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'1.5rem'}}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/leads')}>← Back</button>
        <h1 className="page-title" style={{margin:0}}>{lead.child_name}'s Lead</h1>
        <span className={`badge ${STAGE_BADGE[lead.current_stage]||'badge-gray'}`}>{lead.current_stage.replace(/_/g,' ')}</span>
      </div>
      <div className="detail-grid">
        <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
          <div className="card">
            <div className="section-title">Lead Information</div>
            {[
              ['Child Name',lead.child_name],
              ['Child Age',lead.child_age_months?`${lead.child_age_months} months`:'—'],
              ['Parent Name',lead.parent_name],
              ['Phone',lead.parent_phone],
              ['Email',lead.parent_email||'—'],
              ['Source',lead.lead_source?.replace(/_/g,' ')],
              ['Counsellor',lead.counsellor_name||'Unassigned'],
              ['Priority',lead.is_priority?'★ Yes':'No'],
              ['Created',new Date(lead.created_at).toLocaleString('en-IN')],
              ['Updated',new Date(lead.updated_at).toLocaleString('en-IN')],
            ].map(([k,v]) => (
              <div className="info-row" key={k}>
                <span className="info-label">{k}</span>
                <span style={{fontWeight:500}}>{v}</span>
              </div>
            ))}
            {lead.notes && (
              <div style={{marginTop:'0.85rem',background:'var(--bg)',padding:'0.75rem',borderRadius:6}}>
                <div className="section-title" style={{marginBottom:'0.35rem'}}>Notes</div>
                <p style={{fontSize:'0.88rem',lineHeight:1.6}}>{lead.notes}</p>
              </div>
            )}
          </div>
          <div className="card" style={{borderLeft:'4px solid var(--primary)'}}>
  <div className="section-title">🤖 AI Suggestion</div>
  {loadingSuggestion && <p style={{color:'var(--muted)',fontSize:'0.88rem'}}>Analysing lead…</p>}
  {suggestion && (
    <div>
      {suggestion.stuckWarning && (
        <div className="alert alert-warning" style={{marginBottom:'0.85rem'}}>
          {suggestion.stuckWarning}
        </div>
      )}
      <div style={{
        background: suggestion.urgency==='critical' ? '#fef2f2' :
                    suggestion.urgency==='high'     ? '#fffbeb' : '#f0fdf4',
        border: `1px solid ${suggestion.urgency==='critical' ? '#fecaca' :
                              suggestion.urgency==='high'     ? '#fde68a' : '#bbf7d0'}`,
        borderRadius: 8, padding:'1rem', marginBottom:'0.85rem'
      }}>
        <div style={{fontWeight:700,fontSize:'0.78rem',textTransform:'uppercase',
          color: suggestion.urgency==='critical' ? 'var(--error)' :
                 suggestion.urgency==='high'     ? 'var(--warning)' : 'var(--success)',
          marginBottom:'0.5rem'
        }}>
          {suggestion.urgency==='critical' ? '🔴 CRITICAL' :
           suggestion.urgency==='high'     ? '🟡 HIGH PRIORITY' : '🟢 NORMAL'}
        </div>
        <p style={{fontSize:'0.9rem',lineHeight:1.6}}>{suggestion.action}</p>
      </div>
      {suggestion.nextStage && (
        <p style={{fontSize:'0.82rem',color:'var(--muted)'}}>
          Suggested next stage: <strong>{suggestion.nextStage.replace(/_/g,' ')}</strong>
        </p>
      )}
    </div>
  )}
</div>
          <div className="card">
            <div className="section-title">Update Stage</div>
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <form onSubmit={handleUpdate}>
              <div className="form-group" style={{marginBottom:'0.85rem'}}>
                <label>Move to stage</label>
                <select value={newStage} onChange={e => setNewStage(e.target.value)}>
                  <option value="">— Select new stage —</option>
                  {STAGES.filter(s => s!==lead.current_stage).map(s => (
                    <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{marginBottom:'0.85rem'}}>
                <label>Note (optional)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Parent confirmed Saturday tour…" style={{minHeight:70}}/>
              </div>
              <button type="submit" className="btn btn-primary" disabled={!newStage||updating}>
                {updating?<><span className="spinner"/> Updating…</>:'Update Stage'}
              </button>
            </form>
          </div>
        </div>
        <div className="card" style={{alignSelf:'start'}}>
          <div className="section-title">Stage History</div>
          <div className="timeline">
            {log.map((entry,i) => (
              <div className="timeline-item" key={entry.id||i}>
                <div className="timeline-dot">{i+1}</div>
                <div className="timeline-content">
                  <div className="timeline-stage">
                    {entry.from_stage
                      ? `${entry.from_stage.replace(/_/g,' ')} → ${entry.to_stage.replace(/_/g,' ')}`
                      : `Started: ${entry.to_stage.replace(/_/g,' ')}`}
                  </div>
                  <div className="timeline-meta">{new Date(entry.created_at).toLocaleString('en-IN')}</div>
                  {entry.note && <div className="timeline-note">{entry.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}