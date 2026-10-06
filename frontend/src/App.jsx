import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout, PublicLayout } from './components/Layout';
import { Loading } from './components/ui';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Careers from './pages/Careers';
import CareerDetail from './pages/CareerDetail';
import OutcomeEvidence from './pages/OutcomeEvidence';
import Profile from './pages/Profile';
import FamilyCentre from './pages/FamilyCentre';
import AICounsellor from './pages/AICounsellor';
import CounsellorRequest from './pages/CounsellorRequest';
import StudentDashboard from './pages/student/Dashboard';
import Assessment from './pages/student/Assessment';
import Results from './pages/student/Results';
import Recommendations from './pages/student/Recommendations';
import Roadmap from './pages/student/Roadmap';
import FinalPlan from './pages/student/FinalPlan';
import ParentDashboard from './pages/parent/Dashboard';
import Concerns from './pages/parent/Concerns';
import ParentEvidence from './pages/parent/Evidence';
import StaffHome from './pages/StaffHome';

function RequireAuth({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardSwitch() {
  const { user } = useAuth();
  if (user.role === 'STUDENT') return <StudentDashboard />;
  if (user.role === 'PARENT') return <ParentDashboard />;
  return <StaffHome />;
}

// Career pages are public, but signed-in users see them inside the app navigation.
function CareerShell() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <AppLayout /> : <PublicLayout />;
}

const STUDENT = ['STUDENT'];
const PARENT = ['PARENT'];
const FAMILY = ['STUDENT', 'PARENT'];

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<CareerShell />}>
        <Route path="/careers" element={<Careers />} />
        <Route path="/careers/:id" element={<CareerDetail />} />
        <Route path="/careers/:id/evidence" element={<OutcomeEvidence />} />
      </Route>

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<DashboardSwitch />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/assessment" element={<RequireAuth roles={STUDENT}><Assessment /></RequireAuth>} />
        <Route path="/results" element={<RequireAuth roles={STUDENT}><Results /></RequireAuth>} />
        <Route path="/recommendations" element={<RequireAuth roles={FAMILY}><Recommendations /></RequireAuth>} />
        <Route path="/roadmap" element={<RequireAuth roles={FAMILY}><Roadmap /></RequireAuth>} />
        <Route path="/plan" element={<RequireAuth roles={FAMILY}><FinalPlan /></RequireAuth>} />
        <Route path="/family" element={<RequireAuth roles={FAMILY}><FamilyCentre /></RequireAuth>} />
        <Route path="/ask" element={<RequireAuth roles={FAMILY}><AICounsellor /></RequireAuth>} />
        <Route path="/counsellor-request" element={<RequireAuth roles={FAMILY}><CounsellorRequest /></RequireAuth>} />
        <Route path="/concerns" element={<RequireAuth roles={FAMILY}><Concerns /></RequireAuth>} />
        <Route path="/evidence" element={<RequireAuth roles={FAMILY}><ParentEvidence /></RequireAuth>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
