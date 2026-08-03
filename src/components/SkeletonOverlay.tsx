import React from 'react';

export default function SkeletonOverlay() {
    return (
        <div className="thinking-overlay">
            <div className="skeleton-row" style={{ height: 120 }}>
                <div className="skeleton-box" style={{ flex: 1 }}></div>
                <div className="skeleton-box" style={{ flex: 1 }}></div>
                <div className="skeleton-box" style={{ flex: 1 }}></div>
                <div className="skeleton-box" style={{ flex: 1 }}></div>
            </div>
            <div className="skeleton-row" style={{ height: 300 }}>
                <div className="skeleton-box" style={{ flex: 2 }}></div>
                <div className="skeleton-box" style={{ flex: 1 }}></div>
            </div>
            <div className="skeleton-row" style={{ height: 250 }}>
                <div className="skeleton-box" style={{ flex: 1 }}></div>
                <div className="skeleton-box" style={{ flex: 1 }}></div>
                <div className="skeleton-box" style={{ flex: 1 }}></div>
            </div>
        </div>
    );
}
