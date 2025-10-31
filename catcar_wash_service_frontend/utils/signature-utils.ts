import type { InternalAxiosRequestConfig } from "axios";

/**
 * Create HMAC signature
 * Works in both server (Node.js crypto) and browser (Web Crypto API)
 */
async function createHmacSignature(data: string, secretKey: string): Promise<string> {
  // Check if we're in a browser environment with Web Crypto API available
  const isBrowser = typeof window !== "undefined" && typeof crypto !== "undefined" && crypto.subtle;

  if (!isBrowser) {
    // Node.js environment: Use Node.js crypto module
    try {
      const { createHmac } = await import("crypto");
      const hmac = createHmac("sha256", secretKey);
      hmac.update(data);
      return hmac.digest("hex");
    } catch (error) {
      console.error("Failed to use Node.js crypto:", error);
      throw new Error("Crypto module not available in server environment");
    }
  }

  // Browser environment: Use Web Crypto API
  try {
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
  } catch (error) {
    console.error("Failed to use Web Crypto API:", error);
    throw new Error("Web Crypto API not available in browser environment");
  }
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
