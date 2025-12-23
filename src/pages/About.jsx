import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Target, Users, Lightbulb, Award } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Target,
      title: 'Misión',
      description: 'Preservar y difundir el conocimiento científico y tecnológico generado en FASBIT, facilitando el acceso libre y abierto a la investigación académica.'
    },
    {
      icon: Users,
      title: 'Visión',
      description: 'Ser el repositorio digital líder en sistemas biológicos e innovación tecnológica, reconocido por su calidad, accesibilidad y contribución al avance científico.'
    },
    {
      icon: Lightbulb,
      title: 'Innovación',
      description: 'Promovemos la innovación tecnológica y científica mediante la difusión de investigaciones que aportan soluciones a desafíos contemporáneos.'
    },
    {
      icon: Award,
      title: 'Excelencia',
      description: 'Nos comprometemos con los más altos estándares de calidad académica en cada tesis publicada en nuestro repositorio.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Acerca de FASBIT - Repositorio Digital</title>
        <meta name="description" content="Conoce más sobre la Facultad de Sistemas Biológicos e Innovación Tecnológica y nuestro repositorio digital académico." />
      </Helmet>

      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold mb-6">Acerca de FASBIT</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Facultad de Sistemas Biológicos e Innovación Tecnológica
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
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Nuestra Facultad</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                La Facultad de Sistemas Biológicos e Innovación Tecnológica (FASBIT) es un centro de excelencia académica 
                dedicado a la formación de profesionales altamente capacitados en las áreas de biotecnología, ingeniería 
                biomédica, bioinformática y sistemas biológicos.
              </p>
              <p>
                Nuestro repositorio digital representa el compromiso de FASBIT con la democratización del conocimiento 
                científico, proporcionando acceso libre y gratuito a las investigaciones realizadas por nuestros estudiantes 
                y profesores.
              </p>
              <p>
                A través de este repositorio, buscamos crear un espacio colaborativo donde la comunidad académica pueda 
                consultar, aprender y construir sobre el trabajo de investigación existente, fomentando así el avance 
                continuo de la ciencia y la tecnología.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
            >
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <value.icon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{value.title}</h3>
              <p className="text-gray-700 leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-xl p-12 text-white"
        >
          <h2 className="text-3xl font-bold mb-6 text-center">Áreas de Investigación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Biotecnología</h3>
              <p className="text-blue-100">
                Investigación aplicada en ingeniería genética, biomateriales, bioingeniería y desarrollo de 
                biotecnologías para soluciones sostenibles.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Ingeniería Biomédica</h3>
              <p className="text-blue-100">
                Desarrollo de dispositivos médicos, imagenología, biomecánica y tecnologías para la salud 
                y el diagnóstico clínico.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Bioinformática</h3>
              <p className="text-blue-100">
                Análisis computacional de datos biológicos, genómica, proteómica y desarrollo de 
                herramientas bioinformáticas.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Sistemas Biológicos</h3>
              <p className="text-blue-100">
                Estudio de sistemas complejos, biología de sistemas, modelado matemático y análisis 
                de redes biológicas.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default About;