"use cache";

export async function getRole() {
    try {
        const res = await fetch("/api/auth/navbar-role", {
            method: "GET"
        });
        const data = await res.json();
        return data.role;
    } catch (err) {
        console.error("Failed to fetch role:", err);
        return null
    }
}
