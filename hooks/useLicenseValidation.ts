
import { useState, useEffect } from 'react';
import { User } from '../types';
import { useStaff } from '../contexts/StaffContext';
// Fix: Import formatDate to resolve "Cannot find name" error.
import { isExpired, isWithin30Days, formatDate } from '../constants';

interface LicenseValidationResult {
    isPrcExpired: boolean;
    licenseAlerts: string[];
}

export const useLicenseValidation = (providerId: string | null): LicenseValidationResult => {
    const { staff } = useStaff();
    const [result, setResult] = useState<LicenseValidationResult>({ isPrcExpired: false, licenseAlerts: [] });

    useEffect(() => {
        if (!providerId) {
            setResult({ isPrcExpired: false, licenseAlerts: [] });
            return;
        }

        const provider = staff.find(s => s.id === providerId);
        if (!provider) {
            setResult({ isPrcExpired: false, licenseAlerts: [] });
            return;
        }

        const alerts: string[] = [];
        let prcIsExpired = false;

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
                alerts.push(`CRITICAL: ${provider.name}'s Malpractice Insurance has expired!`);
            } else if (isWithin30Days(provider.malpracticeExpiry)) {
                alerts.push(`Warning: ${provider.name}'s Malpractice Insurance expires soon.`);
            }
        }

        setResult({ isPrcExpired: prcIsExpired, licenseAlerts: alerts });

    }, [providerId, staff]);

    return result;
};
