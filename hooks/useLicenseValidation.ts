import { useState, useEffect } from 'react';
import { User } from '../types';
import { useStaff } from '../contexts/StaffContext';
import { isExpired, isWithin30Days, formatDate } from '../constants';

interface LicenseValidationResult {
    isPrcExpired: boolean;
    isMalpracticeExpired: boolean;
    licenseAlerts: string[];
}

export const useLicenseValidation = (providerId: string | null): LicenseValidationResult => {
    const { staff } = useStaff();
    const [result, setResult] = useState<LicenseValidationResult>({ isPrcExpired: false, isMalpracticeExpired: false, licenseAlerts: [] });

    useEffect(() => {
        if (!providerId) {
            setResult({ isPrcExpired: false, isMalpracticeExpired: false, licenseAlerts: [] });
            return;
        }

        const provider = staff.find(s => s.id === providerId);
        if (!provider) {
            setResult({ isPrcExpired: false, isMalpracticeExpired: false, licenseAlerts: [] });
            return;
        }

        const alerts: string[] = [];
        let prcIsExpired = false;
        let malpracticeIsExpired = false;

        if (provider.prcLicense) {
            if (isExpired(provider.prcExpiry)) {
                prcIsExpired = true;
                alerts.push(`CRITICAL: ${provider.name}'s PRC License has expired!`);
            } else if (isWithin30Days(provider.prcExpiry)) {
                alerts.push(`Warning: ${provider.name}'s PRC License expires on ${formatDate(provider.prcExpiry)}.`);
            }
        }

        if (provider.s2License) {
            if (isExpired(provider.s2Expiry)) {
                alerts.push(`Warning: ${provider.name}'s S2 License has expired.`);
            } else if (isWithin30Days(provider.s2Expiry)) {
                alerts.push(`Notice: ${provider.name}'s S2 License expires soon.`);
            }
        }
        
        if (provider.malpracticePolicy) {
            if (isExpired(provider.malpracticeExpiry)) {
                malpracticeIsExpired = true;
                alerts.push(`CRITICAL: ${provider.name}'s Malpractice Insurance has expired!`);
            } else if (isWithin30Days(provider.malpracticeExpiry)) {
                alerts.push(`Warning: ${provider.name}'s Malpractice Insurance expires soon.`);
            }
        }

        setResult({ isPrcExpired: prcIsExpired, isMalpracticeExpired: malpracticeIsExpired, licenseAlerts: alerts });

    }, [providerId, staff]);

    return result;
};
