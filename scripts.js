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
            id: 'witch', name: 'THE WITCH', sprite: 'witch-s.png', interest: 'Clash Royale',
            cls: 'SUMMONER', flavor: 'Raises skeletons. And the trophy count.',
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
        { img: 'img5-s.jpg', caption: 'front seat, full sun', meta: 'MOOD: RECHARGED' },
        { img: 'img-8.JPG', caption: 'kusum means flower in sanskrit', meta: 'FAV: PEONIES' }
    ];

    /* ============================================================
       DATA — bookshelf.db
       Array order = shelf order (left to right, top shelf first).
       cover  → PicsPortfolio/books/<id>.jpg  (swap the file to change art)
       pages  → sets spine thickness
       spine  → spine color (picked from the cover; any hex works)
       tags   → themes the search matches on (never shown as a wall)
       status: 'reading' puts the book face-out with a bookmark.
       ============================================================ */
    const BOOKS = [
        { id: 'brave-new-world', title: 'Brave New World', author: 'Aldous Huxley', pages: 288, spine: '#87804a', status: 'reading', rating: null,
          blurb: 'A future World State keeps everyone content with conditioning, castes and soma, until someone raised outside it arrives.',
          tags: ['dystopia', 'control', 'pleasure', 'conformity', 'technology', 'society'] },
        { id: 'nineteen-eighty-four', title: '1984', author: 'George Orwell', pages: 328, spine: '#b3262a', rating: 4,
          blurb: 'Winston Smith rewrites history for the Party under the eye of Big Brother, and starts to quietly rebel.',
          quote: 'Who controls the past controls the future. Who controls the present controls the past.',
          tags: ['dystopia', 'surveillance', 'totalitarianism', 'propaganda', 'truth', 'rebellion'] },
        { id: 'notes-from-underground', title: 'Notes from Underground', author: 'Fyodor Dostoyevsky', pages: 136, spine: '#e2dfdb', rating: 5,
          blurb: 'A bitter retired official rants from his "underground" against reason, progress, and mostly himself.',
          quote: 'It is clear to me now that, owing to my unbounded vanity and to the high standard I set for myself, I often looked at myself with furious discontent, which verged on loathing, and so I inwardly attributed the same feeling to everyone.',
          tags: ['existentialism', 'alienation', 'spite', 'self-loathing', 'free will', 'russian literature', 'dostoevsky'] },
        { id: 'crime-and-punishment', title: 'Crime and Punishment', author: 'Fyodor Dostoyevsky', pages: 560, spine: '#908b6e', rating: 4.5,
          blurb: 'A broke former student in St. Petersburg commits a murder to prove a theory, then has to live inside the guilt.',
          quote: "To go wrong in one's own way is better than to go right in someone else's.",
          tags: ['guilt', 'morality', 'murder', 'redemption', 'poverty', 'psychological', 'russian literature', 'dostoevsky'] },
        { id: 'white-nights', title: 'White Nights', author: 'Fyodor Dostoyevsky', pages: 96, spine: '#1c1c20', rating: 5,
          blurb: 'Over four sleepless summer nights in St. Petersburg, a lonely dreamer falls for a young woman who is waiting for someone else.',
          quote: 'I like revisiting, at certain times, spots where I was once happy; I like to shape the present in the image of the irretrievable past.',
          tags: ['loneliness', 'unrequited love', 'daydreaming', 'nostalgia', 'short story', 'russian literature', 'dostoevsky'] },
        { id: 'the-metamorphosis', title: 'The Metamorphosis', author: 'Franz Kafka', pages: 74, spine: '#b89b79', rating: 5,
          blurb: "Gregor Samsa wakes up transformed into a giant insect, and his family's patience slowly runs out.",
          note: 'the blend of absurd, surreal and mundane which gave rise to the adjective "kafkaesque"',
          tags: ['absurdism', 'alienation', 'family', 'duty', 'surreal', 'kafkaesque', 'novella'] },
        { id: 'letters-to-milena', title: 'Letters to Milena', author: 'Franz Kafka', pages: 276, spine: '#538969', rating: 4.5,
          blurb: 'Kafka’s letters to Milena Jesenská, his Czech translator: intense, anxious and tender.',
          quote: 'You are the knife I turn inside myself; that is love. That, my dear, is love.',
          tags: ['love letters', 'longing', 'anxiety', 'intimacy', 'correspondence', 'nonfiction'] },
        { id: 'the-stranger', title: 'The Stranger', author: 'Albert Camus', pages: 123, spine: '#1c294c', rating: 5,
          blurb: 'Meursault, detached and indifferent in Algiers, kills a man and is judged as much for his indifference as for the crime.',
          quote: 'I didn’t like having to explain to them, so I just shut up, smoked a cigarette, and looked at the sea.',
          tags: ['absurdism', 'existentialism', 'indifference', 'death', 'meaning', 'french literature'] },
        { id: 'no-longer-human', title: 'No Longer Human', author: 'Osamu Dazai', pages: 176, spine: '#e6e6de', rating: 4.5,
          blurb: 'In three notebooks, Ōba Yōzō describes a lifetime of feeling unable to be human and hiding behind the role of the clown.',
          quote: "Mine has been a life of much shame. I can't even guess myself what it must be to live the life of a human being.",
          tags: ['alienation', 'depression', 'shame', 'identity', 'masks', 'japanese literature'] },
        { id: 'norwegian-wood', title: 'Norwegian Wood', author: 'Haruki Murakami', pages: 296, spine: '#c83535', rating: 4,
          blurb: 'Toru Watanabe looks back on his student years in 1960s Tokyo, torn between fragile Naoko and vivid Midori.',
          quote: 'If you only read the books that everyone else is reading, you can only think what everyone else is thinking.',
          tags: ['grief', 'first love', 'memory', 'coming of age', 'melancholy', 'japanese literature'] },
        { id: 'kafka-on-the-shore', title: 'Kafka on the Shore', author: 'Haruki Murakami', pages: 480, spine: '#bb6f55', rating: 4,
          blurb: 'A fifteen-year-old runaway and an old man who can talk to cats follow parallel, dreamlike paths.',
          quote: "Things outside you are projections of what's inside you, and what's inside you is a projection of what's outside. So when you step into the labyrinth outside you, at the same time you're stepping into the labyrinth inside.",
          tags: ['magical realism', 'fate', 'dreams', 'identity', 'surreal', 'japanese literature'] },
        { id: 'sputnik-sweetheart', title: 'Sputnik Sweetheart', author: 'Haruki Murakami', pages: 210, spine: '#cc1330', rating: 4,
          blurb: 'K loves Sumire, Sumire loves an older woman named Miu, and then Sumire disappears on a Greek island.',
          quote: "Don't pointless things have a place, too, in this far-from-perfect world?",
          tags: ['unrequited love', 'loneliness', 'disappearance', 'surreal', 'japanese literature'] },
        { id: 'dorian-gray', title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', spineTitle: 'Dorian Gray', pages: 254, spine: '#858585', rating: 5,
          blurb: 'A beautiful young man stays untouched by time while his portrait ages and rots in his place.',
          quote: 'To define is to limit.',
          tags: ['beauty', 'vanity', 'corruption', 'hedonism', 'gothic', 'art', 'victorian'] },
        { id: 'pride-and-prejudice', title: 'Pride and Prejudice', author: 'Jane Austen', pages: 432, spine: '#5b4a3a', rating: 4,
          blurb: 'Elizabeth Bennet and Mr. Darcy misjudge each other badly, then slowly learn better.',
          quote: 'I could easily forgive his pride, if he had not mortified mine.',
          tags: ['romance', 'class', 'marriage', 'wit', 'first impressions', 'classic'] },
        { id: 'little-women', title: 'Little Women', author: 'Louisa May Alcott', pages: 449, spine: '#dc5941', rating: 4.5,
          blurb: 'The four March sisters grow up in Civil War-era Massachusetts, and Jo is determined to be a writer.',
          quote: 'Women, they have minds, and they have souls, as well as just hearts. And they’ve got ambition, and they’ve got talent, as well as just beauty. I’m so sick of people saying that love is all a woman is fit for.',
          tags: ['sisterhood', 'family', 'ambition', 'women', 'coming of age', 'classic'] },
        { id: 'wuthering-heights', title: 'Wuthering Heights', author: 'Emily Brontë', pages: 342, spine: '#4f6670', rating: 3.5,
          blurb: 'The obsessive love between Catherine and Heathcliff on the Yorkshire moors, and the damage it does to everyone after them.',
          quote: 'I have not broken your heart - you have broken it; and in breaking it, you have broken mine.',
          tags: ['obsession', 'revenge', 'doomed love', 'gothic', 'moors', 'classic'] },
        { id: 'song-of-achilles', title: 'The Song of Achilles', author: 'Madeline Miller', pages: 378, spine: '#bd9a45', rating: 3.5,
          blurb: 'The Trojan War retold by Patroclus, from boyhood with Achilles to the ending everyone already knows.',
          quote: 'Name one hero who was happy.',
          tags: ['greek mythology', 'love', 'war', 'fate', 'heroes', 'tragedy'] },
        { id: 'the-kite-runner', title: 'The Kite Runner', author: 'Khaled Hosseini', pages: 371, spine: '#5e6b51', rating: 4.5,
          blurb: 'Amir betrays his closest friend Hassan in 1970s Kabul, and comes back as an adult to try to make it right.',
          quote: "And that's the thing about people who mean everything they say. They think everyone else does too.",
          tags: ['friendship', 'betrayal', 'guilt', 'redemption', 'fathers and sons', 'afghanistan'] },
        { id: 'the-atlas-six', title: 'The Atlas Six', author: 'Olivie Blake', pages: 374, spine: '#363636', rating: 4,
          blurb: 'Six young magicians compete for a place in the secretive Alexandrian Society. Only five will be initiated.',
          quote: 'Really, there was nothing more dangerous than a woman who knew her own worth.',
          tags: ['dark academia', 'magic', 'ambition', 'rivalry', 'secret society', 'fantasy'] },
        { id: 'the-atlas-paradox', title: 'The Atlas Paradox', author: 'Olivie Blake', pages: 432, spine: '#e3dcca', rating: 3.5,
          blurb: 'The Society’s new initiates start finding out what their place in the archives really costs.',
          quote: 'The presumption that she was in pieces just because she had once been broken was a dangerous one',
          tags: ['dark academia', 'magic', 'power', 'morality', 'secret society', 'fantasy'] },
        { id: 'alone-with-you-in-the-ether', title: 'Alone With You in the Ether', author: 'Olivie Blake', spineTitle: 'Alone With You', pages: 400, spine: '#23b7c3', rating: 5,
          blurb: 'Two people with complicated minds meet by chance in front of a painting at the Art Institute of Chicago, and build a relationship out of conversation.',
          quote: '“I like it,” he said. “What?” He loosened the wine from his lips. “Your brain.”',
          tags: ['romance', 'mental health', 'intimacy', 'art', 'conversation', 'chicago'] },
        { id: 'hp1', title: "Harry Potter and the Sorcerer's Stone", spineTitle: "Sorcerer's Stone", author: 'J.K. Rowling', series: 'hp', pages: 309, spine: '#7a2a1c', rating: 4,
          blurb: 'An eleven-year-old finds out he is a wizard and leaves the cupboard under the stairs for Hogwarts.',
          tags: ['magic', 'hogwarts', 'friendship', 'school', 'wizards', 'fantasy'] },
        { id: 'hp2', title: 'Harry Potter and the Chamber of Secrets', spineTitle: 'Chamber of Secrets', author: 'J.K. Rowling', series: 'hp', pages: 341, spine: '#513b8f', rating: 4,
          blurb: 'A hidden chamber opens somewhere in Hogwarts, and students start turning up petrified.',
          tags: ['magic', 'hogwarts', 'mystery', 'basilisk', 'wizards', 'fantasy'] },
        { id: 'hp3', title: 'Harry Potter and the Prisoner of Azkaban', spineTitle: 'Prisoner of Azkaban', author: 'J.K. Rowling', series: 'hp', pages: 435, spine: '#7b5737', rating: 5,
          blurb: 'A notorious prisoner escapes Azkaban, and he seems to be coming for Harry.',
          tags: ['magic', 'hogwarts', 'time travel', 'dementors', 'wizards', 'fantasy'] },
        { id: 'hp4', title: 'Harry Potter and the Goblet of Fire', spineTitle: 'Goblet of Fire', author: 'J.K. Rowling', series: 'hp', pages: 734, spine: '#b31608', rating: 4,
          blurb: 'Harry is entered into the deadly Triwizard Tournament without ever putting his name in.',
          tags: ['magic', 'hogwarts', 'tournament', 'dragons', 'wizards', 'fantasy'] },
        { id: 'hp5', title: 'Harry Potter and the Order of the Phoenix', spineTitle: 'Order of the Phoenix', author: 'J.K. Rowling', series: 'hp', pages: 870, spine: '#a49426', rating: 4,
          blurb: 'Nobody believes Voldemort is back, and Hogwarts gets a new teacher who runs it like a tyrant.',
          tags: ['magic', 'hogwarts', 'rebellion', 'authority', 'wizards', 'fantasy'] },
        { id: 'hp6', title: 'Harry Potter and the Half-Blood Prince', spineTitle: 'Half-Blood Prince', author: 'J.K. Rowling', series: 'hp', pages: 652, spine: '#2c6e3f', rating: 5,
          blurb: 'Dumbledore shows Harry Voldemort’s past while Harry learns from an old potions book signed "the Half-Blood Prince".',
          tags: ['magic', 'hogwarts', 'memories', 'potions', 'wizards', 'fantasy'] },
        { id: 'hp7', title: 'Harry Potter and the Deathly Hallows', spineTitle: 'Deathly Hallows', author: 'J.K. Rowling', series: 'hp', pages: 759, spine: '#b8741a', rating: 4,
          blurb: 'Harry, Ron and Hermione leave Hogwarts behind to hunt down Voldemort’s Horcruxes.',
          tags: ['magic', 'war', 'sacrifice', 'death', 'wizards', 'fantasy'] },
        { id: 'the-elegant-universe', title: 'The Elegant Universe', author: 'Brian Greene', pages: 448, spine: '#161b3a', rating: 4.5,
          blurb: 'A readable tour of superstrings, hidden dimensions and the search for one theory that unites relativity and quantum mechanics.',
          quote: 'We all love a good story. We all love a tantalizing mystery. We all love the underdog pressing onward against seemingly insurmountable odds. We all, in one form or another, are trying to make sense of the world around us. And all of these elements lie at the core of modern physics. The story is among the grandest -- the unfolding of the entire universe; the mystery is among the toughest -- finding out how the cosmos came to be; the odds are among the most daunting -- bipeds, newly arrived by cosmic time scales trying to reveal the secrets of the ages; and the quest is among the deepest -- the search for fundamental laws to explain all we see and beyond, from the tiniest particles to the most distant galaxies.',
          tags: ['physics', 'string theory', 'quantum mechanics', 'relativity', 'cosmos', 'science', 'nonfiction'] },
        { id: 'a-brief-history-of-time', title: 'A Brief History of Time', author: 'Stephen Hawking', pages: 212, spine: '#3a2c1c', rating: 4,
          blurb: 'Hawking explains the big bang, black holes and the nature of time for people who are not physicists.',
          quote: 'The increase of disorder or entropy is what distinguishes the past from the future, giving a direction to time.',
          tags: ['physics', 'black holes', 'time', 'big bang', 'cosmology', 'science', 'nonfiction'] },
        { id: 'the-grand-design', title: 'The Grand Design', author: 'Stephen Hawking & Leonard Mlodinow', pages: 208, spine: '#1d222b', rating: 4.5,
          blurb: 'Hawking and Mlodinow ask why there is a universe at all, and argue it does not need a creator to explain it.',
          quote: 'It is hard to imagine how free will can operate if our behavior is determined by physical law, so it seems that we are no more than biological machines and that free will is just an illusion.',
          tags: ['physics', 'free will', 'm-theory', 'cosmology', 'philosophy', 'science', 'nonfiction'] },
        { id: 'courage-to-be-disliked', title: 'The Courage to Be Disliked', author: 'Ichiro Kishimi & Fumitake Koga', spineTitle: 'Courage to Be Disliked', pages: 288, spine: '#ded5cb', rating: 4.5,
          blurb: 'A philosopher and a skeptical young man argue through Adlerian psychology: freedom, happiness and not living for approval.',
          quote: 'We cannot alter objective facts. But subjective interpretations can be altered as much as one likes. And we are inhabitants of a subjective world.',
          tags: ['psychology', 'philosophy', 'self-help', 'freedom', 'happiness', 'dialogue', 'nonfiction'] },
        { id: 'it-ends-with-us', title: 'It Ends with Us', author: 'Colleen Hoover', pages: 384, spine: '#983071', rating: 2,
          blurb: 'Lily falls for a neurosurgeon named Ryle and has to face a pattern she swore she would never repeat.',
          tags: ['romance', 'abuse', 'relationships', 'family', 'contemporary'] },
        { id: 'ugly-love', title: 'Ugly Love', author: 'Colleen Hoover', pages: 336, spine: '#1c87b3', rating: 1,
          blurb: 'Tate and Miles agree to something with no strings. It does not stay simple.',
          tags: ['romance', 'heartbreak', 'relationships', 'contemporary'] }
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
       PROGRAM: bookshelf.db
       Shelf of 3D books + detail <dialog> + search. Search is
       keyword-only at first; focusing the search box lazy-loads a
       small sentence-embedding model (~23MB, cached by the browser)
       so queries like "feeling like an outsider" match by meaning.
       ============================================================ */
    (function initBookshelf() {
        const shelf = document.getElementById('shelf');
        const dialog = document.getElementById('book-dialog');
        if (!shelf || !dialog || typeof dialog.showModal !== 'function') return;

        const COVER_DIR = 'PicsPortfolio/books/';
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/dist/transformers.min.js';
        const FALLBACK_SPINES = ['#5b3a3a', '#2f4858', '#3d5a45', '#6b5b3e', '#4a3f6b', '#3a3a44'];
        const statusline = document.getElementById('shelf-statusline');
        const search = document.getElementById('shelf-search');
        const $ = id => document.getElementById(id);
        const bd = {
            file: $('bd-file'), cover: $('bd-cover'), title: $('bd-title'), author: $('bd-author'),
            rating: $('bd-rating'), blurb: $('bd-blurb'), quote: $('bd-quote'),
            quoteLabel: $('bd-quote-label'), quoteText: $('bd-quote-text')
        };

        const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
        const spineOf = b => b.spine || FALLBACK_SPINES[hash(b.id) % FALLBACK_SPINES.length];
        const inkOf = hex => {
            const n = parseInt(hex.slice(1), 16);
            const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
            return lum > 0.6 ? '#16140f' : '#f3efe6';
        };
        const surname = author => author.split(' & ')[0].split(' ').pop();
        const coverArt = b => `<span class="cover-art"><span>${b.title}</span><span>${surname(b.author)}</span><img src="${COVER_DIR}${b.id}.jpg" alt="" loading="lazy"></span>`;

        // --- build the shelf ---
        BOOKS.forEach(b => {
            const reading = b.status === 'reading';
            const spine = spineOf(b);
            const w = reading ? 150 : Math.round(Math.min(56, Math.max(20, 14 + b.pages * 0.05)));
            const h = reading ? 224 : b.series ? 232 : 198 + hash(b.id) % 34;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'book' + (reading ? ' is-reading' : '');
            btn.dataset.id = b.id;
            btn.setAttribute('aria-label', `${b.title} by ${b.author}`);
            btn.style.cssText = `--w:${w}px; --h:${h}px; --spine:${spine}; --ink:${inkOf(spine)}`;
            btn.innerHTML = reading
                ? `<span class="book-3d"><span class="book-face">${coverArt(b)}</span><span class="book-ribbon"></span></span>`
                : `<span class="book-3d">
                       <span class="book-spine"><span class="book-title">${b.spineTitle || b.title}</span><span class="book-author">${surname(b.author)}</span></span>
                       <span class="book-cover">${coverArt(b)}</span>
                   </span>`;
            shelf.appendChild(btn);
        });
        // a missing cover file just reveals the typographic cover underneath
        const hideBrokenCover = e => { if (e.target.tagName === 'IMG') e.target.hidden = true; };
        shelf.addEventListener('error', hideBrokenCover, true);
        bd.cover.addEventListener('error', hideBrokenCover, true);

        const current = BOOKS.find(b => b.status === 'reading');
        const idleStatus = `> ${BOOKS.length} VOLUMES` + (current ? ` — NOW READING: ${current.title.toUpperCase()}` : '');
        statusline.textContent = idleStatus;

        // --- detail dialog ---
        const STAR_ROWS = ['....#....', '...###...', '...###...', '#########', '.#######.', '..#####..', '..#####..', '.###.###.', '.##...##.'];
        const STAR_PATH = STAR_ROWS.flatMap((row, y) => [...row].map((c, x) => c === '#' ? `M${x} ${y}h1v1h-1z` : '')).join('');
        const STAR_SVG = `<svg viewBox="0 0 9 9" shape-rendering="crispEdges" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;
        const starsHTML = rating => [0, 1, 2, 3, 4].map(i =>
            `<span class="star" style="--fill:${Math.max(0, Math.min(1, rating - i)) * 100}%">${STAR_SVG}<span class="star-fill">${STAR_SVG}</span></span>`
        ).join('') + `<span class="bd-score">${rating}/5</span>`;

        function fillDialog(b) {
            const spine = spineOf(b);
            bd.file.textContent = `${b.id}.txt`;
            bd.cover.style.cssText = `--spine:${spine}; --ink:${inkOf(spine)}`;
            bd.cover.innerHTML = coverArt(b);
            bd.cover.querySelector('img').alt = `Cover of ${b.title}`;
            bd.title.textContent = b.title;
            bd.author.textContent = b.author;
            bd.rating.innerHTML = b.status === 'reading'
                ? '<span class="bd-reading">NOW READING<span class="type-cursor"></span></span>'
                : starsHTML(b.rating);
            bd.rating.setAttribute('aria-label', b.status === 'reading' ? 'Currently reading' : `Rated ${b.rating} out of 5`);
            bd.blurb.textContent = b.blurb;
            bd.quote.hidden = !(b.quote || b.note);
            bd.quoteLabel.textContent = b.quote ? 'FAV QUOTE' : 'NOTE';
            bd.quoteText.textContent = b.quote || b.note || '';
        }

        let openBtn = null;
        let closing = false;

        // the cover flies between its spot on the shelf and the dialog
        function flight(from, reverse) {
            const to = bd.cover.getBoundingClientRect();
            const faceOut = openBtn.classList.contains('is-reading');
            const x = (faceOut ? from.left : from.right) - to.left;
            const y = from.top + from.height / 2 - (to.top + to.height / 2);
            const frames = [
                { transform: `perspective(900px) translate(${x}px, ${y}px) scale(${from.height / to.height}) rotateY(${faceOut ? 0 : 70}deg)`, opacity: faceOut ? 1 : 0.3 },
                { transform: 'perspective(900px) translate(0px, 0px) scale(1) rotateY(0deg)', opacity: 1 }
            ];
            if (reverse) frames.reverse();
            return bd.cover.animate(frames, { duration: reverse ? 420 : 560, easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)' });
        }

        function fadeChrome(reverse) {
            const win = dialog.querySelector('.bd-window');
            const opts = { duration: 260, easing: 'ease-out', delay: reverse ? 0 : 160, fill: 'backwards' };
            const chrome = [{ backgroundColor: 'transparent', borderColor: 'transparent', boxShadow: 'none' }, {}];
            const fade = [{ opacity: 0 }, { opacity: 1 }];
            if (reverse) { chrome.reverse(); fade.reverse(); opts.fill = 'forwards'; }
            return [win.animate(chrome, opts), ...[...dialog.querySelectorAll('.bd-fade')].map(el => el.animate(fade, opts))];
        }

        // where the book sits on the shelf when it isn't lifted
        function restingRect(btn) {
            const r = btn.getBoundingClientRect();
            const book = btn.querySelector('.book-3d').getBoundingClientRect();
            const plank = parseFloat(getComputedStyle(btn).paddingBottom);
            return { left: r.left, right: r.left + book.width, top: r.bottom - plank - book.height, height: book.height };
        }

        function openBook(btn) {
            const book = BOOKS.find(b => b.id === btn.dataset.id);
            if (!book || dialog.open) return;
            const from = btn.querySelector('.book-3d').getBoundingClientRect();
            fillDialog(book);
            openBtn = btn;
            dialog.showModal();
            btn.classList.add('is-out');
            if (!REDUCED_MOTION) {
                flight(from, false);
                fadeChrome(false);
            }
        }

        async function closeBook() {
            if (!dialog.open || closing) return;
            closing = true;
            if (!REDUCED_MOTION && openBtn) {
                const from = restingRect(openBtn);
                const onScreen = from.top < window.innerHeight && from.top + from.height > 0;
                const anims = [...fadeChrome(true), ...(onScreen ? [flight(from, true)] : [])];
                await Promise.all(anims.map(a => a.finished.catch(() => {})));
            }
            dialog.close();
            dialog.getAnimations({ subtree: true }).forEach(a => a.cancel());
            closing = false;
        }

        shelf.addEventListener('click', e => {
            const btn = e.target.closest('.book');
            if (btn) openBook(btn);
        });
        $('bd-close').addEventListener('click', closeBook);
        dialog.addEventListener('cancel', e => { e.preventDefault(); closeBook(); });
        // clicks on the backdrop land on the <dialog> itself
        dialog.addEventListener('click', e => { if (e.target === dialog) closeBook(); });
        dialog.addEventListener('close', () => {
            if (openBtn) openBtn.classList.remove('is-out');
            openBtn = null;
        });

        // --- search: keywords now, meaning once the model is ready ---
        const STOPWORDS = new Set(['a', 'an', 'the', 'of', 'and', 'or', 'about', 'book', 'books', 'something', 'that', 'with', 'in', 'on', 'for', 'to', 'by', 'like', 'me', 'my', 'i', 'is', 'it', 'some', 'any', 'story', 'stories', 'novel']);
        const fold = s => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const tokenize = s => fold(s).split(/[^a-z0-9]+/).filter(w => w && !STOPWORDS.has(w));
        const bookText = b => `${b.title} by ${b.author}. ${b.blurb} Themes: ${b.tags.join(', ')}.`;
        const haystacks = BOOKS.map(b => tokenize(`${b.title} ${b.author} ${b.tags.join(' ')}`));

        // share of query words found in a book's title/author/tags ("dystopian" still finds "dystopia")
        const coverage = (i, words) => words.length
            ? words.filter(w => haystacks[i].some(h => h.startsWith(w) || (h.length >= 5 && w.startsWith(h)))).length / words.length
            : 0;

        function rankBooks(query, docVecs, queryVec) {
            const q = fold(query);
            const words = tokenize(q);
            // a title/author lookup ("kafka", "harry potter") shows exactly those books
            const byName = BOOKS.filter(b => fold(`${b.title} ${b.author}`).includes(q));
            if (byName.length) return byName.map(b => b.id);
            if (!queryVec) {
                const hits = BOOKS.map((b, i) => [b.id, coverage(i, words)]).filter(([, c]) => c > 0);
                const best = Math.max(0, ...hits.map(([, c]) => c));
                return hits.filter(([, c]) => c === best).map(([id]) => id);
            }
            const scored = BOOKS.map((b, i) => {
                const cosine = docVecs[i].reduce((s, v, k) => s + v * queryVec[k], 0);
                return [b.id, cosine + 0.25 * coverage(i, words)];
            }).sort((a, b) => b[1] - a[1]);
            const cut = Math.max(0.22, scored[0][1] * 0.68);
            return scored.filter(([, s]) => s >= cut).slice(0, 9).map(([id]) => id);
        }

        let sem = null;          // { embed, docVecs } once the model is ready
        let semState = 'idle';   // idle | loading | ready | failed
        let modelPct = 0;
        let matchCount = 0;

        function renderStatus() {
            const q = search.value.trim();
            if (q.length < 2) { statusline.textContent = idleStatus; return; }
            const found = matchCount ? `${matchCount} MATCH${matchCount === 1 ? '' : 'ES'}` : 'NO MATCHES';
            const loading = semState === 'loading' ? ` — LOADING SEMANTIC SEARCH ${modelPct}%` : '';
            statusline.textContent = `> ${found}${loading}`;
        }

        function warmSemantic() {
            if (semState !== 'idle') return;
            semState = 'loading';
            import(MODEL_URL)
                .then(async ({ pipeline, env }) => {
                    env.allowLocalModels = false;
                    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                        dtype: 'q8',
                        progress_callback: p => {
                            if (p.status === 'progress' && p.file.endsWith('.onnx')) {
                                modelPct = Math.round(p.progress);
                                renderStatus();
                            }
                        }
                    });
                    const embed = async texts => (await extractor(texts, { pooling: 'mean', normalize: true })).tolist();
                    sem = { embed, docVecs: await embed(BOOKS.map(bookText)) };
                    semState = 'ready';
                    runSearch();
                })
                .catch(err => {
                    semState = 'failed';
                    renderStatus();
                    console.warn('bookshelf.db: semantic search unavailable, keywords only.', err);
                });
        }

        let searchSeq = 0;
        async function runSearch() {
            const seq = ++searchSeq;
            const q = search.value.trim();
            let ids = null;
            if (q.length >= 2) {
                const queryVec = sem ? (await sem.embed([q]))[0] : null;
                if (seq !== searchSeq) return;
                ids = new Set(rankBooks(q, sem && sem.docVecs, queryVec));
            }
            shelf.classList.toggle('is-searching', !!ids);
            shelf.querySelectorAll('.book').forEach(el => el.classList.toggle('is-match', !!ids && ids.has(el.dataset.id)));
            matchCount = ids ? ids.size : 0;
            renderStatus();
            // phones: bring the first match into the sideways shelf's view
            const first = shelf.querySelector('.book.is-match');
            if (first && shelf.scrollWidth > shelf.clientWidth) {
                shelf.scrollTo({ left: first.offsetLeft - 24, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
            }
        }

        let debounce;
        search.addEventListener('focus', warmSemantic);
        search.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(runSearch, 180);
        });
        search.addEventListener('keydown', e => {
            if (e.key !== 'Enter') return;
            // stop the same keypress from also "clicking" the dialog's close button
            e.preventDefault();
            const first = shelf.querySelector('.book.is-match');
            if (first) openBook(first);
        });
    })();

    /* ============================================================
       PROGRAM: contact.exe (Formspree AJAX)
       ============================================================ */
    (function initContact() {
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
                        errMsg.textContent = '> Something went wrong — try emailing directly.';
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
        '.about-card, .char-select, .skill-category, .comic-panel, .deck-grid, .memory-card, .bookshelf, .boss-window'
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
