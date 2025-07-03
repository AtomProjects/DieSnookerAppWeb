import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ChartComponentWrapper = ({ data, options, type = 'line' }) => {
  // For now, assuming 'line' type, but this can be made more generic
  if (type === 'line') {
    return <Line data={data} options={options} />;
  }
  // Add other chart types here if needed (e.g., Bar, Pie)
  return <p>Unsupported chart type: {type}</p>;
};

export default ChartComponentWrapper;
