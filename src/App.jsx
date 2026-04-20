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
import { AppProvider } from './context/AppContext';
import { matchRoute, useRouter } from './lib/router';

function AppInner() {
  const { pathname, query, navigate } = useRouter();
  const route = matchRoute(pathname);

  let page = <NotFoundPage navigate={navigate} />;

  if (route.name === 'home') page = <HomePage navigate={navigate} />;
  if (route.name === 'courses') page = <CoursesPage navigate={navigate} />;
  if (route.name === 'course-detail') page = <CourseDetailPage courseId={route.courseId} navigate={navigate} />;
  if (route.name === 'quiz') {
    const courseFromQuery = Number(query.get('course') || '') || null;
    page = <QuizPage courseFromQuery={courseFromQuery} />;
  }
  if (route.name === 'contact') page = <ContactPage />;
  if (route.name === 'login') page = <LoginPage navigate={navigate} />;
  if (route.name === 'register') page = <RegisterPage navigate={navigate} />;
  if (route.name === 'admin') page = <AdminPage />;

  return (
    <>
      <SiteLayout pageKey={route.name} navigate={navigate}>
        {page}
      </SiteLayout>
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
