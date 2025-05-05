import { FaPlus, FaChartBar, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { getHistoryList } from '../services/database';
import { useNavigate, useParams } from 'react-router-dom';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { chatId } = useParams(); 
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState([]);
  const [chatFilter, setChatFilter] = useState('all')

  useEffect(() => {
    const loadHistory = async () => {
      try {
        if (user) {
          const response = await getHistoryList(user.uid);
          const sortedChats = response.documents
            .sort((a, b) => new Date(b.$updatedAt) - new Date(a.$updatedAt))
            .map(chat => ({
              ...chat,
              date: new Date(chat.$updatedAt).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            }));
          setChatHistory(sortedChats);
        }
      } catch (err) {
        console.error('Error cargando el historial', err);
      }
    };

    loadHistory();
  }, [user, chatId]);

  const filteredHistory = chatFilter === 'all' 
    ? chatHistory 
    : chatHistory.filter(chat => chat.mode === chatFilter);

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-white shadow-md hover:bg-gray-50 transition-colors"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-20 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header with hamburger icon space */}
          <div className="h-16"></div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                onClick={() => {
                  navigate(`/`);          
                  setIsOpen(false);                  
                }}                
              >
                <FaPlus className="w-4 h-4" />
                <span>Iniciar Chat</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                onClick={() => {
                  navigate(`/resultados`);          
                  setIsOpen(false);                  
                }}
              >
                <FaChartBar className="w-4 h-4" />
                <span>Ver mis resultados</span>
              </button>
            </div>

            {/* Chat History */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-4">Historial de chats</h3>
              
              {/* Filters */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 mb-4">
                <button
                  onClick={() => setChatFilter('all')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    chatFilter === 'all' 
                      ? 'bg-white text-gray-800 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setChatFilter('practice')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    chatFilter === 'practice' 
                      ? 'bg-white text-gray-800 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Prácticas
                </button>
                <button
                  onClick={() => setChatFilter('doubts')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    chatFilter === 'doubts' 
                      ? 'bg-white text-gray-800 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Consultas
                </button>
              </div>

              {/* Chat List */}
              <div className="space-y-2">
                {filteredHistory.map(chat => (
                  <button
                    key={chat.$id}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      chatId === chat.$id 
                        ? "bg-primary-100 hover:bg-gradient-to-r from-[#F9D1D7] to-[#F2A3AE] transition-all duration-300 selectedChatName"
                        : "hover:bg-gray-50" 
                    }`}
                      onClick={() => {
                      navigate(`/chat/${chat.$id}`);          
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800">{chat.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        chat.mode === 'practice' 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-primary-50 text-primary-600'
                      }`}>
                        {chat.mode === 'practice' ? 'Práctica' : 'Consulta'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{chat.date}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}