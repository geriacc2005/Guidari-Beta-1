
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

  // 1. Recopilar todas las facturas de los legajos de pacientes
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

  // 2. Ingresos Cobrados: Suma de facturas marcadas como 'pagada'
  const facturacionCobrada = useMemo(() => {
    return allInvoices
      .filter(d => d.status === 'pagada')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [allInvoices]);

  // 3. Honorarios Staff: Gasto calculado sobre lo COBRADO (según porcentaje de cada profesional)
  const honorariosStaff = useMemo(() => {
    return allInvoices
      .filter(d => d.status === 'pagada')
      .reduce((sum, d) => {
        const pro = professionals.find(p => p.id === d.professionalId);
        // Si no se encuentra el pro, usamos 60% por defecto (0.6)
        const proRate = pro ? (pro.commissionRate / 100) : 0.6;
        return sum + ((d.amount || 0) * proRate);
      }, 0);
  }, [allInvoices, professionals]);

  // 4. Pendiente de Cobro: Facturas emitidas aún no pagadas
  const facturacionPorCobrar = useMemo(() => {
    return allInvoices
      .filter(d => d.status === 'pendiente')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [allInvoices]);

  // 5. Balance Real Centro: Ingresos Cobrados - Gastos por Honorarios Staff
  const balanceRealCentro = facturacionCobrada - honorariosStaff;

  const stats = [
    { label: 'Ingresos Cobrados', value: `$${Math.floor(facturacionCobrada).toLocaleString()}`, icon: Check, color: 'bg-brand-teal' },
    { label: 'Honorarios Staff (Gasto)', value: `$${Math.floor(honorariosStaff).toLocaleString()}`, icon: Wallet, color: 'bg-brand-coral' },
    { label: 'Pendiente Cobro', value: `$${Math.floor(facturacionPorCobrar).toLocaleString()}`, icon: Clock, color: 'bg-brand-navy' },
    { label: 'Balance Real Centro', value: `$${Math.floor(balanceRealCentro).toLocaleString()}`, icon: Landmark, color: 'bg-brand-mint' },
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
          <p className="text-sm text-brand-teal font-medium">Equilibrio operativo: Ingresos efectivos vs Liquidación de staff</p>
        </div>
        <button onClick={() => window.print()} className="bg-brand-navy text-white px-8 py-4 rounded-[24px] text-sm font-bold shadow-xl flex items-center gap-3">
          <Download size={18} /> Exportar Reporte
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] border border-brand-sage shadow-sm flex flex-col gap-6 group hover:shadow-lg transition-all">
             <div className={`w-14 h-14 rounded-2xl ${s.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <s.icon size={24} />
             </div>
             <div>
                <p className="text-brand-teal text-[10px] font-black uppercase tracking-widest mb-2">{s.label}</p>
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
                 <div><h3 className="font-display text-xl font-bold text-brand-navy">Control de Recaudación</h3><p className="text-[10px] font-black text-brand-teal uppercase tracking-widest mt-1">Sincronización de facturas pagadas</p></div>
              </div>
           </div>
           <div className="flex-1 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                 <thead className="bg-brand-beige/30 border-b border-brand-sage">
                    <tr>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Paciente</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Monto</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center">Gestión</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-brand-beige">
                    {allInvoices.map((doc: any) => (
                       <tr key={doc.id} className="hover:bg-brand-beige/20 transition-colors">
                          <td className="px-6 py-4"><span className="text-xs font-bold text-brand-navy">{doc.patientName}</span></td>
                          <td className="px-6 py-4 text-sm font-black text-brand-navy">${doc.amount?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                             <button onClick={() => toggleInvoiceStatus(doc.id, doc.patientId)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter shadow-sm transition-all ${doc.status === 'pagada' ? 'bg-brand-teal text-white' : 'bg-white text-brand-coral border border-brand-coral/20'}`}>
                                {doc.status === 'pagada' ? <CheckCircle2 size={12} className="inline mr-1" /> : <AlertCircle size={12} className="inline mr-1" />} {doc.status}
                             </button>
                          </td>
                       </tr>
                    ))}
                    {allInvoices.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-20 text-center text-brand-teal/30 text-[10px] font-black uppercase">No hay facturas en el sistema</td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        <div className="lg:col-span-5 bg-white p-10 rounded-[48px] border border-brand-sage shadow-sm flex flex-col">
           <h3 className="font-display text-2xl font-bold text-brand-navy mb-10">Tasas de Honorarios</h3>
           <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {professionals.map((pro) => (
                <div key={pro.id} className="p-6 rounded-[32px] border border-brand-sage/40 bg-brand-beige/20 hover:bg-brand-beige/60 transition-all border-l-4 border-l-brand-teal flex justify-between items-center">
                    <div className="flex items-center gap-5">
                        <img src={pro.avatar} className="w-14 h-14 rounded-2xl object-cover ring-4 ring-white" alt="" />
                        <div><p className="text-sm font-bold text-brand-navy">{pro.name}</p><p className="text-[10px] text-brand-teal font-black uppercase tracking-tighter">{pro.specialty}</p></div>
                    </div>
                    {editingId === pro.id ? (
                        <div className="flex items-center gap-2">
                            <input type="number" className="w-16 bg-white border border-brand-sage rounded-xl p-2.5 text-center text-xs font-bold" value={tempRate} onChange={(e) => setTempRate(e.target.value)} />
                            <button onClick={handleSaveRate} className="p-2.5 bg-brand-mint text-white rounded-2xl shadow-lg"><Check size={18} /></button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="text-right"><p className="text-xl font-black text-brand-navy">{pro.commissionRate}%</p><p className="text-[9px] text-brand-teal font-black uppercase tracking-widest opacity-60">% para profesional</p></div>
                            <button onClick={() => { setEditingId(pro.id); setTempRate(pro.commissionRate); }} className="p-3 text-brand-teal/30 hover:text-brand-coral transition-colors"><Edit3 size={18} /></button>
                        </div>
                    )}
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceView;
