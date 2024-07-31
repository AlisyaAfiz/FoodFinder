const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');

const app = express();

const storage = multer.diskStorage(
    {
        destination: (req, file, cb) => {
            cb(null, 'public/images');
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname);
        }
    });

const upload = multer({ storage: storage });

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'foodfinder'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL', err);
        return;
    }
    console.log('Connected successfully to database');
});

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(express.urlencoded({
    extended: false
}));

app.get("/", (req, res) => {
    const sql = "SELECT * FROM products";
    connection.query(sql, (error, results) => {
        if (error) {
            console.error("Database query error: ", error.message);
            return res.status(500).send("Error retrieving products");
        }
        res.render('index', { products: results });
    });
});

app.get("/meals", (req, res) => {
    const sql = "SELECT * FROM `products` WHERE category = 'Meals'";
    connection.query(sql, (error, results) => {
        if (error) {
            console.error("Database query error: ", error.message);
            return res.status(500).send("Error retrieving products");
        }
        res.render('index', { products: results });
    });
});

app.get("/snacks", (req, res) => {
    const sql = "SELECT * FROM products WHERE category = 'Snacks'";
    connection.query(sql, (error, results) => {
        if (error) {
            console.error("Database query error: ", error.message);
            return res.status(500).send("Error retrieving products");
        }
        res.render('index', { products: results });
    });
});

app.get("/desserts", (req, res) => {
    const sql = "SELECT * FROM products WHERE category = 'Desserts'";
    connection.query(sql, (error, results) => {
        if (error) {
            console.error("Database query error: ", error.message);
            return res.status(500).send("Error retrieving products");
        }
        res.render('index', { products: results });
    });
});

app.get("/drinks", (req, res) => {
    const sql = "SELECT * FROM products WHERE category = 'Drinks'";
    connection.query(sql, (error, results) => {
        if (error) {
            console.error("Database query error: ", error.message);
            return res.status(500).send("Error retrieving products");
        }
        res.render('index', { products: results });
    });
});

app.get('/category/:category', function (req, res) {
    const category = req.params.category.charAt(0).toUpperCase() + req.params.category.slice(1).toLowerCase();
    const sql = "SELECT * FROM products WHERE category = ?";
    connection.query(sql, [category], (error, results) => {
        if (error) {
            console.error("Database query error: ", error.message);
            return res.status(500).send("Error retrieving products");
        }
        res.render('index', { products: results });
    });
});

app.get("/productInfo/:id", (req, res) => {
    const productId = req.params.id;
    const sqlProduct = "SELECT * FROM products WHERE productId=?";
    connection.query(sqlProduct, [productId], (error, resultsProduct) => {
        if (error) {
            console.error("Error retrieving product:", error.message);
            res.status(500).send("Error retrieving product");
            return;
        }
        if (resultsProduct.length === 0) {
            res.render("productInfo", { product: null, comments: [], commenter: 'Username' });
            return;
        }
        const product = resultsProduct[0];

        const sqlComments = "SELECT comment, commenter FROM comments WHERE productId=?";
        connection.query(sqlComments, [productId], (error, resultsComments) => {
            if (error) {
                console.error("Error retrieving comments:", error.message);
                res.status(500).send("Error retrieving comments");
                return;
            }
            product.comments = resultsComments;
            res.render("productInfo", { product: product, comments: resultsComments, commenter: 'Username' });
        });
    });
});

app.post("/productInfo/:id/comment", (req, res) => {
    const productId = req.params.id;
    const { comment } = req.body;
    const commenter = 'Username';

    const sql = "INSERT INTO `comments` (`comment`, `commenter`, `productId`) VALUES (?, ?, ?)";

    connection.query(sql, [comment, commenter, productId], (error, results) => {
        if (error) {
            console.error("Error posting comment: ", error.message);
            res.status(500).send("Error posting comment");
        } else {
            res.redirect(`/productInfo/${productId}`);
        }
    });
});

app.get("/profile", (req, res) => {
    const sql = "SELECT * FROM products WHERE reviewer = 'Username'";
    connection.query(sql, (error, results) => {
        if (error) {
            console.error("Database query error: ", error.message);
            return res.status(500).send("Error retrieving products");
        }
        res.render('profile', { products: results });
    });
});

app.get('/addReview', function (req, res) {
    res.render('addReview');
});

app.post("/addReview", upload.single('image'), (req, res) => {
    const { name, brand, price, category, location, description, rating, review } = req.body;
    let image;
    if (req.file) {
        image = req.file.filename;
    } else {
        image = null;
    }

    const reviewer = 'Username';

    const sql = "INSERT INTO `products` (`name`, `image`, `brand`, `price`, `category`, `location`, `description`, `rating`, `review`, `reviewer`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    connection.query(sql, [name, image, brand, price, category, location, description, rating, review, reviewer], (error, results) => {
        if (error) {
            console.error("Error adding product: ", error.message);
            res.status(500).send("Error adding product");
        } else {
            res.redirect("/");
        }
    });
});

app.get("/updateReview/:id", (req, res) => {
    const productId = req.params.id;
    const sql = `SELECT * FROM products WHERE productId = ?`;
    connection.query(sql, [productId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send("Error retrieving product by ID");
        }
        if (results.length > 0) {
            res.render('updateReview', { product: results[0] });
        } else {
            res.status(404).send('Product not found');
        }
    });
});

app.post('/updateReview/:id', upload.single('image'), (req, res) => {
    const productId = req.params.id;
    const { name, brand, price, category, location, description, rating, review } = req.body;
    let image = req.body.currentImage;
    if (req.file) {
        image = req.file.filename;
    }

    const sql = `UPDATE products SET name = ?, image = ?, brand = ?, price = ?, category = ?, location = ?, description = ?, rating = ?, review = ? WHERE productId = ?`;

    connection.query(sql, [name, image, brand, price, category, location, description, rating, review, productId], (error, results) => {
        if (error) {
            console.error("Error updating product:", error);
            res.status(500).send("Error updating product");
        } else {
            res.redirect("/profile");
        }
    });
});

app.get('/deleteReview/:id', (req, res) => {
    const productId = req.params.id;
    const sql = `DELETE FROM products WHERE productId = ?`;
    connection.query(sql, [productId], (error, results) => {
        if (error) {
            console.error("Error deleting product:", error);
            res.status(500).send('Error deleting product');
        } else {
            res.redirect('/profile');
        }
    });
});

app.get('/search', function(req, res) {
    const searchTerm = `%${req.query.q.toLowerCase()}%`;
    const sql = `SELECT * FROM products WHERE 
                 LOWER(name) LIKE ? OR 
                 LOWER(brand) LIKE ? OR 
                 LOWER(category) LIKE ? OR 
                 LOWER(location) LIKE ? OR 
                 LOWER(description) LIKE ?`;
    connection.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm], (error, results) => {
        if (error) {
            console.error("Database query error: ", error.message);
            return res.status(500).send("Error retrieving search results");
        }
        res.render('index', { products: results });
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));