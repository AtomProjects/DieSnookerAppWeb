import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { fetchUserExerciseDefinitions } from '../../services/ExerciseDefinitionService';
import { fetchExerciseRecords } from '../../services/ExerciseRecordService';
import ExerciseCardComponent from '../../components/player/ExerciseCardComponent.jsx';

const ExercisesSection = () => {
  const { currentUser } = useAuth();
  const [exerciseDefinitions, setExerciseDefinitions] = useState({}); // Map: id -> definition
  const [exerciseRecords, setExerciseRecords] = useState({});     // Map: exerciseId -> [records]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [definitions, records] = await Promise.all([
          fetchUserExerciseDefinitions(currentUser.uid),
          fetchExerciseRecords(currentUser.uid)
        ]);
        setExerciseDefinitions(definitions);
        setExerciseRecords(records);
      } catch (err) {
        console.error("Error fetching exercises data:", err);
        setError("Failed to load exercises data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  if (loading) {
    return <div>Loading exercises...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (!currentUser) {
    return <div>Please log in to view exercises.</div>;
  }

  // Group definitions by category
  const definitionsByCategory = Object.values(exerciseDefinitions).reduce((acc, def) => {
    const category = def.category || 'Uncategorized'; // Default category if none provided
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(def);
    return acc;
  }, {});

  return (
    <div>
      <h2>Exercises</h2>
      {Object.keys(definitionsByCategory).length === 0 && !loading && <p>No exercise definitions found. You can add new exercises (feature to be implemented).</p>}

      {Object.entries(definitionsByCategory).map(([category, definitions]) => (
        <div key={category} style={{ marginBottom: '30px' }}>
          <h3>{category}</h3>
          {definitions.length === 0 && <p>No exercises in this category.</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {definitions.map(def => {
              const recordsForThisDef = exerciseRecords[def.id] || [];
              // Sort records by timestamp DESC for the card's list of times (most recent first)
              // The chart within the card will re-sort ASC.
              const sortedRecordsForCardList = [...recordsForThisDef].sort((a,b) => (b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp)) - (a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp)));
              return (
                <ExerciseCardComponent key={def.id} definition={def} records={sortedRecordsForCardList} />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExercisesSection;
