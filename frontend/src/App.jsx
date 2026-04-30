import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import { ErrorBoundary } from './components/ErrorBoundary';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Layout with Sidebar and Header
const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full bg-surface dark:bg-gradient-to-br dark:from-[#020617] dark:via-[#0f172a] dark:to-[#020617] text-on-surface dark:text-white overflow-hidden relative transition-colors duration-500">
      <div className="relative z-10 flex w-full h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 bg-transparent">
          <Header />
          <main className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth custom-scrollbar relative">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Toaster richColors position="top-right" closeButton theme="system" toastOptions={{ style: { borderRadius: '12px' } }} />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/logs" element={
            <ProtectedRoute>
              <Layout>
                <Logs />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/alerts" element={
            <ProtectedRoute>
              <Layout>
                <Alerts />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
