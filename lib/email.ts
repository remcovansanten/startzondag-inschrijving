import { Resend } from 'resend';
import { EVENT_NAME } from './event';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'noreply@example.com';

// Escape user-input voordat het in HTML-e-mails wordt geïnterpoleerd (voorkomt
// HTML-/markup-injectie en phishing via gemanipuleerde naam/taak/telefoon).
function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface EmailData {
  from: string;
  to: string;
  subject: string;
  html: string;
}

async function sendEmailWithRetry(emailData: EmailData, maxRetries = 3): Promise<unknown> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await resend.emails.send(emailData);
    } catch (error) {
      // Log de fout, NIET de e-maildata (bevat ontvanger/PII).
      console.error(`Email send attempt ${attempt} failed`);
      if (attempt === maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

function shell(bodyHtml: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #b8341f; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Gereformeerde Kerk Ermelo</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px;">${EVENT_NAME}</p>
        </div>
        <div style="padding: 30px;">${bodyHtml}</div>
      </div>
    </div>`;
}

const SIGNATURE = `
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
  <p style="color: #666666; line-height: 1.6; margin-bottom: 0;">
    Met vriendelijke groet,<br>
    <strong>Startzondag commissie</strong><br>
    Gereformeerde Kerk Ermelo
  </p>`;

export async function sendConfirmationEmail(to: string, data: {
  naam: string;
  taakNaam: string;
  telefoon: string;
  email: string;
  wijzigLink: string;
}) {
  const naam = escapeHtml(data.naam);
  const taakNaam = escapeHtml(data.taakNaam);
  const telefoon = escapeHtml(data.telefoon);
  const email = escapeHtml(data.email);
  const wijzigLink = escapeHtml(data.wijzigLink);
  try {
    const result = await sendEmailWithRetry({
      from: FROM,
      to,
      subject: `Bevestiging aanmelding Startzondag - ${data.taakNaam}`,
      html: shell(`
        <h2 style="color: #1f2937; margin-top: 0;">Beste ${naam},</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Bedankt voor je aanmelding als vrijwilliger voor de Startzondag!
          Je hebt je aangemeld voor: <strong>${taakNaam}</strong>
        </p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Je gegevens:</h3>
          <p style="margin: 5px 0;"><strong>Naam:</strong> ${naam}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Telefoon:</strong> ${telefoon}</p>
        </div>
        <p style="color: #4b5563; line-height: 1.6;">
          Mocht je je aanmelding willen wijzigen of annuleren, dan kan dat via onderstaande link:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${wijzigLink}" style="background-color: #b8341f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Aanmelding beheren
          </a>
        </div>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">Of kopieer deze link: ${wijzigLink}</p>
        ${SIGNATURE}
      `),
    });
    return result;
  } catch (error) {
    console.error('Email send error');
    throw error;
  }
}

export async function sendCancellationEmail(to: string, data: {
  naam: string;
  taakNaam: string;
}) {
  const naam = escapeHtml(data.naam);
  const taakNaam = escapeHtml(data.taakNaam);
  try {
    const result = await sendEmailWithRetry({
      from: FROM,
      to,
      subject: `Annulering bevestigd - ${data.taakNaam}`,
      html: shell(`
        <h2 style="color: #1f2937; margin-top: 0;">Beste ${naam},</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Je aanmelding voor <strong>"${taakNaam}"</strong> is succesvol geannuleerd.
        </p>
        <p style="color: #4b5563; line-height: 1.6;">
          Mocht je je toch weer willen aanmelden, dan kan dat via de website.
        </p>
        ${SIGNATURE}
      `),
    });
    return result;
  } catch (error) {
    console.error('Cancellation email error');
    throw error;
  }
}

// Magic-link inlogmail voor admins.
export async function sendMagicLinkEmail(to: string, link: string, ttlMinutes: number) {
  const safeLink = escapeHtml(link);
  return sendEmailWithRetry({
    from: FROM,
    to,
    subject: `Inloggen ${EVENT_NAME} — admin`,
    html: shell(`
      <h2 style="color: #1f2937; margin-top: 0;">Inloggen als beheerder</h2>
      <p style="color: #4b5563; line-height: 1.6;">
        Klik op onderstaande knop om in te loggen op het admin-dashboard.
        Deze link is ${ttlMinutes} minuten geldig en kan één keer gebruikt worden.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${safeLink}" style="background-color: #b8341f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Inloggen
        </a>
      </div>
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        Of kopieer deze link: ${safeLink}<br><br>
        Heb je dit niet aangevraagd? Dan kun je deze e-mail negeren.
      </p>
      ${SIGNATURE}
    `),
  });
}

// Bevestiging dat iemand op de wachtlijst staat (taak was vol).
export async function sendWaitlistEmail(to: string, data: { naam: string; taakNaam: string; wijzigLink: string }) {
  const naam = escapeHtml(data.naam);
  const taakNaam = escapeHtml(data.taakNaam);
  const wijzigLink = escapeHtml(data.wijzigLink);
  return sendEmailWithRetry({
    from: FROM,
    to,
    subject: `Wachtlijst Startzondag - ${data.taakNaam}`,
    html: shell(`
      <h2 style="color: #1f2937; margin-top: 0;">Beste ${naam},</h2>
      <p style="color: #4b5563; line-height: 1.6;">
        De taak <strong>${taakNaam}</strong> is op dit moment vol. We hebben je op de
        <strong>wachtlijst</strong> gezet. Komt er een plek vrij, dan laten we het je weten —
        je hoeft zelf niets te doen.
      </p>
      <p style="color: #4b5563; line-height: 1.6;">
        Wil je je van de wachtlijst afmelden? Dat kan via deze link:
      </p>
      <p style="color: #6b7280; font-size: 12px;">${wijzigLink}</p>
      ${SIGNATURE}
    `),
  });
}

// Iemand van de wachtlijst is gepromoveerd naar een echte plek.
export async function sendWaitlistPromotionEmail(to: string, data: { naam: string; taakNaam: string; wijzigLink: string }) {
  const naam = escapeHtml(data.naam);
  const taakNaam = escapeHtml(data.taakNaam);
  const wijzigLink = escapeHtml(data.wijzigLink);
  return sendEmailWithRetry({
    from: FROM,
    to,
    subject: `Er is een plek vrij - ${data.taakNaam}`,
    html: shell(`
      <h2 style="color: #1f2937; margin-top: 0;">Goed nieuws, ${naam}!</h2>
      <p style="color: #4b5563; line-height: 1.6;">
        Er is een plek vrijgekomen voor <strong>${taakNaam}</strong> en je stond bovenaan de
        wachtlijst. Je bent nu <strong>definitief ingedeeld</strong> voor deze taak.
      </p>
      <p style="color: #4b5563; line-height: 1.6;">
        Kun je toch niet? Meld je dan af via deze link, dan kan iemand anders erbij:
      </p>
      <p style="color: #6b7280; font-size: 12px;">${wijzigLink}</p>
      ${SIGNATURE}
    `),
  });
}
