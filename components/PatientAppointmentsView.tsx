import React, { useState, useRef, useEffect } from 'react';
import { Appointment, AppointmentStatus, User } from '../types';
import { Calendar, Clock, User as UserIcon, CheckCircle, XCircle, UserX, Armchair, UserCheck } from 'lucide-react';
import { formatDate } from '../constants';
import { useStaff } from '../contexts/StaffContext';

const VIRTUAL_ITEM_HEIGHT = 84; // The fixed height of each appointment card item

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

const VirtualizedList = <T extends { id: string | number }>({ items, renderItem }: VirtualizedListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const resizeObserver = new ResizeObserver(() => {
      setContainerHeight(element.clientHeight);
    });
    resizeObserver.observe(element);
    setContainerHeight(element.clientHeight); // Set initial height
    return () => resizeObserver.disconnect();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const startIndex = Math.floor(scrollTop / VIRTUAL_ITEM_HEIGHT);
  const visibleCount = Math.ceil(containerHeight / VIRTUAL_ITEM_HEIGHT) + 2; // +2 for buffer
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="w-full h-full overflow-y-auto no-scrollbar"
    >
      <div style={{ height: items.length * VIRTUAL_ITEM_HEIGHT, position: 'relative' }}>
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index;
          const style: React.CSSProperties = {
            position: 'absolute',
            top: actualIndex * VIRTUAL_ITEM_HEIGHT,
            left: 0,
            right: 0,
            height: VIRTUAL_ITEM_HEIGHT,
          };
          return (
            <div key={item.id} style={style}>
              {renderItem(item)}
            </div>
          );
        })}
      </div>
    </div>
  );
};


interface PatientAppointmentsViewProps {
  appointments: Appointment[];
}

const statusIcons: { [key in AppointmentStatus]: React.ElementType } = {
  [AppointmentStatus.SCHEDULED]: Calendar,
  [AppointmentStatus.CONFIRMED]: Calendar,
  [AppointmentStatus.ARRIVED]: UserCheck,
  [AppointmentStatus.SEATED]: Armchair,
  [AppointmentStatus.TREATING]: Armchair,
  [AppointmentStatus.COMPLETED]: CheckCircle,
  [AppointmentStatus.CANCELLED]: XCircle,
  [AppointmentStatus.NO_SHOW]: UserX,
};

export const PatientAppointmentsView: React.FC<PatientAppointmentsViewProps> = ({ appointments }) => {
    const { staff } = useStaff();
    const sortedAppointments = [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.time.localeCompare(a.time));

    const upcoming = sortedAppointments.filter(a => new Date(a.date) >= new Date(new Date().toDateString()) && a.status !== AppointmentStatus.CANCELLED && a.status !== AppointmentStatus.COMPLETED && a.status !== AppointmentStatus.NO_SHOW);
    const past = sortedAppointments.filter(a => new Date(a.date) < new Date(new Date().toDateString()) || a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.NO_SHOW);

    const AppointmentCard: React.FC<{apt: Appointment, isUpcoming: boolean}> = ({ apt, isUpcoming }) => {
        const provider = staff.find(s => s.id === apt.providerId);
        const Icon = statusIcons[apt.status] || Calendar;
        const statusColor = apt.status === AppointmentStatus.COMPLETED ? 'bg-teal-100 text-teal-700' : 
                            apt.status === AppointmentStatus.CANCELLED || apt.status === AppointmentStatus.NO_SHOW ? 'bg-red-100 text-red-700' :
                            isUpcoming ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600';

        return (
            <div className="p-2 h-full">
                <div key={apt.id} className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between h-full ${!isUpcoming ? 'opacity-80' : ''}`}>
                    <div className="flex items-center gap-4">
                        <Icon size={24} className={isUpcoming ? 'text-teal-600' : 'text-slate-400'}/>
                        <div>
                            <p className={`font-bold ${isUpcoming ? 'text-slate-800' : 'text-slate-600'}`}>{apt.type}</p>
                            <p className="text-xs text-slate-500">{formatDate(apt.date)} at {apt.time} with {provider?.name}</p>
                        </div>
                    </div>
                    <span className={`text-xs font-black px-3 py-1 rounded-full ${statusColor}`}>{apt.status}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-6 h-full flex flex-col">
            <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4">Upcoming & Scheduled</h3>
                {upcoming.length > 0 ? (
                    <div className="space-y-3">
                        {upcoming.map(apt => <div key={apt.id} style={{height: VIRTUAL_ITEM_HEIGHT}}><AppointmentCard apt={apt} isUpcoming={true} /></div>)}
                    </div>
                ) : <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-500 italic">No upcoming appointments found.</div>}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4">Appointment History</h3>
                 {past.length > 0 ? (
                    <div className="flex-1 min-h-0">
                       <VirtualizedList
                           items={past}
                           renderItem={(apt) => <AppointmentCard apt={apt} isUpcoming={false} />}
                       />
                    </div>
                 ) : <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-500 italic">No past appointments in history.</div>}
            </div>
        </div>
    );
};