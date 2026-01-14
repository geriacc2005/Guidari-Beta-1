
import React, { useState, useMemo } from 'react';
import { Appointment, User, Patient, DocType, Document } from '../types';
import { 
  DollarSign, Check, FileText, Download, Wallet, Clock, Landmark, 
  Edit3, CheckCircle2, AlertCircle, FileCheck
} from 'lucide-react';

interface FinanceViewProps {
  appointments: Appointment[];
  professionals: User[];
  patients: Patient[];
  onUpdateProfessionals: (pros: User[]) => void;
  onUpdatePatients: (patients: Patient[]) => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({ 
  appointments, professionals, patients, onUpdateProfessionals, onUpdatePatients 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState<any>('');

  // Cálculos globales (sin filtros como solicitado)
  const allInvoices = useMemo(() => {
    return patients.flatMap(p => 
      p.documents
        .filter(d => d.type === DocType.FACTURA)
        .map(d => ({ 
          ...d, 
          patientName: `${p.firstName} ${p.lastName}`,
          patientId: p.id 
        }))
    );
  }, [patients]);

  const facturacionCobrada = useMemo(() => {
    return allInvoices
      .filter(d => d.status === 'pagada')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [allInvoices]);

  const facturacionPorCobrar = useMemo(() => {
    return allInvoices
      .filter(d => d.status === 'pendiente')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [allInvoices]);

  const gananciaProfesionales = useMemo(() => {
    return appointments.reduce((sum, a) => {
      const pro = professionals.find(p => p.id === a.professionalId);
      const rate = pro ? (pro.commissionRate / 100) : 0.6;
      return sum + (a.baseValue * rate);
    }, 0);
  }, [appointments, professionals]);

  // Ganancia Centro = Ingresos Reales - Honorarios Comprometidos
  const gananciaCentro = facturacionCobrada - gananciaProfesionales;

  const stats = [
    { label: 'Factura Cobrada', value: `$${Math.floor(facturacionCobrada).toLocaleString()}`, icon: Check, color: 'bg-brand-teal' },
    { label: 'Factura Por Cobrar', value: `$${Math.floor(facturacionPorCobrar).toLocaleString()}`, icon: Clock, color: 'bg-brand-coral' },
    { label: 'Honorarios Staff', value: `$${Math.floor(gananciaProfesionales).toLocaleString()}`, icon: Wallet, color: 'bg-brand-navy' },
    { label: 'Balance Centro', value: `$${Math.floor(gananciaCentro).toLocaleString()}`, icon: Landmark, color: 'bg-brand-mint' },
  ];

  const handleSaveRate = () => {
    if (editingId) {
      const updated = professionals.map(p => 
        p.id === editingId ? { ...p, commissionRate: Number(tempRate) || 0 } : p
      );
      onUpdateProfessionals(updated);
      setEditingId(null);
    }
  };

  const toggleInvoiceStatus = (docId: string, patientId: string) => {
    const updatedPatients = patients.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          documents: p.documents.map(d => 
            d.id === docId 
            ? { ...d, status: (d.status === 'pagada' ? 'pendiente' : 'pagada') as any } 
            : d
          )
        };
      }
      return p;
    });
    onUpdatePatients(updatedPatients);
  };

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-brand-navy">Gestión Financiera</h2>
          <p className="text-sm text-brand-teal font-medium">Análisis de ingresos efectivos y distribución de honorarios del equipo</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-brand-coral text-white px-8 py-4 rounded-[24px] text-sm font-bold shadow-xl shadow-brand-coral/20 hover:scale-[1.02] transition-all flex items-center gap-3"
        >
          <Download size={18} />
          Exportar Informe
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] border border-brand-sage shadow-sm flex flex-col gap-6 hover:shadow-lg transition-all group">
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
        <div className="lg:col-span-7 bg-white p-8 rounded-[48px] border border-brand-sage shadow-sm flex flex-col overflow-hidden">
           <div className="flex justify-between items-center mb-8 px-2 pt-2">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-brand-coral/10 text-brand-coral rounded-2xl"><FileCheck size={22} /></div>
                 <div>
                    <h3 className="font-display text-xl font-bold text-brand-navy">Libro de Facturación</h3>
                    <p className="text-[10px] font-black text-brand-teal uppercase tracking-widest mt-1">Gestión de ingresos por paciente</p>
                 </div>
              </div>
              <span className="text-[9px] font-black bg-brand-beige px-4 py-2 rounded-full text-brand-navy/40 uppercase tracking-tighter">
                {allInvoices.length} Comprobantes registrados
              </span>
           </div>

           <div className="flex-1 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                 <thead className="bg-brand-beige/30 border-b border-brand-sage">
                    <tr>
                       <th className="px-6 py-4 text-[9px] font-black text-brand-teal uppercase tracking-widest">Paciente</th>
                       <th className="px-6 py-4 text-[9px] font-black text-brand-teal uppercase tracking-widest">Fecha</th>
                       <th className="px-6 py-4 text-[9px] font-black text-brand-teal uppercase tracking-widest">Monto</th>
                       <th className="px-6 py-4 text-[9px] font-black text-brand-teal uppercase tracking-widest text-center">Acción</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-brand-beige">
                    {allInvoices.map((doc: any) => (
                       <tr key={doc.id} className="hover:bg-brand-beige/20 transition-colors">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-brand-navy">{doc.patientName}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-brand-teal">{doc.date}</td>
                          <td className="px-6 py-4 text-sm font-black text-brand-navy">${doc.amount?.toLocaleString()}</td>
                          <td className="px-6 py-4">
                             <div className="flex justify-center">
                                <button 
                                   onClick={() => toggleInvoiceStatus(doc.id, doc.patientId)}
                                   className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all shadow-sm ${
                                      doc.status === 'pagada' 
                                      ? 'bg-brand-teal text-white border border-brand-teal/20' 
                                      : 'bg-white text-brand-coral border border-brand-coral/20 hover:bg-brand-coral/5'
                                   }`}
                                >
                                   {doc.status === 'pagada' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                   {doc.status}
                                </button>
                             </div>
                          </td>
                       </tr>
                    ))}
                    {allInvoices.length === 0 && (
                       <tr>
                          <td colSpan={4} className="py-20 text-center">
                             <FileText size={48} className="mx-auto text-brand-teal/10 mb-4" />
                             <p className="text-[10px] font-black text-brand-teal/30 uppercase tracking-[0.2em]">No hay facturas cargadas en el sistema</p>
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        <div className="lg:col-span-5 bg-white p-10 rounded-[48px] border border-brand-sage shadow-sm flex flex-col">
           <div className="flex justify-between items-center mb-10">
                <h3 className="font-display text-2xl font-bold text-brand-navy">Tasas de Honorarios</h3>
                <span className="text-[9px] font-black text-brand-teal bg-brand-mint/20 px-4 py-2 rounded-full uppercase tracking-widest">Liquidación</span>
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
                                    <p className="text-[9px] text-brand-teal font-black uppercase tracking-widest opacity-60">Retorno</p>
                                </div>
                                <button onClick={() => { setEditingId(pro.id); setTempRate(pro.commissionRate); }} className="p-3 text-brand-teal/30 hover:text-brand-coral hover:bg-white rounded-2xl transition-all shadow-sm">
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
