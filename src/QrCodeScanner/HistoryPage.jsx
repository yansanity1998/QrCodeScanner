import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import HistoryLog from './HistoryLog';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          setHistory([]);
          return;
        }

        const userId = userData.user.id;

        const { data, error: supabaseError } = await supabase
          .from('scan_history')
          .select('*')
          .eq('user_id', userId)
          .order('scanned_at', { ascending: false })
          .limit(50);

        if (supabaseError) {
          setError('Failed to load history');
        } else if (data) {
          setHistory(data);
        }
      } catch (e) {
        setError('Failed to load history');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('scan_history')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setHistory(history.filter((item) => item.id !== deleteId));
      setShowDeleteConfirm(false);
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting scan:', err);
      alert('Failed to delete scan log');
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (selectedItem?.scanned_content) {
      await navigator.clipboard.writeText(selectedItem.scanned_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isUrl = (value) => {
    if (!value) return false;
    const trimmed = value.trim().toLowerCase();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('www.');
  };

  const handleOpenLink = () => {
    if (!selectedItem?.scanned_content) return;
    let url = selectedItem.scanned_content.trim();
    if (url.toLowerCase().startsWith('www.')) {
      url = `https://${url}`;
    }
    if (isUrl(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/scanner')}
            className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-600 hover:text-orange-500 hover:border-orange-200 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Scan History</h1>
          <div className="w-9" /> {/* Spacer for alignment */}
        </div>

        {/* Content Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-1 overflow-hidden">
          <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 font-medium">Loading history...</p>
              </div>
            ) : error ? (
              <div className="py-8 px-4 text-center">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <p className="text-gray-900 font-medium mb-1">Oops!</p>
                <p className="text-sm text-gray-500">{error}</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-orange-50 text-orange-400 rounded-3xl flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No History Yet</h3>
                <p className="text-sm text-gray-500 max-w-[200px]">
                  Scan your first QR code to see it appear here.
                </p>
                <button
                  onClick={() => navigate('/scanner')}
                  className="mt-6 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-orange-500/20"
                >
                  Start Scanning
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <HistoryLog history={history} onDelete={handleDelete} onClick={handleItemClick} />
              </div>
            )}
          </div>
        </div>

        {/* Item Detail Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6 sm:p-8 space-y-4 xs:space-y-6">
              {/* Close Button */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Scan Details</h3>
                <button
                  onClick={handleCloseDetail}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Timestamp */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Scanned At</p>
                <p className="text-sm text-gray-600">
                  {selectedItem.scanned_at ? new Date(selectedItem.scanned_at).toLocaleString() : 'Unknown'}
                </p>
              </div>

              {/* Content */}
              <div>
                <p className="text-[10px] xs:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 xs:mb-2">Scanned Content</p>
                <div className="bg-white/50 rounded-xl p-3 xs:p-4 border border-gray-100">
                  <p className="text-gray-900 font-medium text-sm xs:text-base break-all leading-relaxed">
                    {selectedItem.scanned_content}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 xs:space-y-3">
                {/* Primary Actions */}
                <div className="grid grid-cols-1 gap-2 xs:gap-3">
                  {isUrl(selectedItem.scanned_content) ? (
                    <button
                      onClick={handleOpenLink}
                      className="w-full px-4 py-3 xs:px-6 xs:py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 xs:w-5 xs:h-5">
                        <path d="M15.75 2.25H21a.75.75 0 01.75.75v5.25a.75.75 0 01-1.5 0V4.81L8.03 17.03a.75.75 0 01-1.06-1.06L19.19 3.75h-3.44a.75.75 0 010-1.5zm-10.5 4.5a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V10.5a.75.75 0 011.5 0v8.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V8.25a3 3 0 013-3h8.25a.75.75 0 010 1.5H5.25z" />
                      </svg>
                      <span className="text-sm xs:text-base">Open Link</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleCopy}
                      className="w-full px-4 py-3 xs:px-6 xs:py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 xs:w-5 xs:h-5">
                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm xs:text-base">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 xs:w-5 xs:h-5">
                            <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 013.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0121 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 017.5 16.125V3.375z" />
                            <path d="M15 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0017.25 7.5h-1.875A.375.375 0 0115 7.125V5.25zM4.875 6H6v10.125A3.375 3.375 0 009.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V7.875C3 6.839 3.84 6 4.875 6z" />
                          </svg>
                          <span className="text-sm xs:text-base">Copy Text</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-5">
                Are you sure you want to delete this scan? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="px-4 sm:px-5 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 sm:px-5 py-2 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 shadow-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
