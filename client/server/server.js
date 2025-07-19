const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3005;
app.use(cors());

// Middleware
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://pos:pos@pos.yenrc3s.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, 'server/uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Define schema
const SaleSchema = new mongoose.Schema({
    date: String,   // Store date in 'YYYY-MM-DD' format
    time: String,   // Store time in 'HH:MM:SS' format
    items: Array,
    total: Number,
    price: Number
});
const Sale = mongoose.model('Sale', SaleSchema);

// Endpoint to handle adding a sale
app.post('/api/sale', async (req, res) => {
    try {
        const newSale = new Sale(req.body);
        const savedSale = await newSale.save();
        res.status(200).send(savedSale);
    } catch (err) {
        console.error('Error saving sale:', err);
        res.status(500).send({ error: 'An error occurred while saving the sale.' });
    }
});

// Endpoint to retrieve all sales
app.get('/api/sales', (req, res) => {
    Sale.find({}, (err, sales) => {
        if (err) return res.status(500).send(err);
        return res.status(200).send(sales);
    });
});

// Define a schema
const ProductSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    serialNumber: String,
    qrCode: String,
    quantity: String,
    image: String,
    tags: [String]
});

const Product = mongoose.model('Product', ProductSchema);

// Endpoint to upload an image
app.post('/api/upload', upload.single('image'), (req, res) => {
    const imageUrl = `http://localhost:3005/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
});

// Endpoint to add a product
app.post('/api/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(200).send(savedProduct);
    } catch (err) {
        console.error('Error saving product:', err);
        res.status(500).send({ error: 'An error occurred while saving the product.' });
    }
});

const billSchema = new mongoose.Schema({
    name: String,
    amount: Number,
    dateAdded: { type: Date, default: Date.now }
});

const Bill = mongoose.model('Bill', billSchema);

const tagSchema = new mongoose.Schema({
    name: String,
});

const Tag = mongoose.model('Tag', tagSchema);

app.post('/add-tag', async (req, res) => {
    let { name } = req.body;

    // Capitalize the first letter and make the rest lowercase
    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    const newTag = new Tag({ name });
    await newTag.save();
    res.status(201).send(newTag);
});

app.get('/api/tags', async (req, res) => {
    try {
        const tags = await Tag.find(); // Fetch all tags from the database
        res.status(200).json(tags);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch tags' });
    }
});
app.get('/api/products', async (req, res) => {
    try {
        const tags = await Product.find(); // Fetch all tags from the database
        res.status(200).json(tags);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch tags' });
    }
});

app.post('/add-bill', async (req, res) => {
    const { name, amount } = req.body;
    const newBill = new Bill({ name, amount });
    await newBill.save();
    res.status(201).send(newBill);
});

app.get('/bills', async (req, res) => {
    const bills = await Bill.find();
    res.status(200).json(bills);
});

// Serve static files from 'uploads' directory
app.use('/uploads', express.static(uploadDir));

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
