import React from 'react';

const Logout = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 text-center">Confirm Logout</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-5 text-center">
                    Are you sure you want to logout? You will need to sign in again to use the scanner.
                </p>
                <div className="flex justify-center gap-3 sm:gap-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 sm:px-5 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="px-4 sm:px-5 py-2 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 shadow-sm transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Logout;
