import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCollectionByUser } from '../../services/firebaseService';
import TaskHistoryListComponent from '../../components/player/TaskHistoryListComponent';

const TasksSection = () => {
  const { currentUser } = useAuth();
  const [taskHistory, setTaskHistory] = useState([]);
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
        // Assuming 'task_history' is ordered by 'weekKey' or a relevant date field descending
        const history = await fetchCollectionByUser('task_history', currentUser.uid, 'weekKey', 'desc');
        setTaskHistory(history);
      } catch (err) {
        console.error("Error fetching task history:", err);
        setError("Failed to load task history. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  if (loading) {
    return <div>Loading task history...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (!currentUser) {
    return <div>Please log in to view task history.</div>;
  }

  return (
    <div>
      <h2>Tasks History</h2>
      <TaskHistoryListComponent records={taskHistory} />
    </div>
  );
};

export default TasksSection;
