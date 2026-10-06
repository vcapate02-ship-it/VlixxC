const menuBtn = document.getElementById("menuBtn");

menuBtn.addEventListener("click", () => {
    document.querySelector("nav").classList.toggle("show");
});


const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll("nav a");

window.addEventListener("scroll", () => {

    let current = "";

    sections.forEach(section => {

        const sectionTop = section.offsetTop - 150;

        if (window.scrollY >= sectionTop) {
            current = section.getAttribute("id");
        }

    });

    navLinks.forEach(link => {

        link.classList.remove("active");

        if (link.getAttribute("href") === `#${current}`) {
            link.classList.add("active");
        }

    });

});

// =========================================================
// DARK / LIGHT MODE
// =========================================================

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");


// Load saved theme
const savedTheme = localStorage.getItem("portfolio-theme");

if (savedTheme === "light") {
    document.body.classList.add("light-mode");
    themeIcon.textContent = "☀";
} else {
    document.body.classList.remove("light-mode");
    themeIcon.textContent = "☾";
}


// Toggle theme
themeToggle.addEventListener("click", () => {

    document.body.classList.toggle("light-mode");

    const isLightMode = document.body.classList.contains("light-mode");

    if (isLightMode) {
        themeIcon.textContent = "☀";
        localStorage.setItem("portfolio-theme", "light");
    } else {
        themeIcon.textContent = "☾";
        localStorage.setItem("portfolio-theme", "dark");
    }

});

/* =========================================================
CONTACT FORM API
========================================================= */

const mysql = require("mysql2/promise");
const nodemailer = require("nodemailer");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async function handler(req, res) {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed."
        });
    }

    try {

        const {
            name,
            email,
            message
        } = req.body || {};

        const cleanName = String(name || "").trim();
        const cleanEmail = String(email || "").trim();
        const cleanMessage = String(message || "").trim();

        if (!cleanName || !cleanEmail || !cleanMessage) {
            return res.status(400).json({
                success: false,
                message: "Please complete all fields."
            });
        }

        if (!isValidEmail(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        // Save message to MySQL
        await pool.execute(
            `
            INSERT INTO contact_messages
            (name, email, message)
            VALUES (?, ?, ?)
            `,
            [
                cleanName,
                cleanEmail,
                cleanMessage
            ]
        );

        // Send notification to Gmail
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_RECEIVER,
            replyTo: cleanEmail,
            subject: `Portfolio Contact: ${cleanName}`,
            text: `
New message from your portfolio website.

Name: ${cleanName}
Email: ${cleanEmail}

Message:
${cleanMessage}
            `
        });

        return res.status(200).json({
            success: true,
            message: "Your message has been sent successfully."
        });

    } catch (error) {

        console.error("Contact API Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to send your message."
        });
    }
};