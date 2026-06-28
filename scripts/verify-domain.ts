import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  throw new Error('RESEND_API_KEY ontbreekt — zet deze in de environment. Geen hardcoded fallback.');
}
const resend = new Resend(apiKey);

async function verifyDomain() {
  try {
    console.log('Attempting to verify domain gke-startzondag.nl...');
    
    // Verify the domain
    const result = await resend.domains.verify('ab005c0b-c483-42ee-868c-655560a12803');
    
    console.log('Verification result:', result);
    
    // Check domain status
    const domains = await resend.domains.list();
    console.log('\nAll domains:', domains);
    
    const yourDomain = domains.data?.data?.find(d => d.name === 'gke-startzondag.nl');
    if (yourDomain) {
      console.log('\nYour domain status:', yourDomain.status);
      console.log('Domain details:', yourDomain);
    }
    
  } catch (error) {
    console.error('Error verifying domain:', error);
  }
}

verifyDomain();