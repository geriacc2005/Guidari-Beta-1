
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole, Appointment, Patient } from '../types';
import { Mail, ShieldCheck, X, Plus, Calendar, Camera, DollarSign, Award, Clock, UserCheck, Upload, Image as ImageIcon, Lock, Key, Edit2, Save, Trash2 } from 'lucide-react';

// Helper para generar UUIDs válidos para Supabase
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface ProfessionalsListProps {
  professionals: User[];
  appointments: Appointment[];
  patients: Patient[];
  currentUser: User;
  onUpdate: (users: User[]) => void;
  // Added onDeletePro prop to fix TypeScript error in App.tsx
  onDeletePro?: (id: string) => void;
}

const ProfessionalsList: React.FC<ProfessionalsListProps> = ({ professionals, appointments, patients, currentUser, onUpdate, onDeletePro }) => {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProAgenda, setSelectedProAgenda] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    pin: '',
    dob: '',
    specialty: '',
    sessionValue: 0,
    commissionRate: 60,
    role: UserRole.PROFESSIONAL,
    avatar: 'https://picsum.photos/seed/default/200'
  });

  const isAdmin = currentUser.role === UserRole.ADMIN;

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModal(false);
        setSelectedProAgenda(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      firstName: '', lastName: '', email: '', password: '', pin: '', dob: '', specialty: '',
      sessionValue: 0, commissionRate: 60, role: UserRole.PROFESSIONAL,
      avatar: 'https://picsum.photos/seed/default/200'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (pro: User) => {
    setIsEditing(true);
    setFormData({ ...pro });
    setShowModal(true);
  };

  // Added handleDelete function for professionals to resolve delete action requirement
  const handleDelete = (id: string) => {
    if (!isAdmin) return;
    if (id === currentUser.id) {
      alert("No puedes eliminar tu propio usuario.");
      return;
    }
    if (window.confirm("¿Confirmas la eliminación permanente del profesional?")) {
      onDeletePro?.(id);
    }
  };

  const handleSavePro = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.pin) {
        alert('Por favor, complete los campos obligatorios (Nombre, Apellido, Email, Contraseña y PIN).');
        return;
    }
    
    let updatedPros: User[];
    if (isEditing && formData.id) {
      updatedPros = professionals.map(p => p.id === formData.id ? { ...p, ...formData, name: `${formData.firstName} ${formData.lastName}` } as User : p);
    } else {
      const proToAdd: User = {
        ...formData as User,
        id: generateUUID(),
        name: `${formData.firstName} ${formData.lastName}`
      };
      updatedPros = [...professionals, proToAdd];
    }
    
    onUpdate(updatedPros);
    setShowModal(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-brand-navy">Profesionales</h2>
          <p className="text-sm text-brand-teal font-medium">Gestión integral del staff interdisciplinario</p>
        </div>
        {isAdmin && (
           <button 
             onClick={handleOpenAdd}
             className="bg-brand-navy text-white px-8 py-3.5 rounded-2xl flex items-center gap-3 font-bold shadow-xl shadow-brand-navy/20 hover:scale-[1.02] transition-all"
           >
             <Plus size={20} />
             Nuevo Profesional
           </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {professionals.map((pro) => {
          const canViewAgenda = isAdmin || pro.role !== UserRole.ADMIN || pro.id === currentUser.id;

          return (
            <div key={pro.id} className="bg-white rounded-[40px] p-8 border border-brand-sage shadow-sm hover:shadow-xl hover:shadow-brand-navy/5 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-mint/10 rounded-bl-[60px] group-hover:bg-brand-coral/10 transition-colors"></div>
              
              {/* Added Delete Button for Admins to allow record removal */}
              {isAdmin && pro.id !== currentUser.id && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(pro.id); }}
                  className="absolute top-4 right-4 p-2 text-brand-teal/40 hover:text-red-500 transition-colors z-20"
                >
                  <Trash2 size={16} />
                </button>
              )}

              <div className="flex flex-col items-center text-center relative z-10">
                <div className="relative mb-6">
                  <img src={pro.avatar} alt={pro.name} className="w-16 h-16 rounded-[24px] object-cover shadow-lg ring-4 ring-brand-beige group-hover:scale-105 transition-transform" />
                  {pro.role === UserRole.ADMIN && (
                    <div className="absolute -bottom-1 -right-1 bg-brand-coral text-white p-1 rounded-lg border-2 border-white shadow-md">
                      <ShieldCheck size={14} />
                    </div>
                  )}
                </div>
                
                <h3 className="font-display text-xl font-bold text-brand-navy">{pro.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                   <Award size={14} className="text-brand-coral" />
                   <p className="text-xs font-black text-brand-teal uppercase tracking-widest">{pro.specialty || 'Generalista'}</p>
                </div>
                
                <div className="w-full h-px bg-brand-beige my-8"></div>

                <div className="w-full space-y-4">
                  <div className="flex items-center gap-4 text-xs text-brand-navy font-medium">
                    <div className="w-10 h-10 rounded-2xl bg-brand-beige flex items-center justify-center text-brand-teal shadow-inner"><Mail size={16} /></div>
                    <span className="truncate">{pro.email}</span>
                  </div>
                  
                  {isAdmin && (
                    <>
                      <div className="flex items-center gap-4 text-xs text-brand-navy font-medium">
                          <div className="w-10 h-10 rounded-2xl bg-brand-beige flex items-center justify-center text-brand-coral shadow-inner"><DollarSign size={16} /></div>
                          <span>Sesión: <b className="ml-1">${pro.sessionValue.toLocaleString()}</b></span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-brand-navy font-medium">
                          <div className="w-10 h-10 rounded-2xl bg-brand-beige flex items-center justify-center text-brand-navy/40 shadow-inner"><UserCheck size={16} /></div>
                          <span>Reparto: <b className="ml-1">{pro.commissionRate}%</b></span>
                      </div>
                    </>
                  )}
                </div>

                <div className="w-full grid grid-cols-2 gap-3 mt-8">
                  {canViewAgenda && (
                    <button 
                      onClick={() => setSelectedProAgenda(pro)}
                      className="py-3 rounded-[20px] bg-brand-mint/10 text-brand-teal text-[9px] font-black uppercase tracking-widest hover:bg-brand-mint hover:text-white transition-all"
                    >
                      Agenda
                    </button>
                  )}
                  {isAdmin && (
                    <button 
                      onClick={() => handleOpenEdit(pro)}
                      className="py-3 rounded-[20px] bg-brand-beige text-brand-navy/60 text-[9px] font-black uppercase tracking-widest hover:bg-brand-navy hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Edit2 size={12} /> Editar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-navy/30 backdrop-blur-md p-6">
          <div className="bg-brand-beige w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300 max-h-[90vh]">
            <div className="p-8 border-b border-brand-sage flex justify-between items-center bg-white/50 shrink-0">
                <h3 className="text-2xl font-display text-brand-navy font-bold">{isEditing ? 'Editar Profesional' : 'Alta de Staff'}</h3>
                <button onClick={() => setShowModal(false)} className="text-brand-navy/30 hover:text-brand-coral transition-colors p-2 hover:bg-white rounded-xl"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-20 h-20 rounded-[28px] overflow-hidden ring-4 ring-white shadow-xl bg-brand-mint/20 flex items-center justify-center transition-all group-hover:scale-105">
                          {formData.avatar ? <img src={formData.avatar} className="w-full h-full object-cover" /> : <ImageIcon size={28} className="text-brand-teal/40" />}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-brand-navy text-white p-2 rounded-xl shadow-xl"><Camera size={12} /></div>
                    </div>
                    <p className="text-[8px] font-black text-brand-teal uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border border-brand-sage shadow-sm">Fotografía Profesional</p>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Nombres *</label>
                      <input type="text" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Apellidos *</label>
                      <input type="text" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Especialidad Clínica</label>
                      <input type="text" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Email *</label>
                      <input type="email" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    
                    <div className="pt-2 md:col-span-2 border-t border-brand-sage/50 mt-1 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Contraseña *</label>
                          <input type="password" placeholder="Mínimo 8 carac." className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">PIN (4-6 núm) *</label>
                          <input type="password" placeholder="Acceso rápido" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-black tracking-widest" value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6)})} />
                        </div>
                    </div>

                    <div className="pt-2 md:col-span-2 border-t border-brand-sage/50 mt-1 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-brand-coral uppercase tracking-widest ml-1">Valor Sesión ($)</label>
                          <input type="number" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-black" value={formData.sessionValue} onChange={e => setFormData({...formData, sessionValue: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Comisión (%)</label>
                          <input type="number" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-black" value={formData.commissionRate} onChange={e => setFormData({...formData, commissionRate: Number(e.target.value)})} />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="p-8 bg-white/80 border-t border-brand-sage flex justify-end gap-5 shrink-0">
                <button onClick={() => setShowModal(false)} className="px-8 py-4 rounded-2xl font-bold text-brand-navy/40 hover:text-brand-coral transition-all text-xs">Cancelar</button>
                <button onClick={handleSavePro} className="px-12 py-4 bg-brand-navy text-white rounded-2xl font-bold shadow-xl hover:scale-[1.05] transition-all text-xs flex items-center gap-2">
                  <Save size={16} /> {isEditing ? 'Guardar Cambios' : 'Crear Staff'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalsList;
