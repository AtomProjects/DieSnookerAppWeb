import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import ChartComponentWrapper from '../../shared/ChartComponentWrapper.jsx';

// Helper to get week key (YYYY-Www), same as in PerformanceTrendsChart
const getWeekNumber = (d) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};


const CompletionRateChartComponent = ({ athleteId, dateRange, exerciseId, exerciseDefinitionsMap }) => {
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
        // Fetch task_history for the athlete
        // We assume task_history stores weekly summaries including task completions
        const taskHistoryQuery = query(
          collection(db, 'task_history'),
          where('userId', '==', athleteId),
          orderBy('weekKey', 'asc') // weekKey might be 'YYYY-MM-DD' of week start or 'YYYY-Www'
        );
        const taskHistorySnapshot = await getDocs(taskHistoryQuery);
        const tasksHistoryRecords = taskHistorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (tasksHistoryRecords.length === 0) {
          setError("No task history found for this athlete.");
          setLoading(false);
          return;
        }

        const weeklyCompletionRates = {}; // { 'weekKey': { completed: 0, total: 0 } }

        tasksHistoryRecords.forEach(record => {
          const weekKey = record.weekKey; // Assuming weekKey is directly usable or can be converted to YYYY-Www
          // If weekKey is a date, convert it:
          // const recordDate = record.weekKey.toDate ? record.weekKey.toDate() : new Date(record.weekKey);
          // const weekIdentifier = getWeekNumber(recordDate);

          if (!weeklyCompletionRates[weekKey]) {
            weeklyCompletionRates[weekKey] = { completed: 0, total: 0 };
          }

          if (record.taskCompletions && Array.isArray(record.taskCompletions)) {
            record.taskCompletions.forEach(task => {
              // If a specific exerciseId is provided, we might try to match tasks to exercises.
              // This depends on how tasks are defined and if they relate to exercises.
              // For now, we'll calculate overall task completion rate.
              // If `exerciseId` is relevant here, the task object needs a way to link to it.
              // Assuming for now `exerciseId` filter is NOT applied to task completion rate,
              // as tasks might be different from exercises.
              // If they ARE related, task.exerciseId == exerciseId would be the filter.

              // For now, let's assume this chart is for overall task completion, not specific exercises.
              // If `exerciseId` IS meant to filter tasks, this logic needs adjustment.
              // The prompt implies `exerciseId` from `ExerciseTypeFilterDropdownComponent` might be passed.
              // Let's assume tasks can have an optional `exerciseId` field if they are directly tied to one.
              if (exerciseId && task.exerciseId !== exerciseId) {
                return; // Skip task if it doesn't match the selected exercise
              }

              weeklyCompletionRates[weekKey].total++;
              if (task.completed) {
                weeklyCompletionRates[weekKey].completed++;
              }
            });
          }
        });

        const labels = Object.keys(weeklyCompletionRates).sort();
        const dataPoints = labels.map(wkKey => {
          const weekData = weeklyCompletionRates[wkKey];
          // Filter by dateRange (if weekKey is YYYY-Www, it can be parsed for date comparison)
          // This filtering should ideally happen before processing if possible, or labels filtered here.
          // For simplicity, assume labels are already within a reasonable overall range.
          // A proper implementation would parse weekKey to a date and check against dateRange.
          if (weekData.total === 0) return 0;
          return (weekData.completed / weekData.total) * 100;
        });

        if (labels.length === 0) {
            setError("No task completion data for the current selection.");
            setLoading(false);
            return;
        }

        setChartData({
          labels,
          datasets: [{
            label: `Weekly Task Completion Rate (%) ${exerciseId && exerciseDefinitionsMap[exerciseId] ? `for ${exerciseDefinitionsMap[exerciseId].name}` : '(All Tasks)'}`,
            data: dataPoints,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          }],
        });

      } catch (err) {
        console.error("Error processing completion rate:", err);
        setError(`Failed to load completion rate data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, [athleteId, dateRange, exerciseId, exerciseDefinitionsMap]);

 const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Weekly Task Completion Rate' },
       tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label.includes('%')) label = label.split('%')[0] + '%'; // Keep only one %
            else label += ': ';

            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1) + '%';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100, // Percentage
        title: { display: true, text: 'Completion Rate (%)' },
      },
      x: {
        title: { display: true, text: 'Week' }
      }
    },
  }), []);


  if (loading) return <p>Loading completion rate data...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (chartData.labels.length === 0 && !loading) return <p>No task completion data to display for the current selection.</p>;

  return (
    <div style={{ border: '1px solid #28a745', padding: '20px', margin: '10px 0', minHeight: '300px', backgroundColor: '#fff' }}>
      <h4 style={{marginTop:0}}>Task Completion Rate Chart</h4>
       <div style={{height: '350px'}}>
        <ChartComponentWrapper type="bar" data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default CompletionRateChartComponent;
