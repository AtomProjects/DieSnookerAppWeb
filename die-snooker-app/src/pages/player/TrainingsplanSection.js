import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCollectionByUser } from '../../services/firebaseService';
import TrainingsplanListComponent from '../../components/player/TrainingsplanListComponent';

const TrainingsplanSection = () => {
  const { currentUser } = useAuth();
  const [planHistory, setPlanHistory] = useState([]);
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
        // Assuming 'trainingsplan_history' is ordered by 'weekStartDate' descending
        const history = await fetchCollectionByUser('trainingsplan_history', currentUser.uid, 'weekStartDate', 'desc');
        setPlanHistory(history);
      } catch (err) {
        console.error("Error fetching training plan history:", err);
        setError("Failed to load training plan history. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  if (loading) {
    return <div>Loading training plan history...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (!currentUser) {
    return <div>Please log in to view training plan history.</div>;
  }

  return (
    <div>
      <h2>Training Plan History</h2>
      <TrainingsplanListComponent records={planHistory} />
    </div>
  );
};

export default TrainingsplanSection;
