# AI Text Classifier API

A small Express API that accepts a piece of text and classifies it into one of four
categories: **Complaint**, **Query**, **Feedback**, or **Other**.

The classification is done with a Groq-hosted language model through its
OpenAI-compatible chat completions endpoint.

## Tech

- Node.js 18+
- Express
- dotenv
- Built-in `fetch` (no HTTP client library needed)

## Folder structure

```
.
├── postman/
│   └── ai-text-classifier.postman_collection.json
├── src/
│   ├── controllers/
│   │   └── classifyController.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── routes/
│   │   └── classifyRoutes.js
│   ├── services/
│   │   └── classifierService.js
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell use:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Open `.env` and replace the placeholder with your real Groq API key. You can create
   a key at <https://console.groq.com/keys>.

4. Start the app:

   ```bash
   npm start
   ```

   For development with automatic restarts:

   ```bash
   npm run dev
   ```

   The server runs on <http://localhost:3000> by default.

## Environment variables

| Variable     | Required | Default                     | Description                                      |
| ------------ | -------- | --------------------------- | ------------------------------------------------ |
| `AI_API_KEY` | Yes      | -                           | Groq API key used as a Bearer token.             |
| `AI_MODEL`   | No       | `openai/gpt-oss-20b`        | Model name sent to the Groq API.                 |
| `PORT`       | No       | `3000`                      | Port the Express server listens on.              |

Never commit `.env`. It is already listed in `.gitignore`, and `.env.example` only
contains a placeholder.

## API

### `POST /api/classify`

Request body:

```json
{
  "text": "I was charged twice and nobody answered my emails."
}
```

Success response (`200`):

```json
{
  "category": "Complaint",
  "confidence": 0.8
}
```

`category` is always one of `Complaint`, `Query`, `Feedback`, or `Other`.
`confidence` is a number between `0` and `1`, rounded to 2 decimals.

Sample curl request:

```bash
curl -X POST http://localhost:3000/api/classify \
  -H "Content-Type: application/json" \
  -d '{"text": "I was charged twice and nobody answered my emails."}'
```

## Error cases

| Situation                          | Status | Example message                                             |
| ---------------------------------- | ------ | ----------------------------------------------------------- |
| `text` missing, empty, or not text | `400`  | `Text is required and must be a non-empty string.`           |
| `text` longer than 1000 characters | `400`  | `Text must be 1000 characters or fewer.`                     |
| Malformed JSON body                | `400`  | `Invalid JSON body.`                                         |
| Unknown route                      | `404`  | `Route not found: GET /api/unknown`                          |
| Request body too large             | `413`  | `Request body is too large.`                                 |
| AI key missing                     | `502`  | `The AI service is not configured. Please set AI_API_KEY.`    |
| AI call fails                      | `502`  | `The AI service is unavailable right now. Please try again later.` |
| AI call times out after 10 seconds | `502`  | `The AI service took too long to respond. Please try again.`  |

The AI request times out after 10 seconds. All errors are returned in the same shape:

```json
{
  "error": "Clear, human-readable message."
}
```

## Postman

Import `postman/ai-text-classifier.postman_collection.json` into Postman. It contains
four requests: complaint, query, feedback, and an empty-text validation error. The
collection uses a `baseUrl` variable set to `http://localhost:3000`.

## How AI was used

**Prompt design.** The system prompt asks the model to classify the user's text into
one of the four fixed categories. It also requires a JSON-only response in the shape
`{"category": "...", "confidence": 0.0}` and uses `temperature: 0` so responses are
as consistent as possible. The user's text is sent as a separate user message wrapped
in `<text>` tags. The prompt explicitly says the text is data, not instructions, which
reduces (but cannot fully remove) prompt-injection risk.

**Safe parsing.** The model's reply is cleaned before parsing: markdown code fences
are stripped, and the first `{` through the last `}` is extracted and passed to
`JSON.parse`. If parsing fails, the result falls back to `Other` with confidence
`0.5`. Category matching is case-insensitive, and anything outside the four allowed
values becomes `Other`.

**Confidence handling.** Model-reported confidence is not reliable, so the API treats
it as a raw value only: if it is missing or not a finite number, it defaults to `0.5`.
Valid numbers are clamped to the `0` to `1` range and rounded to two decimals.

## Notes

- No secrets are hardcoded. The API key is read only from `AI_API_KEY`.
- The project intentionally uses plain functions instead of classes or extra
  abstractions to keep it easy to read and extend.
