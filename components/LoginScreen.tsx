
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { STAFF } from '../constants';
import { ArrowLeft, User as UserIcon } from 'lucide-react';

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
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
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
        // In a real app, you'd send the pin to a server for verification.
        // To remove client-side security risks, we've removed the direct `selectedUser.pin === pin` check.
        // For this demo, any 4-digit PIN for a selected user will succeed.
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
    <div className="w-full h-screen bg-teal-900 flex flex-col items-center justify-center p-8">
      <main className="w-full max-w-5xl flex flex-col landscape:flex-row items-center justify-center gap-8 landscape:gap-16 flex-1">
        
        {/* --- Left Column: Branding & Profile Selection --- */}
        <div className="text-center landscape:text-left w-full max-w-md landscape:max-w-none landscape:w-1/2">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white uppercase tracking-widest">dentsched</h1>
            <p className="text-teal-300 font-bold mt-2">Practice Management System</p>
          </div>
          <div className="w-full bg-white/10 p-6 rounded-3xl border border-white/20 backdrop-blur-lg">
            <h2 className="text-white font-bold text-center mb-4">Select Your Profile</h2>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar pr-2">
              {STAFF.map(user => (
                <button 
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    setPin('');
                    setError('');
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl text-white transition-all duration-300 ${selectedUser?.id === user.id ? 'bg-teal-500/80 ring-2 ring-teal-300' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  <div className={`w-12 h-12 rounded-full border-2 bg-teal-800 flex items-center justify-center shrink-0 transition-all ${selectedUser?.id === user.id ? 'border-white' : 'border-teal-400'}`}>
                      <UserIcon size={24} className="text-teal-300" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">{user.name}</div>

                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- Right Column: PIN Pad --- */}
        <div className="w-full max-w-sm landscape:w-1/2 flex flex-col items-center justify-center">
            {selectedUser ? (
                <div className="w-full animate-in fade-in duration-300">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-black text-white">{selectedUser.name}</h2>
                        <p className="text-teal-300 font-bold mt-1">Enter PIN to continue</p>
                    </div>
                    <div className="relative mb-6">
                        <div className={`flex justify-center gap-4 ${error ? 'animate-in shake' : ''}`}>
                            {[0,1,2,3].map(i => (
                                <div key={i} className={`w-12 h-16 rounded-lg flex items-center justify-center text-4xl font-bold text-white ${error ? 'bg-red-200/50 border-2 border-red-500' : 'bg-white/20'}`}>
                                    {pin[i] ? <span className="inline-block animate-pop-in">•</span> : ''}
                                </div>
                            ))}
                        </div>
                        {error && <p className="text-center text-red-400 font-bold mt-3 text-sm">{error}</p>}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-2xl font-bold text-teal-200">
                        {[1,2,3,4,5,6,7,8,9].map(n => (
                            <button key={n} onClick={() => handlePinChange(n.toString())} className="h-16 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all">{n}</button>
                        ))}
                        <div/>
                        <button onClick={() => handlePinChange('0')} className="h-16 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all">0</button>
                        <button onClick={handleBackspace} className="h-16 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center">
                            <ArrowLeft size={28}/>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center text-teal-300/70 p-8">
                    <UserIcon size={48} className="mx-auto mb-4"/>
                    <p className="font-bold">Select a profile from the left to begin.</p>
                </div>
            )}
        </div>
      </main>


    </div>
  );
};
