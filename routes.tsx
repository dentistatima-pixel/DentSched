import React from 'react';
import { UserRole } from './types';
import { Dashboard } from './components/Dashboard';
import CalendarView from './components/CalendarView';
import { PatientList } from './components/PatientList';

// Import newly created container components
import AdminHubContainer from './containers/AdminHubContainer';
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
    component: AdminHubContainer, 
    requiredRoles: [UserRole.ADMIN, UserRole.SYSTEM_ARCHITECT] 
  },
  { 
    path: 'field-mgmt', 
    component: FieldManagementContainer, 
    requiredRoles: [UserRole.ADMIN, UserRole.SYSTEM_ARCHITECT] 
  },
];