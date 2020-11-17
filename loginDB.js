const mysql2 = require('mysql2');
const dbConnection = mysql2.createPool({
    host: '160.153.47.4',
    user: 'jptelevision_use',
    password: 'Kiran@1982',
    database: 'jptelevision',
    multipleStatements: true
}).promise();
module.exports = dbConnection;