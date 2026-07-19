'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiChevronLeft, FiChevronRight, FiUploadCloud, FiFileText } from 'react-icons/fi';
import '../onboarding.css';

export default function OnboardingStep4() {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = () => {
        if (!file) return;
        setIsUploading(true);
        // Simulate upload and analysis
        setTimeout(() => {
            localStorage.setItem('oshift_has_pdf', 'true');
            router.push('/onboarding/step-5');
        }, 2000);
    };

    const handleSkip = () => {
        localStorage.setItem('oshift_has_pdf', 'false');
        router.push('/onboarding/step-5');
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-bg-mesh">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
                <div className="blob blob-4"></div>
                <div className="blob blob-5"></div>
                <div className="blob blob-6"></div>
            </div>
            <div className="onboarding-card">
                <div className="onboarding-subtitle">Step 4 of 6</div>
                <h1 className="onboarding-title">Share your business model</h1>
                <p className="onboarding-desc">
                    Do you have a PDF of your business model, pitch deck, or company overview? Upload it so Hermes can learn about your business.
                </p>

                <div style={{ width: '100%', maxWidth: '600px', marginBottom: '40px' }}>
                    
                    <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        style={{
                            border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border-color)'}`,
                            background: isDragging ? 'var(--item-hover)' : 'var(--card-bg-alt)',
                            borderRadius: '16px',
                            padding: '40px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onClick={() => document.getElementById('pdf-upload')?.click()}
                    >
                        <input 
                            type="file" 
                            id="pdf-upload" 
                            accept=".pdf" 
                            style={{ display: 'none' }} 
                            onChange={(e) => e.target.files && setFile(e.target.files[0])}
                        />
                        
                        {file ? (
                            <>
                                <FiFileText style={{ fontSize: '48px', color: 'var(--accent)', marginBottom: '16px' }} />
                                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '18px' }}>{file.name}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Ready to analyze</div>
                            </>
                        ) : (
                            <>
                                <FiUploadCloud style={{ fontSize: '48px', color: 'var(--text-secondary)', marginBottom: '16px' }} />
                                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '18px' }}>Click to upload or drag and drop</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>PDF (max. 10MB)</div>
                            </>
                        )}
                    </div>

                </div>

                <div className="onboarding-footer">
                    <div className="onboarding-dots">
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot active"></div>
                        <div className="onboarding-dot"></div>
                        <div className="onboarding-dot"></div>
                    </div>
                    
                    <div className="onboarding-actions">
                        <button className="onboarding-back" onClick={() => router.push('/onboarding/step-3')} disabled={isUploading}>
                            <FiChevronLeft />
                            Back
                        </button>
                        
                        {!file ? (
                            <button 
                                className="onboarding-back" 
                                onClick={handleSkip}
                                style={{ background: 'var(--item-hover)', color: 'var(--text-primary)' }}
                            >
                                Skip & Let Hermes Ask
                                <FiChevronRight />
                            </button>
                        ) : (
                            <button 
                                className="onboarding-continue" 
                                onClick={handleUpload}
                                disabled={isUploading}
                            >
                                {isUploading ? 'Analyzing...' : 'Upload & Continue'}
                                {!isUploading && <FiChevronRight />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
