document.addEventListener('DOMContentLoaded', function() {
    const galleryContainer = document.getElementById('gallery-container');

    // Add modal HTML to body
    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal" id="contentModal">
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <div id="modalView"></div>
                <p class="modal-caption"></p>
            </div>
        </div>
    `);

    function showModal(content, caption) {
        const modal = document.getElementById('contentModal');
        const modalView = document.getElementById('modalView');
        const modalCaption = modal.querySelector('.modal-caption');
        
        modalView.innerHTML = '';
        modalView.appendChild(content);
        modalCaption.textContent = caption;
        modal.classList.add('show');
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Close on X button click
        modal.querySelector('.modal-close').addEventListener('click', closeModal);
    }

    function closeModal() {
        const modal = document.getElementById('contentModal');
        modal.classList.remove('show');
        const video = modal.querySelector('video');
        if (video) video.pause();
    }

    function createImageElement(imagePath) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';

        const img = document.createElement('img');
        let retryCount = 0;
        const maxRetries = 3;

        const loadImage = () => {
            img.src = imagePath;
            img.alt = imagePath.split('/').pop().split('.')[0];
        };

        img.onerror = () => {
            if (retryCount < maxRetries) {
                console.warn(`Retrying image load (${retryCount + 1}/${maxRetries}):`, imagePath);
                retryCount++;
                setTimeout(loadImage, 1000 * retryCount); // Exponential backoff
            } else {
                console.error('Failed to load image after retries:', imagePath);
                img.src = 'placeholder.jpg';
            }
        };

        const caption = document.createElement('p');
        caption.className = 'image-caption';
        caption.textContent = img.alt.replace(/-/g, ' ');

        galleryItem.appendChild(img);
        galleryItem.appendChild(caption);
        
        // Start loading
        loadImage();

        galleryItem.addEventListener('click', () => {
            const fullImg = document.createElement('img');
            fullImg.src = imagePath;
            fullImg.alt = img.alt;
            showModal(fullImg, caption.textContent);
        });

        return galleryItem;
    }

    function createVideoElement(videoPath) {
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';

        const video = document.createElement('video');
        video.src = videoPath;
        video.muted = true;
        video.loop = true;
        video.preload = 'metadata';
        
        video.addEventListener('mouseover', () => {
            video.play();
        });
        
        video.addEventListener('mouseout', () => {
            video.pause();
            video.currentTime = 0;
        });

        const caption = document.createElement('p');
        caption.className = 'video-caption';
        caption.textContent = videoPath.split('/').pop().split('.')[0].replace(/-/g, ' ');

        videoItem.appendChild(video);
        videoItem.appendChild(caption);

        videoItem.addEventListener('click', () => {
            const fullVideo = document.createElement('video');
            fullVideo.src = videoPath;
            fullVideo.controls = true;
            fullVideo.autoplay = true;
            showModal(fullVideo, caption.textContent);
        });

        return videoItem;
    }

    async function loadImages() {
        try {
            const response = await fetch('/api/images');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const images = await response.json();
            
            if (images.length === 0) {
                galleryContainer.innerHTML = '<p>No images found in the assets folder</p>';
                return;
            }

            // Only show first 5 images on home page
            const featuredImages = images.slice(0, 5);
            featuredImages.forEach(image => {
                const imageElement = createImageElement(image.url);
                galleryContainer.appendChild(imageElement);
            });
        } catch (error) {
            console.error('Error loading images:', error);
            galleryContainer.innerHTML = `<p>Error loading images: ${error.message}</p>`;
        }
    }

    async function loadVideos() {
        try {
            const videoContainer = document.getElementById('video-container');
            const response = await fetch('/api/videos');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const videos = await response.json();
            
            if (videos.length === 0) {
                videoContainer.innerHTML = '<p>No videos found</p>';
                return;
            }

            const featuredVideos = videos.slice(0, 5);
            featuredVideos.forEach(video => {
                const videoElement = createVideoElement(video.url);
                videoContainer.appendChild(videoElement);
            });
        } catch (error) {
            console.error('Error loading videos:', error);
            videoContainer.innerHTML = `<p>Error loading videos: ${error.message}</p>`;
        }
    }

    // Add keyboard support for closing modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    loadImages();
    loadVideos();
});