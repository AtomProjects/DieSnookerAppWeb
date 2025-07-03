import React from 'react';
import ChartComponentWrapper from '../shared/ChartComponentWrapper.jsx';

const TrainingChartComponent = ({ trainingRecords }) => {
  if (!trainingRecords || trainingRecords.length === 0) {
    return <p>No training data available to display chart.</p>;
  }

  // Process data for the chart
  // For simplicity, let's assume 'items' in trainingRecords contains objects with a 'score' property
  // And we want to plot average score per record date.

  const chartData = {
    labels: [],
    datasets: [
      {
        label: 'Average Score per Training',
        data: [],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  // Sort records by date if not already sorted (assuming 'date' is a Firebase Timestamp or parsable date)
  const sortedRecords = [...trainingRecords].sort((a, b) => {
    const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
    const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
    return dateA - dateB;
  });

  sortedRecords.forEach(record => {
    const date = record.date?.toDate ? new Date(record.date.toDate()) : new Date(record.date);
    chartData.labels.push(date.toLocaleDateString());

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
    chartData.datasets[0].data.push(count > 0 ? totalScore / count : 0);
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Average Training Scores Over Time',
      },
    },
    scales: {
        y: {
            beginAtZero: true,
            suggestedMax: 10 // Or calculate based on data, e.g. max score possible
        }
    }
  };

  return (
    <div style={{ height: '300px', width: '100%' }}> {/* Ensure wrapper has dimensions */}
      <ChartComponentWrapper type="line" data={chartData} options={chartOptions} />
    </div>
  );
};

export default TrainingChartComponent;
