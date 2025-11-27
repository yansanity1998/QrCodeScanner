import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const NavBar = ({ onLogout, className }) => {
	const [open, setOpen] = useState(false);
	const [user, setUser] = useState(null);
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const loadUser = async () => {
			try {
				const { data } = await supabase.auth.getUser();
				if (data?.user) setUser(data.user);
			} catch (e) {
				// ignore
			}
		};
		loadUser();
	}, []);

	return (
		<>
			<button
				aria-label="Open menu"
				onClick={() => setOpen(true)}
				className={className || "fixed top-4 left-4 z-60 p-2 rounded-md bg-white/90 shadow-md border border-gray-200 backdrop-blur-sm"}
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-800">
					<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>

			{/* Overlay Drawer - Rendered via Portal to escape parent stacking contexts (like backdrop-filter) */}
			{open && createPortal(
				<div className="fixed inset-0 z-[100]">
					<div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
					<aside className="absolute left-0 top-0 bottom-0 w-80 max-w-[85%] bg-white shadow-2xl border-r border-gray-100 p-4 overflow-y-auto transform transition-transform duration-300 ease-in-out">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-xl font-bold text-gray-900">Menu</h3>
							<button
								onClick={() => setOpen(false)}
								className="p-2 rounded-full hover:bg-gray-100 transition-colors"
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-6 h-6 stroke-gray-500">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						<div className="mb-8">
							<div className="flex items-center gap-4 p-3 rounded-2xl bg-orange-50 border border-orange-100">
								<div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-orange-200">
									{user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-bold text-gray-900 truncate">{user?.email || 'Guest'}</p>
									<p className="text-xs text-orange-600 font-medium">Active Session</p>
								</div>
							</div>
						</div>

						<div className="flex flex-col gap-2">
							<button
								onClick={() => {
									setOpen(false);
									navigate('/profile');
								}}
								className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-200 flex items-center gap-3 ${location.pathname === '/profile'
										? 'bg-gray-900 text-white shadow-md'
										: 'bg-white text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200'
									}`}
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
									<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
								</svg>
								Profile
							</button>
							<button
								onClick={() => {
									setOpen(false);
									navigate('/history');
								}}
								className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-200 flex items-center gap-3 ${location.pathname === '/history'
										? 'bg-gray-900 text-white shadow-md'
										: 'bg-white text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200'
									}`}
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								History
							</button>
						</div>

						<div className="mt-auto pt-8 border-t border-gray-100 absolute bottom-4 left-4 right-4">
							<button
								onClick={() => { setOpen(false); onLogout?.(); }}
								className="w-full px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
									<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
								</svg>
								Sign Out
							</button>
						</div>
					</aside>
				</div>,
				document.body
			)}
		</>
	);
};

export default NavBar;