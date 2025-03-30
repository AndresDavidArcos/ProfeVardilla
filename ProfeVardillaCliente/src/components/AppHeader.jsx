import { FcGoogle } from 'react-icons/fc';
import Uvardilla from '../assets/Uvardilla';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function AppHeader(){
const { user, userLoading, login, logout } = useAuth();
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [currentChatName, setCurrentChatName] = useState('');
const { chatId } = useParams();

const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const updateChatName = () => {
      const selectedChatElement = document.querySelector('.selectedChatName h4');
      const newName = selectedChatElement?.textContent || '';
      setCurrentChatName(newName);
    };

    updateChatName();
  }, [chatId]);
  
return <header className="bg-white shadow-sm fixed top-0 w-full z-10">
<div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
  <div className="flex items-center space-x-3">
  <Uvardilla className="w-8 h-8 text-red-600 scale-[1.2]" />
  <h1 className="text-xl font-semibold text-gray-800">Profesor Vardilla</h1>
  </div>
  {currentChatName && (
  <span className="ml-3 text-black tracking-wider">
    {currentChatName}
  </span>
  )}
  <div className="relative">
  {userLoading ? (
    <div className="flex items-center gap-2">
      {/* Skeleton para el botón de login */}
      <div className="h-[42px] w-[178px] bg-gray-200 rounded-md animate-pulse" />
    </div>
  ) : !user ? (
    // Botón de login cuando no hay usuario
    <button
      onClick={login}
      className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md"
    >
      <FcGoogle className="h-5 w-5 bg-white rounded-full" />
      <span>Iniciar sesión</span>
    </button>
  ) : (
    // Perfil de usuario cuando está autenticado
    <div className="relative">
      <div
        onClick={toggleMenu}
        className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <img
          src={user.prefs?.photoURL || `https://ui-avatars.com/api/?name=${user.name}&background=ff0000&color=fff`}//TO DO: poner foto de perfil, ver foro de appwrite
          alt="Perfil de usuario"
          className="w-8 h-8 rounded-full"
        />
        <span className="font-medium">{user.name}</span>
      </div>

      {/* Menú desplegable */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <button
            onClick={logout}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="w-4 h-4 mr-2 text-red-600" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  )}
</div>
</div>
</header>
}
