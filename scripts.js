document.addEventListener('DOMContentLoaded', function() {

    // Initialize Particle.js
    particlesJS("particles-js", {
        "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#ffffff" }, "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" }, "polygon": { "nb_sides": 5 } }, "opacity": { "value": 0.5, "random": false, "anim": { "enable": false, "speed": 1, "opacity_min": 0.1, "sync": false } }, "size": { "value": 3, "random": true, "anim": { "enable": false, "speed": 40, "size_min": 0.1, "sync": false } }, "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 6, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false, "attract": { "enable": false, "rotateX": 600, "rotateY": 1200 } } }, "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "grab": { "distance": 400, "line_linked": { "opacity": 1 } }, "bubble": { "distance": 400, "size": 40, "duration": 2, "opacity": 8, "speed": 3 }, "repulse": { "distance": 200, "duration": 0.4 }, "push": { "particles_nb": 4 }, "remove": { "particles_nb": 2 } } }, "retina_detect": true
    });

    // Handle Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav ul');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
        });
    }

    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) { // When user scrolls more than 50px
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }
        });
    }

    // Handle Smooth Scrolling for Navigation Links
    document.querySelectorAll('.nav ul li a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                // Close the mobile menu on click
                if(navList.classList.contains('active')) {
                    navList.classList.remove('active');
                }
                
                window.scrollTo({
                    top: targetSection.offsetTop - 70, // Adjust for fixed header height
                    behavior: 'smooth'
                });
            }
        });
    });

    // Handle Project Card Image Galleries
    const galleries = document.querySelectorAll('.project-card');

    galleries.forEach(card => {
        const gallery = card.querySelector('.project-card-gallery');
        if (!gallery) return;

        const images = gallery.querySelectorAll('img');
        const prevBtn = gallery.querySelector('.prev-btn');
        const nextBtn = gallery.querySelector('.next-btn');
        
        if (images.length > 1) { // Only run gallery logic if there's more than one image
            let currentIndex = 0;

            function showImage(index) {
                images.forEach((img, i) => {
                    img.classList.remove('active');
                    if (i === index) {
                        img.classList.add('active');
                    }
                });
            }

            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevents card click events if any
                currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
                showImage(currentIndex);
            });

            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
                showImage(currentIndex);
            });
        } else { // If only one image, hide the buttons
            if(prevBtn) prevBtn.style.display = 'none';
            if(nextBtn) nextBtn.style.display = 'none';
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
                    videoContainer.innerHTML = `
                        <video controls autoplay>
                            <source src="${videoSrc}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    `;
                    modal.classList.add('active');
                }
            });
        });

        const closeModal = () => {
            modal.classList.remove('active');
            videoContainer.innerHTML = ''; // This stops the video and removes it
        };

        closeModalButton.addEventListener('click', closeModal);

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }

    const observer = new IntersectionObserver((entries) => {
    // Loop over the entries
    entries.forEach(entry => {
        // If the element is visible
        if (entry.isIntersecting) {
            // Add the 'is-visible' class
            entry.target.classList.add('is-visible');
            // Stop observing the element so the animation doesn't re-trigger
            observer.unobserve(entry.target);
        }
    });
    }, {
        threshold: 0.1 // Trigger the animation when 10% of the element is on screen
    });

    // Select all the elements we want to animate
    const elementsToAnimate = document.querySelectorAll('.about-grid, .skill-category, .project-card');

    // Tell the observer to watch each of them
    elementsToAnimate.forEach(element => {
        observer.observe(element);
    });
});


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