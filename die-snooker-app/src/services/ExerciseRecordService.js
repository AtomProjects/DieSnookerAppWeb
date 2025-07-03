import { fetchCollectionByUser } from './firebaseService'; // Using the generic fetcher

const COLLECTION_NAME = 'exercise_records';

/**
 * Fetches all exercise records for a given user, optionally filtered.
 * @param {string} userId - The ID of the user.
 * @param {Object} [filters] - Optional filters (e.g., date range, specific exerciseId). Not implemented yet.
 * @returns {Promise<Object>} A promise that resolves to an object mapping exerciseId to an array of its records.
 * @throws {Error} If fetching fails.
 */
export const fetchExerciseRecords = async (userId, filters = {}) => {
  if (!userId) {
    console.error("fetchExerciseRecords: userId is required.");
    return {};
  }
  try {
    // For now, fetching all records and then grouping.
    // Firestore queries can be optimized later if specific filters are common.
    // Records are typically ordered by timestamp.
    const recordsArray = await fetchCollectionByUser(COLLECTION_NAME, userId, 'timestamp', 'desc');

    const recordsMap = recordsArray.reduce((acc, record) => {
      const { exerciseId } = record; // Assuming exerciseId is a field in the record
      if (!exerciseId) {
        console.warn("Record found without exerciseId:", record.id);
        return acc;
      }
      if (!acc[exerciseId]) {
        acc[exerciseId] = [];
      }
      acc[exerciseId].push(record);
      return acc;
    }, {});

    // Ensure records for each exerciseId are sorted by timestamp (desc is typical for recent first)
    for (const exerciseId in recordsMap) {
        recordsMap[exerciseId].sort((a,b) => (b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp)) - (a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp)));
    }

    return recordsMap;
  } catch (error) {
    console.error(`Error fetching exercise records for user ${userId}:`, error);
    throw error; // Re-throw for the component to handle
  }
};


// Potential future functions:
// export const addExerciseRecord = async (userId, recordData) => { ... }
// export const updateExerciseRecord = async (recordId, updates) => { ... }
// export const deleteExerciseRecord = async (recordId) => { ... }
