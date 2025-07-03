import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import ChartComponentWrapper from '../../shared/ChartComponentWrapper.jsx';

const SelfAssessmentChartComponent = ({ athleteId, dateRange }) => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!athleteId) return;

    const fetchAndProcessData = async () => {
      setLoading(true);
      setError('');
      setChartData({ labels: [], datasets: [] });

      try {
        // Fetch training_records for the athlete
        const recordsQuery = query(
          collection(db, 'training_records'),
          where('userId', '==', athleteId),
          orderBy('date', 'asc') // Order by date for chronological display
        );
        const recordsSnapshot = await getDocs(recordsQuery);
        let trainingRecords = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter by dateRange
        const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

        if (startDate || endDate) {
          trainingRecords = trainingRecords.filter(r => {
            const recordDate = r.date?.toDate ? r.date.toDate() : new Date(r.date);
            if (startDate && recordDate < startDate) return false;
            if (endDate && recordDate > new Date(endDate.getTime() + 86399999)) return false; // include end day
            return true;
          });
        }

        if (trainingRecords.length === 0) {
          setError("No self-assessment records found for the selected criteria.");
          setLoading(false);
          return;
        }

        const labels = [];
        const dataPoints = [];

        trainingRecords.forEach(record => {
          const date = record.date?.toDate ? new Date(record.date.toDate()) : new Date(record.date);
          labels.push(date.toLocaleDateString());

          let totalScore = 0;
          let count = 0;
          if (record.items && record.items.length > 0) {
            record.items.forEach(item => {
              if (typeof item.score === 'number') {
                totalScore += item.score;
                count++;
              }
            });
          }
          dataPoints.push(count > 0 ? totalScore / count : 0);
        });

        setChartData({
          labels,
          datasets: [{
            label: 'Average Self-Assessment Score',
            data: dataPoints,
            borderColor: 'rgb(255, 159, 64)',
            backgroundColor: 'rgba(255, 159, 64, 0.5)',
            fill: false,
            tension: 0.1,
          }],
        });

      } catch (err) {
        console.error("Error processing self-assessment data:", err);
        setError(`Failed to load self-assessment data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, [athleteId, dateRange]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Self-Assessment Score Trends' },
    },
    scales: {
      y: {
        beginAtZero: true,
        // suggestedMax: 10, // Or based on typical score range
        title: { display: true, text: 'Average Score' },
      },
      x: {
        title: { display: true, text: 'Date' }
      }
    },
  }), []);


  if (loading) return <p>Loading self-assessment chart data...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (chartData.labels.length === 0 && !loading) return <p>No self-assessment data to display for the current selection.</p>;

  return (
    <div style={{ border: '1px solid #ffc107', padding: '20px', margin: '10px 0', minHeight: '300px', backgroundColor: '#fff' }}>
      <h4 style={{marginTop:0}}>Self-Assessment Score Trends</h4>
       <div style={{height: '350px'}}>
        <ChartComponentWrapper type="line" data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default SelfAssessmentChartComponent;
