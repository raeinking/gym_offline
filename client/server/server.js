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
mongoose.connect('mongodb://localhost:27017/gymPOS', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


// Define schema
const SaleSchema = new mongoose.Schema({
    date: String,
    items: Array,
    total: Number
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

// Endpoint to upload an image
app.get('/', (req, res) => {
    res.send('the server is working')
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
