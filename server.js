require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('public')); 


// Uses the exact name from your .env
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1); 
    });

const User = mongoose.model('User', new mongoose.Schema({
    Apoints: { type: Number, default: 0 },
    Epoints: { type: Number, default: 0 },
    completedTasks: { type: [String], default: []} 
}));

// Uses ADMINKEY to match your .env
app.post('/check-admin', (req, res) => {
    if (req.body.password === process.env.ADMINKEY) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.post('/give-points', async (req, res) => {
    const { points, taskId, pointType } = req.body;
    const fieldName = pointType === 'E' ? 'Epoints' : 'Apoints';
    const user = await User.findOneAndUpdate(
        {}, 
        { $inc: { [fieldName]: parseInt(points) || 0 }, $addToSet: { completedTasks: taskId } }, 
        { upsert: true, new: true }
    );
    res.json(user);
});

app.post('/remove-points', async (req, res) => {
    const { points, taskId, pointType } = req.body;
    const fieldName = pointType === 'E' ? 'Epoints' : 'Apoints';
    const user = await User.findOneAndUpdate(
        {}, 
        { $inc: { [fieldName]: -(parseInt(points) || 0) }, $pull: { completedTasks: taskId } }, 
        { new: true }
    );
    res.json(user);
});

app.get('/get-points', async (req, res) => {
    const user = await User.findOne() || await User.create({ Apoints: 0, Epoints: 0, completedTasks: [] });
    res.json(user);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));