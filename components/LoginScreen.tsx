import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { STAFF } from '../constants';
import { ShieldCheck, Key, ArrowLeft, User as UserIcon } from 'lucide-react';
import CryptoJS from 'crypto-js';

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

/**
 * JEST/RTL TEST PLAN:
 * 
 * 1. Test initial render:
 *    - It should render the main title "dentsched".
 *    - It should render a list of staff members from the `STAFF` constant.
 * 
 * 2. Test user selection:
 *    - Simulate a click on a user profile button.
 *    - Verify that the component transitions to the PIN entry screen for the selected user.
 *    - The selected user's name and role should be displayed.
 * 
 * 3. Test PIN entry:
 *    - Simulate clicks on the number pad buttons.
 *    - Verify that the PIN display updates correctly with dots.
 *    - Test the backspace functionality.
 * 
 * 4. Test successful login:
 *    - Enter the correct PIN for the selected user.
 *    - Verify that the `onLogin` callback is called exactly once with the correct user object.
 * 
 * 5. Test unsuccessful login:
 *    - Enter an incorrect PIN.
 *    - Verify that an "Invalid PIN" error message is displayed.
 *    - Verify that the PIN input is cleared automatically after the error.
 * 
 * 6. Test switching users:
 *    - From the PIN screen, simulate a click on the "Not you? Select another profile" button.
 *    - Verify that the component returns to the initial user selection screen.
 */
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

  const handleLoginAttempt = () => {
    if (selectedUser && selectedUser.pin === CryptoJS.SHA256(pin).toString()) {
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
  }, [pin, handleLoginAttempt]);

  if (selectedUser) {
    return (
        <div className="w-full min-h-screen bg-teal-900 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
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
                            <div key={i} className={`w-12 h-16 rounded-lg flex items-center justify-center text-4xl font-bold text-white ${error ? 'bg-red-200/50 border-2 border-red-500' : 'bg-white/20'}`}>
                                {pin[i] ? <span className="inline-block animate-pop-in">•</span> : ''}
                            </div>
                        ))}
                    </div>
                    {error && <p className="text-center text-red-400 font-bold mt-3 text-sm">{error}</p>}
                </div>

                <div className="grid grid-cols-3 gap-4 text-2xl font-bold">
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                        <button key={n} onClick={() => handlePinChange(n.toString())} className="h-20 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all text-teal-200">{n}</button>
                    ))}
                    <div/>
                    <button onClick={() => handlePinChange('0')} className="h-20 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all text-teal-200">0</button>
                    <button onClick={handleBackspace} className="h-20 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-teal-200">
                        <ArrowLeft size={28}/>
                    </button>
                </div>
                 <button onClick={() => { setSelectedUser(null); setPin(''); setError(''); }} className="mt-8 text-teal-400 text-xs font-bold w-full text-center">Not you? Select another profile.</button>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-teal-900 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white uppercase tracking-widest">dentsched</h1>
        <p className="text-teal-300 font-bold mt-2">Practice Management System</p>
      </div>

      <div className="w-full max-w-md bg-white/10 p-8 rounded-3xl border border-white/20 backdrop-blur-lg">
        <h2 className="text-white font-bold text-center mb-6">Select Your Profile to Login</h2>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
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