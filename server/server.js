require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sendEmail } = require('./src/api/email.js');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/send-email', async (req, res) => {
  try {
    await sendEmail(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Error al enviar el correo' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
