import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ChatScreen from './components/ChatScreen';
import EvaluationResults from './components/EvaluationResults';
import AppHeader from './components/AppHeader';
import Sidebar from './components/Sidebar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <AppHeader />
        <Outlet />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<ChatScreen />} />
            <Route path="/chat/:chatId" element={<ChatScreen />} />
            <Route path="/resultados" element={<EvaluationResults />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}