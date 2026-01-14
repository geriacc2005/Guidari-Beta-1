
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole, Appointment, Patient } from '../types';
import { Mail, ShieldCheck, X, Plus, Calendar, Camera, DollarSign, Award, Clock, UserCheck, Upload, Image as ImageIcon, Lock, Key } from 'lucide-react';

interface ProfessionalsListProps {
  professionals: User[];
  appointments: Appointment[];
  patients: Patient[];
  currentUser: User;
  onUpdate: (users: User[]) => void;
}

const ProfessionalsList: React.FC<ProfessionalsListProps> = ({ professionals, appointments, patients, currentUser, onUpdate }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProAgenda, setSelectedProAgenda] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newPro, setNewPro] = useState<Partial<User>>({
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
        setShowAddModal(false);
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
        setNewPro(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPro = () => {
    if (!newPro.firstName || !newPro.lastName || !newPro.email || !newPro.password || !newPro.pin) {
        alert('Por favor, complete los campos obligatorios.');
        return;
    }
    
    const proToAdd: User = {
      ...newPro as User,
      id: 'u' + (Date.now()),
      name: `${newPro.firstName} ${newPro.lastName}`
    };
    onUpdate([...professionals, proToAdd]);
    setShowAddModal(false);
    setNewPro({
      firstName: '', lastName: '', email: '', password: '', pin: '', dob: '', specialty: '',
      sessionValue: 0, commissionRate: 60, role: UserRole.PROFESSIONAL,
      avatar: 'https://picsum.photos/seed/default/200'
    });
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
             onClick={() => setShowAddModal(true)}
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

                {canViewAgenda && (
                  <button 
                    onClick={() => setSelectedProAgenda(pro)}
                    className="mt-10 w-full py-4 rounded-[24px] bg-brand-mint/10 text-brand-teal text-[10px] font-black uppercase tracking-widest hover:bg-brand-mint hover:text-white transition-all shadow-sm"
                  >
                    Ver Agenda
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-navy/30 backdrop-blur-md p-6">
          <div className="bg-brand-beige w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300 max-h-[90vh]">
            <div className="p-8 border-b border-brand-sage flex justify-between items-center bg-white/50 shrink-0">
                <h3 className="text-2xl font-display font-bold text-brand-navy">Alta de Staff</h3>
                <button onClick={() => setShowAddModal(false)} className="text-brand-navy/30 hover:text-brand-coral transition-colors p-2 hover:bg-white rounded-xl"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-20 h-20 rounded-[28px] overflow-hidden ring-4 ring-white shadow-xl bg-brand-mint/20 flex items-center justify-center transition-all group-hover:scale-105">
                          {newPro.avatar ? <img src={newPro.avatar} className="w-full h-full object-cover" /> : <ImageIcon size={28} className="text-brand-teal/40" />}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-brand-navy text-white p-2 rounded-xl shadow-xl"><Camera size={12} /></div>
                    </div>
                    <p className="text-[8px] font-black text-brand-teal uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border border-brand-sage shadow-sm">Fotografía Profesional</p>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Nombres *</label>
                      <input type="text" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={newPro.firstName} onChange={e => setNewPro({...newPro, firstName: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Apellidos *</label>
                      <input type="text" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={newPro.lastName} onChange={e => setNewPro({...newPro, lastName: e.target.value})} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Especialidad Clínica</label>
                      <input type="text" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={newPro.specialty} onChange={e => setNewPro({...newPro, specialty: e.target.value})} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Email *</label>
                      <input type="email" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={newPro.email} onChange={e => setNewPro({...newPro, email: e.target.value})} />
                    </div>
                    
                    <div className="pt-2 md:col-span-2 border-t border-brand-sage/50 mt-1 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Contraseña *</label>
                          <input type="password" placeholder="Mínimo 8 carac." className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={newPro.password} onChange={e => setNewPro({...newPro, password: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">PIN (4-6 núm) *</label>
                          <input type="password" placeholder="Acceso rápido" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-black tracking-widest" value={newPro.pin} onChange={e => setNewPro({...newPro, pin: e.target.value.replace(/\D/g, '').slice(0, 6)})} />
                        </div>
                    </div>

                    <div className="pt-2 md:col-span-2 border-t border-brand-sage/50 mt-1 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-brand-coral uppercase tracking-widest ml-1">Valor Sesión ($)</label>
                          <input type="number" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-black" value={newPro.sessionValue} onChange={e => setNewPro({...newPro, sessionValue: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Comisión (%)</label>
                          <input type="number" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-black" value={newPro.commissionRate} onChange={e => setNewPro({...newPro, commissionRate: Number(e.target.value)})} />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="p-8 bg-white/80 border-t border-brand-sage flex justify-end gap-5 shrink-0">
                <button onClick={() => setShowAddModal(false)} className="px-8 py-4 rounded-2xl font-bold text-brand-navy/40 hover:text-brand-coral transition-all text-xs">Cancelar</button>
                <button onClick={handleAddPro} className="px-12 py-4 bg-brand-navy text-white rounded-2xl font-bold shadow-xl hover:scale-[1.05] transition-all text-xs">Crear Staff</button>
            </div>
          </div>
        </div>
      )}

      {selectedProAgenda && (
        <div className="fixed inset-0 z-[150] flex items-center justify-end bg-brand-navy/30 backdrop-blur-sm p-0">
          <div className="bg-brand-beige w-full max-w-md h-full shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto custom-scrollbar">
             <div className="p-10 border-b border-brand-sage flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <img src={selectedProAgenda.avatar} className="w-12 h-12 rounded-2xl ring-2 ring-brand-beige shadow-lg" />
                  <div>
                    <h3 className="text-xl font-display font-bold text-brand-navy">{selectedProAgenda.name}</h3>
                    <p className="text-[10px] text-brand-teal font-black uppercase tracking-widest">{selectedProAgenda.specialty}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedProAgenda(null)} className="p-3 hover:bg-brand-beige rounded-2xl transition-colors text-brand-teal">
                  <X size={24} />
                </button>
             </div>
             
             <div className="p-10 space-y-8">
                <h4 className="text-[10px] font-black text-brand-navy uppercase tracking-[0.4em] border-b border-brand-sage pb-4">Turnos Programados</h4>
                {/* Agenda simplificada para el modal */}
                <p className="text-xs text-brand-teal italic">Visualización rápida de turnos...</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalsList;
