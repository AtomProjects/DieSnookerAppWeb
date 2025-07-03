import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Assuming db is exported from firebaseConfig

const USER_PROFILES_COLLECTION = 'user_profiles';

/**
 * Fetches a user profile by userId.
 * (This is similar to what UserProfileContext does, but can be a standalone service function)
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Object|null>} User profile data if found, null otherwise.
 */
export const getUserProfile = async (userId) => {
  if (!userId) {
    console.error("getUserProfile: userId is required.");
    return null;
  }
  const docRef = doc(db, USER_PROFILES_COLLECTION, userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    console.log(`No profile found for user ${userId}`);
    return null;
  }
};

/**
 * Creates or updates a user profile.
 * Used by AuthContext's ensureUserProfile for players, and potentially by registration.
 * @param {string} userId - The ID of the user.
 * @param {Object} profileData - Data to set for the profile.
 * @param {boolean} [merge=false] - Whether to merge with existing document or overwrite.
 */
export const setUserProfile = async (userId, profileData, merge = false) => {
  if (!userId) {
    throw new Error("setUserProfile: userId is required.");
  }
  const docRef = doc(db, USER_PROFILES_COLLECTION, userId);
  const dataWithTimestamp = {
    ...profileData,
    lastUpdated: serverTimestamp(),
  };
  // If creating for the first time, ensure 'createdAt' is also set (or handle in initial profileData)
  if (!merge && !profileData.createdAt) {
    dataWithTimestamp.createdAt = serverTimestamp();
  }
  await setDoc(docRef, dataWithTimestamp, { merge });
};


/**
 * Updates specific fields in a user's profile.
 * @param {string} userId - The ID of the user whose profile is to be updated.
 * @param {Object} updates - An object containing the fields to update.
 * @returns {Promise<void>}
 * @throws {Error} If updating fails.
 */
export const updateUserProfile = async (userId, updates) => {
  if (!userId) {
    throw new Error("updateUserProfile: userId is required.");
  }
  if (typeof updates !== 'object' || updates === null || Object.keys(updates).length === 0) {
    throw new Error("updateUserProfile: updates object is invalid or empty.");
  }

  const docRef = doc(db, USER_PROFILES_COLLECTION, userId);
  const updatesWithTimestamp = {
    ...updates,
    lastUpdated: serverTimestamp(),
  };

  // Ensure sensitive fields like 'role' or 'email' are not accidentally updated here
  // or add specific checks if this function is meant for limited updates.
  // For example: delete updatesWithTimestamp.role; delete updatesWithTimestamp.email;

  try {
    await updateDoc(docRef, updatesWithTimestamp);
  } catch (error) {
    console.error(`Error updating profile for user ${userId}:`, error);
    throw error;
  }
};


// ensureUserProfile was in UserProfileContext, it's more of a context-specific logic flow
// than a generic service, as it combines fetching and creating if not exists,
// and also sets context state. Keeping it in the context might be cleaner.
// The context can use getUserProfile and setUserProfile from this service.

export default {
  getUserProfile,
  setUserProfile,
  updateUserProfile,
};
