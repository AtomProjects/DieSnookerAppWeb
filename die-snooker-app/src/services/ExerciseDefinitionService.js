import { fetchCollectionByUser } from './firebaseService'; // Assuming definitions are user-specific

const COLLECTION_NAME = 'user_exercise_definitions';

/**
 * Fetches all exercise definitions for a given user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Object>} A promise that resolves to an object mapping definitionId to definition.
 * @throws {Error} If fetching fails.
 */
export const fetchUserExerciseDefinitions = async (userId) => {
  if (!userId) {
    console.error("fetchUserExerciseDefinitions: userId is required.");
    return {};
  }
  try {
    // Assuming definitions are ordered by 'name' or another relevant field if needed
    const definitionsArray = await fetchCollectionByUser(COLLECTION_NAME, userId, 'name', 'asc');
    const definitionsMap = definitionsArray.reduce((acc, def) => {
      acc[def.id] = def;
      return acc;
    }, {});
    return definitionsMap;
  } catch (error) {
    console.error(`Error fetching exercise definitions for user ${userId}:`, error);
    throw error; // Re-throw for the component to handle
  }
};

// Potential future functions:
// export const addExerciseDefinition = async (userId, definitionData) => { ... }
// export const updateExerciseDefinition = async (definitionId, updates) => { ... }
// export const deleteExerciseDefinition = async (definitionId) => { ... }
