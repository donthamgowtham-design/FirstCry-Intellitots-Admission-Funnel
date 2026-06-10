import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const SOURCE_LABEL = {walk_in:'Walk-in',social_media:'Social Media',referral:'Referral',google_ad:'Google Ad',other:'Other'};
const STAGE_COLOR  = {enquiry:'#2563eb',tour_scheduled:'#d97706',tour_done:'#d97706',demo_scheduled:'#7c3aed',demo_done:'#7c3aed',follow_up:'#ea580c',referral_check:'#ea580c',seat_availability:'#ea580c',confirmed:'#16a34a',lost:'#dc2626'};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data,setData]       = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError]     = useState('');

  useEffect(() => {
    axiosClient.get('/dashboard/summary')
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page" style={{color:'var(--muted)'}}>Loading dashboard…</div>;
  if (error)   return <div className="page"><div className="alert alert-error">{error}</div></div>;

  const maxCount = Math.max(...data.funnelCounts.map(f => +f.count), 1);
  const lost     = +(data.funnelCounts.find(f => f.stage==='lost')?.count || 0);
  const active   = data.totalLeads - data.confirmedLeads - lost;

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Leads</div>
          <div className="stat-value">{data.totalLeads}</div>
          <div className="stat-sub">All enquiries</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confirmed</div>
          <div className="stat-value" style={{color:'var(--success)'}}>{data.confirmedLeads}</div>
          <div className="stat-sub">Admissions done</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Conversion Rate</div>
          <div className="stat-value" style={{color:'var(--primary)'}}>{data.conversionRate}</div>
          <div className="stat-sub">Enquiry → Confirmed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Leads</div>
          <div className="stat-value" style={{color:'var(--warning)'}}>{active}</div>
          <div className="stat-sub">In progress</div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem'}}>
        <div className="card">
          <div className="section-title" style={{marginBottom:'1rem'}}>Funnel Stage Breakdown</div>
          <div className="funnel-bars">
            {data.funnelCounts.map(f => (
              <div className="funnel-row" key={f.stage}>
                <div className="funnel-label">{f.stage.replace(/_/g,' ')}</div>
                <div className="funnel-bar-wrap">
                  <div className="funnel-bar" style={{
                    width:`${Math.round((+f.count/maxCount)*100)}%`,
                    background:STAGE_COLOR[f.stage]||'#94a3b8',
                    minWidth:+f.count>0?'2rem':'0',
                  }}>{+f.count>0?f.count:''}</div>
                </div>
                <div className="funnel-count">{f.count}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="section-title" style={{marginBottom:'1rem'}}>Leads by Source</div>
          <div style={{display:'flex',flexDirection:'column',gap:'0.85rem'}}>
            {data.sourceBreakdown.map(s => {
              const pct = data.totalLeads>0?Math.round((+s.count/data.totalLeads)*100):0;
              return (
                <div key={s.source}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.3rem',fontSize:'0.85rem'}}>
                    <span>{SOURCE_LABEL[s.source]||s.source}</span>
                    <span style={{fontWeight:600}}>{s.count} ({pct}%)</span>
                  </div>
                  <div style={{background:'var(--bg)',borderRadius:999,height:8,overflow:'hidden'}}>
                    <div style={{width:`${pct}%`,height:'100%',background:'var(--primary)',borderRadius:999,transition:'width 0.5s'}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{marginTop:'1.25rem',display:'flex',gap:'0.85rem'}}>
        <button className="btn btn-primary" onClick={() => navigate('/enquiry')}>+ New Enquiry</button>
        <button className="btn btn-secondary" onClick={() => navigate('/leads')}>View All Leads →</button>
      </div>
    </div>
  );
}