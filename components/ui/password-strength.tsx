"use client";

import { Check, X } from "lucide-react";
import {
  validatePassword,
  getStrengthColor,
  getStrengthLabel,
  type PasswordValidation,
} from "@/lib/password";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const validation: PasswordValidation = validatePassword(password);

  if (!password) {
    return null;
  }

  const requirements = [
    { key: "minLength", label: "Minimo 8 caracteres", met: validation.checks.minLength },
    { key: "hasNumber", label: "Pelo menos 1 numero", met: validation.checks.hasNumber },
    { key: "hasSymbol", label: "Pelo menos 1 simbolo", met: validation.checks.hasSymbol },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      {/* Barra de forca */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              getStrengthColor(validation.strength)
            )}
            style={{
              width:
                validation.strength === "strong"
                  ? "100%"
                  : validation.strength === "medium"
                  ? "66%"
                  : "33%",
            }}
          />
        </div>
        <span
          className={cn(
            "text-xs font-medium min-w-[50px]",
            validation.strength === "strong" && "text-green-600",
            validation.strength === "medium" && "text-yellow-600",
            validation.strength === "weak" && "text-red-600"
          )}
        >
          {getStrengthLabel(validation.strength)}
        </span>
      </div>

      {/* Lista de requisitos */}
      <ul className="space-y-1">
        {requirements.map((req) => (
          <li
            key={req.key}
            className={cn(
              "flex items-center gap-1.5 text-xs",
              req.met ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
