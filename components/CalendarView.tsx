
import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, Patient, User, UserRole } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus, X, Users, User as UserIcon } from 'lucide-react';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface CalendarViewProps {
  appointments: Appointment[];
  patients: Patient[];
  professionals: User[];
  currentUser: User;
  onUpdate: (appts: Appointment[]) => void;
}

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const getDaysInWeek = (startDate: Date) => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });
};

const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const CalendarView: React.FC<CalendarViewProps> = ({ appointments, patients, professionals, currentUser, onUpdate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'Día' | 'Semana'>('Semana');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newSession, setNewSession] = useState({
    patientId: '',
    professionalId: currentUser.role === UserRole.ADMIN ? '' : currentUser.id,
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    particularValue: '' as any,
    insuranceValue: '' as any
  });

  const isAdmin = currentUser.role === UserRole.ADMIN;

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAddModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const visibleAppointments = useMemo(() => {
    if (isAdmin) return appointments;
    return appointments.filter(a => a.professionalId === currentUser.id);
  }, [appointments, isAdmin, currentUser.id]);

  const weekDays = useMemo(() => getDaysInWeek(getStartOfWeek(currentDate)), [currentDate]);
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  const handleNavigate = (direction: number) => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'Semana') nextDate.setDate(currentDate.getDate() + (direction * 7));
    else if (viewMode === 'Día') nextDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(nextDate);
  };

  const dayAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return visibleAppointments.filter(a => a.start.startsWith(dateStr));
  }, [selectedDate, visibleAppointments]);

  const handleCreateSession = () => {
    const targetProId = isAdmin ? newSession.professionalId : currentUser.id;
    if (!newSession.patientId || !targetProId) return;
    
    const start = `${newSession.date}T${newSession.time}:00`;
    const end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();
    
    const appt: Appointment = {
      id: generateUUID(),
      patientId: newSession.patientId,
      professionalId: targetProId,
      start,
      end,
      particularValue: Number(newSession.particularValue) || 0,
      insuranceValue: Number(newSession.insuranceValue) || 0,
      baseValue: (Number(newSession.particularValue) || 0) + (Number(newSession.insuranceValue) || 0)
    };
    
    onUpdate([...appointments, appt]);
    setShowAddModal(false);
  };

  const onCellClick = (date: Date) => {
    setSelectedDate(date);
    setNewSession(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-display font-bold text-brand-navy">Agenda Interdisciplinaria</h2>
          <p className="text-sm text-brand-teal font-medium">Control de sesiones y disponibilidad del equipo</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-brand-coral text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-bold shadow-xl shadow-brand-coral/20 hover:scale-[1.02] transition-all"
        >
          <Plus size={20} /> Agendar Sesión
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
        <div className="lg:col-span-8 bg-white rounded-[40px] border border-brand-sage shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="p-6 border-b border-brand-sage flex justify-between items-center bg-brand-beige/20 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white border border-brand-sage rounded-xl p-1 shadow-sm">
                <button onClick={() => handleNavigate(-1)} className="p-2 hover:bg-brand-beige rounded-lg transition-colors"><ChevronLeft size={20} /></button>
                <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }} className="px-4 py-1 text-[10px] font-black uppercase tracking-widest text-brand-navy">Hoy</button>
                <button onClick={() => handleNavigate(1)} className="p-2 hover:bg-brand-beige rounded-lg transition-colors"><ChevronRight size={20} /></button>
              </div>
              <h3 className="text-lg font-display font-bold text-brand-navy hidden sm:block">
                {currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).toUpperCase()}
              </h3>
            </div>
            <div className="flex gap-1 bg-brand-sage/20 p-1 rounded-2xl">
              {['Día', 'Semana'].map(m => (
                <button 
                  key={m} 
                  onClick={() => setViewMode(m as any)}
                  className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === m ? 'bg-white text-brand-navy shadow-sm' : 'text-brand-teal/40'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            {viewMode === 'Semana' ? (
              <div className="min-w-[800px]">
                <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-brand-beige/30 border-b border-brand-sage sticky top-0 z-20">
                  <div className="h-16"></div>
                  {weekDays.map((date) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isSelected = selectedDate.toDateString() === date.toDateString();
                    return (
                      <div 
                        key={date.toString()} 
                        onClick={() => onCellClick(date)}
                        className={`p-4 text-center cursor-pointer transition-all hover:bg-brand-mint/10 border-r border-brand-sage/50 last:border-r-0 ${isSelected ? 'bg-brand-mint/10 shadow-inner' : ''}`}
                      >
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-brand-coral' : 'text-brand-teal/60'}`}>
                          {date.toLocaleDateString('es-AR', { weekday: 'short' })}
                        </p>
                        <p className={`text-xl font-black mt-1 ${isToday ? 'text-brand-coral' : 'text-brand-navy'}`}>
                          {date.getDate()}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="relative">
                  {hours.map((hour) => (
                    <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-brand-sage/30 h-20">
                      <div className="p-3 text-right border-r border-brand-sage/30 bg-brand-beige/5">
                        <span className="text-[10px] font-black text-brand-teal/30 uppercase">{hour}:00</span>
                      </div>
                      {weekDays.map((date) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const cellAppts = visibleAppointments.filter(a => a.start.startsWith(dateStr) && new Date(a.start).getHours() === hour);
                        const isSelected = selectedDate.toDateString() === date.toDateString();
                        return (
                          <div 
                            key={date.toString() + hour} 
                            onClick={() => onCellClick(date)}
                            className={`border-r border-brand-sage/10 last:border-r-0 relative group p-1 transition-colors ${isSelected ? 'bg-brand-mint/5' : ''}`}
                          >
                            {cellAppts.map(appt => {
                              const p = patients.find(pat => pat.id === appt.patientId);
                              return (
                                <div key={appt.id} className="bg-brand-coral/10 border-l-4 border-brand-coral rounded-xl p-2 h-full shadow-sm cursor-pointer hover:shadow-md transition-all overflow-hidden">
                                  <p className="text-[10px] font-black text-brand-navy truncate">{p?.firstName} {p?.lastName}</p>
                                  <p className="text-[8px] font-bold text-brand-teal truncate mt-0.5">{formatTime(appt.start)}</p>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-10 text-center text-brand-teal/20 h-full flex items-center justify-center">
                <div>
                   <CalendarIcon size={64} className="mx-auto mb-4 opacity-20" />
                   <p className="text-xl font-display font-bold">Vista diaria personalizada</p>
                   <p className="text-sm">Selecciona un día en la semana para ver sus detalles</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-80 bg-white rounded-[40px] border border-brand-sage shadow-sm overflow-hidden flex flex-col shrink-0 transition-all">
          <div className="p-8 bg-brand-navy text-white shrink-0">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Pacientes del Día</h4>
            <h3 className="text-xl font-display font-bold">
              {selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            {dayAppointments.length > 0 ? dayAppointments.sort((a,b) => a.start.localeCompare(b.start)).map(appt => {
              const p = patients.find(pat => pat.id === appt.patientId);
              const pro = professionals.find(pr => pr.id === appt.professionalId);
              return (
                <div key={appt.id} className="p-4 bg-brand-beige/30 border border-brand-sage rounded-2xl hover:border-brand-coral transition-all hover:scale-[1.02] shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={p?.avatar || `https://picsum.photos/seed/${p?.id}/100`} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-brand-navy truncate">{p?.firstName} {p?.lastName}</p>
                      <p className="text-[9px] font-bold text-brand-teal uppercase truncate">{pro?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-brand-navy">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-brand-coral" />
                      <span>{formatTime(appt.start)}</span>
                    </div>
                    {appt.particularValue > 0 && <span className="bg-brand-coral/10 text-brand-coral px-2 py-0.5 rounded-lg">Part.</span>}
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center text-brand-teal/20 space-y-4">
                <div className="p-10 bg-brand-beige rounded-full inline-block">
                   <Users size={48} strokeWidth={1} className="mx-auto" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No hay turnos agendados<br/>para esta fecha</p>
              </div>
            )}
          </div>
          <div className="p-6 border-t border-brand-sage shrink-0 bg-brand-beige/20">
             <button onClick={() => setShowAddModal(true)} className="w-full bg-brand-navy text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-coral transition-colors">
                <Plus size={14} /> Agendar en este día
             </button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-navy/30 backdrop-blur-md p-6">
          <div className="bg-brand-beige w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="p-8 border-b border-brand-sage flex justify-between items-center bg-white/50">
                <h3 className="text-2xl font-display font-bold text-brand-navy">Agendar Sesión</h3>
                <button onClick={() => setShowAddModal(false)} className="text-brand-navy/30 hover:text-brand-coral transition-colors"><X size={24} /></button>
             </div>
             <div className="p-10 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-2">Paciente</label>
                   <select className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-medium outline-none" value={newSession.patientId} onChange={e => setNewSession({...newSession, patientId: e.target.value})}>
                     <option value="">Seleccione Paciente</option>
                     {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                   </select>
                </div>
                {isAdmin && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-2">Profesional</label>
                    <select className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-medium outline-none" value={newSession.professionalId} onChange={e => setNewSession({...newSession, professionalId: e.target.value})}>
                      <option value="">Seleccione Profesional</option>
                      {professionals.map(pro => <option key={pro.id} value={pro.id}>{pro.name} ({pro.specialty})</option>)}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-2">Fecha</label>
                    <input type="date" className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-bold" value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-2">Hora</label>
                    <input type="time" className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-bold" value={newSession.time} onChange={e => setNewSession({...newSession, time: e.target.value})} />
                  </div>
                </div>
             </div>
             <div className="p-8 bg-white/80 border-t border-brand-sage flex justify-end gap-4">
                <button onClick={() => setShowAddModal(false)} className="px-6 py-3 rounded-2xl font-bold text-brand-navy/40 hover:text-brand-coral transition-colors">Cancelar</button>
                <button onClick={handleCreateSession} className="bg-brand-navy text-white px-10 py-3 rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition-all">Confirmar Turno</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
