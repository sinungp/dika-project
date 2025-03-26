const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());

// Get the absolute path to the directories
const srcDir = path.resolve(__dirname);
const assetsDir = path.join(srcDir, 'assets');
const photosDir = path.join(assetsDir, 'photos');
const videosDir = path.join(assetsDir, 'videos');

// Create directories if they don't exist
[photosDir, videosDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        try {
            fs.mkdirSync(dir, { recursive: true });
            console.log('Created directory:', dir);
        } catch (err) {
            console.error('Error creating directory:', err);
        }
    }
});

// Serve static files
app.use(express.static(srcDir));
app.use('/assets/photos', express.static(photosDir));
app.use('/assets/videos', express.static(videosDir));

// API endpoint to get images
app.get('/api/images', (req, res) => {
    if (!fs.existsSync(photosDir)) {
        return res.json([]);
    }

    fs.readdir(photosDir, (err, files) => {
        if (err) {
            console.error('Error reading photos directory:', err);
            return res.status(500).json({ error: 'Unable to read photos directory' });
        }

        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
        });

        console.log('Found photos:', imageFiles);
        res.json(imageFiles);
    });
});

// API endpoint to get videos
app.get('/api/videos', (req, res) => {
    if (!fs.existsSync(videosDir)) {
        return res.json([]);
    }

    fs.readdir(videosDir, (err, files) => {
        if (err) {
            console.error('Error reading videos directory:', err);
            return res.status(500).json({ error: 'Unable to read videos directory' });
        }

        const videoFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.mp4', '.webm', '.ogg'].includes(ext);
        });

        console.log('Found videos:', videoFiles);
        res.json(videoFiles);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Serving files from: ${srcDir}`);
    console.log(`Looking for images in: ${photosDir}`);
    console.log(`Looking for videos in: ${videosDir}`);
});
