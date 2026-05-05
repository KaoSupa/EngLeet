export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 72;

const COMMON_WEAK_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password1",
  "password123",
  "qwerty123",
  "letmein123",
  "iloveyou",
  "admin1234",
]);

export const PASSWORD_REQUIREMENTS_TEXT =
  "ใช้รหัสผ่านอย่างน้อย 10 ตัวอักษร";

export function validatePasswordStrength(
  password: string,
  email?: string,
): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `รหัสผ่านต้องมีอย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร`;
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return `รหัสผ่านต้องไม่เกิน ${PASSWORD_MAX_LENGTH} ตัวอักษร`;
  }

  if (/\s/.test(password)) {
    return "รหัสผ่านต้องไม่มีช่องว่าง";
  }

  const normalizedPassword = password.toLowerCase();
  if (COMMON_WEAK_PASSWORDS.has(normalizedPassword)) {
    return "รหัสผ่านนี้เดาง่ายเกินไป กรุณาใช้รหัสผ่านที่ซับซ้อนกว่า";
  }

  const emailName = email?.split("@")[0]?.trim().toLowerCase();
  if (
    emailName &&
    emailName.length >= 4 &&
    normalizedPassword.includes(emailName)
  ) {
    return "รหัสผ่านต้องไม่ประกอบด้วยชื่ออีเมลของคุณ";
  }

  return null;
}
