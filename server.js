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

// connection.connect((err) => {
//     if (err) {
//         console.log(err.message);
//     }
//     console.log('db ' + connection.state);
// })

// app.get('/admin', (req, res) => {
//     res.render('login')
// })

// categories
// app.get('/epaper', (req, res) => {
//     res.render('epaper')
// })

// app.get('/create-epaper', (req, res) => {
//     connection.execute('SELECT * FROM epaper ORDER BY ID DESC', (err, result) => {
//         if (!err)
//             res.render('create-epaper', {epaper: result});
//         else
//             console.log(err)
//     })
// })


// gallery

// app.get('/gallery', (req, res) => {
//     res.render('gallery')
// })

// app.get('/api/gallery', (req, res) => {
//     connection.execute('SELECT * FROM gallery ORDER BY ID DESC', (err, result) => {
//         if (!err)
//             res.send(result);
//         else
//             console.log(err)
//     })
// })

// app.get('/api/galleryUploads', (req, res) => {
//     connection.execute('SELECT * FROM galleryUploads ORDER BY ID DESC', (err, result) => {
//         if (!err)
//             res.send(result);
//         else
//             console.log(err)
//     })
// })

// app.get('/create-gallery', (req, res) => {
//     connection.execute('SELECT * FROM galleryUploads ORDER BY ID DESC', (err, result) => {
//         if (!err)
//             res.render('create-gallery', {gallery: result});
//         else
//             console.log(err)
//     })
// })

// app.post('/create-gallery', upload.array('files', 12), (req, res) => {
    
//     var sql = "INSERT INTO gallery VALUES(null, '"+ req.body.Category_Name +"')";
    
//     connection.execute(sql, (err) => {
//         if (!err) {
            
//             var sqlGallery = "INSERT INTO galleryUploads VALUES(null, '"+ result.insertId +"', 'Blue Village 1')";
//             connection.execute(sqlGallery, (err, result) => {
//                 if (!err)
//                     res.send(result)
//                 else
//                     console.log(err)
//             })
//         }
//         else 
//             console.log(err)
//     })
// })

app.get('/', (req, res) => {
    res.send('root directory')
})

app.listen(PORT, (req, res) => {
    console.log(`Server is running on PORT ${PORT}`);
})




