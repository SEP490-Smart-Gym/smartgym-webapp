// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA3rIWHQISRJPAFM9pCFs08x_PsUvHL9Lw",
  authDomain: "gym--login.firebaseapp.com",
  projectId: "gym--login",
  storageBucket: "gym--login.firebasestorage.app",
  messagingSenderId: "829657598189",
  appId: "1:829657598189:web:d346b5261269f8fb6fa4e4",
  measurementId: "G-54ZHYQ43TR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Provider cho Google
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup, signOut };