import React from 'react';
import { UserRole } from './types';
import { Dashboard } from './components/Dashboard';
import CalendarView from './components/CalendarView';

// Import newly created container components
import AdminContainer from './containers/AdminContainer';
import FieldManagementContainer from './containers/FieldManagementContainer';
import PatientListLayout from './containers/PatientListLayout';
import PersonalProfileContainer from './containers/PersonalProfileContainer';


export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  requiredRoles?: UserRole[];
  props?: Record<string, any>;
}

export const routes: RouteConfig[] = [
  { path: 'dashboard', component: Dashboard },
  { path: 'schedule', component: CalendarView },
  { path: 'patients', component: PatientListLayout },
  { path: 'profile', component: PersonalProfileContainer },
  { 
    path: 'admin', 
    component: AdminContainer, 
    requiredRoles: [UserRole.ADMIN, UserRole.SYSTEM_ARCHITECT] 
  },
  { 
    path: 'field-mgmt', 
    component: FieldManagementContainer, 
    requiredRoles: [UserRole.ADMIN, UserRole.SYSTEM_ARCHITECT] 
  },
];