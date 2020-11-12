var express     = require('express'),
    multer      = require('multer'),
    path        = require('path'),
    cookieSession = require('cookie-session'),
    bcrypt = require('bcryptjs'),
    { body, validationResult } = require('express-validator'),
    router = express.Router(),
    connection = require('../database');

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
    connection.execute("SELECT name FROM users WHERE id=?",[req.session.userID])
    .then(([rows]) => {
        res.render('post',{
            name:rows[0].name
        });
    });
    
});
router.post('/', ifLoggedin, [
    body('user_email').custom((value) => {
        return connection.execute('SELECT email FROM users WHERE email=?', [value])
        .then(([rows]) => {
            if(rows.length == 1){
                return true;
                
            }
            return Promise.reject('Invalid Email Address!');
            
        });
    }),
    body('user_pass','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    var validation_result = validationResult(req);
    var {user_pass, user_email} = req.body;
    if(validation_result.isEmpty()){
        connection.execute("SELECT * FROM `users` WHERE `email`=?",[user_email])
        .then(([rows]) => {
            bcrypt.compare(user_pass, rows[0].password).then(compare_result => {
                if(compare_result === true){
                    req.session.isLoggedIn = true;
                    req.session.userID = rows[0].id;

                    res.redirect('/admin/posts')
                }
                else{
                    res.render('login', {
                        login_errors: ['Invalid Password!']
                    })
                }
            })
            .catch(err => {
                if(err) throw err;
            })
        }).catch(err => {
            if(err) throw err;
        })
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        res.render('login',{
            login_errors:allErrors
        }); 
    }
})
router.get('/logout',(req,res)=>{
    req.session = null;
    res.redirect('/admin');
});

// categories
router.get('/categories', ifNotLoggedin, (req, res) => {
    res.render('categories')
})
router.get('/create-category', ifNotLoggedin, (req, res) => {
    connection.execute('SELECT * FROM category ORDER BY Category_ID ASC', (err, result) => {
                if (!err)
                    res.render('create-category', {category: result});
                else
                    console.log(err)
            })
})
router.get('/api/categories', (req, res) => {
    connection.execute('SELECT * FROM category ORDER BY Category_ID ASC', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.post('/create-category', (req, res) => {
    console.log(req.body)
    var sql = "INSERT INTO category VALUES(null, '"+ req.body.Category_Name +"')";

    connection.execute(sql, (err) => {
        if (!err) {
            connection.execute('SELECT * FROM category', (err, result) => {
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
    connection.execute('SELECT * FROM category', (err, result) => {
        if (!err)
            res.render('post', {category: result});
        else
            console.log(err)
    })
})
router.get('/create-post', ifNotLoggedin, (req, res) => {
    connection.execute('SELECT * FROM post ORDER BY ID DESC', (err, result) => {
        if (!err)
            res.render('create-post', {posts: result});
        else
            console.log(err)
    })
})
router.post('/create-post', upload.single('uploadImage'), (req, res) => {

    var sql = "INSERT INTO post VALUES(null, '"+ req.body.Category_ID +"', '"+ req.body.Category_Name +"', '"+ req.body.Title +"', '"+ req.body.Description +"', '"+ req.file.filename +"', '"+ req.body.Youtube +"')";

    connection.execute(sql, (err) => {
        if (!err) {
            connection.execute('SELECT * FROM post', (err, result) => {
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
    
    connection.execute(sql, [id], (err) => {
        if (!err) {
            // res.send("deleted successfully..")
            connection.execute('SELECT * FROM post', (err, result) => {
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
router.get('/home-slider', (req, res) => {
    connection.execute('SELECT * FROM category', (err, result) => {
        if (!err)
            res.render('home-slider', {category: result});
        else
            console.log(err)
    })
})
router.post('/create-banner', upload.single('uploadImage'), (req, res) => {

    var sql = "INSERT INTO homeSliders VALUES(null, '"+ req.body.Category_ID +"', '"+ req.body.Category_Name +"', '"+ req.body.Title +"', '"+ req.body.Description +"', '"+ req.file.filename +"', '"+ req.body.Youtube +"')";

    connection.execute(sql, (err) => {
        if (!err) {
            connection.execute('SELECT * FROM homeSliders', (err, result) => {
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
router.get('/create-banner', (req, res) => {
    connection.execute('SELECT * FROM homeSliders ORDER BY ID DESC', (err, result) => {
        if (!err)
            res.render('create-banner', {banner: result});
        else
            console.log(err)
    })
})
router.get('/delete-banner/:id', (req, res) => {
    
    var sql = "DELETE FROM homeSliders WHERE ID = ?";
    var id = req.params.id;
    
    connection.execute(sql, [id], (err) => {
        if (!err) {
            connection.execute('SELECT * FROM homeSliders', (err, result) => {
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

    connection.execute(sql, (err) => {
        if (!err) {
            connection.execute('SELECT * FROM breaking', (err, result) => {
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
router.get('/breaking', (req, res) => {
    connection.execute('SELECT * FROM category', (err, result) => {
        if (!err)
            res.render('breaking', {category: result});
        else
            console.log(err)
    })
})
router.get('/api/breaking', (req, res) => {
    connection.execute('SELECT * FROM breaking ORDER BY ID DESC LIMIT 1', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/breaking/:id', (req, res) => {
    var sql = 'SELECT * FROM breaking WHERE ID = ?'; 
    var id = req.params.id;
    connection.execute(sql, [id], (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/create-breaking', (req, res) => {
    connection.execute('SELECT * FROM breaking ORDER BY ID DESC', (err, result) => {
        if (!err)
            res.render('create-breaking', {breaking: result});
        else
            console.log(err)
    })
})
router.get('/delete-breaking/:id', (req, res) => {
    
    var sql = "DELETE FROM breaking WHERE ID = ?";
    var id = req.params.id;
    
    connection.execute(sql, [id], (err) => {
        if (!err) {
            connection.execute('SELECT * FROM breaking', (err, result) => {
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

    connection.execute(sql, (err) => {
        if (!err) {
            connection.execute('SELECT * FROM epaper', (err, result) => {
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
router.get('/e-paper', (req, res) => {
    res.render('e-paper')
})
router.get('/api/e-paper', (req, res) => {
    connection.execute('SELECT * FROM epaper ORDER BY ID DESC LIMIT 4', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/create-e-paper', (req, res) => {
    connection.execute('SELECT * FROM epaper ORDER BY ID DESC', (err, result) => {
        if (!err)
            res.render('create-e-paper', {ePaper: result});
        else
            console.log(err)
    })
})
router.get('/delete-e-paper/:id', (req, res) => {
    
    var sql = "DELETE FROM epaper WHERE ID = ?";
    var id = req.params.id;
    
    connection.execute(sql, [id], (err) => {
        if (!err) {
            connection.execute('SELECT * FROM epaper', (err, result) => {
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
router.get('/youtube', (req, res) => {
    res.render('youtube')
})
router.get('/api/youtube', (req, res) => {
    connection.execute('SELECT * FROM youtube ORDER BY ID DESC LIMIT 4', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/create-youtube', (req, res) => {
    connection.execute('SELECT * FROM youtube ORDER BY ID DESC', (err, result) => {
        if (!err)
            res.render('create-youtube', {youtube: result});
        else
            console.log(err)
    })
})
router.post('/create-youtube', (req, res) => {

    var sql = "INSERT INTO youtube VALUES(null, '"+ req.body.Title +"', '"+ req.body.YoutubeLink +"')";

    connection.execute(sql, (err) => {
        if (!err) {
            connection.execute('SELECT * FROM youtube', (err, result) => {
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
    
    connection.execute(sql, [id], (err) => {
        if (!err) {
            // res.send("deleted successfully..")
            connection.execute('SELECT * FROM youtube', (err, result) => {
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
router.get('/gallery', (req, res) => {
    connection.execute('SELECT * FROM category', (err, result) => {
        if (!err)
            res.render('gallery', {category: result});
        else
            console.log(err)
    })
})
router.get('/api/gallery', (req, res) => {
    connection.execute('SELECT * FROM gallery ORDER BY ID DESC LIMIT 4', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/create-gallery', (req, res) => {
    connection.execute('SELECT * FROM gallery ORDER BY ID DESC', (err, result) => {
        if (!err)
            res.render('create-gallery', {youtube: result});
        else
            console.log(err)
    })
})
router.post('/create-gallery', upload.array('files', 12), (req, res) => {
    var values = []

    var images = req.files;
    //console.log(req.body)
    images.forEach(element => {
        var fileValue = element.filename;
        var catID = req.body.Category_Name;
        value = {
            catID, fileValue
        }
        var myArr = Object.values(value)
        values.push(myArr)
        //console.log(value)
        //values.push(fileValue+','+ '12')
    });
    console.log(values)
    
    // values.push('1', '2', '3');
    
    
    
})

// api
router.get('/api/posts', (req, res) => {
    connection.execute('SELECT * FROM post ORDER BY ID DESC', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/posts/:id', (req, res) => {
    var sql = 'SELECT * FROM post WHERE ID = ?'; 
    var id = req.params.id;
    connection.execute(sql, [id], (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/postsByCatID/:id', (req, res) => {
    var sql = 'SELECT * FROM post WHERE Category_ID = ? ORDER BY ID DESC'; 
    var id = req.params.id;
    connection.execute(sql, [id], (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/latestLeft', (req, res) => {
    connection.execute('SELECT * FROM post ORDER BY ID DESC LIMIT 4', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/latestRight', (req, res) => {
    connection.execute('SELECT * FROM post ORDER BY ID DESC LIMIT 4, 4', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/ap', (req, res) => {
    connection.execute('SELECT * FROM post WHERE Category_ID = 31 ORDER BY ID DESC LIMIT 5', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/telangana', (req, res) => {
    connection.execute('SELECT * FROM post WHERE Category_ID = 32 ORDER BY ID DESC LIMIT 5', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/cinema', (req, res) => {
    connection.execute('SELECT * FROM post WHERE Category_ID = 33 ORDER BY ID DESC LIMIT 5', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/sports', (req, res) => {
    connection.execute('SELECT * FROM post WHERE Category_ID = 34 ORDER BY ID DESC LIMIT 5', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/business', (req, res) => {
    connection.execute('SELECT * FROM post WHERE Category_ID = 35 ORDER BY ID DESC LIMIT 5', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/national', (req, res) => {
    connection.execute('SELECT * FROM post WHERE Category_ID = 36 ORDER BY ID DESC LIMIT 5', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/world', (req, res) => {
    connection.execute('SELECT * FROM post WHERE Category_ID = 37 ORDER BY ID DESC LIMIT 5', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/bannerSlider', (req, res) => {
    connection.execute('SELECT * FROM homeSliders ORDER BY ID DESC LIMIT 5', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/bannerSlider', (req, res) => {
    connection.execute('SELECT * FROM homeSliders ORDER BY ID DESC', (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})
router.get('/api/bannerSlider/:id', (req, res) => {
    var sql = 'SELECT * FROM homeSliders WHERE ID = ?'; 
    var id = req.params.id;
    connection.execute(sql, [id], (err, result) => {
        if (!err)
            res.send(result);
        else
            console.log(err)
    })
})

module.exports = router;