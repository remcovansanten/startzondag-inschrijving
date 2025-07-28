# Vrijwilligersacties Web Applicatie

## Project Overzicht

Dit is een web applicatie voor het organiseren van een eenmalig evenement waarbij vrijwilligers zich kunnen aanmelden voor verschillende taken. Elke taak heeft een maximum aantal plekken beschikbaar.

### Core Features
- Publieke pagina met overzicht van alle taken en beschikbare plekken
- Aanmeldformulier voor vrijwilligers
- Admin dashboard voor beheer
- Excel upload voor taken
- Email bevestigingen
- Simpele maar effectieve beveiliging

## Technische Architectuur

### Tech Stack
- **Framework**: Next.js 15.4 (App Router)
- **Database**: PostgreSQL met Prisma ORM
- **Styling**: Tailwind CSS
- **Email**: Resend API
- **Deployment**: Vercel (of andere Node.js host)
- **Authenticatie**: JWT-based auth voor admin

### Project Structuur
```
volunteer-app/
├── app/
│   ├── page.tsx                 # Homepage met taken overzicht
│   ├── aanmelden/[id]/page.tsx  # Aanmeldpagina per taak
│   ├── bevestiging/page.tsx     # Bevestigingspagina
│   ├── wijzig/[token]/page.tsx  # Wijzig/annuleer aanmelding
│   ├── admin/
│   │   ├── login/page.tsx       # Admin login
│   │   ├── dashboard/page.tsx   # Admin dashboard
│   │   └── layout.tsx           # Admin layout met auth check
│   └── api/
│       ├── taken/route.ts       # GET taken
│       ├── aanmelden/route.ts   # POST nieuwe aanmelding
│       ├── wijzig/route.ts      # PUT/DELETE aanmelding
│       ├── admin/
│       │   ├── login/route.ts   # Admin authenticatie
│       │   ├── upload/route.ts  # Excel upload
│       │   ├── export/route.ts  # Export aanmeldingen
│       │   └── taken/route.ts   # Taken beheer
│       ├── email-test/route.ts  # Email test endpoint
│       ├── health/route.ts      # Health check endpoint
│       └── wijzig/[token]/route.ts # Aanmelding wijzigen
├── components/
│   ├── TaakCard.tsx            # Component voor taak weergave
│   ├── AanmeldForm.tsx         # Aanmeldformulier
│   └── AdminGuard.tsx          # Auth wrapper
├── lib/
│   ├── db.ts                   # Database client
│   ├── email.ts                # Email functies
│   └── auth.ts                 # Auth helpers
└── prisma/
    └── schema.prisma           # Database schema
```

## Database Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Taak {
  id            String   @id @default(cuid())
  naam          String
  beschrijving  String?
  maxAantal     Int
  categorie     String?
  aanmeldingen  Aanmelding[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Aanmelding {
  id            String   @id @default(cuid())
  taakId        String
  taak          Taak     @relation(fields: [taakId], references: [id])
  naam          String
  email         String
  telefoon      String
  opmerking     String?
  token         String   @unique
  bevestigd     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([email])
  @@index([token])
}

model Admin {
  id            String   @id @default(cuid())
  username      String   @unique
  passwordHash  String
  createdAt     DateTime @default(now())
}
```

## Functionaliteiten Detail

### 1. Publieke Homepage
- Overzicht van alle taken in cards/grid layout
- Per taak:
  - Naam en beschrijving
  - Voortgangsbalk: "3 van 5 plekken bezet"
  - Knop "Aanmelden" (disabled als vol)
- Optioneel: Groepering per categorie
- Zoek/filter functionaliteit

### 2. Aanmeldproces
- Aanmeldformulier met:
  - Naam (verplicht)
  - Email (verplicht, validatie)
  - Telefoon (verplicht)
  - Opmerking (optioneel)
- Client-side validatie
- Server-side check op beschikbaarheid
- Genereer unieke token voor aanmelding
- Stuur bevestigingsmail met:
  - Details van de taak
  - Link om aanmelding te wijzigen/annuleren

### 3. Wijzig/Annuleer Functionaliteit
- Unieke URL met token: `/wijzig/[token]`
- Toon huidige gegevens
- Optie om gegevens te wijzigen
- Optie om aanmelding te annuleren
- Bevestiging vereist voor annuleren

### 4. Admin Dashboard

#### Login
- Simpele username/password
- Session-based auth met httpOnly cookie
- Optioneel: "Onthoud mij" functie

#### Dashboard Features
- **Overzicht**:
  - Totaal aantal taken
  - Totaal aantal aanmeldingen
  - Taken die (bijna) vol zijn
  
- **Taken Beheer**:
  - Lijst van alle taken
  - Aanmeldingen per taak bekijken
  - Taak toevoegen/wijzigen/verwijderen
  - Maximum aantal aanpassen
  
- **Excel Upload**:
  - Upload .xlsx of .csv bestand
  - Verwachte kolommen: Naam, Beschrijving, MaxAantal, Categorie
  - Preview voor import
  - Optie: vervang alles of voeg toe
  
- **Aanmeldingen Beheer**:
  - Zoek op naam/email
  - Filter op taak
  - Handmatig aanmelding toevoegen
  - Aanmelding verwijderen
  
- **Export**:
  - Download alle aanmeldingen als Excel
  - Filter opties
  - Groepeer per taak

### 5. Email Functionaliteit

#### Templates
1. **Bevestiging aanmelding**
   ```
   Onderwerp: Bevestiging aanmelding - [Taak naam]
   
   Beste [Naam],
   
   Bedankt voor je aanmelding voor "[Taak naam]".
   
   Je gegevens:
   - Naam: [Naam]
   - Email: [Email]
   - Telefoon: [Telefoon]
   
   Om je aanmelding te wijzigen of annuleren, gebruik deze link:
   [Wijzig link]
   
   Met vriendelijke groet,
   [Organisatie naam]
   ```

2. **Annulering bevestiging**
3. **Herinnering** (optioneel)

## Security Requirements

### Basis Beveiliging
1. **Input Validatie**:
   - Sanitize alle user input
   - Email format validatie
   - Telefoon format check
   - SQL injection preventie (via Prisma)

2. **Rate Limiting**:
   - Max 5 aanmeldingen per IP per uur
   - Max 10 requests per minuut voor API

3. **Token Security**:
   - Cryptografisch veilige tokens (min 32 chars)
   - Tokens verlopen na 30 dagen
   - One-time use voor kritieke acties

4. **Admin Security**:
   - Bcrypt password hashing
   - Session timeout na 4 uur inactiviteit
   - HTTPS only cookies

5. **CORS & Headers**:
   - Strict CORS policy
   - Security headers (CSP, X-Frame-Options, etc.)

## UI/UX Requirements

### Design Principes
- Clean, moderne interface
- Mobile-first responsive design
- Duidelijke call-to-actions
- Nederlandse taal throughout

### Kleurenschema (aanpasbaar)
```css
:root {
  --primary: #2563eb;      /* Blauw */
  --secondary: #64748b;    /* Grijs */
  --success: #16a34a;      /* Groen */
  --danger: #dc2626;       /* Rood */
  --warning: #f59e0b;      /* Oranje */
}
```

### Components Styling
- Cards met subtle shadows
- Hover effecten op interactieve elementen
- Loading states voor alle acties
- Toast notifications voor feedback

## API Endpoints Specificatie

### Public Endpoints

```typescript
// GET /api/taken
Response: {
  taken: [{
    id: string,
    naam: string,
    beschrijving: string,
    maxAantal: number,
    aantalBezet: number,
    categorie: string
  }]
}

// POST /api/aanmelden
Body: {
  taakId: string,
  naam: string,
  email: string,
  telefoon: string,
  opmerking?: string
}
Response: {
  success: boolean,
  message: string
}

// GET /api/wijzig/[token]
Response: {
  aanmelding: {
    naam: string,
    email: string,
    telefoon: string,
    taak: { naam: string }
  }
}

// PUT /api/wijzig/[token]
// DELETE /api/wijzig/[token]
```

### Admin Endpoints (require auth)

```typescript
// POST /api/admin/login
// GET /api/admin/taken
// POST /api/admin/taken
// PUT /api/admin/taken/[id]
// DELETE /api/admin/taken/[id]
// GET /api/admin/aanmeldingen
// POST /api/admin/upload
// GET /api/admin/export
```

## Environment Variables

```env
# .env.local
DATABASE_URL="file:./dev.db"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-this-password"
JWT_SECRET="your-secret-key-min-32-chars"
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yoursite.nl"
NEXT_PUBLIC_SITE_URL="https://yoursite.nl"
```

## Development Workflow

### Initial Setup

#### Option 1: Using Docker for PostgreSQL (Recommended)
```bash
# Create Next.js app
npx create-next-app@latest volunteer-app --typescript --tailwind --app
cd volunteer-app

# Install dependencies
npm install prisma @prisma/client
npm install bcryptjs jsonwebtoken resend xlsx
npm install -D @types/bcryptjs @types/jsonwebtoken

# Start PostgreSQL with Docker
docker run --name volunteer-postgres \
  -e POSTGRES_PASSWORD=localdevpassword \
  -e POSTGRES_DB=volunteer_dev \
  -e POSTGRES_USER=volunteer \
  -p 5432:5432 \
  -d postgres:15-alpine

# Initialize Prisma
npx prisma init --datasource-provider postgresql

# Update DATABASE_URL in .env
# DATABASE_URL="postgresql://volunteer:localdevpassword@localhost:5432/volunteer_dev"
```

#### Option 2: Using Local PostgreSQL
```bash
# Same as above, but use your local PostgreSQL installation
# DATABASE_URL="postgresql://user:password@localhost:5432/volunteer_dev"
```

### Development Commands
```bash
# Database
npx prisma db push         # Create/update database
npx prisma studio          # Visual database editor

# Seed admin user
npm run seed

# Development
npm run dev
```

### Testing Checklist
- [ ] Aanmelden voor een taak
- [ ] Email ontvangst
- [ ] Wijzigen via link
- [ ] Annuleren via link
- [ ] Vol = geen nieuwe aanmeldingen
- [ ] Admin login
- [ ] Excel upload
- [ ] Data export
- [ ] Mobile responsive
- [ ] Error handling

## Deployment Instructions

### Vercel Deployment
1. Push naar GitHub
2. Import in Vercel
3. Set environment variables
4. Deploy

### Post-Deployment
1. Seed admin account
2. Test email verzending
3. Upload taken via Excel
4. Monitoring opzetten

## Uitbreidingsmogelijkheden (Later)
- QR codes voor check-in
- Wachtlijst functionaliteit
- Meerdere evenementen
- Tijdsloten per taak
- Groepsaanmeldingen
- WhatsApp notificaties

## Notes voor Claude Code
- Start met de basis functionaliteit
- Gebruik moderne Next.js 14 patterns (App Router, Server Components)
- Implementeer eerst zonder email, voeg later toe
- Zorg voor duidelijke error messages in het Nederlands
- Maak gebruik van Prisma's type safety
- Test mobile view regelmatig
- Gebruik loading.tsx en error.tsx files waar mogelijk