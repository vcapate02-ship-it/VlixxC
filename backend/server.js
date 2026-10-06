const http = require("http");
const pool = require("./db");
require("dotenv").config();

const PORT = process.env.PORT || 3000;


/* =========================================================
   SEND JSON RESPONSE
========================================================= */

function sendJSON(res, statusCode, data) {

    res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    });

    res.end(JSON.stringify(data));
}


/* =========================================================
   READ REQUEST BODY
========================================================= */

function readBody(req) {

    return new Promise((resolve, reject) => {

        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {

            try {
                const data = JSON.parse(body);
                resolve(data);
            } catch (error) {
                reject(new Error("Invalid JSON"));
            }

        });

        req.on("error", error => {
            reject(error);
        });

    });

}


/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


/* =========================================================
   CREATE SERVER
========================================================= */

const server = http.createServer(async (req, res) => {


    /* -----------------------------------------------------
       CORS OPTIONS
    ----------------------------------------------------- */

    if (req.method === "OPTIONS") {

        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        });

        res.end();

        return;
    }


    /* =====================================================
       API TEST
    ===================================================== */

    if (req.method === "GET" && req.url === "/api") {

        sendJSON(res, 200, {
            success: true,
            message: "Vlixx Portfolio API is running."
        });

        return;
    }


    /* =====================================================
       CONTACT FORM
    ===================================================== */

    if (req.method === "POST" && req.url === "/api/contact") {

        try {

            const data = await readBody(req);

            const name = String(data.name || "").trim();
            const email = String(data.email || "").trim();
            const message = String(data.message || "").trim();


            /* ------------------------------------------------
               VALIDATION
            ------------------------------------------------ */

            if (!name || !email || !message) {

                sendJSON(res, 400, {
                    success: false,
                    message: "Please complete all fields."
                });

                return;
            }


            if (!isValidEmail(email)) {

                sendJSON(res, 400, {
                    success: false,
                    message: "Please enter a valid email address."
                });

                return;
            }


            /* ------------------------------------------------
               SAVE TO MYSQL
            ------------------------------------------------ */

            const sql = `
                INSERT INTO contact_messages
                (name, email, message)
                VALUES (?, ?, ?)
            `;

            await pool.execute(sql, [
                name,
                email,
                message
            ]);


            /* ------------------------------------------------
               SUCCESS
            ------------------------------------------------ */

            sendJSON(res, 201, {
                success: true,
                message: "Your message has been sent successfully."
            });

            return;

        } catch (error) {

            console.error("Contact API Error:", error);

            sendJSON(res, 500, {
                success: false,
                message: "Unable to save your message."
            });

            return;
        }

    }


    /* =====================================================
       404
    ===================================================== */

    sendJSON(res, 404, {
        success: false,
        message: "API route not found."
    });

});


/* =========================================================
   START SERVER
========================================================= */

server.listen(PORT, () => {

    console.log("================================");
    console.log("Vlixx Portfolio Backend");
    console.log("================================");
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`API:    http://localhost:${PORT}/api`);
    console.log("================================");

});