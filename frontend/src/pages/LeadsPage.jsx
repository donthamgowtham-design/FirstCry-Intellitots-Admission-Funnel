import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const STAGE_BADGE = {
  enquiry:'badge-blue',tour_scheduled:'badge-yellow',tour_done:'badge-yellow',
  demo_scheduled:'badge-purple',demo_done:'badge-purple',follow_up:'badge-orange',
  referral_check:'badge-orange',seat_availability:'badge-orange',
  confirmed:'badge-green',lost:'badge-red',
};
const SOURCE_LABEL = {walk_in:'Walk-in',social_media:'Social Media',referral:'Referral',google_ad:'Google Ad',other:'Other'};

export default function LeadsPage() {
  const navigate = useNavigate();
  const [leads,setLeads]     = useState([]);
  const [total,setTotal]     = useState(0);
  const [loading,setLoading] = useState(true);
  const [error,setError]     = useState('');
  const [filters,setFilters] = useState({stage:'',source:'',search:''});

  const fetchLeads = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (filters.stage)  params.stage  = filters.stage;
      if (filters.source) params.source = filters.source;
      const res = await axiosClient.get('/leads', {params});
      let data = res.data.leads;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        data = data.filter(l =>
          l.child_name.toLowerCase().includes(q) ||
          l.parent_name.toLowerCase().includes(q) ||
          l.parent_phone.includes(q)
        );
      }
      setLeads(data); setTotal(res.data.total);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [filters.stage, filters.source, filters.search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  return (
    <div className="page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h1 className="page-title" style={{margin:0}}>All Leads ({total})</h1>
        <button className="btn btn-primary" onClick={() => navigate('/enquiry')}>+ New Enquiry</button>
      </div>
      <div className="filters-bar">
        <input type="text" placeholder="Search name or phone…" value={filters.search}
          onChange={e => setFilters(p => ({...p,search:e.target.value}))}/>
        <select value={filters.stage} onChange={e => setFilters(p => ({...p,stage:e.target.value}))}>
          <option value="">All Stages</option>
          {['enquiry','tour_scheduled','tour_done','demo_scheduled','demo_done',
            'follow_up','referral_check','seat_availability','confirmed','lost'
          ].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <select value={filters.source} onChange={e => setFilters(p => ({...p,source:e.target.value}))}>
          <option value="">All Sources</option>
          {Object.entries(SOURCE_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={fetchLeads}>Refresh</button>
      </div>
      <div className="card" style={{padding:0}}>
        {loading && <div style={{padding:'2rem',textAlign:'center',color:'var(--muted)'}}>Loading…</div>}
        {error   && <div className="alert alert-error" style={{margin:'1rem'}}>{error}</div>}
        {!loading && !error && (
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Child</th><th>Parent</th><th>Phone</th>
                <th>Source</th><th>Stage</th><th>Date</th><th></th>
              </tr></thead>
              <tbody>
                {leads.length===0 && (
                  <tr><td colSpan={7} style={{textAlign:'center',color:'var(--muted)',padding:'2rem'}}>No leads found.</td></tr>
                )}
                {leads.map(lead => (
                  <tr key={lead.id}>
                    <td style={{fontWeight:600}}>
                      {lead.is_priority && <span style={{color:'var(--warning)',marginRight:4}}>★</span>}
                      {lead.child_name}
                    </td>
                    <td>{lead.parent_name}</td>
                    <td>{lead.parent_phone}</td>
                    <td>{SOURCE_LABEL[lead.lead_source]||lead.lead_source}</td>
                    <td><span className={`badge ${STAGE_BADGE[lead.current_stage]||'badge-gray'}`}>
                      {lead.current_stage.replace(/_/g,' ')}
                    </span></td>
                    <td style={{color:'var(--muted)',fontSize:'0.82rem'}}>{new Date(lead.created_at).toLocaleDateString('en-IN')}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => navigate(`/leads/${lead.id}`)}>View →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}