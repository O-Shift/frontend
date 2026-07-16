'use client';
import Image from 'next/image';
import Link from 'next/link';
import { FiMail, FiLock, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FaMicrosoft, FaApple } from 'react-icons/fa';
import AuthRightPanel from '@/components/AuthRightPanel';

export default function LoginPage() {
    return (
        <>
            {/* Left Side: Login Form */}
            <div className="auth-left">
                <div className="auth-content">
                    <div className="auth-logo">
                        <Image 
                            src="/orange logo.png" 
                            alt="OShift Logo" 
                            width={160} 
                            height={60} 
                            priority
                        />
                    </div>
                    
                    <div className="auth-header">
                        <h1>Welcome back</h1>
                        <p>Log in to continue your journey with <strong>OShift</strong>.</p>
                    </div>

                    <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
                        <div className="auth-field">
                            <div className="auth-input-wrapper">
                                <FiMail className="auth-input-icon" />
                                <input 
                                    type="email" 
                                    className="auth-input" 
                                    placeholder="E-mail" 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <div className="auth-input-wrapper">
                                <FiLock className="auth-input-icon" />
                                <input 
                                    type="password" 
                                    className="auth-input" 
                                    placeholder="Password" 
                                    required 
                                />
                                <FiEyeOff className="auth-input-icon right" />
                            </div>
                        </div>

                        <div className="auth-options">
                            <label className="auth-checkbox">
                                <input type="checkbox" defaultChecked />
                                <span>Remember me</span>
                            </label>
                            <Link href="/forgot-password" className="auth-forgot">
                                Forgot password?
                            </Link>
                        </div>

                        <button type="submit" className="auth-submit-btn">
                            Log in
                            <span className="btn-icon" style={{ marginLeft: '4px', fontSize: '1.2rem' }}>→</span>
                        </button>
                    </form>

                    <div className="auth-divider">or continue with</div>

                    <div className="auth-social">
                        <button className="auth-social-btn google">
                            <FcGoogle />
                        </button>
                        <button className="auth-social-btn microsoft">
                            <FaMicrosoft color="#00a4ef" />
                        </button>
                        <button className="auth-social-btn apple">
                            <FaApple />
                        </button>
                    </div>

                    <div className="auth-switch">
                        New to OShift? <Link href="/signup">Create an account</Link>
                    </div>
                </div>
            </div>

            {/* Right Side: Wavy Orange Panel */}
            <AuthRightPanel />
        </>
    );
}
