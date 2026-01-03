import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { ChevronRight, ChevronLeft, Upload as UploadIcon, CheckCircle, FileText, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { useToast } from '../ui/use-toast';
import { getUser } from '../lib/auth';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const Upload = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    studentName: '',
    studentId: '', // Solo pedimos matrícula, NO CURP
    email: '',
    title: '',
    abstract: '',
    advisor: '',
    career: '',
    year: new Date().getFullYear().toString(),
    keywords: '',
    thesisDate: new Date().toISOString().slice(0, 10),
    // Step 2
    pdfFile: null,
    approvalFile: null,
    // Step 3
    copyrightAgreement: false,
    openAccessAgreement: false
  });
  const [visible, setVisible] = useState(true);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field, file) => {
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({ ...prev, [field]: file }));
    } else {
      toast({ title: "Error", description: "PDF requerido", variant: "destructive" });
    }
  };

  const validateStep1 = () => {
    // Ya no validamos CURP
    const requiredFields = ['studentName', 'studentId', 'email', 'title', 'abstract', 'advisor', 'career', 'year'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      toast({ title: "Campos requeridos", description: "Completa todos los campos obligatorios", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.pdfFile || !formData.approvalFile) {
      toast({ title: "Archivos requeridos", description: "Sube ambos archivos", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevious = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    const user = getUser();
    if (!user || user.role !== 'coordinator') {
      window.location.href = '/login';
      return;
    }
    if (!formData.copyrightAgreement || !formData.openAccessAgreement) {
      toast({ title: "Requerido", description: "Debes aceptar los términos", variant: "destructive" });
      return;
    }

    try {
      const fd = new FormData();
      // Enviamos datos de la tesis
      fd.append('studentName', formData.studentName);
      fd.append('studentId', formData.studentId);
      fd.append('email', formData.email);
      fd.append('title', formData.title);
      fd.append('abstract', formData.abstract);
      fd.append('advisor', formData.advisor);
      fd.append('career', formData.career);
      fd.append('year', formData.year);
      fd.append('keywords', formData.keywords);
      if (formData.thesisDate) fd.append('thesis_date', formData.thesisDate);
      
      // Archivos
      if (formData.pdfFile) fd.append('pdfFile', formData.pdfFile);
      if (formData.approvalFile) fd.append('approvalFile', formData.approvalFile);
      
      // Configuración automática
      fd.append('hidden', visible ? '0' : '1');
      fd.append('status', 'approved'); // Se aprueba automático

      const token = user.token;
      const res = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd
      });

      if (!res.ok) throw new Error('Error al subir');

      toast({ title: "¡Éxito!", description: "Tesis publicada correctamente." });

      // Reset
      setFormData({
        studentName: '', studentId: '', email: '', title: '', abstract: '',
        advisor: '', career: '', year: new Date().getFullYear().toString(),
        keywords: '', thesisDate: new Date().toISOString().slice(0, 10),
        pdfFile: null, approvalFile: null, copyrightAgreement: false, openAccessAgreement: false
      });
      setCurrentStep(1);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "No se pudo subir la tesis.", variant: "destructive" });
    }
  };

  const steps = [
    { number: 1, title: 'Datos', icon: FileText },
    { number: 2, title: 'Archivos', icon: UploadIcon },
    { number: 3, title: 'Confirmación', icon: Shield }
  ];

  return (
    <>
      <Helmet><title>Subir Tesis</title></Helmet>
      <div className="bg-blue-50 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="bg-blue-600 text-white p-8">
              <h1 className="text-3xl font-bold">Subir Tesis</h1>
              <p>Panel de Coordinación</p>
            </div>
            <div className="p-8">
              {/* Steps UI simplificada */}
              <div className="flex justify-between mb-8">
                {steps.map((s, i) => (
                  <div key={s.number} className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= s.number ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{s.number}</span>
                    {s.title}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div><Label>Nombre Alumno *</Label><input className="border p-2 rounded w-full" value={formData.studentName} onChange={e => handleInputChange('studentName', e.target.value)} /></div>
                      <div><Label>Matrícula *</Label><input className="border p-2 rounded w-full" value={formData.studentId} onChange={e => handleInputChange('studentId', e.target.value)} /></div>
                    </div>
                    <div><Label>Email *</Label><input className="border p-2 rounded w-full" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} /></div>
                    <div><Label>Título *</Label><input className="border p-2 rounded w-full" value={formData.title} onChange={e => handleInputChange('title', e.target.value)} /></div>
                    <div><Label>Resumen *</Label><textarea className="border p-2 rounded w-full" rows={4} value={formData.abstract} onChange={e => handleInputChange('abstract', e.target.value)} /></div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div><Label>Asesor *</Label><input className="border p-2 rounded w-full" value={formData.advisor} onChange={e => handleInputChange('advisor', e.target.value)} /></div>
                      <div>
                        <Label>Carrera *</Label>
                        <select className="border p-2 rounded w-full" value={formData.career} onChange={e => handleInputChange('career', e.target.value)}>
                          <option value="">Selecciona...</option>
                          <option>Ingeniería en Innovación Tecnológica</option>
                          <option>Biología</option>
                          <option>Maestría en Ingeniería</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div><Label>Año *</Label><input type="number" className="border p-2 rounded w-full" value={formData.year} onChange={e => handleInputChange('year', e.target.value)} /></div>
                      <div><Label>Fecha</Label><input type="date" className="border p-2 rounded w-full" value={formData.thesisDate} onChange={e => handleInputChange('thesisDate', e.target.value)} /></div>
                    </div>
                    <div><Label>Palabras Clave</Label><input className="border p-2 rounded w-full" value={formData.keywords} onChange={e => handleInputChange('keywords', e.target.value)} /></div>
                  </motion.div>
                )}
                {currentStep === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 text-center">
                    <div className="border-2 border-dashed p-8 rounded">
                      <Label className="cursor-pointer block">
                        <UploadIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <span className="text-blue-600 font-bold">Subir PDF Tesis</span>
                        <input type="file" accept=".pdf" className="hidden" onChange={e => handleFileChange('pdfFile', e.target.files[0])} />
                      </Label>
                      {formData.pdfFile && <p className="text-green-600 mt-2">{formData.pdfFile.name}</p>}
                    </div>
                    <div className="border-2 border-dashed p-8 rounded">
                      <Label className="cursor-pointer block">
                        <FileText className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <span className="text-blue-600 font-bold">Subir Aprobación</span>
                        <input type="file" accept=".pdf" className="hidden" onChange={e => handleFileChange('approvalFile', e.target.files[0])} />
                      </Label>
                      {formData.approvalFile && <p className="text-green-600 mt-2">{formData.approvalFile.name}</p>}
                    </div>
                    <label className="flex items-center gap-2 justify-center"><input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} /> Visible inmediatamente</label>
                  </motion.div>
                )}
                {currentStep === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="p-4 border rounded bg-gray-50"><Checkbox checked={formData.copyrightAgreement} onCheckedChange={c => handleInputChange('copyrightAgreement', c)} /> <span className="ml-2">Acepto acuerdo de derechos de autor</span></div>
                    <div className="p-4 border rounded bg-gray-50"><Checkbox checked={formData.openAccessAgreement} onCheckedChange={c => handleInputChange('openAccessAgreement', c)} /> <span className="ml-2">Acepto licencia de acceso abierto</span></div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={handlePrevious} disabled={currentStep===1}>Anterior</Button>
                {currentStep < 3 ? <Button onClick={handleNext}>Siguiente</Button> : <Button onClick={handleSubmit} className="bg-green-600">Publicar</Button>}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};
export default Upload;