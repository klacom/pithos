import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "pithos.official@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD, // User needs to provide this in .env
    },
});

export async function sendOrderEmail(to: string, subject: string, html: string) {
    try {
        await transporter.sendMail({
            from: '"Pithos Official" <pithos.official@gmail.com>',
            to,
            subject,
            html,
        });
        return { success: true };
    } catch (error) {
        console.error("Email error:", error);
        return { success: false, error };
    }
}
