import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, BookOpen } from 'lucide-react';

export default function Register(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Registration attempt with:', { email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex flex-col items-center">
            <div className="rounded-full p-2 bg-primary-500">
              <BookOpen size={48} className="text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-primary-700">ProfeVardilla</h1>
          <p className="mt-2 text-gray-600">Crea tu cuenta</p>
        </div>
        
        <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl">
          <div className="p-8">
            <form onSubmit={handleSubmit}>
              <div className="mb-4 w-full">
                <label className="block text-gray-700 font-medium mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white w-full"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="relative">
                <div className="mb-4 w-full">
                  <label className="block text-gray-700 font-medium mb-1.5">
                    Contraseña
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white w-full"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="button"
                  className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-primary-500 text-white font-medium rounded-lg transition-all duration-200 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Registrarse
                </button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  ¿Ya tienes una cuenta?{' '}
                  <Link to="/login" className="text-primary-600 hover:text-primary-800 font-medium transition-colors">
                    Iniciar sesión
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};