import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatScreen from './components/ChatScreen';
import { AuthProvider } from './context/AuthContext';
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ChatScreen />} />
          <Route path="/chat/:chatId" element={<ChatScreen />} />
        </Routes>
      </Router>
    </AuthProvider>    
  );
}