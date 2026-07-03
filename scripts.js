document.addEventListener('DOMContentLoaded', function() {

    const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
            if (REDUCED_MOTION) {
                counter.textContent = useDecimals ? target.toFixed(decimals) : target;
                return;
            }
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

    // --- Shared Typewriter (used by battle_deck arena + final_boss intro) ---
    const twTimers = new WeakMap();
    function typewrite(text, el, speed) {
        const prev = twTimers.get(el);
        if (prev) clearTimeout(prev);
        el.innerHTML = '';
        if (REDUCED_MOTION) {
            el.textContent = text;
            return;
        }
        const cursor = document.createElement('span');
        cursor.className = 'type-cursor';
        el.appendChild(cursor);
        let i = 0;
        function tick() {
            if (i < text.length) {
                cursor.insertAdjacentText('beforebegin', text[i++]);
                twTimers.set(el, setTimeout(tick, speed));
            } else {
                cursor.remove();
            }
        }
        tick();
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

        // Constellation lines between nearby particles
        const LINK_DIST = 9;
        const MAX_LINKS = 300;
        const linkGeo = new THREE.BufferGeometry();
        const linkPos = new Float32Array(MAX_LINKS * 2 * 3);
        linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3));
        const linkMat = new THREE.LineBasicMaterial({ color: 0x00ffc3, transparent: true, opacity: 0.09 });
        const linkMesh = new THREE.LineSegments(linkGeo, linkMat);
        scene.add(linkMesh);

        function updateLinks() {
            let n = 0;
            for (let i = 0; i < particles.length && n < MAX_LINKS; i++) {
                const a = particles[i].position;
                for (let j = i + 1; j < particles.length && n < MAX_LINKS; j++) {
                    const b = particles[j].position;
                    const dx = a.x - b.x, dy = a.y - b.y;
                    if (dx * dx + dy * dy < LINK_DIST * LINK_DIST) {
                        const o = n * 6;
                        linkPos[o] = a.x;     linkPos[o + 1] = a.y; linkPos[o + 2] = a.z;
                        linkPos[o + 3] = b.x; linkPos[o + 4] = b.y; linkPos[o + 5] = b.z;
                        n++;
                    }
                }
            }
            linkGeo.setDrawRange(0, n * 2);
            linkGeo.attributes.position.needsUpdate = true;
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
            if (REDUCED_MOTION) renderer.render(scene, camera);
        });

        if (REDUCED_MOTION) {
            updateLinks();
            renderer.render(scene, camera);
            return;
        }

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

            updateLinks();
            renderer.render(scene, camera);
        };

        animate();
    }

    initThreeJS();


    // --- Hero Typewriter Effect ---
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

        if (REDUCED_MOTION) {
            element.textContent = roles[1];
            return;
        }

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
                    behavior: REDUCED_MOTION ? 'auto' : 'smooth'
                });
            }
        });
    });

    // --- Video Modal: single document-level delegation ---
    const videoModal = document.querySelector('#video-modal');
    if (videoModal) {
        const videoContainer = videoModal.querySelector('.video-container');
        const closeModalButton = videoModal.querySelector('.close-btn');

        document.addEventListener('click', (e) => {
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

        const closeModal = () => {
            videoModal.classList.remove('active');
            videoContainer.innerHTML = '';
        };

        if (closeModalButton) closeModalButton.addEventListener('click', closeModal);
        videoModal.addEventListener('click', (event) => {
            if (event.target === videoModal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && videoModal.classList.contains('active')) closeModal();
        });
    }

    /* ============================================================
       DATA — battle_deck.exe
       ============================================================ */
    const PROJECTS = [
        {
            title: 'GTP.app', category: 'fullstack',
            rarity: 'legendary', cost: 9, tagline: 'Repos in. Resume bullets out.',
            images: ['gtp1.png','gtp2.png','gtp3.png','gtp4.png','gtp5.png','gtp6.png'],
            desc: 'Analyzes GitHub repos and generates recruiter-ready resume bullets by extracting structured evidence from 7+ API endpoints concurrently — pom.xml, commit history, language bytes — before calling GPT-4o-mini. Deployed on GCP Cloud Run with Kafka, Redis/Postgres dual-write job state, and Spring OAuth2 session management.',
            tech: ['Java 21','Spring Boot','React 19','TypeScript','PostgreSQL','Redis','Kafka','Docker','GCP','Terraform','OpenAI'],
            links: [
                { label: 'Launch_App', url: 'https://github-to-portfolio-neon.vercel.app', primary: true },
                { label: 'Run_Demo', video: 'gtp.mp4', primary: false }
            ]
        },
        {
            title: 'DataflowEngine.cpp', category: 'systems',
            rarity: 'legendary', cost: 8, tagline: '40x faster than recompute.',
            images: ['df_wiki.gif','df_vwap.gif'],
            desc: 'Incremental query engine that propagates delta updates through a typed C++ operator DAG — ~40× faster than batch recompute at 0.1% change rates on 1M rows. C++ core with retraction semantics and zero-alloc hot paths; exposed via Python DSL (pybind11) and Spring Boot REST/SSE; 70 Google Tests + full benchmark suite.',
            tech: ['C++17','CMake','Abseil','Python','pybind11','Spring Boot','GTest','Google Benchmark'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/dataflow-engine', primary: true }
            ]
        },
        {
            title: 'ClashExchange.cpp', category: 'fullstack',
            rarity: 'legendary', cost: 8, tagline: '411k orders/sec. 3.7us match.',
            images: ['crt1.png','crt2.png','crt3.png'],
            desc: 'Real-time card trading platform modeled on a financial exchange. C++17 matching engine with price-time priority order book (shared_mutex reader-writer locking), atomic PostgreSQL settlement, and SHA-256 Merkle-hashed trade records. 411k orders/sec single-thread throughput, 3.7µs match latency, 0.00% 5xx rate under 74k HTTP requests. React/TypeScript frontend with live candlestick charts, depth chart, and real-time order book via WebSocket.',
            tech: ['C++17','Boost.Beast','PostgreSQL','Redis','React 19','TypeScript','Docker','WebSocket','JWT','Google Benchmark'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/Clash-Royale-Trading', primary: true }
            ]
        },
        {
            title: 'os-sim.cpp', category: 'systems',
            rarity: 'epic', cost: 7, tagline: 'Virtual memory, visualized.',
            images: ['read.png','write.png','thrashing.png','cow.png'],
            desc: "Full-screen FTXUI TUI simulating OS virtual memory in C++17. Four replacement policies (FIFO, LRU with O(1) list+hash map, CLOCK second-chance, OPT/Belady's), copy-on-write fork with reference counting, and a 16-entry per-process TLB with LRU eviction and TLB shootdown. 50+ tests across 9 binaries; 8 experiments benchmark policy faults, TLB hit rates, and CoW efficiency.",
            tech: ['C++17','CMake','FTXUI','GTest','TLB','CoW','CLOCK'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/os-sim', primary: true },
                { label: 'Run_Demo', video: 'os-sim.mp4', primary: false }
            ]
        },
        {
            title: 'GameEngine.exe', category: 'systems',
            rarity: 'epic', cost: 6, tagline: 'A* pathfinding, zero leaks.',
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
            rarity: 'epic', cost: 5, tagline: 'Realtime docs under 50ms.',
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
            rarity: 'rare', cost: 4, tagline: 'Git, rebuilt from scratch.',
            images: ['lit1.png','lit2.png','lit3.png'],
            desc: 'Distributed VCS in Java implementing Git core — SHA-1 content hashing, three-way merge, branch switching, conflict resolution, 9+ CLI commands.',
            tech: ['Java','Gradle','JUnit','File I/O'],
            links: [
                { label: 'View_Source', url: 'https://github.com/imraghavojha/lit', primary: true }
            ]
        },
        {
            title: 'No_Chess.py', category: 'fullstack',
            rarity: 'rare', cost: 4, tagline: 'Free reviews. Sorry, Chess.com.',
            images: ['NC1.png','NC2.png','ReviewNC.png'],
            desc: 'React chess app with free unlimited PGN game reviews and live sessions powered by Stockfish engine via FastAPI WebSocket.',
            tech: ['React','FastAPI','Stockfish','Docker'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/No_Chess.com', primary: true },
                { label: 'Run_Demo', video: 'NC.mp4', primary: false }
            ]
        },
        {
            title: 'Sudoku.app', category: 'frontend',
            rarity: 'rare', cost: 3, tagline: 'Hints, undo, ncurses core.',
            images: ['sudoku2.png','sudoku3.png','sudoku.png'],
            desc: 'Three-difficulty Sudoku with hints, undo, and real-time error highlighting. C++ backend solver with ncurses; TypeScript/Tailwind frontend.',
            tech: ['C++','TypeScript','Vite','Tailwind'],
            links: [
                { label: 'C++_Source', url: 'https://github.com/kusum-bhattarai/sudoku', primary: true },
                { label: 'TS_Source', url: 'https://github.com/kusum-bhattarai/sudoku-frontend', primary: false }
            ]
        },
        {
            title: 'MazeCrawler.ts', category: 'frontend',
            rarity: 'common', cost: 3, tagline: 'DFS vs BFS, playable.',
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
            rarity: 'common', cost: 2, tagline: 'Your media, your library.',
            images: ['Watched1.png','Watched2.png'],
            desc: 'Personal media library — track watched movies and series with TMDB posters and ratings, plus custom reviews and categories.',
            tech: ['React','JavaScript','TMDB API','CSS3'],
            links: [
                { label: 'Launch_App', url: 'https://watched-theta.vercel.app/', primary: true },
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/Watched', primary: false }
            ]
        },
        {
            title: 'RetailRethink.app', category: 'frontend',
            rarity: 'common', cost: 2, tagline: 'Budget, rethought.',
            images: ['RR1.jpeg','RR2.jpeg','RR3.png'],
            desc: 'Expense tracker with custom categories, an analysis dashboard, and historical spending visualization to rethink your budget.',
            tech: ['React','TypeScript','Vite','Tailwind'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/retailrethink', primary: true }
            ]
        }
    ];

    /* ============================================================
       DATA — character_select.exe
       ============================================================ */
    const CHARACTERS = [
        {
            id: 'pekka', name: 'P.E.K.K.A', sprite: 'pekka-s.png', interest: 'Clash Royale',
            cls: 'TANK', flavor: 'Butterflies confuse its targeting system.',
            highlight: { value: '11K', label: 'TROPHIES', icon: 'trophy-s.png' },
            stats: []
        },
        {
            id: 'board', name: 'THE BOARD', sprite: 'chessp-s.png', interest: 'Chess',
            cls: 'STRATEGIST', flavor: 'Plays the Italian. Blunders the endgame.',
            stats: [['OPENINGS', 80], ['TACTICS', 75], ['TIME TROUBLE', 90]]
        },
        {
            id: 'ferrari', name: 'THE SCUDERIA', sprite: 'ferrari.png', interest: 'F1 + Fast & Furious',
            cls: 'SPEED', flavor: 'Box box. We are family.',
            stats: [['RACE PACE', 92], ['STRATEGY FAITH', 30], ['SUNDAY LOYALTY', 100]]
        },
        {
            id: 'bat', name: 'THE BAT', sprite: 'bat-s.png', interest: 'DC Comics',
            cls: 'DETECTIVE', flavor: 'Prep time is a skill stat.',
            stats: [['GADGETS', 85], ['BROODING', 97], ['NO GUNS', 100]]
        },
        {
            id: 'iron', name: 'MK-85', sprite: 'iron-s.png', interest: 'Marvel',
            cls: 'ENGINEER', flavor: 'Built this in a cave. With a box of scraps.',
            stats: [['TECH', 96], ['EGO', 89], ['SACRIFICE', 100]]
        },
        {
            id: 'vader', name: 'DARK LORD', sprite: 'vader-s.png', interest: 'Star Wars',
            cls: 'BOSS', flavor: 'Finds your lack of tests disturbing.',
            stats: [['FORCE', 94], ['DIPLOMACY', 12], ['THEME MUSIC', 100]]
        }
    ];

    /* ============================================================
       DATA — chess_match.pgn (maps to experience articles)
       ============================================================ */
    const CHESS_MOVES = [
        { san: '1. e4',  note: 'the opening',          from: 'e2', to: 'e4' },
        { san: '2. Nf3', note: 'developing pieces',    from: 'g1', to: 'f3' },
        { san: '3. Bc4', note: 'the Italian Game',     from: 'f1', to: 'c4' },
        { san: '4. O-O', note: 'castled — king safe',  from: 'e1', to: 'g1' }
    ];

    /* ============================================================
       DATA — memory_card.sav (photo gallery)
       img points to a file in PicsPortfolio/; edit captions freely.
       Set img to null for an empty "NO DATA" slot.
       ============================================================ */
    const SAVES = [
        { img: 'img4-s.jpg', caption: 'AI Hackathon 2026', meta: 'ACHIEVEMENT UNLOCKED' },
        { img: 'img1-s.jpg', caption: 'low tide, high spirits', meta: 'SAVED: THE BAY' },
        { img: 'img3-s.jpg', caption: 'first star of the evening', meta: 'ASTROPHYSICS: ACTIVE' },
        { img: 'img6-s.jpg', caption: 'headphones on, world off', meta: 'SPIDEY CASE EQUIPPED' },
        { img: 'img2-s.jpg', caption: 'where the waves argue with the rocks', meta: 'WEATHER: MOODY' },
        { img: 'img7-s.jpg', caption: 'sunset drive through the palms', meta: 'GOLDEN HOUR: CAUGHT' },
        { img: 'img5-s.jpg', caption: 'front seat, full sun', meta: 'MOOD: RECHARGED' }
    ];

    /* ============================================================
       PROGRAM: battle_deck.exe
       ============================================================ */
    (function initBattleDeck() {
        const deckGrid = document.getElementById('deck-grid');
        const arena = document.getElementById('arena');
        if (!deckGrid || !arena) return;

        const arenaTitle = document.getElementById('arena-title');
        const arenaGallery = document.getElementById('arena-gallery');
        const arenaFilename = document.getElementById('arena-filename');
        const arenaDesc = document.getElementById('arena-desc');
        const arenaTech = document.getElementById('arena-tech');
        const arenaLinks = document.getElementById('arena-links');
        const arenaRarity = document.getElementById('arena-rarity');
        const arenaCost = document.getElementById('arena-cost');
        const arenaClose = document.getElementById('arena-close');
        const agPrev = document.getElementById('ag-prev');
        const agNext = document.getElementById('ag-next');
        const deckAvg = document.getElementById('deck-avg');

        let filtered = [...PROJECTS];
        let deployedIdx = -1;
        let imgs = [];
        let imgIdx = 0;

        function renderDeck() {
            deckGrid.innerHTML = '';
            filtered.forEach((p, i) => {
                const card = document.createElement('button');
                card.type = 'button';
                card.className = 'battle-card';
                card.dataset.rarity = p.rarity;
                card.dataset.idx = i;
                card.setAttribute('aria-label', p.title + ' — ' + p.rarity + ' card, cost ' + p.cost);
                card.style.setProperty('--card-i', i);
                card.innerHTML = `
                    <span class="card-cost"><span>${p.cost}</span></span>
                    <span class="card-art"><img src="PicsPortfolio/projects/${p.images[0]}" alt="" loading="lazy"></span>
                    <span class="card-nameplate">${p.title}</span>
                    <span class="card-tagline">${p.tagline}</span>
                    <span class="card-rarity-label">${p.rarity}</span>
                `;
                card.addEventListener('click', () => deploy(i));
                deckGrid.appendChild(card);
            });
            if (deckAvg) {
                const avg = filtered.reduce((s, p) => s + p.cost, 0) / (filtered.length || 1);
                deckAvg.textContent = 'AVG ELIXIR ' + avg.toFixed(1) + ' — ' + filtered.length + '/' + PROJECTS.length + ' CARDS LOADED — CLICK A CARD TO DEPLOY';
            }
        }

        function renderGallery(project) {
            arenaGallery.querySelectorAll('img, .showcase-dots').forEach(el => el.remove());
            imgs = project.images.map((src, i) => {
                const img = document.createElement('img');
                img.src = 'PicsPortfolio/projects/' + src;
                img.alt = project.title + ' ' + (i + 1);
                if (i === 0) img.classList.add('active');
                arenaGallery.insertBefore(img, agPrev);
                return img;
            });

            if (project.images.length > 1) {
                const dotsWrap = document.createElement('div');
                dotsWrap.className = 'showcase-dots';
                project.images.forEach((_, i) => {
                    const dot = document.createElement('button');
                    dot.className = 'showcase-dot' + (i === 0 ? ' active' : '');
                    dot.setAttribute('aria-label', 'Screenshot ' + (i + 1));
                    dot.addEventListener('click', () => showImg(i));
                    dotsWrap.appendChild(dot);
                });
                arenaGallery.appendChild(dotsWrap);
            }

            [agPrev, agNext].forEach(btn => {
                const show = project.images.length > 1;
                btn.style.opacity = show ? '' : '0';
                btn.style.pointerEvents = show ? '' : 'none';
            });
            imgIdx = 0;
        }

        function showImg(i) {
            imgIdx = Math.max(0, Math.min(i, imgs.length - 1));
            imgs.forEach((img, idx) => img.classList.toggle('active', idx === imgIdx));
            arenaGallery.querySelectorAll('.showcase-dot').forEach((d, idx) => d.classList.toggle('active', idx === imgIdx));
        }

        function renderInfo(project) {
            if (arenaTitle) arenaTitle.textContent = project.title + ' — deployed';
            if (arenaFilename) arenaFilename.textContent = project.title;
            if (arenaRarity) {
                arenaRarity.textContent = project.rarity.toUpperCase();
                arenaRarity.dataset.rarity = project.rarity;
            }
            if (arenaCost) arenaCost.textContent = 'COST: ' + project.cost;
            arenaTech.innerHTML = project.tech.map(t => `<span>${t}</span>`).join('');
            arenaLinks.innerHTML = project.links.map(link => {
                if (link.video) {
                    const mime = link.video.endsWith('.mov') ? 'video/quicktime' : 'video/mp4';
                    return `<a href="#" class="btn${link.primary ? '' : ' btn-secondary'}" data-modal-target="#video-modal" data-video-src="PicsPortfolio/projects/${link.video}" data-video-type="${mime}">${link.label}</a>`;
                }
                return `<a href="${link.url}" target="_blank" class="btn${link.primary ? '' : ' btn-secondary'}">${link.label}</a>`;
            }).join('');
            typewrite(project.desc, arenaDesc, 9);
        }

        function deploy(idx) {
            const project = filtered[idx];
            if (!project) return;
            deployedIdx = idx;

            deckGrid.classList.add('has-deployed');
            deckGrid.querySelectorAll('.battle-card').forEach((c, i) => {
                c.classList.toggle('deployed', i === idx);
            });

            const wasHidden = arena.hidden;
            arena.hidden = false;
            renderGallery(project);
            renderInfo(project);

            if (!REDUCED_MOTION) {
                arena.classList.remove('arena-deploying');
                void arena.offsetWidth; // restart animation
                arena.classList.add('arena-deploying');
            }
            if (wasHidden) {
                arena.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'nearest' });
            }
        }

        function recall() {
            if (arena.hidden) return;
            arena.hidden = true;
            deployedIdx = -1;
            deckGrid.classList.remove('has-deployed');
            deckGrid.querySelectorAll('.battle-card').forEach(c => c.classList.remove('deployed'));
        }

        agPrev.addEventListener('click', e => {
            e.stopPropagation();
            showImg(imgIdx > 0 ? imgIdx - 1 : imgs.length - 1);
        });
        agNext.addEventListener('click', e => {
            e.stopPropagation();
            showImg(imgIdx < imgs.length - 1 ? imgIdx + 1 : 0);
        });

        if (arenaClose) arenaClose.addEventListener('click', recall);

        document.addEventListener('keydown', e => {
            const modal = document.querySelector('#video-modal');
            if (modal && modal.classList.contains('active')) return;
            const section = document.getElementById('projects');
            if (!section) return;
            const rect = section.getBoundingClientRect();
            if (rect.top >= window.innerHeight || rect.bottom <= 0) return;
            if (e.key === 'Escape') { recall(); return; }
            if (arena.hidden) return;
            if (e.key === 'ArrowLeft' && deployedIdx > 0) deploy(deployedIdx - 1);
            if (e.key === 'ArrowRight' && deployedIdx < filtered.length - 1) deploy(deployedIdx + 1);
        });

        // Touch swipe on arena gallery
        let touchStartX = 0;
        arenaGallery.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
        arenaGallery.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(dx) > 40) showImg(dx < 0 ? Math.min(imgIdx + 1, imgs.length - 1) : Math.max(imgIdx - 1, 0));
        }, { passive: true });

        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const f = btn.dataset.filter;
                filtered = f === 'all' ? [...PROJECTS] : PROJECTS.filter(p => p.category === f);
                recall();
                renderDeck();
            });
        });

        renderDeck();
    })();

    /* ============================================================
       PROGRAM: character_select.exe
       ============================================================ */
    (function initCharacterSelect() {
        const grid = document.getElementById('char-grid');
        const detail = document.getElementById('char-detail');
        const statusline = document.getElementById('char-statusline');
        if (!grid || !detail) return;

        function renderDetail(ch) {
            detail.innerHTML = `
                <div class="char-detail-sprite ${ch.id === 'vader' ? 'char-sith' : ''}">
                    <img src="PicsPortfolio/sprites/${ch.sprite}" alt="${ch.name}" loading="lazy">
                </div>
                <div class="char-detail-info">
                    <div class="char-detail-header">
                        <h4 class="char-detail-name">${ch.name}</h4>
                        <span class="char-detail-class">CLASS: ${ch.cls}</span>
                    </div>
                    <p class="char-detail-interest">// ${ch.interest}</p>
                    <p class="char-detail-flavor">"${ch.flavor}"</p>
                    ${ch.highlight ? `
                    <div class="char-highlight">
                        ${ch.highlight.icon ? `<img class="char-highlight-icon" src="PicsPortfolio/sprites/${ch.highlight.icon}" alt="" width="34" height="34">` : ''}
                        <span class="char-highlight-value">${ch.highlight.value}</span>
                        <span class="char-highlight-label">${ch.highlight.label}</span>
                    </div>` : `
                    <div class="char-stats">
                        ${ch.stats.map(([label, v]) => `
                            <div class="char-stat">
                                <span class="char-stat-label">${label}</span>
                                <div class="char-stat-bar"><div class="char-stat-fill" style="--v:${v}%"></div></div>
                                <span class="char-stat-num">${v}</span>
                            </div>
                        `).join('')}
                    </div>`}
                </div>
            `;
            if (!REDUCED_MOTION) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => detail.classList.add('stats-live'));
                });
                detail.classList.remove('stats-live');
            } else {
                detail.classList.add('stats-live');
            }
            if (statusline) statusline.textContent = '> PLAYER 1 SELECTED: ' + ch.name + ' [' + ch.cls + ']';
        }

        const tiles = [];
        let currentIdx = 0;

        function select(i) {
            currentIdx = i;
            tiles.forEach((t, j) => t.classList.toggle('selected', j === i));
            renderDetail(CHARACTERS[i]);
        }

        CHARACTERS.forEach((ch, i) => {
            const tile = document.createElement('button');
            tile.type = 'button';
            tile.className = 'char-tile' + (ch.id === 'vader' ? ' char-sith' : '');
            tile.dataset.charId = ch.id;
            tile.setAttribute('aria-label', 'Select ' + ch.name + ' — ' + ch.interest);
            tile.innerHTML = `
                <span class="char-tile-p1">P1</span>
                <img src="PicsPortfolio/sprites/${ch.sprite}" alt="" loading="lazy">
                <span class="char-tile-name">${ch.name}</span>
            `;
            tile.addEventListener('click', () => {
                stopAttract(true);
                select(i);
            });
            grid.appendChild(tile);
            tiles.push(tile);
        });
        select(0);

        // Arcade attract mode: auto-cycle the roster while on screen,
        // stop for good the moment the visitor picks a fighter.
        let attractTimer = null;
        let userLocked = false;

        function startAttract() {
            if (userLocked || REDUCED_MOTION || attractTimer) return;
            attractTimer = setInterval(() => {
                select((currentIdx + 1) % CHARACTERS.length);
            }, 3200);
        }

        function stopAttract(lock) {
            if (attractTimer) {
                clearInterval(attractTimer);
                attractTimer = null;
            }
            if (lock) userLocked = true;
        }

        const attractObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) startAttract();
                else stopAttract(false);
            });
        }, { threshold: 0.35 });
        attractObserver.observe(grid);
    })();

    /* ============================================================
       PROGRAM: chess_match.pgn — scrollytelling
       The section pins while its tall wrapper scrolls; scroll
       progress plays the moves, one experience on stage at a time.
       ============================================================ */
    (function initChessMatch() {
        const wrap = document.getElementById('chess-scroll');
        const fromSq = document.getElementById('chess-from');
        const toSq = document.getElementById('chess-to');
        const moveLabel = document.getElementById('chess-move-label');
        const moveNote = document.getElementById('chess-move-note');
        const articles = document.querySelectorAll('.move-stage .experience-item');
        if (!wrap || !articles.length) return;

        const N = CHESS_MOVES.length;
        let activeIdx = -1;

        function squareToVars(sq, el) {
            const file = sq.charCodeAt(0) - 97;          // a=0 ... h=7
            const rank = 8 - parseInt(sq[1], 10);        // row from top
            el.style.setProperty('--f', file);
            el.style.setProperty('--r', rank);
        }

        function activateMove(idx) {
            if (idx === activeIdx) return;
            activeIdx = idx;
            const move = CHESS_MOVES[idx];
            if (!move) return;
            if (fromSq && toSq) {
                squareToVars(move.from, fromSq);
                squareToVars(move.to, toSq);
            }
            if (moveLabel) moveLabel.textContent = move.san;
            if (moveNote) moveNote.textContent = move.note;
            articles.forEach(a => {
                a.classList.toggle('move-active', parseInt(a.dataset.move, 10) === idx);
            });
        }

        if (REDUCED_MOTION) {
            // CSS shows all cards stacked; just set the board to the last move
            activateMove(N - 1);
            articles.forEach(a => a.classList.add('move-active'));
            return;
        }

        function runway() {
            return wrap.offsetHeight - window.innerHeight;
        }

        function idxFromScroll() {
            const total = runway();
            if (total <= 0) return 0;
            const scrolled = Math.min(Math.max(-wrap.getBoundingClientRect().top, 0), total);
            return Math.min(N - 1, Math.floor((scrolled / total) * N));
        }

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                ticking = false;
                activateMove(idxFromScroll());
            });
        }, { passive: true });

        activateMove(idxFromScroll());
    })();

    /* ============================================================
       PROGRAM: memory_card.sav
       ============================================================ */
    (function initMemoryCard() {
        const strip = document.getElementById('save-strip');
        if (!strip) return;

        SAVES.forEach((save, i) => {
            const slot = document.createElement('div');
            slot.className = 'save-slot' + (save.img ? '' : ' save-slot-empty');
            const slotNum = String(i + 1).padStart(2, '0');
            slot.innerHTML = `
                <span class="save-slot-header">SLOT ${slotNum}</span>
                <div class="save-slot-frame">
                    ${save.img
                        ? `<img src="PicsPortfolio/gallery/${save.img}" alt="${save.caption}" loading="lazy">`
                        : `<span class="save-slot-nodata">NO DATA</span><span class="save-slot-insert">INSERT MEMORY</span>`
                    }
                </div>
                <span class="save-slot-caption">${save.caption}</span>
                <span class="save-slot-meta">${save.meta}</span>
            `;
            strip.appendChild(slot);
        });
    })();

    /* ============================================================
       PROGRAM: final_boss.exe
       ============================================================ */
    (function initFinalBoss() {
        const bossText = document.getElementById('boss-typewriter');
        const contactSection = document.getElementById('contact');
        if (bossText && contactSection) {
            const line = 'A wild recruiter challenge appears... choose your attack.';
            let fired = false;
            const bossObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !fired) {
                        fired = true;
                        typewrite(line, bossText, 32);
                        bossObserver.disconnect();
                    }
                });
            }, { threshold: 0.3 });
            bossObserver.observe(contactSection);
        }

        // Contact Form (Formspree AJAX)
        const contactForm = document.querySelector('.contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = contactForm.querySelector('button[type="submit"]');
                const originalText = btn.textContent;
                btn.textContent = 'Attacking...';
                btn.disabled = true;

                try {
                    const res = await fetch(contactForm.action, {
                        method: 'POST',
                        body: new FormData(contactForm),
                        headers: { 'Accept': 'application/json' }
                    });
                    if (res.ok) {
                        contactForm.innerHTML = '<p class="form-success">&gt; CRITICAL HIT. Challenge received — the boss will respond shortly.</p>';
                    } else {
                        btn.textContent = originalText;
                        btn.disabled = false;
                        const errMsg = contactForm.querySelector('.form-error') || Object.assign(document.createElement('p'), { className: 'form-error' });
                        errMsg.textContent = '> ATTACK MISSED. Something went wrong — try emailing directly.';
                        contactForm.appendChild(errMsg);
                    }
                } catch {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            });
        }
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
        '.about-card, .char-select, .skill-category, .comic-panel, .deck-grid, .memory-card, .boss-window'
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

    /* ============================================================
       EASTER EGG: P.E.K.K.A speech bubble
       ============================================================ */
    (function initPekka() {
        const sprite = document.getElementById('pekka-sprite');
        const bubble = document.getElementById('pekka-bubble');
        if (!sprite || !bubble) return;

        const lines = [
            'PEKKA SMASH.',
            'BUTTERFLY?',
            'HELLO, RECRUITER.',
            'ELIXIR LOW.',
            'HIRE MY HUMAN.'
        ];
        let lineIdx = 0;
        let hideTimer = null;

        function speak() {
            bubble.textContent = lines[lineIdx];
            lineIdx = (lineIdx + 1) % lines.length;
            bubble.hidden = false;
            if (!REDUCED_MOTION) {
                sprite.classList.remove('pekka-shake');
                void sprite.offsetWidth;
                sprite.classList.add('pekka-shake');
            }
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = setTimeout(() => { bubble.hidden = true; }, 2200);
        }

        sprite.addEventListener('click', speak);
        sprite.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); speak(); }
        });
    })();

    /* ============================================================
       EASTER EGG: Konami code — GOD MODE
       ============================================================ */
    (function initKonami() {
        const SEQUENCE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
        let pos = 0;

        function toast(msg) {
            let el = document.getElementById('cheat-toast');
            if (!el) {
                el = document.createElement('div');
                el.id = 'cheat-toast';
                el.innerHTML = '<div class="cheat-toast-title">CHEAT CODE</div><div class="cheat-toast-msg"></div>';
                document.body.appendChild(el);
            }
            el.querySelector('.cheat-toast-msg').textContent = msg;
            el.classList.add('show');
            clearTimeout(el._t);
            el._t = setTimeout(() => el.classList.remove('show'), 3000);
        }

        document.addEventListener('keydown', (e) => {
            const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
            if (key === SEQUENCE[pos]) {
                pos++;
                if (pos === SEQUENCE.length) {
                    pos = 0;
                    const on = document.body.classList.toggle('god-mode');
                    toast(on
                        ? 'GOD MODE ON — every card in the deck goes legendary.'
                        : 'GOD MODE OFF — rarity restored.');
                    console.log('%c> CHEAT ' + (on ? 'ACCEPTED' : 'REVOKED') + ': GOD MODE', 'color:#ffd166; font-family:monospace; font-weight:bold;');
                }
            } else {
                pos = key === SEQUENCE[0] ? 1 : 0;
            }
        });
    })();

    console.log(
        `%c
 +-------------------------------+
 |  KusumOS v4.0 // ARCADE       |
 |  ALL SYSTEMS GO               |
 |                               |
 |  > psst: try the konami code  |
 |    (up up down down left      |
 |     right left right B A)     |
 +-------------------------------+
`,
        'color: #00ffc3; font-weight: bold; font-family: monospace;'
    );
});
