// Format Date

import { Replace } from "lucide-react";

export function formatDate (dateString: string) {
    return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// Replace underscore with space
export function formatEntity (entity : string) {
    return entity.replace('_', ' ');
}

// Capitalize first letter
export function capitalizeFirstLetter(str: string): string {
    console.log("Str: s",str);
    console.log("Type of str: ", typeof str);
    return str.charAt(0).toUpperCase() + str.slice(1);
}