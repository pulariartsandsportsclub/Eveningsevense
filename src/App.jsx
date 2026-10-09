import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TournamentProvider } from './context/TournamentContext';
import Header from './components/Header';
import AdminPanel from './components/AdminPanel/AdminPanel';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import Fixtures from './pages/Fixtures';
import Results from './pages/Results';
import Leaderboard from './pages/Leaderboard';

export default function App() {
  return (
    <TournamentProvider>
      <BrowserRouter>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/fixtures" element={<Fixtures />} />
            <Route path="/results" element={<Results />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>
        <AdminPanel />
        <Toast />
      </BrowserRouter>
    </TournamentProvider>
  );
}
