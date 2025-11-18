import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getStorage } from "firebase/storage"; // 👈 thêm dòng này

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3rIWHQISRJPAFM9pCFs08x_PsUvHL9Lw",
  authDomain: "gym--login.firebaseapp.com",
  projectId: "gym--login",
  storageBucket: "gym--login.firebasestorage.app",
  messagingSenderId: "829657598189",
  appId: "1:829657598189:web:d346b5261269f8fb6fa4e4",
  measurementId: "G-54ZHYQ43TR",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// 👇 Storage để upload ảnh
const storage = getStorage(app);

export {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  storage, // 👈 nhớ export
};