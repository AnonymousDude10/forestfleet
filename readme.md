# ForestFleet Improved

## Overview

This project **does not use Supabase authentication directly from the client**. Instead, all sensitive authentication and user data operations are handled securely on the server via API endpoints and middleware. This approach protects your Supabase service keys and ensures that only validated, authorized requests can access protected resources.

## How It Works

### 1. Login Flow

- The user submits their credentials (email and password) to the `/api/auth/login` endpoint.
- The server-side handler (`server/api/auth/login.ts`) uses the Supabase Admin SDK to verify credentials and generate a JWT token.
- On successful login, the server responds with a JWT token (e.g., `Bearer ...`), which is stored in the browser's `localStorage` as `foresttoken`.

### 2. Authenticated Requests

- For any API request that requires authentication, the client includes the `foresttoken` in the `Authorization` header.
- Example:
  ```http
  Authorization: Bearer <token>
  ```

### 3. Server-Side Middleware

- All API routes under `/api/` (except `/api/auth/login`) are protected by the `server/middleware/auth.ts` middleware.
- This middleware:
  - Extracts and verifies the JWT token using the Supabase Admin SDK.
  - Loads the user's profile from the database.
  - Attaches the user object to the request context (`event.context.user`).
  - Rejects requests with missing/invalid tokens or users.

### 4. Secure User Data

- The `/api/auth/me` endpoint (`server/api/auth/me.ts`) returns the authenticated user's profile, but only if the request passes through the middleware and has a valid user context.

### 5. No Client-Side Supabase Keys

- **Supabase service keys are never exposed to the client.**
- All Supabase operations requiring privileged access are performed server-side only.

## Benefits

- **No exposure of service keys**: All sensitive keys are kept server-side.
- **Centralized access control**: All authentication and authorization logic is enforced on the server.
- **Easier to audit and extend**: Security logic is in one place, making it easier to maintain and improve.

## Example Flow

1. User logs in via `/api/auth/login` → receives JWT.
2. Client stores JWT and uses it for future API requests.
3. Server middleware checks JWT on every API call.
4. If valid, request proceeds; if not, returns an error.