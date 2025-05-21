# StandupSync Backend API

This is the backend service for the StandupSync application, providing API endpoints for daily standup management.

## Demo API

The production API is deployed at [https://be-devmemo.onrender.com/api](https://be-devmemo.onrender.com/api)

Example API endpoints:
- [All Standups](https://be-devmemo.onrender.com/api/standups)
- [Highlight Standups](https://be-devmemo.onrender.com/api/standups/highlights)
- [Standup Statistics](https://be-devmemo.onrender.com/api/standups/stats)

## Technology Stack

- Node.js with Express
- TypeScript
- PostgreSQL
- TypeORM for database interaction
- Google Gemini AI for natural language processing

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
GEMINI_API_KEY=your_google_gemini_api_key  # Optional but recommended for AI features
```

## Gemini AI Integration

StandupSync now features advanced natural language processing capabilities powered by Google's Gemini AI. This integration enables:

- Intelligent analysis of standup data
- Natural language query processing with context-aware responses
- Pattern recognition in blockers and productivity trends
- Smart summarization of standup entries over time

### Features

1. **Enhanced Query Processing**
   - Process conversational queries about standup data
   - Generate structured JSON responses with insights
   - Provide context-aware recommendations

2. **Standup Analysis**
   - Analyze recurring patterns in blockers
   - Identify productivity and mood trends
   - Extract key focus areas from standup content

3. **Smart Fallbacks**
   - Graceful degradation when AI services are unavailable
   - Robust error handling for API limitations
   - Automatic model selection based on availability

### Configuration

To enable Gemini AI features, obtain an API key from the [Google AI Studio](https://makersuite.google.com/) and add it to your `.env` file:

```
GEMINI_API_KEY=your_google_gemini_api_key
```

The system will function without an API key, but with limited natural language capabilities.

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
- "Analyze my productivity trends over the last month"
- "What are the common themes in my recent work?"

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

---

**Note:** This backend project (and its companion frontend) is an experimental project built using Cursor (an AI-powered IDE) and memory banks. It serves as a trial to explore the capabilities of Cursor's AI assistant and memory bank tools. As such, the project's design, documentation, and implementation reflect an experimental approach to leveraging AI-driven development workflows. 