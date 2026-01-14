
import React, { useState, useMemo } from 'react';
import { Appointment, User, Patient, DocType } from '../types';
import { 
  DollarSign, PieChart as PieIcon, ArrowUpRight, TrendingUp, TrendingDown, 
  Edit3, Check, FileText, Download, Wallet, Clock, Landmark, Filter, Calendar as CalendarIcon, X, Search
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FinanceViewProps {
  appointments: Appointment[];
  professionals: User[];
  patients: Patient[];
  onUpdateProfessionals: (pros: User[]) => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({ appointments, professionals, patients, onUpdateProfessionals }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState<any>('');

  // Estados de filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<DocType | 'Todos'>('Todos');

  // Lógica de filtrado avanzado
  const filteredData = useMemo(() => {
    // 1. Filtrar Sesiones
    const fAppts = appointments.filter(a => {
      const apptDate = a.start.split('T')[0];
      const matchStart = !startDate || apptDate >= startDate;
      const matchEnd = !endDate || apptDate <= endDate;
      const matchPro = !selectedProfessionalId || a.professionalId === selectedProfessionalId;
      const matchPat = !selectedPatientId || a.patientId === selectedPatientId;
      return matchStart && matchEnd && matchPro && matchPat;
    });

    // 2. Filtrar Documentos (para Facturación)
    const fDocs = patients.flatMap(p => {
      const isSelectedPatient = !selectedPatientId || p.id === selectedPatientId;
      // Si se filtra por profesional, mostramos docs de pacientes que el pro tiene asignados
      const isAssignedToPro = !selectedProfessionalId || p.assignedProfessionals.includes(selectedProfessionalId);
      
      if (!isSelectedPatient || !isAssignedToPro) return [];

      return p.documents.filter(d => {
        const matchStart = !startDate || d.date >= startDate;
        const matchEnd = !endDate || d.date <= endDate;
        const matchType = selectedDocType === 'Todos' || d.type === selectedDocType;
        return matchStart && matchEnd && matchType;
      });
    });

    return { appts: fAppts, docs: fDocs };
  }, [appointments, patients, startDate, endDate, selectedPatientId, selectedProfessionalId, selectedDocType]);

  // Cálculos basados en datos filtrados
  const facturacionCobrada = filteredData.docs
    .filter(d => d.type === DocType.FACTURA && d.status === 'pagada')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const facturacionPorCobrar = filteredData.docs
    .filter(d => d.type === DocType.FACTURA && d.status === 'pendiente')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const gananciaProfesionales = filteredData.appts.reduce((sum, a) => {
    const pro = professionals.find(p => p.id === a.professionalId);
    const rate = pro ? (pro.commissionRate / 100) : 0.6;
    return sum + (a.baseValue * rate);
  }, 0);

  const totalSesionesValue = filteredData.appts.reduce((sum, a) => sum + (a.baseValue || 0), 0);
  const gananciaCentro = totalSesionesValue - gananciaProfesionales;

  const stats = [
    { label: 'Factura Cobrada', value: `$${Math.floor(facturacionCobrada).toLocaleString()}`, icon: Check, color: 'bg-brand-teal' },
    { label: 'Factura Por Cobrar', value: `$${Math.floor(facturacionPorCobrar).toLocaleString()}`, icon: Clock, color: 'bg-brand-coral' },
    { label: 'Ganancia Profesionales', value: `$${Math.floor(gananciaProfesionales).toLocaleString()}`, icon: Wallet, color: 'bg-brand-navy' },
    { label: 'Ganancia Centro', value: `$${Math.floor(gananciaCentro).toLocaleString()}`, icon: Landmark, color: 'bg-brand-mint' },
  ];

  const chartData = professionals.filter(p => p.role === 'PROFESSIONAL' || p.id === 'u1').map(pro => {
    const proAppts = filteredData.appts.filter(a => a.professionalId === pro.id);
    const total = proAppts.reduce((sum, a) => sum + (a.baseValue || 0), 0);
    return {
      name: pro.lastName,
      ingresos: total,
      pago: Math.floor(total * (pro.commissionRate / 100))
    };
  });

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedPatientId('');
    setSelectedProfessionalId('');
    setSelectedDocType('Todos');
  };

  const handleSaveRate = () => {
    if (editingId) {
      const updated = professionals.map(p => 
        p.id === editingId ? { ...p, commissionRate: Number(tempRate) || 0 } : p
      );
      onUpdateProfessionals(updated);
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-brand-navy">Gestión Financiera</h2>
          <p className="text-sm text-brand-teal font-medium">Análisis detallado de ingresos recaudados y distribución de honorarios</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-brand-coral text-white px-8 py-4 rounded-[24px] text-sm font-bold shadow-xl shadow-brand-coral/20 hover:scale-[1.02] transition-all flex items-center gap-3"
        >
          <Download size={18} />
          Exportar Informe
        </button>
      </div>

      {/* Panel de Filtros Avanzados */}
      <div className="bg-white p-8 rounded-[40px] border border-brand-sage shadow-sm space-y-6">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-brand-navy text-white rounded-xl"><Filter size={18} /></div>
             <h3 className="text-xs font-black text-brand-navy uppercase tracking-widest">Filtros de Auditoría</h3>
           </div>
           {(startDate || endDate || selectedPatientId || selectedProfessionalId || selectedDocType !== 'Todos') && (
             <button onClick={clearFilters} className="text-[10px] font-black text-brand-coral uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity">
               <X size={14} /> Limpiar Filtros
             </button>
           )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-2">Desde</label>
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal/30" size={14} />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-brand-beige/50 border border-brand-sage rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-brand-navy outline-none focus:ring-4 focus:ring-brand-coral/5" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-2">Hasta</label>
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal/30" size={14} />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-brand-beige/50 border border-brand-sage rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-brand-navy outline-none focus:ring-4 focus:ring-brand-coral/5" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-2">Paciente</label>
            <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} className="w-full bg-brand-beige/50 border border-brand-sage rounded-2xl py-3 px-4 text-xs font-bold text-brand-navy outline-none focus:ring-4 focus:ring-brand-coral/5">
              <option value="">Todos los Pacientes</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-2">Profesional</label>
            <select value={selectedProfessionalId} onChange={e => setSelectedProfessionalId(e.target.value)} className="w-full bg-brand-beige/50 border border-brand-sage rounded-2xl py-3 px-4 text-xs font-bold text-brand-navy outline-none focus:ring-4 focus:ring-brand-coral/5">
              <option value="">Todo el Staff</option>
              {professionals.map(pro => <option key={pro.id} value={pro.id}>{pro.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-brand-teal uppercase tracking-widest ml-2">Documento</label>
            <select value={selectedDocType} onChange={e => setSelectedDocType(e.target.value as any)} className="w-full bg-brand-beige/50 border border-brand-sage rounded-2xl py-3 px-4 text-xs font-bold text-brand-navy outline-none focus:ring-4 focus:ring-brand-coral/5">
              <option value="Todos">Cualquier Tipo</option>
              {Object.values(DocType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] border border-brand-sage shadow-sm flex flex-col gap-6 hover:shadow-lg transition-all border-b-4 border-b-transparent hover:border-b-brand-coral group">
             <div className={`w-14 h-14 rounded-2xl ${s.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <s.icon size={24} />
             </div>
             <div>
                <p className="text-brand-teal text-[10px] font-black uppercase tracking-[0.2em] mb-2">{s.label}</p>
                <h3 className="text-2xl font-black text-brand-navy">{s.value}</h3>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 bg-white p-10 rounded-[48px] border border-brand-sage shadow-sm">
           <div className="flex justify-between items-center mb-12">
             <h3 className="font-display text-2xl font-bold text-brand-navy">Rendimiento por Profesional</h3>
             <div className="flex gap-4">
               <div className="flex items-center gap-2"><div className="w-3 h-3 bg-brand-coral rounded-full"></div><span className="text-[10px] font-black uppercase text-brand-teal">Ingresos</span></div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 bg-brand-mint rounded-full"></div><span className="text-[10px] font-black uppercase text-brand-teal">Reparto</span></div>
             </div>
           </div>
           <div className="h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4a7c74', fontSize: 10, fontWeight: 800}} dy={15} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#4a7c74', fontSize: 10, fontWeight: 800}} />
                 <Tooltip 
                    cursor={{fill: '#fdfaf0', radius: 15}} 
                    contentStyle={{borderRadius: '32px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '24px'}}
                 />
                 <Bar dataKey="ingresos" name="Ingresos Totales" fill="#e58e58" radius={[15, 15, 0, 0]} barSize={45} />
                 <Bar dataKey="pago" name="A Pagar a Prof." fill="#aed8cf" radius={[15, 15, 0, 0]} barSize={45} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-5 bg-white p-10 rounded-[48px] border border-brand-sage shadow-sm flex flex-col">
           <div className="flex justify-between items-center mb-10">
                <h3 className="font-display text-2xl font-bold text-brand-navy">Comisiones</h3>
                <span className="text-[9px] font-black text-brand-teal bg-brand-mint/20 px-4 py-2 rounded-full uppercase tracking-widest">Ajuste de Tasas</span>
           </div>
           <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {professionals.filter(p => p.role === 'PROFESSIONAL' || p.id === 'u1').map((pro) => (
                <div key={pro.id} className="p-6 rounded-[32px] border border-brand-sage/40 bg-brand-beige/20 hover:bg-brand-beige/60 transition-all border-l-4 border-l-brand-teal">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-5">
                        <img src={pro.avatar} className="w-14 h-14 rounded-2xl object-cover ring-4 ring-white shadow-md" alt="" />
                        <div>
                            <p className="text-sm font-bold text-brand-navy">{pro.name}</p>
                            <p className="text-[10px] text-brand-teal font-black uppercase tracking-tighter">{pro.specialty}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {editingId === pro.id ? (
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    className="w-16 bg-white border border-brand-sage rounded-xl p-2.5 text-center text-xs font-bold text-brand-navy shadow-inner"
                                    value={tempRate}
                                    onChange={(e) => setTempRate(e.target.value)}
                                />
                                <button onClick={handleSaveRate} className="p-2.5 bg-brand-mint text-white rounded-2xl shadow-lg hover:scale-110 transition-transform">
                                    <Check size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="text-right flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-xl font-black text-brand-navy">{pro.commissionRate}%</p>
                                    <p className="text-[9px] text-brand-teal font-black uppercase tracking-widest opacity-60">Cuota</p>
                                </div>
                                <button onClick={() => setEditingId(pro.id)} className="p-3 text-brand-teal/30 hover:text-brand-coral hover:bg-white rounded-2xl transition-all shadow-sm">
                                    <Edit3 size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceView;
