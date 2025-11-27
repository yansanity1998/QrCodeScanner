import React, { useState } from 'react';
import { supabase } from '../supabase';

import qrCodeImg from '../assets/qrcode.jpg';

const Login = ({ onSwitchToRegister, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            // Login successful
            console.log('User logged in:', data);
            onLogin();
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to sign in. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-12">
                    <div className="inline-flex items-center justify-center mb-4 sm:mb-6">
                        <img
                            src={qrCodeImg}
                            alt="QR Code"
                            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl shadow-lg object-cover"
                        />
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight">
                        Welcome Back
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500">
                        Sign in to continue
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    {/* Email Input */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-colors duration-200"
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-colors duration-200"
                        />
                    </div>

                    {/* Forgot Password Link */}
                    <div className="text-right">
                        <button type="button" className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors">
                            Forgot password?
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-red-600 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-6 sm:px-8 py-4 sm:py-5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Signing in...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign In</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-gradient-to-br from-orange-50 via-white to-orange-50 text-gray-500">
                            Don't have an account?
                        </span>
                    </div>
                </div>

                {/* Switch to Register */}
                <button
                    onClick={onSwitchToRegister}
                    className="w-full px-6 sm:px-8 py-4 sm:py-5 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl sm:rounded-2xl transition-all duration-200"
                >
                    Create Account
                </button>
            </div>
        </div>
    );
};

export default Login;
