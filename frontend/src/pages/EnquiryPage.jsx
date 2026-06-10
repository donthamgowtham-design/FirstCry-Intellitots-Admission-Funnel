import { useState } from 'react';
import axiosClient from '../api/axiosClient';

const SOURCES = [
  {value:'',label:'— Select source —'},
  {value:'walk_in',label:'Walk-in'},
  {value:'social_media',label:'Social Media'},
  {value:'referral',label:'Referral'},
  {value:'google_ad',label:'Google Ad'},
  {value:'other',label:'Other'},
];
const EMPTY = {child_name:'',parent_name:'',parent_phone:'',parent_email:'',child_age_months:'',lead_source:'',notes:''};

function validate(f) {
  const e = {};
  if (!f.child_name.trim())   e.child_name   = 'Child name is required.';
  if (!f.parent_name.trim())  e.parent_name  = 'Parent name is required.';
  if (!f.parent_phone.trim()) e.parent_phone = 'Phone number is required.';
  else if (!/^\+?[0-9]{10,15}$/.test(f.parent_phone.trim())) e.parent_phone = 'Enter valid 10-15 digit number.';
  if (f.parent_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.parent_email)) e.parent_email = 'Enter valid email.';
  if (!f.lead_source) e.lead_source = 'Please select a lead source.';
  if (f.child_age_months && (isNaN(f.child_age_months)||+f.child_age_months<12||+f.child_age_months>96))
    e.child_age_months = 'Age must be 12-96 months.';
  return e;
}

export default function EnquiryPage() {
  const [form,setForm]       = useState(EMPTY);
  const [errors,setErrors]   = useState({});
  const [status,setStatus]   = useState(null);
  const [message,setMessage] = useState('');

  function handleChange(e) {
    const {name,value} = e.target;
    setForm(p => ({...p,[name]:value}));
    if (errors[name]) setErrors(p => ({...p,[name]:undefined}));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(''); setStatus(null);
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStatus('loading');
    const payload = {
      child_name:form.child_name.trim(),
      parent_name:form.parent_name.trim(),
      parent_phone:form.parent_phone.trim(),
      lead_source:form.lead_source,
      ...(form.parent_email     && {parent_email:form.parent_email.trim()}),
      ...(form.child_age_months && {child_age_months:+form.child_age_months}),
      ...(form.notes            && {notes:form.notes.trim()}),
    };
    try {
      const res = await axiosClient.post('/leads', payload);
      setStatus('success');
      setMessage(`✓ Enquiry created for ${res.data.lead.child_name}!`);
      setForm(EMPTY); setErrors({});
    } catch (err) {
      setStatus('error'); setMessage(err.message);
    }
  }

  return (
    <div className="page">
      <div className="card" style={{maxWidth:720}}>
        <div className="form-header">
          <h1>New Admission Enquiry</h1>
          <p>Fill in parent and child details. Fields marked <span style={{color:'var(--error)'}}>*</span> are required.</p>
        </div>
        {status==='success' && <div className="alert alert-success">{message}</div>}
        {status==='error'   && <div className="alert alert-error">{message}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label>Child Name<span className="req"> *</span></label>
              <input name="child_name" type="text" placeholder="e.g. Aarav Sharma"
                value={form.child_name} onChange={handleChange} className={errors.child_name?'err':''}/>
              {errors.child_name && <span className="err-msg">{errors.child_name}</span>}
            </div>
            <div className="form-group">
              <label>Child Age (months)</label>
              <input name="child_age_months" type="number" placeholder="e.g. 36 = 3 years"
                min={12} max={96} value={form.child_age_months} onChange={handleChange}
                className={errors.child_age_months?'err':''}/>
              {errors.child_age_months && <span className="err-msg">{errors.child_age_months}</span>}
            </div>
            <div className="form-group">
              <label>Parent / Guardian Name<span className="req"> *</span></label>
              <input name="parent_name" type="text" placeholder="e.g. Priya Sharma"
                value={form.parent_name} onChange={handleChange} className={errors.parent_name?'err':''}/>
              {errors.parent_name && <span className="err-msg">{errors.parent_name}</span>}
            </div>
            <div className="form-group">
              <label>Contact Number<span className="req"> *</span></label>
              <input name="parent_phone" type="tel" placeholder="e.g. 9876543210"
                value={form.parent_phone} onChange={handleChange} className={errors.parent_phone?'err':''}/>
              {errors.parent_phone && <span className="err-msg">{errors.parent_phone}</span>}
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input name="parent_email" type="email" placeholder="e.g. priya@email.com"
                value={form.parent_email} onChange={handleChange} className={errors.parent_email?'err':''}/>
              {errors.parent_email && <span className="err-msg">{errors.parent_email}</span>}
            </div>
            <div className="form-group">
              <label>How did they hear about us?<span className="req"> *</span></label>
              <select name="lead_source" value={form.lead_source} onChange={handleChange}
                className={errors.lead_source?'err':''}>
                {SOURCES.map(o => <option key={o.value} value={o.value} disabled={!o.value}>{o.label}</option>)}
              </select>
              {errors.lead_source && <span className="err-msg">{errors.lead_source}</span>}
            </div>
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea name="notes" placeholder="e.g. Interested in Nursery, July batch…"
                value={form.notes} onChange={handleChange}/>
            </div>
          </div>
          <div style={{display:'flex',gap:'0.85rem',marginTop:'1.5rem'}}>
            <button type="submit" className="btn btn-primary" disabled={status==='loading'}>
              {status==='loading'?<><span className="spinner"/> Submitting…</>:'Submit Enquiry'}
            </button>
            <button type="button" className="btn btn-secondary"
              onClick={()=>{setForm(EMPTY);setErrors({});setStatus(null);setMessage('');}}>
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}