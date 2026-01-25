// File: src/pages/setup/KabisilyaFirstRunSetup.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Shield, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle,
  Building,
  Key,
  AlertCircle,
  X,
  ArrowLeft,
  HelpCircle,
  Settings,
  Truck,
  Package,
  Users,
  BarChart3,
  Sprout,
  MapPin,
  Warehouse
} from 'lucide-react';
import windowControlAPI from '../../apis/control';
import userAPI from '../../apis/user';

const KabisilyaFirstRunSetup: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Form fields
  const [username, setUsername] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [farmName, setFarmName] = useState('');

  const navigate = useNavigate();

  // Check if setup is required
  useEffect(() => {
    checkSetupRequired();
    setupWindowControls();
  }, []);

  const setupWindowControls = async () => {
    try {
      const maximized = await windowControlAPI.isMaximized();
      setIsMaximized(maximized);
      
      windowControlAPI.onWindowMaximized(() => setIsMaximized(true));
      windowControlAPI.onWindowRestored(() => setIsMaximized(false));
    } catch (error) {
      console.error('Error setting up window controls:', error);
    }
  };

  const checkSetupRequired = async () => {
    try {
      const response = await userAPI.getAllUsers();
      const hasUsers = response.data && response.data.users.length > 0;
      setSetupRequired(!hasUsers);
    } catch (error) {
      console.error('Error checking setup:', error);
      setSetupRequired(true);
    } finally {
      setCheckingSetup(false);
    }
  };

  const validateForm = () => {
    if (!username.trim()) {
      setError('Username is required');
      return false;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!password.trim()) {
      setError('Password is required');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!farmName.trim()) {
      setError('Farm name is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (step === 1) {
        const usersResponse = await userAPI.getAllUsers();
        const hasAdmin = usersResponse.data?.users.some((user: { role: string; }) => 
          user.role.toLowerCase() === 'admin' || user.role.toLowerCase() === 'administrator'
        );

        if (!hasAdmin) {
          setSuccess('System prepared for initial setup');
          setStep(2);
        } else {
          setStep(2);
        }
        setLoading(false);
        return;
      }

      if (step === 2) {
        const createUserResponse = await userAPI.createUser(
          username.trim(),
          email.trim() || `${username}@kabisilya.local`,
          password.trim(),
          'admin',
          true
        );

        if (createUserResponse.status && createUserResponse.data) {
          setSuccess('Kabisilya Management System setup completed! Redirecting to dashboard...');
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Setup failed. Please try again.');
      console.error('Setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async () => {
    try {
      await windowControlAPI.close();
    } catch (error) {
      console.error('Error closing window:', error);
      window.close();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
      setSuccess('');
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background-color)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary-color)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Checking kabisilya system setup...</p>
        </div>
      </div>
    );
  }

  if (!setupRequired) {
    navigate('/login');
    return null;
  }

  const steps = [
    {
      number: 1,
      title: 'System Preparation',
      description: 'Prepare Kabisilya system',
      icon: Settings
    },
    {
      number: 2,
      title: 'Admin Account',
      description: 'Create administrator account',
      icon: UserPlus
    }
  ];

  return (
    <div className="h-screen" style={{ background: 'var(--background-color)' }}>
      {/* Windows-style Top Bar */}
      <div style={{
        height: '36px',
        background: 'var(--topbar-bg)',
        borderBottom: '1px solid var(--topbar-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        WebkitAppRegion: 'drag'
      } as React.CSSProperties}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '22px',
            height: '22px',
            background: 'linear-gradient(135deg, var(--accent-green) 0%, var(--accent-earth) 100%)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sprout style={{ width: '14px', height: '14px', color: 'white' }} />
          </div>
          <span style={{
            color: 'var(--sidebar-text)',
            fontWeight: '500',
            fontSize: '13px'
          }}>
            Kabisilya Management - First Run Setup
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={() => windowControlAPI.minimize()}
            style={{
              width: '28px',
              height: '28px',
              background: 'transparent',
              border: 'none',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--accent-green)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <div style={{ width: '10px', height: '2px', background: 'currentColor' }}></div>
          </button>

          <button
            onClick={() => windowControlAPI.toggleMaximize()}
            style={{
              width: '28px',
              height: '28px',
              background: 'transparent',
              border: 'none',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--accent-green)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {isMaximized ? (
              <div style={{
                width: '8px',
                height: '8px',
                position: 'relative'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  border: '1.5px solid currentColor',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}></div>
                <div style={{
                  width: '6px',
                  height: '6px',
                  border: '1.5px solid currentColor',
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  borderTopColor: 'transparent',
                  borderLeftColor: 'transparent'
                }}></div>
              </div>
            ) : (
              <div style={{
                width: '10px',
                height: '10px',
                border: '1.5px solid currentColor',
                borderRadius: '1px'
              }}></div>
            )}
          </button>

          <button
            onClick={() => setShowExitConfirm(true)}
            style={{
              width: '28px',
              height: '28px',
              background: 'transparent',
              border: 'none',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger-color)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--danger-color)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--danger-color)';
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      {/* Main Content - Fixed Height */}
      <div style={{
        height: 'calc(100vh - 36px)',
        display: 'flex',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          background: 'var(--card-bg)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Setup Header - Compact */}
          <div style={{
            padding: '24px 32px',
            background: 'linear-gradient(135deg, var(--sidebar-bg) 0%, #1a472a 100%)',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px' 
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, var(--accent-green) 0%, var(--accent-earth) 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(42, 98, 61, 0.5)'
              }}>
                <Sprout style={{ 
                  width: '32px', 
                  height: '32px', 
                  color: 'white' 
                }} />
              </div>

              <div style={{ flex: 1 }}>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '6px'
                }}>
                  Welcome to Kabisilya Management System
                </h1>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  lineHeight: 1.5
                }}>
                  Let's get your farm management system set up. This one-time process will configure your kabisilya, worker assignments, and financial tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Content Area - Fixed Height */}
          <div style={{
            display: 'flex',
            flex: 1,
            minHeight: 0
          }}>
            {/* Sidebar Navigation */}
            <div style={{
              background: 'var(--card-secondary-bg)',
              padding: '20px',
              borderRight: '1px solid var(--border-color)',
              minWidth: '220px',
              flexShrink: 0
            }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px'
                }}>
                  Setup Progress
                </h3>

                <div style={{ display: 'grid', gap: '8px' }}>
                  {steps.map((stepItem) => (
                    <button
                      key={stepItem.number}
                      onClick={() => {
                        if (stepItem.number < step) setStep(stepItem.number);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px',
                        background: step === stepItem.number 
                          ? 'var(--card-hover-bg)' 
                          : step > stepItem.number
                          ? 'rgba(56, 161, 105, 0.1)'
                          : 'transparent',
                        border: step === stepItem.number 
                          ? '1px solid var(--accent-green)'
                          : '1px solid transparent',
                        borderRadius: '8px',
                        cursor: stepItem.number <= step ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        width: '100%'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: step === stepItem.number 
                          ? 'var(--accent-green)'
                          : step > stepItem.number
                          ? 'var(--success-color)'
                          : 'var(--card-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {step > stepItem.number ? (
                          <CheckCircle style={{ 
                            width: '16px', 
                            height: '16px', 
                            color: 'white' 
                          }} />
                        ) : (
                          <stepItem.icon style={{ 
                            width: '16px', 
                            height: '16px', 
                            color: step === stepItem.number ? 'white' : 'var(--text-secondary)' 
                          }} />
                        )}
                      </div>
                      <div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: step === stepItem.number 
                            ? 'var(--text-primary)' 
                            : step > stepItem.number
                            ? 'var(--success-color)'
                            : 'var(--text-secondary)',
                          marginBottom: '2px'
                        }}>
                          {stepItem.title}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: step === stepItem.number 
                            ? 'var(--text-secondary)' 
                            : step > stepItem.number
                            ? 'var(--success-color)'
                            : 'var(--text-tertiary)'
                        }}>
                          {stepItem.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Help Section */}
              <div style={{
                paddingTop: '20px',
                borderTop: '1px solid var(--border-light)'
              }}>
                <h3 style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <HelpCircle style={{ width: '14px', height: '14px' }} />
                  Need Help?
                </h3>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  lineHeight: 1.5,
                  marginBottom: '12px'
                }}>
                  Contact farm administration for assistance.
                </p>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{
              padding: '24px',
              background: 'var(--card-bg)',
              flex: 1,
              overflow: 'auto'
            }}>
              {/* Navigation Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <div>
                  {step > 1 && (
                    <button
                      onClick={handleBack}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: 'var(--card-secondary-bg)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <ArrowLeft style={{ width: '14px', height: '14px' }} />
                      Back
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowExitConfirm(true)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid var(--danger-color)',
                    borderRadius: '6px',
                    color: 'var(--danger-color)',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Exit Setup
                </button>
              </div>

              {/* Error/Success Messages */}
              {(error || success) && (
                <div style={{
                  marginBottom: '20px',
                  animation: 'slide-in 0.3s ease-out'
                }}>
                  {error && (
                    <div style={{
                      background: 'var(--accent-rust-light)',
                      border: '1px solid var(--danger-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <AlertCircle style={{ 
                        width: '20px', 
                        height: '20px', 
                        color: 'var(--danger-color)',
                        flexShrink: 0
                      }} />
                      <div>
                        <div style={{
                          fontWeight: '600',
                          color: 'var(--danger-color)',
                          marginBottom: '2px',
                          fontSize: '13px'
                        }}>
                          Setup Error
                        </div>
                        <div style={{ 
                          color: 'var(--danger-color)', 
                          fontSize: '12px',
                          lineHeight: 1.4
                        }}>
                          {error}
                        </div>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div style={{
                      background: 'var(--accent-green-light)',
                      border: '1px solid var(--success-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <CheckCircle style={{ 
                        width: '20px', 
                        height: '20px', 
                        color: 'var(--success-color)',
                        flexShrink: 0
                      }} />
                      <div>
                        <div style={{
                          fontWeight: '600',
                          color: 'var(--success-color)',
                          marginBottom: '2px',
                          fontSize: '13px'
                        }}>
                          Success
                        </div>
                        <div style={{ 
                          color: 'var(--success-color)', 
                          fontSize: '12px',
                          lineHeight: 1.4
                        }}>
                          {success}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 1: System Preparation */}
              {step === 1 && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>
                      System Preparation
                    </h2>
                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      lineHeight: 1.5
                    }}>
                      We'll prepare your Kabisilya Management System for initial use. This includes setting up the admin account and configuring farm management features.
                    </p>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px',
                    marginBottom: '24px'
                  }}>
                    {/* Kabisilya Features Card */}
                    <div style={{
                      background: 'var(--card-secondary-bg)',
                      borderRadius: '10px',
                      padding: '20px',
                      border: '1px solid var(--border-light)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '16px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: 'var(--accent-green)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Shield style={{ 
                            width: '20px', 
                            height: '20px', 
                            color: 'white' 
                          }} />
                        </div>
                        <div>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: '2px'
                          }}>
                            Farm Management Features
                          </h3>
                          <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '12px'
                          }}>
                            Complete kabisilya management capabilities
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: '10px' }}>
                        {[
                          { name: 'Worker Management', icon: Users, color: 'var(--accent-green)', desc: 'Manage farm workers and assignments' },
                          { name: 'Kabisilya Tracking', icon: Sprout, color: 'var(--accent-earth)', desc: 'Track kabisilya and farm plots' },
                          { name: 'Assignment Management', icon: Package, color: 'var(--accent-sky)', desc: 'Manage work assignments' },
                          { name: 'Financial Tracking', icon: BarChart3, color: 'var(--accent-gold)', desc: 'Track payments and debts' }
                        ].map((feature, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px',
                            background: 'var(--card-bg)',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              background: feature.color,
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <feature.icon style={{ 
                                width: '16px', 
                                height: '16px', 
                                color: 'white' 
                              }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                marginBottom: '2px'
                              }}>
                                {feature.name}
                              </div>
                              <div style={{
                                color: 'var(--text-secondary)',
                                fontSize: '11px'
                              }}>
                                {feature.desc}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Farm Information Card */}
                    <div style={{
                      background: 'var(--card-secondary-bg)',
                      borderRadius: '10px',
                      padding: '20px',
                      border: '1px solid var(--border-light)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '16px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: 'var(--accent-earth)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Warehouse style={{ 
                            width: '20px', 
                            height: '20px', 
                            color: 'white' 
                          }} />
                        </div>
                        <div>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: '2px'
                          }}>
                            Farm Configuration
                          </h3>
                          <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '12px'
                          }}>
                            Basic farm information
                          </p>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--text-secondary)',
                          marginBottom: '6px'
                        }}>
                          Farm Name
                        </label>
                        <input
                          type="text"
                          value={farmName}
                          onChange={(e) => setFarmName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-light)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          placeholder="e.g., Green Valley Farm"
                          required
                        />
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        marginBottom: '16px'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                          }}>
                            Default Units
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--text-primary)',
                            padding: '6px 10px',
                            background: 'var(--card-bg)',
                            borderRadius: '4px',
                            border: '1px solid var(--border-light)'
                          }}>
                            Luwang / Pitak
                          </div>
                        </div>
                        <div>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '4px'
                          }}>
                            Currency
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--text-primary)',
                            padding: '6px 10px',
                            background: 'var(--card-bg)',
                            borderRadius: '4px',
                            border: '1px solid var(--border-light)'
                          }}>
                            PHP (₱)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Continue Button for Step 1 */}
                  <button
                    onClick={() => {
                      if (!farmName.trim()) {
                        setError('Farm name is required');
                        return;
                      }
                      setStep(2);
                      setError('');
                      setSuccess('');
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, var(--accent-green) 0%, var(--accent-earth) 100%)',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      boxShadow: '0 4px 12px rgba(42, 98, 61, 0.3)'
                    }}
                  >
                    Continue to Account Setup
                  </button>
                </div>
              )}

              {/* Step 2: Admin Account Form */}
              {step === 2 && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>
                      Create Administrator Account
                    </h2>
                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      lineHeight: 1.5
                    }}>
                      Create your first administrator account with full system access to manage your farm operations.
                    </p>
                  </div>

                  <div style={{ maxWidth: '100%' }}>
                    <form onSubmit={handleSubmit}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px'
                      }}>
                        {/* Username */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>
                            Username
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '10px 10px 10px 36px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-light)',
                                background: 'var(--card-secondary-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                              }}
                              placeholder="admin"
                              required
                            />
                            <div style={{
                              position: 'absolute',
                              left: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: 'var(--text-tertiary)'
                            }}>
                              <UserPlus style={{ width: '16px', height: '16px' }} />
                            </div>
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                            marginTop: '4px'
                          }}>
                            This will be your login username
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>
                            Email Address (Optional)
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '10px 10px 10px 36px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-light)',
                                background: 'var(--card-secondary-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                              }}
                              placeholder="admin@farm.com"
                            />
                            <div style={{
                              position: 'absolute',
                              left: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: 'var(--text-tertiary)'
                            }}>
                              <Mail style={{ width: '16px', height: '16px' }} />
                            </div>
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                            marginTop: '4px'
                          }}>
                            Used for account recovery
                          </div>
                        </div>

                        {/* First Name */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>
                            First Name (Optional)
                          </label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-light)',
                              background: 'var(--card-secondary-bg)',
                              color: 'var(--text-primary)',
                              fontSize: '13px',
                              transition: 'all 0.2s',
                              boxSizing: 'border-box'
                            }}
                            placeholder="First name"
                          />
                        </div>

                        {/* Last Name */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>
                            Last Name (Optional)
                          </label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-light)',
                              background: 'var(--card-secondary-bg)',
                              color: 'var(--text-primary)',
                              fontSize: '13px',
                              transition: 'all 0.2s',
                              boxSizing: 'border-box'
                            }}
                            placeholder="Last name"
                          />
                        </div>

                        {/* Farm Name Display */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>
                            Farm Name
                          </label>
                          <div style={{
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-light)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}>
                            {farmName || 'Not set'}
                          </div>
                        </div>

                        {/* Password */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>
                            Password
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '10px 10px 10px 36px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-light)',
                                background: 'var(--card-secondary-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                              }}
                              placeholder="••••••••"
                              required
                            />
                            <div style={{
                              position: 'absolute',
                              left: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: 'var(--text-tertiary)'
                            }}>
                              <Lock style={{ width: '16px', height: '16px' }} />
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-tertiary)',
                                padding: '2px'
                              }}
                            >
                              {showPassword ? (
                                <EyeOff style={{ width: '16px', height: '16px' }} />
                              ) : (
                                <Eye style={{ width: '16px', height: '16px' }} />
                              )}
                            </button>
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                            marginTop: '4px'
                          }}>
                            Minimum 8 characters
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>
                            Confirm Password
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '10px 10px 10px 36px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-light)',
                                background: 'var(--card-secondary-bg)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                              }}
                              placeholder="••••••••"
                              required
                            />
                            <div style={{
                              position: 'absolute',
                              left: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: 'var(--text-tertiary)'
                            }}>
                              <Lock style={{ width: '16px', height: '16px' }} />
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-tertiary)',
                                padding: '2px'
                              }}
                            >
                              {showConfirmPassword ? (
                                <EyeOff style={{ width: '16px', height: '16px' }} />
                              ) : (
                                <Eye style={{ width: '16px', height: '16px' }} />
                              )}
                            </button>
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                            marginTop: '4px'
                          }}>
                            Must match password
                          </div>
                        </div>
                      </div>

                      {/* Permissions Summary */}
                      <div style={{
                        background: 'var(--card-secondary-bg)',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '24px',
                        border: '1px solid var(--border-light)'
                      }}>
                        <h3 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <Shield style={{ width: '16px', height: '16px', color: 'var(--accent-green)' }} />
                          Administrator Permissions
                        </h3>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '8px'
                        }}>
                          {[
                            'Manage all farm workers',
                            'Create and assign work',
                            'Process payments and track debts',
                            'Manage kabisilyas and farm plots',
                            'View farm reports and analytics',
                            'Manage farm equipment',
                            'Configure system settings',
                            'Access all farm data'
                          ].map((permission, index) => (
                            <div key={index} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '12px',
                              color: 'var(--text-secondary)'
                            }}>
                              <CheckCircle style={{ width: '14px', height: '14px', color: 'var(--success-color)' }} />
                              {permission}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '14px',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          background: loading 
                            ? 'var(--border-light)' 
                            : 'linear-gradient(135deg, var(--accent-green) 0%, var(--accent-earth) 100%)',
                          color: 'white',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.7 : 1,
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px'
                        }}
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <Key style={{ width: '16px', height: '16px' }} />
                            Complete Setup & Start Using Kabisilya
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 24px',
            background: 'var(--card-secondary-bg)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)'
              }}>
                Kabisilya Management System • Windows Desktop App
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px'
            }}>
              <span style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)'
              }}>
                Step {step} of {steps.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '10px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid var(--border-color)',
            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'var(--accent-rust-light)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                border: '1px solid var(--danger-color)'
              }}>
                <AlertCircle style={{ 
                  width: '24px', 
                  height: '24px', 
                  color: 'var(--danger-color)' 
                }} />
              </div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '10px'
              }}>
                Exit Setup?
              </h3>
              <p style={{
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                fontSize: '13px',
                marginBottom: '4px'
              }}>
                The Kabisilya Management System <strong>cannot be used</strong> without completing this setup.
              </p>
              <p style={{
                color: 'var(--text-tertiary)',
                fontSize: '12px',
                lineHeight: 1.5
              }}>
                If you exit now, you'll need to restart the application to complete setup.
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{
                  padding: '10px 20px',
                  background: 'var(--card-secondary-bg)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flex: 1
                }}
              >
                Continue Setup
              </button>
              <button
                onClick={handleExit}
                style={{
                  padding: '10px 20px',
                  background: 'var(--danger-color)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flex: 1
                }}
              >
                Exit Application
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slide-in {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        input:focus {
          outline: none;
          border-color: var(--accent-green) !important;
          box-shadow: 0 0 0 2px rgba(42, 98, 61, 0.2) !important;
        }
        
        button:disabled {
          cursor: not-allowed !important;
          opacity: 0.6 !important;
        }
      `}</style>
    </div>
  );
};

export default KabisilyaFirstRunSetup;