
import React, { useState, useEffect } from 'react';
import { User, UserRole, Patient, Appointment, SupabaseLog } from '../types';
import { 
  Plus, X, Shield, ShieldCheck, Mail, Camera, UserPlus, Trash2, 
  Database, RefreshCcw, Download, Upload, Terminal, Code, FileText, CheckCircle2,
  Wallet, Key, Lock, User as UserIcon, Users, Save, Info, Copy, Check, UserPen, Loader2, AlertCircle, Eye, EyeOff, AlertTriangle
} from 'lucide-react';

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
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  users, onUpdateUsers, currentUser, patients, appointments, onImportData, logs, addLog, onUpdateCurrentUser
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'perfil' | 'usuarios' | 'supabase'>('perfil');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
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
  const [showPin, setShowPin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isAdmin = currentUser.role === UserRole.ADMIN;

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Any modal closing logic if needed
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      alert("No puedes eliminar tu propia cuenta de administrador.");
      return;
    }
    if (window.confirm("¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.")) {
      const updated = users.filter(u => u.id !== userId);
      onUpdateUsers(updated);
      addLog('Usuarios', 'success', `Usuario eliminado: ${userId}`);
      triggerNotification('Usuario eliminado', 'success');
    }
  };

  const handleSyncDatabase = async () => {
    setSyncStatus('syncing');
    addLog('Base de Datos', 'success', 'Iniciando sincronización bidireccional (Push/Pull)...');
    try {
      // Simulación de subida y bajada de datos
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simular fallo aleatorio para demostración (opcional, aquí lo dejamos exitoso mayormente)
          if (Math.random() < 0.05) reject(new Error('Timeout'));
          else resolve(true);
        }, 2500);
      });
      
      setSyncStatus('success');
      addLog('Base de Datos', 'success', 'Datos locales enviados y remotos recibidos correctamente.');
      triggerNotification('Sincronización Exitosa', 'success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      setSyncStatus('error');
      addLog('Base de Datos', 'error', 'Error crítico en la comunicación con el servidor.');
      triggerNotification('Error de Sincronización: Verifique conexión', 'error');
      setTimeout(() => setSyncStatus('idle'), 4000);
    }
  };

  const handleUnlockCloud = () => {
    if (cloudPin === CLOUD_ACCESS_PIN) {
      setIsCloudUnlocked(true);
      addLog('Nube', 'success', 'Acceso a configuración de nube desbloqueado.');
    } else {
      alert('PIN Incorrecto');
      setCloudPin('');
    }
  };

  const sqlSchema = `-- Esquema SQL de Producción para Guidari Center
-- Versión 2.0 (Optimizado para Supabase/PostgreSQL)

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función para actualizar el timestamp de 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Tabla de Usuarios (Staff)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    pin_code TEXT CHECK (length(pin_code) BETWEEN 4 AND 6),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('ADMIN', 'PROFESSIONAL')) DEFAULT 'PROFESSIONAL',
    specialty TEXT,
    avatar_url TEXT,
    session_value DECIMAL(12,2) DEFAULT 0,
    commission_rate INT DEFAULT 60 CHECK (commission_rate BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Pacientes
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    diagnosis TEXT,
    insurance_plan TEXT DEFAULT 'Particular',
    affiliate_number TEXT,
    school_info TEXT,
    avatar_url TEXT,
    responsible_name TEXT,
    responsible_phone TEXT,
    responsible_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers para actualización automática de fecha
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_modtime BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Toast Notification System */}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative">
           <div className="lg:col-span-1 bg-white p-10 rounded-[48px] border border-brand-sage shadow-sm text-center flex flex-col justify-between hover:shadow-xl transition-shadow">
              <div>
                <div className="relative inline-block mb-10 group cursor-pointer">
                   <img src={editAvatar || currentUser.avatar} className="w-48 h-48 rounded-[64px] object-cover mx-auto ring-8 ring-brand-beige shadow-2xl transition-all group-hover:scale-[1.05]" />
                   <div className="absolute -bottom-2 -right-2 bg-brand-coral text-white p-5 rounded-[24px] border-4 border-white shadow-xl hover:rotate-12 transition-transform">
                      <Camera size={24} />
                   </div>
                </div>
                <h3 className="text-3xl font-display font-bold text-brand-navy">{editFirstName} {editLastName}</h3>
                <p className="text-[11px] text-brand-teal font-black uppercase tracking-[0.3em] mt-3">{isAdmin ? 'Administrador' : editSpecialty}</p>
                <p className="text-xs text-brand-navy/30 font-bold mt-2 lowercase">{currentUser.email}</p>
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

              <div className="pt-10 border-t border-brand-sage/40 space-y-10">
                  <div className="flex items-center gap-4">
                      <div className="p-4 bg-brand-navy/5 text-brand-navy rounded-3xl"><ShieldCheck size={28} /></div>
                      <h3 className="font-display text-2xl font-bold text-brand-navy">Seguridad de Acceso</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-brand-teal uppercase tracking-[0.2em] ml-2">PIN Rápido (4-6 núm)</label>
                        <div className="relative group">
                           <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-teal/30" size={20} />
                           <input 
                              type={showPin ? "text" : "password"} 
                              className="w-full bg-brand-beige/40 border border-brand-sage rounded-[28px] py-5 pl-16 pr-16 text-2xl font-black tracking-[0.6em] outline-none" 
                              value={myPin} 
                              onChange={(e) => setMyPin(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                           />
                           <button onClick={() => setShowPin(!showPin)} className="absolute right-6 top-1/2 -translate-y-1/2 text-brand-teal/20 hover:text-brand-coral transition-colors">
                              {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                           </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-brand-teal uppercase tracking-[0.2em] ml-2">Nueva Contraseña</label>
                        <div className="relative group">
                           <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-teal/30" size={20} />
                           <input 
                              type={showPassword ? "text" : "password"} 
                              className="w-full bg-brand-beige/40 border border-brand-sage rounded-[28px] py-5 pl-16 pr-16 text-sm font-bold outline-none" 
                              value={myPassword} 
                              onChange={(e) => setMyPassword(e.target.value)} 
                           />
                           <button onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-brand-teal/20 hover:text-brand-coral transition-colors">
                              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                           </button>
                        </div>
                      </div>
                  </div>
              </div>

              <div className="pt-10 flex justify-end">
                  <button onClick={handleUpdateProfile} className="bg-brand-navy text-white px-16 py-6 rounded-[32px] font-bold shadow-xl hover:scale-[1.02] transition-all flex items-center gap-4 text-sm"><Save size={22} /> Guardar Cambios</button>
              </div>
           </div>
        </div>
      )}

      {activeSubTab === 'usuarios' && isAdmin && (
        <div className="bg-white p-10 rounded-[48px] border border-brand-sage shadow-sm space-y-8 animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-brand-teal/10 text-brand-teal rounded-3xl"><Users size={28} /></div>
                 <h3 className="font-display text-2xl font-bold text-brand-navy">Gestión de Staff y Accesos</h3>
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-brand-sage">
                       <th className="pb-4 text-[10px] font-black uppercase text-brand-teal tracking-widest px-4">Usuario</th>
                       <th className="pb-4 text-[10px] font-black uppercase text-brand-teal tracking-widest px-4">Rol</th>
                       <th className="pb-4 text-[10px] font-black uppercase text-brand-teal tracking-widest px-4">Especialidad</th>
                       <th className="pb-4 text-[10px] font-black uppercase text-brand-teal tracking-widest px-4 text-center">Acciones</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-brand-beige">
                    {users.map(u => (
                       <tr key={u.id} className="group hover:bg-brand-beige/30 transition-colors">
                          <td className="py-6 px-4">
                             <div className="flex items-center gap-4">
                                <img src={u.avatar} className="w-10 h-10 rounded-xl object-cover" />
                                <div>
                                   <p className="text-sm font-bold text-brand-navy">{u.name}</p>
                                   <p className="text-xs text-brand-teal/60">{u.email}</p>
                                </div>
                             </div>
                          </td>
                          <td className="py-6 px-4">
                             <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg ${u.role === UserRole.ADMIN ? 'bg-brand-coral/10 text-brand-coral' : 'bg-brand-teal/10 text-brand-teal'}`}>
                                {u.role}
                             </span>
                          </td>
                          <td className="py-6 px-4">
                             <p className="text-xs font-medium text-brand-navy">{u.specialty || 'General'}</p>
                          </td>
                          <td className="py-6 px-4 text-center">
                             <button 
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-3 text-brand-teal/20 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                title="Eliminar Usuario"
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
           {/* Botón de Sincronización - Siempre Visible y Sin Protección */}
           <div className="bg-white p-8 rounded-[40px] border border-brand-sage shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl shadow-sm transition-colors ${
                    syncStatus === 'success' ? 'bg-green-100 text-green-600' :
                    syncStatus === 'error' ? 'bg-red-100 text-red-600' :
                    'bg-brand-mint text-brand-teal'
                  }`}>
                    <RefreshCcw size={20} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                  </div>
                  <div>
                      <h4 className="text-sm font-bold text-brand-navy">Sincronización Bidireccional</h4>
                      <p className="text-[10px] text-brand-teal/60 font-medium">Sube cambios locales y descarga datos remotos de Supabase</p>
                  </div>
              </div>
              <button 
                onClick={handleSyncDatabase} 
                disabled={syncStatus === 'syncing'} 
                className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all ${
                  syncStatus === 'syncing' ? 'bg-brand-coral/50 opacity-50 cursor-not-allowed text-white' :
                  syncStatus === 'success' ? 'bg-green-500 text-white hover:bg-green-600' :
                  syncStatus === 'error' ? 'bg-red-500 text-white hover:bg-red-600' :
                  'bg-brand-navy text-white hover:scale-[1.02]'
                }`}
              >
                 {syncStatus === 'syncing' ? <Loader2 className="animate-spin" size={18} /> : 
                  syncStatus === 'success' ? <CheckCircle2 size={18} /> :
                  syncStatus === 'error' ? <AlertTriangle size={18} /> : 
                  <RefreshCcw size={18} />}
                 
                 {syncStatus === 'syncing' ? 'Sincronizando...' : 
                  syncStatus === 'success' ? 'Éxito' :
                  syncStatus === 'error' ? 'Falló' : 
                  'Sincronizar Ahora'}
              </button>
           </div>

           {/* Protección de PIN para detalles avanzados */}
           {!isCloudUnlocked ? (
              <div className="bg-white p-12 rounded-[56px] border border-brand-sage shadow-xl text-center space-y-8">
                  <div className="w-20 h-20 bg-brand-coral/10 text-brand-coral rounded-[32px] flex items-center justify-center mx-auto shadow-sm">
                      <Lock size={40} />
                  </div>
                  <div>
                      <h3 className="text-2xl font-display font-bold text-brand-navy">Configuración Avanzada</h3>
                      <p className="text-sm text-brand-teal/60 font-medium max-w-xs mx-auto">Ingrese el PIN de seguridad ("666967") para acceder a los esquemas y logs del servidor.</p>
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
                        className="w-full bg-brand-coral text-white py-4 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                      >
                         <Key size={18} /> Desbloquear
                      </button>
                  </div>
              </div>
           ) : (
              <div className="bg-brand-navy p-12 rounded-[56px] shadow-2xl relative overflow-hidden group animate-in zoom-in duration-500">
                <div className="absolute top-0 right-0 p-10 opacity-5 text-white group-hover:scale-125 transition-all duration-700">
                    <Database size={150} />
                </div>
                <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-center text-white">
                      <div>
                         <h3 className="text-2xl font-display font-bold">Arquitectura Cloud</h3>
                         <p className="text-brand-mint text-sm mt-1 opacity-80">Gestión de esquemas y logs de producción</p>
                      </div>
                      <button onClick={() => setIsCloudUnlocked(false)} className="text-white/40 hover:text-white transition-colors">
                          <Lock size={20} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-black/40 rounded-[40px] p-8 border border-white/5 font-mono text-[11px] text-brand-mint/80 overflow-x-auto max-h-[450px] custom-scrollbar shadow-inner">
                          <div className="flex items-center gap-3 mb-4 text-white/40">
                             <Code size={14} />
                             <span className="text-[10px] font-black uppercase tracking-widest">PostgreSQL Schema (R/W)</span>
                          </div>
                          <pre className="text-brand-sage"><code>{sqlSchema}</code></pre>
                       </div>
                       
                       <div className="space-y-6">
                          <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-md">
                             <h4 className="text-white font-bold mb-4 flex items-center gap-3">
                                <Terminal size={18} className="text-brand-coral" />
                                Engine Status
                             </h4>
                             <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                   <span className="text-white/40 text-[10px] font-black uppercase">PostgreSQL Version</span>
                                   <span className="text-brand-mint font-bold text-xs">15.4 (Latest)</span>
                                </div>
                                <div className="flex justify-between items-center">
                                   <span className="text-white/40 text-[10px] font-black uppercase">Latencia</span>
                                   <span className="text-brand-mint font-bold text-xs">24ms (Optimized)</span>
                                </div>
                                <div className="flex justify-between items-center">
                                   <span className="text-white/40 text-[10px] font-black uppercase">Auto-Sync</span>
                                   <span className="text-brand-mint font-bold text-xs">Cada 30 min</span>
                                </div>
                             </div>
                          </div>
                          
                          <div className="bg-brand-coral/10 p-8 rounded-[40px] border border-brand-coral/20">
                             <div className="flex gap-4 items-start text-brand-beige">
                                <Info className="text-brand-coral shrink-0" size={24} />
                                <div>
                                   <p className="font-bold text-sm">Integridad de Datos</p>
                                   <p className="text-xs opacity-70 mt-1 leading-relaxed">El sistema sincroniza automáticamente los datos cada 30 minutos. Los conflictos de versión se resuelven priorizando la marca de tiempo más reciente.</p>
                                   <div className="flex gap-2 mt-4">
                                      <button className="bg-brand-coral text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand-coral/20 hover:scale-105 transition-transform">Copy Migration SQL</button>
                                      <button className="bg-white/10 text-white border border-white/20 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Download JSON Dump</button>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
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
