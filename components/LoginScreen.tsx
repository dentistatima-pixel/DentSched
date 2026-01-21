import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { STAFF } from '../constants';
import { ShieldCheck, Key, ArrowLeft, User as UserIcon } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
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

  const handleLoginAttempt = () => {
    if (selectedUser && selectedUser.pin === pin) {
        onLogin(selectedUser);
    } else {
        setError('Invalid PIN');
        setPin('');
    }
  };

  useEffect(() => {
      if (pin.length === 4) {
          handleLoginAttempt();
      }
  }, [pin]);

  if (selectedUser) {
    return (
        <div className="w-full h-screen bg-teal-900 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
             <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <div className="w-24 h-24 rounded-full border-4 border-teal-400 mx-auto mb-4 shadow-2xl bg-teal-800 flex items-center justify-center">
                        <UserIcon size={48} className="text-teal-300" />
                    </div>
                    <h2 className="text-2xl font-black text-white">{selectedUser.name}</h2>
                    <p className="text-teal-300 font-bold">{selectedUser.role}</p>
                </div>

                <div className="relative mb-6">
                    <div className={`flex justify-center gap-4 ${error ? 'animate-in shake' : ''}`}>
                        {[0,1,2,3].map(i => (
                            <div key={i} className={`w-12 h-16 rounded-lg flex items-center justify-center text-4xl font-bold text-white ${error ? 'bg-red-200 border-2 border-red-500' : 'bg-white/20'}`}>
                                {pin[i] ? <span className="inline-block animate-pop-in">•</span> : ''}
                            </div>
                        ))}
                    </div>
                    {error && <p className="text-center text-red-400 font-bold mt-3 text-sm">{error}</p>}
                </div>

                <div className="grid grid-cols-3 gap-4 text-white text-2xl font-bold">
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                        <button key={n} onClick={() => handlePinChange(n.toString())} className="h-20 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all">{n}</button>
                    ))}
                    <div/>
                    <button onClick={() => handlePinChange('0')} className="h-20 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all">0</button>
                    <button onClick={handleBackspace} className="h-20 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center">
                        <ArrowLeft size={28}/>
                    </button>
                </div>
                 <button onClick={() => { setSelectedUser(null); setPin(''); setError(''); }} className="mt-8 text-teal-400 text-xs font-bold w-full text-center">Not you? Select another profile.</button>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full h-screen bg-teal-900 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white uppercase tracking-widest">dentsched</h1>
        <p className="text-teal-300 font-bold mt-2">Practice Management System</p>
      </div>

      <div className="w-full max-w-md bg-white/10 p-8 rounded-3xl border border-white/20 backdrop-blur-lg">
        <h2 className="text-white font-bold text-center mb-6">Select Your Profile to Login</h2>
        <div className="space-y-3">
          {STAFF.map(user => (
            <button 
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="w-full flex items-center gap-4 p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all"
            >
              <div className="w-12 h-12 rounded-full border-2 border-teal-400 bg-teal-800 flex items-center justify-center shrink-0">
                  <UserIcon size={24} className="text-teal-300" />
              </div>
              <div className="text-left">
                <div className="font-bold">{user.name}</div>
                <div className="text-xs opacity-70">{user.role}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 text-teal-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
        <ShieldCheck size={14} />
        <span>Secure Session Environment</span>
      </div>
    </div>
  );
};

export default LoginScreen;