const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tu-email@gmail.com', // Reemplaza con tu email
    pass: 'tu-contraseña-de-aplicación' // Usar contraseña de aplicación de Google
  }
});

exports.enviarNotificacionAsistencia = functions.firestore
  .document('solicitudes_asistencia/{ticketId}')
  .onCreate(async (snap, context) => {
    const datos = snap.data();

    const mailOptions = {
      from: 'tu-email@gmail.com',
      to: 'alexinholozano10@gmail.com',
      subject: `Nueva solicitud de asistencia - ${datos.categoria}`,
      html: `
        <h2>Nueva Solicitud de Asistencia</h2>
        <p><strong>Categoría:</strong> ${datos.categoria}</p>
        <p><strong>Problema:</strong> ${datos.problema}</p>
        <p><strong>Usuario:</strong> ${datos.email}</p>
        <p><strong>Fecha:</strong> ${datos.fecha.toDate().toLocaleString()}</p>
        <p><strong>Navegador:</strong> ${datos.navegador}</p>
        <p><strong>Plataforma:</strong> ${datos.plataforma}</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email enviado correctamente');
    } catch (error) {
      console.error('Error al enviar email:', error);
    }
  });
