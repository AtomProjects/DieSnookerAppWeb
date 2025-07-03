import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Fetches a collection for a specific user, ordered by a specified field.
 * @param {string} collectionName - The name of the Firestore collection.
 * @param {string} userId - The ID of the user.
 * @param {string} [orderByField="timestamp"] - Field to order by.
 * @param {import('firebase/firestore').OrderByDirection} [orderDirection="desc"] - Order direction ('asc' or 'desc').
 * @returns {Promise<Array>} A promise that resolves to an array of documents.
 * @throws {Error} If fetching fails.
 */
export const fetchCollectionByUser = async (collectionName, userId, orderByField = "timestamp", orderDirection = "desc") => {
  if (!userId) {
    console.error("fetchCollectionByUser: userId is required.");
    return []; // Or throw error
  }
  try {
    const q = query(
      collection(db, collectionName),
      where('userId', '==', userId),
      orderBy(orderByField, orderDirection)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data;
  } catch (error) {
    console.error(`Error fetching ${collectionName} for user ${userId}:`, error);
    throw error; // Re-throw to be caught by the calling component
  }
};

/**
 * Fetches a single document by its ID from a specified collection.
 * @param {string} collectionName - The name of the Firestore collection.
 * @param {string} docId - The ID of the document.
 * @returns {Promise<Object|null>} A promise that resolves to the document data or null if not found.
 * @throws {Error} If fetching fails.
 */
export const getDocById = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log(`No such document with ID ${docId} in ${collectionName}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching document ${docId} from ${collectionName}:`, error);
    throw error;
  }
};

// Add other generic Firebase service functions here as needed
// e.g., addDocument, updateDocument, deleteDocument
// For now, focusing on what's immediately required by the plan.
