import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

const UserProfileContext = createContext();

export function useUserProfile() {
  return useContext(UserProfileContext);
}

export function UserProfileProvider({ children }) {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  async function fetchUserProfile(userId) {
    setLoadingProfile(true);
    const docRef = doc(db, 'user_profiles', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setUserProfile({ id: docSnap.id, ...docSnap.data() });
    } else {
      setUserProfile(null); // Or handle as an error / specific case
    }
    setLoadingProfile(false);
  }

  async function ensureUserProfile(firebaseUser) {
    if (!firebaseUser) return null;
    setLoadingProfile(true);
    const docRef = doc(db, 'user_profiles', firebaseUser.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const profileData = { id: docSnap.id, ...docSnap.data() };
      setUserProfile(profileData);
      setLoadingProfile(false);
      return profileData;
    } else {
      // If no profile exists, and user is not a trainer (trainers are created via registerTrainer)
      // create a default PLAYER profile.
      // This logic assumes that only players would log in without an existing profile.
      // Trainers should have profiles created during their specific registration flow.
      const newProfileData = {
        userId: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email, // Default display name
        role: 'PLAYER', // Default role
        experience: '', // Default empty
        lastUpdated: new Date(),
      };
      await setDoc(docRef, newProfileData);
      setUserProfile({ id: firebaseUser.uid, ...newProfileData });
      setLoadingProfile(false);
      return newProfileData;
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchUserProfile(currentUser.uid);
    } else {
      setUserProfile(null);
      setLoadingProfile(false);
    }
  }, [currentUser]);

  const value = {
    userProfile,
    loadingProfile,
    fetchUserProfile,
    ensureUserProfile,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}
