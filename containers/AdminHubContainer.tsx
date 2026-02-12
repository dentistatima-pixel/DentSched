import React, { Suspense } from 'react';
import { useNavigate } from '../contexts/RouterContext';
import { AdminHub } from '../components/AdminHub';

// Import all sub-containers for the admin hub
import FinancialsContainer from './FinancialsContainer';
import InventoryContainer from './InventoryContainer';
import AnalyticsHubContainer from './AnalyticsHubContainer';
import GovernanceHubContainer from './GovernanceHubContainer';
import CommunicationHubContainer from './CommunicationHubContainer';
import RecallCenterContainer from './RecallCenterContainer';
import ReferralManagerContainer from './ReferralManagerContainer';
import RosterViewContainer from './RosterViewContainer';
import LeaveAndShiftManagerContainer from './LeaveAndShiftManagerContainer';
import FamilyGroupManagerContainer from './FamilyGroupManagerContainer';
import { AdminLayout } from '../components/AdminLayout';


const PageLoader: React.FC = () => (
  <div className="h-full w-full flex items-center justify-center bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
);


function AdminHubContainer({ route }: { route: { param: string | null } }) {
    const navigate = useNavigate();
    const activePage = route.param || 'hub';

    const renderAdminPage = () => {
        switch (route.param) {
            case 'financials':
                return <FinancialsContainer route={route} />;
            case 'inventory':
                return <InventoryContainer />;
            case 'analytics':
                return <AnalyticsHubContainer />;
            case 'governance':
                return <GovernanceHubContainer onNavigate={navigate} />;
            case 'communications':
                return <CommunicationHubContainer />;
            case 'recall':
                return <RecallCenterContainer />;
            case 'referrals':
                return <ReferralManagerContainer />;
            case 'roster':
                return <RosterViewContainer />;
            case 'leave':
                return <LeaveAndShiftManagerContainer />;
            case 'familygroups':
                return <FamilyGroupManagerContainer onBack={() => navigate('admin')} />;
            default:
                // If no param, show the main Admin Hub dashboard
                return <AdminHub onNavigate={navigate} />;
        }
    };
    
    return (
        <AdminLayout activePage={activePage}>
            <Suspense fallback={<PageLoader />}>
                {renderAdminPage()}
            </Suspense>
        </AdminLayout>
    );
}

export default AdminHubContainer;