
import React, { useState, useRef } from 'react';
import { User, UserRole, Patient, Appointment, SupabaseLog } from '../types';
import { 
  CheckCircle2, AlertTriangle, RefreshCcw, Loader2, Lock, Key, 
  Database, Code, Terminal, Info, Save, UserPen, Camera, EyeOff, Eye, Trash2, Users, Activity, Globe, ShieldAlert, Wifi,
  Download, Upload, FileJson, Stethoscope, Mail
} from 'lucide-react';
import { getSupabaseConfig, updateSupabaseCredentials, supabase } from '../utils/supabase';

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
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const fileImportRef = useRef<HTMLInputElement>(null);
  
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
    
    addLog('Perfil', 'success', 'Información de perfil actualizada.');
    triggerNotification('Perfil actualizado correctamente', 'success');
  };

  const handleSyncDatabase = async () => {
    setSyncStatus('syncing');
    addLog('Nube', 'success', 'Sincronización manual iniciada.');
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

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      if (error) throw error;
      setTestStatus('success');
      triggerNotification('Conexión con Supabase establecida', 'success');
    } catch (err: any) {
      setTestStatus('error');
      triggerNotification('Error de conexión: ' + err.message, 'error');
    } finally {
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const handleExportData = () => {
    const backupData = {
      patients,
      users,
      appointments,
      exportedAt: new Date().toISOString(),
      version: "1.0.0"
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `guidari_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addLog('Respaldo', 'success', 'Exportación JSON completada.');
    triggerNotification('Archivo de respaldo descargado', 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.patients || json.users || json.appointments) {
          onImportData(json);
          addLog('Respaldo', 'success', 'Importación JSON exitosa.');
          triggerNotification('Datos importados correctamente', 'success');
        } else {
          throw new Error('Formato de archivo no reconocido');
        }
      } catch (err: any) {
        addLog('Respaldo', 'error', 'Error al importar JSON.');
        triggerNotification('Error al leer el archivo de respaldo', 'error');
      }
    };
    reader.readAsText(file);
    // Limpiar input
    e.target.value = '';
  };

  const handleUpdateNetworkConfig = () => {
    if (!sbUrl || !sbKey) {
      alert('Debe completar ambos campos de credenciales.');
      return;
    }
    triggerNotification('Configuración guardada. Reiniciando...', 'success');
    setTimeout(() => {
      updateSupabaseCredentials(sbUrl, sbKey);
    }, 1500);
  };

  const handleUnlockCloud = () => {
    if (cloudPin === CLOUD_ACCESS_PIN) {
      setIsCloudUnlocked(true);
      addLog('Nube', 'success', 'Acceso avanzado desbloqueado.');
    } else {
      alert('PIN de acceso denegado.');
      setCloudPin('');
    }
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser.id) {
      alert("No puedes eliminar tu propio usuario.");
      return;
    }
    if (window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      const updated = users.filter(u => u.id !== id);
      onUpdateUsers(updated);
      triggerNotification('Usuario eliminado', 'success');
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
          <p className="text-sm text-brand-teal font-medium">Gestión administrativa y personal</p>
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

      {activeSubTab === 'usuarios' && isAdmin && (
        <div className="bg-white p-10 rounded-[48px] border border-brand-sage shadow-sm animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-brand-navy/10 text-brand-navy rounded-3xl shadow-sm"><Users size={28} /></div>
              <div>
                <h3 className="font-display text-2xl font-bold text-brand-navy">Gestión de Usuarios</h3>
                <p className="text-xs text-brand-teal font-medium">Control total del equipo y roles</p>
              </div>
           </div>

           <div className="overflow-x-auto custom-scrollbar">
             <table className="w-full text-left border-collapse">
               <thead className="bg-brand-beige/50 border-b border-brand-sage">
                 <tr>
                   <th className="px-8 py-5 text-[10px] font-black text-brand-teal uppercase tracking-[0.2em]">Usuario</th>
                   <th className="px-8 py-5 text-[10px] font-black text-brand-teal uppercase tracking-[0.2em]">Rol</th>
                   <th className="px-8 py-5 text-[10px] font-black text-brand-teal uppercase tracking-[0.2em]">Especialidad</th>
                   <th className="px-8 py-5 text-[10px] font-black text-brand-teal uppercase tracking-[0.2em]">Contacto</th>
                   <th className="px-8 py-5 text-[10px] font-black text-brand-teal uppercase tracking-[0.2em] text-center">Acciones</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-brand-beige">
                 {users.map(u => (
                   <tr key={u.id} className="hover:bg-brand-mint/5 transition-colors group">
                     <td className="px-8 py-5">
                       <div className="flex items-center gap-4">
                         <img src={u.avatar} className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white shadow-sm" alt="" />
                         <span className="text-sm font-bold text-brand-navy">{u.name}</span>
                       </div>
                     </td>
                     <td className="px-8 py-5">
                       <span className={`text-[9px] font-black px-3 py-1.5 rounded-full ${u.role === UserRole.ADMIN ? 'bg-brand-coral/10 text-brand-coral' : 'bg-brand-navy/10 text-brand-navy'}`}>
                         {u.role}
                       </span>
                     </td>
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                           <Stethoscope size={14} className="text-brand-teal/40" />
                           <span className="text-xs font-medium text-brand-navy">{u.specialty || 'General'}</span>
                        </div>
                     </td>
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                           <Mail size={14} className="text-brand-teal/40" />
                           <span className="text-xs font-medium text-brand-navy truncate max-w-[150px]">{u.email}</span>
                        </div>
                     </td>
                     <td className="px-8 py-5 text-center">
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          className={`p-2 rounded-xl transition-all ${u.id === currentUser.id ? 'opacity-20 cursor-not-allowed' : 'text-brand-teal/40 hover:text-red-500 hover:bg-red-50'}`}
                          title="Eliminar usuario"
                        >
                          <Trash2 size={18} />
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeSubTab === 'supabase' && isAdmin && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
           {/* Configuración de Credenciales */}
           <div className="bg-white p-10 rounded-[48px] border border-brand-sage shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="p-4 bg-brand-navy/10 text-brand-navy rounded-3xl shadow-sm"><Globe size={28} /></div>
                      <div>
                        <h3 className="font-display text-2xl font-bold text-brand-navy">Configuración de Red</h3>
                        <p className="text-xs text-brand-teal font-medium">Credenciales de conexión para Guidari Cloud</p>
                      </div>
                  </div>
                  <button 
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border-2 transition-all ${
                      testStatus === 'success' ? 'bg-green-50 border-green-200 text-green-600' :
                      testStatus === 'error' ? 'bg-red-50 border-red-200 text-red-600' :
                      'bg-white border-brand-sage text-brand-teal hover:border-brand-navy hover:text-brand-navy'
                    }`}
                  >
                    {testStatus === 'testing' ? <Loader2 className="animate-spin" size={14} /> : <Wifi size={14} />}
                    {testStatus === 'testing' ? 'Probando...' : 'Probar Conexión'}
                  </button>
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

           {/* Sincronización Manual */}
           <div className="bg-white p-8 rounded-[40px] border border-brand-sage shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
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
                      <p className="text-xs text-brand-teal font-medium">Actualización forzada de datos locales</p>
                  </div>
              </div>
              <button 
                onClick={handleSyncDatabase} 
                disabled={syncStatus === 'syncing'} 
                className={`w-full sm:w-auto px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all ${
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

           {/* Respaldo Local JSON */}
           <div className="bg-white p-10 rounded-[48px] border border-brand-sage shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                  <div className="p-4 bg-brand-teal/10 text-brand-teal rounded-3xl shadow-sm"><FileJson size={28} /></div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-brand-navy">Respaldo Local</h3>
                    <p className="text-xs text-brand-teal font-medium">Gestione copias de seguridad en su dispositivo (Formato JSON)</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button 
                  onClick={handleExportData}
                  className="bg-brand-beige border-2 border-brand-sage/50 p-8 rounded-[32px] flex flex-col items-center gap-4 hover:bg-brand-mint/10 hover:border-brand-teal transition-all group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-brand-teal group-hover:scale-110 transition-transform">
                    <Download size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-brand-navy">Exportar Datos</p>
                    <p className="text-[10px] text-brand-teal mt-1">Descarga un archivo .json con toda la información</p>
                  </div>
                </button>

                <button 
                  onClick={() => fileImportRef.current?.click()}
                  className="bg-brand-beige border-2 border-brand-sage/50 p-8 rounded-[32px] flex flex-col items-center gap-4 hover:bg-brand-coral/10 hover:border-brand-coral transition-all group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-brand-coral group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-brand-navy">Importar Datos</p>
                    <p className="text-[10px] text-brand-teal mt-1">Carga un archivo de respaldo previo</p>
                  </div>
                  <input 
                    ref={fileImportRef} 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    onChange={handleImportFile} 
                  />
                </button>
              </div>
           </div>

           {/* Logs de Red */}
           <div className="bg-white p-10 rounded-[48px] border border-brand-sage shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-brand-teal/10 text-brand-teal rounded-xl"><Activity size={20} /></div>
                 <h3 className="text-xs font-black text-brand-navy uppercase tracking-widest">Actividad de Guidari Cloud</h3>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-4">
                 {logs.filter(l => l.action.includes('Nube') || l.action.includes('Sincronización') || l.action.startsWith('Guardado') || l.action.includes('Error') || l.action.includes('Respaldo')).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-brand-beige/30 rounded-2xl border border-brand-sage/20">
                       <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                          <div>
                             <p className="text-[10px] font-black text-brand-navy uppercase tracking-tighter">{log.action}</p>
                             <p className="text-xs font-medium text-brand-teal/70">{log.message}</p>
                          </div>
                       </div>
                       <span className="text-[10px] font-bold text-brand-navy/30">{log.timestamp}</span>
                    </div>
                 ))}
                 {logs.length === 0 && (
                   <p className="text-center py-10 text-xs font-bold text-brand-teal/30 uppercase tracking-widest">Sin actividad reciente</p>
                 )}
              </div>
           </div>

           {/* Protección de Esquema SQL */}
           {!isCloudUnlocked ? (
              <div className="bg-white p-12 rounded-[56px] border border-brand-sage shadow-xl text-center space-y-8">
                  <div className="w-20 h-20 bg-brand-coral/10 text-brand-coral rounded-[32px] flex items-center justify-center mx-auto shadow-sm">
                      <Lock size={40} />
                  </div>
                  <div>
                      <h3 className="text-2xl font-display font-bold text-brand-navy">Configuración Avanzada</h3>
                      <p className="text-sm text-brand-teal/60 font-medium max-w-xs mx-auto">Protegido por PIN de seguridad del administrador maestro.</p>
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
    session_value DECIMAL(12,2),
    pin TEXT,
    password TEXT
);

CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT,
    last_name TEXT,
    diagnosis TEXT,
    assigned_professionals TEXT[]
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
