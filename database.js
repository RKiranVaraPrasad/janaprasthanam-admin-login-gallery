var mysql = require('mysql');

var connection = mysql.createConnection({
    host: '160.153.47.4',
    user: 'jptelevision_use',
    password: 'Kiran@1982',
    database: 'jptelevision',
    multipleStatements: true
});

module.exports = connection;