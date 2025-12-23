import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { ChevronRight, ChevronLeft, Upload as UploadIcon, CheckCircle, FileText, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// RUTAS CORREGIDAS
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { useToast } from '../ui/use-toast';
import { supabase } from '../lib/supabase';

const Upload = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    studentName: '',
    studentId: '',
    email: '',
    title: '',
    abstract: '',
    advisor: '',
    career: '',
    year: new Date().getFullYear().toString(),
    keywords: '',
    // Step 2
    pdfFile: null,
    approvalFile: null,
    // Step 3
    copyrightAgreement: false,
    openAccessAgreement: false
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field, file) => {
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({ ...prev, [field]: file }));
    } else {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo PDF válido",
        variant: "destructive"
      });
    }
  };

  const validateStep1 = () => {
    const requiredFields = ['studentName', 'studentId', 'email', 'title', 'abstract', 'advisor', 'career', 'year'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.pdfFile || !formData.approvalFile) {
      toast({
        title: "Archivos requeridos",
        description: "Por favor sube todos los archivos requeridos",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!formData.copyrightAgreement || !formData.openAccessAgreement) {
      toast({
        title: "Confirmación requerida",
        description: "Debes aceptar los términos de derechos de autor y acceso abierto",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('theses')
        .insert([
          {
            title: formData.title,
            author: formData.studentName,
            student_id: formData.studentId,
            email: formData.email,
            abstract: formData.abstract,
            advisor: formData.advisor,
            career: formData.career,
            year: parseInt(formData.year),
            keywords: formData.keywords.split(',').map(k => k.trim()),
            status: 'pending',
            downloads: 0
          }
        ]);

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: "Tu tesis ha sido enviada para revisión. Recibirás una notificación por correo electrónico.",
      });

      setFormData({
        studentName: '',
        studentId: '',
        email: '',
        title: '',
        abstract: '',
        advisor: '',
        career: '',
        year: new Date().getFullYear().toString(),
        keywords: '',
        pdfFile: null,
        approvalFile: null,
        copyrightAgreement: false,
        openAccessAgreement: false
      });
      setCurrentStep(1);
    } catch (error) {
      console.error('Error submitting thesis:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu tesis. Por favor intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  const steps = [
    { number: 1, title: 'Datos y Metadatos', icon: FileText },
    { number: 2, title: 'Cargar Archivos', icon: UploadIcon },
    { number: 3, title: 'Confirmación', icon: Shield }
  ];

  return (
    <>
      <Helmet>
        <title>Subir Tesis - FASBIT</title>
        <meta name="description" content="Sube tu tesis al repositorio digital de FASBIT. Proceso guiado paso a paso para publicar tu investigación." />
      </Helmet>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-xl overflow-hidden"
          >
            <div className="bg-blue-600 text-white p-8">
              <h1 className="text-3xl font-bold mb-2">Subir Tesis</h1>
              <p className="text-blue-100">Completa los siguientes pasos para publicar tu investigación</p>
            </div>

            <div className="p-8">
              <div className="flex justify-between mb-12">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          currentStep >= step.number
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {currentStep > step.number ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          <step.icon className="h-6 w-6" />
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <div className={`text-sm font-medium ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'}`}>
                          Paso {step.number}
                        </div>
                        <div className="text-xs text-gray-600 hidden sm:block">{step.title}</div>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`h-1 flex-1 mx-4 ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Datos del Estudiante y Metadatos</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="studentName">Nombre Completo *</Label>
                        <input
                          id="studentName"
                          type="text"
                          value={formData.studentName}
                          onChange={(e) => handleInputChange('studentName', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="studentId">Matrícula *</Label>
                        <input
                          id="studentId"
                          type="text"
                          value={formData.studentId}
                          onChange={(e) => handleInputChange('studentId', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Correo Electrónico *</Label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <Label htmlFor="title">Título de la Tesis *</Label>
                      <input
                        id="title"
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <Label htmlFor="abstract">Resumen *</Label>
                      <textarea
                        id="abstract"
                        value={formData.abstract}
                        onChange={(e) => handleInputChange('abstract', e.target.value)}
                        rows={5}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="advisor">Asesor *</Label>
                        <input
                          id="advisor"
                          type="text"
                          value={formData.advisor}
                          onChange={(e) => handleInputChange('advisor', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="career">Carrera *</Label>
                        <select
                          id="career"
                          value={formData.career}
                          onChange={(e) => handleInputChange('career', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Selecciona...</option>
                          <option value="Biotecnología">Biotecnología</option>
                          <option value="Ingeniería Biomédica">Ingeniería Biomédica</option>
                          <option value="Bioinformática">Bioinformática</option>
                          <option value="Sistemas Biológicos">Sistemas Biológicos</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="year">Año *</Label>
                        <input
                          id="year"
                          type="number"
                          value={formData.year}
                          onChange={(e) => handleInputChange('year', e.target.value)}
                          min="2015"
                          max="2025"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="keywords">Palabras Clave (separadas por comas)</Label>
                        <input
                          id="keywords"
                          type="text"
                          value={formData.keywords}
                          onChange={(e) => handleInputChange('keywords', e.target.value)}
                          placeholder="ej: biología, tecnología, innovación"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Cargar Archivos</h2>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                      <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <Label htmlFor="pdfFile" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-700 font-medium">
                          Clic para cargar
                        </span>
                        <span className="text-gray-600"> o arrastra el archivo PDF de tu tesis</span>
                      </Label>
                      <input
                        id="pdfFile"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange('pdfFile', e.target.files[0])}
                        className="hidden"
                      />
                      {formData.pdfFile && (
                        <p className="mt-2 text-sm text-green-600">✓ {formData.pdfFile.name}</p>
                      )}
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <Label htmlFor="approvalFile" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-700 font-medium">
                          Clic para cargar
                        </span>
                        <span className="text-gray-600"> el documento de aprobación</span>
                      </Label>
                      <input
                        id="approvalFile"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange('approvalFile', e.target.files[0])}
                        className="hidden"
                      />
                      {formData.approvalFile && (
                        <p className="mt-2 text-sm text-green-600">✓ {formData.approvalFile.name}</p>
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Nota:</strong> Los archivos deben estar en formato PDF y no exceder 50 MB cada uno.
                      </p>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirmación de Derechos de Autor</h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Checkbox
                          id="copyright"
                          checked={formData.copyrightAgreement}
                          onCheckedChange={(checked) => handleInputChange('copyrightAgreement', checked)}
                        />
                        <div>
                          <Label htmlFor="copyright" className="cursor-pointer font-medium">
                            Acuerdo de Derechos de Autor
                          </Label>
                          <p className="text-sm text-gray-600 mt-1">
                            Declaro que soy el autor original de este trabajo y tengo los derechos para publicarlo en el repositorio digital de FASBIT. Autorizo la difusión de mi tesis en formato digital.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Checkbox
                          id="openAccess"
                          checked={formData.openAccessAgreement}
                          onCheckedChange={(checked) => handleInputChange('openAccessAgreement', checked)}
                        />
                        <div>
                          <Label htmlFor="openAccess" className="cursor-pointer font-medium">
                            Licencia de Acceso Abierto
                          </Label>
                          <p className="text-sm text-gray-600 mt-1">
                            Acepto que mi tesis sea de acceso abierto y pueda ser consultada y descargada por la comunidad académica, respetando los términos de atribución correspondientes.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h3 className="font-semibold text-green-900 mb-2">Resumen de tu envío:</h3>
                      <div className="space-y-2 text-sm text-green-800">
                        <p><strong>Título:</strong> {formData.title}</p>
                        <p><strong>Autor:</strong> {formData.studentName}</p>
                        <p><strong>Carrera:</strong> {formData.career}</p>
                        <p><strong>Año:</strong> {formData.year}</p>
                        <p><strong>Archivos:</strong> {formData.pdfFile?.name}, {formData.approvalFile?.name}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                {currentStep < 3 ? (
                  <Button onClick={handleNext} className="flex items-center gap-2">
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                    Enviar Tesis
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Upload;