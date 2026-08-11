import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Direct imports for instant rendering
import DashboardHome from './pages/DashboardHome';
import GlobalSearch from './pages/GlobalSearch';
import FileExplorer from './pages/FileExplorer';
import RecordExplorer from './pages/RecordExplorer';
import BatchExplorer from './pages/BatchExplorer';
import Analytics from './pages/Analytics';
import FileDetails from './pages/FileDetails';
import RecordDetails from './pages/RecordDetails';
import BatchDetails from './pages/BatchDetails';
import Login from './pages/Login';

// Page transition wrapper — gives every route a smooth fade-up entrance
const AnimatedPage = ({ children }) => (
  <div
    className="animate-fade-up flex-1 flex flex-col min-h-full"
    style={{ animationDuration: '0.35s', animationFillMode: 'both' }}
  >
    {children}
  </div>
);

const Layout = ({ children }) => (
  <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#070A10] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto min-h-0 flex flex-col bg-slate-50 dark:bg-[#070A10]">
        {children}
      </main>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout><AnimatedPage>{children}</AnimatedPage></Layout>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/"         element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
            <Route path="/search"   element={<ProtectedRoute><GlobalSearch /></ProtectedRoute>} />
            <Route path="/files"    element={<ProtectedRoute><FileExplorer /></ProtectedRoute>} />
            <Route path="/files/:fileId"    element={<ProtectedRoute><FileDetails /></ProtectedRoute>} />
            <Route path="/records"          element={<ProtectedRoute><RecordExplorer /></ProtectedRoute>} />
            <Route path="/records/:recordId" element={<ProtectedRoute><RecordDetails /></ProtectedRoute>} />
            <Route path="/batches"          element={<ProtectedRoute><BatchExplorer /></ProtectedRoute>} />
            <Route path="/batches/:batchId" element={<ProtectedRoute><BatchDetails /></ProtectedRoute>} />
            <Route path="/analytics"   element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
