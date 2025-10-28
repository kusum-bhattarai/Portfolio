document.addEventListener('DOMContentLoaded', function() {

    // Initialize Particle.js for the CELTIAL starfield effect
    particlesJS("particles-js", {
        "particles": {
            "number": {
                "value": 150, // More stars
                "density": { "enable": true, "value_area": 800 }
            },
            "color": { "value": "#ffffff" },
            "shape": {
                "type": ["circle", "polygon"], // Mix of circles (planets) and polygons (stars)
                "polygon": { "nb_sides": 5 } // Polygons will be 5-sided (stars)
            },
            "opacity": {
                "value": 0.7, // Brighter stars
                "random": true, // Varying brightness
                "anim": { "enable": true, "speed": 1, "opacity_min": 0.1, "sync": false }
            },
            "size": {
                "value": 3, // Smaller, sharper stars
                "random": true,
                "anim": { "enable": true, "speed": 2, "size_min": 0.5, "sync": false } // Twinkling effect
            },
            "line_linked": {
                "enable": false, // No lines
            },
            "move": {
                "enable": true,
                "speed": 1.2, // Slow drift
                "direction": "none", // Drift in all directions
                "random": true,
                "straight": false,
                "out_mode": "out",
                "bounce": false,
                "attract": { "enable": false }
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": { "enable": true, "mode": "repulse" }, // Push stars away on hover
                "onclick": { "enable": true, "mode": "push" }, // Add more stars on click
                "resize": true
            },
            "modes": {
                "repulse": { "distance": 100, "duration": 0.4 },
                "push": { "particles_nb": 4 },
                "bubble": { "distance": 200, "size": 3, "duration": 2, "opacity": 8 }
            }
        },
        "retina_detect": true
    });

    // --- Header Scroll Effect ---
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }
        });
    }

    // --- Mobile Menu Toggle (for smaller screens) ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav ul');
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
        });
    }

    // --- Smooth Scrolling for Navigation Links ---
    document.querySelectorAll('.nav ul li a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                if(navList.classList.contains('active')) {
                    navList.classList.remove('active');
                }
                window.scrollTo({
                    top: targetSection.offsetTop - 100, // Adjusted offset for new header
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Project Card Image Galleries ---
    const projectWindows = document.querySelectorAll('.mac-window-card');
    projectWindows.forEach(card => {
        const gallery = card.querySelector('.project-card-gallery');
        if (!gallery) return;

        const images = gallery.querySelectorAll('img');
        const prevBtn = gallery.querySelector('.prev-btn');
        const nextBtn = gallery.querySelector('.next-btn');
        
        if (images.length > 1) {
            let currentIndex = 0;
            const showImage = (index) => {
                images.forEach((img, i) => img.classList.toggle('active', i === index));
            };

            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
                showImage(currentIndex);
            });

            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
                showImage(currentIndex);
            });
        } else if (prevBtn && nextBtn) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }
    });

    // --- Video Modal Logic ---
    const openModalButtons = document.querySelectorAll('[data-modal-target]');
    const modal = document.querySelector('#video-modal');

    if (modal) {
        const videoContainer = modal.querySelector('.video-container');
        const closeModalButton = modal.querySelector('.close-btn');

        openModalButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault(); 
                const videoSrc = button.getAttribute('data-video-src');
                if (videoSrc) {
                    videoContainer.innerHTML = `<video controls autoplay><source src="${videoSrc}" type="video/mp4">Your browser does not support the video tag.</video>`;
                    modal.classList.add('active');
                }
            });
        });

        const closeModal = () => {
            modal.classList.remove('active');
            videoContainer.innerHTML = ''; // Stops the video and removes it
        };

        closeModalButton.addEventListener('click', closeModal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });
    }

    // --- Scroll-Reveal Animations ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // Watch all the major content blocks (Added .experience-item)
    const elementsToAnimate = document.querySelectorAll('.about-grid, .skill-category, .experience-item, .mac-window-card, .splash-page');
    elementsToAnimate.forEach(element => {
        observer.observe(element);
    });

    const sprites = document.querySelectorAll('.pixel-sprite img');
    if (sprites.length > 0) {
        const imagePath = 'PicsPortfolio/';
        sprites.forEach(img => {
            const filename = img.getAttribute('data-filename');
            if (filename) {
                img.src = imagePath + filename;
            }
        });
    }

    console.log(
        `%c
        //-----------------------//
        //  J.A.R.V.I.S. ONLINE  //
        //  ALL SYSTEMS GO       //
        //-----------------------//

 ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣶⣾⠋⠉⠉⠉⢻⣷⣶⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡿⠛⠁⠸⡆⠀⠀⠀⢸⠀⠈⠙⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡇⠀⠀⠀⣧⠀⠀⢀⡟⠀⠀⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡿⡇⠀⠀⠀⠘⠦⠤⠼⠁⠀⠀⠀⣸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀⠀⠀⢀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣇⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⠋⢹⡀⠀⠀⣰⠋⠁⣷⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣄⣀⡀⠀⠀⠀⠀⢀⣀⣀⣼⣽⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣯⣤⣼⡇⠀⣼⡷⢤⣴⠇⠀⠀⢀⣀⡀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⠈⠓⠾⠿⠛⠛⠉⠙⠛⠛⠒⠋⣸⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡏⠛⢻⠇⣼⠉⠛⢛⡟⠀⣠⠞⠉⢸⠇⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⢳⣀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠿⣿⢿⣶⢻⣝⣿⡾⣠⠚⣿⣿⣶⠋⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡄⢻⣣⡀⠀⠀⠀⠀⠀⢠⣾⢃⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⣶⣶⣾⢿⣦⣤⣼⡿⣿⣷⣤⠟⠁⢀⣠⠤⠶⣦
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣷⢈⣧⣳⡤⠤⢤⠤⣴⣿⣇⣼⢿⣻⣿⠿⢶⣦⣄⠀⠀⠀⠀⠀⠀⢀⡾⡟⠶⣄⠀⡼⠀⠙⣍⠀⢀⠉⡉⠙⣷⣤⣽⣯⣴⠚⢿⣿⣦⠴⠋
⠀⠀⠀⠀⠀⠀⢀⣠⡤⠤⢤⡴⣚⣽⣿⣿⣧⣭⠧⠖⠒⠶⢿⣴⣿⣟⠛⠉⣩⡶⠾⠟⣛⡿⠶⠖⠒⠒⠒⠶⣧⡁⣠⢛⡿⣥⣈⣢⡼⠋⠉⠉⠳⣄⠀⠉⣏⠘⢿⣷⠼⠋⠁⠀⠀
⠀⠀⠀⢀⣠⠞⠉⢀⣠⠴⠛⠻⣿⣿⣯⣟⣻⣴⣶⠿⠟⠛⠉⠙⠻⢬⡉⡟⠁⢀⡴⠚⠁⠀⠀⠀⠀⠀⠀⠀⠈⣻⡛⢋⣠⣿⠋⢻⠀⠀⠀⠀⠀⢸⠒⠁⠙⢿⠉⠀⠀⠀⠀⠀⠀
⠀⣰⠟⣿⡁⠀⠴⠛⠁⠀⠀⢠⣌⠻⣶⡶⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠉⠓⣶⣿⣦⣤⣶⡾⠿⡿⠟⣻⣷⣶⡶⠋⢿⠛⠛⠁⠀⠈⠣⣄⣀⣀⡴⠛⠢⠤⣤⡟⠀⠀⠀⠀⠀⠀⠀
⢰⠇⣠⡾⠃⠀⠀⠀⠀⠀⠀⠸⣯⠿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⡿⣲⣿⠃⠀⡜⠁⣰⡿⣿⠋⠀⣰⣿⣇⠀⠀⠀⣀⠀⠀⠉⡁⠀⠀⠀⣰⠟⠀⠀⠀⠀⠀⠀⠀⠀
⣼⢠⡿⠀⠀⠀⢠⣤⣤⣤⣤⣤⣤⣤⣤⣄⣠⡀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣿⣭⣿⣿⡇⠀⣼⠁⢰⣿⣿⡏⠀⢠⣿⣾⣿⣟⡛⠉⠁⠀⠀⠀⠱⢤⣠⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⣿⢸⡇⠀⠀⠀⠈⢷⠀⠀⠀⠀⠀⠀⣀⠴⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⡀⣀⣯⣀⣾⣿⣿⣷⠦⣤⣳⣸⡻⣧⡉⢿⣷⣶⣶⣶⣶⣾⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⣿⣿⡇⠀⠀⠀⠀⠈⢧⠀⠀⠀⣠⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠴⠛⣿⣯⡻⣿⣿⣿⣿⣿⡿⢿⣿⣦⡙⣿⣽⣾⣎⣙⣛⣻⣿⣩⣾⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠸⣿⡇⠀⠀⠀⠀⠀⠈⣇⡤⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⠿⠟⠛⢻⡟⠛⣳⣿⣿⣿⣿⣿⣦⣙⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢠⣏⣧⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣼⡷⡄⠀⠀⠸⣷⣾⡿⢿⣴⣿⣿⡟⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢸⣿⡟⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣶⠟⣛⡧⠖⠛⣦⡀⣶⣿⣿⠿⣿⡿⢻⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⣾⣿⣇⠸⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠞⠁⠈⠙⢉⣡⠴⢾⣯⣽⠿⣿⣿⣿⣷⣄⣠⣾⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⡇⣿⣿⠀⠹⣤⣶⡖⣒⠚⠒⠲⢦⡀⠀⠀⡴⠁⠀⠀⢀⡴⠋⠉⠛⠛⠋⠁⣶⡼⣿⣿⣿⣿⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⣇⣿⣿⡆⣠⣿⣿⣧⣸⣷⠀⠀⣸⠉⠳⣾⠁⠀⢀⡴⠋⠀⠀⢀⣤⣶⣶⣾⡿⠁⢹⣿⣿⣿⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠁⠉⠉⠁⠀⠈⠀⠉⠉⠘⠁⠀⠀⢀⠀⠈⠁⠀⠈⠀⠀⠀⠀⠀⢁⣁⠀⠀⠀⠀⠀⠈⠉⠁⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    `,
        'color: #66fcf1; font-weight: bold; font-family: monospace;'
    );
});