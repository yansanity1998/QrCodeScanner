import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { supabase } from '../supabase';
import ScanSound from './ScanSound';
import NavBar from './NavBar';
import Logout from './Logout';
import ScanResultBottomSheet from './ScanResultBottomSheet';
import qrCodeImg from '../assets/qrcode.jpg';

const QrCodeScanner = ({ onLogout }) => {
    const [scanResult, setScanResult] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [history, setHistory] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    const [playScanSound, setPlayScanSound] = useState(false);
    const [torchEnabled, setTorchEnabled] = useState(false);
    const [torchSupported, setTorchSupported] = useState(false);

    const scannerRef = useRef(null);
    const hasSavedRef = useRef(false);
    const lastScannedContentRef = useRef(null);
    const videoTrackRef = useRef(null);

    const scannerId = "qr-scanner-region";

    useEffect(() => {
        // Automatically start scanning on mount
        startScanning();

        const loadHistory = async () => {
            try {
                setIsHistoryLoading(true);
                setHistoryError(null);

                const { data: userData, error: userError } = await supabase.auth.getUser();
                if (userError || !userData?.user) {
                    setHistory([]);
                    setCurrentUser(null);
                    return;
                }

                setCurrentUser(userData.user);
                const userId = userData.user.id;

                const { data, error: supabaseError } = await supabase
                    .from('scan_history')
                    .select('*')
                    .eq('user_id', userId)
                    .order('scanned_at', { ascending: false })
                    .limit(20);

                if (supabaseError) {
                    setHistoryError('Failed to load history');
                } else if (data) {
                    setHistory(data);
                }
            } catch (e) {
                setHistoryError('Failed to load history');
            } finally {
                setIsHistoryLoading(false);
            }
        };

        loadHistory();

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch((err) => console.error("Failed to stop scanner", err));
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startScanning = async () => {
        setError(null);
        setScanResult(null);
        hasSavedRef.current = false;

        setIsLoading(true);

        try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length) {
                const backCamera = devices.find(device =>
                    device.label.toLowerCase().includes('back') ||
                    device.label.toLowerCase().includes('rear')
                );
                const selectedCameraId = backCamera ? backCamera.id : devices[0].id;

                const html5QrCode = new Html5Qrcode(scannerId);
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    selectedCameraId,
                    {
                        fps: 20, // Increased FPS for more scan attempts, better for damaged QR codes
                        qrbox: (viewfinderWidth, viewfinderHeight) => {
                            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                            const qrboxSize = Math.floor(minEdge * 0.8); // Larger scan area for better detection
                            return { width: qrboxSize, height: qrboxSize };
                        },
                        aspectRatio: 1.0,
                        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                        // Advanced settings for better error correction
                        experimentalFeatures: {
                            useBarCodeDetectorIfSupported: true // Use native barcode detector if available
                        },
                        // Disable beep on successful scan (we have custom sound)
                        disableFlip: false, // Allow image flipping for better detection
                        videoConstraints: {
                            facingMode: "environment", // Prefer back camera
                            focusMode: "continuous" // Continuous autofocus for better clarity
                        }
                    },
                    async (decodedText) => {
                        if (hasSavedRef.current) return;

                        if (lastScannedContentRef.current === decodedText) return;

                        hasSavedRef.current = true;
                        lastScannedContentRef.current = decodedText;
                        setScanResult(decodedText);
                        setPlayScanSound((prev) => !prev);

                        try {
                            const { data: userData, error: userError } = await supabase.auth.getUser();
                            if (userError || !userData?.user) {
                                return;
                            }

                            const userId = userData.user.id;

                            const { data, error: insertError } = await supabase
                                .from('scan_history')
                                .insert([
                                    {
                                        user_id: userId,
                                        scanned_content: decodedText,
                                        scanned_at: new Date().toISOString(),
                                    },
                                ])
                                .select()
                                .single();

                            if (!insertError && data) {
                                setHistory((prev) => [data, ...prev]);
                            }
                        } catch (e) {
                            // Ignore history save errors in UI
                        }
                    },
                    () => {
                        // Ignore scan errors
                    }
                );
                setIsScanning(true);

                // Check for torch support and get video track
                try {
                    const videoElement = document.querySelector('#qr-scanner-region video');
                    if (videoElement && videoElement.srcObject) {
                        const stream = videoElement.srcObject;
                        const videoTrack = stream.getVideoTracks()[0];
                        videoTrackRef.current = videoTrack;

                        const capabilities = videoTrack.getCapabilities();
                        if (capabilities.torch) {
                            setTorchSupported(true);
                        }
                    }
                } catch (e) {
                    console.log('Torch not supported on this device');
                }
            } else {
                setError("No camera found on this device");
            }
        } catch (err) {
            setError("Camera access denied or unavailable");
            setIsScanning(false);
        } finally {
            setIsLoading(false);
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current) {
            try {
                // Turn off torch if enabled
                if (torchEnabled && videoTrackRef.current) {
                    await videoTrackRef.current.applyConstraints({
                        advanced: [{ torch: false }]
                    });
                }
                await scannerRef.current.stop();
                scannerRef.current.clear();
                setIsScanning(false);
                setTorchEnabled(false);
                setTorchSupported(false);
                videoTrackRef.current = null;
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
    };

    const toggleTorch = async () => {
        if (!videoTrackRef.current || !torchSupported) return;

        try {
            const newTorchState = !torchEnabled;
            await videoTrackRef.current.applyConstraints({
                advanced: [{ torch: newTorchState }]
            });
            setTorchEnabled(newTorchState);
        } catch (err) {
            console.error('Failed to toggle torch:', err);
        }
    };

    const handleCopy = async () => {
        if (scanResult) {
            await navigator.clipboard.writeText(scanResult);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const isUrl = (value) => {
        if (!value) return false;
        const trimmed = value.trim().toLowerCase();
        return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('www.');
    };

    const isWifiConfig = (value) => {
        if (!value) return false;
        return value.trim().toUpperCase().startsWith('WIFI:');
    };

    const isContact = (value) => {
        if (!value) return false;
        const upper = value.trim().toUpperCase();
        return upper.startsWith('BEGIN:VCARD') || upper.startsWith('MECARD:');
    };

    const handleOpenLink = () => {
        if (!scanResult) return;
        let url = scanResult.trim();
        if (url.toLowerCase().startsWith('www.')) {
            url = `https://${url}`;
        }
        if (isUrl(url)) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleSaveContact = () => {
        if (!scanResult) return;
        alert('Contact data detected. Implement saving to contacts based on your platform needs.');
    };

    const handleConnectWifi = () => {
        if (!scanResult) return;
        alert('WiFi configuration detected. Implement automatic WiFi connection using native capabilities if available.');
    };

    const handleScanAgain = () => {
        setScanResult(null);
        hasSavedRef.current = false;
        lastScannedContentRef.current = null;
        // Keep scanner running; just clear previous result so the user can scan again
    };

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const handleConfirmLogout = () => {
        setShowLogoutConfirm(false);
        onLogout();
    };

    const handleCancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    return (
        <>
            <ScanSound play={playScanSound} />

            {/* App Header with Logout */}
            <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between relative">
                    {/* Left: Burger Menu */}
                    <div className="flex-shrink-0 z-50">
                        <NavBar
                            onLogout={handleLogoutClick}
                            className="p-2 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
                        />
                    </div>

                    {/* Center: Title */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Scannify</h2>
                    </div>

                    {/* Right: Logout Button */}
                    <div className="flex-shrink-0">
                        <button
                            onClick={handleLogoutClick}
                            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-orange-500 text-white text-xs sm:text-sm font-semibold shadow-sm hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-colors duration-200 whitespace-nowrap"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-4 sm:h-4">
                                <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm5.03 4.72a.75.75 0 010 1.06l-1.72 1.72h10.94a.75.75 0 010 1.5H10.81l1.72 1.72a.75.75 0 11-1.06 1.06l-3-3a.75.75 0 010-1.06l3-3a.75.75 0 011.06 0z" clipRule="evenodd" />
                                <path d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                            </svg>
                            <span className="hidden xs:inline sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <Logout
                isOpen={showLogoutConfirm}
                onConfirm={handleConfirmLogout}
                onCancel={handleCancelLogout}
            />

            {/* Main Content with top padding for fixed header */}
            <div className="w-full min-h-screen flex items-center justify-center p-3 xs:p-4 sm:p-6 md:p-8 pt-8 sm:pt-12">
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
                            QR Scanner
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500">
                            Scan any QR code instantly
                        </p>
                    </div>

                    {/* Scanner Container */}
                    <div className="relative w-full aspect-square bg-gray-900 rounded-3xl sm:rounded-[2rem] overflow-hidden mb-6">
                        {/* Loading State */}
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 sm:gap-6">
                                <div className="relative w-12 h-12 sm:w-16 sm:h-16">
                                    <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <p className="text-white font-medium text-sm sm:text-base">Initializing camera...</p>
                            </div>
                        )}

                        {/* Scanner Region */}
                        <div id={scannerId} className="w-full h-full"></div>

                        {/* Scanning Overlay */}
                        {isScanning && (
                            <div className="absolute inset-0 pointer-events-none">
                                {/* Flashlight Toggle Button */}
                                {torchSupported && (
                                    <div className="absolute top-4 right-4 pointer-events-auto">
                                        <button
                                            onClick={toggleTorch}
                                            className={`p-3 rounded-full backdrop-blur-md transition-all duration-200 shadow-lg ${torchEnabled
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-white/80 text-gray-700 hover:bg-white'
                                                }`}
                                            aria-label="Toggle flashlight"
                                        >
                                            {torchEnabled ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Scanning Line Animation */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 sm:w-2/3 aspect-square overflow-hidden">
                                    <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-scan"></div>
                                </div>

                                <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 text-center">
                                    <p className="text-white text-xs sm:text-sm font-medium bg-black/40 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full inline-block">
                                        Align QR code within frame
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stop Button */}
                    {isScanning && (
                        <div className="text-center mb-6">
                            <button
                                onClick={stopScanning}
                                className="px-6 sm:px-8 py-3 sm:py-4 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-xl sm:rounded-2xl transition-all duration-200"
                            >
                                <span className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                                        <rect x="7" y="7" width="10" height="10" rx="2" className="fill-red-500" />
                                        <rect x="4" y="4" width="16" height="16" rx="4" className="stroke-red-500" strokeWidth="1.5" />
                                    </svg>
                                    <span className="text-sm sm:text-base">Stop Scanning</span>
                                </span>
                            </button>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 sm:p-5 bg-red-50 border border-red-200 rounded-2xl sm:rounded-3xl">
                            <div className="flex items-start gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0 mt-0.5">
                                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                                    <path d="M12 2.25v4.5a2.25 2.25 0 002.25 2.25h4.5" />
                                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-red-800 font-semibold text-sm sm:text-base mb-1">Unable to access camera</p>
                                    <p className="text-red-600 text-xs sm:text-sm">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scan Result */}
                    {/* Scan Result Bottom Sheet */}
                    <ScanResultBottomSheet
                        isOpen={!!scanResult}
                        scanResult={scanResult}
                        onClose={handleScanAgain}
                        onCopy={handleCopy}
                        onOpenLink={handleOpenLink}
                        onScanAgain={handleScanAgain}
                        onConnectWifi={handleConnectWifi}
                        onSaveContact={handleSaveContact}
                        copied={copied}
                    />
                </div>
            </div>
        </>
    );
};

export default QrCodeScanner;
