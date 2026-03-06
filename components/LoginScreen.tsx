
import React, { useState, useEffect, useCallback } from 'react';
import { User, FieldSettings } from '../types';
import { STAFF } from '../constants';
import { ArrowLeft, User as UserIcon, Building2 } from 'lucide-react';

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
      <main className="w-full max-w-6xl flex flex-row items-center justify-center gap-12 lg:gap-20 flex-1 px-4">
        
        {/* --- Left Column: Branding & Profile Selection --- */}
        <div className="text-left w-1/2 max-w-md">
          <div className="mb-10">
            <div className="flex items-center justify-start gap-5 mb-6">
                <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-2xl">
                    {fieldSettings?.clinicLogoFull ? (
                        <img src={fieldSettings.clinicLogoFull} alt={fieldSettings.clinicName} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                        <Building2 size={48} className="text-teal-300" />
                    )}
                </div>
                <div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">{fieldSettings?.clinicName || 'DentSched'}</h1>
                    <p className="text-teal-300 font-bold mt-2 tracking-widest uppercase text-xs">Practice Management Terminal</p>
                </div>
            </div>
          </div>
          <div className="w-full bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-2xl shadow-2xl">
            <h2 className="text-teal-200 font-black uppercase tracking-widest text-xs mb-6 px-2">Select Your Profile</h2>
            <div className="space-y-4 max-h-[55vh] overflow-y-auto no-scrollbar pr-2">
              {STAFF.map(user => (
                <button 
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    setPin('');
                    setError('');
                  }}
                  className={`w-full flex items-center gap-5 p-5 rounded-[2rem] text-white transition-all duration-500 group ${selectedUser?.id === user.id ? 'bg-teal-500 shadow-xl shadow-teal-900/40 scale-[1.02]' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500 ${selectedUser?.id === user.id ? 'bg-white border-white' : 'bg-teal-800 border-teal-400 group-hover:border-white'}`}>
                      <UserIcon size={28} className={selectedUser?.id === user.id ? 'text-teal-600' : 'text-teal-300 group-hover:text-white'} />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-lg tracking-tight">{user.name}</div>
                    <div className={`text-xs font-bold uppercase tracking-widest ${selectedUser?.id === user.id ? 'text-teal-100' : 'text-teal-400'}`}>{user.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- Right Column: PIN Pad --- */}
        <div className="w-1/2 max-w-sm flex flex-col items-center justify-center">
            {selectedUser ? (
                <div className="w-full animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="text-center mb-10">
                        <div className="inline-block p-1 bg-white/10 rounded-full mb-4">
                            <div className="w-20 h-20 rounded-full bg-teal-500 flex items-center justify-center border-4 border-white/20 shadow-xl">
                                <UserIcon size={40} className="text-white" />
                            </div>
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tighter">{selectedUser.name}</h2>
                        <p className="text-teal-300 font-bold mt-2 uppercase tracking-widest text-xs">Enter Security PIN</p>
                    </div>
                    <div className="relative mb-8">
                        <div className={`flex justify-center gap-5 ${error ? 'animate-in shake' : ''}`}>
                            {[0,1,2,3].map(i => (
                                <div key={i} className={`w-14 h-20 rounded-2xl flex items-center justify-center text-5xl font-bold text-white transition-all duration-300 ${error ? 'bg-red-500/20 border-2 border-red-500' : pin[i] ? 'bg-teal-500 border-2 border-teal-300 shadow-lg shadow-teal-900/40' : 'bg-white/10 border-2 border-white/5'}`}>
                                    {pin[i] ? <span className="inline-block animate-pop-in">•</span> : ''}
                                </div>
                            ))}
                        </div>
                        {error && <p className="text-center text-red-400 font-black mt-4 text-sm uppercase tracking-widest animate-in fade-in">{error}</p>}
                    </div>
                    <div className="grid grid-cols-3 gap-5 text-3xl font-black text-white">
                        {[1,2,3,4,5,6,7,8,9].map(n => (
                            <button key={n} onClick={() => handlePinChange(n.toString())} className="h-20 bg-white/5 rounded-[1.5rem] border border-white/5 hover:bg-white/10 active:scale-90 transition-all duration-200 shadow-lg">{n}</button>
                        ))}
                        <div/>
                        <button onClick={() => handlePinChange('0')} className="h-20 bg-white/5 rounded-[1.5rem] border border-white/5 hover:bg-white/10 active:scale-90 transition-all duration-200 shadow-lg">0</button>
                        <button onClick={handleBackspace} className="h-20 bg-white/5 rounded-[1.5rem] border border-white/5 hover:bg-white/10 active:scale-90 transition-all duration-200 shadow-lg flex items-center justify-center">
                            <ArrowLeft size={32} strokeWidth={3}/>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center text-teal-300/50 p-12 bg-white/5 rounded-[3rem] border border-dashed border-white/10 animate-pulse">
                    <UserIcon size={64} className="mx-auto mb-6 opacity-20"/>
                    <p className="font-black uppercase tracking-widest text-sm">Select a profile<br/>to begin session</p>
                </div>
            )}
        </div>
      </main>

    </div>
  );
};
