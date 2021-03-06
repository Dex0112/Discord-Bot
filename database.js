const mysql = require("mysql2");

require('dotenv').config();

const database = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    port: process.env.DB_PORT
}

var connection;

function handleDisconnect() {
    console.log("Disconnected");
    connection = mysql.createConnection(database);

    connection.connect((error) => {
        if(error) {
            console.log("Error when connecting to db:", error);
            setTimeout(handleDisconnect, 120 * 1000);
        }
    });
    
    connection.on('error', (error) => {
        console.log("db error", error);
        if(error.code === "PROTOCOL_CONNECTION_LOST") {
            handleDisconnect();
        }
    });
}

handleDisconnect();

module.exports = {
    updateDatabase: async function (data = {}) {
        connection.query(`SELECT COUNT(id) AS user_count FROM user_data WHERE id = '${data.id}'`, (err, results) => {
            if (err != null) {
                console.log(err);
                return;
            }

            try {
                if (results[0].user_count == 0) {
                    connection.query(`INSERT INTO user_data (id) VALUES ('${data.id}')`);
                }

                if (data.exp != null)
                    connection.query(`UPDATE user_data SET exp = ${data.exp} WHERE id = '${data.id}'`)
                if (data.love != null)
                    connection.query(`UPDATE user_data SET love = ${data.love} WHERE id = '${data.id}'`);
            } catch (error) {
                console.log(error);
            }
        });
    },

    getData: async function (id = String()) {
        try {
            const results = await connection.promise().query(`SELECT * FROM user_data WHERE id = '${id}'`);

            if (results[0].length == 0) {
                const newData = {id: id, exp: 0, love: 0}

                await this.updateDatabase(newData);

                return newData;
            }

            return results[0][0];
        } catch (error) {
            console.log(error);
        }
    },

    mutateData: async function (dataMutation) {
        //dataMutation = {id: , exp: , love: }

        const data = await this.getData(dataMutation.id);

        if(data == null)
            return;

        const newData = {
            id: dataMutation.id,
            exp: data.exp + dataMutation.exp,
            love: data.love + dataMutation.love
        };

        this.updateDatabase(newData);

        return newData;
    },

    getValuesOrdered: async function (valueID = String(), order = String()) {
        try {
            const queryResults = await connection.promise().query(`SELECT * FROM user_data ORDER BY ${valueID} ${order}`);
            const results = queryResults[0];

            return results;

        } catch(error) {
            console.log(error);
        }
    }
}