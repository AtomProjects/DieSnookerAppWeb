import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuthState, setLoadingAuthState] = useState(true);

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    return signOut(auth);
  }

  async function registerTrainer(email, password, displayName, experience, role) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Create user profile in Firestore
    await setDoc(doc(db, 'user_profiles', user.uid), {
      userId: user.uid,
      email: user.email,
      displayName: displayName,
      role: role, // 'TRAINER' or 'MENTAL_TRAINER'
      experience: experience,
      lastUpdated: new Date(),
    });
    // Send verification email
    // await sendVerificationEmail(user); // Consider if this should be blocking or not
    return userCredential;
  }

  // Simplified sendVerificationEmail - can be called after registration if needed
  async function sendVerificationEmail() {
    if (auth.currentUser) {
      return sendEmailVerification(auth.currentUser);
    }
    throw new Error("No user is currently signed in to send a verification email.");
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoadingAuthState(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loadingAuthState,
    login,
    logout,
    registerTrainer,
    sendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loadingAuthState && children}
    </AuthContext.Provider>
  );
}
