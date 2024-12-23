const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 3000;


const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}


const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function(req, file, cb) {
        
        cb(null, 'product-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function(req, file, cb) {
        
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));


let inventory = [];


app.get('/api/items', (req, res) => {
    res.json(inventory);
});

app.post('/api/items', upload.single('image'), (req, res) => {
    try {
        const newItem = {
            id: Date.now(),
            name: req.body.name,
            category: req.body.category,
            quantity: parseInt(req.body.quantity),
            price: parseFloat(req.body.price),
            imageUrl: req.file ? `/uploads/${req.file.filename}` : ''
        };
        
        inventory.push(newItem);
        res.json(newItem);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


app.delete('/api/items/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const itemIndex = inventory.findIndex(item => item.id === id);
    
    if (itemIndex > -1) {
        
        const item = inventory[itemIndex];
        if (item.imageUrl) {
            const imagePath = path.join(__dirname, 'public', item.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        inventory.splice(itemIndex, 1);
        res.json({ message: 'Item deleted successfully' });
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});