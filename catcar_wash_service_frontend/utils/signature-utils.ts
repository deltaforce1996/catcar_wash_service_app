import type { InternalAxiosRequestConfig } from "axios";

/**
 * Create HMAC signature using Web Crypto API
 */
async function createHmacSignature(data: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Basic signature generation utility
 */
export const SignatureUtils = {
  /**
   * Generate x-signature header for API request
   */
  async generateSignature(
    config: InternalAxiosRequestConfig,
    secretKey: string
  ): Promise<string> {
    if (!secretKey) {
      throw new Error("Secret key is required for signature generation");
    }

    const method = config.method?.toUpperCase() || "GET";
    const url = config.url || "";
    const body = config.data ? JSON.stringify(config.data) : "";
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Simple signature: METHOD|URL|BODY|TIMESTAMP
    const signatureString = `${method}|${url}|${body}|${timestamp}`;
    
    return createHmacSignature(signatureString, secretKey);
  },
};
