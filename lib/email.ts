import { Resend } from 'resend';
import { EVENT_NAME } from './event';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmailWithRetry(emailData: any, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await resend.emails.send(emailData);
      return result;
    } catch (error: any) {
      console.error(`Email send attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

export async function sendConfirmationEmail(to: string, data: {
  naam: string;
  taakNaam: string;
  telefoon: string;
  email: string;
  wijzigLink: string;
}) {
  try {
    const emailData = {
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to,
      subject: `Bevestiging aanmelding Startzondag - ${data.taakNaam}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #b8341f; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Gereformeerde Kerk Ermelo</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px;">${EVENT_NAME}</p>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="color: #1f2937; margin-top: 0;">Beste ${data.naam},</h2>
              
              <p style="color: #4b5563; line-height: 1.6;">
                Bedankt voor je aanmelding als vrijwilliger voor de Startzondag!
                Je hebt je aangemeld voor: <strong>${data.taakNaam}</strong>
              </p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin-top: 0;">Je gegevens:</h3>
                <p style="margin: 5px 0;"><strong>Naam:</strong> ${data.naam}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
                <p style="margin: 5px 0;"><strong>Telefoon:</strong> ${data.telefoon}</p>
              </div>
              
              <p style="color: #4b5563; line-height: 1.6;">
                Mocht je je aanmelding willen wijzigen of annuleren, dan kan dat via onderstaande link:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.wijzigLink}" style="background-color: #b8341f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Aanmelding beheren
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                Of kopieer deze link: ${data.wijzigLink}
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
              
              <p style="color: #666666; line-height: 1.6; margin-bottom: 0;">
                Met vriendelijke groet,<br>
                <strong>Startzondag commissie</strong><br>
                Gereformeerde Kerk Ermelo
              </p>
            </div>
          </div>
        </div>
      `,
    };
    
    const result = await sendEmailWithRetry(emailData);
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

export async function sendCancellationEmail(to: string, data: {
  naam: string;
  taakNaam: string;
}) {
  try {
    const emailData = {
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to,
      subject: `Annulering bevestigd - ${data.taakNaam}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #b8341f; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Gereformeerde Kerk Ermelo</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px;">${EVENT_NAME}</p>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="color: #1f2937; margin-top: 0;">Beste ${data.naam},</h2>
              
              <p style="color: #4b5563; line-height: 1.6;">
                Je aanmelding voor <strong>"${data.taakNaam}"</strong> is succesvol geannuleerd.
              </p>
              
              <p style="color: #4b5563; line-height: 1.6;">
                Mocht je je toch weer willen aanmelden, dan kan dat via de website.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
              
              <p style="color: #666666; line-height: 1.6; margin-bottom: 0;">
                Met vriendelijke groet,<br>
                <strong>Startzondag commissie</strong><br>
                Gereformeerde Kerk Ermelo
              </p>
            </div>
          </div>
        </div>
      `,
    };
    
    const result = await sendEmailWithRetry(emailData);
    console.log('Cancellation email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Cancellation email error:', error);
    throw error;
  }
}