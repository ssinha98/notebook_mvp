// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA_y1WhNZ1lM3jmX8a7fs-hB3GlC9QPNcw",
    authDomain: "notebookmvp.firebaseapp.com",
    projectId: "notebookmvp",
    storageBucket: "notebookmvp.firebasestorage.app",
    messagingSenderId: "326873913382",
    appId: "1:326873913382:web:59c21b4ea3651a428aaee7",
    measurementId: "G-NZY8WE3848"
  };
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  // Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;