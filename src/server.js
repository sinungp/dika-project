const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Update CORS configuration to allow mobile access
app.use(cors({
    origin: function(origin, callback) {
        callback(null, true); // allow all origins for now
    },
    credentials: true
}));

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

// Update the static file serving to include proper headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(express.static(srcDir, {
    setHeaders: (res, path) => {
        res.set('Access-Control-Allow-Origin', '*');
    }
}));

// Serve static files
app.use('/assets/photos', express.static(photosDir));
app.use('/assets/videos', express.static(videosDir));

// Replace the getLocalIP and serverUrl logic with this
function getAllIPs() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const results = [];
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip internal and non-IPv4 addresses
            if (net.family === 'IPv4' && !net.internal) {
                results.push(net.address);
            }
        }
    }
    return results;
}

const networkIPs = getAllIPs();
console.log('Available network IPs:', networkIPs);

// Remove duplicate static serving and consolidate into one section
app.use(express.static(srcDir));
app.use('/assets/photos', express.static(photosDir, {
    setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cache-Control', 'no-cache');
    }
}));
app.use('/assets/videos', express.static(videosDir, {
    setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cache-Control', 'no-cache');
    }
}));

// Add error handling for static files
app.use((err, req, res, next) => {
    console.error('Error serving static file:', err);
    res.status(500).send('Error loading file');
});

// Update API endpoint with better error logging
app.get('/api/images', (req, res) => {
    if (!fs.existsSync(photosDir)) {
        console.error('Photos directory not found:', photosDir);
        return res.json([]);
    }

    fs.readdir(photosDir, (err, files) => {
        if (err) {
            console.error('Error reading photos directory:', err);
            return res.status(500).json({ error: 'Unable to read photos directory' });
        }

        try {
            const imageFiles = files
                .filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
                })
                .map(file => ({
                    name: file,
                    // Use relative URL instead of absolute
                    url: `/assets/photos/${file}`
                }));

            // Verify files exist
            imageFiles.forEach(file => {
                if (!fs.existsSync(path.join(photosDir, file.name))) {
                    console.warn('Image file not found:', file.name);
                }
            });

            console.log('Successfully found photos:', imageFiles);
            res.json(imageFiles);
        } catch (error) {
            console.error('Error processing image files:', error);
            res.status(500).json({ error: 'Error processing image files' });
        }
    });
});

// Update video endpoint similarly
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
        }).map(file => ({
            name: file,
            url: `/assets/videos/${file}`
        }));

        console.log('Found videos:', videoFiles);
        res.json(videoFiles);
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Access the application using any of these URLs:');
    networkIPs.forEach(ip => {
        console.log(`- http://${ip}:${PORT}`);
    });
    console.log(`- http://localhost:${PORT}`);
    console.log(`Photos directory: ${photosDir}`);
    console.log(`Videos directory: ${videosDir}`);
});
