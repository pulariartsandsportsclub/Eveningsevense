import { useTournament } from '../context/TournamentContext';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function Toast() {
  const { toasts } = useTournament();

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {t.message}
        </div>
      ))}
    </div>
  );
}
