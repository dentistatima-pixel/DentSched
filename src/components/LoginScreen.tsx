
import React, { useState, useEffect, useCallback } from 'react';
import { User, FieldSettings } from '../types';
import { STAFF } from '../constants';
import { ArrowLeft, User as UserIcon, Building2, ShieldCheck, Check } from 'lucide-react';

/**
 * @interface LoginScreenProps
 * @description Props for the main login screen component.
 */
interface LoginScreenProps {
  /**
   * Callback function that is triggered upon a successful login attempt.
   * @param user The authenticated user object.
   */
  onLogin: (user: User) => void;
  fieldSettings?: FieldSettings;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, fieldSettings }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (error) {
        const timer = setTimeout(() => setError(''), 2000);
        return () => clearTimeout(timer);
    }
  }, [error]);
  
  const handlePinChange = (value: string) => {
      if (error) setError('');
      if (pin.length < 4) {
          setPin(pin + value);
      }
  };
  
  const handleBackspace = () => {
      setError('');
      setPin(pin.slice(0, -1));
  };

  const handleLoginAttempt = useCallback(() => {
    if (selectedUser && pin.length === 4) {
        onLogin(selectedUser);
    } else {
        setError('Invalid PIN');
        setPin('');
    }
  }, [selectedUser, pin, onLogin]);

  useEffect(() => {
      if (pin.length === 4) {
          handleLoginAttempt();
      }
  }, [pin, handleLoginAttempt]);

  return (
    <div className="min-h-screen w-full bg-[#F4F5F1] text-[#1D2620] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans antialiased select-none">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#0D231E] flex items-center justify-center text-white shadow-sm flex-shrink-0 border border-[#173A32]">
            <Building2 size={20} className="text-[#2C8F73]" />
          </div>
          <div className="text-left">
            <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#1D2620] tracking-tight leading-none">
              {fieldSettings?.clinicName || 'DentSched'}
            </h1>
            <p className="text-[11px] font-semibold text-[#697169] tracking-wider uppercase mt-1">
              Practice Management Terminal
            </p>
          </div>
        </div>

        {/* Main Card Container */}
        <div className="w-full bg-white border border-[#E2E4DD] rounded-2xl shadow-[0_2px_8px_rgba(18,33,28,0.04)] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
          
          {/* Left Panel: Profile Selection */}
          <div className="md:col-span-6 p-5 sm:p-6 lg:p-8 border-b md:border-b-0 md:border-r border-[#E2E4DD] flex flex-col justify-between bg-white">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#697169]">
                  Select Provider / Staff
                </h2>
                <span className="text-[11px] text-[#9CA39B]">
                  {STAFF.length} accounts
                </span>
              </div>

              <div className="space-y-2 max-h-[300px] md:max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#E2E4DD]">
                {STAFF.map(user => {
                  const isSelected = selectedUser?.id === user.id;
                  const initials = user.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <button 
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setPin('');
                        setError('');
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'bg-[#E4F1EC] border-[#1E7A63] text-[#155945] shadow-xs' 
                          : 'bg-white border-[#E2E4DD] hover:bg-[#F4F5F1] text-[#1D2620]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-serif font-bold text-xs flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-[#1E7A63] text-white' : 'bg-[#F4F5F1] text-[#697169] border border-[#E2E4DD]'
                        }`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm leading-tight truncate">
                            {user.name}
                          </div>
                          <div className={`text-[11px] mt-0.5 capitalize truncate ${isSelected ? 'text-[#1E7A63]' : 'text-[#697169]'}`}>
                            {user.role.replace('_', ' ').toLowerCase()}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#1E7A63] text-white flex items-center justify-center flex-shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#EBEDE7] hidden sm:flex items-center justify-between text-[11px] text-[#9CA39B]">
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-[#1E7A63]" />
                HIPAA & Medicolegal Guard Active
              </span>
              <span>v2.4</span>
            </div>
          </div>

          {/* Right Panel: PIN Pad & Auth */}
          <div className="md:col-span-6 p-5 sm:p-6 lg:p-8 flex flex-col items-center justify-center bg-[#FAFBF8]">
            {selectedUser ? (
              <div className="w-full max-w-[280px] flex flex-col items-center animate-in fade-in duration-200">
                
                {/* User Selected Header */}
                <div className="text-center mb-5">
                  <div className="w-12 h-12 rounded-full bg-[#1E7A63] text-white flex items-center justify-center font-serif font-bold text-base mx-auto mb-2 shadow-xs">
                    {selectedUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#1D2620] leading-snug">
                    {selectedUser.name}
                  </h3>
                  <p className="text-[11px] font-medium text-[#697169]">
                    Enter 4-Digit Security PIN
                  </p>
                </div>

                {/* PIN Dots Indicator */}
                <div className="mb-5 w-full">
                  <div className={`flex justify-center gap-3 ${error ? 'animate-bounce' : ''}`}>
                    {[0, 1, 2, 3].map(i => (
                      <div 
                        key={i} 
                        className={`w-11 h-12 rounded-lg flex items-center justify-center text-2xl font-bold transition-all ${
                          error 
                            ? 'bg-[#F8E9E7] border-2 border-[#B14A42] text-[#B14A42]' 
                            : pin[i] 
                              ? 'bg-white border-2 border-[#1E7A63] text-[#1E7A63] shadow-xs' 
                              : 'bg-white border border-[#E2E4DD] text-[#9CA39B]'
                        }`}
                      >
                        {pin[i] ? <span className="inline-block leading-none">•</span> : ''}
                      </div>
                    ))}
                  </div>
                  {error && (
                    <p className="text-center text-[#B14A42] font-semibold text-xs mt-2">
                      {error}
                    </p>
                  )}
                </div>

                {/* Numeric Keypad */}
                <div className="grid grid-cols-3 gap-2 w-full text-base font-semibold">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <button 
                      key={n} 
                      onClick={() => handlePinChange(n.toString())} 
                      className="h-11 bg-white hover:bg-[#F4F5F1] active:bg-[#E4F1EC] text-[#1D2620] rounded-lg border border-[#E2E4DD] shadow-xs transition-colors flex items-center justify-center text-sm font-semibold active:scale-95"
                    >
                      {n}
                    </button>
                  ))}
                  <div />
                  <button 
                    onClick={() => handlePinChange('0')} 
                    className="h-11 bg-white hover:bg-[#F4F5F1] active:bg-[#E4F1EC] text-[#1D2620] rounded-lg border border-[#E2E4DD] shadow-xs transition-colors flex items-center justify-center text-sm font-semibold active:scale-95"
                  >
                    0
                  </button>
                  <button 
                    onClick={handleBackspace} 
                    className="h-11 bg-white hover:bg-[#F4F5F1] active:bg-[#E4F1EC] text-[#697169] hover:text-[#1D2620] rounded-lg border border-[#E2E4DD] shadow-xs transition-colors flex items-center justify-center active:scale-95"
                    aria-label="Backspace"
                  >
                    <ArrowLeft size={16} />
                  </button>
                </div>

              </div>
            ) : (
              <div className="text-center text-[#697169] p-8 max-w-[240px]">
                <div className="w-12 h-12 rounded-xl bg-[#F4F5F1] border border-[#E2E4DD] flex items-center justify-center mx-auto mb-3 text-[#9CA39B]">
                  <UserIcon size={22} />
                </div>
                <p className="font-serif font-semibold text-sm text-[#1D2620] mb-1">
                  Ready to Sign In
                </p>
                <p className="text-xs text-[#697169] leading-relaxed">
                  Select your profile from the list to enter your security PIN.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

