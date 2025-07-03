import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../firebaseConfig'; // Direct db import
import ChartComponentWrapper from '../../shared/ChartComponentWrapper';

// Helper function to get week number (ISO 8601)
const getWeekNumber = (d) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};

const calculateMeanStdDev = (scores) => {
  if (scores.length === 0) return { mean: 0, stdDev: 0 };
  const mean = scores.reduce((acc, val) => acc + val, 0) / scores.length;
  if (scores.length === 1) return { mean, stdDev: 0 }; // StdDev is 0 for a single point
  const stdDev = Math.sqrt(scores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (scores.length -1)); // sample std dev
  return { mean, stdDev };
};

const PerformanceTrendsChartComponent = ({ athleteId, dateRange, exerciseId, athleteExerciseDefs }) => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!athleteId) return;

    const fetchDataAndProcess = async () => {
      setLoading(true);
      setError('');
      setChartData({ labels: [], datasets: [] }); // Clear previous data

      try {
        // 1. Fetch ALL exercise_records for the athlete (for baseline stats)
        const allRecordsQuery = query(
          collection(db, 'exercise_records'),
          where('userId', '==', athleteId),
          orderBy('timestamp', 'asc') // Important for consistent processing
        );
        const allRecordsSnapshot = await getDocs(allRecordsQuery);
        const allAthleteRecords = allRecordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (allAthleteRecords.length === 0) {
          setError("No exercise records found for this athlete to calculate trends.");
          setLoading(false);
          return;
        }

        // Group scores by exerciseId (or exerciseType if preferred, more complex grouping)
        // For now, let's use exerciseId. If a specific exerciseId is selected, only process that.
        // If no exerciseId is selected (viewing "All Exercises"), calculate Z-scores for each exercise type
        // and then average those Z-scores weekly. This is more complex.
        // Let's simplify: if 'exerciseId' is provided, show Z-scores for that.
        // If 'exerciseId' is NOT provided, we could either:
        //    a) Show Z-scores for *all* exercises on separate lines (messy)
        //    b) Calculate an *average Z-score* across all exercises performed each week (might be more insightful for overall trend)
        //    c) Show nothing or prompt to select an exercise.
        // For this implementation, let's go with (b) if no specific exerciseId, and (specific) if exerciseId is given.

        const exerciseStats = {}; // { exerciseId: { mean, stdDev, allScores: [] } }

        allAthleteRecords.forEach(r => {
          const eId = r.exerciseId;
          if (!eId || typeof r.score !== 'number') return;
          if (!exerciseStats[eId]) {
            exerciseStats[eId] = { allScores: [], mean: 0, stdDev: 0 };
          }
          exerciseStats[eId].allScores.push(r.score);
        });

        for (const eId in exerciseStats) {
          const stats = calculateMeanStdDev(exerciseStats[eId].allScores);
          exerciseStats[eId].mean = stats.mean;
          exerciseStats[eId].stdDev = stats.stdDev;
        }

        // 2. Filter records by dateRange
        const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

        const recordsInDateRange = allAthleteRecords.filter(r => {
          const recordDate = r.timestamp?.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
          if (startDate && recordDate < startDate) return false;
          if (endDate && recordDate > new Date(endDate.getTime() + 86399999)) return false; // include end day
          return true;
        });

        if (recordsInDateRange.length === 0) {
          setError("No records in the selected date range.");
          setLoading(false);
          return;
        }

        // 3. Calculate Z-scores for records in date range
        const zScoredRecords = recordsInDateRange.map(r => {
          const eId = r.exerciseId;
          if (!eId || typeof r.score !== 'number' || !exerciseStats[eId]) return { ...r, zScore: null };
          const { mean, stdDev } = exerciseStats[eId];
          const zScore = stdDev === 0 ? (r.score === mean ? 0 : null) : (r.score - mean) / stdDev; // Avoid division by zero
          return { ...r, zScore };
        }).filter(r => r.zScore !== null);


        // 4. Aggregate Z-scores weekly
        const weeklyZScores = {}; // { 'YYYY-Www': { sumZ: 0, count: 0, scores: [] } }

        zScoredRecords.forEach(r => {
          // Filter by selected exerciseId if provided
          if (exerciseId && r.exerciseId !== exerciseId) {
            return; // Skip if specific exercise selected and this record is not it
          }

          const recordDate = r.timestamp?.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
          const weekKey = getWeekNumber(recordDate);
          if (!weeklyZScores[weekKey]) {
            weeklyZScores[weekKey] = { sumZ: 0, count: 0, exerciseIds: new Set() };
          }
          weeklyZScores[weekKey].sumZ += r.zScore;
          weeklyZScores[weekKey].count++;
          weeklyZScores[weekKey].exerciseIds.add(r.exerciseId);
        });

        const labels = Object.keys(weeklyZScores).sort(); // Sort weeks chronologically
        const dataPoints = labels.map(weekKey => {
            const weekData = weeklyZScores[weekKey];
            if (weekData.count === 0) return 0; // Should not happen if we filtered zScoredRecords
            return weekData.sumZ / weekData.count; // Average Z-score for the week
        });

        if (labels.length === 0) {
            setError(exerciseId ? "No data for the selected exercise in this period to show Z-score trend." : "No data in this period to show Z-score trend.");
            setLoading(false);
            return;
        }

        let trendLabel = 'Weekly Average Z-Score (All Permitted Exercises)';
        if (exerciseId && athleteExerciseDefs && athleteExerciseDefs[exerciseId]) {
            trendLabel = `Weekly Z-Score for ${athleteExerciseDefs[exerciseId].name}`;
        }


        setChartData({
          labels,
          datasets: [{
            label: trendLabel,
            data: dataPoints,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            fill: false,
            tension: 0.1,
          }],
        });

      } catch (err) {
        console.error("Error processing performance trends:", err);
        setError(`Failed to load performance trends: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDataAndProcess();
  }, [athleteId, dateRange, exerciseId, athleteExerciseDefs]); // Rerun if these change

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Performance Trend (Weekly Z-Scores)' },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        title: { display: true, text: 'Average Z-Score' },
        // Z-scores can be negative, so don't beginAtZero: true
      },
      x: {
        title: { display: true, text: 'Week' }
      }
    },
  }), []);


  if (loading) return <p>Loading performance trends...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (chartData.labels.length === 0 && !loading) return <p>No trend data to display for the current selection.</p>;

  return (
    <div style={{ border: '1px solid #007bff', padding: '20px', margin: '10px 0', minHeight: '300px', backgroundColor: '#fff' }}>
      <h4 style={{marginTop: 0}}>Performance Trends Chart</h4>
      <div style={{height: '350px'}}>
        <ChartComponentWrapper type="line" data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default PerformanceTrendsChartComponent;
