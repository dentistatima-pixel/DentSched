import ReferralManager from '../components/ReferralManager';
import { usePatient } from '../contexts/PatientContext';
import { useClinicalOps } from '../contexts/ClinicalOpsContext';
import { useStaff } from '../contexts/StaffContext';


function ReferralManagerContainer() {
    const { patients } = usePatient();
    const { referrals, handleSaveReferral } = useClinicalOps();
    const { staff } = useStaff();
    return <ReferralManager
        patients={patients}
        referrals={referrals}
        onSaveReferral={handleSaveReferral}
        staff={staff}
    />;
}

export default ReferralManagerContainer;