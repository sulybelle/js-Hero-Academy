import { Navigate, Outlet, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import QuizPage from './pages/QuizPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import SiteLayout from './components/SiteLayout';
import ToastContainer from './components/ToastContainer';
import { AppProvider, useApp } from './context/AppContext';

function AppLayout() {
  return (
    <SiteLayout>
      <Outlet />
    </SiteLayout>
  );
}

function CourseDetailRoute() {
  const { courseId } = useParams();
  const parsedId = Number(courseId);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return <NotFoundPage />;
  }

  return <CourseDetailPage courseId={parsedId} />;
}

function QuizRoute() {
  const [searchParams] = useSearchParams();
  const courseFromQuery = Number(searchParams.get('course') || '') || null;
  return <QuizPage courseFromQuery={courseFromQuery} />;
}

function ProtectedRoute() {
  const { user } = useApp();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <Outlet />;
}

function AppInner() {
  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="course/:courseId" element={<CourseDetailRoute />} />
          <Route path="quiz" element={<QuizRoute />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
