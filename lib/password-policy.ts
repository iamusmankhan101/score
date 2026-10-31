/**
 * lib/password-policy.ts
 *
 * One password rule for every place an account password is set: sign-up,
 * password change, staff logins and the self-service reset. Dependency-free so
 * both the browser and the server import exactly the same check.
 */

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters, including a letter and a number.`;

// Short list of the passwords attackers try first. A leaked password is the
// most common way an account falls, so the obvious ones are refused outright.
const COMMON_PASSWORDS = new Set([
  "password", "password1", "password12", "password123", "password1234",
  "123456789", "1234567890", "12345678910", "qwerty123", "qwerty1234",
  "letmein123", "welcome123", "admin1234", "administrator", "abc123456",
  "iloveyou1", "salon12345", "saloncentral", "changeme123", "p@ssw0rd123",
]);

/** Returns a user-facing reason, or null when the password is acceptable. */
export function validatePasswordStrength(password: string): string | null {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Use no more than ${PASSWORD_MAX_LENGTH} characters.`;
  }
  if (password !== password.trim()) {
    return "Don't start or end your password with a space.";
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Include at least one letter and one number.";
  }
  if (new Set(password).size < 4) {
    return "That password is too repetitive. Mix in more characters.";
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return "That password is too common. Choose something less predictable.";
  }
  return null;
}
