// Server-only tiktoken module
// This file should ONLY be imported in server-side code (API routes, SSR)

let tiktoken;

export async function initializeTiktoken() {
  if (tiktoken) return tiktoken;

  try {
    tiktoken = await import("tiktoken");
    return tiktoken;
  } catch (error) {
    console.warn("tiktoken not available:", error.message);
    return null;
  }
}

export async function countTokensServer(text, model = "gpt-4o-mini") {
  if (!text) return 0;

  const tiktokenModule = await initializeTiktoken();
  if (!tiktokenModule) {
    // Fallback to estimation
    return Math.ceil(text.length * 0.25);
  }

  try {
    const encoding = tiktokenModule.encoding_for_model(model);
    const tokens = encoding.encode(text);
    encoding.free(); // Free memory
    return tokens.length;
  } catch (error) {
    console.warn(`Token counting failed for model ${model}:`, error.message);
    return Math.ceil(text.length * 0.25);
  }
}