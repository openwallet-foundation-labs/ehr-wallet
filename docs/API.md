# API Documentation

Welcome to the API documentation for EHR Wallet.

This documentation provides details on the available API endpoints, request parameters, and response formats.

## Authentication API

### `/api/auth/register` (POST)

This endpoint allows new users to register.

**Request Body (JSON):**

```json
{
  "name": "string (optional)",
  "email": "string (required)",
  "password": "string (required)",
  "role": "string (optional, defaults to 'STAFF', can be 'ADMIN', 'DOCTOR', 'STAFF')"
}
```

**Responses:**

*   **201 Created:** User successfully created.
    ```json
    {
      "id": "string",
      "name": "string | null",
      "email": "string",
      "role": "string"
      // Note: Password is not returned
    }
    ```
*   **400 Bad Request:** Email or password not provided.
    ```json
    {
      "message": "Email and password are required"
    }
    ```
*   **405 Method Not Allowed:** If a method other than `POST` is used.
    ```json
    {
      "message": "Method not allowed"
    }
    ```
*   **409 Conflict:** User with this email already exists.
    ```json
    {
      "message": "User with this email already exists"
    }
    ```
*   **500 Internal Server Error:** If there's an issue during registration.
    ```json
    {
      "message": "Internal server error"
    }
    ```

**Notes:**

*   Passwords are hashed using `bcryptjs` before being stored.
*   The `initDatabase()` function is called to ensure the database is ready.
*   The `createUser` and `getUserByEmail` functions from `@/lib/db-utils` are used for database interactions.

### NextAuth.js API Endpoints (`/api/auth/*`)

These endpoints are automatically handled by NextAuth.js based on the configuration in `lib/auth.ts`. The primary file for this is `pages/api/auth/[...nextauth].ts`.

**Configuration Overview**

- **Session Strategy:** JWT
- **Session Max Age:** 30 days
- **Custom Pages:**
  - Sign-in: `/login`
  - Error: `/login?error=true`
- **Providers:**
  1.  **Ethereum (`id: 'ethereum'`)**: 
      - Type: Credentials
      - Name: "Ethereum"
      - Credentials: `message`, `signature`, `address`
      - Logic: Verifies Ethereum signature, finds or creates a user based on the Ethereum address.
  2.  **Credentials (`id: 'credentials'`)**: 
      - Type: Credentials
      - Name: "Credentials"
      - Credentials: `email`, `password`
      - Logic: Validates email and password against users in the database (uses `bcryptjs` for password comparison).

- **Callbacks:**
  - `jwt`: Adds `id`, `email`, `name`, `role`, `ethereumAddress` to the JWT token.
  - `session`: Adds `id`, `email`, `name`, `role`, `ethereumAddress` to the session object from the token.

**Standard NextAuth.js Endpoints**

NextAuth.js provides several built-in API routes. Here are some of the most relevant ones:

**1. Sign In**

- **Route:** `POST /api/auth/signin/:providerId`
- **Description:** Initiates the sign-in flow for a specific provider.
  - For `ethereum` provider (`/api/auth/signin/ethereum`):
    - **Request Body (JSON):**
      ```json
      {
        "message": "string",
        "signature": "string",
        "address": "string",
        "csrfToken": "string", // Automatically handled by NextAuth.js client
        "callbackUrl": "string", // Optional, where to redirect after sign-in
        "json": true
      }
      ```
  - For `credentials` provider (`/api/auth/signin/credentials`):
    - **Request Body (JSON):**
      ```json
      {
        "email": "string",
        "password": "string",
        "csrfToken": "string", // Automatically handled by NextAuth.js client
        "callbackUrl": "string", // Optional, where to redirect after sign-in
        "json": true
      }
      ```
- **Response:** Redirects on success or failure, or returns JSON if `json: true` is used by the client.

- **Route:** `GET /api/auth/signin`
- **Description:** Typically redirects to the custom sign-in page (`/login` as configured).

**2. Sign Out**

- **Route:** `POST /api/auth/signout`
- **Description:** Signs the user out.
  - **Request Body (Form Data or JSON):**
    ```json
    {
      "csrfToken": "string" // Automatically handled
    }
    ```
- **Response:** Redirects to the home page or a specified callback URL.

- **Route:** `GET /api/auth/signout`
- **Description:** Typically redirects to a page confirming sign-out or the home page.

**3. Session**

- **Route:** `GET /api/auth/session`
- **Description:** Retrieves the current user's session.
- **Response (JSON):**
  - If authenticated:
    ```json
    {
      "user": {
        "id": "string",
        "name": "string | null",
        "email": "string",
        "role": "string",
        "ethereumAddress": "string | null"
      },
      "expires": "string" // ISO 8601 date string
    }
    ```
  - If not authenticated: `null` or an empty object `{}` depending on client-side handling.

**4. CSRF Token**

- **Route:** `GET /api/auth/csrf`
- **Description:** Returns a CSRF token. This is mainly used internally by NextAuth.js client methods.
- **Response (JSON):**
  ```json
  {
    "csrfToken": "string"
  }
  ```

**5. Providers**

- **Route:** `GET /api/auth/providers`
- **Description:** Returns a list of configured authentication providers.
- **Response (JSON):**
  ```json
  {
    "ethereum": {
      "id": "ethereum",
      "name": "Ethereum",
      "type": "credentials",
      "signinUrl": "/api/auth/signin/ethereum",
      "callbackUrl": "/api/auth/callback/ethereum"
    },
    "credentials": {
      "id": "credentials",
      "name": "Credentials",
      "type": "credentials",
      "signinUrl": "/api/auth/signin/credentials",
      "callbackUrl": "/api/auth/callback/credentials"
    }
  }
  ```

**6. Error Handling**

- **Route:** `GET /api/auth/error`
- **Description:** Displays an error page or redirects to the custom error page (`/login?error=true` as configured).

**Notes:**

- The actual interaction with these endpoints is often abstracted away by NextAuth.js client-side functions like `signIn()`, `signOut()`, `useSession()`, and `getSession()`.
- The `authorize` functions within each provider in `lib/auth.ts` contain the core logic for validating credentials and fetching/creating user data.

## Access Logs API

### `/api/access-logs` (GET)

This endpoint retrieves access logs for the authenticated user.

**Request**

- **Method:** `GET`
- **Authentication:** Required (Session-based using NextAuth)

**Response**

**Success (200 OK)**

Returns an array of access log objects. Each object has the following structure:

```json
[
  {
    "id": "string", // Access ID
    "accessedBy": "string", // Ethereum address of the user who owns the data (currently)
    "accessedAt": "string", // ISO 8601 date string
    "dataTypes": ["string"], // Array of data types accessed
    "ipfsCid": "string", // IPFS CID of the accessed data
    "status": "string", // 'active' or 'expired'
    "expiryTime": "string", // ISO 8601 date string
    "accessCount": "number", // Number of times accessed
    "pinStatus": "string" // e.g., 'pinned'
  }
]
```

- If the user has no Ethereum address or no access logs are found, an empty array `[]` is returned.

**Errors**

- **401 Unauthorized:** If the user is not authenticated.
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- **404 Not Found:** If the authenticated user's record is not found in the database.
  ```json
  {
    "error": "User not found"
  }
  ```
- **405 Method Not Allowed:** If a method other than `GET` is used.
  ```json
  {
    "error": "Method not allowed"
  }
  ```
- **500 Internal Server Error:** If there's an issue fetching the access logs.
  ```json
  {
    "error": "Failed to fetch access logs"
  }
  ```

**Notes**

- The endpoint fetches `sharedMedicalData` records associated with the authenticated user's Ethereum address.
- `dataTypes` are parsed from a comma-separated string in the database.
- `status` is determined by `isActive` and `expiryTime` fields in the database.
- For debugging/testing purposes, if no records are found for the user but records exist in the database, it might return all records.

### `/api/access-logs/pinata` (GET)

This endpoint retrieves access logs for the authenticated user's IPFS CIDs, augmented with data from Pinata.

**Request**

- **Method:** `GET`
- **Authentication:** Required (Session-based using NextAuth)

**Response**

**Success (200 OK)**

Returns an array of access log objects. Each object has the following structure:

```json
[
  {
    "id": "string", // Access ID from local database
    "accessedBy": "string", // Ethereum address of the user who owns the data
    "accessedAt": "string", // ISO 8601 date string (creation time of the local record)
    "dataTypes": ["string"], // Array of data types accessed
    "ipfsCid": "string", // IPFS CID of the accessed data
    "status": "string", // 'active' or 'expired' (based on local database `isActive` and `expiryTime`)
    "expiryTime": "string", // ISO 8601 date string (from local database)
    "accessCount": "number", // Estimated access count from Pinata, or local `accessCount` if Pinata data is unavailable
    "pinDate": "string", // ISO 8601 date string (pin date from Pinata, or local `createdAt` if Pinata data is unavailable)
    "pinStatus": "string" // Pin status from Pinata (e.g., 'pinned', 'unpinned'), or 'unknown' if Pinata data is unavailable
  }
]
```

- If the user has no Ethereum address or no IPFS CIDs associated with their shared data, an empty array `[]` is returned.

**Errors**

- **401 Unauthorized:** If the user is not authenticated.
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- **404 Not Found:** If the authenticated user's record is not found in the database.
  ```json
  {
    "error": "User not found"
  }
  ```
- **405 Method Not Allowed:** If a method other than `GET` is used.
  ```json
  {
    "error": "Method not allowed"
  }
  ```
- **500 Internal Server Error:** If there's an issue fetching data from the database or Pinata.
  ```json
  {
    "error": "Failed to fetch access logs from Pinata"
  }
  ```

**Notes**

- The endpoint first fetches `sharedMedicalData` records for the authenticated user from the local database.
- It then extracts the `ipfsCid` from these records.
- It calls the `pinataService.getAccessLogs()` method to retrieve access information from Pinata for these CIDs.
- The returned data combines information from the local database with data from Pinata. If Pinata data for a specific CID is not found, it defaults to local data or 'unknown' values for Pinata-specific fields.

## IPFS API

### `/api/ipfs` (GET)

This endpoint acts as a proxy to retrieve content from IPFS. It can be accessed using either an `ipfsCid` or an `accessId` (which then resolves to an `ipfsCid`). It attempts to fetch content from various IPFS sources, including configured private nodes (Pinata, Infura) and public gateways.

**Query Parameters:**

*   `cid` (string, optional): The IPFS Content Identifier (CID) of the desired content.
*   `accessId` (string, optional): An access ID that maps to a shared medical data record containing an `ipfsCid`. If `accessId` is provided, `cid` is ignored.
*   `format` (string, optional, default: `raw`): Preferred format for IPFS content, especially for CIDv1. Can be `dag-json`, `raw`, `dag-cbor`, or empty for default.
*   `responseType` (string, optional, default: `auto`): Specifies how the response should be returned.
    *   `auto`: Tries to determine based on `Content-Type` header.
    *   `json`: Attempts to parse and return as JSON.
    *   `text`: Returns as plain text.
    *   (If not `json` or `text`, or if parsing fails, returns as binary/buffer).

**Behavior:**

1.  **Method Check:** Only `GET` requests are allowed.
2.  **Parameter Resolution:**
    *   If `accessId` is provided:
        *   Looks up the `SharedMedicalData` record in the database.
        *   Checks if the record `isActive` and not `expired`.
        *   If valid, retrieves the `ipfsCid`.
        *   Increments the `accessCount` for the record.
        *   If `hasPassword` is true on the record, it returns a JSON response:
            ```json
            {
              "accessId": "string",
              "ipfsCid": "string",
              "hasPassword": true,
              "expiryTime": "string", // ISO 8601 date
              "message": "This content is password protected. Please use the password to decrypt it."
            }
            ```
            (Status: 200 OK)
    *   If `cid` is provided directly, it uses that CID.
3.  **IPFS Fetching Strategy:**
    *   Normalizes the CID (handles v0/v1 differences, though the current implementation is basic).
    *   For certain known CIDs or CIDv1 that might need special handling, it first attempts:
        *   **Pinata API:** If `NEXT_PUBLIC_PINATA_JWT` or (`NEXT_PUBLIC_PINATA_API_KEY` and `NEXT_PUBLIC_PINATA_SECRET_API_KEY`) are set. Checks pin status and tries to retrieve content via Pinata gateway.
        *   **Infura IPFS API:** If `NEXT_PUBLIC_IPFS_PROJECT_ID` and `NEXT_PUBLIC_IPFS_PROJECT_SECRET` are set. Tries `dag/get`, `cat`, then `block/get` endpoints.
    *   If direct access fails or is not applicable, it tries a list of **public IPFS gateways**:
        *   `https://ipfs.io/ipfs`
        *   `https://dweb.link/ipfs`
        *   `https://cloudflare-ipfs.com/ipfs`
        *   `https://gateway.pinata.cloud/ipfs`
        *   (Known CIDs might have preferred gateways and formats).
    *   It iterates through gateways and formats (`dag-json`, `raw`, `dag-cbor`, or default) until content is successfully fetched.
4.  **Response Delivery:**
    *   If content is fetched successfully (200 OK):
        *   Sets `Content-Type` based on the IPFS gateway's response or defaults to `application/octet-stream`.
        *   If `responseType` is `json` or `Content-Type` is JSON, returns JSON.
        *   If `responseType` is `text` or `Content-Type` is text, returns text.
        *   Otherwise, returns binary data (Buffer).

**Success Responses:**

*   **200 OK:**
    *   If `accessId` points to password-protected data (see JSON structure above).
    *   If IPFS content is successfully retrieved. The body will be the content itself, formatted according to `responseType` and `Content-Type`.

**Error Responses:**

*   **400 Bad Request:**
    ```json
    { "error": "Missing IPFS CID parameter" }
    ```
*   **403 Forbidden:** (When using `accessId`)
    ```json
    { "error": "Access has expired" }
    ```
*   **404 Not Found:**
    *   If `accessId` is not found or access revoked:
        ```json
        { "error": "Shared data not found or access has been revoked" }
        ```
    *   If IPFS content cannot be found after trying all gateways:
        ```json
        {
          "error": "IPFS content not found",
          "message": "string", // Last gateway error or generic message
          "cid": "string",
          "attemptedUrls": ["string"] // List of URLs tried
        }
        ```
*   **405 Method Not Allowed:**
    ```json
    { "error": "Method not allowed" }
    ```
*   **500 Internal Server Error:**
    *   If database lookup for `accessId` fails:
        ```json
        { "error": "Failed to retrieve shared data" }
        ```
    *   General proxy error:
        ```json
        {
          "error": "IPFS proxy error",
          "message": "string", // Error message
          "cid": "string" // If CID was determined
        }
        ```

**Environment Variables Used:**

*   `NEXT_PUBLIC_PINATA_API_KEY`, `NEXT_PUBLIC_PINATA_SECRET_API_KEY`, `NEXT_PUBLIC_PINATA_JWT`: For Pinata direct access.
*   `NEXT_PUBLIC_PINATA_GATEWAY_URL`: Pinata gateway URL.
*   `NEXT_PUBLIC_IPFS_NODE_URL`: (Potentially for Infura or other direct node access, though Infura config is more specific).
*   `NEXT_PUBLIC_IPFS_PROJECT_ID`, `NEXT_PUBLIC_IPFS_PROJECT_SECRET`: For Infura direct access.

### `/api/ipfs/pinata-diagnostic` (GET)

This endpoint runs diagnostics on a given IPFS CID to check its status on Pinata and several public IPFS gateways.

**Query Parameters:**

*   `cid` (string, required): The IPFS Content Identifier (CID) to diagnose.

**Behavior:**

1.  **Method Check:** Only `GET` requests are allowed.
2.  **CID Validation:** Ensures `cid` is provided.
3.  **Pinata Status Check:**
    *   Requires Pinata API credentials (`NEXT_PUBLIC_PINATA_JWT` or `NEXT_PUBLIC_PINATA_API_KEY` & `NEXT_PUBLIC_PINATA_SECRET_API_KEY`) to be set in environment variables.
    *   Checks Pinata's `/pinning/pinJobs` endpoint for the CID.
    *   If not found, checks Pinata's `/data/pinList` endpoint.
    *   The result includes `pinata.status` ('pinned', 'not_pinned', 'error', 'no_credentials') and `pinata.details`.
4.  **IPFS Gateway Status Check:**
    *   Probes the following public gateways using a `HEAD` request:
        *   `https://ipfs.io/ipfs`
        *   `https://dweb.link/ipfs`
        *   `https://cloudflare-ipfs.com/ipfs`
        *   `https://gateway.pinata.cloud/ipfs`
    *   For each gateway, it records the status (`available`, `error`), HTTP status code, and potentially `Content-Type` and `Content-Length` if available.
    *   The overall `ipfs.status` will be 'available' if at least one gateway successfully responds, otherwise 'not_found'.

**Success Response (200 OK):**

Returns a JSON object with diagnostic results:

```json
{
  "status": "success",
  "cid": "string", // The CID that was diagnosed
  "timestamp": "string", // ISO 8601 date string of when the diagnostic was run
  "pinata": {
    "status": "string", // 'pinned', 'not_pinned', 'error', 'no_credentials', 'unknown'
    "details": {
      // If 'pinned', contains details from Pinata API (e.g., pin job or pin list entry)
      // If 'error', contains error message
    }
  },
  "ipfs": {
    "status": "string", // 'available', 'not_found', 'unknown'
    "gateways": {
      "ipfs.io": {
        "status": "string", // 'available' or 'error'
        "statusCode": "number", // (e.g., 200, 404)
        "contentType": "string | null",
        "contentLength": "string | null"
        // Or "error": "string" if an error occurred during the check
      },
      "dweb.link": { /* ... similar structure ... */ },
      "cloudflare-ipfs.com": { /* ... similar structure ... */ },
      "gateway.pinata.cloud": { /* ... similar structure ... */ }
    }
  }
}
```

**Error Responses:**

*   **400 Bad Request:**
    ```json
    { "error": "Missing IPFS CID parameter" }
    ```
*   **405 Method Not Allowed:**
    ```json
    { "error": "Method not allowed" }
    ```
*   **500 Internal Server Error:** General error during diagnostics.
    ```json
    {
      "status": "error",
      "error": "IPFS diagnostic error",
      "message": "string", // Error message
      "cid": "string"
    }
    ```

**Environment Variables Used:**

*   `NEXT_PUBLIC_PINATA_API_KEY`, `NEXT_PUBLIC_PINATA_SECRET_API_KEY`, `NEXT_PUBLIC_PINATA_JWT`: For checking Pinata status.

## Shared Data API

### `/api/shared-data` (GET, POST)

This endpoint is used to manage shared medical data records. It supports retrieving existing records and creating new ones. All operations require authentication.

**Authentication:** Required for all methods.

---

#### `GET /api/shared-data`

Retrieves shared medical data records.

**Query Parameters:**

*   `all` (boolean, optional): If `true`, returns all shared data records in the system (intended for administrative/access log purposes). Otherwise, returns records associated with the authenticated user's Ethereum address.
*   `address` (string, optional): An Ethereum address. If provided, and `all` is not `true`, attempts to fetch records for this address. If not provided, uses the Ethereum address from the authenticated user's session.

**Behavior:**

1.  **Authentication Check:** Verifies the user is authenticated.
2.  **Record Retrieval:**
    *   If `all=true`, fetches all `SharedMedicalData` records, ordered by creation date (descending).
    *   Otherwise, determines the target Ethereum address (from session or `address` query parameter).
    *   Fetches records where `userId` matches the normalized (lowercase) Ethereum address. Includes a fallback for a hardcoded demo address for testing purposes.
    *   Records are ordered by creation date (descending).

**Success Response (200 OK):**

Returns a JSON array of shared medical data objects. Each object has a structure similar to:

```json
[
  {
    "id": "string", // Unique record ID
    "accessId": "string", // Publicly shareable access ID
    "ipfsCid": "string", // IPFS CID of the data
    "userId": "string", // Ethereum address of the user who created/owns it
    "expiryTime": "string", // ISO 8601 date string
    "hasPassword": "boolean",
    "dataTypes": "string | null", // Comma-separated list of data types
    "accessCount": "number",
    "isActive": "boolean",
    "createdAt": "string", // ISO 8601 date string
    "updatedAt": "string"  // ISO 8601 date string
  }
  // ... more records
]
```

**Error Responses:**

*   **400 Bad Request:**
    ```json
    { "error": "No ethereum address associated with this account or provided in the request" }
    ```
    (If user-specific records are requested but no address can be determined).
*   **401 Unauthorized:**
    ```json
    { "error": "Unauthorized" }
    ```
*   **500 Internal Server Error:**
    ```json
    { "error": "Failed to fetch shared data" }
    ```

---

#### `POST /api/shared-data`

Creates a new shared medical data record.

**Request Body (JSON):**

*   `accessId` (string, required): A unique, publicly shareable ID for accessing this data.
*   `ipfsCid` (string, required): The IPFS CID where the actual data is stored.
*   `expiryTime` (string, required): An ISO 8601 date string indicating when access to this data should expire.
*   `hasPassword` (boolean, optional, default: `false`): Indicates if the data at `ipfsCid` is password-protected.
*   `dataTypes` (string | string[], optional): A comma-separated string or an array of strings describing the types of data (e.g., "DICOM,Report").

**Behavior:**

1.  **Authentication Check:** Verifies the user is authenticated.
2.  **Validation:** Checks for required fields (`accessId`, `ipfsCid`, `expiryTime`).
3.  **User Identification:** Retrieves the authenticated user's Ethereum address. In development, a default address might be used if none is found in the session.
4.  **Record Creation:** Creates a new `SharedMedicalData` record in the database with the provided details, associating it with the user's normalized (lowercase) Ethereum address. `accessCount` is initialized to 0 and `isActive` to `true`.

**Success Response (201 Created):**

Returns the newly created shared medical data object (see structure in GET response).

**Error Responses:**

*   **400 Bad Request:**
    ```json
    { "error": "Missing required fields" }
    ```
    ```json
    { "error": "No ethereum address associated with this account" } // If not in development and no address found
    ```
*   **401 Unauthorized:**
    ```json
    { "error": "Unauthorized" }
    ```
*   **500 Internal Server Error:**
    ```json
    { "error": "Failed to create shared data" }
    ```

---

### `/api/shared-data/find-by-cid` (GET)

Finds an active shared medical data record's `accessId` and `expiryTime` based on its IPFS CID.

**Query Parameters:**

*   `cid` (string, required): The IPFS Content Identifier (CID) to search for.

**Behavior:**

1.  **Method Check:** Only `GET` requests are allowed.
2.  **Cache Control:** Sets headers to prevent caching of the response.
3.  **CID Validation:** Ensures `cid` is provided and is a string.
4.  **Database Lookup:** Searches for a `SharedMedicalData` record where `ipfsCid` matches the provided `cid` and `isActive` is `true`.
5.  **Expiry Check:** If a record is found, checks if `expiryTime` has passed.
6.  **Response:**
    *   If a matching, active, and non-expired record is found, returns its `accessId` and `expiryTime`.
    *   If no record is found, returns 404.
    *   If the record is found but has expired, returns 403.

**Success Response (200 OK):**

```json
{
  "accessId": "string", // The accessId associated with the CID
  "expiryTime": "string" // ISO 8601 date string of when access expires
}
```

**Error Responses:**

*   **400 Bad Request:**
    ```json
    { "error": "Missing or invalid CID parameter" }
    ```
*   **403 Forbidden:**
    ```json
    { "error": "Access has expired", "expired": true }
    ```
*   **404 Not Found:**
    ```json
    { "error": "No shared data found for this CID" }
    ```
*   **405 Method Not Allowed:**
    ```json
    { "error": "Method not allowed" }
    ```
*   **500 Internal Server Error:**
    ```json
    { "error": "Failed to find accessId" }
    ```
---
### `/api/shared-data/record-access` (POST)

Records an access attempt for a shared medical data item by incrementing its `accessCount`. This is typically called when content associated with an `accessId` is successfully retrieved.

**Request Body (JSON):**

*   `accessId` (string, required): The access ID of the shared data item that was accessed.

**Behavior:**

1.  **Method Check:** Only `POST` requests are allowed.
2.  **Validation:** Ensures `accessId` is provided and is a string.
3.  **Database Lookup:** Finds the `SharedMedicalData` record by the given `accessId`.
4.  **Status Check:** Verifies that the found record is `isActive` and its `expiryTime` has not passed.
5.  **Increment Access Count:** If the record is valid, increments its `accessCount` by 1.
6.  **Response:** Returns a success status and the updated `accessCount`.

**Success Response (200 OK):**

```json
{
  "success": true,
  "accessCount": "number" // The new access count after incrementing
}
```

**Error Responses:**

*   **400 Bad Request:**
    ```json
    { "error": "Invalid access ID" }
    ```
*   **403 Forbidden:**
    ```json
    { "error": "Access has expired or is inactive" }
    ```
*   **404 Not Found:**
    ```json
    { "error": "Shared data not found" }
    ```
*   **405 Method Not Allowed:**
    ```json
    { "error": "Method not allowed" }
    ```
*   **500 Internal Server Error:**
    ```json
    { "error": "Failed to record access" }
    ```
---
### `/api/shared-data/[id]` (GET, PUT, DELETE)

Manages individual shared medical data records identified by their unique database `id`.

**Path Parameters:**

*   `id` (string, required): The unique identifier of the shared medical data record.

---

#### `GET /api/shared-data/[id]`

Retrieves a specific shared medical data record by its ID. Also increments the `accessCount` for the record.

**Authentication:** Not strictly required for this method, allowing public access to non-expired data.

**Behavior:**

1.  **Database Lookup:** Finds the `SharedMedicalData` record by the provided `id`.
2.  **Expiry Check:** If the record is found, checks if `expiryTime` has passed.
3.  **Increment Access Count:** If found and not expired, increments the `accessCount` of the record.
4.  **Response:** Returns the `SharedMedicalData` object if found and not expired.

**Success Response (200 OK):**

Returns the shared medical data object:

```json
{
  "id": "string",
  "accessId": "string",
  "ipfsCid": "string",
  "userId": "string",
  "expiryTime": "string", // ISO 8601 date string
  "hasPassword": "boolean",
  "dataTypes": "string | null",
  "accessCount": "number", // Incremented value
  "isActive": "boolean",
  "createdAt": "string",
  "updatedAt": "string"
}
```

**Error Responses:**

*   **400 Bad Request:**
    ```json
    { "error": "Invalid shared data ID" }
    ```
*   **403 Forbidden:**
    ```json
    { "error": "Access has expired" }
    ```
*   **404 Not Found:**
    ```json
    { "error": "Shared data not found" }
    ```
*   **500 Internal Server Error:**
    ```json
    { "error": "Failed to fetch shared data" }
    ```

---

#### `PUT /api/shared-data/[id]`

Updates an existing shared medical data record. Typically used to change `isActive` status or `expiryTime`.

**Authentication:** Required. Ownership is generally required, except for revoking access (`isActive: false`) during testing/development.

**Request Body (JSON):**

*   `isActive` (boolean, optional): New status for the record.
*   `expiryTime` (string, optional): New ISO 8601 date string for expiry.

**Behavior:**

1.  **Authentication & Authorization:**
    *   Verifies user is authenticated.
    *   Retrieves the existing record.
    *   Checks if the authenticated user's Ethereum address matches the `userId` of the record.
    *   A special case allows setting `isActive: false` without strict ownership (for testing).
2.  **Update:** Updates the `isActive` and/or `expiryTime` fields if provided in the request body.
3.  **Response:** Returns the updated `SharedMedicalData` object.

**Success Response (200 OK):**

Returns the updated shared medical data object (see structure in GET response).

**Error Responses:**

*   **400 Bad Request:**
    ```json
    { "error": "Invalid shared data ID" }
    ```
    ```json
    { "error": "No ethereum address associated with this account" }
    ```
*   **401 Unauthorized:**
    ```json
    { "error": "Unauthorized" }
    ```
*   **403 Forbidden:**
    ```json
    { "error": "Not authorized to update this shared data" }
    ```
*   **404 Not Found:**
    ```json
    { "error": "Shared data not found" }
    ```
*   **500 Internal Server Error:**
    ```json
    { "error": "Failed to update shared data" }
    ```

---

#### `DELETE /api/shared-data/[id]`

Deletes a shared medical data record.

**Authentication:** Required. Ownership is required.

**Behavior:**

1.  **Authentication & Authorization:**
    *   Verifies user is authenticated.
    *   Retrieves the existing record.
    *   Checks if the authenticated user's Ethereum address matches the `userId` of the record.
2.  **Deletion:** Deletes the record from the database.
3.  **Response:** Returns a success message.

**Success Response (200 OK):**

```json
{
  "message": "Shared data deleted successfully"
}
```

**Error Responses:**

*   **400 Bad Request:**
    ```json
    { "error": "Invalid shared data ID" }
    ```
    ```json
    { "error": "No ethereum address associated with this account" }
    ```
*   **401 Unauthorized:**
    ```json
    { "error": "Unauthorized" }
    ```
*   **403 Forbidden:**
    ```json
    { "error": "Not authorized to delete this shared data" }
    ```
*   **404 Not Found:**
    ```json
    { "error": "Shared data not found" }
    ```
*   **500 Internal Server Error:**
    ```json
    { "error": "Failed to delete shared data" }
    ```
---

## FHIR API

The EHR Wallet provides a FHIR R4-compliant API for interoperability with healthcare systems. All FHIR endpoints return `application/fhir+json` content type.

### `/api/fhir/metadata` (GET)

Returns the FHIR Capability Statement describing the server's capabilities.

**Request**

- **Method:** `GET`
- **Authentication:** Not required
- **Content-Type:** `application/fhir+json`

**Response (200 OK):**

Returns a FHIR CapabilityStatement with supported resources:

```json
{
  "resourceType": "CapabilityStatement",
  "status": "active",
  "date": "2024-01-01T00:00:00.000Z",
  "kind": "instance",
  "software": {
    "name": "EHR Wallet FHIR Server",
    "version": "1.0.0"
  },
  "implementation": {
    "description": "Blockchain-based patient health wallet with FHIR R4 support",
    "url": "https://example.com/api/fhir"
  },
  "fhirVersion": "4.0.1",
  "format": ["application/fhir+json", "json"],
  "rest": [{
    "mode": "server",
    "resource": [
      { "type": "Patient", ... },
      { "type": "Encounter", ... },
      { "type": "Appointment", ... },
      { "type": "Observation", ... },
      { "type": "Condition", ... },
      { "type": "MedicationRequest", ... },
      { "type": "DocumentReference", ... }
    ]
  }]
}
```

**Supported Resources:**

| Resource | Operations |
|----------|------------|
| Patient | read, search-type, create, update, delete |
| Encounter | read, search-type |
| Appointment | read, search-type, create, update |
| Practitioner | read, search-type |
| Observation | read, search-type |
| Condition | read, search-type |
| MedicationRequest | read, search-type |
| DocumentReference | read, search-type, create |

---

### `/api/fhir/Patient` (GET, POST)

Manage patient resources.

#### `GET /api/fhir/Patient` - Search Patients

Search for patients using FHIR search parameters.

**Query Parameters:**

*   `name` (string): Search by patient name
*   `birthdate` (date): Search by date of birth (format: YYYY-MM-DD)
*   `gender` (token): Search by gender (male, female, other, unknown)
*   `identifier` (token): Search by patient identifier
*   `_count` (number): Number of results (default: 20)
*   `_offset` (number): Pagination offset (default: 0)

**Example Request:**

```
GET /api/fhir/Patient?name=John&_count=10
```

**Response (200 OK):**

Returns a FHIR Bundle with search results:

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "entry": [{
    "resource": {
      "resourceType": "Patient",
      "id": "1",
      "identifier": [{ "system": "local", "value": "PAT-000001" }],
      "name": [{ "family": "Doe", "given": ["John"] }],
      "gender": "male",
      "birthDate": "1990-01-15"
    }
  }]
}
```

#### `POST /api/fhir/Patient` - Create Patient

Create a new patient resource.

**Request Body:**

```json
{
  "resourceType": "Patient",
  "identifier": [{ "system": "local", "value": "PAT-000001" }],
  "name": [{ "family": "Doe", "given": ["John"] }],
  "gender": "male",
  "birthDate": "1990-01-15",
  "telecom": [
    { "system": "phone", "value": "555-1234" },
    { "system": "email", "value": "john.doe@example.com" }
  ],
  "address": [{ "city": "Boston", "state": "MA" }]
}
```

**Response:**

*   **201 Created:** Returns the created Patient resource
*   **400 Bad Request:** Invalid resource or missing required fields

---

### `/api/fhir/Patient/[id]` (GET, PUT, DELETE)

Manage individual patient resources.

#### `GET /api/fhir/Patient/[id]` - Read Patient

Retrieve a specific patient by ID.

**Response (200 OK):**

```json
{
  "resourceType": "Patient",
  "id": "1",
  "identifier": [{ "system": "local", "value": "PAT-000001" }],
  "name": [{ "family": "Doe", "given": ["John"] }],
  "gender": "male",
  "birthDate": "1990-01-15"
}
```

#### `PUT /api/fhir/Patient/[id]` - Update Patient

Update an existing patient.

**Request Body:** Same as create, include all fields to update.

**Response:** Returns the updated Patient resource.

#### `DELETE /api/fhir/Patient/[id]` - Delete Patient

Delete a patient resource.

**Response:** Returns 200 OK with OperationOutcome.

---

### `/api/fhir/Patient/[id]/$everything` (GET)

Retrieve all resources related to a patient.

**Response (200 OK):**

Returns a FHIR Bundle containing all related resources (Observations, Conditions, MedicationRequests, etc.):

```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    { "resource": { "resourceType": "Patient", ... } },
    { "resource": { "resourceType": "Observation", ... } },
    { "resource": { "resourceType": "Condition", ... } }
  ]
}
```

---

### `/api/fhir/Encounter` (GET, POST)

Manage encounter resources.

#### `GET /api/fhir/Encounter` - Search Encounters

**Query Parameters:**

*   `patient` (reference): Filter by patient
*   `date` (date): Filter by encounter date

**Example:**

```
GET /api/fhir/Encounter?patient=Patient/1&date=2024-01
```

---

### FHIR Operations

| Operation | Endpoint | Description |
|-----------|----------|-------------|
| `$everything` | `GET /api/fhir/Patient/[id]/$everything` | Get all patient data |

---

### Error Responses

FHIR errors return an OperationOutcome resource:

```json
{
  "resourceType": "OperationOutcome",
  "issue": [{
    "severity": "error",
    "code": "processing",
    "diagnostics": "Error message",
    "details": { "text": "Error message" }
  }]
}
```

**Common HTTP Status Codes:**

*   **200 OK:** Successful request
*   **201 Created:** Resource created successfully
*   **400 Bad Request:** Invalid request
*   **404 Not Found:** Resource not found
*   **405 Method Not Allowed:** HTTP method not supported
*   **500 Internal Server Error:** Server error
