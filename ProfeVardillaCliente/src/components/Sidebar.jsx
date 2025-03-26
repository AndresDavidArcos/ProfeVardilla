import { FaPlus, FaChartBar } from 'react-icons/fa';
export default function Sidebar({ 
  isOpen, 
  onClose, 
  chatFilter, 
  setChatFilter, 
}) {

  const chatHistory = "appwrite"

  const filteredHistory = chatFilter === 'all' 
    ? chatHistory 
    : chatHistory.filter(chat => chat.type === chatFilter);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20"
          onClick={onClose}
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
              >
                <FaPlus className="w-4 h-4" />
                <span>Iniciar Chat</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
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
                  Dudas
                </button>
              </div>

              {/* Chat List */}
              <div className="space-y-2">
                {filteredHistory.map(chat => (
                  <button
                    key={chat.id}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      // Aquí iría la lógica para cargar el chat
                      onClose();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800">{chat.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        chat.type === 'practice' 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-primary-50 text-primary-600'
                      }`}>
                        {chat.type === 'practice' ? 'Práctica' : 'Consulta'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{chat.date}</p>
                    <p className="text-sm text-gray-600 truncate mt-1">{chat.preview}</p>
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