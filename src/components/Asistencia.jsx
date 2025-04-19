import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import './Asistencia.css';
import BotonCerrarSesion from './BotonCerrarSesion';

// ======= CONFIGURACIÓN DEL CORREO ELECTRÓNICO =======
// Este es tu correo de Google al que llegarán todas las solicitudes
const CORREO_DESTINATARIO = 'alexinholozano10@gmail.com';

// Configura aquí tus credenciales de EmailJS
const EMAILJS_PUBLIC_KEY = 't7WDI5DOd_GQq7Z2j';
// Inicializar EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

const Asistencia = () => {
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [correoRemitente, setCorreoRemitente] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();
  const form = useRef();

  const enviarCorreoDirecto = async (e) => {
    e.preventDefault();
    
    if (!asunto.trim() || !descripcion.trim() || !correoRemitente.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }
    
    setEnviando(true);
    setError('');
    
    try {
      // Enviar correo usando EmailJS directamente con el formulario
      const response = await emailjs.sendForm(
        'service_hi3fbu6',  // Service ID
        'template_wxu2cur', // Template ID
        form.current
      );
      
      console.log('¡Correo enviado con éxito!', response.status, response.text);
      
      // Mostrar mensaje de éxito
      setMensajeExito(`¡Solicitud enviada con éxito! Un correo ha sido enviado desde ${correoRemitente} a ${CORREO_DESTINATARIO}`);
      
      // Limpiar el formulario
      setAsunto('');
      setDescripcion('');
      setCorreoRemitente('');
    } catch (error) {
      console.error('Error al enviar correo:', error);
      setError(`Error al enviar el correo: ${error.text || error.message}. Por favor, intenta de nuevo o contacta directamente a ${CORREO_DESTINATARIO}`);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="asistencia-container">
      <div className="header">
        <button 
          onClick={() => navigate('/seleccionar-tienda')} 
          className="back-button"
        >
          ❮ Volver
        </button>
        <h1>Asistencia y Soporte</h1>
      </div>
      
      <div className="asistencia-card">
        <h2>Enviar Solicitud de Asistencia</h2>
        
        {mensajeExito && (
          <div className="mensaje-exito">
            {mensajeExito}
          </div>
        )}
        
        {error && (
          <div className="mensaje-error">
            {error}
          </div>
        )}
        
        <form ref={form} onSubmit={enviarCorreoDirecto}>
          <div className="form-group">
            <label htmlFor="correoRemitente">Tu correo electrónico (remitente):</label>
            <input
              type="email"
              id="correoRemitente"
              name="email"
              value={correoRemitente}
              onChange={(e) => setCorreoRemitente(e.target.value)}
              placeholder="Ingresa tu correo electrónico"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="asunto">Asunto:</label>
            <input
              type="text"
              id="asunto"
              name="title"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Ej. Problema al agregar productos"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="descripcion">Descripción del problema:</label>
            <textarea
              id="descripcion"
              name="message"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe detalladamente el problema que estás experimentando..."
              rows={5}
              required
            />
          </div>
          
          <input type="hidden" name="subject" value={asunto} />
          <input type="hidden" name="to_name" value="Alexander" />
          <input type="hidden" name="reply_to" value={correoRemitente} />
          <input type="hidden" name="email" value={correoRemitente} />
          
          <div className="botones-envio">
            <button 
              type="submit" 
              className="enviar-btn"
              disabled={enviando}
            >
              {enviando ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
        
        <div className="contacto-directo">
          <p>O envía un correo directamente a: <a href={`mailto:${CORREO_DESTINATARIO}`}>{CORREO_DESTINATARIO}</a></p>
        </div>
      </div>
      
      <div className="informacion-contacto">
        <h3>Información de Contacto</h3>
        <p>Si prefieres contactarnos directamente:</p>
        <ul>
          <li>Email: <a href={`mailto:${CORREO_DESTINATARIO}`}>{CORREO_DESTINATARIO}</a></li>
          <li>Teléfono: 3142093407</li>
          <li>Horario: Lunes a Viernes, 9:00 AM - 6:00 PM</li>
        </ul>
      </div>
      
      <div className="preguntas-frecuentes">
        <h3>Preguntas Frecuentes</h3>
        
        <div className="pregunta">
          <h4>¿Cómo agrego una nueva tienda?</h4>
          <p>Para agregar una nueva tienda, ve a la página principal, ingresa el nombre de la tienda en el campo "Nombre de la nueva tienda" y haz clic en "Agregar Tienda".</p>
        </div>
        
        <div className="pregunta">
          <h4>¿Cómo edito un producto?</h4>
          <p>Para editar un producto, selecciona la tienda donde se encuentra, luego haz clic en el botón "Editar" junto al producto que deseas modificar.</p>
        </div>
        
        <div className="pregunta">
          <h4>¿Cómo comparo precios entre meses?</h4>
          <p>Para comparar precios, selecciona una tienda y haz clic en "Comparar Precios por Mes". Luego selecciona los dos meses que deseas comparar y haz clic en "Comparar".</p>
        </div>
      </div>
      
      <div className="footer">
        <BotonCerrarSesion />
      </div>
    </div>
  );
};

export default Asistencia; 