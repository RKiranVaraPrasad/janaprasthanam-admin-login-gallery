var mysql = require('mysql2');

var connection = mysql.createPool({
    host: '160.153.47.4',
    user: 'jptelevision_use',
    password: 'Kiran@1982',
    database: 'jptelevision',
    multipleStatements: true
}).promise();

module.exports = connection;