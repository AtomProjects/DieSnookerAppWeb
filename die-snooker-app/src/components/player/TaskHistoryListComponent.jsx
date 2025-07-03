import React from 'react';
import HistoryListComponent from '../shared/HistoryListComponent.jsx';

const TaskHistoryListComponent = ({ records }) => {
  const renderSummary = (record) => {
    // Assuming weekKey is something like "YYYY-WW" or a date string
    return `Week: ${record.weekKey || 'N/A'} - Total Points: ${record.totalPoints || 0}`;
  };

  const renderDetails = (record) => {
    if (!record.taskCompletions || record.taskCompletions.length === 0) {
      return <p>No task completions recorded for this period.</p>;
    }
    return (
      <div>
        <p><strong>Task Completions:</strong></p>
        <ul>
          {record.taskCompletions.map((task, index) => (
            <li key={index}>
              {task.title || 'Unnamed Task'} - Points: {task.points || 0} - Completed: {task.completed ? 'Yes' : 'No'}
              {/* Add more task details if available, e.g., task.description, task.dueDate */}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <HistoryListComponent
      items={records}
      renderItemSummary={renderSummary}
      renderItemDetails={renderDetails}
      emptyStateMessage="No task history found."
    />
  );
};

export default TaskHistoryListComponent;
