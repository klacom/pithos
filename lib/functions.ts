// Format Date

import { Badge } from "@/components/ui/badge";

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

// Format Price
export function formatPrice(price: number){
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(price);
};

// Status Color Based on status
export function getStatusColor (status: string) {
    switch (status.toLowerCase()) {
        case 'completed':
            return 'text-green-500';
        case 'pending':
            return 'text-yellow-500';
        case 'refunded':
            return 'text-blue-500';
        case 'cancelled':
            return 'text-red-500';
        default:
            return 'text-gray-500';
    }
};

// Status Badge
export function getStatusBadge (status: string) {
    const lowerStatus = status.toLowerCase();
    let className = "";

    switch (lowerStatus) {
        case 'completed':
            className = "bg-green-600 hover:bg-green-700";
            break;
        case 'pending':
            className = "bg-yellow-600 hover:bg-yellow-700";
            break;
        case 'refunded':
            className = "bg-blue-600 hover:bg-blue-700";
            break;
        case 'cancelled':
            className = "bg-red-600 hover:bg-red-700";
            break;
        default:
            className = "bg-gray-600 hover:bg-gray-700";
    }

    return className; 
};