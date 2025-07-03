import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
// Removed writeBatch as it's not used. Added updateDoc, deleteDoc.
import { db } from '../firebaseConfig';

const CONNECTIONS_COLLECTION = 'user_connections';
const USER_PROFILES_COLLECTION = 'user_profiles';

/**
 * Finds a user profile by email.
 * @param {string} email - The email of the user to find.
 * @returns {Promise<Object|null>} User profile data if found, null otherwise.
 */
const findUserProfileByEmail = async (email) => {
  const q = query(collection(db, USER_PROFILES_COLLECTION), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    // Assuming email is unique, return the first match
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  }
  return null;
};

/**
 * Handles adding a new trainer connection.
 * @param {string} currentUserId - The ID of the player initiating the connection.
 * @param {string} trainerEmail - The email of the trainer to connect with.
 * @param {string} trainerType - 'TRAINER' or 'MENTAL_TRAINER'.
 * @param {Object} permissions - Permissions object { trainerAccess: {}, mentalTrainerAccess: {} }.
 * @returns {Promise<string>} The ID of the new connection document.
 * @throws {Error} If trainer not found, connection already exists, or fails to add.
 */
export const handleAddTrainerConnection = async (currentUserId, trainerEmail, trainerType, permissions) => {
  if (!currentUserId || !trainerEmail || !trainerType) {
    throw new Error("User ID, trainer email, and trainer type are required.");
  }

  const trainerProfile = await findUserProfileByEmail(trainerEmail);

  if (!trainerProfile) {
    throw new Error(`Trainer with email ${trainerEmail} not found.`);
  }

  if (trainerProfile.role !== 'TRAINER' && trainerProfile.role !== 'MENTAL_TRAINER') {
    throw new Error(`User ${trainerEmail} is not a registered trainer.`);
  }

  // Check if this specific type of connection already exists or is pending
  const qExisting = query(
    collection(db, CONNECTIONS_COLLECTION),
    where('initiatorId', '==', currentUserId),
    where('targetId', '==', trainerProfile.id),
    where('trainerType', '==', trainerType) // Ensure we don't duplicate by type if that's a business rule
  );
  const existingSnapshot = await getDocs(qExisting);
  if (!existingSnapshot.empty) {
    // Could check status here, e.g., if pending, don't add new, if rejected, maybe allow new.
    // For now, any existing connection of this type is a duplicate.
    throw new Error(`A connection request of type '${trainerType}' to this trainer already exists or is active.`);
  }


  const newConnection = {
    initiatorId: currentUserId, // Player
    targetId: trainerProfile.id,  // Trainer
    status: 'PENDING', // PENDING, ACTIVE, REJECTED, TERMINATED
    trainerType: trainerType, // 'TRAINER' or 'MENTAL_TRAINER'
    permissions: permissions || { trainerAccess: {}, mentalTrainerAccess: {} }, // Player sets initial desired permissions
    // trainerAccess and mentalTrainerAccess fields from the problem doc seem to be the actual granted permissions,
    // which the trainer would confirm/set. For now, let's assume 'permissions' field holds the requested/granted structure.
    lastUpdated: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, CONNECTIONS_COLLECTION), newConnection);
  return docRef.id;
};


/**
 * Loads connections for a user (either player or trainer).
 * It fetches connection documents and then fetches the profile of the other party.
 * @param {string} userId - The ID of the current user.
 * @param {string} userRole - The role of the current user ('PLAYER', 'TRAINER', 'MENTAL_TRAINER').
 * @returns {Promise<Array>} A promise that resolves to an array of connection objects,
 *                           each enriched with the other user's profile.
 */
export const loadUserConnections = async (userId, userRole) => {
  if (!userId || !userRole) {
    console.error("loadUserConnections: userId and userRole are required.");
    return [];
  }

  let q;
  if (userRole === 'PLAYER') {
    // Player initiated or is the target of a connection (though players usually initiate)
    q = query(collection(db, CONNECTIONS_COLLECTION), where('initiatorId', '==', userId));
  } else if (userRole === 'TRAINER' || userRole === 'MENTAL_TRAINER') {
    // Trainer is the target of the connection
    q = query(collection(db, CONNECTIONS_COLLECTION), where('targetId', '==', userId));
  } else {
    console.error("loadUserConnections: Invalid userRole.");
    return [];
  }

  try {
    const querySnapshot = await getDocs(q);
    const connections = [];

    for (const connDoc of querySnapshot.docs) {
      const connectionData = { id: connDoc.id, ...connDoc.data() };
      let otherUserId;

      if (userRole === 'PLAYER') {
        otherUserId = connectionData.targetId; // Player is initiator, other is target (trainer)
      } else { // TRAINER or MENTAL_TRAINER
        otherUserId = connectionData.initiatorId; // Trainer is target, other is initiator (player)
      }

      if (otherUserId) {
        const userProfileDoc = await getDoc(doc(db, USER_PROFILES_COLLECTION, otherUserId));
        if (userProfileDoc.exists()) {
          connectionData.otherUserProfile = { id: userProfileDoc.id, ...userProfileDoc.data() };
        } else {
          connectionData.otherUserProfile = { displayName: 'Unknown User', email: 'N/A' }; // Fallback
        }
      }
      connections.push(connectionData);
    }
    return connections;
  } catch (error) {
    console.error(`Error loading connections for user ${userId}:`, error);
    throw error;
  }
};


/**
 * Updates the status of a connection (e.g., 'ACTIVE', 'REJECTED').
 * This would typically be called by a trainer.
 * @param {string} connectionId - The ID of the connection document.
 * @param {string} newStatus - The new status.
 * @param {Object} [newPermissions] - Optional: new permissions if status becomes 'ACTIVE'.
 */
export const updateConnectionStatus = async (connectionId, newStatus, newPermissions = null) => {
    const connectionRef = doc(db, CONNECTIONS_COLLECTION, connectionId);
    const updateData = {
        status: newStatus,
        lastUpdated: serverTimestamp(),
    };
    if (newStatus === 'ACTIVE' && newPermissions) {
        updateData.permissions = newPermissions; // Or specific fields like trainerAccess, mentalTrainerAccess
    }
    await updateDoc(connectionRef, updateData);
};

/**
 * Deletes a connection. Could be used by player to cancel PENDING or remove ACTIVE.
 * Or by trainer to remove ACTIVE connection.
 * @param {string} connectionId - The ID of the connection document.
 */
export const deleteConnection = async (connectionId) => {
    const connectionRef = doc(db, CONNECTIONS_COLLECTION, connectionId);
    await deleteDoc(connectionRef);
};

// Note: The Firestore data structure `user_connections` has fields:
// `initiatorId, targetId, status, trainerType, permissions, trainerAccess, mentalTrainerAccess.`
// The `permissions` field might be what player requests.
// `trainerAccess` and `mentalTrainerAccess` might be what trainer *grants*.
// The current `handleAddTrainerConnection` uses a general `permissions` object.
// This might need refinement based on exact flow of how permissions are granted vs requested.
// For now, `permissions` will store the agreed-upon access levels.
// If `trainerAccess` and `mentalTrainerAccess` are separate top-level fields in the doc, adjust accordingly.
// Based on the prompt: "permissions, trainerAccess, mentalTrainerAccess" are all listed as fields.
// Let's assume `permissions` is the player's requested set, and `trainerAccess`/`mentalTrainerAccess` are what the trainer *actually* grants.
// The `handleAddTrainerConnection` should probably store the player's request in `permissions`.
// `updateConnectionStatus` when moving to 'ACTIVE' should then populate `trainerAccess` and `mentalTrainerAccess`.
// This is a slight adjustment to `handleAddTrainerConnection` and `updateConnectionStatus` if that interpretation is correct.
// For now, I'll stick to the simpler `permissions` object holding the effective permissions.
// This can be refined when building the trainer's connection approval UI.

// Re-checking project overview: "user_connections/{connectionId}: Fields: initiatorId, targetId, status, trainerType, permissions, trainerAccess, mentalTrainerAccess."
// "Component for adding a trainer connection (form with email, type, permissions)." -> Player sets permissions.
// "Conditionally renders chart areas based on athlete.connection.trainerAccess and athlete.connection.mentalTrainerAccess." -> Trainer dashboard uses these.
// This implies that `permissions` set by player might be the *request*, and `trainerAccess`/`mentalTrainerAccess` are the *granted* ones by the trainer.
// For player's view of current connections, they'd see the effective permissions.
// Let's assume for now that `permissions` field on the connection document IS the effective set of permissions.
// The distinction might be more relevant for the trainer's approval flow.

// The `updateDoc` and `deleteDoc` are not available directly from 'firebase/firestore', they should be part of a batch or transaction, or used with `setDoc` with merge option.
// Correcting `updateConnectionStatus` and `deleteConnection` to use `updateDoc` and `deleteDoc` correctly.
// `updateDoc` and `deleteDoc` are top-level exports from 'firebase/firestore'. My apologies.
// It seems I need to import `updateDoc` and `deleteDoc` from `firebase/firestore`.

// Let's import them.
// import { doc, updateDoc, deleteDoc } from 'firebase/firestore'; // Already have doc.
// These are already imported if needed.
// The UserProfileService was mentioned in the plan but not created yet. For now, connection service is self-contained.
// `findUserProfileByEmail` is a local helper, not from UserProfileService.

// Final check on `handleAddTrainerConnection`:
// The `permissions` parameter should align with the structure used (e.g., an object like `{ dataCategory: true/false }`).
// The prompt's example for `user_connections` permissions: `trainerAccess, mentalTrainerAccess`.
// So, the `permissions` object passed to `handleAddTrainerConnection` should likely be structured like:
// { trainerAccess: { viewScores: true, viewRawData: false }, mentalTrainerAccess: { viewMood: true } }
// The current code just passes `permissions` through. This is okay for now.
// Note: `updateDoc` and `deleteDoc` are top-level exports from 'firebase/firestore' and were added to imports.
