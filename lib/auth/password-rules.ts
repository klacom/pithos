export const DEFAULT_PASSWORD_RULES = {
    min_char_length: 12,
    min_uppercase: 1,
    min_lowercase: 1,
    min_numbers: 1,
    min_spec_chars: 1,
} as const;

interface PasswordRules {
    min_char_length: number;
    min_uppercase: number;
    min_lowercase: number;
    min_numbers: number;
    min_spec_chars: number;
}

export function validatePassword(password: string, rules: PasswordRules = DEFAULT_PASSWORD_RULES): string[] {
    const errors: string[] = [];

    if (password.length < rules.min_char_length) {
        errors.push(`at least ${rules.min_char_length} characters`);
    }
    
    const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
    if (uppercaseCount < rules.min_uppercase) {
        errors.push(`at least ${rules.min_uppercase} uppercase letter(s)`);
    }

    const lowercaseCount = (password.match(/[a-z]/g) || []).length;
    if (lowercaseCount < rules.min_lowercase) {
        errors.push(`at least ${rules.min_lowercase} lowercase letter(s)`);
    }

    const numberCount = (password.match(/[0-9]/g) || []).length;
    if (numberCount < rules.min_numbers) {
        errors.push(`at least ${rules.min_numbers} number(s)`);
    }

    const specialCount = (password.match(/[^A-Za-z0-9]/g) || []).length;
    if (specialCount < rules.min_spec_chars) {
        errors.push(`at least ${rules.min_spec_chars} special character(s)`);
    }

    return errors;
}
