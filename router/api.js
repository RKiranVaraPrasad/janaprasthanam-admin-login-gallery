var express     = require('express'),
    multer      = require('multer'),
    path        = require('path'),
    cookieSession = require('cookie-session'),
    bcrypt = require('bcryptjs'),
    { body, validationResult } = require('express-validator'),
    router = express.Router(),
    connection = require('../database'),
    dbConnection = require('../loginDB');

// uploads
var storage = multer.diskStorage({
    destination: './public/uploads',
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})
var storagePdf = multer.diskStorage({
    destination: './public/pdf',
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})
var storageGallery = multer.diskStorage({
    destination: './public/gallery',
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})
var upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
});
var pdf = multer({
    storage: storagePdf,
    fileFilter: (req, file, cb) => {
    if (file.mimetype == "application/pdf") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .pdf format allowed!'));
    }
  }
});
var galleryFolder = multer({
    storage: storageGallery,
    fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
});

router.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge:  3600 * 1000
}));

var ifNotLoggedin = (req, res, next) => {
    if(!req.session.isLoggedIn){
        return res.render('login');
    }
    next();
}
var ifLoggedin = (req,res,next) => {
    if(req.session.isLoggedIn){
        return res.redirect('/post');
    }
    next();
}

// login
router.get('/', ifNotLoggedin, (req,res,next) => {
    var sql = "SELECT name FROM users WHERE id=?"
    connection.query('SELECT * FROM category', (err, result) => {
        if (!err)
            res.render('post', {category: result});
        else
            console.log(err)
    })
})
router.get('/logout',(req,res)=>{
    //session destroy
    req.session = null;
    res.redirect('/admin');
});
router.post('/', ifLoggedin, [
    body('user_email').custom((value) => {
        return dbConnection.execute('SELECT `email` FROM `users` WHERE `email`=?', [value])
        .then(([rows]) => {
            if(rows.length == 1){
                return true;
                
            }
            return Promise.reject('Invalid Email Address!');
            
        });
    }),
    body('user_pass','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const {user_pass, user_email} = req.body;
    if(validation_result.isEmpty()){
        
        dbConnection.execute("SELECT * FROM `users` WHERE `email`=?",[user_email])
        .then(([rows]) => {
            bcrypt.compare(user_pass, rows[0].password).then(compare_result => {
                if(compare_result === true){
                    req.session.isLoggedIn = true;
                    req.session.userID = rows[0].id;

                    res.redirect('/admin/posts');
                }
                else{
                    res.render('login',{
                        login_errors:['Invalid Password!']
                    });
                }
            })
            .catch(err => {
                if (err) throw err;
            });


        }).catch(err => {
            if (err) throw err;
        });
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        res.render('login',{
            login_errors:allErrors
        });
    }
});

// registration
router.get('/registration', (req,res,next) => {
    res.render('registration')
})
router.post('/register', ifLoggedin, 
[
    body('user_email','Invalid email address!').isEmail().custom((value) => {
        return dbConnection.execute('SELECT `email` FROM `users` WHERE `email`=?', [value])
        .then(([rows]) => {
            if(rows.length > 0){
                return Promise.reject('This E-mail already in use!');
            }
            return true;
        });
    }),
    body('user_name','Username is Empty!').trim().not().isEmpty(),
    body('user_pass','The password must be of minimum length 6 characters').trim().isLength({ min: 6 }),
],
(req,res,next) => {

    const validation_result = validationResult(req);
    const {user_name, user_pass, user_email} = req.body;
    if(validation_result.isEmpty()){
        bcrypt.hash(user_pass, 12).then((hash_pass) => {
            dbConnection.execute("INSERT INTO `users`(`name`,`email`,`password`) VALUES(?,?,?)",[user_name,user_email, hash_pass])
            .then(result => {
                res.send(`your account has been created successfully, Now you can <a href="/admin">Login</a>`);
            }).catch(err => {
                if (err) throw err;
            });
        })
        .catch(err => {
            if (err) throw err;
        })
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        res.render('registration',{
            register_error:allErrors,
            old_data:req.body
        });
    }
});

// categories
router.get('/categories', ifNotLoggedin, (req, res) => {
    res.render('categories')
})
router.get('/create-category', ifNotLoggedin, (req, res) => {
    connection.query('SELECT * FROM category ORDER BY Category_ID ASC', (err, result) => {
                if (!err)
                    res.render('create-category', {category: result});
                else
                    console.log(err)
            })
})
router.get('/api/categories', (req, res) => {
    connection.query('SELECT * FROM category ORDER BY Category_ID ASC', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.post('/create-category', (req, res) => {
    console.log(req.body)
    var sql = "INSERT INTO category VALUES(null, '"+ req.body.Category_Name +"')";

    connection.query(sql, (err) => {
        if (!err) {
            connection.query('SELECT * FROM category', (err, result) => {
                if (!err)
                    res.render('create-category', {category: result});
                else
                    console.log(err)
            })
        }
    })
})

// post
router.get('/posts', ifNotLoggedin, (req, res) => {
    connection.query('SELECT * FROM category', (err, result) => {
        if (!err)
            res.render('post', {category: result});
        else
            console.log(err)
    })
})
router.get('/create-post', ifNotLoggedin, (req, res) => {
    connection.query('SELECT * FROM post ORDER BY ID DESC', (err, result) => {
        if (!err)
            res.render('create-post', {posts: result});
        else
            console.log(err)
    })
})
router.post('/create-post', upload.single('uploadImage'), (req, res) => {

    var sql = "INSERT INTO post VALUES(null, '"+ req.body.Category_ID +"', '"+ req.body.Category_Name +"', '"+ req.body.Title +"', '"+ req.body.Description +"', '"+ req.file.filename +"', '"+ req.body.Youtube +"')";

    connection.query(sql, (err) => {
        if (!err) {
            connection.query('SELECT * FROM post', (err, result) => {
                if (!err)
                    res.render('create-post', {posts: result});
                else
                    console.log(err)
            })
        }
        else 
            console.log(err)
    })
})
router.get('/delete-post/:id', (req, res) => {
    
    var sql = "DELETE FROM post WHERE ID = ?";
    var id = req.params.id;
    
    connection.query(sql, [id], (err) => {
        if (!err) {
            // res.send("deleted successfully..")
            connection.query('SELECT * FROM post', (err, result) => {
                if (!err)
                    res.render('create-post', {posts: result});
                else
                    console.log(err)
            })
        }
        else 
            console.log(err)
    })
})

// home page slider
router.get('/home-slider', ifNotLoggedin, (req, res) => {
    connection.query('SELECT * FROM category', (err, result) => {
        if (!err)
            res.render('home-slider', {category: result});
        else
            console.log(err)
    })
})
router.post('/create-banner', upload.single('uploadImage'), (req, res) => {

    var sql = "INSERT INTO homeSliders VALUES(null, '"+ req.body.Category_ID +"', '"+ req.body.Category_Name +"', '"+ req.body.Title +"', '"+ req.body.Description +"', '"+ req.file.filename +"', '"+ req.body.Youtube +"')";

    connection.query(sql, (err) => {
        if (!err) {
            connection.query('SELECT * FROM homeSliders', (err, result) => {
                if (!err)
                    res.render('create-banner', {banner: result});
                else
                    console.log(err)
            })
        }
        else 
            console.log(err)
    })
})
router.get('/create-banner', ifNotLoggedin, (req, res) => {
    connection.query('SELECT * FROM homeSliders ORDER BY ID DESC', (err, result) => {
        if (!err)
            res.render('create-banner', {banner: result});
        else
            console.log(err)
    })
})
router.get('/delete-banner/:id', (req, res) => {
    
    var sql = "DELETE FROM homeSliders WHERE ID = ?";
    var id = req.params.id;
    
    connection.query(sql, [id], (err) => {
        if (!err) {
            connection.query('SELECT * FROM homeSliders', (err, result) => {
                if (!err)
                    res.render('create-banner', {banner: result});
                else
                    console.log(err)
            })
        }
        else 
            console.log(err)
    })
})

// breaking
router.post('/create-breaking', upload.single('uploadImage'), (req, res) => {

    var sql = "INSERT INTO breaking VALUES(null, '"+ req.body.Category_ID +"', '"+ req.body.Category_Name +"', '"+ req.body.Title +"', '"+ req.body.Description +"', '"+ req.file.filename +"', '"+ req.body.Youtube +"')";

    connection.query(sql, (err) => {
        if (!err) {
            connection.query('SELECT * FROM breaking', (err, result) => {
                if (!err)
                    res.render('create-breaking', {breaking: result});
                else
                    console.log(err)
            })
        }
        else 
            console.log(err)
    })
})
router.get('/breaking', ifNotLoggedin, (req, res) => {
    connection.query('SELECT * FROM category', (err, result) => {
        if (!err)
            res.render('breaking', {category: result});
        else
            console.log(err)
    })
})
router.get('/api/breaking', (req, res) => {
    connection.query('SELECT * FROM breaking ORDER BY ID DESC LIMIT 1', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/breaking/:id', (req, res) => {
    var sql = 'SELECT * FROM breaking WHERE ID = ?'; 
    var id = req.params.id;
    connection.query(sql, [id], (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/create-breaking', ifNotLoggedin, (req, res) => {
    connection.query('SELECT * FROM breaking ORDER BY ID DESC', (err, result) => {
        if (!err)
            res.render('create-breaking', {breaking: result});
        else
            console.log(err)
    })
})
router.get('/delete-breaking/:id', (req, res) => {
    
    var sql = "DELETE FROM breaking WHERE ID = ?";
    var id = req.params.id;
    
    connection.query(sql, [id], (err) => {
        if (!err) {
            connection.query('SELECT * FROM breaking', (err, result) => {
                if (!err)
                    res.render('create-breaking', {breaking: result});
                else
                    console.log(err)
            })
        }
        else 
            console.log(err)
    })
})

// e paper
router.post('/create-e-paper', pdf.single('Epaper'), (req, res) => {

    var sql = "INSERT INTO epaper VALUES(null, '"+ req.body.selectDate +"', '"+ req.file.filename +"')";

    connection.query(sql, (err) => {
        if (!err) {
            connection.query('SELECT * FROM epaper', (err, result) => {
                if (!err)
                    res.render('create-e-paper', {ePaper: result});
                else
                    console.log(err)
            })
        }
        else 
            console.log(err)
    })
})
router.get('/e-paper', ifNotLoggedin, (req, res) => {
    res.render('e-paper')
})
router.get('/api/e-paper', (req, res) => {
    connection.query('SELECT * FROM epaper ORDER BY ID DESC LIMIT 4', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/create-e-paper', ifNotLoggedin, (req, res) => {
    connection.query('SELECT * FROM epaper ORDER BY ID DESC', (err, result) => {
        if (!err)
            res.render('create-e-paper', {ePaper: result});
        else
            console.log(err)
    })
})
router.get('/delete-e-paper/:id', (req, res) => {
    
    var sql = "DELETE FROM epaper WHERE ID = ?";
    var id = req.params.id;
    
    connection.query(sql, [id], (err) => {
        if (!err) {
            connection.query('SELECT * FROM epaper', (err, result) => {
                if (!err)
                    res.render('create-e-paper', {ePaper: result});
                else
                    console.log(err)
            })
        }
        else 
            console.log(err)
    })
})

// youtube
router.get('/youtube', ifNotLoggedin, (req, res) => {
    res.render('youtube')
})
router.get('/api/youtube', (req, res) => {
    connection.query('SELECT * FROM youtube ORDER BY ID DESC LIMIT 4', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/create-youtube', ifNotLoggedin, (req, res) => {
    connection.query('SELECT * FROM youtube ORDER BY ID DESC', (err, result) => {
        if (!err)
            res.render('create-youtube', {youtube: result});
        else
            console.log(err)
    })
})
router.post('/create-youtube', (req, res) => {

    var sql = "INSERT INTO youtube VALUES(null, '"+ req.body.Title +"', '"+ req.body.YoutubeLink +"')";

    connection.query(sql, (err) => {
        if (!err) {
            connection.query('SELECT * FROM youtube', (err, result) => {
                if (!err)
                    res.render('create-youtube', {youtube: result});
                else
                    console.log(err)
            })
        }
        else 
            console.log(err)
    })
})
router.get('/delete-youtube/:id', (req, res) => {
    
    var sql = "DELETE FROM youtube WHERE ID = ?";
    var id = req.params.id;
    
    connection.query(sql, [id], (err) => {
        if (!err) {
            // res.send("deleted successfully..")
            connection.query('SELECT * FROM youtube', (err, result) => {
                if (!err)
                    res.render('create-youtube', {youtube: result});
                else
                    console.log(err)
            })
        }
        else 
            console.log(err)
    })
})

// gallery
router.get('/gallery', ifNotLoggedin, (req, res) => {
    connection.query('SELECT * FROM gallery', (err, result) => {
        if (!err)
            res.render('gallery', {gallery: result});
        else
            console.log(err)
    })
})
router.get('/api/gallery', (req, res) => {
    connection.query('SELECT * FROM gallery ORDER BY ID DESC LIMIT 4', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/create-gallery', ifNotLoggedin, (req, res) => {
    connection.query('SELECT * FROM galleryUploads ORDER BY ID DESC', (err, result) => {
        if (!err)
            res.render('create-gallery', {gallery: result});
        else
            console.log(err)
    })
})
router.get('/delete-gallery/:id', (req, res) => {
    
    var sql = "DELETE FROM galleryUploads WHERE ID = ?";
    var id = req.params.id;
    
    connection.query(sql, [id], (err) => {
        if (!err) {
            // res.send("deleted successfully..")
            connection.query('SELECT * FROM galleryUploads', (err, result) => {
                if (!err)
                    res.render('create-gallery', {gallery: result});
                else
                    console.log(err)
            })
        }
        else 
            console.log(err)
    })
})
router.post('/create-gallery-name', (req, res) => {
    console.log(req.body)
    var sql = "INSERT INTO gallery VALUES(null, '"+ req.body.Category_Name +"')";

    connection.query(sql, (err) => {
        if (!err) {
            connection.query('SELECT * FROM gallery', (err, result) => {
                if (!err)
                    res.render('gallery', {gallery: result});
                else
                    console.log(err)
            })
        }
    })
})

router.post('/create-gallery', galleryFolder.array('files', 12), (req, res) => {
    var values = []
    var images = req.files;
    images.forEach(element => {
        var fileValue = element.filename;
        var catName = req.body.Category_Name;
        var catID = req.body.Category_ID;
        value = {
            catID, catName, fileValue
        }
        var myArr = Object.values(value)
        values.push(myArr)
    });
    console.log(values)
    var sql = "INSERT INTO galleryUploads (Category_ID, Category_Name, Image) VALUES ?";
    connection.query(sql, [values], (err) => {
        if (!err) {
            connection.query('SELECT * FROM galleryUploads', (err, result) => {
                if (!err)
                    res.render('create-gallery', {gallery: result});
                else
                    console.log(err)
            })
        }
        else 
            console.log(err)
    })
    
    
})

// api
router.get('/api/posts', (req, res) => {
    connection.query('SELECT * FROM post ORDER BY ID DESC', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/posts/:id', (req, res) => {
    var sql = 'SELECT * FROM post WHERE ID = ?'; 
    var id = req.params.id;
    connection.query(sql, [id], (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/postsByCatID/:id', (req, res) => {
    var sql = 'SELECT * FROM post WHERE Category_ID = ? ORDER BY ID DESC'; 
    var id = req.params.id;
    connection.query(sql, [id], (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/latestLeft', (req, res) => {
    connection.query('SELECT * FROM post ORDER BY ID DESC LIMIT 4', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/latestRight', (req, res) => {
    connection.query('SELECT * FROM post ORDER BY ID DESC LIMIT 4, 4', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/ap', (req, res) => {
    connection.query('SELECT * FROM post WHERE Category_ID = 31 ORDER BY ID DESC LIMIT 5', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/telangana', (req, res) => {
    connection.query('SELECT * FROM post WHERE Category_ID = 32 ORDER BY ID DESC LIMIT 5', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/cinema', (req, res) => {
    connection.query('SELECT * FROM post WHERE Category_ID = 33 ORDER BY ID DESC LIMIT 5', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/sports', (req, res) => {
    connection.query('SELECT * FROM post WHERE Category_ID = 34 ORDER BY ID DESC LIMIT 5', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/business', (req, res) => {
    connection.query('SELECT * FROM post WHERE Category_ID = 35 ORDER BY ID DESC LIMIT 5', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/national', (req, res) => {
    connection.query('SELECT * FROM post WHERE Category_ID = 36 ORDER BY ID DESC LIMIT 5', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/world', (req, res) => {
    connection.query('SELECT * FROM post WHERE Category_ID = 37 ORDER BY ID DESC LIMIT 5', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/bannerSlider', (req, res) => {
    connection.query('SELECT * FROM homeSliders ORDER BY ID DESC LIMIT 5', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/bannerSlider', (req, res) => {
    connection.query('SELECT * FROM homeSliders ORDER BY ID DESC', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/bannerSlider/:id', (req, res) => {
    var sql = 'SELECT * FROM homeSliders WHERE ID = ?'; 
    var id = req.params.id;
    connection.query(sql, [id], (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})

module.exports = router;