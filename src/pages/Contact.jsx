import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";

// RUTAS CORREGIDAS
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useToast } from "../ui/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulación de envío
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Mensaje enviado",
        description: "Nos pondremos en contacto contigo pronto.",
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 space-y-4"
      >
        <h1 className="text-4xl font-bold text-gray-900">Contacto</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          ¿Tienes preguntas sobre el proceso de titulación o problemas con el repositorio? 
          Estamos aquí para ayudarte.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Información de Contacto */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
            <h3 className="text-xl font-semibold mb-4">Información de la Facultad</h3>
            
            <div className="flex items-start space-x-4">
              <MapPin className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <p className="font-medium">Dirección</p>
                <p className="text-gray-600">Av. Universidad S/N, Ciudad Universitaria, Oaxaca de Juárez, Oax.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Phone className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <p className="font-medium">Teléfono</p>
                <p className="text-gray-600">(951) 511 2345</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Mail className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <p className="font-medium">Correo Electrónico</p>
                <p className="text-gray-600">contacto@fasbit.uabjo.mx</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Clock className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <p className="font-medium">Horario de Atención</p>
                <p className="text-gray-600">Lunes a Viernes: 9:00 AM - 5:00 PM</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h4 className="font-semibold text-blue-800 mb-2">Nota Importante</h4>
            <p className="text-sm text-blue-600">
              Para trámites oficiales de titulación, favor de acudir directamente a la coordinación académica con su documentación física.
            </p>
          </div>
        </motion.div>

        {/* Formulario */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-8 rounded-xl shadow-lg border"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="Juan Pérez" 
                required 
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Institucional</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="juan.perez@uabjo.mx" 
                required 
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input 
                id="subject" 
                name="subject" 
                placeholder="Duda sobre formato de tesis..." 
                required 
                value={formData.subject}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensaje</Label>
              <Textarea 
                id="message" 
                name="message" 
                placeholder="Escribe tu mensaje aquí..." 
                className="min-h-[150px]" 
                required 
                value={formData.message}
                onChange={handleChange}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Enviar Mensaje
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;