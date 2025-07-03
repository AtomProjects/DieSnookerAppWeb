import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import ExpandableItemComponent from '../../components/shared/ExpandableItemComponent'; // Reusing shared component

const dataCollectionsToFetch = [
  { name: 'Exercise Records', path: 'exercise_records', orderByField: 'timestamp', orderDirection: 'desc' },
  { name: 'Training Records (Self-Assessment)', path: 'training_records', orderByField: 'date', orderDirection: 'desc' },
  { name: 'Question Records', path: 'question_records', orderByField: 'date', orderDirection: 'desc' },
  { name: 'Task History', path: 'task_history', orderByField: 'weekKey', orderDirection: 'desc' }, // Assuming weekKey is sortable
  { name: 'Trainingsplan History', path: 'trainingsplan_history', orderByField: 'weekStartDate', orderDirection: 'desc' },
  // Add 'access_logs' if needed, though it's for trainer access, not athlete data usually.
];

const RawDataViewComponent = ({ athlete, athleteExerciseDefs, onBack }) => {
  // athlete: the athlete's profile object
  // athleteExerciseDefs: Map of athlete's exercise definitions { id: definition }

  const [allRawData, setAllRawData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exerciseRecordGrouping, setExerciseRecordGrouping] = useState('none'); // 'none', 'date', 'category'

  const fetchAllData = useCallback(async () => {
    if (!athlete?.id) {
      setError("Athlete ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const fetchedData = {};

    try {
      for (const colInfo of dataCollectionsToFetch) {
        const q = query(
          collection(db, colInfo.path),
          where('userId', '==', athlete.id),
          orderBy(colInfo.orderByField, colInfo.orderDirection)
        );
        const snapshot = await getDocs(q);
        fetchedData[colInfo.name] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      setAllRawData(fetchedData);
    } catch (err) {
      console.error("Error fetching raw data:", err);
      setError(`Failed to load some or all raw data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [athlete?.id]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const formatTimestamp = (ts) => {
    if (!ts) return 'N/A';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString(); // Or any more specific format
  };

  const renderExerciseRecords = (records) => {
    if (!records || records.length === 0) return <p>No exercise records.</p>;

    let groupedRecords = {};
    if (exerciseRecordGrouping === 'none') {
        // No grouping, just list them (or group by default, e.g., exercise name)
        records.forEach(rec => {
            const def = athleteExerciseDefs[rec.exerciseId];
            const groupKey = def ? `${def.name} (${def.category || 'Uncategorized'})` : (rec.exerciseId || 'Unknown Exercise');
            if(!groupedRecords[groupKey]) groupedRecords[groupKey] = [];
            groupedRecords[groupKey].push(rec);
        });
    } else if (exerciseRecordGrouping === 'date') {
        records.forEach(rec => {
            const dateKey = rec.timestamp?.toDate ? rec.timestamp.toDate().toLocaleDateString() : 'Unknown Date';
            if(!groupedRecords[dateKey]) groupedRecords[dateKey] = [];
            groupedRecords[dateKey].push(rec);
        });
    } else if (exerciseRecordGrouping === 'category') {
         records.forEach(rec => {
            const def = athleteExerciseDefs[rec.exerciseId];
            const categoryKey = def?.category || 'Uncategorized';
            if(!groupedRecords[categoryKey]) groupedRecords[categoryKey] = [];
            groupedRecords[categoryKey].push(rec);
        });
    }


    return Object.entries(groupedRecords).map(([groupKey, recs]) => (
      <ExpandableItemComponent key={groupKey} title={`${groupKey} (${recs.length} records)`}>
        <ul style={{listStylePosition: 'inside', paddingLeft: '10px'}}>
          {recs.map(rec => (
            <li key={rec.id} style={{borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '5px'}}>
              <strong>{athleteExerciseDefs[rec.exerciseId]?.name || rec.exerciseId}:</strong> Score: {rec.score ?? 'N/A'},
              Time: {rec.timeInMinutes ?? 'N/A'} min,
              Completed: {rec.completed !== undefined ? (rec.completed ? 'Yes' : 'No') : 'N/A'},
              Timestamp: {formatTimestamp(rec.timestamp)}
              {/* <pre style={{fontSize: '0.7em'}}>{JSON.stringify(rec, null, 2)}</pre> */}
            </li>
          ))}
        </ul>
      </ExpandableItemComponent>
    ));
  };


  if (loading) return <div>Loading raw data...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: '20px', padding: '8px 15px' }}>
        &larr; Back to Athlete Details
      </button>
      <h2>Raw Data for: {athlete.displayName}</h2>
      <p>Email: {athlete.email}</p>

      {dataCollectionsToFetch.map(colInfo => (
        <ExpandableItemComponent
            key={colInfo.name}
            title={`${colInfo.name} (${allRawData[colInfo.name]?.length || 0} records)`}
        >
          {colInfo.path === 'exercise_records' && (
            <div style={{marginBottom: '10px'}}>
              <label htmlFor="exGrouping">Group by: </label>
              <select id="exGrouping" value={exerciseRecordGrouping} onChange={e => setExerciseRecordGrouping(e.target.value)}>
                <option value="none">Exercise Name</option>
                <option value="date">Date</option>
                <option value="category">Category</option>
              </select>
            </div>
          )}
          {(!allRawData[colInfo.name] || allRawData[colInfo.name].length === 0) && <p>No data found for this collection.</p>}

          {colInfo.path === 'exercise_records'
            ? renderExerciseRecords(allRawData[colInfo.name])
            : (allRawData[colInfo.name] && allRawData[colInfo.name].length > 0 && (
              <ul style={{listStylePosition: 'inside', paddingLeft: '0px', fontSize: '0.9em'}}>
                {allRawData[colInfo.name].map(item => (
                  <li key={item.id} style={{borderBottom: '1px solid #f0f0f0', marginBottom: '10px', paddingBottom: '10px'}}>
                     <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-all', backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '4px'}}>
                        {JSON.stringify(item, (key, value) => {
                            // Attempt to make Firestore Timestamps more readable
                            if (value && value.seconds !== undefined && value.nanoseconds !== undefined) {
                                return formatTimestamp(value);
                            }
                            return value;
                        }, 2)}
                    </pre>
                  </li>
                ))}
              </ul>
            ))
          }
        </ExpandableItemComponent>
      ))}
    </div>
  );
};

export default RawDataViewComponent;
