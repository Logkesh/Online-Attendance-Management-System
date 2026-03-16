import { AuthPage } from './pages/AuthPage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { useAuth } from './context/AuthContext';

const App = () => {
  const { user } = useAuth();

  if (!user) {
    return <AuthPage />;
  }

  if (user.role === 'teacher') {
    return <TeacherDashboard />;
  }

  return <StudentDashboard />;
};

export default App;
