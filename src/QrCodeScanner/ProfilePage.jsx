import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          setUser(null);
          return;
        }

        setUser(data.user);
      } catch (e) {
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const email = user?.email || '-';
  const initial = email && email !== '-' ? email.charAt(0).toUpperCase() : 'U';

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
          <h1 className="text-xl font-bold text-gray-900">Profile</h1>
          <div className="w-9" /> {/* Spacer for alignment */}
        </div>

        {/* Profile Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6 sm:p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-orange-500/30 ring-4 ring-white">
                {initial}
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
            </div>

            {/* User Info */}
            <div className="space-y-2 w-full">
              <h2 className="text-2xl font-bold text-gray-900 truncate px-4">
                {email.split('@')[0]}
              </h2>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-medium border border-orange-100">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified Account
              </div>
              <p className="text-sm text-gray-500">{email}</p>
            </div>

            {/* Stats or Additional Info could go here */}
            <div className="w-full pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Account Type</p>
                  <p className="font-semibold text-gray-900">Personal</p>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Member Since</p>
                  <p className="font-semibold text-gray-900">2024</p>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="pt-4">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}

            {error && (
              <div className="w-full p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
