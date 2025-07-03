import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCollectionByUser } from '../../services/firebaseService';
import TrainingHistoryListComponent from '../../components/player/TrainingHistoryListComponent';
import QuestionsHistoryListComponent from '../../components/player/QuestionsHistoryListComponent';
import TrainingChartComponent from '../../components/player/TrainingChartComponent';

const SelfAssessmentSection = () => {
  const { currentUser } = useAuth();
  const [trainingRecords, setTrainingRecords] = useState([]);
  const [questionRecords, setQuestionRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false); // Not logged in, nothing to load
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Firestore Timestamps need to be handled carefully for date fields
        const [trainings, questions] = await Promise.all([
          fetchCollectionByUser('training_records', currentUser.uid, 'date', 'desc'),
          fetchCollectionByUser('question_records', currentUser.uid, 'date', 'desc')
        ]);
        setTrainingRecords(trainings);
        setQuestionRecords(questions);
      } catch (err) {
        console.error("Error fetching self assessment data:", err);
        setError('Failed to load self-assessment data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) {
    return <div>Loading self-assessment data...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (!currentUser) {
    return <div>Please log in to view self-assessment data.</div>;
  }

  return (
    <div>
      <h2>Self Assessment</h2>

      <div style={{marginTop: '20px'}}>
        <h3>Training Performance Chart</h3>
        <TrainingChartComponent trainingRecords={trainingRecords} />
      </div>

      <div style={{marginTop: '30px'}}>
        <h3>Training Records History</h3>
        <TrainingHistoryListComponent records={trainingRecords} />
      </div>

      <div style={{marginTop: '30px'}}>
        <h3>Questionnaire History</h3>
        <QuestionsHistoryListComponent records={questionRecords} />
      </div>
    </div>
  );
};

export default SelfAssessmentSection;
