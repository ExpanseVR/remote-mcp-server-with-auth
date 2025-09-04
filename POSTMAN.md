## Postman guide: Cloudflare MCP server + GitHub OAuth (PKCE)

This document shows how to exercise the MCP server with Postman using OAuth 2.0 Authorization Code + PKCE, then call the Streamable HTTP MCP endpoint.

### Prerequisites

- MCP server running locally using Wrangler:
  In the terminal you will see the following -
  ```json
  ⎔ Starting local server...
  [wrangler:info] Ready on http://127.0.0.1:8792
  ```
  This will help you identify the base url to use -> `http://127.0.0.1:8792`
- In GitHub make sure you have an OAuth app configured to match your host:
  - Homepage URL: `http://127.0.0.1:8792`
  - Authorization callback URL: `http://127.0.0.1:8792/callback`
- You’ve registered a Postman OAuth client on the MCP server (dynamic registration).

### 1) Discover endpoints (optional)

GET `http://127.0.0.1:8792/.well-known/oauth-authorization-server`

Note `authorization_endpoint`, `token_endpoint`, and `registration_endpoint`.

### 2) Register Postman client (one time)

POST `http://127.0.0.1:8792/register`

Body (JSON):

```json
{
  "application_type": "web",
  "client_name": "Postman Test Client",
  "redirect_uris": ["https://oauth.pstmn.io/v1/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none",
  "scope": "read:user"
}
```

Save `client_id` from the response.

### 3) Get an access token in Postman

- In any Request go to Open Authorization:
  - Select Auth Type from drop down -> OAuth 2.0
- Then in the right panel scroll down to Configure New Token
- Name the Token whatever description you want. Its just for Identifying.
- Grant Type: Authorization Code (With PKCE)
- Callback URL: `https://oauth.pstmn.io/v1/callback`
- Auth URL: `http://127.0.0.1:8792/authorize`
- Access Token URL: `http://127.0.0.1:8792/token`
- Client ID: your value
- Client Secret: leave blank
- Client Authentication: Send client credentials in body
- Code Challenge Method: S256
- Scope: `read:user`
- Click “Get New Access Token”, complete GitHub auth → “Use Token”.

You should now have a bearer token.

### 4) Initialize MCP session

POST `http://127.0.0.1:8792/mcp`

Headers:

- Authorization: `Bearer <YOUR_TOKEN>`
- Content-Type: `application/json`
- Accept: `application/json, text/event-stream`

Body:

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "initialize",
  "params": {
    "clientInfo": { "name": "postman", "version": "1.0.0" },
    "protocolVersion": "2025-03-26",
    "capabilities": {}
  }
}
```

Response:

- Status 200 with JSON result
- Response headers include `mcp-session-id` → copy its value

### 5) Call MCP methods (example: list tools)

POST `http://127.0.0.1:8792/mcp`

Headers:

- Authorization: `Bearer <YOUR_TOKEN>`
- Mcp-Session-Id: `<value from step 4>`
- Content-Type: `application/json`
- Accept: `application/json, text/event-stream`

Body:

```json
{ "jsonrpc": "2.0", "id": "2", "method": "tools/list", "params": {} }
```

### 6) Optional: open SSE stream for server → client events

GET `http://127.0.0.1:8792/mcp`

Headers:

- Mcp-Session-Id: `<value from step 4>`

Keep the connection open to receive streamed responses/notifications.

### 7) End the session

DELETE `http://127.0.0.1:8792/mcp`

Headers:

- Mcp-Session-Id: `<value from step 4>`

---

## Troubleshooting

- 302/redirect loop or GitHub warning about redirect_uri
  - Ensure host matches your GitHub App exactly (`127.0.0.1` vs `localhost`).

- 400 Not Acceptable (Accept header)
  - Add `Accept: application/json, text/event-stream`.

- 415 Unsupported Media Type
  - Add `Content-Type: application/json` and send valid JSON.

- 400 “Mcp-Session-Id header is required”
  - You sent a non-initialize request without a session. First call `initialize` with no `Mcp-Session-Id`, then copy the returned `mcp-session-id` header and include it in subsequent requests.

- 404 “Session not found”
  - The session expired or was never initialized. Re-run step 4 to create a new session.

- 401 “invalid_token”
  - The Authorization bearer token is missing/expired. Click “Get New Access Token” and retry.

- Host mismatch (127.0.0.1 vs localhost)
  - Keep the same host across: GitHub app settings, Postman Auth/Token URLs, and server base URL.
