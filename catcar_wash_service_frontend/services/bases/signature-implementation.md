# X-Signature Implementation

This document describes the x-signature implementation for API request authentication and verification.

## Overview

The x-signature feature adds cryptographic signatures to API requests to ensure request integrity and authenticity. It uses HMAC (Hash-based Message Authentication Code) with configurable algorithms.

## Features

- **HMAC Signature Generation**: Uses SHA-256 or SHA-512 algorithms
- **Timestamp Support**: Includes request timestamp for replay attack prevention
- **Nonce Support**: Includes random nonce for request uniqueness
- **Configurable**: Can be enabled/disabled and configured per environment
- **Automatic**: Signatures are automatically added to all requests when enabled

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Enable/disable signature generation
NUXT_PUBLIC_API_SIGNATURE_ENABLED=true

# Secret key for signature generation (keep this secure!)
NUXT_PUBLIC_API_SIGNATURE_SECRET_KEY=your-secret-key-here

# Signature algorithm (sha256 or sha512)
NUXT_PUBLIC_API_SIGNATURE_ALGORITHM=sha256

# Include timestamp in signature
NUXT_PUBLIC_API_SIGNATURE_INCLUDE_TIMESTAMP=true

# Include nonce in signature
NUXT_PUBLIC_API_SIGNATURE_INCLUDE_NONCE=true
```

### Runtime Configuration

You can also configure signatures at runtime:

```typescript
import { BaseApiClient } from "~/services/bases/base-api-client";

const apiClient = new BaseApiClient();

// Enable signature generation
apiClient.setSignatureEnabled(true);

// Set secret key
apiClient.setSignatureSecretKey("your-secret-key");

// Set algorithm
apiClient.setSignatureAlgorithm("sha256");

// Get current configuration
const config = apiClient.getSignatureConfig();
```

## Signature Generation

### Signature String Format

The signature is generated from the following components joined by `|`:

```
METHOD|URL|BODY|TIMESTAMP|NONCE
```

Example:
```
POST|/api/users|{"name":"John"}|1640995200|abc123def456
```

### Headers Added

When signature is enabled, the following headers are automatically added to requests:

- `x-signature`: The HMAC signature
- `x-timestamp`: Unix timestamp (if enabled)
- `x-nonce`: Random nonce string (if enabled)

## Usage

### Basic Usage

```typescript
import { BaseApiClient } from "~/services/bases/base-api-client";

class MyApiClient extends BaseApiClient {
  async getUsers() {
    // Signature headers are automatically added
    return this.get("/api/users");
  }

  async createUser(userData: any) {
    // Signature includes the request body
    return this.post("/api/users", userData);
  }
}

const client = new MyApiClient();
// Make requests - signatures are handled automatically
```

### Advanced Usage

```typescript
// Check if signature is enabled
const config = client.getSignatureConfig();
if (config.enabled) {
  console.log("Signature is enabled with algorithm:", config.algorithm);
}

// Temporarily disable signature
client.setSignatureEnabled(false);
// Make request without signature
client.setSignatureEnabled(true);
```

## Security Considerations

1. **Secret Key**: Keep your secret key secure and never expose it in client-side code
2. **HTTPS**: Always use HTTPS in production to protect the signature headers
3. **Key Rotation**: Regularly rotate your secret keys
4. **Timestamp Validation**: Server should validate timestamps to prevent replay attacks
5. **Nonce Tracking**: Server should track used nonces to prevent replay attacks

## Server-Side Validation

Your server should validate signatures by:

1. Reconstructing the signature string using the same format
2. Generating the HMAC signature with the same secret key
3. Comparing the generated signature with the received signature
4. Validating timestamp (if included) to prevent replay attacks
5. Checking nonce uniqueness (if included)

Example server-side validation (Node.js):

```javascript
const crypto = require('crypto');

function validateSignature(req, secretKey) {
  const { method, url, body } = req;
  const timestamp = req.headers['x-timestamp'];
  const nonce = req.headers['x-nonce'];
  const receivedSignature = req.headers['x-signature'];

  // Reconstruct signature string
  const signatureString = `${method.toUpperCase()}|${url}|${body || ''}|${timestamp || ''}|${nonce || ''}`;
  
  // Generate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(signatureString)
    .digest('hex');

  // Compare signatures
  return expectedSignature === receivedSignature;
}
```

## Troubleshooting

### Common Issues

1. **Signature Mismatch**: Ensure server and client use the same secret key and signature format
2. **Timestamp Issues**: Check system clock synchronization between client and server
3. **Nonce Conflicts**: Ensure nonce generation is truly random
4. **Algorithm Mismatch**: Verify both client and server use the same HMAC algorithm

### Debug Mode

Enable debug logging to see signature generation details:

```typescript
// In your nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      debugEnabled: true,
      logLevel: 'debug'
    }
  }
});
```

This will log signature headers and generation details to the console.

## API Reference

### SignatureUtils

- `generateSignature(config, secretKey, algorithm?, includeTimestamp?, includeNonce?)`: Generate signature for a request
- `generateSignatureHeaders(config, secretKey, algorithm?, includeTimestamp?, includeNonce?)`: Generate all signature headers
- `validateSignatureConfig(config)`: Validate signature configuration

### BaseApiClient

- `setSignatureEnabled(enabled)`: Enable/disable signature generation
- `setSignatureSecretKey(secretKey)`: Set the secret key
- `setSignatureAlgorithm(algorithm)`: Set the HMAC algorithm
- `getSignatureConfig()`: Get current signature configuration
