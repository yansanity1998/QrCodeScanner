import React, { useEffect, useRef } from 'react';

// Plays a short beep using the Web Audio API whenever `play` becomes true.
// This avoids requiring an external audio file and works reliably for short notification beeps.
const ScanSound = ({ play }) => {
    const ctxRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        // Create an AudioContext lazily on first play (or user interaction)
        if (!ctxRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) ctxRef.current = new AudioContext();
        }

        if (!play) return;

        const ctx = ctxRef.current;
        if (!ctx) return; // AudioContext not supported

        // If the context is suspended (common on mobile until user interacts), try to resume.
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        // Create oscillator and gain to make a short beep
        const duration = 0.12; // seconds
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1050, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        // ramp down and stop
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.stop(now + duration + 0.02);

        // clear references shortly after stopping
        timeoutRef.current = setTimeout(() => {
            try {
                osc.disconnect();
                gain.disconnect();
            } catch (e) {}
        }, (duration + 0.05) * 1000);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [play]);

    // Keep component invisible — no DOM needed for sound playback
    return null;
};

export default ScanSound;
