import React from 'react';
import RecallCenter from '../components/RecallCenter';
import { usePatient } from '../contexts/PatientContext';
import { useNavigate } from '../contexts/RouterContext';

function RecallCenterContainer() {
    const { patients, handleUpdatePatientRecall } = usePatient();
    const navigate = useNavigate();
    return <RecallCenter 
        patients={patients} 
        onUpdatePatientRecall={handleUpdatePatientRecall}
        onBack={() => navigate('admin')}
    />;
}

export default RecallCenterContainer;