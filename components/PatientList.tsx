
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Patient, User, UserRole, ClinicalNote, Appointment, ContactPerson } from '../types';
import { 
  Search, Phone, Mail, 
  Calendar, School, Edit2, X, BookOpen, UserPlus, Info, Save, PlusCircle, Camera, Clock, Users, ChevronRight, Image as ImageIcon, Briefcase, GraduationCap, Maximize2, Trash2
} from 'lucide-react';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const INITIAL_FORM_STATE: Partial<Patient> = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  diagnosis: '',
  insurance: 'Particular',
  avatar: '',
  affiliateNumber: '',
  school: '',
  supportTeacher: { name: '', phone: '', email: '' },
  therapeuticCompanion: { name: '', phone: '', email: '' },
  assignedProfessionals: [],
  responsible: { name: '', address: '', phone: '', email: '' },
  clinicalHistory: [],
  documents: []
};

interface PatientListProps {
  patients: Patient[];
  professionals: User[];
  currentUser: User;
  onUpdate: (patients: Patient[]) => void;
  onDeletePatient?: (id: string) => void;
  appointments: Appointment[];
}

const PatientList: React.FC<PatientListProps> = ({ patients, professionals, currentUser, onUpdate, onDeletePatient, appointments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showFullHistoryModal, setShowFullHistoryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteDate, setNewNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState<Partial<Patient>>(INITIAL_FORM_STATE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase());
      const isAssigned = isAdmin || (p.assignedProfessionals && p.assignedProfessionals.includes(currentUser.id));
      return matchesSearch && isAssigned;
    });
  }, [patients, searchTerm, isAdmin, currentUser.id]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData(INITIAL_FORM_STATE);
    setShowModal(true);
  };

  const handleOpenEdit = (p: Patient) => {
    setIsEditing(true);
    setFormData(p);
    setShowModal(true);
  };

  const handleOpenNote = (p: Patient) => {
    setSelectedPatient(p);
    setNewNoteContent('');
    setShowNoteModal(true);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) return;
    if (window.confirm("¿Confirmas la eliminación permanente del paciente?")) {
      onDeletePatient?.(id);
      if (selectedPatient?.id === id) setSelectedPatient(null);
    }
  };

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

  const toggleProfessional = (proId: string) => {
    setFormData(prev => {
      const current = prev.assignedProfessionals || [];
      const updated = current.includes(proId) ? current.filter(id => id !== proId) : [...current, proId];
      return { ...prev, assignedProfessionals: updated };
    });
  };

  const handleSavePatient = () => {
    if (!formData.firstName || !formData.lastName) return alert("Por favor complete al menos el nombre y apellido.");
    if (isEditing && formData.id) {
      onUpdate(patients.map(p => p.id === formData.id ? { ...p, ...formData } as Patient : p));
    } else {
      onUpdate([...patients, { ...INITIAL_FORM_STATE, ...formData, id: generateUUID() } as Patient]);
    }
    setShowModal(false);
  };

  const handleAddClinicalNote = () => {
    if (!selectedPatient || !newNoteContent.trim()) return;
    const newNote = { id: generateUUID(), date: new Date().toISOString(), professionalId: currentUser.id, content: newNoteContent };
    const updated = { ...selectedPatient, clinicalHistory: [newNote, ...selectedPatient.clinicalHistory] };
    onUpdate(patients.map(p => p.id === selectedPatient.id ? updated : p));
    setSelectedPatient(updated);
    setShowNoteModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div><h2 className="text-3xl font-display font-bold text-brand-navy">Pacientes</h2><p className="text-sm text-brand-teal font-medium">Legajos digitales centralizados</p></div>
        {isAdmin && <button onClick={handleOpenAdd} className="bg-brand-coral text-white px-8 py-3.5 rounded-2xl flex items-center gap-3 font-bold shadow-xl shadow-brand-coral/20 hover:scale-[1.02] transition-all"><UserPlus size={20} /> Nuevo Paciente</button>}
      </div>
      
      <div className="bg-white p-1 rounded-[40px] border border-brand-sage shadow-sm shrink-0">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-teal/40" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o diagnóstico..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-transparent border-none py-5 pl-16 pr-8 focus:outline-none text-brand-navy font-medium" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
        <div className="lg:col-span-8 bg-white rounded-[40px] border border-brand-sage shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-brand-beige/50 border-b border-brand-sage sticky top-0 z-10">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-brand-teal uppercase tracking-widest">Paciente</th>
                  <th className="px-8 py-5 text-[10px] font-black text-brand-teal uppercase tracking-widest">Cobertura</th>
                  <th className="px-8 py-5 text-[10px] font-black text-brand-teal uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige">
                {filteredPatients.map(p => (
                  <tr key={p.id} onClick={() => setSelectedPatient(p)} className={`hover:bg-brand-mint/10 cursor-pointer group ${selectedPatient?.id === p.id ? 'bg-brand-mint/5' : ''}`}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <img src={p.avatar || `https://picsum.photos/seed/${p.id}/100`} className="w-10 h-10 rounded-2xl object-cover ring-2 ring-brand-beige group-hover:ring-brand-coral transition-all" alt="" />
                        <div>
                          <p className="text-sm font-bold text-brand-navy">{p.firstName} {p.lastName}</p>
                          <p className="text-[10px] text-brand-teal/60 font-medium">{p.insurance}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[9px] font-black px-3 py-1.5 rounded-full bg-brand-teal/10 text-brand-teal uppercase tracking-tighter">
                        {p.insurance}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isAdmin && <button onClick={(e) => {e.stopPropagation(); handleOpenEdit(p);}} className="p-2 text-brand-teal/40 hover:text-brand-coral transition-colors" title="Editar"><Edit2 size={16} /></button>}
                        {isAdmin && <button onClick={(e) => {e.stopPropagation(); handleDelete(p.id);}} className="p-2 text-brand-teal/40 hover:text-red-500 transition-colors" title="Eliminar"><Trash2 size={16} /></button>}
                        <button onClick={(e) => {e.stopPropagation(); handleOpenNote(p);}} className="p-2 text-brand-teal/40 hover:text-brand-navy transition-colors" title="Nota Clínica"><PlusCircle size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-[40px] border border-brand-sage shadow-sm p-10 flex flex-col overflow-y-auto custom-scrollbar">
          {selectedPatient ? (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center relative">
                <img src={selectedPatient.avatar || `https://picsum.photos/seed/${selectedPatient.id}/200`} className="w-24 h-24 rounded-[32px] mx-auto shadow-xl ring-4 ring-brand-beige object-cover" />
                <h3 className="text-2xl font-display font-bold text-brand-navy mt-4">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                <p className="text-[10px] text-brand-teal font-black uppercase tracking-widest mt-1">{selectedPatient.insurance}</p>
              </div>
              <div className="p-6 bg-brand-beige rounded-[32px] space-y-4 text-left border border-brand-sage/30">
                <div className="flex items-center gap-4 text-sm font-medium">
                  <Calendar size={18} className="text-brand-coral" />
                  <span>Nacimiento: <b className="ml-1">{new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</b></span>
                </div>
                <div className="flex items-start gap-4 text-sm font-medium">
                  <BookOpen size={18} className="text-brand-teal mt-1" />
                  <span className="leading-tight">Diagnóstico: <b className="ml-1">{selectedPatient.diagnosis}</b></span>
                </div>
              </div>
              <div className="pt-4">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[10px] font-black text-brand-teal uppercase tracking-widest">Historia Clínica</h4>
                  <button onClick={() => setShowFullHistoryModal(true)} className="p-2 text-brand-navy/40 hover:text-brand-navy"><Maximize2 size={16} /></button>
                </div>
                <div className="space-y-4">
                  {selectedPatient.clinicalHistory && selectedPatient.clinicalHistory.slice(0, 3).map(note => (
                    <div key={note.id} className="p-5 bg-white rounded-[28px] border border-brand-sage shadow-sm text-left">
                      <p className="text-[9px] font-bold text-brand-teal bg-brand-sage/30 px-2 py-0.5 rounded-lg inline-block mb-2">{new Date(note.date).toLocaleDateString()}</p>
                      <p className="text-brand-navy/80 text-xs leading-relaxed italic line-clamp-3">"{note.content}"</p>
                    </div>
                  ))}
                  {(!selectedPatient.clinicalHistory || selectedPatient.clinicalHistory.length === 0) && (
                    <p className="text-center py-10 text-[10px] font-black text-brand-teal/30 uppercase tracking-widest">Sin registros previos</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-brand-teal/20 gap-6">
              <Users size={80} strokeWidth={1} />
              <p className="text-sm font-medium">Seleccione un paciente para ver su ficha</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-navy/30 backdrop-blur-md p-6 overflow-y-auto">
          <div className="bg-brand-beige w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in duration-300 max-h-[95vh] border border-white">
            <div className="p-8 border-b border-brand-sage flex justify-between items-center bg-white/50 shrink-0">
                <h3 className="text-3xl font-display font-bold text-brand-navy">{isEditing ? 'Modificar Legajo' : 'Alta de Paciente'}</h3>
                <button onClick={() => setShowModal(false)} className="text-brand-navy/30 hover:text-brand-coral transition-colors p-2 hover:bg-white rounded-xl"><X size={28} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                {/* Sección Superior: Avatar y Nombres */}
                <div className="bg-white/40 p-8 rounded-[40px] border border-brand-sage/30 flex flex-col md:flex-row items-center gap-10">
                   <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-24 h-24 rounded-[32px] overflow-hidden ring-4 ring-white shadow-xl bg-brand-mint/20 flex items-center justify-center transition-all group-hover:scale-105">
                          {formData.avatar ? (
                            <img src={formData.avatar} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={32} className="text-brand-teal/40" />
                          )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-brand-navy text-white p-2.5 rounded-xl shadow-lg border-2 border-white">
                          <Camera size={14} />
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                   </div>
                   <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-1">Nombres *</label>
                          <input type="text" placeholder="Mateo" className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-brand-coral/5 outline-none transition-all" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-1">Apellidos *</label>
                          <input type="text" placeholder="Lopez" className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-brand-coral/5 outline-none transition-all" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                      </div>
                   </div>
                </div>

                {/* Grid Central: Identificación, Cobertura, Diagnóstico */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Identificación */}
                    <div className="bg-white/40 p-6 rounded-[32px] border border-brand-sage/30 space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="p-2 bg-brand-coral/10 text-brand-coral rounded-xl"><Info size={16} /></div>
                           <h4 className="text-[10px] font-black text-brand-navy uppercase tracking-widest">Identificación</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Nacimiento</label>
                                <input type="date" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">DNI / Afiliado</label>
                                <input type="text" placeholder="00.000.000" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={formData.affiliateNumber} onChange={e => setFormData({...formData, affiliateNumber: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Cobertura */}
                    <div className="bg-white/40 p-6 rounded-[32px] border border-brand-sage/30 space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="p-2 bg-brand-teal/10 text-brand-teal rounded-xl"><GraduationCap size={16} /></div>
                           <h4 className="text-[10px] font-black text-brand-navy uppercase tracking-widest">Cobertura</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Obra Social</label>
                                <input type="text" placeholder="Particular" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={formData.insurance} onChange={e => setFormData({...formData, insurance: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Escuela</label>
                                <input type="text" placeholder="Escuela" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Diagnóstico */}
                    <div className="bg-white/40 p-6 rounded-[32px] border border-brand-sage/30 space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="p-2 bg-brand-navy/10 text-brand-navy rounded-xl"><BookOpen size={16} /></div>
                           <h4 className="text-[10px] font-black text-brand-navy uppercase tracking-widest">Diagnóstico</h4>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Observaciones</label>
                            <textarea 
                              placeholder="Motivo de consulta..." 
                              className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium min-h-[110px] resize-none focus:ring-4 focus:ring-brand-coral/5 transition-all" 
                              value={formData.diagnosis} 
                              onChange={e => setFormData({...formData, diagnosis: e.target.value})} 
                            />
                        </div>
                    </div>
                </div>

                {/* Sección Soporte: Maestra y Acompañante */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white/40 p-6 rounded-[32px] border border-brand-sage/30 space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="p-2 bg-brand-teal/10 text-brand-teal rounded-xl"><Users size={16} /></div>
                           <h4 className="text-[10px] font-black text-brand-navy uppercase tracking-widest">Maestra de Apoyo</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Nombre</label>
                                <input type="text" placeholder="Nombre" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={formData.supportTeacher?.name} onChange={e => setFormData({...formData, supportTeacher: {...formData.supportTeacher!, name: e.target.value}})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Teléfono</label>
                                <input type="text" placeholder="Teléfono" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={formData.supportTeacher?.phone} onChange={e => setFormData({...formData, supportTeacher: {...formData.supportTeacher!, phone: e.target.value}})} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/40 p-6 rounded-[32px] border border-brand-sage/30 space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="p-2 bg-brand-coral/10 text-brand-coral rounded-xl"><Briefcase size={16} /></div>
                           <h4 className="text-[10px] font-black text-brand-navy uppercase tracking-widest">Acompañante Terapéutico</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Nombre</label>
                                <input type="text" placeholder="Nombre" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={formData.therapeuticCompanion?.name} onChange={e => setFormData({...formData, therapeuticCompanion: {...formData.therapeuticCompanion!, name: e.target.value}})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Teléfono</label>
                                <input type="text" placeholder="Teléfono" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium" value={formData.therapeuticCompanion?.phone} onChange={e => setFormData({...formData, therapeuticCompanion: {...formData.therapeuticCompanion!, phone: e.target.value}})} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Asignación de Staff */}
                <div className="space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-navy/10 text-brand-navy rounded-xl"><Users size={16} /></div>
                        <h4 className="text-[10px] font-black text-brand-navy uppercase tracking-widest">Asignación de Staff</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                        {professionals.map(pro => (
                            <button 
                                key={pro.id} 
                                type="button" 
                                onClick={() => toggleProfessional(pro.id)} 
                                className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${formData.assignedProfessionals?.includes(pro.id) ? 'border-brand-navy bg-white shadow-md' : 'border-transparent bg-white/20 opacity-60 hover:opacity-100'}`}
                            >
                                <img src={pro.avatar} className="w-8 h-8 rounded-xl object-cover ring-2 ring-white" />
                                <div className="text-left min-w-0">
                                   <p className="text-[10px] font-bold text-brand-navy truncate">{pro.name}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-8 bg-white border-t border-brand-sage flex justify-end gap-6 shrink-0">
                <button onClick={() => setShowModal(false)} className="px-8 py-4 rounded-2xl font-bold text-brand-navy/50 hover:text-brand-coral transition-colors text-sm">Cancelar</button>
                <button 
                   onClick={handleSavePatient} 
                   className="px-12 py-4 bg-brand-navy text-white rounded-2xl font-bold shadow-2xl hover:scale-[1.02] transition-all flex items-center gap-3 text-sm"
                >
                   <Save size={20} /> Guardar Legajo
                </button>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && selectedPatient && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-brand-navy/40 backdrop-blur-md p-6">
            <div className="bg-brand-beige w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 border-b border-brand-sage flex justify-between items-center bg-white/50">
                   <div>
                      <h3 className="text-2xl font-display font-bold text-brand-navy">Evolución Clínica</h3>
                      <p className="text-[10px] text-brand-teal font-black uppercase mt-1">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                   </div>
                   <button onClick={() => setShowNoteModal(false)} className="text-brand-navy/30 hover:text-brand-coral p-2"><X size={24} /></button>
                </div>
                <div className="p-10 space-y-6">
                   <textarea 
                     className="w-full bg-white border border-brand-sage rounded-[32px] p-6 text-sm min-h-[220px] outline-none shadow-inner font-medium leading-relaxed italic" 
                     placeholder="Describa el progreso de la sesión de hoy..." 
                     value={newNoteContent} 
                     onChange={(e) => setNewNoteContent(e.target.value)} 
                   />
                </div>
                <div className="p-8 bg-white/80 border-t border-brand-sage flex justify-end gap-4">
                    <button onClick={() => setShowNoteModal(false)} className="px-6 py-3 rounded-2xl font-bold text-brand-navy/40">Cancelar</button>
                    <button onClick={handleAddClinicalNote} disabled={!newNoteContent.trim()} className="bg-brand-navy text-white px-10 py-3 rounded-2xl font-bold shadow-xl flex items-center gap-2 text-xs disabled:opacity-50">
                       <Save size={16} /> Guardar Nota
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
