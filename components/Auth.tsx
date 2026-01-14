
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { mockUsers } from '../mockData'; // Importación vital para el fallback de acceso
import { Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, Heart, Key, AlertCircle } from 'lucide-react';

// Helper local para generar UUIDs si se necesita durante el registro
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface AuthProps {
  onLogin: (user: User) => void;
  users: User[];
  onRegister: (newUser: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, users, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [usePin, setUsePin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regPin, setRegPin] = useState('');
  const [error, setError] = useState('');

  const logoUrl = "https://zugbripyvaidkpesrvaa.supabase.co/storage/v1/object/sign/Imagenes/Guidari%20sin%20fondo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kMmViNTc1OC0yY2UyLTRkODgtOGQ5MC1jZWFiYTM1MjY1Y2IiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZW5lcy9HdWlkYXJpIHNpbiBmb25kby5wbmciLCJpYXQiOjE3NjgzNDI2MjIsImV4cCI6MjM5OTA2MjYyMn0.0r_lpPOfT1oMZxTGa4YLu57M5VPrmTT_VJsma7EpoX8";

  const ADMIN_EMAIL = 'crisfreuter@gmail.com';

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      if (usePin) {
        if (!pin) {
          setError('Ingrese su PIN de seguridad.');
          return;
        }
        // Buscar en lista dinámica (Supabase)
        let user = users.find(u => u.pin === pin);
        
        // Fallback para Administrador si no se encuentra en la lista dinámica
        if (!user) {
          user = mockUsers.find(u => u.email === ADMIN_EMAIL && u.pin === pin);
        }

        if (user) {
          onLogin(user);
        } else {
          setError('PIN incorrecto o no configurado.');
        }
      } else {
        // Buscar en lista dinámica (Supabase)
        let user = users.find(u => u.email === email && u.password === password);
        
        // Fallback de Emergencia para Administrador Maestro
        if (!user && email === ADMIN_EMAIL) {
          user = mockUsers.find(u => u.email === email && u.password === password);
        }

        if (user) {
          onLogin(user);
        } else {
          setError('Email o contraseña incorrectos.');
        }
      }
    } else {
      if (!email || !password || !firstName || !lastName || !regPin) {
        setError('Por favor complete todos los campos obligatorios.');
        return;
      }

      const isNumeric = /^\d+$/.test(regPin);
      if (!isNumeric) {
        setError('El PIN debe contener solo números.');
        return;
      }

      if (regPin.length < 4 || regPin.length > 6) {
        setError('El PIN debe tener entre 4 y 6 dígitos.');
        return;
      }

      if (users.some(u => u.email === email)) {
        setError('Este correo electrónico ya está registrado.');
        return;
      }

      const newUser: User = {
        id: generateUUID(), // AHORA GENERA UUID VÁLIDO PARA SUPABASE
        email,
        password,
        pin: regPin,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        role: UserRole.PROFESSIONAL,
        avatar: `https://picsum.photos/seed/${email}/200`,
        sessionValue: 0,
        commissionRate: 60,
        specialty: 'Pendiente asignar'
      };
      onRegister(newUser);
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen bg-brand-beige flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-brand-mint/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-brand-coral/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-4xl bg-white rounded-[56px] shadow-2xl shadow-brand-navy/5 overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-700">
        <div className="w-full md:w-1/2 bg-brand-navy p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full scale-150">
              <path fill="#ffffff" d="M44.7,-76.4C58.3,-69.2,70.1,-58.5,78.2,-45.5C86.3,-32.5,90.7,-17.2,89.5,-2.5C88.2,12.2,81.3,26.3,72.1,38.5C62.9,50.7,51.4,61,38.1,68.9C24.8,76.8,9.7,82.3,-5.1,81.1C-19.9,79.9,-34.4,72,-47,62.2C-59.6,52.4,-70.3,40.7,-77.1,27.1C-83.9,13.5,-86.8,-2,-84.6,-16.9C-82.4,-31.8,-75,-46.1,-63.4,-54.6C-51.8,-63.1,-35.9,-65.8,-21.8,-73.4C-7.7,-81,4.6,-93.5,18.4,-92.4C32.2,-91.3,31.1,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
            </svg>
          </div>
          <div className="relative z-10 space-y-8">
            <div className="w-48 h-48 mx-auto bg-white/5 rounded-[48px] p-4 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white tracking-tight">Espacio Interdisciplinario</h1>
              <p className="text-brand-mint font-medium mt-2 opacity-80">Gestión Integral de Salud y Rehabilitación</p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-12 md:p-16 flex flex-col justify-center bg-white">
          <div className="mb-10 flex justify-between items-start">
            <div>
              <h2 className="text-4xl font-display font-bold text-brand-navy">{isLogin ? 'Bienvenida' : 'Crear Cuenta'}</h2>
              <p className="text-brand-teal mt-2 font-medium">
                {isLogin ? 'Ingrese sus datos para acceder' : 'Súmese al equipo terapéutico'}
              </p>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {isLogin && (
              <div className="flex bg-brand-beige/50 p-1 rounded-2xl mb-4">
                <button type="button" onClick={() => {setUsePin(false); setError('');}} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!usePin ? 'bg-white text-brand-navy shadow-sm' : 'text-brand-teal/40'}`}>Contraseña</button>
                <button type="button" onClick={() => {setUsePin(true); setError('');}} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${usePin ? 'bg-white text-brand-navy shadow-sm' : 'text-brand-teal/40'}`}>PIN Rápido</button>
              </div>
            )}

            {!isLogin && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-1">Nombre *</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-brand-beige/50 border border-brand-sage rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-brand-coral/20 outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-1">Apellido *</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-brand-beige/50 border border-brand-sage rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-brand-coral/20 outline-none" required />
                </div>
              </div>
            )}

            {isLogin && usePin ? (
               <div className="space-y-2 animate-in fade-in zoom-in">
                <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-1 text-center block">PIN de Acceso</label>
                <div className="relative group max-w-[200px] mx-auto">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal/40 group-focus-within:text-brand-coral transition-colors" size={18} />
                  <input 
                    type="password" 
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-brand-beige/50 border border-brand-sage rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-brand-coral/10 focus:border-brand-coral/30 transition-all font-bold text-center text-xl tracking-[0.5em]"
                    placeholder="••••"
                    required
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-1">Email *</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal/40 transition-colors" size={18} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-brand-beige/50 border border-brand-sage rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-brand-coral/20 outline-none" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-1">Contraseña *</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal/40 transition-colors" size={18} />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-brand-beige/50 border border-brand-sage rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-brand-coral/20 outline-none" required />
                  </div>
                </div>
              </>
            )}

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-1">Configurar PIN (4-6 núm) *</label>
                <div className="relative group">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal/40 transition-colors" size={18} />
                  <input 
                    type="password" 
                    value={regPin} 
                    onChange={e => setRegPin(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                    className="w-full bg-brand-beige/50 border border-brand-sage rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold tracking-widest focus:ring-2 focus:ring-brand-coral/20 outline-none" 
                    placeholder="Mínimo 4 dígitos"
                    required 
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-3 animate-shake">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button type="submit" className="w-full bg-brand-navy text-white py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all">
              {isLogin ? 'Acceder al Centro' : 'Completar Registro'}
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-brand-sage text-center">
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-brand-coral font-black text-[10px] uppercase tracking-widest hover:underline transition-all">
              {isLogin ? '¿No tiene cuenta? Regístrese aquí' : '¿Ya es parte del staff? Inicie sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
