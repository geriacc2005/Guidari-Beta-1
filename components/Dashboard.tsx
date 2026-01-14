
import React, { useState, useEffect, useMemo } from 'react';
import { User, Patient, Appointment, UserRole, DocType } from '../types';
import { Users, CheckCircle2, Timer, Calendar as CalendarIcon, Clock, Plus, X, AlertTriangle, Cake, Gift, PartyPopper } from 'lucide-react';

interface DashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  currentUser: User;
  professionals: User[];
  onAddAppointment?: (appt: Appointment) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ patients, appointments, currentUser, professionals, onAddAppointment }) => {
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
  const firstName = currentUser.firstName;
  const todayDate = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAddModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);
  
  const birthdaysToday = useMemo(() => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();

    const patientBirthdays = patients.filter(p => {
      if (!p.dateOfBirth) return false;
      const bday = new Date(p.dateOfBirth);
      const bdayMonth = bday.getUTCMonth();
      const bdayDay = bday.getUTCDate();
      return bdayMonth === todayMonth && bdayDay === todayDay;
    }).map(p => ({ name: `${p.firstName} ${p.lastName}`, type: 'Paciente', avatar: p.avatar }));

    const staffBirthdays = professionals.filter(pro => {
      if (!pro.dob) return false;
      const bday = new Date(pro.dob);
      const bdayMonth = bday.getUTCMonth();
      const bdayDay = bday.getUTCDate();
      return bdayMonth === todayMonth && bdayDay === todayDay;
    }).map(pro => ({ name: pro.name, type: 'Colega', avatar: pro.avatar }));

    return [...patientBirthdays, ...staffBirthdays];
  }, [patients, professionals]);

  const visibleAppointments = isAdmin 
    ? appointments 
    : appointments.filter(a => a.professionalId === currentUser.id);

  const todayAppointments = visibleAppointments.filter(appt => appt.start.split('T')[0] === todayDate);
  const currentMonthSessions = visibleAppointments.filter(a => {
    const d = new Date(a.start);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const missingDocsData = useMemo(() => {
    if (!isAdmin) return []; // Los profesionales no ven alertas administrativas de otros
    return patients.map(p => {
      const monthlyDocs = p.documents.filter(d => {
        const docDate = new Date(d.date);
        return docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear;
      });
      const hasFactura = monthlyDocs.some(d => d.type === DocType.FACTURA);
      const hasPlanilla = monthlyDocs.some(d => d.type === DocType.PLANILLA || d.type === DocType.INFORME);
      const missing = [];
      if (!hasFactura) missing.push("Factura");
      if (!hasPlanilla) missing.push("Planilla");
      if (missing.length === 0) return null;
      return { patient: p, missing };
    }).filter(item => item !== null) as { patient: Patient, missing: string[] }[];
  }, [patients, isAdmin, currentMonth, currentYear]);

  const handleCreateSession = () => {
    const targetProId = isAdmin ? newSession.professionalId : currentUser.id;
    if (!newSession.patientId || !targetProId) return;

    const start = `${newSession.date}T${newSession.time}:00`;
    const end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();
    const appt: Appointment = {
      id: 'a' + Math.random().toString(36).substr(2, 9),
      patientId: newSession.patientId,
      professionalId: targetProId,
      start,
      end,
      particularValue: Number(newSession.particularValue) || 0,
      insuranceValue: Number(newSession.insuranceValue) || 0,
      baseValue: (Number(newSession.particularValue) || 0) + (Number(newSession.insuranceValue) || 0)
    };
    onAddAppointment?.(appt);
    setShowAddModal(false);
    setNewSession({ 
      ...newSession, 
      professionalId: isAdmin ? '' : currentUser.id, 
      particularValue: '', 
      insuranceValue: '' 
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-4xl font-bold text-brand-navy">Bienvenido, {firstName}</h1>
          <p className="text-brand-teal font-medium mt-2">Gestión del centro de rehabilitación interdisciplinario.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-brand-coral px-8 py-3 rounded-2xl text-sm font-bold text-white shadow-xl shadow-brand-coral/20 hover:scale-[1.02] transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Agregar Sesión
        </button>
      </div>

      {birthdaysToday.length > 0 && (
        <div className="bg-brand-coral/10 border-2 border-brand-coral/20 p-8 rounded-[40px] flex items-center justify-between gap-6 animate-pulse-subtle">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-brand-coral text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-brand-coral/30">
                <Cake size={32} />
              </div>
              <div>
                <h4 className="text-brand-coral font-black uppercase text-xs tracking-[0.3em] mb-1">¡Hoy es un día especial!</h4>
                <p className="text-lg font-display font-bold text-brand-navy">Tenemos celebraciones en el equipo Guidari</p>
                <div className="flex flex-wrap gap-3 mt-4">
                   {birthdaysToday.map((b, idx) => (
                     <div key={idx} className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-brand-coral/10 shadow-sm">
                        <img src={b.avatar || `https://picsum.photos/seed/${b.name}/100`} className="w-8 h-8 rounded-xl object-cover" alt="" />
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-brand-navy">{b.name}</span>
                           <span className="text-[9px] font-black uppercase text-brand-teal/60 tracking-tighter">{b.type}</span>
                        </div>
                        <PartyPopper size={14} className="text-brand-coral ml-1" />
                     </div>
                   ))}
                </div>
              </div>
           </div>
        </div>
      )}

      {isAdmin && missingDocsData.length > 0 && (
        <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[32px] flex items-start gap-4">
           <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg">
             <AlertTriangle size={24} />
           </div>
           <div>
             <h4 className="text-red-600 font-black uppercase text-xs tracking-widest mb-1">Alerta de Documentación Mensual</h4>
             <p className="text-sm text-red-700 font-medium">Se detectó falta de documentación obligatoria en {missingDocsData.length} pacientes:</p>
             <div className="flex flex-wrap gap-2 mt-3">
               {missingDocsData.slice(0, 5).map(item => (
                 <span key={item.patient.id} className="bg-white px-3 py-1.5 rounded-xl text-[10px] font-bold text-red-600 border border-red-200 flex flex-col">
                   <span>{item.patient.firstName} {item.patient.lastName}</span>
                   <span className="text-[8px] opacity-60 uppercase">Falta: {item.missing.join(" y ")}</span>
                 </span>
               ))}
               {missingDocsData.length > 5 && <span className="text-[10px] text-red-400 font-bold self-center">y {missingDocsData.length - 5} más...</span>}
             </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-[32px] shadow-sm border border-brand-sage/50 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-4 rounded-2xl bg-brand-teal text-white"><Users size={22} /></div>
          </div>
          <div className="mt-6">
            <p className="text-brand-navy/50 text-xs font-bold uppercase tracking-widest mb-1">Pacientes Activos</p>
            <h3 className="text-3xl font-black text-brand-navy">{isAdmin ? patients.length : patients.filter(p => p.assignedProfessionals.includes(currentUser.id)).length}</h3>
          </div>
        </div>
        <div className="bg-white p-7 rounded-[32px] shadow-sm border border-brand-sage/50 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-4 rounded-2xl bg-brand-coral text-white"><CheckCircle2 size={22} /></div>
          </div>
          <div className="mt-6">
            <p className="text-brand-navy/50 text-xs font-bold uppercase tracking-widest mb-1">Tasa de Asistencia</p>
            <h3 className="text-3xl font-black text-brand-navy">94%</h3>
          </div>
        </div>
        <div className="bg-white p-7 rounded-[32px] shadow-sm border border-brand-sage/50 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-4 rounded-2xl bg-brand-navy text-white"><Timer size={22} /></div>
          </div>
          <div className="mt-6">
            <p className="text-brand-navy/50 text-xs font-bold uppercase tracking-widest mb-1">Sesiones del Mes</p>
            <h3 className="text-3xl font-black text-brand-navy">{currentMonthSessions}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12 bg-white p-8 rounded-[48px] shadow-sm border border-brand-sage/50">
          <div className="flex justify-between items-center mb-8">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-brand-beige rounded-xl flex items-center justify-center text-brand-coral"><Clock size={20} /></div>
               <h3 className="text-xl font-bold text-brand-navy">Próximas Sesiones de Hoy</h3>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayAppointments.length > 0 ? todayAppointments.sort((a,b) => a.start.localeCompare(b.start)).map((appt) => {
              const p = patients.find(pat => pat.id === appt.patientId);
              const pro = professionals.find(pr => pr.id === appt.professionalId);
              const startTime = new Date(appt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={appt.id} className="flex items-center gap-4 p-5 bg-brand-beige/20 hover:bg-brand-beige rounded-3xl transition-all border border-brand-sage/30">
                  <img src={p?.avatar || `https://picsum.photos/seed/${appt.id}/100`} className="w-10 h-10 rounded-xl object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-brand-navy truncate">{p?.firstName} {p?.lastName}</p>
                    <p className="text-[10px] font-black text-brand-teal uppercase tracking-widest">{pro?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-brand-navy">{startTime}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full py-20 text-center text-brand-navy/20">
                <Clock size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">No hay sesiones registradas para hoy.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-navy/30 backdrop-blur-md p-6">
          <div className="bg-brand-beige w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="p-8 border-b border-brand-sage flex justify-between items-center bg-white/50">
                <h3 className="text-2xl font-display font-bold text-brand-navy">Agendar Nueva Sesión</h3>
                <button onClick={() => setShowAddModal(false)} className="text-brand-navy/30 hover:text-brand-coral transition-colors"><X size={24} /></button>
             </div>
             <div className="p-10 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-2">Paciente</label>
                   <select className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-medium" value={newSession.patientId} onChange={e => setNewSession({...newSession, patientId: e.target.value})}>
                     <option value="">Seleccione Paciente</option>
                     {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                   </select>
                </div>
                {isAdmin && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-2">Profesional</label>
                    <select className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-medium" value={newSession.professionalId} onChange={e => setNewSession({...newSession, professionalId: e.target.value})}>
                      <option value="">Seleccione Profesional</option>
                      {professionals.map(pro => <option key={pro.id} value={pro.id}>{pro.name} ({pro.specialty})</option>)}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-sage/50">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-coral uppercase tracking-widest ml-2">Particular ($)</label>
                    <input type="number" placeholder="Monto" className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-bold" value={newSession.particularValue} onChange={e => setNewSession({...newSession, particularValue: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-2">Obra Social ($)</label>
                    <input type="number" placeholder="Monto" className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-bold" value={newSession.insuranceValue} onChange={e => setNewSession({...newSession, insuranceValue: e.target.value})} />
                  </div>
                </div>
             </div>
             <div className="p-8 bg-white/80 border-t border-brand-sage flex justify-end gap-4">
                <button onClick={() => setShowAddModal(false)} className="px-6 py-3 rounded-2xl font-bold text-brand-navy/40 hover:text-brand-coral transition-colors">Cancelar</button>
                <button onClick={handleCreateSession} className="bg-brand-navy text-white px-10 py-3 rounded-2xl font-bold shadow-xl shadow-brand-navy/20 hover:scale-[1.02] transition-all">Confirmar Turno</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
