import React from 'react';

const HistoryLog = ({ history = [], onDelete, onClick }) => {
  if (!history || history.length === 0) {
    return <p className="text-xs text-gray-400">No scans yet.</p>;
  }

  return (
    <div className="space-y-2">
      {history.map((h) => (
        <div
          key={h.id}
          className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between group hover:border-orange-200 transition-colors duration-200"
        >
          <div
            className="flex-1 min-w-0 mr-3 cursor-pointer"
            onClick={() => onClick && onClick(h)}
          >
            <p className="text-xs text-gray-500 mb-0.5">
              {h.scanned_at ? new Date(h.scanned_at).toLocaleString() : ''}
            </p>
            <p className="text-sm text-gray-900 font-medium truncate">
              {h.scanned_content}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete(h.id);
            }}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
            aria-label="Delete scan"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default HistoryLog;