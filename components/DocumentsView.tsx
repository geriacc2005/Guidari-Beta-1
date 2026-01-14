
import React, { useState, useRef, useEffect } from 'react';
import { Patient, Document, DocType } from '../types';
import { 
  Search, Plus, FileText, Download, Trash2, X, UploadCloud, Filter, 
  CheckCircle2, AlertCircle, FileCheck, FileCode, FileSpreadsheet, 
  ChevronDown, ChevronUp, ExternalLink, Calendar
} from 'lucide-react';

interface DocumentsViewProps {
  patients: Patient[];
  onUpdatePatients: (patients: Patient[]) => void;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({ patients, onUpdatePatients }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterType, setFilterType] = useState<DocType | 'Todos'>('Todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [uploadData, setUploadData] = useState({
    patientId: '',
    type: DocType.FACTURA,
    name: '',
    amount: '' as any,
    receiptNumber: '',
    isPaid: false
  });

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUploadModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const allDocuments: (Document & { patientName: string })[] = patients.flatMap(p => 
    p.documents.map(d => ({ ...d, patientName: `${p.firstName} ${p.lastName}` }))
  );

  const filteredDocs = allDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         doc.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'Todos' || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleUpload = () => {
    if (!uploadData.patientId || (!uploadData.name && !selectedFile)) return;

    const newDoc: Document = {
      id: 'doc' + Math.random().toString(36).substr(2, 9),
      patientId: uploadData.patientId,
      type: uploadData.type,
      name: uploadData.name || (selectedFile ? selectedFile.name : 'Documento Sin Nombre'),
      date: new Date().toISOString().split('T')[0],
      url: selectedFile ? URL.createObjectURL(selectedFile) : '#',
      amount: uploadData.type === DocType.FACTURA ? (Number(uploadData.amount) || 0) : undefined,
      receiptNumber: uploadData.type === DocType.FACTURA ? uploadData.receiptNumber : undefined,
      status: uploadData.type === DocType.FACTURA ? (uploadData.isPaid ? 'pagada' : 'pendiente') : undefined
    };

    const updatedPatients = patients.map(p => 
      p.id === uploadData.patientId 
      ? { ...p, documents: [...p.documents, newDoc] } 
      : p
    );

    onUpdatePatients(updatedPatients);
    setShowUploadModal(false);
    setUploadData({ patientId: '', type: DocType.FACTURA, name: '', amount: '', receiptNumber: '', isPaid: false });
    setSelectedFile(null);
  };

  const togglePaidStatus = (docId: string, patientId: string) => {
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

  const getDocIcon = (type: DocType) => {
    switch (type) {
      case DocType.FACTURA: return <FileCheck size={20} />;
      case DocType.PLANILLA: return <FileSpreadsheet size={20} />;
      case DocType.INFORME: return <FileText size={20} />;
      default: return <FileCode size={20} />;
    }
  };

  const getDocColors = (type: DocType) => {
    switch (type) {
      case DocType.FACTURA: return 'bg-brand-coral/10 text-brand-coral border-brand-coral/20';
      case DocType.PLANILLA: return 'bg-blue-50 text-blue-600 border-blue-100';
      case DocType.INFORME: return 'bg-brand-teal/10 text-brand-teal border-brand-teal/20';
      default: return 'bg-brand-navy/10 text-brand-navy border-brand-navy/20';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-brand-navy">Documentos</h2>
          <p className="text-sm text-brand-teal font-medium">Gestión administrativa centralizada</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="w-full sm:w-auto bg-brand-navy text-white px-6 sm:px-8 py-3.5 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl shadow-brand-navy/20 hover:scale-[1.02] transition-all"
        >
          <Plus size={20} />
          Subir PDF
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white p-1 rounded-3xl border border-brand-sage shadow-sm flex items-center px-4">
          <Search className="text-brand-teal/40 mr-2 shrink-0" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por archivo o paciente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none py-3 sm:py-4 focus:outline-none text-brand-navy placeholder-brand-teal/40 font-medium text-sm"
          />
        </div>
        <div className="bg-white px-4 rounded-3xl border border-brand-sage shadow-sm flex items-center gap-3 min-w-full md:min-w-[240px]">
          <Filter size={18} className="text-brand-teal/40" />
          <select 
            className="bg-transparent border-none py-3 sm:py-4 w-full focus:outline-none text-brand-navy text-sm font-bold"
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
          >
            <option value="Todos">Todos los tipos</option>
            {Object.values(DocType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredDocs.length > 0 ? filteredDocs.map((doc: any) => (
          <div 
            key={doc.id} 
            className="bg-white rounded-[24px] sm:rounded-[40px] border border-brand-sage shadow-sm hover:shadow-md transition-all group overflow-hidden"
          >
            {/* Cabecera Principal de la Tarjeta */}
            <div className="p-4 sm:p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`p-3 rounded-xl sm:rounded-2xl ${getDocColors(doc.type).split(' ')[0]} shrink-0`}>
                  {getDocIcon(doc.type)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-lg font-bold text-brand-navy truncate group-hover:text-brand-coral transition-colors">{doc.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] sm:text-xs font-medium text-brand-teal uppercase tracking-widest truncate">{doc.patientName}</span>
                    <span className="hidden sm:inline text-brand-sage">•</span>
                    <span className={`hidden sm:inline text-[9px] font-black px-2 py-0.5 rounded-lg border ${getDocColors(doc.type)}`}>
                      {doc.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                  className="p-2 text-brand-teal/40 hover:text-brand-navy bg-brand-beige/50 rounded-xl transition-all"
                >
                  {expandedId === doc.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                <div className="hidden sm:flex gap-2">
                   <a href={doc.url} download className="p-2 text-brand-teal/40 hover:text-brand-navy transition-all"><Download size={18} /></a>
                   <button className="p-2 text-brand-teal/40 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>

            {/* Panel Expandible (Acordeón) */}
            {expandedId === doc.id && (
              <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-300 border-t border-brand-beige/50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-brand-teal uppercase tracking-widest flex items-center gap-1.5"><Calendar size={10} /> Fecha</p>
                    <p className="text-xs font-bold text-brand-navy">{doc.date}</p>
                  </div>
                  {doc.type === DocType.FACTURA && (
                    <>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-brand-teal uppercase tracking-widest flex items-center gap-1.5">Monto</p>
                        <p className="text-lg font-black text-brand-navy">${doc.amount?.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-brand-teal uppercase tracking-widest flex items-center gap-1.5">Estado Pago</p>
                        <button 
                          onClick={() => togglePaidStatus(doc.id, doc.patientId)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
                            doc.status === 'pagada' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
                          }`}
                        >
                          {doc.status === 'pagada' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {doc.status}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex sm:hidden gap-3 pt-4 border-t border-brand-beige">
                  <a href={doc.url} download className="flex-1 bg-brand-navy text-white py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold shadow-lg">
                    <Download size={16} /> Descargar
                  </a>
                  <button className="p-3 text-red-500 bg-red-50 rounded-xl">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )) : (
          <div className="bg-white rounded-[40px] border border-brand-sage p-20 flex flex-col items-center justify-center text-center">
            <div className="p-8 bg-brand-beige rounded-[48px] mb-6">
              <FileText size={48} className="text-brand-teal/20" />
            </div>
            <h3 className="text-xl font-display font-bold text-brand-navy">No se encontraron documentos</h3>
            <p className="text-sm text-brand-teal mt-2 max-w-xs">Intenta ajustar los filtros o sube un nuevo archivo.</p>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-navy/30 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
          <div className="bg-brand-beige w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 my-auto">
             <div className="p-6 sm:p-8 border-b border-brand-sage flex justify-between items-center bg-white/50">
                <h3 className="text-xl sm:text-2xl font-display font-bold text-brand-navy">Subir PDF</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-brand-navy/30 hover:text-brand-coral transition-colors"><X size={24} /></button>
             </div>
             <div className="p-6 sm:p-10 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-2">Asociar a Paciente</label>
                   <select className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-medium outline-none" value={uploadData.patientId} onChange={e => setUploadData({...uploadData, patientId: e.target.value})}>
                     <option value="">Seleccione Paciente</option>
                     {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                   </select>
                </div>
                
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-2">Tipo de Documento</label>
                   <div className="grid grid-cols-2 gap-2">
                     {Object.values(DocType).map(t => (
                       <button key={t} onClick={() => setUploadData({...uploadData, type: t})} className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${uploadData.type === t ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-brand-teal border-brand-sage'}`}>{t}</button>
                     ))}
                   </div>
                </div>

                {uploadData.type === DocType.FACTURA && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-brand-coral uppercase tracking-widest ml-2">Monto ($)</label>
                      <input type="number" className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-bold" value={uploadData.amount} onChange={e => setUploadData({...uploadData, amount: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-2">N° Comprobante</label>
                      <input type="text" className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-bold" value={uploadData.receiptNumber} onChange={e => setUploadData({...uploadData, receiptNumber: e.target.value})} />
                    </div>
                  </div>
                )}

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-4 border-dashed border-brand-sage rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 text-brand-teal/40 bg-white/50 cursor-pointer hover:bg-brand-mint/10"
                >
                   <UploadCloud size={40} className={selectedFile ? 'text-brand-coral' : ''} />
                   <p className="text-[10px] font-black uppercase tracking-widest text-center px-4">{selectedFile ? selectedFile.name : 'Adjuntar PDF'}</p>
                   <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => {
                     if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                   }} />
                </div>
             </div>
             <div className="p-6 sm:p-8 bg-white/80 border-t border-brand-sage flex justify-end gap-4">
                <button onClick={() => setShowUploadModal(false)} className="px-6 py-3 rounded-2xl font-bold text-brand-navy/40 hover:text-brand-coral transition-colors text-xs">Cancelar</button>
                <button onClick={handleUpload} className="bg-brand-navy text-white px-8 py-3 rounded-2xl font-bold shadow-xl hover:scale-[1.02] text-xs">Subir</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsView;
