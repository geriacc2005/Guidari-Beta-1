
import React, { useState, useEffect } from 'react';
import { User, UserRole, Patient, Appointment, SupabaseLog } from '../types';
import { 
  CheckCircle2, AlertTriangle, RefreshCcw, Loader2, Lock, Key, 
  Database, Code, Terminal, Info, Save, UserPen, Camera, EyeOff, Eye, Trash2, Users, Activity, Globe, ShieldAlert
} from 'lucide-react';
import { getSupabaseConfig, updateSupabaseCredentials } from '../utils/supabase';

interface SettingsViewProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  currentUser: User;
  patients: Patient[];
  appointments: Appointment[];
  onImportData: (data: { patients?: Patient[], users?: User[], appointments?: Appointment[] }) => void;
  logs: SupabaseLog[];
  addLog: (action: string, status: 'success' | 'error', message: string) => void;
  onUpdateCurrentUser: (user: User) => void;
  onRefreshData: () => Promise<void>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  users, onUpdateUsers, currentUser, patients, appointments, onImportData, logs, addLog, onUpdateCurrentUser, onRefreshData
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'perfil' | 'usuarios' | 'supabase'>('perfil');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
  // Supabase Credentials State
  const currentConfig = getSupabaseConfig();
  const [sbUrl, setSbUrl] = useState(currentConfig.url);
  const [sbKey, setSbKey] = useState(currentConfig.key);

  // Notification system
  const [notification, setNotification] = useState<{ show: boolean, msg: string, type: 'success' | 'error' }>({
    show: false,
    msg: '',
    type: 'success'
  });
  
  // PIN Protection for Cloud Tab
  const [cloudPin, setCloudPin] = useState('');
  const [isCloudUnlocked, setIsCloudUnlocked] = useState(false);
  const CLOUD_ACCESS_PIN = "666967";

  const [editFirstName, setEditFirstName] = useState(currentUser.firstName || '');
  const [editLastName, setEditLastName] = useState(currentUser.lastName || '');
  const [editSpecialty, setEditSpecialty] = useState(currentUser.specialty || '');
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar || '');
  const [myPin, setMyPin] = useState(currentUser.pin || '');
  const [myPassword, setMyPassword] = useState(currentUser.password || '');

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const triggerNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, msg, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const handleUpdateProfile = () => {
    if (myPin && (myPin.length < 4 || myPin.length > 6)) {
      alert('El PIN debe tener entre 4 y 6 números.');
      return;
    }

    const updatedUser: User = {
      ...currentUser,
      firstName: editFirstName,
      lastName: editLastName,
      name: `${editFirstName} ${editLastName}`,
      specialty: editSpecialty,
      avatar: editAvatar,
      pin: myPin,
      password: myPassword
    };

    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    onUpdateUsers(updatedUsers);
    onUpdateCurrentUser(updatedUser);
    
    addLog('Perfil', 'success', 'Información de perfil actualizada correctamente.');
    triggerNotification('Perfil actualizado correctamente', 'success');
  };

  const handleSyncDatabase = async () => {
    setSyncStatus('syncing');
    addLog('Nube', 'success', 'Sincronización manual iniciada por administrador.');
    try {
      await onRefreshData();
      setSyncStatus('success');
      triggerNotification('Datos sincronizados con éxito', 'success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err: any) {
      setSyncStatus('error');
      addLog('Nube', 'error', `Fallo de sincronización: ${err.message}`);
      triggerNotification('Error de conexión con la nube', 'error');
      setTimeout(() => setSyncStatus('idle'), 4000);
    }
  };

  const handleUpdateNetworkConfig = () => {
    if (!sbUrl || !sbKey) {
      alert('Debe completar ambos campos de credenciales.');
      return;
    }
    if (window.confirm('¿Desea actualizar las credenciales de Supabase? La aplicación se reiniciará para aplicar los cambios.')) {
      updateSupabaseCredentials(sbUrl, sbKey);
    }
  };

  const handleUnlockCloud = () => {
    if (cloudPin === CLOUD_ACCESS_PIN) {
      setIsCloudUnlocked(true);
      addLog('Nube', 'success', 'Acceso a configuración avanzada desbloqueado.');
    } else {
      alert('PIN de acceso denegado.');
      setCloudPin('');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Toast Notification */}
      {notification.show && (
        <div className={`fixed top-24 right-10 px-8 py-5 rounded-[32px] border shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-500 z-[200] ${
          notification.type === 'success' 
          ? 'bg-brand-mint text-brand-teal border-brand-teal/20' 
          : 'bg-red-50 text-red-600 border-red-200'
        }`}>
           <div className="bg-white p-2 rounded-full shadow-sm">
             {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
           </div>
           <span className="text-xs font-black uppercase tracking-widest">{notification.msg}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-brand-navy">Configuración</h2>
          <p className="text-sm text-brand-teal font-medium">Gestión administrativa y staff del centro</p>
        </div>
      </div>

      <div className="flex gap-4 bg-white p-2 rounded-3xl border border-brand-sage shadow-sm w-fit">
        <button onClick={() => setActiveSubTab('perfil')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'perfil' ? 'bg-brand-navy text-white shadow-lg' : 'text-brand-teal/40'}`}>Mi Perfil</button>
        {isAdmin && (
          <>
            <button onClick={() => setActiveSubTab('usuarios')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'usuarios' ? 'bg-brand-navy text-white shadow-lg' : 'text-brand-teal/40'}`}>Usuarios</button>
            <button onClick={() => setActiveSubTab('supabase')} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'supabase' ? 'bg-brand-navy text-white shadow-lg' : 'text-brand-teal/40'}`}>Nube</button>
          </>
        )}
      </div>

      {activeSubTab === 'perfil' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="lg:col-span-1 bg-white p-10 rounded-[48px] border border-brand-sage shadow-sm text-center flex flex-col justify-between hover:shadow-xl transition-shadow">
              <div>
                <div className="relative inline-block mb-10 group cursor-pointer">
                   <img src={editAvatar || currentUser.avatar} className="w-48 h-48 rounded-[64px] object-cover mx-auto ring-8 ring-brand-beige shadow-2xl transition-all" />
                   <div className="absolute -bottom-2 -right-2 bg-brand-coral text-white p-5 rounded-[24px] border-4 border-white shadow-xl hover:rotate-12 transition-transform">
                      <Camera size={24} />
                   </div>
                </div>
                <h3 className="text-3xl font-display font-bold text-brand-navy">{editFirstName} {editLastName}</h3>
                <p className="text-[11px] text-brand-teal font-black uppercase tracking-[0.3em] mt-3">{isAdmin ? 'Administrador' : editSpecialty}</p>
              </div>
           </div>

           <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-brand-sage shadow-sm space-y-12">
              <div className="flex items-center gap-4">
                  <div className="p-4 bg-brand-coral/10 text-brand-coral rounded-3xl shadow-sm"><UserPen size={28} /></div>
                  <h3 className="font-display text-2xl font-bold text-brand-navy">Datos Personales</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-brand-teal uppercase tracking-[0.2em] ml-2">Nombres</label>
                      <input type="text" className="w-full bg-brand-beige/40 border border-brand-sage rounded-[24px] p-5 text-sm font-bold outline-none" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-brand-teal uppercase tracking-[0.2em] ml-2">Apellidos</label>
                      <input type="text" className="w-full bg-brand-beige/40 border border-brand-sage rounded-[24px] p-5 text-sm font-bold outline-none" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
                  </div>
              </div>

              <div className="pt-10 flex justify-end">
                  <button onClick={handleUpdateProfile} className="bg-brand-navy text-white px-16 py-6 rounded-[32px] font-bold shadow-xl hover:scale-[1.02] transition-all flex items-center gap-4 text-sm"><Save size={22} /> Guardar Cambios</button>
              </div>
           </div>
        </div>
      )}

      {activeSubTab === 'supabase' && isAdmin && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
           {/* Nueva sección: Configuración de Credenciales */}
           <div className="bg-white p-10 rounded-[48px] border border-brand-sage shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                  <div className="p-4 bg-brand-navy/10 text-brand-navy rounded-3xl shadow-sm"><Globe size={28} /></div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-brand-navy">Configuración de Red</h3>
                    <p className="text-xs text-brand-teal font-medium">Credenciales de conexión para Guidari Cloud</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-brand-teal uppercase tracking-[0.2em] ml-2">Supabase Project URL</label>
                      <input 
                        type="text" 
                        placeholder="https://su-proyecto.supabase.co"
                        className="w-full bg-brand-beige/40 border border-brand-sage rounded-[24px] p-5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-coral/20" 
                        value={sbUrl} 
                        onChange={(e) => setSbUrl(e.target.value)} 
                      />
                  </div>
                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-brand-teal uppercase tracking-[0.2em] ml-2">Supabase Anonymous Key</label>
                      <input 
                        type="password" 
                        placeholder="Su clave pública anon"
                        className="w-full bg-brand-beige/40 border border-brand-sage rounded-[24px] p-5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-coral/20 font-mono" 
                        value={sbKey} 
                        onChange={(e) => setSbKey(e.target.value)} 
                      />
                  </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={handleUpdateNetworkConfig} 
                  className="bg-brand-coral text-white px-12 py-5 rounded-[32px] font-bold shadow-xl hover:scale-[1.02] transition-all flex items-center gap-4 text-sm"
                >
                  <Save size={22} /> Guardar Configuración de Red
                </button>
              </div>
           </div>

           {/* Botón de Sincronización Real */}
           <div className="bg-white p-8 rounded-[40px] border border-brand-sage shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-3xl shadow-sm transition-colors ${
                    syncStatus === 'success' ? 'bg-green-100 text-green-600' :
                    syncStatus === 'error' ? 'bg-red-100 text-red-600' :
                    'bg-brand-mint text-brand-teal'
                  }`}>
                    <RefreshCcw size={24} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                  </div>
                  <div>
                      <h4 className="text-lg font-bold text-brand-navy">Estado de Sincronización</h4>
                      <p className="text-xs text-brand-teal font-medium">Refrescar datos locales desde Guidari Cloud</p>
                  </div>
              </div>
              <button 
                onClick={handleSyncDatabase} 
                disabled={syncStatus === 'syncing'} 
                className={`px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all ${
                  syncStatus === 'syncing' ? 'bg-brand-coral/50 opacity-50 cursor-not-allowed text-white' :
                  syncStatus === 'success' ? 'bg-green-500 text-white' :
                  syncStatus === 'error' ? 'bg-red-500 text-white' :
                  'bg-brand-navy text-white hover:scale-[1.02]'
                }`}
              >
                 {syncStatus === 'syncing' ? <Loader2 className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
                 {syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar Ahora'}
              </button>
           </div>

           {/* Log de Sincronización Visible */}
           <div className="bg-white p-10 rounded-[48px] border border-brand-sage shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-brand-teal/10 text-brand-teal rounded-xl"><Activity size={20} /></div>
                 <h3 className="text-xs font-black text-brand-navy uppercase tracking-widest">Historial de Operaciones Cloud</h3>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-4">
                 {logs.filter(l => l.action === 'Sincronización' || l.action === 'Nube' || l.action.startsWith('Guardado')).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-brand-beige/30 rounded-2xl border border-brand-sage/20">
                       <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                          <div>
                             <p className="text-[10px] font-black text-brand-navy uppercase tracking-tighter">{log.action}</p>
                             <p className="text-xs font-medium text-brand-teal/70">{log.message}</p>
                          </div>
                       </div>
                       <span className="text-[10px] font-bold text-brand-navy/30">{log.timestamp}</span>
                    </div>
                 ))}
                 {logs.length === 0 && (
                   <p className="text-center py-10 text-xs font-bold text-brand-teal/30 uppercase tracking-widest">Sin registros de red recientes</p>
                 )}
              </div>
           </div>

           {/* Protección para Esquema SQL */}
           {!isCloudUnlocked ? (
              <div className="bg-white p-12 rounded-[56px] border border-brand-sage shadow-xl text-center space-y-8">
                  <div className="w-20 h-20 bg-brand-coral/10 text-brand-coral rounded-[32px] flex items-center justify-center mx-auto shadow-sm">
                      <Lock size={40} />
                  </div>
                  <div>
                      <h3 className="text-2xl font-display font-bold text-brand-navy">Configuración Avanzada</h3>
                      <p className="text-sm text-brand-teal/60 font-medium max-w-xs mx-auto">Ingrese el PIN de seguridad de administrador para ver el esquema técnico.</p>
                  </div>
                  <div className="max-w-[240px] mx-auto space-y-4">
                      <input 
                        type="password" 
                        placeholder="••••••" 
                        value={cloudPin}
                        onChange={(e) => setCloudPin(e.target.value)}
                        className="w-full bg-brand-beige border border-brand-sage rounded-2xl py-4 text-center text-2xl font-black tracking-[0.5em] focus:ring-4 focus:ring-brand-coral/10 outline-none transition-all"
                      />
                      <button 
                        onClick={handleUnlockCloud}
                        className="w-full bg-brand-coral text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
                      >
                         <Key size={18} /> Desbloquear
                      </button>
                  </div>
              </div>
           ) : (
              <div className="bg-brand-navy p-12 rounded-[56px] shadow-2xl relative overflow-hidden group animate-in zoom-in duration-500">
                <div className="relative z-10 space-y-8 text-white">
                    <div className="flex justify-between items-center">
                      <div>
                         <h3 className="text-2xl font-display font-bold">Arquitectura Guidari Cloud</h3>
                         <p className="text-brand-mint text-sm mt-1 opacity-80">PostgreSQL Engine v15.4</p>
                      </div>
                      <button onClick={() => setIsCloudUnlocked(false)} className="text-white/40 hover:text-white transition-colors">
                          <Lock size={20} />
                      </button>
                    </div>
                    
                    <div className="bg-black/40 rounded-[40px] p-8 border border-white/5 font-mono text-[11px] text-brand-mint/80 overflow-x-auto max-h-[300px] shadow-inner">
                       <pre><code>{`CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('ADMIN', 'PROFESSIONAL')),
    specialty TEXT,
    session_value DECIMAL(12,2)
);`}</code></pre>
                    </div>
                </div>
              </div>
           )}
        </div>
      )}
    </div>
  );
};

export default SettingsView;
