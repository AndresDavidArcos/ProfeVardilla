import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyCCMPzcybT_XUb-tfF7B9CjRvEZfWB_gXk",
  authDomain: "profevardilla-b5fe4.firebaseapp.com",
  projectId: "profevardilla-b5fe4",
  storageBucket: "profevardilla-b5fe4.firebasestorage.app",
  messagingSenderId: "779740310418",
  appId: "1:779740310418:web:78b4dc7335f8fb46ac6f4b",
  measurementId: "G-ECSHJHB2WM"
};

const app = initializeApp(firebaseConfig);

const provider = new GoogleAuthProvider();
  
provider.setCustomParameters({   
    prompt : "select_account "
});
export const auth = getAuth();
export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);