const pool = require("./db");

async function testDatabase() {
    try {

        const [rows] = await pool.query(
            "SELECT DATABASE() AS database_name"
        );

        console.log("================================");
        console.log("MySQL Connected Successfully!");
        console.log("Database:", rows[0].database_name);
        console.log("================================");

    } catch (error) {

        console.error("Database connection failed:");
        console.error(error.message);

    } finally {

        await pool.end();

    }
}

testDatabase();