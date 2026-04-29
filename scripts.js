document.addEventListener('DOMContentLoaded', function() {

    // Immediately reveal content and start counters
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    if (header) header.classList.add('loaded');
    if (main) main.classList.add('loaded');
    animateCounters();

    // --- Animated Stat Counters ---
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-value');
        counters.forEach(counter => {
            const target = parseFloat(counter.getAttribute('data-target'));
            const useDecimals = counter.getAttribute('data-decimals') === '1';
            const duration = 1800;
            const startTime = performance.now();

            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease-out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = target * eased;
                counter.textContent = useDecimals ? current.toFixed(1) : Math.floor(current);
                if (progress < 1) requestAnimationFrame(update);
                else counter.textContent = useDecimals ? target.toFixed(1) : target;
            }
            requestAnimationFrame(update);
        });
    }

    // --- Ambient Cursor Glow ---
    const cursorGlow = document.getElementById('cursor-glow');
    if (cursorGlow) {
        document.addEventListener('mousemove', (e) => {
            cursorGlow.style.left = e.clientX + 'px';
            cursorGlow.style.top = e.clientY + 'px';
        });
    }

    // --- Three.js Background with Mouse Parallax ---
    function initThreeJS() {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas || !window.THREE) return;

        const scene = new THREE.Scene();

        const frustumSize = 100;
        const aspect = window.innerWidth / window.innerHeight;
        const camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            1, 1000
        );
        camera.position.z = 10;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const particles = [];
        const geometry = new THREE.IcosahedronGeometry(1, 0);

        for (let i = 0; i < 150; i++) {
            const isCyan = Math.random() < 0.12;
            const material = new THREE.MeshBasicMaterial({
                color: isCyan ? 0x00ffc3 : 0xffffff,
                wireframe: true,
                transparent: true,
                opacity: isCyan ? 0.3 : 0.18
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = (Math.random() - 0.5) * (frustumSize * aspect);
            mesh.position.y = (Math.random() - 0.5) * frustumSize;
            mesh.position.z = (Math.random() - 0.5) * 20;
            mesh.rotation.x = Math.random() * 2 * Math.PI;
            mesh.rotation.y = Math.random() * 2 * Math.PI;
            const scale = Math.random() * 0.4 + 0.2;
            mesh.scale.set(scale, scale, scale);
            mesh.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.04,
                (Math.random() - 0.5) * 0.04,
                0
            );
            scene.add(mesh);
            particles.push(mesh);
        }

        // Mouse parallax tracking
        let targetMouseX = 0;
        let targetMouseY = 0;
        document.addEventListener('mousemove', (e) => {
            targetMouseX = (e.clientX / window.innerWidth - 0.5) * 4;
            targetMouseY = (e.clientY / window.innerHeight - 0.5) * 4;
        });

        window.addEventListener('resize', () => {
            const newAspect = window.innerWidth / window.innerHeight;
            camera.left = frustumSize * newAspect / -2;
            camera.right = frustumSize * newAspect / 2;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

        const animate = () => {
            requestAnimationFrame(animate);

            // Smooth camera parallax toward mouse
            camera.position.x += (targetMouseX - camera.position.x) * 0.025;
            camera.position.y += (-targetMouseY - camera.position.y) * 0.025;

            const bounds = {
                x: (frustumSize * window.innerWidth / window.innerHeight) / 2,
                y: frustumSize / 2
            };

            particles.forEach(p => {
                p.position.add(p.userData.velocity);
                if (p.position.x > bounds.x + 2) p.position.x = -bounds.x - 2;
                if (p.position.x < -bounds.x - 2) p.position.x = bounds.x + 2;
                if (p.position.y > bounds.y + 2) p.position.y = -bounds.y - 2;
                if (p.position.y < -bounds.y - 2) p.position.y = bounds.y + 2;
                p.rotation.y += 0.001;
            });

            renderer.render(scene, camera);
        };

        animate();
    }

    initThreeJS();


    // --- Typewriter Effect ---
    function typewriter() {
        const element = document.getElementById('typewriter');
        if (!element) return;

        const roles = [
            "C++ Developer",
            "Software Engineer",
            "Systems Engineer",
            "AI and Data Researcher",
            "Full-Stack Dev"
        ];
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
                currentText = currentRole.substring(0, charIndex - 1);
                charIndex--;
            } else {
                currentText = currentRole.substring(0, charIndex + 1);
                charIndex++;
            }

            element.textContent = currentText;

            let typeSpeed = isDeleting ? deletingSpeed : typingSpeed;

            if (!isDeleting && charIndex === currentRole.length) {
                typeSpeed = delayBetweenRoles;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                typeSpeed = typingSpeed;
            }

            setTimeout(type, typeSpeed);
        }

        setTimeout(type, typingSpeed);
    }

    typewriter();


    // --- Header Scroll Effect ---
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
                if (navList && navList.classList.contains('active')) {
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

    // --- Project Filter ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectContainers = document.querySelectorAll('.project-container');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('active')) return;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            // Fade out currently visible cards
            projectContainers.forEach(c => {
                if (c.style.display !== 'none') {
                    c.style.opacity = '0';
                    c.style.transform = 'translateY(8px)';
                }
            });

            setTimeout(() => {
                // Swap visibility
                projectContainers.forEach(c => {
                    const matches = filter === 'all' || c.dataset.category === filter;
                    c.style.display = matches ? 'flex' : 'none';
                    if (matches) {
                        c.style.opacity = '0';
                        c.style.transform = 'translateY(8px)';
                    }
                });

                // Fade in matching cards (double rAF ensures display:flex has applied)
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    projectContainers.forEach(c => {
                        if (c.style.display !== 'none') {
                            c.style.opacity = '1';
                            c.style.transform = 'translateY(0)';
                        }
                    });
                }));
            }, 200);
        });
    });

    // --- Scroll-Reveal Observer ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    const elementsToAnimate = document.querySelectorAll(
        '.about-card, .skill-category, .experience-item, .project-container, .achievement-card'
    );
    elementsToAnimate.forEach(element => {
        observer.observe(element);
    });

    // --- Contact Form (Formspree AJAX) ---
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            try {
                const res = await fetch(contactForm.action, {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: { 'Accept': 'application/json' }
                });
                if (res.ok) {
                    contactForm.innerHTML = '<p class="form-success">&gt; Message received. I\'ll get back to you soon.</p>';
                } else {
                    btn.textContent = originalText;
                    btn.disabled = false;
                    const errMsg = contactForm.querySelector('.form-error') || Object.assign(document.createElement('p'), { className: 'form-error' });
                    errMsg.textContent = '> Something went wrong. Try emailing directly.';
                    contactForm.appendChild(errMsg);
                }
            } catch {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    // --- Scroll Spy (highlight active nav link) ---
    const allSections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav ul li a');

    const spyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    const isActive = link.getAttribute('href') === `#${id}`;
                    link.classList.toggle('nav-active', isActive);
                });
            }
        });
    }, { threshold: 0.35, rootMargin: '-80px 0px -50% 0px' });

    allSections.forEach(s => spyObserver.observe(s));

    // --- Pixel Sprite Loader ---
    const sprites = document.querySelectorAll('.pixel-sprite img');
    if (sprites.length > 0) {
        const imagePath = 'PicsPortfolio/';
        sprites.forEach(img => {
            const filename = img.getAttribute('data-filename');
            if (filename) img.src = imagePath + filename;
        });
    }

    console.log(
        `%c
        //-----------------------//
        //  KusumOS v3.0 ONLINE  //
        //  ALL SYSTEMS GO       //
        //-----------------------//

 ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣶⣾⠋⠉⠉⠉⢻⣷⣶⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡿⠛⠁⠸⡆⠀⠀⠀⢸⠀⠈⠙⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡇⠀⠀⠀⣧⠀⠀⢀⡟⠀⠀⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡿⡇⠀⠀⠀⠘⠦⠤⠼⠁⠀⠀⠀⣸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀⠀⠀⢀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣇⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⠋⢹⡀⠀⠀⣰⠋⠁⣷⠀⠀⠀⠀⠀⠀⠀⠀
    `,
        'color: #00ffc3; font-weight: bold; font-family: monospace;'
    );
});
