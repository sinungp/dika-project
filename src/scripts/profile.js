document.addEventListener('DOMContentLoaded', function() {
    const authSection = document.getElementById('auth-section');
    const profileSection = document.getElementById('profile-section');
    const galleryContainer = document.getElementById('gallery-container');

    // Add modal HTML (same as in app.js)
    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal" id="contentModal">
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <div id="modalView"></div>
                <p class="modal-caption"></p>
            </div>
        </div>
    `);

    function checkAuth() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (isLoggedIn) {
            showProfile();
        }
    }

    function handleLogin(e) {
        e.preventDefault();
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', e.target.elements[0].value);
        showProfile();
    }

    function showProfile() {
        authSection.style.display = 'none';
        profileSection.style.display = 'block';
        document.getElementById('user-info').innerHTML = `
            <div class="user-profile">
                <div class="user-details">
                    <p>Email: ${localStorage.getItem('userEmail')}</p>
                    <button id="logoutBtn">Logout</button>
                </div>
            </div>
        `;
        
        // Add event listener for logout button
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
        loadAllImages();
        loadAllVideos();
    }

    function handleLogout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        window.location.href = '/profile.html';
    }

    async function loadAllImages() {
        try {
            galleryContainer.innerHTML = ''; // Clear existing images
            const response = await fetch('http://localhost:3000/api/images');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const images = await response.json();
            
            if (images.length === 0) {
                galleryContainer.innerHTML = '<p>No images found in the gallery</p>';
                return;
            }

            images.forEach(image => {
                const imageElement = createImageElement(`/assets/photos/${image}`);
                galleryContainer.appendChild(imageElement);
            });
        } catch (error) {
            console.error('Error loading images:', error);
            galleryContainer.innerHTML = '<p>Error loading images. Please check the console.</p>';
        }
    }

    function createImageElement(imagePath) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';

        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = imagePath.split('/').pop().split('.')[0];
        
        img.onerror = () => {
            console.error('Failed to load image:', imagePath);
            img.src = 'placeholder.jpg';
        };

        const caption = document.createElement('p');
        caption.className = 'image-caption';
        caption.textContent = img.alt.replace(/-/g, ' ');

        galleryItem.appendChild(img);
        galleryItem.appendChild(caption);

        // Add click handler to show modal
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

        // Add click handler to show modal
        videoItem.addEventListener('click', () => {
            const fullVideo = document.createElement('video');
            fullVideo.src = videoPath;
            fullVideo.controls = true;
            fullVideo.autoplay = true;
            showModal(fullVideo, caption.textContent);
        });

        return videoItem;
    }

    async function loadAllVideos() {
        try {
            const videoContainer = document.getElementById('video-container');
            videoContainer.innerHTML = ''; // Clear existing videos
            
            const response = await fetch('http://localhost:3000/api/videos');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const videos = await response.json();
            
            if (videos.length === 0) {
                videoContainer.innerHTML = '<p>No videos found in the gallery</p>';
                return;
            }

            videos.forEach(video => {
                const videoElement = createVideoElement(`/assets/videos/${video}`);
                videoContainer.appendChild(videoElement);
            });
        } catch (error) {
            console.error('Error loading videos:', error);
            videoContainer.innerHTML = '<p>Error loading videos. Please check the console.</p>';
        }
    }

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

    // Add keyboard support for closing modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    checkAuth();
});
