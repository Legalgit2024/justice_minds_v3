# Justice Minds v3

## Overview
Justice Minds is a specialized platform designed to protect vulnerable individuals by providing secure email management, evidence preservation, and controlled sharing capabilities.

## Key Features

### Enhanced Email Management
- Secure email fetching and storage
- Full HTML and attachment support
- Advanced labeling system
- Comprehensive search functionality

### Evidence Protection
- Chain of custody maintenance
- Hash verification for content integrity
- Complete audit trails
- Access monitoring

### Share Management
- Controlled sharing with revocation
- Access tracking
- Share expiration
- Usage monitoring

### Security
- OAuth2 authentication
- Token management
- Rate limiting
- Secure cookie handling

## Project Structure

```
Justice_minds_v3/
├── components/         # React components
├── lib/               # Core libraries
├── pages/             # Next.js pages
├── public/            # Static assets
├── styles/            # CSS styles
├── types/             # TypeScript types
└── utils/             # Utility functions
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
```

3. Run development server:
```bash
npm run dev
```

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_REDIRECT_URL`

## Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [System Advantages](./SYSTEM_ADVANTAGES.md)

## Security

This system implements multiple security measures:
- Token-based authentication
- Rate limiting
- Access monitoring
- Content verification

## Contributing

1. Create a feature branch
2. Make changes
3. Submit a pull request

## License

Copyright © 2024 Justice Minds. All rights reserved.
