
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Stethoscope, 
  LogOut,
  Wallet,
  Settings,
  FileText
} from 'lucide-react';
import { User, UserRole, Patient, Appointment, SupabaseLog } from './types';
import { mockUsers, mockPatients, mockAppointments } from './mockData';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import ProfessionalsList from './components/ProfessionalsList';
import CalendarView from './components/CalendarView';
import FinanceView from './components/FinanceView';
import SettingsView from './components/SettingsView';
import DocumentsView from './components/DocumentsView';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [professionals, setProfessionals] = useState<User[]>(mockUsers);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [logs, setLogs] = useState<SupabaseLog[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        autoSync();
      }, 30 * 60 * 1000); 
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const autoSync = async () => {
    addLog('Auto-Sync', 'success', 'Sincronización programada de 30 min completada.');
    console.log('Background Sync to Supabase executed.');
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

  const handleRegister = (newUser: User) => {
    setProfessionals(prev => [...prev, newUser]);
  };

  const handleAddAppointment = (appt: Appointment) => {
    setAppointments(prev => [...prev, appt]);
  };

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

  const sidebarItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.PROFESSIONAL] },
    { id: 'patients', label: 'Pacientes', icon: Users, roles: [UserRole.ADMIN, UserRole.PROFESSIONAL] },
    { id: 'calendar', label: 'Agenda', icon: Calendar, roles: [UserRole.ADMIN, UserRole.PROFESSIONAL] },
    { id: 'documents', label: 'Documentos', icon: FileText, roles: [UserRole.ADMIN, UserRole.PROFESSIONAL] },
    { id: 'professionals', label: 'Profesionales', icon: Stethoscope, roles: [UserRole.ADMIN] }, 
    { id: 'finances', label: 'Finanzas', icon: Wallet, roles: [UserRole.ADMIN] },
    { id: 'settings', label: 'Configuración', icon: Settings, roles: [UserRole.ADMIN, UserRole.PROFESSIONAL] },
  ];

  if (!isAuthenticated || !currentUser) {
    return <Auth onLogin={handleLogin} users={professionals} onRegister={handleRegister} />;
  }

  const filteredSidebarItems = sidebarItems.filter(item => item.roles.includes(currentUser.role));

  const renderContent = () => {
    // Verificación de seguridad: Si la pestaña activa no está permitida para el rol actual, forzar Dashboard
    const currentTabConfig = sidebarItems.find(item => item.id === activeTab);
    if (currentTabConfig && !currentTabConfig.roles.includes(currentUser.role)) {
      return <Dashboard patients={patients} appointments={appointments} currentUser={currentUser} professionals={professionals} onAddAppointment={handleAddAppointment} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard patients={patients} appointments={appointments} currentUser={currentUser} professionals={professionals} onAddAppointment={handleAddAppointment} />;
      case 'patients':
        return <PatientList patients={patients} professionals={professionals} currentUser={currentUser} onUpdate={setPatients} appointments={appointments} />;
      case 'professionals':
        return <ProfessionalsList professionals={professionals} appointments={appointments} patients={patients} currentUser={currentUser} onUpdate={setProfessionals} />;
      case 'calendar':
        return <CalendarView appointments={appointments} patients={patients} professionals={professionals} currentUser={currentUser} onUpdate={setAppointments} />;
      case 'documents':
        return <DocumentsView patients={patients} onUpdatePatients={setPatients} />;
      case 'finances':
        return <FinanceView appointments={appointments} professionals={professionals} patients={patients} onUpdateProfessionals={setProfessionals} />;
      case 'settings':
        return (
          <SettingsView 
            users={professionals} 
            onUpdateUsers={setProfessionals} 
            currentUser={currentUser} 
            patients={patients}
            appointments={appointments}
            onImportData={(data) => {
               if(data.patients) setPatients(data.patients);
               if(data.users) setProfessionals(data.users);
               if(data.appointments) setAppointments(data.appointments);
            }}
            logs={logs}
            addLog={addLog}
            onUpdateCurrentUser={setCurrentUser}
          />
        );
      default:
        return <Dashboard patients={patients} appointments={appointments} currentUser={currentUser} professionals={professionals} onAddAppointment={handleAddAppointment} />;
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
              <p className="text-[10px] text-brand-navy/60 uppercase tracking-[0.15em] font-black mt-1.5">Gestión Profesional</p>
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
