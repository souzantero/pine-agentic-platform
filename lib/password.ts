/**
 * Utilitarios para validacao de senha
 */

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
  checks: {
    minLength: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
  };
}

const SYMBOLS_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;

export function validatePassword(password: string): PasswordValidation {
  const checks = {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasSymbol: SYMBOLS_REGEX.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
  };

  const errors: string[] = [];

  if (!checks.minLength) {
    errors.push("Minimo 8 caracteres");
  }
  if (!checks.hasNumber) {
    errors.push("Pelo menos 1 numero");
  }
  if (!checks.hasSymbol) {
    errors.push("Pelo menos 1 simbolo (!@#$%^&*...)");
  }

  // Requisitos obrigatorios: minLength, hasNumber, hasSymbol
  const isValid = checks.minLength && checks.hasNumber && checks.hasSymbol;

  // Calcular forca da senha
  const passedChecks = Object.values(checks).filter(Boolean).length;
  let strength: "weak" | "medium" | "strong" = "weak";

  if (passedChecks >= 5 && password.length >= 12) {
    strength = "strong";
  } else if (passedChecks >= 4 || (passedChecks >= 3 && password.length >= 10)) {
    strength = "medium";
  }

  return {
    isValid,
    errors,
    strength,
    checks,
  };
}

export function getStrengthColor(strength: "weak" | "medium" | "strong"): string {
  switch (strength) {
    case "strong":
      return "bg-green-500";
    case "medium":
      return "bg-yellow-500";
    case "weak":
    default:
      return "bg-red-500";
  }
}

export function getStrengthLabel(strength: "weak" | "medium" | "strong"): string {
  switch (strength) {
    case "strong":
      return "Forte";
    case "medium":
      return "Media";
    case "weak":
    default:
      return "Fraca";
  }
}
