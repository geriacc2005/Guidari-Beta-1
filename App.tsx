
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Stethoscope, 
  LogOut,
  Wallet,
  Settings,
  FileText,
  Loader2
} from 'lucide-react';
import { User, UserRole, Patient, Appointment, SupabaseLog } from './types';
import { mockUsers } from './mockData';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import ProfessionalsList from './components/ProfessionalsList';
import CalendarView from './components/CalendarView';
import FinanceView from './components/FinanceView';
import SettingsView from './components/SettingsView';
import DocumentsView from './components/DocumentsView';
import Auth from './components/Auth';
import { supabase } from './utils/supabase';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<User[]>(mockUsers);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [logs, setLogs] = useState<SupabaseLog[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const addLog = useCallback((action: string, status: 'success' | 'error', message: any) => {
    let displayMessage = '';
    if (message && typeof message === 'object') {
      const errorData = message.error || message;
      displayMessage = errorData.message || JSON.stringify(errorData);
    } else {
      displayMessage = String(message || 'Operación finalizada');
    }
    const newLog: SupabaseLog = {
      id: generateUUID(),
      timestamp: new Date().toLocaleTimeString(),
      action,
      status,
      message: displayMessage
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  const mapUserFromSupabase = (u: any): User => ({
    id: u.id,
    email: u.email,
    password: u.password,
    pin: u.pin,
    firstName: u.first_name || '',
    lastName: u.last_name || '',
    name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
    role: u.role as UserRole,
    avatar: u.avatar || '',
    specialty: u.specialty || '',
    sessionValue: Number(u.session_value || 0),
    commissionRate: Number(u.commission_rate || 0),
    dob: u.dob || ''
  });

  const mapUserToSupabase = (u: User) => ({
    id: u.id,
    email: u.email,
    password: u.password,
    pin: u.pin,
    first_name: u.firstName,
    last_name: u.lastName,
    name: u.name,
    role: u.role,
    avatar: u.avatar,
    specialty: u.specialty,
    session_value: u.sessionValue,
    commission_rate: u.commissionRate,
    dob: u.dob && u.dob !== "" ? u.dob : null
  });

  const mapPatientFromSupabase = (p: any): Patient => ({
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    dateOfBirth: p.date_of_birth || '',
    diagnosis: p.diagnosis || '',
    insurance: p.insurance || 'Particular',
    avatar: p.avatar || '',
    affiliateNumber: p.affiliate_number || '',
    school: p.school || '',
    supportTeacher: p.support_teacher || { name: '', phone: '', email: '' },
    therapeuticCompanion: p.therapeutic_companion || { name: '', phone: '', email: '' },
    responsible: p.responsible || { name: '', address: '', phone: '', email: '' },
    assignedProfessionals: Array.isArray(p.assigned_professionals) ? p.assigned_professionals : [],
    clinicalHistory: Array.isArray(p.clinical_history) ? p.clinical_history : [],
    documents: Array.isArray(p.documents) ? p.documents : []
  });

  const mapPatientToSupabase = (p: Patient) => ({
    id: p.id,
    first_name: p.firstName,
    last_name: p.lastName,
    date_of_birth: p.dateOfBirth && p.dateOfBirth !== "" ? p.dateOfBirth : null,
    diagnosis: p.diagnosis,
    insurance: p.insurance,
    avatar: p.avatar,
    affiliate_number: p.affiliateNumber,
    school: p.school,
    support_teacher: p.supportTeacher,
    therapeutic_companion: p.therapeuticCompanion,
    responsible: p.responsible,
    assigned_professionals: (p.assignedProfessionals || []).filter(isUUID),
    clinical_history: p.clinicalHistory,
    documents: p.documents
  });

  const mapAppointmentFromSupabase = (a: any): Appointment => ({
    id: a.id,
    patientId: a.patient_id,
    professionalId: a.professional_id,
    start: a.start,
    end: a.end,
    particularValue: Number(a.particular_value || 0),
    insuranceValue: Number(a.insurance_value || 0),
    baseValue: Number(a.base_value || 0)
  });

  const mapAppointmentToSupabase = (a: Appointment) => ({
    id: a.id,
    patient_id: a.patientId,
    professional_id: a.professionalId,
    start: a.start,
    end: a.end,
    particular_value: a.particularValue,
    insurance_value: a.insuranceValue,
    base_value: a.baseValue
  });

  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [{ data: uData }, { data: pData }, { data: aData }] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('patients').select('*'),
        supabase.from('appointments').select('*')
      ]);
      if (uData) {
        const cloudUsers = uData.map(mapUserFromSupabase);
        const merged = [...mockUsers];
        cloudUsers.forEach(cu => {
          const idx = merged.findIndex(mu => mu.id === cu.id);
          if (idx !== -1) merged[idx] = cu;
          else merged.push(cu);
        });
        setProfessionals(merged);
      }
      if (pData) setPatients(pData.map(mapPatientFromSupabase));
      if (aData) setAppointments(aData.map(mapAppointmentFromSupabase));
    } catch (err) {
      addLog('Sistema', 'error', 'Fallo al conectar con la base de datos');
    } finally {
      setIsLoadingData(false);
    }
  }, [addLog]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveToSupabase = async (table: string, data: any) => {
    try {
      let payload;
      if (table === 'users') payload = Array.isArray(data) ? data.map(mapUserToSupabase) : mapUserToSupabase(data);
      else if (table === 'patients') payload = (Array.isArray(data) ? data : [data]).filter(p => isUUID(p.id)).map(mapPatientToSupabase);
      else if (table === 'appointments') payload = (Array.isArray(data) ? data : [data]).filter(a => isUUID(a.id)).map(mapAppointmentToSupabase);
      
      if (!payload || (Array.isArray(payload) && payload.length === 0)) return;
      const { error } = await supabase.from(table).upsert(payload);
      if (!error) addLog(`Guardado ${table}`, 'success', 'Sincronizado');
    } catch (err: any) { addLog(`Sync ${table}`, 'error', err.message); }
  };

  const deleteFromSupabase = async (table: string, id: string) => {
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) {
        addLog(`Eliminado ${table}`, 'success', `Registro ${id} removido`);
        if (table === 'patients') setPatients(prev => prev.filter(p => p.id !== id));
        if (table === 'appointments') setAppointments(prev => prev.filter(a => a.id !== id));
        if (table === 'users') setProfessionals(prev => prev.filter(u => u.id !== id));
      } else {
        addLog(`Error eliminando ${table}`, 'error', error);
      }
    } catch (err: any) { addLog(`Delete ${table}`, 'error', err.message); }
  };

  const handleUpdatePatients = async (updated: Patient[]) => {
    setPatients(updated);
    await saveToSupabase('patients', updated);
  };

  const handleUpdateProfessionals = async (updated: User[]) => {
    setProfessionals(updated);
    await saveToSupabase('users', updated);
  };

  const handleUpdateAppointments = async (updated: Appointment[]) => {
    setAppointments(updated);
    await saveToSupabase('appointments', updated);
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.PROFESSIONAL] },
    { id: 'patients', label: 'Pacientes', icon: Users, roles: [UserRole.ADMIN, UserRole.PROFESSIONAL] },
    { id: 'calendar', label: 'Agenda', icon: Calendar, roles: [UserRole.ADMIN, UserRole.PROFESSIONAL] },
    { id: 'documents', label: 'Documentos', icon: FileText, roles: [UserRole.ADMIN, UserRole.PROFESSIONAL] },
    { id: 'professionals', label: 'Staff', icon: Stethoscope, roles: [UserRole.ADMIN] }, 
    { id: 'finances', label: 'Finanzas', icon: Wallet, roles: [UserRole.ADMIN] },
    { id: 'settings', label: 'Configuración', icon: Settings, roles: [UserRole.ADMIN, UserRole.PROFESSIONAL] },
  ];

  if (isLoadingData && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-beige flex flex-col items-center justify-center gap-6">
        <Loader2 className="animate-spin text-brand-navy" size={48} />
        <span className="font-display font-bold uppercase tracking-widest text-xs text-brand-navy">Guidari Cloud Sync...</span>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Auth onLogin={(u) => { setCurrentUser(u); setIsAuthenticated(true); }} users={professionals} onRegister={(u) => handleUpdateProfessionals([...professionals, u])} />;
  }

  const filteredSidebarItems = sidebarItems.filter(item => item.roles.includes(currentUser.role));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard patients={patients} appointments={appointments} currentUser={currentUser} professionals={professionals} onAddAppointment={(a) => handleUpdateAppointments([...appointments, a])} />;
      case 'patients': return <PatientList patients={patients} professionals={professionals} currentUser={currentUser} onUpdate={handleUpdatePatients} appointments={appointments} onDeletePatient={(id) => deleteFromSupabase('patients', id)} />;
      case 'professionals': return <ProfessionalsList professionals={professionals} appointments={appointments} patients={patients} currentUser={currentUser} onUpdate={handleUpdateProfessionals} onDeletePro={(id) => deleteFromSupabase('users', id)} />;
      case 'calendar': return <CalendarView appointments={appointments} patients={patients} professionals={professionals} currentUser={currentUser} onUpdate={handleUpdateAppointments} />;
      case 'documents': return <DocumentsView patients={patients} professionals={professionals} onUpdatePatients={handleUpdatePatients} />;
      case 'finances': return <FinanceView appointments={appointments} professionals={professionals} patients={patients} onUpdateProfessionals={handleUpdateProfessionals} onUpdatePatients={handleUpdatePatients} />;
      case 'settings': return <SettingsView users={professionals} onUpdateUsers={handleUpdateProfessionals} currentUser={currentUser} patients={patients} appointments={appointments} onImportData={(d) => { if(d.patients) handleUpdatePatients(d.patients); if(d.users) handleUpdateProfessionals(d.users); if(d.appointments) handleUpdateAppointments(d.appointments); }} logs={logs} addLog={addLog} onUpdateCurrentUser={setCurrentUser} onRefreshData={fetchData} />;
      default: return <Dashboard patients={patients} appointments={appointments} currentUser={currentUser} professionals={professionals} />;
    }
  };

  return (
    <div className="flex min-h-screen font-sans text-brand-navy">
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-24'} bg-white border-r border-brand-sage flex flex-col transition-all duration-300 z-50 shadow-sm`}>
        <div className="p-8 flex flex-col items-center">
          <div className="w-20 h-20 mb-6"><img src="https://zugbripyvaidkpesrvaa.supabase.co/storage/v1/object/sign/Imagenes/Guidari%20sin%20fondo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kMmViNTc1OC0yY2UyLTRkODgtOGQ5MC1jZWFiYTM1MjY1Y2IiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZW5lcy9HdWlkYXJpIHNpbiBmb25kby5wbmciLCJpYXQiOjE3NjgzNDI2MjIsImV4cCI6MjM5OTA2MjYyMn0.0r_lpPOfT1oMZxTGa4YLu57M5VPrmTT_VJsma7EpoX8" alt="Logo" className="w-full h-full object-contain" /></div>
          {isSidebarOpen && <p className="text-[11px] text-brand-teal uppercase tracking-[0.2em] font-black text-center">Centro Guidari</p>}
        </div>
        <nav className="flex-1 px-5 py-4 space-y-2">
          {filteredSidebarItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-[24px] transition-all duration-300 ${activeTab === item.id ? 'bg-brand-navy text-white shadow-xl shadow-brand-navy/30 font-bold scale-[1.02]' : 'text-brand-navy/60 hover:bg-brand-beige hover:text-brand-navy'}`}>
              <item.icon size={22} /><span className={isSidebarOpen ? 'text-sm' : 'hidden'}>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-brand-beige">
          <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center gap-4 px-5 py-3 text-brand-navy/40 hover:text-brand-coral transition-colors rounded-2xl">
            <LogOut size={20} />{isSidebarOpen && <span className="text-sm font-bold">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-brand-beige/50 relative">
        <header className="h-24 flex items-center justify-end px-10 relative z-10">
          <div className="flex items-center gap-4 pl-6 border-l border-brand-sage/50">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-brand-navy leading-none">{currentUser.name}</p>
              <p className="text-[9px] text-brand-teal uppercase font-black tracking-widest mt-1.5">{currentUser.role === UserRole.ADMIN ? 'ADMIN' : currentUser.specialty}</p>
            </div>
            <img src={currentUser.avatar} alt="Avatar" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white shadow-md" />
          </div>
        </header>
        <section className="flex-1 overflow-y-auto custom-scrollbar px-10 pb-10 relative z-10">{renderContent()}</section>
      </main>
    </div>
  );
};

export default App;
