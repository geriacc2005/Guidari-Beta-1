
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Patient, User, UserRole, ClinicalNote, Appointment, ContactPerson } from '../types';
import { 
  Search, Phone, Mail, 
  Calendar, School, Edit2, X, BookOpen, UserPlus, Info, Save, PlusCircle, Camera, Clock, Users, ChevronRight, Image as ImageIcon, Briefcase, GraduationCap, Maximize2
} from 'lucide-react';

interface PatientListProps {
  patients: Patient[];
  professionals: User[];
  currentUser: User;
  onUpdate: (patients: Patient[]) => void;
  appointments: Appointment[];
}

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

const PatientList: React.FC<PatientListProps> = ({ patients, professionals, currentUser, onUpdate, appointments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showFullHistoryModal, setShowFullHistoryModal] = useState(false);
  const [selectedProAgenda, setSelectedProAgenda] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteDate, setNewNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState<Partial<Patient>>(INITIAL_FORM_STATE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser.role === UserRole.ADMIN;

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModal(false);
        setShowNoteModal(false);
        setShowFullHistoryModal(false);
        setSelectedProAgenda(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase());
      const isAssigned = isAdmin || (p.assignedProfessionals && p.assignedProfessionals.includes(currentUser.id));
      return matchesSearch && isAssigned;
    });
  }, [patients, searchTerm, isAdmin, currentUser.id]);

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

  const handleOpenAdd = useCallback(() => {
    if (!isAdmin) return;
    setIsEditing(false);
    setFormData({
      ...INITIAL_FORM_STATE,
      responsible: { name: '', address: '', phone: '', email: '' },
      supportTeacher: { name: '', phone: '', email: '' },
      therapeuticCompanion: { name: '', phone: '', email: '' },
      assignedProfessionals: [],
      clinicalHistory: [],
      documents: []
    });
    setShowModal(true);
  }, [isAdmin]);

  const handleOpenEdit = useCallback((patient: Patient) => {
    if (!isAdmin) return;
    setIsEditing(true);
    setFormData({ ...patient });
    setShowModal(true);
  }, [isAdmin]);

  const handleOpenNote = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
    setNewNoteDate(new Date().toISOString().split('T')[0]);
    setNewNoteContent('');
    setShowNoteModal(true);
  }, []);

  const toggleProfessional = useCallback((proId: string) => {
    if (!isAdmin) return;
    setFormData(prev => {
      const current = prev.assignedProfessionals || [];
      const updated = current.includes(proId)
        ? current.filter(id => id !== proId)
        : current.length < 12 ? [...current, proId] : current;
      return { ...prev, assignedProfessionals: updated };
    });
  }, [isAdmin]);

  const handleSavePatient = useCallback(() => {
    if (!formData.firstName || !formData.lastName) {
      alert("Por favor ingrese al menos el nombre y apellido del paciente.");
      return;
    }

    let updatedPatientsList: Patient[];
    if (isEditing && formData.id) {
      updatedPatientsList = patients.map(p => p.id === formData.id ? { ...p, ...formData } as Patient : p);
      if (selectedPatient?.id === formData.id) {
        setSelectedPatient({ ...selectedPatient, ...formData } as Patient);
      }
    } else {
      const newPatient: Patient = {
        ...INITIAL_FORM_STATE,
        ...formData,
        id: 'p' + (Date.now()),
        clinicalHistory: [],
        documents: []
      } as Patient;
      updatedPatientsList = [...patients, newPatient];
    }
    
    onUpdate(updatedPatientsList);
    setShowModal(false);
  }, [formData, isEditing, patients, onUpdate, selectedPatient]);

  const handleAddClinicalNote = useCallback(() => {
    if (!selectedPatient || !newNoteContent.trim()) return;

    const newNote: ClinicalNote = {
      id: 'note-' + Date.now(),
      date: new Date(newNoteDate + 'T12:00:00').toISOString(),
      professionalId: currentUser.id,
      content: newNoteContent
    };

    const updatedHistory = [newNote, ...(selectedPatient.clinicalHistory || [])];
    updatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const updatedPatient = {
      ...selectedPatient,
      clinicalHistory: updatedHistory
    };

    const updatedPatientsList = patients.map(p => p.id === selectedPatient.id ? updatedPatient : p);
    onUpdate(updatedPatientsList);
    setSelectedPatient(updatedPatient);
    setNewNoteContent('');
    setShowNoteModal(false);
  }, [selectedPatient, newNoteContent, newNoteDate, currentUser.id, patients, onUpdate]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-display font-bold text-brand-navy">Pacientes</h2>
          <p className="text-sm text-brand-teal font-medium">Gestión unificada de historias clínicas y staff interdisciplinario</p>
        </div>
        {isAdmin && (
          <button 
            onClick={handleOpenAdd}
            className="bg-brand-coral text-white px-8 py-3.5 rounded-2xl flex items-center gap-3 font-bold shadow-xl shadow-brand-coral/20 hover:scale-[1.02] transition-all"
          >
            <UserPlus size={20} />
            Nuevo Paciente
          </button>
        )}
      </div>

      <div className="bg-white p-1 rounded-[40px] border border-brand-sage shadow-sm shrink-0">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-teal/40 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o apellido..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none py-5 pl-16 pr-8 focus:outline-none text-brand-navy font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
        <div className="lg:col-span-8 bg-white rounded-[40px] border border-brand-sage shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-brand-beige/50 border-b border-brand-sage sticky top-0 z-10">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-brand-teal uppercase tracking-[0.2em]">Paciente</th>
                  <th className="px-8 py-5 text-[10px] font-black text-brand-teal uppercase tracking-[0.2em]">Cobertura</th>
                  <th className="px-8 py-5 text-[10px] font-black text-brand-teal uppercase tracking-[0.2em]">Equipo Tratante</th>
                  <th className="px-8 py-5 text-[10px] font-black text-brand-teal uppercase tracking-[0.2em] text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige">
                {filteredPatients.map(p => (
                  <tr 
                    key={p.id} 
                    onClick={() => setSelectedPatient(p)}
                    className={`hover:bg-brand-mint/10 transition-colors cursor-pointer group ${selectedPatient?.id === p.id ? 'bg-brand-mint/5' : ''}`}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <img src={p.avatar || `https://picsum.photos/seed/${p.id}/100`} className="w-10 h-10 rounded-2xl object-cover ring-2 ring-brand-beige group-hover:ring-brand-coral transition-all" alt="" />
                        <div>
                          <p className="text-sm font-bold text-brand-navy">{p.firstName} {p.lastName}</p>
                          <p className="text-[10px] text-brand-teal/60 font-medium truncate max-w-[150px]">{p.diagnosis}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[9px] font-black px-3 py-1.5 rounded-full ${p.insurance === 'Particular' ? 'bg-brand-coral/10 text-brand-coral' : 'bg-brand-teal/10 text-brand-teal'}`}>
                        {p.insurance.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex -space-x-2">
                        {p.assignedProfessionals?.map(proId => {
                          const pro = professionals.find(pr => pr.id === proId);
                          return (
                            <img key={proId} src={pro?.avatar} title={`${pro?.name} (${pro?.specialty})`} className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:z-10 transition-transform hover:scale-110" />
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                         {isAdmin && <button onClick={(e) => {e.stopPropagation(); handleOpenEdit(p);}} className="p-2 text-brand-teal/40 hover:text-brand-coral hover:bg-brand-beige rounded-xl transition-all" title="Editar"><Edit2 size={16} /></button>}
                         <button onClick={(e) => {e.stopPropagation(); handleOpenNote(p);}} className="p-2 text-brand-teal/40 hover:text-brand-navy hover:bg-brand-beige rounded-xl transition-all" title="Agregar Evolución"><PlusCircle size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-[40px] border border-brand-sage shadow-sm overflow-y-auto custom-scrollbar p-10 flex flex-col">
          {selectedPatient ? (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center relative">
                <div className="inline-block relative">
                    <img src={selectedPatient.avatar || `https://picsum.photos/seed/${selectedPatient.id}/200`} className="w-24 h-24 rounded-[32px] object-cover mx-auto shadow-xl ring-4 ring-brand-beige" />
                    {isAdmin && (
                      <button 
                        onClick={() => handleOpenEdit(selectedPatient)}
                        className="absolute -top-1 -right-1 bg-brand-navy text-white p-2.5 rounded-2xl shadow-lg hover:bg-brand-coral transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                </div>
                <h3 className="mt-4 text-2xl font-display font-bold text-brand-navy">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                <p className="text-xs text-brand-teal font-black uppercase tracking-[0.2em] mt-1">{selectedPatient.insurance}</p>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-brand-beige rounded-[32px] space-y-4 border border-brand-sage/30">
                  <div className="flex items-center gap-4 text-sm text-brand-navy font-medium">
                    <Calendar size={18} className="text-brand-coral" />
                    <span>Nacimiento: <b className="ml-1">{new Date(selectedPatient.dateOfBirth).toLocaleDateString('es-AR')}</b></span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-brand-navy font-medium">
                    <School size={18} className="text-brand-teal" />
                    <span>Escuela: <b className="ml-1">{selectedPatient.school || 'No registrada'}</b></span>
                  </div>
                  <div className="flex items-start gap-4 text-sm text-brand-navy font-medium">
                    <BookOpen size={18} className="text-brand-navy/40 mt-1" />
                    <span className="leading-tight">Diagnóstico: <b className="ml-1">{selectedPatient.diagnosis}</b></span>
                  </div>
                </div>

                <div className="pt-4">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[10px] font-black text-brand-teal uppercase tracking-[0.3em] ml-1">Historia Clínica</h4>
                        <div className="flex gap-2">
                           <button onClick={() => setShowFullHistoryModal(true)} className="p-2 text-brand-navy/40 hover:text-brand-navy hover:bg-brand-beige rounded-xl transition-all" title="Ver Historial Completo"><Maximize2 size={16} /></button>
                           <button onClick={() => handleOpenNote(selectedPatient)} className="flex items-center gap-1.5 text-brand-coral font-bold text-[10px] uppercase tracking-tighter hover:scale-105 transition-transform"><PlusCircle size={14} /> Nueva</button>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {(selectedPatient.clinicalHistory && selectedPatient.clinicalHistory.length > 0) ? selectedPatient.clinicalHistory.slice(0, 3).map(note => {
                            const pro = professionals.find(pr => pr.id === note.professionalId);
                            return (
                                <div key={note.id} className="p-5 bg-white rounded-[28px] border border-brand-sage shadow-sm hover:border-brand-coral transition-all">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <img src={pro?.avatar} className="w-5 h-5 rounded-lg" />
                                            <span className="text-[10px] font-black text-brand-navy uppercase tracking-tighter">{pro?.name || 'Profesional'}</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-brand-teal bg-brand-sage/30 px-2 py-0.5 rounded-lg">{new Date(note.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-brand-navy/80 text-xs leading-relaxed italic line-clamp-3 break-words overflow-wrap-anywhere">"{note.content}"</p>
                                </div>
                            );
                        }) : (
                            <div className="p-8 text-center text-brand-teal/30 bg-brand-beige/30 rounded-[32px] border border-dashed border-brand-sage">
                                <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Sin registros previos</p>
                            </div>
                        )}
                        {selectedPatient.clinicalHistory && selectedPatient.clinicalHistory.length > 3 && (
                          <button onClick={() => setShowFullHistoryModal(true)} className="w-full text-center text-[10px] font-black text-brand-teal uppercase tracking-widest py-2 hover:text-brand-coral transition-colors">Ver historial completo</button>
                        )}
                    </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-brand-teal/20 gap-6 text-center">
              <div className="p-10 bg-brand-beige rounded-[60px] border-4 border-dashed border-brand-sage/50">
                <Users size={80} strokeWidth={1} />
              </div>
              <div>
                <p className="text-xl font-display font-bold text-brand-teal/40">Legajo Digital</p>
                <p className="text-sm mt-2 font-medium">Seleccione un paciente para ver su ficha completa.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showFullHistoryModal && selectedPatient && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-navy/50 backdrop-blur-md p-4 sm:p-10">
           <div className="bg-brand-beige w-full max-w-5xl h-full max-h-[90vh] rounded-[56px] shadow-3xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
              <div className="p-8 sm:p-10 border-b border-brand-sage flex justify-between items-center bg-white/50 shrink-0">
                 <div className="flex items-center gap-6">
                    <img src={selectedPatient.avatar || `https://picsum.photos/seed/${selectedPatient.id}/200`} className="w-16 h-16 rounded-3xl object-cover ring-4 ring-white shadow-xl" />
                    <div>
                        <h3 className="text-3xl font-display font-bold text-brand-navy">Historial Clínico</h3>
                        <p className="text-[11px] text-brand-teal font-black uppercase mt-1 tracking-widest">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowFullHistoryModal(false)} className="w-12 h-12 flex items-center justify-center hover:bg-white rounded-2xl text-brand-navy/30 hover:text-brand-coral transition-all"><X size={32} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 space-y-8 bg-brand-beige/30">
                 {selectedPatient.clinicalHistory && selectedPatient.clinicalHistory.length > 0 ? selectedPatient.clinicalHistory.map((note, index) => {
                    const pro = professionals.find(pr => pr.id === note.professionalId);
                    return (
                      <div key={note.id} className="relative pl-10 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                         <div className="absolute left-0 top-0 bottom-0 w-px bg-brand-sage"></div>
                         <div className="absolute left-[-5px] top-6 w-3 h-3 rounded-full bg-brand-coral ring-4 ring-brand-beige shadow-sm"></div>
                         
                         <div className="bg-white p-6 sm:p-8 rounded-[40px] border border-brand-sage shadow-sm hover:shadow-lg hover:border-brand-coral/30 transition-all">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                               <div className="flex items-center gap-4">
                                  <img src={pro?.avatar} className="w-10 h-10 rounded-2xl ring-2 ring-brand-beige shadow-sm" />
                                  <div>
                                     <p className="text-sm font-bold text-brand-navy">{pro?.name || 'Profesional'}</p>
                                     <p className="text-[10px] text-brand-teal font-black uppercase tracking-widest">{pro?.specialty || 'Staff'}</p>
                                  </div>
                               </div>
                               <div className="text-left sm:text-right">
                                  <p className="text-xs font-black text-brand-navy">{new Date(note.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                  <p className="text-[10px] text-brand-teal/40 font-bold uppercase mt-1">{new Date(note.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs</p>
                               </div>
                            </div>
                            <div className="max-w-none">
                               <p className="text-brand-navy/80 leading-relaxed text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere italic">"{note.content}"</p>
                            </div>
                         </div>
                      </div>
                    );
                 }) : (
                    <div className="h-full flex flex-col items-center justify-center text-brand-teal/20 gap-6 py-20">
                       <BookOpen size={100} strokeWidth={1} />
                       <p className="text-xl font-display font-bold">Sin evoluciones registradas</p>
                    </div>
                 )}
              </div>
              
              <div className="p-8 bg-white/80 border-t border-brand-sage flex justify-end shrink-0">
                 <button onClick={() => { setShowFullHistoryModal(false); handleOpenNote(selectedPatient); }} className="bg-brand-coral text-white px-10 py-4 rounded-[28px] font-bold shadow-xl shadow-brand-coral/20 hover:scale-[1.05] transition-all flex items-center gap-3 text-sm">
                    <PlusCircle size={20} /> Agregar Nueva Evolución
                 </button>
              </div>
           </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-navy/30 backdrop-blur-md p-6 overflow-y-auto">
          <div className="bg-brand-beige w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in duration-300 max-h-[95vh]">
            <div className="p-6 border-b border-brand-sage flex justify-between items-center bg-white/50 shrink-0">
                <h3 className="text-2xl font-display font-bold text-brand-navy">{isEditing ? 'Modificar Legajo' : 'Alta de Paciente'}</h3>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl text-brand-navy/30 hover:text-brand-coral transition-all"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-8 bg-white/40 p-6 rounded-[32px] border border-brand-sage/30">
                   <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-20 h-20 rounded-[28px] overflow-hidden ring-4 ring-white shadow-lg bg-brand-mint/20 flex items-center justify-center transition-all group-hover:scale-105">
                          {formData.avatar ? (
                            <img src={formData.avatar} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={28} className="text-brand-teal/40" />
                          )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-brand-navy text-white p-2 rounded-xl shadow-lg">
                          <Camera size={12} />
                      </div>
                   </div>
                   <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Nombres *</label>
                          <input type="text" placeholder="Mateo" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium outline-none" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-1">Apellidos *</label>
                          <input type="text" placeholder="Lopez" className="w-full bg-white border border-brand-sage rounded-xl p-3 text-xs font-medium outline-none" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                      </div>
                   </div>
                   <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-3 bg-white/40 p-5 rounded-[28px] border border-brand-sage/30">
                        <div className="flex items-center gap-2 mb-1">
                           <div className="p-1.5 bg-brand-coral/10 text-brand-coral rounded-lg"><Info size={12} /></div>
                           <h4 className="text-[9px] font-black text-brand-navy uppercase tracking-widest">Identificación</h4>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-brand-teal uppercase tracking-widest ml-1">Nacimiento</label>
                                <input type="date" className="w-full bg-white border border-brand-sage rounded-xl p-2.5 text-xs font-medium" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-brand-teal uppercase tracking-widest ml-1">DNI / Afiliado</label>
                                <input type="text" placeholder="00.000.000" className="w-full bg-white border border-brand-sage rounded-xl p-2.5 text-xs font-medium" value={formData.affiliateNumber} onChange={e => setFormData({...formData, affiliateNumber: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 bg-white/40 p-5 rounded-[28px] border border-brand-sage/30">
                        <div className="flex items-center gap-2 mb-1">
                           <div className="p-1.5 bg-brand-teal/10 text-brand-teal rounded-lg"><GraduationCap size={12} /></div>
                           <h4 className="text-[9px] font-black text-brand-navy uppercase tracking-widest">Cobertura</h4>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-brand-teal uppercase tracking-widest ml-1">Obra Social</label>
                                <input type="text" placeholder="Ej: OSDE" className="w-full bg-white border border-brand-sage rounded-xl p-2.5 text-xs font-medium" value={formData.insurance} onChange={e => setFormData({...formData, insurance: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-brand-teal uppercase tracking-widest ml-1">Escuela</label>
                                <input type="text" placeholder="Escuela" className="w-full bg-white border border-brand-sage rounded-xl p-2.5 text-xs font-medium" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 bg-white/40 p-5 rounded-[28px] border border-brand-sage/30">
                        <div className="flex items-center gap-2 mb-1">
                           <div className="p-1.5 bg-brand-navy/10 text-brand-navy rounded-lg"><BookOpen size={12} /></div>
                           <h4 className="text-[9px] font-black text-brand-navy uppercase tracking-widest">Diagnóstico</h4>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-brand-teal uppercase tracking-widest ml-1">Observaciones</label>
                            <textarea placeholder="Motivo de consulta..." className="w-full bg-white border border-brand-sage rounded-xl p-2.5 text-xs font-medium min-h-[85px] resize-none" value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3 bg-white/40 p-5 rounded-[28px] border border-brand-sage/30">
                        <div className="flex items-center gap-2 mb-1">
                           <div className="p-1.5 bg-brand-mint/20 text-brand-teal rounded-lg"><GraduationCap size={12} /></div>
                           <h4 className="text-[9px] font-black text-brand-navy uppercase tracking-widest">Maestra de Apoyo</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Nombre" className="w-full bg-white border border-brand-sage rounded-xl p-2.5 text-xs font-medium" value={formData.supportTeacher?.name} onChange={e => setFormData({...formData, supportTeacher: { ...formData.supportTeacher!, name: e.target.value}})} />
                            <input type="text" placeholder="Teléfono" className="w-full bg-white border border-brand-sage rounded-xl p-2.5 text-xs font-medium" value={formData.supportTeacher?.phone} onChange={e => setFormData({...formData, supportTeacher: { ...formData.supportTeacher!, phone: e.target.value}})} />
                        </div>
                    </div>
                    <div className="space-y-3 bg-white/40 p-5 rounded-[28px] border border-brand-sage/30">
                        <div className="flex items-center gap-2 mb-1">
                           <div className="p-1.5 bg-brand-coral/10 text-brand-coral rounded-lg"><Briefcase size={12} /></div>
                           <h4 className="text-[9px] font-black text-brand-navy uppercase tracking-widest">Acompañante Terapéutico</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Nombre" className="w-full bg-white border border-brand-sage rounded-xl p-2.5 text-xs font-medium" value={formData.therapeuticCompanion?.name} onChange={e => setFormData({...formData, therapeuticCompanion: { ...formData.therapeuticCompanion!, name: e.target.value}})} />
                            <input type="text" placeholder="Teléfono" className="w-full bg-white border border-brand-sage rounded-xl p-2.5 text-xs font-medium" value={formData.therapeuticCompanion?.phone} onChange={e => setFormData({...formData, therapeuticCompanion: { ...formData.therapeuticCompanion!, phone: e.target.value}})} />
                        </div>
                    </div>
                </div>

                {isAdmin && (
                  <div className="space-y-4">
                      <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-brand-navy/10 text-brand-navy rounded-lg"><Users size={12} /></div>
                          <h4 className="text-[9px] font-black text-brand-navy uppercase tracking-widest">Asignación de Staff</h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[150px] overflow-y-auto custom-scrollbar p-1">
                          {professionals.map(pro => (
                              <button 
                                  key={pro.id} 
                                  type="button" 
                                  onClick={() => toggleProfessional(pro.id)} 
                                  className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all ${formData.assignedProfessionals?.includes(pro.id) ? 'border-brand-teal bg-white' : 'border-transparent bg-white/30 opacity-60'}`}
                              >
                                  <img src={pro.avatar} className="w-6 h-6 rounded-lg object-cover" />
                                  <p className="text-[9px] font-bold text-brand-navy truncate">{pro.name}</p>
                              </button>
                          ))}
                      </div>
                  </div>
                )}
            </div>

            <div className="p-6 bg-white/80 border-t border-brand-sage flex justify-end gap-4 shrink-0">
                <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-brand-navy/50 hover:text-brand-coral transition-colors text-xs">Cancelar</button>
                <button onClick={handleSavePatient} className="px-10 py-3 bg-brand-navy text-white rounded-xl font-bold shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 text-xs"><Save size={16} /> Guardar Legajo</button>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && selectedPatient && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-brand-navy/40 backdrop-blur-md p-6">
            <div className="bg-brand-beige w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 border-b border-brand-sage flex justify-between items-center bg-white/50 shrink-0">
                    <div>
                        <h3 className="text-2xl font-display font-bold text-brand-navy">Evolución Clínica</h3>
                        <p className="text-[10px] text-brand-teal font-black uppercase mt-1">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                    </div>
                    <button onClick={() => setShowNoteModal(false)} className="text-brand-navy/30 hover:text-brand-coral transition-colors"><X size={24} /></button>
                </div>
                <div className="p-10 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-2">Fecha de la Sesión</label>
                      <input 
                        type="date" 
                        className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-bold outline-none" 
                        value={newNoteDate}
                        onChange={(e) => setNewNoteDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-2">Observaciones Clínicas</label>
                      <textarea 
                          className="w-full bg-white border border-brand-sage rounded-[32px] p-6 text-sm min-h-[180px] outline-none font-medium leading-relaxed shadow-inner break-words overflow-wrap-anywhere"
                          placeholder="Describa el progreso de la sesión..."
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                      />
                    </div>
                </div>
                <div className="p-8 bg-white/80 border-t border-brand-sage flex justify-end gap-4 shrink-0">
                    <button onClick={() => setShowNoteModal(false)} className="px-6 py-3 rounded-2xl font-bold text-brand-navy/40 hover:text-brand-coral transition-colors text-xs">Cancelar</button>
                    <button onClick={handleAddClinicalNote} disabled={!newNoteContent.trim()} className="bg-brand-navy text-white px-10 py-3 rounded-2xl font-bold shadow-xl hover:scale-[1.02] disabled:opacity-50 transition-all flex items-center gap-2 text-xs">
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
