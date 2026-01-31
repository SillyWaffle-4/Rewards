require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('public')); 

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// UPDATED SCHEMA: Separate points for Aiden and Ethan
const User = mongoose.model('User', new mongoose.Schema({
    aidenPoints: { type: Number, default: 0 },
    ethanPoints: { type: Number, default: 0 },
    completedTasks: { type: [String], default: [] } 
}));

app.post('/check-admin', (req, res) => {
    if (req.body.password === process.env.ADMINKEY) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// UPDATED ROUTE: Handles which user gets the points
app.post('/give-points', async (req, res) => {
    const { points, taskId, userType } = req.body;
    const amount = parseInt(points) || 0;
    const update = { $addToSet: { completedTasks: taskId } };
    
    if (userType === 'ethan') {
        update.$inc = { ethanPoints: amount };
    } else {
        update.$inc = { aidenPoints: amount };
    }

    const user = await User.findOneAndUpdate({}, update, { upsert: true, new: true });
    res.json(user);
});

app.post('/remove-points', async (req, res) => {
    const { points, taskId, userType } = req.body;
    const amount = parseInt(points) || 0;
    const update = { $pull: { completedTasks: taskId } };

    if (userType === 'ethan') {
        update.$inc = { ethanPoints: -amount };
    } else {
        update.$inc = { aidenPoints: -amount };
    }

    const user = await User.findOneAndUpdate({}, update, { new: true });
    res.json(user);
});

app.post('/reset-points', async (req, res) => {
    const user = await User.findOneAndUpdate({}, { aidenPoints: 0, ethanPoints: 0, completedTasks: [] }, { new: true });
    res.json(user);
});

app.get('/get-points', async (req, res) => {
    const user = await User.findOne() || await User.create({ aidenPoints: 0, ethanPoints: 0, completedTasks: [] });
    res.json(user);
});

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));