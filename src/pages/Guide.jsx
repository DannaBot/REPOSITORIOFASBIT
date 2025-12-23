import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Upload, CheckCircle, Clock, AlertCircle, BookOpen } from 'lucide-react';
// RUTA CORREGIDA
import { Button } from '../ui/button';

const Guide = () => {
  const steps = [
    {
      icon: FileText,
      title: 'Preparación de Documentos',
      items: [
        'Asegúrate de que tu tesis esté en formato PDF',
        'El archivo no debe exceder 50 MB',
        'Verifica que el documento sea legible y esté completo',
        'Incluye portada, resumen, introducción, metodología, resultados, conclusiones y referencias'
      ]
    },
    {
      icon: Upload,
      title: 'Proceso de Carga',
      items: [
        'Completa el formulario con tus datos personales y académicos',
        'Ingresa los metadatos de tu tesis (título, resumen, palabras clave)',
        'Carga el archivo PDF de tu tesis',
        'Adjunta el documento de aprobación de tu asesor',
        'Acepta los términos de derechos de autor y acceso abierto'
      ]
    },
    {
      icon: Clock,
      title: 'Revisión y Aprobación',
      items: [
        'Tu tesis será revisada por el equipo de FASBIT',
        'El proceso de revisión puede tomar de 3 a 5 días hábiles',
        'Recibirás notificaciones por correo electrónico sobre el estado',
        'Si se requieren correcciones, se te notificará con las observaciones'
      ]
    },
    {
      icon: CheckCircle,
      title: 'Publicación',
      items: [
        'Una vez aprobada, tu tesis será publicada en el repositorio',
        'Será accesible para consulta y descarga por la comunidad académica',
        'Aparecerá en los resultados de búsqueda del catálogo',
        'Podrás compartir el enlace directo a tu investigación'
      ]
    }
  ];

  const requirements = [
    {
      title: 'Requisitos del Documento',
      items: [
        'Formato: PDF exclusivamente',
        'Tamaño máximo: 50 MB',
        'Orientación: Vertical (portrait)',
        'Fuente legible y tamaño adecuado',
        'Sin contraseñas o restricciones de copia'
      ]
    },
    {
      title: 'Metadatos Requeridos',
      items: [
        'Título completo de la tesis',
        'Nombre completo del autor',
        'Matrícula del estudiante',
        'Nombre del asesor',
        'Carrera o programa académico',
        'Año de presentación',
        'Resumen (máximo 500 palabras)',
        'Palabras clave (mínimo 3)'
      ]
    },
    {
      title: 'Documentos Adicionales',
      items: [
        'Carta de aprobación del asesor (PDF)',
        'Constancia de no plagio (opcional)',
        'Autorización de publicación firmada',
        'Licencia de uso (se genera automáticamente)'
      ]
    }
  ];

  return (
    <>
      <Helmet>
        <title>Guía de Publicación - FASBIT</title>
        <meta name="description" content="Guía completa para publicar tu tesis en el repositorio digital de FASBIT. Conoce los requisitos y el proceso paso a paso." />
      </Helmet>

      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <BookOpen className="h-16 w-16 mx-auto mb-6" />
            <h1 className="text-5xl font-bold mb-6">Guía de Publicación</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Todo lo que necesitas saber para publicar tu tesis en el repositorio digital de FASBIT
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Proceso de Publicación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="bg-blue-100 rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto">
                  <step.icon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{step.title}</h3>
                <ul className="space-y-2">
                  {step.items.map((item, i) => (
                    <li key={i} className="flex items-start text-sm text-gray-700">
                      <span className="text-blue-600 mr-2">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Requisitos y Documentación</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {requirements.map((req, index) => (
              <motion.div
                key={req.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{req.title}</h3>
                <ul className="space-y-2">
                  {req.items.map((item, i) => (
                    <li key={i} className="flex items-start text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 mb-12"
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold text-yellow-900 mb-3">Consideraciones Importantes</h3>
              <ul className="space-y-2 text-yellow-800">
                <li>• Asegúrate de tener los derechos de autor sobre todo el contenido de tu tesis</li>
                <li>• Verifica que no existan conflictos de confidencialidad con terceros</li>
                <li>• Las tesis publicadas estarán disponibles para acceso abierto permanentemente</li>
                <li>• Puedes solicitar un embargo temporal si es necesario (máximo 2 años)</li>
                <li>• Una vez publicada, la tesis no puede ser eliminada del repositorio</li>
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-xl p-12 text-white text-center"
        >
          <h2 className="text-3xl font-bold mb-4">¿Listo para publicar?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Sigue nuestra guía paso a paso y contribuye al conocimiento científico
          </p>
          <Link to="/upload">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
              Comenzar Proceso de Carga
            </Button>
          </Link>
        </motion.div>
      </div>
    </>
  );
};

export default Guide;