import { Resend } from 'resend';

// Test email sending with your Resend API key
const resend = new Resend('re_3LgzhThz_LiR6AXfzA552y2HETVV3XDXZ');

async function testEmail() {
  try {
    console.log('Testing email with verified domain gke-startzondag.nl...');
    
    const result = await resend.emails.send({
      from: 'Startzondag GKE <noreply@gke-startzondag.nl>',
      to: 'remcovansanten@me.com',
      subject: 'Test Email - Domein Verificatie Succesvol! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #e94b35; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Gereformeerde Kerk Ermelo</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px;">Startzondag 2025</p>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="color: #333333; margin-top: 0;">Domein Verificatie Succesvol! 🎉</h2>
              
              <p style="color: #666666; line-height: 1.6;">
                Geweldig nieuws! Het domein <strong>gke-startzondag.nl</strong> is succesvol geverifieerd.
              </p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #333333; margin-top: 0;">Wat betekent dit?</h3>
                <ul style="color: #666666; line-height: 1.8;">
                  <li>Emails kunnen nu naar ALLE email adressen worden verzonden</li>
                  <li>Betere deliverability (minder kans op spam folder)</li>
                  <li>Professionele afzender: noreply@gke-startzondag.nl</li>
                  <li>Emails zijn gebranded met het kerk logo en huisstijl</li>
                </ul>
              </div>
              
              <p style="color: #666666; line-height: 1.6;">
                Test gerust een aanmelding op de website - alle vrijwilligers zullen nu een 
                bevestigingsmail ontvangen!
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
              
              <p style="color: #666666; line-height: 1.6; margin-bottom: 0;">
                Met vriendelijke groet,<br>
                <strong>Startzondag Registratie Systeem</strong><br>
                Gereformeerde Kerk Ermelo
              </p>
            </div>
          </div>
          
          <p style="color: #999999; font-size: 12px; text-align: center; margin-top: 20px;">
            Deze email is verzonden vanaf: noreply@gke-startzondag.nl<br>
            Tijd: ${new Date().toLocaleString('nl-NL')}
          </p>
        </div>
      `,
    });
    
    console.log('Email sent successfully!');
    console.log('Result:', result);
    console.log('\nYou can now send emails to ANY email address!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

testEmail();