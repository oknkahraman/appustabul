import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import WorkerDashboard from './pages/WorkerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import PortfolioPage from './pages/PortfolioPage';
import NotificationsPage from './pages/NotificationsPage';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage user={user} onLogout={handleLogout} />} />
          <Route path="/auth" element={<AuthPage onLogin={handleLogin} />} />
          <Route path="/worker" element={<WorkerDashboard user={user} onLogout={handleLogout} />} />
          <Route path="/employer" element={<EmployerDashboard user={user} onLogout={handleLogout} />} />
          <Route path="/jobs" element={<JobsPage user={user} onLogout={handleLogout} />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage user={user} onLogout={handleLogout} />} />
          <Route path="/portfolio/:workerId" element={<PortfolioPage user={user} onLogout={handleLogout} />} />
          <Route path="/notifications" element={<NotificationsPage user={user} onLogout={handleLogout} />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
