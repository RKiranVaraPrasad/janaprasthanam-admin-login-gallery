var express     = require('express'),
    bodyParser  = require('body-parser'),
    cors        = require('cors'),
    api = require('./router/api'),
    app = express(),
    path        = require('path'),
    PORT = process.env.PORT || 3400; 

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('./public'));
app.use('/admin', api);
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.send('root directory')
})
app.use('/admin', (req,res) => {
    res.status(404).send('<h1>404 Page Not Found!</h1></br><a href="/admin">Login</a>');
});
app.listen(PORT, (req, res) => {
    console.log(`Server is running on PORT ${PORT}`);
})




