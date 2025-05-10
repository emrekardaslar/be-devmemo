# Environment Variables Setup

This document explains how to properly set up environment variables for the StandupSync backend to connect to Supabase.

## Required Environment Variables

The following environment variables need to be set:

### `DATABASE_URL`

This is your Supabase PostgreSQL connection string. The format is:

```
DATABASE_URL=postgresql://username:password@hostname:port/database
```

For Supabase connection pooler, it typically looks like:

```
DATABASE_URL=postgresql://postgres.projectid:password@aws-0-region.pooler.supabase.com:5432/postgres
```

### `NODE_ENV`

Set to `development` for local development or `production` for production deployment.

### `PORT` (optional)

The port on which the server will run (defaults to 3000 if not specified).

## Setting Environment Variables

### For Local Development

Create a `.env` file in the `backend` directory with the following content:

```
DATABASE_URL=your_supabase_connection_string
NODE_ENV=development
PORT=3000
```

### For Production Deployment

Set these environment variables in your hosting platform (Netlify, Vercel, Heroku, etc.).

## Testing Your Connection

After setting up your environment variables, you can test the database connection by running:

```bash
npm install dotenv pg
node setup-supabase.js
```

This will verify that your connection string works correctly and set up the necessary database schema.

## Security Notes

- Never commit your `.env` file to version control
- Never hardcode connection strings in your source code
- Use environment variables for all sensitive information
- Rotate your Supabase database password periodically
- Consider using environment-specific connection strings 