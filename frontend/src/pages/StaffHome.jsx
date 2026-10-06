import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import CounsellorDashboard from './CounsellorDashboard';

// Admins see the resistance & counselling analytics; counsellors see their request queue.
export default function StaffHome() {
  const { user } = useAuth();
  return user.role === 'ADMIN' ? <AdminDashboard /> : <CounsellorDashboard />;
}
