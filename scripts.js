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
            const decimals = parseInt(counter.getAttribute('data-decimals'), 10) || 0;
            const useDecimals = decimals > 0;
            const duration = 1800;
            const startTime = performance.now();

            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease-out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = target * eased;
                counter.textContent = useDecimals ? current.toFixed(decimals) : Math.floor(current);
                if (progress < 1) requestAnimationFrame(update);
                else counter.textContent = useDecimals ? target.toFixed(decimals) : target;
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

    // --- Project Showcase ---
    const PROJECTS = [
        {
            title: 'GTP.app', category: 'fullstack',
            images: ['gtp1.png','gtp2.png','gtp3.png','gtp4.png','gtp5.png','gtp6.png'],
            desc: 'Analyzes GitHub repos and generates recruiter-ready resume bullets by extracting structured evidence from 7+ API endpoints concurrently — pom.xml, commit history, language bytes — before calling GPT-4o-mini. Deployed on GCP Cloud Run with Kafka, Redis/Postgres dual-write job state, and Spring OAuth2 session management.',
            tech: ['Java 21','Spring Boot','React 19','TypeScript','PostgreSQL','Redis','Kafka','Docker','GCP','Terraform','OpenAI'],
            links: [
                { label: 'Launch_App', url: 'https://github-to-portfolio-neon.vercel.app', primary: true },
                { label: 'Run_Demo', video: 'GTP.mp4', primary: false }
            ]
        },
        {
            title: 'DataflowEngine.cpp', category: 'systems',
            images: ['df_wiki.gif','df_vwap.gif'],
            desc: 'Incremental query engine that propagates delta updates through a typed C++ operator DAG — ~40× faster than batch recompute at 0.1% change rates on 1M rows. C++ core with retraction semantics and zero-alloc hot paths; exposed via Python DSL (pybind11) and Spring Boot REST/SSE; 70 Google Tests + full benchmark suite.',
            tech: ['C++17','CMake','Abseil','Python','pybind11','Spring Boot','GTest','Google Benchmark'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/dataflow-engine', primary: true }
            ]
        },
        {
            title: 'os-sim.cpp', category: 'systems',
            images: ['read.png','write.png','thrashing.png','cow.png'],
            desc: "Full-screen FTXUI TUI simulating OS virtual memory in C++17. Four replacement policies (FIFO, LRU with O(1) list+hash map, CLOCK second-chance, OPT/Belady's), copy-on-write fork with reference counting, and a 16-entry per-process TLB with LRU eviction and TLB shootdown. 50+ tests across 9 binaries; 8 experiments benchmark policy faults, TLB hit rates, and CoW efficiency.",
            tech: ['C++17','CMake','FTXUI','GTest','TLB','CoW','CLOCK'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/os-sim', primary: true },
                { label: 'Run_Demo', video: 'os-sim.mp4', primary: false }
            ]
        },
        {
            title: 'ClashExchange.cpp', category: 'fullstack',
            images: ['crt1.png','crt2.png','crt3.png'],
            desc: 'Real-time card trading platform modeled on a financial exchange. C++17 matching engine with price-time priority order book (shared_mutex reader-writer locking), atomic PostgreSQL settlement, and SHA-256 Merkle-hashed trade records. 411k orders/sec single-thread throughput, 3.7µs match latency, 0.00% 5xx rate under 74k HTTP requests. React/TypeScript frontend with live candlestick charts, depth chart, and real-time order book via WebSocket.',
            tech: ['C++17','Boost.Beast','PostgreSQL','Redis','React 19','TypeScript','Docker','WebSocket','JWT','Google Benchmark'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/Clash-Royale-Trading', primary: true }
            ]
        },
        {
            title: 'GameEngine.exe', category: 'systems',
            images: ['CR1.jpeg','CR2.jpeg'],
            desc: 'OOP game engine across 43 source files implementing Factory pattern and polymorphic inheritance with 10 entity types. Features autonomous AI with A* pathfinding, probabilistic decision-making, multi-layered combat calculations, and a comprehensive Google Test suite with zero memory leaks via RAII.',
            tech: ['C++','CMake','OOP','GTest','CI/CD','Smart Pointers'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/Clash-Royale-Clone', primary: true },
                { label: 'Run_Demo', video: 'Sample_Gameplay.mp4', primary: false }
            ]
        },
        {
            title: 'DevJournal.app', category: 'fullstack',
            images: ['DevJournal1.png','DevJournal2.png'],
            desc: 'Full-stack collaborative platform with real-time WebSocket messaging <50ms, Markdown editor, 3 microservices on AWS, 90% test coverage via CI/CD.',
            tech: ['Node.js','TypeScript','Docker','AWS','Socket.IO'],
            links: [
                { label: 'Launch_App', url: 'https://dev-journal-topaz.vercel.app/login', primary: true },
                { label: 'Run_Demo', video: 'DevJournal3.mp4', primary: false }
            ]
        },
        {
            title: 'Lit.jar', category: 'systems',
            images: ['lit1.png','lit2.png','lit3.png'],
            desc: 'Distributed VCS in Java implementing Git core — SHA-1 content hashing, three-way merge, branch switching, conflict resolution, 9+ CLI commands.',
            tech: ['Java','Gradle','JUnit','File I/O'],
            links: [
                { label: 'View_Source', url: 'https://github.com/imraghavojha/lit', primary: true }
            ]
        },
        {
            title: 'No_Chess.py', category: 'fullstack',
            images: ['NC1.png','NC2.png','ReviewNC.png'],
            desc: 'React chess app with free unlimited PGN game reviews and live sessions powered by Stockfish engine via FastAPI WebSocket.',
            tech: ['React','FastAPI','Stockfish','Docker'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/No_Chess.com', primary: true },
                { label: 'Run_Demo', video: 'NC.mp4', primary: false }
            ]
        },
        {
            title: 'MazeCrawler.ts', category: 'frontend',
            images: ['maze2.png','maze1.png','maze3.png'],
            desc: 'Pixel art maze solver/game — DFS and BFS navigate a procedurally generated maze step-by-step, with a playable character. Zero dependencies.',
            tech: ['TypeScript','Canvas API','Vite'],
            links: [
                { label: 'Launch_App', url: 'https://maze-ashy.vercel.app', primary: true },
                { label: 'Run_Demo', video: 'Maze.mov', primary: false }
            ]
        },
        {
            title: 'Watched.app', category: 'frontend',
            images: ['Watched1.png','Watched2.png'],
            desc: 'Personal media library — track watched movies and series with TMDB posters and ratings, plus custom reviews and categories.',
            tech: ['React','JavaScript','TMDB API','CSS3'],
            links: [
                { label: 'Launch_App', url: 'https://watched-theta.vercel.app/', primary: true },
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/Watched', primary: false }
            ]
        },
        {
            title: 'Sudoku.app', category: 'frontend',
            images: ['sudoku2.png','sudoku3.png','sudoku.png'],
            desc: 'Three-difficulty Sudoku with hints, undo, and real-time error highlighting. C++ backend solver with ncurses; TypeScript/Tailwind frontend.',
            tech: ['C++','TypeScript','Vite','Tailwind'],
            links: [
                { label: 'C++_Source', url: 'https://github.com/kusum-bhattarai/sudoku', primary: true },
                { label: 'TS_Source', url: 'https://github.com/kusum-bhattarai/sudoku-frontend', primary: false }
            ]
        },
        {
            title: 'RetailRethink.app', category: 'frontend',
            images: ['RR1.jpeg','RR2.jpeg','RR3.png'],
            desc: 'Expense tracker with custom categories, an analysis dashboard, and historical spending visualization to rethink your budget.',
            tech: ['React','TypeScript','Vite','Tailwind'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/retailrethink', primary: true }
            ]
        }
    ];

    (function initShowcase() {
        const gallery = document.getElementById('showcase-gallery');
        const winTitle = document.getElementById('showcase-win-title');
        const counterEl = document.getElementById('showcase-counter');
        const filenameEl = document.getElementById('showcase-filename');
        const descEl = document.getElementById('showcase-desc');
        const techEl = document.getElementById('showcase-tech');
        const linksEl = document.getElementById('showcase-links');
        const prevBtn = document.getElementById('showcase-prev');
        const nextBtn = document.getElementById('showcase-next');
        const sgPrev = document.getElementById('sg-prev');
        const sgNext = document.getElementById('sg-next');
        const infoEl = document.getElementById('showcase-info');
        if (!gallery) return;

        let filtered = [...PROJECTS];
        let projectIdx = 0;
        let imgIdx = 0;
        let twTimer = null;
        let imgs = [];

        function renderGallery(project) {
            imgs.forEach(img => img.remove());
            const oldDots = gallery.querySelector('.showcase-dots');
            if (oldDots) oldDots.remove();
            const oldBadge = gallery.querySelector('.showcase-category-badge');
            if (oldBadge) oldBadge.remove();

            imgs = project.images.map((src, i) => {
                const img = document.createElement('img');
                img.src = 'PicsPortfolio/' + src;
                img.alt = project.title + ' ' + (i + 1);
                if (i === 0) img.classList.add('active');
                gallery.insertBefore(img, sgPrev);
                return img;
            });

            if (project.images.length > 1) {
                const dotsWrap = document.createElement('div');
                dotsWrap.className = 'showcase-dots';
                project.images.forEach((_, i) => {
                    const dot = document.createElement('button');
                    dot.className = 'showcase-dot' + (i === 0 ? ' active' : '');
                    dot.addEventListener('click', () => showImg(i));
                    dotsWrap.appendChild(dot);
                });
                gallery.appendChild(dotsWrap);
            }

            const badge = document.createElement('span');
            badge.className = 'showcase-category-badge';
            badge.textContent = project.category;
            gallery.appendChild(badge);

            [sgPrev, sgNext].forEach(btn => {
                const show = project.images.length > 1;
                btn.style.opacity = show ? '' : '0';
                btn.style.pointerEvents = show ? '' : 'none';
            });
            imgIdx = 0;
        }

        function showImg(i) {
            imgIdx = Math.max(0, Math.min(i, imgs.length - 1));
            imgs.forEach((img, idx) => img.classList.toggle('active', idx === imgIdx));
            gallery.querySelectorAll('.showcase-dot').forEach((d, idx) => d.classList.toggle('active', idx === imgIdx));
        }

        function typewrite(text, el, speed) {
            if (twTimer) clearTimeout(twTimer);
            el.innerHTML = '';
            const cursor = document.createElement('span');
            cursor.className = 'showcase-cursor';
            el.appendChild(cursor);
            let i = 0;
            function tick() {
                if (i < text.length) {
                    cursor.insertAdjacentText('beforebegin', text[i++]);
                    twTimer = setTimeout(tick, speed);
                }
            }
            tick();
        }

        function renderInfo(project) {
            if (filenameEl) filenameEl.textContent = project.title;
            techEl.innerHTML = project.tech.map(t => `<span>${t}</span>`).join('');
            linksEl.innerHTML = project.links.map(link => {
                if (link.video) {
                    const mime = link.video.endsWith('.mov') ? 'video/quicktime' : 'video/mp4';
                    return `<a href="#" class="btn${link.primary ? '' : ' btn-secondary'}" data-modal-target="#video-modal" data-video-src="PicsPortfolio/${link.video}" data-video-type="${mime}">${link.label}</a>`;
                }
                return `<a href="${link.url}" target="_blank" class="btn${link.primary ? '' : ' btn-secondary'}">${link.label}</a>`;
            }).join('');
            typewrite(project.desc, descEl, 11);
        }

        function render(idx) {
            const project = filtered[idx];
            if (!project) return;
            if (winTitle) winTitle.textContent = project.title;
            const n = filtered.length;
            counterEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
            prevBtn.disabled = idx === 0;
            nextBtn.disabled = idx === n - 1;
            renderGallery(project);

            if (infoEl) {
                infoEl.style.opacity = '0';
                infoEl.style.transform = 'translateY(8px)';
                infoEl.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
                setTimeout(() => {
                    renderInfo(project);
                    infoEl.style.opacity = '1';
                    infoEl.style.transform = 'translateY(0)';
                    infoEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                }, 190);
            } else {
                renderInfo(project);
            }
        }

        sgPrev.addEventListener('click', e => {
            e.stopPropagation();
            showImg(imgIdx > 0 ? imgIdx - 1 : imgs.length - 1);
        });
        sgNext.addEventListener('click', e => {
            e.stopPropagation();
            showImg(imgIdx < imgs.length - 1 ? imgIdx + 1 : 0);
        });

        prevBtn.addEventListener('click', () => { if (projectIdx > 0) render(--projectIdx); });
        nextBtn.addEventListener('click', () => { if (projectIdx < filtered.length - 1) render(++projectIdx); });

        document.addEventListener('keydown', e => {
            const section = document.getElementById('projects');
            if (!section) return;
            const rect = section.getBoundingClientRect();
            if (rect.top >= window.innerHeight || rect.bottom <= 0) return;
            if (e.key === 'ArrowLeft' && projectIdx > 0) render(--projectIdx);
            if (e.key === 'ArrowRight' && projectIdx < filtered.length - 1) render(++projectIdx);
        });

        // Touch swipe for inner gallery images
        let touchStartX = 0;
        gallery.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
        gallery.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(dx) > 40) showImg(dx < 0 ? Math.min(imgIdx + 1, imgs.length - 1) : Math.max(imgIdx - 1, 0));
        }, { passive: true });

        // Video modal delegation (dynamic links rendered by JS)
        const videoModal = document.querySelector('#video-modal');
        if (videoModal) {
            const videoContainer = videoModal.querySelector('.video-container');
            linksEl.addEventListener('click', e => {
                const btn = e.target.closest('[data-modal-target]');
                if (!btn || !videoContainer) return;
                e.preventDefault();
                const src = btn.getAttribute('data-video-src');
                const mime = btn.getAttribute('data-video-type') || 'video/mp4';
                if (src) {
                    videoContainer.innerHTML = `<video controls autoplay><source src="${src}" type="${mime}">Your browser does not support video.</video>`;
                    videoModal.classList.add('active');
                }
            });
        }

        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const f = btn.dataset.filter;
                filtered = f === 'all' ? [...PROJECTS] : PROJECTS.filter(p => p.category === f);
                projectIdx = 0;
                render(0);
            });
        });

        render(0);
    })();

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
        '.about-card, .skill-category, .experience-item, .achievement-card, .showcase-container'
    );
    elementsToAnimate.forEach(element => {
        observer.observe(element);
    });

    // --- Skills Tab Switching ---
    const skillsTabs = document.querySelectorAll('.skills-tab');
    const skillsCategories = document.querySelectorAll('.skill-category[data-tab-content]');

    if (skillsTabs.length > 0 && skillsCategories.length > 0) {
        skillsCategories.forEach((cat, i) => {
            if (i > 0) cat.classList.add('tab-hidden');
        });

        skillsTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                skillsTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const targetTab = tab.dataset.tab;
                skillsCategories.forEach(cat => {
                    const isTarget = cat.dataset.tabContent === targetTab;
                    cat.classList.toggle('tab-hidden', !isTarget);
                    if (isTarget) cat.classList.add('is-visible');
                });
            });
        });
    }

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
