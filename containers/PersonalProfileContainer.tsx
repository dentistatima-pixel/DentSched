import React from 'react';
import PersonalProfile from '../components/PersonalProfile';
import { useAppContext } from '../contexts/AppContext';
import { useStaff } from '../contexts/StaffContext';

function PersonalProfileContainer() {
    const { currentUser } = useAppContext();
    const { handleSaveStaff } = useStaff();

    if (!currentUser) return null;

    return <PersonalProfile currentUser={currentUser} onSave={handleSaveStaff} />;
}

export default PersonalProfileContainer;