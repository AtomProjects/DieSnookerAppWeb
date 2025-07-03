import React from 'react';
import ExpandableItemComponent from './ExpandableItemComponent';

/**
 * A generic component to list history items, potentially making each item expandable.
 * @param {Object[]} items - Array of items to display.
 * @param {function} renderItemSummary - Function that takes an item and returns JSX for its summary (title of expandable).
 * @param {function} renderItemDetails - Function that takes an item and returns JSX for its details (content of expandable).
 * @param {string} [emptyStateMessage="No items to display."] - Message to show if items array is empty.
 */
const HistoryListComponent = ({ items, renderItemSummary, renderItemDetails, emptyStateMessage = "No items to display." }) => {
  if (!items || items.length === 0) {
    return <p>{emptyStateMessage}</p>;
  }

  return (
    <div>
      {items.map((item, index) => (
        <ExpandableItemComponent key={item.id || index} title={renderItemSummary(item)}>
          {renderItemDetails(item)}
        </ExpandableItemComponent>
      ))}
    </div>
  );
};

export default HistoryListComponent;
