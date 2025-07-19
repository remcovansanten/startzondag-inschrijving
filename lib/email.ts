import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendConfirmationEmail(to: string, data: {
  naam: string;
  taakNaam: string;
  telefoon: string;
  email: string;
  wijzigLink: string;
}) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@example.com',
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

export async function sendCancellationEmail(to: string, data: {
  naam: string;
  taakNaam: string;
}) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to,
      subject: `Annulering bevestigd - ${data.taakNaam}`,
      html: `
        <h2>Beste ${data.naam},</h2>
        
        <p>Je aanmelding voor "${data.taakNaam}" is succesvol geannuleerd.</p>
        
        <p>Met vriendelijke groet,<br>Het organisatieteam</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}