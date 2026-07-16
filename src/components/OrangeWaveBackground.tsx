import React from 'react';

export default function OrangeWaveBackground() {
    return (
        <svg
            className="orange-wave-bg"
            viewBox="0 0 1440 1024"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="yellowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffca28" />
                    <stop offset="100%" stopColor="#ff8f00" />
                </linearGradient>

                <linearGradient id="orangeGrad" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="#e65000" />
                    <stop offset="50%" stopColor="#ff7a00" />
                    <stop offset="100%" stopColor="#ffb01a" />
                </linearGradient>

                <linearGradient id="dropletGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffb01a" />
                    <stop offset="100%" stopColor="#ff7a00" />
                </linearGradient>
            </defs>

            {/* Yellow Background Wave (Deep S-Curve) */}
            <path
                d="M 550 0 
                   C 450 300, 1050 200, 1100 500 
                   C 1150 800, 700 800, 600 1024 
                   L 1440 1024 
                   L 1440 0 
                   Z"
                fill="url(#yellowGrad)"
            />

            {/* Main Orange Wave (Foreground) */}
            <path
                d="M 700 0 
                   C 600 300, 1100 200, 1150 500 
                   C 1200 800, 850 800, 750 1024 
                   L 1440 1024 
                   L 1440 0 
                   Z"
                fill="url(#orangeGrad)"
            />

        </svg>
    );
}
