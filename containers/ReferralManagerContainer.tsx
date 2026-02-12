import React from 'react';
import ReferralManager from '../components/ReferralManager';
import { usePatient } from '../contexts/PatientContext';
import { useClinicalOps } from '../contexts/ClinicalOpsContext';
import { useStaff } from '../contexts/StaffContext';
import { useNavigate } from '../contexts/RouterContext';


function ReferralManagerContainer() {
    const { patients } = usePatient();
    const { referrals, handleSaveReferral } = useClinicalOps();
    const { staff } = useStaff();
    const navigate = useNavigate();
    return <ReferralManager
        patients={patients}
        referrals={referrals}
        onSaveReferral={handleSaveReferral}
        staff={staff}
    />;
}

export default ReferralManagerContainer;