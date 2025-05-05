import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle,  logout as logoutFirebase } from '../services/firebase';
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userLoading, setuserLoading] = useState(true);

  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (userData) => {
        console.log("Usuario autenticado:", userData);
        setUser(userData);
        setuserLoading(false);
      });
    
      return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error("Error al loguear:", err);
    }
  };
  
  const logout = async () => {
    try {
      await logoutFirebase();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};