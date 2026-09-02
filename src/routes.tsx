import React, { lazy } from 'react';
import { UserRole } from './types';

// Import newly created container components
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const CalendarView = lazy(() => import('./components/CalendarView'));
const AdminContainer = lazy(() => import('./containers/AdminContainer'));
const FieldManagementContainer = lazy(() => import('./containers/FieldManagementContainer'));
const PatientListLayout = lazy(() => import('./containers/PatientListLayout'));
const PersonalProfileContainer = lazy(() => import('./containers/PersonalProfileContainer'));

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
