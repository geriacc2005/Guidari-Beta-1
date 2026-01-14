
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

  // Carga inicial de datos desde Supabase
  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [
        { data: usersData },
        { data: patientsData },
        { data: appointmentsData }
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('patients').select('*'),
        supabase.from('appointments').select('*')
      ]);

      if (usersData && usersData.length > 0) setProfessionals(usersData as User[]);
      if (patientsData) setPatients(patientsData as Patient[]);
      if (appointmentsData) setAppointments(appointmentsData as Appointment[]);
      
      addLog('Sistema', 'success', 'Datos sincronizados desde la nube.');
    } catch (error) {
      addLog('Sistema', 'error', 'Error al cargar datos de la nube.');
      console.error('Fetch error:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sincronización automática de fondo
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        fetchData(); // Sync Pull
      }, 10 * 60 * 1000); // Cada 10 min
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchData]);

  const addLog = (action: string, status: 'success' | 'error', message: string) => {
    const newLog: SupabaseLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      action,
      status,
      message
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const saveToSupabase = async (table: string, data: any) => {
    try {
      const { error } = await supabase.from(table).upsert(data);
      if (error) throw error;
      addLog(`Guardado ${table}`, 'success', 'Cambios persistidos en Supabase.');
    } catch (error) {
      addLog(`Error ${table}`, 'error', 'Error al guardar en la nube.');
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  const handleUpdatePatients = async (updatedPatients: Patient[]) => {
    setPatients(updatedPatients);
    await saveToSupabase('patients', updatedPatients);
  };

  const handleUpdateProfessionals = async (updatedPros: User[]) => {
    setProfessionals(updatedPros);
    await saveToSupabase('users', updatedPros);
  };

  const handleUpdateAppointments = async (updatedAppts: Appointment[]) => {
    setAppointments(updatedAppts);
    await saveToSupabase('appointments', updatedAppts);
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.PROFESSIONAL] },
    { id: 'patients', label: 'Pacientes', icon: Users, roles: [UserRole.ADMIN, UserRole.PROFESSIONAL] },
    { id: 'calendar', label: 'Agenda', icon: Calendar, roles: [UserRole.ADMIN, UserRole.PROFESSIONAL] },
    { id: 'documents', label: 'Documentos', icon: FileText, roles: [UserRole.ADMIN, UserRole.PROFESSIONAL] },
    { id: 'professionals', label: 'Profesionales', icon: Stethoscope, roles: [UserRole.ADMIN] }, 
    { id: 'finances', label: 'Finanzas', icon: Wallet, roles: [UserRole.ADMIN] },
    { id: 'settings', label: 'Configuración', icon: Settings, roles: [UserRole.ADMIN, UserRole.PROFESSIONAL] },
  ];

  if (isLoadingData && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-beige flex flex-col items-center justify-center gap-6">
        <div className="w-32 h-32 loading-pulse">
           <img src="https://zugbripyvaidkpesrvaa.supabase.co/storage/v1/object/sign/Imagenes/Guidari%20sin%20fondo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kMmViNTc1OC0yY2UyLTRkODgtOGQ5MC1jZWFiYTM1MjY1Y2IiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZW5lcy9HdWlkYXJpIHNpbiBmb25kby5wbmciLCJpYXQiOjE3NjgzNDI2MjIsImV4cCI6MjM5OTA2MjYyMn0.0r_lpPOfT1oMZxTGa4YLu57M5VPrmTT_VJsma7EpoX8" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex items-center gap-3 text-brand-navy">
          <Loader2 className="animate-spin" size={20} />
          <span className="font-display font-bold uppercase tracking-widest text-xs">Sincronizando con Guidari Cloud...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Auth onLogin={handleLogin} users={professionals} onRegister={(u) => handleUpdateProfessionals([...professionals, u])} />;
  }

  const filteredSidebarItems = sidebarItems.filter(item => item.roles.includes(currentUser.role));

  const renderContent = () => {
    const currentTabConfig = sidebarItems.find(item => item.id === activeTab);
    if (currentTabConfig && !currentTabConfig.roles.includes(currentUser.role)) {
      setActiveTab('dashboard');
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard patients={patients} appointments={appointments} currentUser={currentUser} professionals={professionals} onAddAppointment={(a) => handleUpdateAppointments([...appointments, a])} />;
      case 'patients':
        return <PatientList patients={patients} professionals={professionals} currentUser={currentUser} onUpdate={handleUpdatePatients} appointments={appointments} />;
      case 'professionals':
        return <ProfessionalsList professionals={professionals} appointments={appointments} patients={patients} currentUser={currentUser} onUpdate={handleUpdateProfessionals} />;
      case 'calendar':
        return <CalendarView appointments={appointments} patients={patients} professionals={professionals} currentUser={currentUser} onUpdate={handleUpdateAppointments} />;
      case 'documents':
        return <DocumentsView patients={patients} onUpdatePatients={handleUpdatePatients} />;
      case 'finances':
        return <FinanceView appointments={appointments} professionals={professionals} patients={patients} onUpdateProfessionals={handleUpdateProfessionals} />;
      case 'settings':
        return (
          <SettingsView 
            users={professionals} 
            onUpdateUsers={handleUpdateProfessionals} 
            currentUser={currentUser} 
            patients={patients}
            appointments={appointments}
            onImportData={(data) => {
               if(data.patients) handleUpdatePatients(data.patients);
               if(data.users) handleUpdateProfessionals(data.users);
               if(data.appointments) handleUpdateAppointments(data.appointments);
            }}
            logs={logs}
            addLog={addLog}
            onUpdateCurrentUser={setCurrentUser}
          />
        );
      default:
        return <Dashboard patients={patients} appointments={appointments} currentUser={currentUser} professionals={professionals} onAddAppointment={(a) => handleUpdateAppointments([...appointments, a])} />;
    }
  };

  const logoUrl = "https://zugbripyvaidkpesrvaa.supabase.co/storage/v1/object/sign/Imagenes/Guidari%20sin%20fondo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kMmViNTc1OC0yY2UyLTRkODgtOGQ5MC1jZWFiYTM1MjY1Y2IiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZW5lcy9HdWlkYXJpIHNpbiBmb25kby5wbmciLCJpYXQiOjE3NjgzNDI2MjIsImV4cCI6MjM5OTA2MjYyMn0.0r_lpPOfT1oMZxTGa4YLu57M5VPrmTT_VJsma7EpoX8";

  return (
    <div className="flex min-h-screen font-sans text-brand-navy">
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-24'} bg-white border-r border-brand-sage flex flex-col transition-all duration-300 z-50 shadow-sm`}>
        <div className="p-8 flex flex-col items-center">
          <div className={`${isSidebarOpen ? 'w-52 h-52' : 'w-20 h-20'} mb-6 transition-all duration-500 flex items-center justify-center`}>
             <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
          </div>
          {isSidebarOpen && (
            <div className="text-center">
              <p className="text-[11px] text-brand-teal uppercase tracking-[0.2em] font-black">Espacio Interdisciplinario</p>
              <p className="text-[10px] text-brand-navy/60 uppercase tracking-[0.15em] font-black mt-1.5">Centro Guidari</p>
            </div>
          )}
        </div>
        <nav className="flex-1 px-5 py-4 space-y-2">
          {filteredSidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-[24px] transition-all duration-300 ${
                activeTab === item.id 
                ? 'bg-brand-navy text-white shadow-xl shadow-brand-navy/30 font-bold scale-[1.02]' 
                : 'text-brand-navy/60 hover:bg-brand-beige hover:text-brand-navy hover:translate-x-1'
              }`}
            >
              <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              {isSidebarOpen && <span className="text-sm tracking-tight">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-brand-beige">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-3 text-brand-navy/40 hover:text-brand-coral transition-colors rounded-2xl">
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-bold">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-brand-beige/50 relative">
        <header className="h-24 bg-transparent flex items-center justify-end px-10 relative z-10">
          <div className="flex items-center gap-4 pl-6 border-l border-brand-sage/50">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-brand-navy leading-none">{currentUser.name}</p>
              <p className="text-[9px] text-brand-teal uppercase font-black tracking-widest mt-1.5">{currentUser.role === UserRole.ADMIN ? 'ADMINISTRADOR' : currentUser.specialty}</p>
            </div>
            <img src={currentUser.avatar} alt="Avatar" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white shadow-md border border-brand-sage/30" />
          </div>
        </header>
        <section className="flex-1 overflow-y-auto custom-scrollbar px-10 pb-10 relative z-10">
          {renderContent()}
        </section>
      </main>
    </div>
  );
};

export default App;
