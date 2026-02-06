import { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { UserRole } from '../types';

// Centralized permission mapping
const PERMISSION_MAP: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    'view:financials',
    'manage:admin',
    'manage:setup',
    'manage:day-session'
  ],
  [UserRole.DENTIST]: [
    'view:financials',
    'use:ai-features'
  ],
  [UserRole.DENTAL_ASSISTANT]: [],
  [UserRole.SYSTEM_ARCHITECT]: [
    'view:financials',
    'manage:admin',
    'manage:setup',
    'use:ai-features'
  ],
};

export const useAuthorization = () => {
  const { currentUser } = useAppContext();

  const can = useMemo(() => (permission: string): boolean => {
    if (!currentUser) {
      return false;
    }
    const userPermissions = PERMISSION_MAP[currentUser.role] || [];
    return userPermissions.includes(permission);
  }, [currentUser]);

  return { can, currentUserRole: currentUser?.role };
};
