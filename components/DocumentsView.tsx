
import React, { useState, useRef, useEffect } from 'react';
import { Patient, Document, DocType } from '../types';
import { Search, Plus, FileText, Download, Trash2, X, UploadCloud, Filter, CheckCircle2, AlertCircle, FileCheck, FileCode, FileSpreadsheet, MoreVertical } from 'lucide-react';

interface DocumentsViewProps {
  patients: Patient[];
  onUpdatePatients: (patients: Patient[]) => void;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({ patients, onUpdatePatients }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterType, setFilterType] = useState<DocType | 'Todos'>('Todos');
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

  // Cierre con tecla Escape
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const getDocIcon = (type: DocType) => {
    switch (type) {
      case DocType.FACTURA: return <FileCheck size={24} className="text-brand-coral" />;
      case DocType.PLANILLA: return <FileSpreadsheet size={24} className="text-blue-500" />;
      case DocType.INFORME: return <FileText size={24} className="text-brand-teal" />;
      default: return <FileCode size={24} className="text-brand-navy" />;
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-brand-navy">Documentos</h2>
          <p className="text-sm text-brand-teal font-medium">Gestión administrativa centralizada</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="bg-brand-navy text-white px-8 py-3.5 rounded-2xl flex items-center gap-3 font-bold shadow-xl shadow-brand-navy/20 hover:scale-[1.02] transition-all"
        >
          <Plus size={20} />
          Subir PDF
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white p-1 rounded-3xl border border-brand-sage shadow-sm flex items-center px-4">
          <Search className="text-brand-teal/40 mr-2" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por archivo o paciente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none py-4 focus:outline-none text-brand-navy placeholder-brand-teal/40 font-medium"
          />
        </div>
        <div className="bg-white px-4 rounded-3xl border border-brand-sage shadow-sm flex items-center gap-3 min-w-[240px]">
          <Filter size={18} className="text-brand-teal/40" />
          <select 
            className="bg-transparent border-none py-4 w-full focus:outline-none text-brand-navy text-sm font-bold"
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
          >
            <option value="Todos">Todos los tipos</option>
            {Object.values(DocType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc: any) => (
            <div key={doc.id} className="bg-white rounded-[40px] border border-brand-sage p-6 shadow-sm hover:shadow-md transition-all flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-beige/20 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform"></div>
              
              {/* Header: Icon and Type */}
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`p-4 rounded-2xl ${getDocColors(doc.type).split(' ')[0]} flex items-center justify-center shadow-sm`}>
                  {getDocIcon(doc.type)}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${getDocColors(doc.type)} uppercase tracking-widest`}>
                    {doc.type}
                  </span>
                  {doc.type === DocType.FACTURA && (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase flex items-center gap-1 ${doc.status === 'pagada' ? 'bg-brand-teal text-white' : 'bg-brand-coral text-white'}`}>
                      {doc.status === 'pagada' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                      {doc.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Body: Name and Patient */}
              <div className="flex-1 mb-6 relative z-10">
                <h4 className="text-lg font-bold text-brand-navy mb-1 line-clamp-2 leading-tight group-hover:text-brand-coral transition-colors">{doc.name}</h4>
                <p className="text-xs font-medium text-brand-teal uppercase tracking-widest mb-4">{doc.patientName}</p>
                
                {doc.type === DocType.FACTURA && (
                  <div className="mt-4 pt-4 border-t border-brand-beige">
                    <p className="text-[10px] font-black text-brand-teal/40 uppercase tracking-tighter mb-1">Monto de Facturación</p>
                    <p className="text-2xl font-black text-brand-navy">${doc.amount?.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Footer: Date and Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-brand-beige relative z-10">
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-brand-teal/50 uppercase">{doc.date}</p>
                  {doc.receiptNumber && <p className="text-[10px] font-mono font-bold text-brand-navy/30">#{doc.receiptNumber}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {doc.type === DocType.FACTURA && (
                    <button 
                      onClick={() => togglePaidStatus(doc.id, doc.patientId)}
                      className="p-2 text-brand-teal/40 hover:text-brand-coral transition-all hover:bg-brand-beige rounded-xl"
                      title="Alternar Pago"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                  <a 
                    href={doc.url} 
                    download 
                    className="p-2 text-brand-teal/40 hover:text-brand-navy transition-all hover:bg-brand-beige rounded-xl"
                    title="Descargar"
                  >
                    <Download size={18} />
                  </a>
                  <button 
                    className="p-2 text-brand-teal/40 hover:text-red-500 transition-all hover:bg-red-50 rounded-xl"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-brand-sage p-20 flex flex-col items-center justify-center text-center">
          <div className="p-8 bg-brand-beige rounded-[48px] mb-6">
            <FileText size={48} className="text-brand-teal/20" />
          </div>
          <h3 className="text-xl font-display font-bold text-brand-navy">No se encontraron documentos</h3>
          <p className="text-sm text-brand-teal mt-2 max-w-xs">Intenta ajustar los filtros de búsqueda o sube un nuevo archivo.</p>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-navy/30 backdrop-blur-md p-6">
          <div className="bg-brand-beige w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="p-8 border-b border-brand-sage flex justify-between items-center bg-white/50">
                <h3 className="text-2xl font-display font-bold text-brand-navy">Subir PDF</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-brand-navy/30 hover:text-brand-coral transition-colors"><X size={24} /></button>
             </div>
             <div className="p-10 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-2">Asociar a Paciente</label>
                   <select className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-coral/20" value={uploadData.patientId} onChange={e => setUploadData({...uploadData, patientId: e.target.value})}>
                     <option value="">Seleccione Paciente</option>
                     {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-2">Tipo de Documento</label>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                     {Object.values(DocType).map(t => (
                       <button key={t} onClick={() => setUploadData({...uploadData, type: t})} className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${uploadData.type === t ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-brand-teal border-brand-sage hover:border-brand-teal'}`}>{t}</button>
                     ))}
                   </div>
                </div>

                {uploadData.type === DocType.FACTURA && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-brand-coral uppercase tracking-widest ml-2">Monto ($)</label>
                      <input type="number" placeholder="Ingrese valor" className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-coral/20" value={uploadData.amount} onChange={e => setUploadData({...uploadData, amount: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-brand-teal uppercase tracking-widest ml-2">N° Comprobante</label>
                      <input type="text" placeholder="0001-0000..." className="w-full bg-white border border-brand-sage rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-teal/20" value={uploadData.receiptNumber} onChange={e => setUploadData({...uploadData, receiptNumber: e.target.value})} />
                    </div>
                  </div>
                )}

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-4 border-dashed border-brand-sage rounded-[32px] p-10 flex flex-col items-center justify-center gap-4 text-brand-teal/40 bg-white/50 cursor-pointer hover:bg-brand-mint/10 transition-colors"
                >
                   <UploadCloud size={48} className={selectedFile ? 'text-brand-coral' : ''} />
                   <p className="text-xs font-black uppercase tracking-widest text-center px-4">{selectedFile ? selectedFile.name : 'Haz clic para adjuntar PDF'}</p>
                   <p className="text-[8px] font-bold opacity-50 uppercase tracking-tighter">Solo archivos .pdf aceptados</p>
                   <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                </div>
             </div>
             <div className="p-8 bg-white/80 border-t border-brand-sage flex justify-end gap-4">
                <button onClick={() => setShowUploadModal(false)} className="px-6 py-3 rounded-2xl font-bold text-brand-navy/40 hover:text-brand-coral transition-colors">Cancelar</button>
                <button onClick={handleUpload} className="bg-brand-navy text-white px-10 py-3 rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition-all">Subir Documento</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsView;
