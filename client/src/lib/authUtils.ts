export function isUnauthorizedError(error: Error): boolean {
  return error.message.includes("Please log in to continue") || 
         error.message.includes("Unauthorized") ||
         /^401/.test(error.message);
}