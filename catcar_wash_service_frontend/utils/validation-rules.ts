/* ===== VALIDATION RULES ===== */
/* กฎการตรวจสอบความถูกต้องที่ใช้ร่วมกันในหน้า Authentication */

// Email validation rules
export const emailRules = [
  (v: string) => !!v || "กรุณาใส่อีเมล",
  (v: string) => /.+@.+\..+/.test(v) || "รูปแบบอีเมลไม่ถูกต้อง",
];

// Password validation rules (required only)
export const passwordRules = [
  (v: string) => !!v || "กรุณาใส่รหัสผ่าน",
];

// Legacy exports for backward compatibility
export const passwordRulesBasic = passwordRules;
export const passwordRulesStrong = passwordRules;

// Confirm password validation rules
export const createConfirmPasswordRules = (password: string) => [
  (v: string) => !!v || "กรุณายืนยันรหัสผ่าน",
  (v: string) => v === password || "รหัสผ่านไม่ตรงกัน",
];

// Password strength calculation
export const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (/(?=.*[a-z])/.test(password)) strength += 20;
  if (/(?=.*[A-Z])/.test(password)) strength += 20;
  if (/(?=.*[0-9])/.test(password)) strength += 20;
  if (/(?=.*[!@#$%^&*])/.test(password)) strength += 10;
  
  return Math.min(strength, 100);
};

// Password strength color
export const getPasswordStrengthColor = (strength: number): string => {
  if (strength < 40) return 'error';
  if (strength < 70) return 'warning';
  return 'success';
};

// Password strength text
export const getPasswordStrengthText = (strength: number): string => {
  if (strength < 40) return 'อ่อนแอ';
  if (strength < 70) return 'ปานกลาง';
  return 'แข็งแกร่ง';
}; 