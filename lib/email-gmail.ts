import nodemailer from 'nodemailer';

// Gmail SMTP configuratie
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // jouw@gmail.com
    pass: process.env.GMAIL_APP_PASSWORD // App-specific password
  }
});

export async function sendConfirmationEmail(to: string, data: {
  naam: string;
  taakNaam: string;
  telefoon: string;
  email: string;
  wijzigLink: string;
}) {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject: `Bevestiging aanmelding - ${data.taakNaam}`,
      html: `
        <h2>Beste ${data.naam},</h2>
        
        <p>Bedankt voor je aanmelding voor "${data.taakNaam}".</p>
        
        <h3>Je gegevens:</h3>
        <ul>
          <li><strong>Naam:</strong> ${data.naam}</li>
          <li><strong>Email:</strong> ${data.email}</li>
          <li><strong>Telefoon:</strong> ${data.telefoon}</li>
        </ul>
        
        <p>Om je aanmelding te wijzigen of annuleren, gebruik deze link:</p>
        <p><a href="${data.wijzigLink}">${data.wijzigLink}</a></p>
        
        <p>Met vriendelijke groet,<br>Het organisatieteam</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}