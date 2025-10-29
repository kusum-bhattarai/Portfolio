document.addEventListener('DOMContentLoaded', function() {

    // Boot sequence
    const bootOverlay = document.getElementById('boot-sequence');
    if (bootOverlay) {
        const lines = bootOverlay.querySelectorAll('.boot-terminal p');
        const typingSpeed = 50; // ms per char
        const lineDelay = 200; // ms between lines
        const fadeOutDelay = 1000; // ms after all typing

        async function typeBootSequence() {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const text = line.textContent;
                line.textContent = ''; // Clear it
                line.style.opacity = 1; // Make the <p> visible

                // Add cursor to current line
                if (i > 0) lines[i-1].classList.remove('typing-cursor');
                line.classList.add('typing-cursor');

                for (let j = 0; j < text.length; j++) {
                    await new Promise(r => setTimeout(r, typingSpeed));
                    line.textContent += text.charAt(j);
                }
                
                // Add line delay
                await new Promise(r => setTimeout(r, lineDelay));
            }
            
            // All lines typed
            if (lines.length > 0) {
                lines[lines.length - 1].classList.remove('typing-cursor');
            }
            
            // Wait before fading
            await new Promise(r => setTimeout(r, fadeOutDelay));

            bootOverlay.classList.add('hidden');
            
            // Fade in main content after boot
            const header = document.querySelector('header');
            const main = document.querySelector('main');
            if(header) header.classList.add('loaded');
            if(main) main.classList.add('loaded');
        }

        typeBootSequence();
        
    } else {
         // Fallback if boot sequence is missing
        const header = document.querySelector('header');
        const main = document.querySelector('main');
        if(header) header.classList.add('loaded');
        if(main) main.classList.add('loaded');
    }

    // --- Three.js Background ---
    function initThreeJS() {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas || !window.THREE) return;

        const scene = new THREE.Scene();
        
        const frustumSize = 100;
        const aspect = window.innerWidth / window.innerHeight;
        const camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 1, 1000);
        camera.position.z = 10;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Objects (Particles)
        const particles = [];
        const geometry = new THREE.IcosahedronGeometry(1, 0); // Base size before scaling
        
        for (let i = 0; i < 150; i++) { 
            const material = new THREE.MeshBasicMaterial({ 
                color: 0xffffff,
                wireframe: true,
                transparent: true,
                opacity: 0.25 // Reduced opacity from 0.4 to 0.25
            });
            
            const mesh = new THREE.Mesh(geometry, material);

            // Initial random positions
            mesh.position.x = (Math.random() - 0.5) * (frustumSize * aspect);
            mesh.position.y = (Math.random() - 0.5) * frustumSize;
            mesh.position.z = (Math.random() - 0.5) * 20;

            mesh.rotation.x = Math.random() * 2 * Math.PI;
            mesh.rotation.y = Math.random() * 2 * Math.PI;

            // Re-introduced random scaling for varied sizes
            const scale = Math.random() * 0.4 + 0.2; // Creates smaller, varied particles
            mesh.scale.set(scale, scale, scale);

            // Store a random velocity for each particle
            mesh.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.04, // Slightly slowed down
                (Math.random() - 0.5) * 0.04,
                0
            );

            scene.add(mesh);
            particles.push(mesh);
        }

        // Handle window resizing
        window.addEventListener('resize', () => {
            const newAspect = window.innerWidth / window.innerHeight;
            camera.left = frustumSize * newAspect / -2;
            camera.right = frustumSize * newAspect / 2;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);

            // Bounds for screen wrapping
            const bounds = {
                x: (frustumSize * window.innerWidth / window.innerHeight) / 2,
                y: frustumSize / 2
            };

            // Animate particles
            particles.forEach(p => {
                // Update position based on velocity
                p.position.add(p.userData.velocity);
                
                // Screen wrapping logic
                if (p.position.x > bounds.x + 2) p.position.x = -bounds.x - 2;
                if (p.position.x < -bounds.x - 2) p.position.x = bounds.x + 2;
                if (p.position.y > bounds.y + 2) p.position.y = -bounds.y - 2;
                if (p.position.y < -bounds.y - 2) p.position.y = bounds.y + 2;

                // Continue slow rotation
                p.rotation.y += 0.001;
            });

            renderer.render(scene, camera);
        };

        animate();
    }

    // Call Three.js init
    initThreeJS();


    // --- Typewriter Effect ---
    function typewriter() {
        const element = document.getElementById('typewriter');
        if (!element) return;

        const roles = ["Software Engineer", "Thinking Systems", "C++ Developer", "FullStack Developer"];
        let roleIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        const typingSpeed = 120;
        const deletingSpeed = 60;
        const delayBetweenRoles = 1500;

        function type() {
            const currentRole = roles[roleIndex];
            let currentText = '';

            if (isDeleting) {
                // Deleting
                currentText = currentRole.substring(0, charIndex - 1);
                charIndex--;
            } else {
                // Typing
                currentText = currentRole.substring(0, charIndex + 1);
                charIndex++;
            }

            element.textContent = currentText;

            let typeSpeed = isDeleting ? deletingSpeed : typingSpeed;

            if (!isDeleting && charIndex === currentRole.length) {
                // Finished typing the role
                typeSpeed = delayBetweenRoles;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                // Finished deleting the role
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                typeSpeed = typingSpeed;
            }

            setTimeout(type, typeSpeed);
        }
        
        // Start the typing effect
        setTimeout(type, typingSpeed);
    }
    
    // Call typewriter
    typewriter();


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

    // --- Mobile Menu Toggle ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav ul');
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
        });
    }

    // --- Smooth Scrolling ---
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
                    top: targetSection.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Project Galleries ---
    const galleries = document.querySelectorAll('.project-card-gallery');
    galleries.forEach(gallery => {
        const images = gallery.querySelectorAll('img');
        const prevBtn = gallery.querySelector('.prev-btn');
        const nextBtn = gallery.querySelector('.next-btn');
        
        if (images.length > 1 && prevBtn && nextBtn) {
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

    // --- Video Modal ---
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
            videoContainer.innerHTML = '';
        };

        closeModalButton.addEventListener('click', closeModal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });
    }

    // --- Scroll-Reveal ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    const elementsToAnimate = document.querySelectorAll('.about-grid, .skill-category, .experience-item, .project-container');
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
        //  KusumOS v2.1 ONLINE  //
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
⠀⠀⠀⢀⣠⠞⠉⢀⣠⠴⠛⠻⣿⣿⣯⣟⣻⣴⣶⣶⠿⠟⠛⠉⠙⠻⢬⡉⡟⠁⢀⡴⠚⠁⠀⠀⠀⠀⠀⠀⠀⠈⣻⡛⢋⣠⣿⠋⢻⠀⠀⠀⠀⠀⢸⠒⠁⠙⢿⠉⠀⠀⠀⠀⠀⠀
⠀⣰⠟⣿⡁⠀⠴⠛⠁⠀⠀⢠⣌⠻⣶⡶⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠉⠓⣶⣿⣦⣤⣶⡾⠿⡿⠟⣻⣷⣶⡶⠋⢿⠛⠛⠁⠀⠈⠣⣄⣀⣀⡴⠛⠢⠤⣤⡟⠀⠀⠀⠀⠀⠀⠀
⢰⠇⣠⡾⠃⠀⠀⠀⠀⠀⠀⠸⣯⠿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⡿⣲⣿⠃⠀⡜⠁⣰⡿⣿⠋⠀⣰⣿⣇⠀⠀⠀⣀⠀⠀⠉⡁⠀⠀⠀⣰⠟⠀⠀⠀⠀⠀⠀⠀⠀
Assisted by: Gemini
⣼⢠⡿⠀⠀⠀⢠⣤⣤⣤⣤⣤⣤⣤⣤⣄⣠⡀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣿⣭⣿⣿⡇⠀⣼⠁⢰⣿⣿⡏⠀⢠⣿⣾⣿⣟⡛⠉⠁⠀⠀⠀⠱⢤⣠⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⣿⢸⡇⠀⠀⠀⠈⢷⠀⠀⠀⠀⠀⠀⣀⠴⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⡀⣀⣯⣀⣾⣿⣿⣷⠦⣤⣳⣸⡻⣧⡉⢿⣷⣶⣶⣶⣶⣾⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⣿⣿⡇⠀⠀⠀⠀⠈⢧⠀⠀⠀⣠⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠴⠛⣿⣯⡻⣿⣿⣿⣿⣿⡿⢿⣿⣦⡙⣿⣽⣾⣎⣙⣛⣻⣿⣩⣾⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠸⣿⡇⠀⠀⠀⠀⠀⠈⣇⡤⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⠿⠟⠛⢻⡟⠛⣳⣿⣿⣿⣿⣿⣦⣙⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
Assisted by: Gemini
⢠⣏⣧⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣼⡷⡄⠀⠀⠸⣷⣾⡿⢿⣴⣿⣿⡟⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢸⣿⡟⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣶⠟⣛⡧⠖⠛⣦⡀⣶⣿⣿⠿⣿⡿⢻⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⣾⣿⣇⠸⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠞⠁⠈⠙⢉⣡⠴⢾⣯⣽⠿⣿⣿⣿⣷⣄⣠⣾⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⡇⣿⣿⠀⠹⣤⣶⡖⣒⠚⠒⠲⢦⡀⠀⠀⡴⠁⠀⠀⢀⡴⠋⠉⠛⠛⠋⠁⣶⡼⣿⣿⣿⣿⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
Assisted by: Gemini
⣇⣿⣿⡆⣠⣿⣿⣧⣸⣷⠀⠀⣸⠉⠳⣾⠁⠀⢀⡴⠋⠀⠀⢀⣤⣶⣶⣾⡿⠁⢹⣿⣿⣿⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠁⠉⠉⠁⠀⠈⠀⠉⠉⠘⠁⠀⠀⢀⠀⠈⠁⠀⠈⠀⠀⠀⠀⠀⢁⣁⠀⠀⠀⠀⠀⠈⠉⠁⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    `,
        'color: #00ffc3; font-weight: bold; font-family: monospace;'
    );
});

