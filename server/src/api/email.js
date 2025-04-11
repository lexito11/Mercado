const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendEmail(data) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,
    subject: `Solicitud de Soporte: ${data.asunto}`,
    html: `
      <h2>Nueva Solicitud de Soporte</h2>
      <p><strong>Nombre:</strong> ${data.nombre}</p>
      <p><strong>Correo:</strong> ${data.correo}</p>
      <p><strong>Asunto:</strong> ${data.asunto}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${data.mensaje}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw error;
  }
}

module.exports = { sendEmail };
