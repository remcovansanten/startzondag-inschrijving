# Startzondag Vrijwilligers Registratie

Een moderne, toegankelijke web applicatie voor het organiseren van vrijwilligers tijdens de Startzondag van de Gereformeerde Kerk Ermelo.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-CC%20BY--NC--SA%204.0-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.4-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

## 🎯 Doel

Deze applicatie is ontworpen om het aanmeldproces voor vrijwilligers te stroomlijnen voor evenementen waar verschillende taken uitgevoerd moeten worden, elk met een beperkt aantal beschikbare plekken. Vrijwilligers kunnen zich eenvoudig aanmelden via een gebruiksvriendelijke interface, terwijl beheerders een volledig overzicht hebben van alle aanmeldingen.

## ✨ Features

### Voor Vrijwilligers
- **Overzichtelijke takenpagina**: Bekijk alle beschikbare taken met realtime beschikbaarheid
- **Eenvoudige aanmelding**: Meld je aan met naam, email, telefoon en optionele opmerkingen
- **Wijzig of annuleer**: Pas je aanmelding aan of trek deze in via een unieke link
- **Visuele voortgang**: Zie direct hoeveel plekken er nog beschikbaar zijn per taak
- **Mobiel-vriendelijk**: Volledig responsive design voor alle apparaten

### Voor Beheerders
- **Beveiligd admin panel**: Veilige login met sessie-beheer
- **Dashboard overzicht**: Real-time statistieken van taken en aanmeldingen
- **Taakbeheer**: Bekijk, bewerk en beheer alle taken en aanmeldingen
- **Excel export**: Download alle aanmeldingen als Excel bestand
- **Email integratie**: Automatische bevestigingsmails (wanneer geconfigureerd)

## 🏗️ Technische Architectuur

### Tech Stack
- **Framework**: [Next.js 15.4](https://nextjs.org/) (App Router)
- **Taal**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: PostgreSQL met [Prisma ORM](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authenticatie**: JWT-based sessie management
- **Email**: [Resend](https://resend.com/) API (optioneel)
- **Hosting**: Geoptimaliseerd voor [Vercel](https://vercel.com/)

### Project Structuur
```
├── app/                    # Next.js App Router pagina's
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard pagina's
│   ├── aanmelden/         # Aanmeld pagina's
│   └── wijzig/            # Wijzig/annuleer pagina's
├── components/            # Herbruikbare React componenten
├── lib/                   # Utility functies en configuratie
├── prisma/                # Database schema en migraties
└── scripts/               # Helper scripts (bijv. seed)
```

## 🚀 Installatie

### Vereisten
- Node.js 18.17 of hoger
- npm of yarn

### Stappen

1. **Clone de repository**
```bash
git clone https://gitlab.com/remcovansanten/startzondag-inschrijving.git
cd startzondag-inschrijving
```

2. **Installeer dependencies**
```bash
npm install
```

3. **Configureer environment variabelen**
```bash
cp .env.local.example .env.local
```
Bewerk `.env.local` met je eigen waarden (zie [Configuratie](#configuratie) hieronder).

4. **Setup de database**
```bash
npx prisma db push
```

5. **Seed de database (optioneel)**
```bash
npm run seed
```

6. **Start de development server**
```bash
npm run dev
```

De applicatie is nu beschikbaar op http://localhost:3000

## ⚙️ Configuratie

### Environment Variabelen

Maak een `.env.local` bestand aan met de volgende variabelen:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/startzondag_dev"

# Admin Credentials
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-this-password"

# Security
JWT_SECRET="your-secret-key-min-32-chars-change-this-in-production"

# Email Service (optioneel)
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="noreply@yourdomain.nl"

# Site URL
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### Email Configuratie

De applicatie werkt zonder email configuratie, maar voor volledige functionaliteit:

1. **Resend (aanbevolen)**
   - Maak een account aan op (https://resend.com)
   - Kopieer je API key naar `.env.local`

2. **Alternatieve email providers**
   - Voor andere email providers, pas de `lib/email.ts` implementatie aan
   - Ondersteunde providers: SendGrid, Mailgun, Amazon SES
   - Raadpleeg de documentatie van je gekozen provider

## 📱 Gebruik

### Voor Vrijwilligers
1. Ga naar de homepage
2. Bekijk beschikbare taken
3. Klik op "Aanmelden" bij de gewenste taak
4. Vul het aanmeldformulier in
5. Ontvang bevestiging (en email indien geconfigureerd)
6. Gebruik de unieke link om aanmelding te wijzigen/annuleren

### Voor Beheerders
1. Ga naar `/admin/login`
2. Log in met de geconfigureerde credentials
3. Beheer taken en aanmeldingen via het dashboard
4. Export data naar Excel voor externe verwerking

## 🔒 Beveiliging

- Wachtwoorden worden gehashed met bcrypt
- JWT tokens voor sessie management
- Unieke tokens voor aanmelding wijzigingen
- Input validatie en sanitization
- Beschermde admin routes via middleware

## 📝 Database Schema

De applicatie gebruikt drie hoofdtabellen:
- **Taak**: Vrijwilligerstaken met max aantal plekken
- **Aanmelding**: Registraties van vrijwilligers
- **Admin**: Beheerder accounts

Zie `prisma/schema.prisma` voor het complete schema.

## 🚢 Deployment

### Vercel (aanbevolen)
1. Push naar GitHub/GitLab
2. Importeer in Vercel
3. Configureer environment variabelen
4. Deploy

### Andere platforms
De applicatie kan gedeployed worden op elk platform dat Node.js ondersteunt:
- Railway
- Heroku
- DigitalOcean App Platform
- Self-hosted met PM2

## 🛠️ Development

### Beschikbare Scripts
```bash
npm run dev      # Start development server
npm run build    # Build voor productie
npm run start    # Start productie server
npm run lint     # Run linter
npm run seed     # Seed database met test data
```

### Database Wijzigingen
```bash
npx prisma db push        # Update database schema
npx prisma studio         # Open database GUI
npx prisma generate       # Genereer Prisma Client
```

## 🤝 Contributing

Contributions zijn welkom! Voor grote wijzigingen, open eerst een issue om te bespreken wat je wilt veranderen.

## 📄 Licentie

Dit project is gelicenseerd onder de Creative Commons BY-NC-SA 4.0 License.

Dit betekent dat je vrij bent om:
- ✅ De software te gebruiken voor non-profit doeleinden
- ✅ De code aan te passen en te verbeteren
- ✅ Het te delen met anderen

Onder de voorwaarden dat:
- ❌ Je het NIET mag gebruiken voor commerciële doeleinden
- 📝 Je moet de originele makers vermelden
- 🔄 Aanpassingen moeten onder dezelfde licentie gedeeld worden

Zie License voor details.

## 👥 Contact

Voor vragen of ondersteuning, neem contact op via de GitLab issues.

---

Ontwikkeld met ❤️ voor Startzondag∏