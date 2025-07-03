import React from 'react';

const ExerciseTypeFilterDropdownComponent = ({ exerciseDefinitionsMap, selectedExerciseId, onChange, disabled }) => {
  // exerciseDefinitionsMap is expected to be { id: { name, ... }, ... }
  // Or an array of definitions { id, name, ... }

  const definitionsArray = Array.isArray(exerciseDefinitionsMap)
    ? exerciseDefinitionsMap
    : Object.values(exerciseDefinitionsMap || {});

  return (
    <div style={{ marginBottom: '15px' }}>
      <label htmlFor="exerciseTypeFilter" style={{ marginRight: '10px' }}>Filter by Exercise:</label>
      <select
        id="exerciseTypeFilter"
        value={selectedExerciseId}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || definitionsArray.length === 0}
        style={{padding: '8px', minWidth: '200px'}}
      >
        <option value="">All Exercises</option>
        {definitionsArray.map(def => (
          <option key={def.id} value={def.id}>
            {def.name} ({def.category || 'N/A'})
          </option>
        ))}
      </select>
      {definitionsArray.length === 0 && !disabled && <p style={{fontSize: '0.9em', color: 'grey'}}>No exercise definitions found for this athlete.</p>}
    </div>
  );
};

export default ExerciseTypeFilterDropdownComponent;
