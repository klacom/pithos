function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Client-safe sanitizer (no server-only imports).
 */
export function sanitizeHtml(html: string): string {
    if (!html) return "";
    return escapeHtml(html);
}

/**
 * Basic text sanitization (strips all HTML tags).
 * Useful for fields where no HTML is allowed at all.
 */
export function sanitizeText(text: string): string {
    if (!text) return "";

    // First strip all HTML tags using regex
    const stripped = text.replace(/<[^>]*>?/gm, "");

    // Then escape remaining dangerous characters
    return sanitizeHtml(stripped);
}
