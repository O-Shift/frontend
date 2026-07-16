'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { FiMail, FiLock, FiEyeOff, FiUser, FiBriefcase, FiPhone, FiChevronDown } from 'react-icons/fi';
import AuthRightPanel from '@/components/AuthRightPanel';

const ROLES = [
    'Founder / Owner',
    'Executive',
    'Strategy',
    'Business Development',
    'Marketing',
    'Product',
    'Sales',
    'Operations',
    'Consultant',
    'Other'
];

export default function SignupPage() {
    const [roleSearch, setRoleSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredRoles = ROLES.filter(role => 
        role.toLowerCase().includes(roleSearch.toLowerCase())
    );

    const handleRoleSelect = (role: string) => {
        setSelectedRole(role);
        setRoleSearch(role);
        setIsDropdownOpen(false);
    };

    return (
        <>
            {/* Left Side: Signup Form */}
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
                        <h1 style={{ fontSize: '2rem' }}>Create your OShift account</h1>
                    </div>

                    <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
                        <div className="auth-field">
                            <div className="auth-input-wrapper">
                                <FiUser className="auth-input-icon" />
                                <input 
                                    type="text" 
                                    className="auth-input" 
                                    placeholder="Full name" 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <div className="auth-input-wrapper">
                                <FiMail className="auth-input-icon" />
                                <input 
                                    type="email" 
                                    className="auth-input" 
                                    placeholder="Work email" 
                                    required 
                                />
                            </div>
                        </div>

                        {/* Searchable Dropdown for Role */}
                        <div className="auth-field" ref={dropdownRef}>
                            <div className="auth-input-wrapper">
                                <FiBriefcase className="auth-input-icon" />
                                <input 
                                    type="text" 
                                    className="auth-input" 
                                    placeholder="Role in company" 
                                    value={roleSearch}
                                    onChange={(e) => {
                                        setRoleSearch(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    required 
                                />
                                <FiChevronDown 
                                    className={`auth-input-icon right auth-dropdown-chevron ${isDropdownOpen ? 'open' : ''}`}
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                />
                            </div>

                            {isDropdownOpen && (
                                <div className="auth-dropdown-menu">
                                    {filteredRoles.length > 0 ? (
                                        filteredRoles.map(role => (
                                            <div 
                                                key={role} 
                                                className={`auth-dropdown-item ${selectedRole === role ? 'active' : ''}`}
                                                onClick={() => handleRoleSelect(role)}
                                            >
                                                {role}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="auth-dropdown-empty">No roles found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Custom Role Field (Visible if 'Other' is selected) */}
                        {selectedRole === 'Other' && (
                            <div className="auth-field" style={{ marginTop: '-0.5rem', animation: 'fadeIn 0.3s' }}>
                                <div className="auth-input-wrapper">
                                    <input 
                                        type="text" 
                                        className="auth-input" 
                                        placeholder="Please specify your role" 
                                        style={{ paddingLeft: '1.2rem', backgroundColor: '#fcfcf7', fontSize: '0.9rem' }}
                                        required 
                                    />
                                </div>
                            </div>
                        )}

                        <div className="auth-field">
                            <div className="auth-input-wrapper">
                                <FiPhone className="auth-input-icon" />
                                <input 
                                    type="tel" 
                                    className="auth-input" 
                                    placeholder="Phone number" 
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

                        <button type="submit" className="auth-submit-btn" style={{ marginTop: '0.5rem' }}>
                            Create account
                            <span style={{ marginLeft: '4px', fontSize: '1.2rem' }}>→</span>
                        </button>
                    </form>

                    <div className="auth-switch" style={{ marginTop: '2rem' }}>
                        Already have an account? <Link href="/login">Log in</Link>
                    </div>
                </div>
            </div>

            {/* Right Side: Wavy Orange Panel */}
            <AuthRightPanel />
        </>
    );
}
