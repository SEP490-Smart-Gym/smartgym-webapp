// import { createContext, useContext, useEffect, useState } from "react";
// import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
// import { auth } from "../firebase/firebase"; // file config Firebase

// const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Lắng nghe trạng thái đăng nhập
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
//       if (firebaseUser) {
//         const mappedUser = {
//           uid: firebaseUser.uid,
//           name: firebaseUser.displayName,
//           email: firebaseUser.email,
//           photo: firebaseUser.photoURL,
//         };
//         setUser(mappedUser);
//         localStorage.setItem("user", JSON.stringify(mappedUser));
//       } else {
//         setUser(null);
//         localStorage.removeItem("user");
//       }
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   // Login với Google
//   const loginWithGoogle = async () => {
//     const provider = new GoogleAuthProvider();
//     try {
//       const result = await signInWithPopup(auth, provider);
//       const firebaseUser = result.user;
//       const mappedUser = {
//         uid: firebaseUser.uid,
//         name: firebaseUser.displayName,
//         email: firebaseUser.email,
//         photo: firebaseUser.photoURL,
//       };
//       setUser(mappedUser);
//       localStorage.setItem("user", JSON.stringify(mappedUser));
//     } catch (err) {
//       console.error("Google login error:", err);
//     }
//   };

//   // Logout
//   const logout = async () => {
//     await signOut(auth);
//     setUser(null);
//     localStorage.removeItem("user");
//   };

//   return (
//     <AuthContext.Provider value={{ user, loginWithGoogle, logout }}>
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   return useContext(AuthContext);
// }
