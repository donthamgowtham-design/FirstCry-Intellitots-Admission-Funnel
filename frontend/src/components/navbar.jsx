import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        FirstCry Intellitots <span>| Admission Funnel</span>
      </NavLink>
      <div className="nav-links">
        <NavLink to="/"        className={({isActive}) => 'nav-link'+(isActive?' active':'')}>Dashboard</NavLink>
        <NavLink to="/leads"   className={({isActive}) => 'nav-link'+(isActive?' active':'')}>All Leads</NavLink>
        <NavLink to="/enquiry" className={({isActive}) => 'nav-link'+(isActive?' active':'')}>New Enquiry</NavLink>
      </div>
    </nav>
  );
}