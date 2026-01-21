
import React, { ReactNode } from 'react';
import { UserRole } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { useNavigate } from '../contexts/RouterContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { currentUser } = useAppContext();
  const navigate = useNavigate();

  const isAuthorized = currentUser && requiredRoles.includes(currentUser.role);

  React.useEffect(() => {
    if (!isAuthorized) {
      // You can also show a toast message here
      console.warn(`Unauthorized access attempt to a protected route. Required: ${requiredRoles.join(', ')}. Found: ${currentUser?.role}`);
      navigate('dashboard');
    }
  }, [isAuthorized, navigate]);

  if (!isAuthorized) {
    return null; // or a loading spinner, or a dedicated "Unauthorized" component
  }

  return <>{children}</>;
};

export default ProtectedRoute;
