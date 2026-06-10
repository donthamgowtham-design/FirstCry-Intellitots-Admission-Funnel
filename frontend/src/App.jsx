import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/global.css';
import Navbar         from './components/Navbar';
import DashboardPage  from './pages/DashboardPage';
import LeadsPage      from './pages/LeadsPage';
import LeadDetailPage from './pages/LeadDetailPage';
import EnquiryPage    from './pages/EnquiryPage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"          element={<DashboardPage />} />
        <Route path="/leads"     element={<LeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/enquiry"   element={<EnquiryPage />} />
      </Routes>
    </BrowserRouter>
  );
}