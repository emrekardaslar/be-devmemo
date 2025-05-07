# StandupSync Backend API

This is the backend service for the StandupSync application, providing API endpoints for daily standup management.

## Technology Stack

- Node.js with Express
- TypeScript
- PostgreSQL
- TypeORM for database interaction

## Setup and Installation

1. Ensure you have Node.js (v14+) and PostgreSQL installed
2. Create a PostgreSQL database named `standups`
3. Clone the repository 
4. Install dependencies:

```
npm install
```

5. Configure your environment variables by creating a `.env` file (use the example below as a template)
6. Run the development server:

```
npm run dev
```

## Environment Variables

Create a `.env` file with the following variables:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=standups
PORT=4000
```

## API Endpoints

### Standup Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/standups` | Create a new standup entry |
| GET | `/api/standups/:date` | Get standup by date |
| GET | `/api/standups` | Get all standups (with optional tag filter) |
| PUT | `/api/standups/:date` | Update standup entry |
| DELETE | `/api/standups/:date` | Delete standup entry |
| PUT | `/api/standups/:date/tags` | Update tags for standup |

### Query Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/query/week` | Get weekly summary |
| GET | `/api/query/month/:month` | Get monthly summary (format: YYYY-MM) |
| GET | `/api/query/blockers` | Get recurring blockers |
| POST | `/api/query` | Process natural language query |

## Natural Language Queries

The API supports natural language queries like:

- "What did I do this week?"
- "What was my focus in April?"
- "Any recurring blockers?"
- "Show me entries tagged with #frontend"

## Data Model

### Standup

- `date`: string (YYYY-MM-DD format, primary key)
- `yesterday`: string (What was done yesterday)
- `today`: string (Plans for today)
- `blockers`: string (Any blockers)
- `tags`: string[] (Array of tag strings)
- `createdAt`: Date (Automatically set)
- `updatedAt`: Date (Automatically updated)

## Build for Production

```
npm run build
npm start
``` 