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

    /* ============================================================
       DATA — workstation.exe (projects as apps on a KusumOS desktop)
       featured → pinned to the desktop; the rest live in archive/
       mono + color → the app icon; stats → headline numbers
       images/videos live in PicsPortfolio/projects/
       ============================================================ */
    const PROJECTS = [
        {
            id: 'gtp', title: 'GTP.app', mono: 'GTP', color: '#0f9d7a', featured: true,
            stats: [['7+', 'GITHUB APIS'], ['KAFKA', 'JOB QUEUE'], ['GCP', 'CLOUD RUN']],
            tagline: 'Repos in. Resume bullets out.',
            images: ['gtp1.png','gtp2.png','gtp3.png','gtp4.png','gtp5.png','gtp6.png'],
            desc: 'Analyzes GitHub repos and generates recruiter-ready resume bullets by extracting structured evidence from 7+ API endpoints concurrently — pom.xml, commit history, language bytes — before calling GPT-4o-mini. Deployed on GCP Cloud Run with Kafka, Redis/Postgres dual-write job state, and Spring OAuth2 session management.',
            tech: ['Java 21','Spring Boot','React 19','TypeScript','PostgreSQL','Redis','Kafka','Docker','GCP','Terraform','OpenAI'],
            links: [
                { label: 'Launch_App', url: 'https://github-to-portfolio-neon.vercel.app', primary: true },
                { label: 'Run_Demo', video: 'gtp.mp4', primary: false }
            ]
        },
        {
            id: 'dataflow', title: 'DataflowEngine.cpp', mono: 'DF', color: '#2f6fd1', featured: true,
            stats: [['~40×', 'VS RECOMPUTE'], ['1M', 'ROWS'], ['70', 'GOOGLE TESTS']],
            tagline: '40x faster than recompute.',
            images: ['df_wiki.gif','df_vwap.gif'],
            desc: 'Incremental query engine that propagates delta updates through a typed C++ operator DAG — ~40× faster than batch recompute at 0.1% change rates on 1M rows. C++ core with retraction semantics and zero-alloc hot paths; exposed via Python DSL (pybind11) and Spring Boot REST/SSE; 70 Google Tests + full benchmark suite.',
            tech: ['C++17','CMake','Abseil','Python','pybind11','Spring Boot','GTest','Google Benchmark'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/dataflow-engine', primary: true }
            ]
        },
        {
            id: 'clashexchange', title: 'ClashExchange.cpp', mono: 'CX', color: '#8a4fd6', featured: true,
            stats: [['411K', 'ORDERS / SEC'], ['3.7µs', 'MATCH LATENCY'], ['0.00%', '5XX RATE']],
            tagline: '411k orders/sec. 3.7us match.',
            images: ['crt1.png','crt2.png','crt3.png'],
            desc: 'Real-time card trading platform modeled on a financial exchange. C++17 matching engine with price-time priority order book (shared_mutex reader-writer locking), atomic PostgreSQL settlement, and SHA-256 Merkle-hashed trade records. 411k orders/sec single-thread throughput, 3.7µs match latency, 0.00% 5xx rate under 74k HTTP requests. React/TypeScript frontend with live candlestick charts, depth chart, and real-time order book via WebSocket.',
            tech: ['C++17','Boost.Beast','PostgreSQL','Redis','React 19','TypeScript','Docker','WebSocket','JWT','Google Benchmark'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/Clash-Royale-Trading', primary: true }
            ]
        },
        {
            id: 'os-sim', title: 'os-sim.cpp', mono: 'OS', color: '#2e8b3e', featured: true,
            stats: [['4', 'PAGE POLICIES'], ['16', 'TLB ENTRIES'], ['50+', 'TESTS']],
            tagline: 'Virtual memory, visualized.',
            images: ['read.png','write.png','thrashing.png','cow.png'],
            desc: "Full-screen FTXUI TUI simulating OS virtual memory in C++17. Four replacement policies (FIFO, LRU with O(1) list+hash map, CLOCK second-chance, OPT/Belady's), copy-on-write fork with reference counting, and a 16-entry per-process TLB with LRU eviction and TLB shootdown. 50+ tests across 9 binaries; 8 experiments benchmark policy faults, TLB hit rates, and CoW efficiency.",
            tech: ['C++17','CMake','FTXUI','GTest','TLB','CoW','CLOCK'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/os-sim', primary: true },
                { label: 'Run_Demo', video: 'os-sim.mp4', primary: false }
            ]
        },
        {
            id: 'game-engine', title: 'GameEngine.exe', mono: 'GE', color: '#c0392b',
            tagline: 'A* pathfinding, zero leaks.',
            images: ['CR1.jpeg','CR2.jpeg'],
            desc: 'OOP game engine across 43 source files implementing Factory pattern and polymorphic inheritance with 10 entity types. Features autonomous AI with A* pathfinding, probabilistic decision-making, multi-layered combat calculations, and a comprehensive Google Test suite with zero memory leaks via RAII.',
            tech: ['C++','CMake','OOP','GTest','CI/CD','Smart Pointers'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/Clash-Royale-Clone', primary: true },
                { label: 'Run_Demo', video: 'Sample_Gameplay.mp4', primary: false }
            ]
        },
        {
            id: 'devjournal', title: 'DevJournal.app', mono: 'DJ', color: '#d17a22',
            tagline: 'Realtime docs under 50ms.',
            images: ['DevJournal1.png','DevJournal2.png'],
            desc: 'Full-stack collaborative platform with real-time WebSocket messaging <50ms, Markdown editor, 3 microservices on AWS, 90% test coverage via CI/CD.',
            tech: ['Node.js','TypeScript','Docker','AWS','Socket.IO'],
            links: [
                { label: 'Launch_App', url: 'https://dev-journal-topaz.vercel.app/login', primary: true },
                { label: 'Run_Demo', video: 'DevJournal3.mp4', primary: false }
            ]
        },
        {
            id: 'lit', title: 'Lit.jar', mono: 'LIT', color: '#7a5a3a',
            tagline: 'Git, rebuilt from scratch.',
            images: ['lit1.png','lit2.png','lit3.png'],
            desc: 'Distributed VCS in Java implementing Git core — SHA-1 content hashing, three-way merge, branch switching, conflict resolution, 9+ CLI commands.',
            tech: ['Java','Gradle','JUnit','File I/O'],
            links: [
                { label: 'View_Source', url: 'https://github.com/imraghavojha/lit', primary: true }
            ]
        },
        {
            id: 'no-chess', title: 'No_Chess.py', mono: 'NC', color: '#5b6b2f',
            tagline: 'Free reviews. Sorry, Chess.com.',
            images: ['NC1.png','NC2.png','ReviewNC.png'],
            desc: 'React chess app with free unlimited PGN game reviews and live sessions powered by Stockfish engine via FastAPI WebSocket.',
            tech: ['React','FastAPI','Stockfish','Docker'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/No_Chess.com', primary: true },
                { label: 'Run_Demo', video: 'NC.mp4', primary: false }
            ]
        },
        {
            id: 'sudoku', title: 'Sudoku.app', mono: 'SU', color: '#16806b',
            tagline: 'Hints, undo, ncurses core.',
            images: ['sudoku2.png','sudoku3.png','sudoku.png'],
            desc: 'Three-difficulty Sudoku with hints, undo, and real-time error highlighting. C++ backend solver with ncurses; TypeScript/Tailwind frontend.',
            tech: ['C++','TypeScript','Vite','Tailwind'],
            links: [
                { label: 'C++_Source', url: 'https://github.com/kusum-bhattarai/sudoku', primary: true },
                { label: 'TS_Source', url: 'https://github.com/kusum-bhattarai/sudoku-frontend', primary: false }
            ]
        },
        {
            id: 'maze', title: 'MazeCrawler.ts', mono: 'MZ', color: '#6a3fb0',
            tagline: 'DFS vs BFS, playable.',
            images: ['maze2.png','maze1.png','maze3.png'],
            desc: 'Pixel art maze solver/game — DFS and BFS navigate a procedurally generated maze step-by-step, with a playable character. Zero dependencies.',
            tech: ['TypeScript','Canvas API','Vite'],
            links: [
                { label: 'Launch_App', url: 'https://maze-ashy.vercel.app', primary: true },
                { label: 'Run_Demo', video: 'Maze.mov', primary: false }
            ]
        },
        {
            id: 'watched', title: 'Watched.app', mono: 'WA', color: '#b8325e',
            tagline: 'Your media, your library.',
            images: ['Watched1.png','Watched2.png'],
            desc: 'Personal media library — track watched movies and series with TMDB posters and ratings, plus custom reviews and categories.',
            tech: ['React','JavaScript','TMDB API','CSS3'],
            links: [
                { label: 'Launch_App', url: 'https://watched-theta.vercel.app/', primary: true },
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/Watched', primary: false }
            ]
        },
        {
            id: 'retailrethink', title: 'RetailRethink.app', mono: 'RR', color: '#3c6e91',
            tagline: 'Budget, rethought.',
            images: ['RR1.jpeg','RR2.jpeg','RR3.png'],
            desc: 'Expense tracker with custom categories, an analysis dashboard, and historical spending visualization to rethink your budget.',
            tech: ['React','TypeScript','Vite','Tailwind'],
            links: [
                { label: 'View_Source', url: 'https://github.com/kusum-bhattarai/retailrethink', primary: true }
            ]
        }
    ];

    /* ============================================================
       DATA — the keyboard under the monitor (tech stack)
       [label, width in key units, extra names to match in PROJECTS.tech]
       Row colors follow the category: light = languages,
       mid = frameworks, dark = data/infra/tools.
       ============================================================ */
    const KEYBOARD = [
        { cat: 'LANGUAGE', cls: 'cat-lang', keys: [['ESC', 1], ['C++'], ['C'], ['Java'], ['Python', 1.25, ['pybind11']], ['JavaScript', 1.5], ['TypeScript', 1.5], ['SQL', 1, ['postgresql']], ['Bash']] },
        { cat: 'FRAMEWORK', cls: 'cat-fw', keys: [['React'], ['Node.js'], ['Express'], ['FastAPI'], ['Spring Boot', 1.5], ['LangChain', 1.5], ['NumPy'], ['Vite']] },
        { cat: 'DATA / TESTING', cls: 'cat-data', keys: [['Kafka'], ['Redis'], ['Elasticsearch', 1.75], ['Jest'], ['Cypress'], ['JUnit'], ['GTest', 1, ['google benchmark']]] },
        { cat: 'INFRA', cls: 'cat-infra', keys: [['Docker'], ['Kubernetes', 1.5], ['AWS'], ['GCP'], ['Terraform', 1.25], ['Nginx'], ['Jenkins'], ['GH Actions', 1.5, ['ci/cd']]] },
        { cat: 'TOOLING', cls: 'cat-tool', keys: [['Git'], ['Linux'], ['Postman'], ['SPACE', 3.5], ['Jira'], ['Bitbucket', 1.25], ['IntelliJ'], ['VS Code', 1.25], ['Neovim']] }
    ];

    /* ============================================================
       DATA — trophy_case.exe
       kind: gold | bronze (trophies) or certificate
       shelf: 0 = top, 1 = bottom. Photos live in PicsPortfolio/awards/.
       ============================================================ */
    const AWARDS = [
        { id: 'webai', kind: 'gold', shelf: 0, plate: 'WEBAI',
          when: '2026 · HACKATHON', event: 'WebAI YOLO26 MLX Build Challenge', place: 'WINNER', prize: '$1,000',
          note: 'Built on YOLO26 with Apple MLX.', host: 'Hosted by WebAI',
          photo: 'webai-winners.jpg', caption: 'winners + founders meetup', alt: 'WebAI build challenge winners and founders at the meetup' },
        { id: 'data-portability', kind: 'gold', shelf: 0, plate: 'DATA PORT.',
          when: '2026 · HACKATHON', event: 'Data Portability Hackathon', place: 'WINNER · AGENTIC COMPANION TRACK', prize: '$1,000',
          host: 'Hosted by AI Collective' },
        { id: 'h0', kind: 'bronze', shelf: 0, plate: 'H0 · 3RD',
          when: '2026 · HACKATHON', event: 'AWS/v0 H0 Hackathon', place: '3RD PLACE · B2C TRACK', prize: '$6K in prizes',
          note: 'Giftmaxxing: Tinder for gift taste. Swipe to teach it yours, share a link to learn anyone’s. Out of 9,700 participants.',
          photo: 'giftmaxxing.jpg', caption: 'giftmaxxing on devpost', alt: 'Giftmaxxing project card on Devpost with a winner ribbon' },
        { id: 'datathon', kind: 'gold', shelf: 1, plate: 'DATATHON',
          when: '2025 · COMPETITION', event: 'TXST Datathon 2025', place: '1ST PLACE',
          note: 'Texas State University’s annual data science competition.' },
        { id: 'achievement', kind: 'certificate', shelf: 1, plate: '$32K',
          when: '2023 · SCHOLARSHIP', event: 'Achievement Scholarship', place: 'MERIT SCHOLARSHIP', prize: '$32,000',
          note: 'Merit-based scholarship awarded for academic excellence. GPA 3.88 / 4.0.', host: 'Texas State University' },
        { id: 'henry', kind: 'certificate', shelf: 1, plate: 'R. HENRY',
          when: 'TXST · SCHOLARSHIP', event: 'Robert Henry Family Scholarship', place: 'SCHOLARSHIP',
          note: 'Awarded for excellent academic achievement.', host: 'Texas State University' }
    ];

    /* ============================================================
       DATA — quest_console.exe (side quests as game cartridges)
       Clips + posters live in PicsPortfolio/quests/. Clash Royale
       stats come from data/clash.js, refreshed by a daily Action.
       label = cartridge label art (any CSS background)
       ============================================================ */
    const QUESTS = [
        { id: 'clash', name: 'Clash Royale', sprite: 'witch-s.png',
          label: 'linear-gradient(160deg, #5b3aa8, #22163f)' },
        { id: 'f1', name: 'Formula 1', sprite: 'ferrari.png',
          label: 'linear-gradient(160deg, #d0141f, #5a070c)',
          race: {
              title: '2022 Bahrain Grand Prix', when: 'SAKHIR · 20 MAR 2022', video: 'wIYPuzWCCSw', thumb: 'bahrain-2022.jpg',
              podium: [['LECLERC', 'ferrari'], ['SAINZ', 'ferrari'], ['HAMILTON', 'mercedes']]
          } },
        { id: 'starwars', name: 'Star Wars', sprite: 'vader-s.png', sith: true,
          label: 'linear-gradient(160deg, #2a2a33, #060608)',
          titles: [
              { title: 'Revenge of the Sith', meta: 'FILM · 2005', clip: 'rots', poster: 'poster-rots.jpg' }
          ] },
        { id: 'marvel', name: 'Marvel', sprite: 'iron-cart.png',
          label: 'linear-gradient(160deg, #c41f24, #4d0a0c)',
          titles: [
              { title: 'Iron Man', meta: 'FILM · 2008', clip: 'iron-man', poster: 'poster-iron-man.jpg' },
              { title: 'Avengers: Infinity War', meta: 'FILM · 2018', clip: 'infinity-war', poster: 'poster-infinity-war.jpg' },
              { title: 'Daredevil', meta: 'SERIES · 2015–2018', clip: 'daredevil', poster: 'poster-daredevil.jpg' }
          ] },
        { id: 'dc', name: 'DC', sprite: 'bat-s.png',
          label: 'linear-gradient(160deg, #1f4f9a, #0a1630)',
          titles: [
              { title: 'The Dark Knight', meta: 'FILM · 2008', clip: 'dark-knight', poster: 'poster-dark-knight.jpg' },
              { title: "Zack Snyder's Justice League", meta: 'FILM · 2021', clip: 'zsjl', poster: 'poster-zsjl.jpg' },
              { title: 'The Flash', meta: 'SERIES · 2014–2023', clip: 'the-flash', poster: 'poster-the-flash.jpg' }
          ] },
        { id: 'barca', name: 'FC Barcelona', cart: 'BARÇA', art: '6-1',
          label: 'repeating-linear-gradient(90deg, #a50044 0 11px, #004d98 11px 22px)',
          match: {
              stage: 'UCL · ROUND OF 16 · 2ND LEG', venue: 'CAMP NOU · 8 MAR 2017 · 96,290', clip: 'remontada',
              firstLeg: [0, 4],
              goals: [["3'", 'SUÁREZ', 'home'], ["40'", 'KURZAWA (OG)', 'home'], ["50'", 'MESSI (PEN)', 'home'], ["62'", 'CAVANI', 'away'],
                      ["88'", 'NEYMAR', 'home'], ["90+1'", 'NEYMAR (PEN)', 'home'], ["90+5'", 'SERGI ROBERTO', 'home']]
          } }
    ];

    /* ============================================================
       DATA — chess_match.pgn (maps to experience articles)
       ============================================================ */
    const CHESS_MOVES = [
        { san: '1. e4 e5',    note: 'the opening',        moves: [['e2', 'e4'], ['e7', 'e5']] },
        { san: '2. Nf3 Nc6',  note: 'developing pieces',  moves: [['g1', 'f3'], ['b8', 'c6']] },
        { san: '3. Bc4 Bc5',  note: 'the Italian Game',   moves: [['f1', 'c4'], ['f8', 'c5']] },
        { san: '4. O-O Nf6',  note: 'castled — king safe', moves: [['e1', 'g1'], ['h1', 'f1'], ['g8', 'f6']] },
        { san: '5. d3 d6',    note: 'quiet build-up',     moves: [['d2', 'd3'], ['d7', 'd6']] }
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
       PROGRAM: workstation.exe
       Projects are apps on a KusumOS desktop inside a CRT monitor;
       the tech stack is the keyboard in front of it. Pressing a key
       lights up every app built with that tech.
       ============================================================ */
    (function initWorkstation() {
        const screen = document.getElementById('desk-screen');
        const keysEl = document.getElementById('kb-keys');
        if (!screen || !keysEl) return;

        const iconsEl = document.getElementById('desk-icons');
        const winLayer = document.getElementById('desk-windows');
        const tasks = document.getElementById('desk-tasks');
        const clock = document.getElementById('desk-clock');
        const oled = document.getElementById('kb-oled');
        const statusline = document.getElementById('desk-statusline');
        const PDIR = 'PicsPortfolio/projects/';
        const IDLE_STATUS = `> ${PROJECTS.length} APPS INSTALLED — CLICK ONE TO OPEN, OR PRESS A KEY TO SEE WHERE IT'S USED`;
        const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const norm = t => t.toLowerCase().replace(/\s*\d+$/, '').trim();   // "React 19" → "react", "C++17" → "c++"
        const byId = id => PROJECTS.find(p => p.id === id);

        const iconHTML = p => `<span class="app-icon" style="--app:${p.color}"><span class="app-mono">${p.mono}</span><span class="app-ext">.${p.title.split('.').pop()}</span></span>`;
        // <wbr> lets long names break before the extension, not mid-word
        const appButton = p => `<button type="button" class="desk-icon" data-id="${p.id}">${iconHTML(p)}<span class="desk-label">${p.title.replace('.', '<wbr>.')}</span></button>`;

        // featured first, then the rest — every app sits on the desktop
        iconsEl.innerHTML = [...PROJECTS].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).map(appButton).join('');

        // Texas time on the taskbar clock
        const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' });
        const tick = () => { clock.textContent = `${timeFmt.format(new Date())} CT`; };
        tick();
        setInterval(tick, 30000);

        // --- keyboard ---
        const keyInfo = new Map();   // label → { cat, apps: [ids] }
        const keyForTech = new Map();   // normalized tech name → key label
        keysEl.innerHTML = KEYBOARD.map(row => `
            <div class="kb-row">
                ${row.keys.map(([label, units = 1, extra = []]) => {
                    const names = [label.toLowerCase(), ...extra];
                    const apps = PROJECTS.filter(p => p.tech.some(t => names.includes(norm(t)))).map(p => p.id);
                    const clear = label === 'ESC' || label === 'SPACE';
                    if (!clear) {
                        keyInfo.set(label, { cat: row.cat, apps });
                        names.forEach(n => keyForTech.set(n, label));
                    }
                    return `<button type="button" class="kb-key ${clear ? 'is-clear' : row.cls}${label === 'SPACE' ? ' is-space' : ''}" style="--u:${units}" data-key="${esc(label)}"${clear ? ' aria-label="Clear selection"' : ''}><span class="kb-cap">${label === 'SPACE' ? '' : esc(label)}</span></button>`;
                }).join('')}
            </div>`).join('');

        let activeKey = null;
        const OLED_IDLE = '<span class="oled-key">PRESS A KEY</span><span class="oled-apps">see which apps use it</span>';
        oled.innerHTML = OLED_IDLE;

        // pressing the active key again (or ESC / space) clears it
        function pressKey(label) {
            activeKey = label && label !== activeKey ? label : null;
            applyKey();
        }

        function applyKey() {
            const info = activeKey && keyInfo.get(activeKey);
            const lit = new Set(info ? info.apps : []);
            keysEl.querySelectorAll('.kb-key').forEach(k => k.classList.toggle('is-on', k.dataset.key === activeKey));
            screen.querySelectorAll('.desk-icon[data-id]').forEach(el => {
                el.classList.toggle('is-lit', lit.has(el.dataset.id));
                el.classList.toggle('is-dim', !!info && !lit.has(el.dataset.id));
            });
            screen.querySelectorAll('.dw-cap').forEach(c => c.classList.toggle('is-lit', !!activeKey && c.dataset.key === activeKey));
            if (!info) {
                oled.innerHTML = OLED_IDLE;
                statusline.textContent = win ? statusline.textContent : IDLE_STATUS;
                return;
            }
            const names = info.apps.map(id => byId(id).title.split('.')[0]);
            oled.innerHTML = `<span class="oled-key">${esc(activeKey.toUpperCase())}</span><span class="oled-apps">${names.length ? `${names.length} APP${names.length > 1 ? 'S' : ''} · ${esc(names.join(' · '))}` : `${info.cat.toLowerCase()} · not on this desktop yet`}</span>`;
            statusline.textContent = `> ${esc(activeKey.toUpperCase())}: ${names.length} APP${names.length === 1 ? '' : 'S'} LIT`;
        }

        keysEl.addEventListener('click', e => {
            const key = e.target.closest('.kb-key');
            if (!key) return;
            if (!REDUCED_MOTION) {
                key.classList.add('is-down');
                setTimeout(() => key.classList.remove('is-down'), 120);
            }
            pressKey(key.classList.contains('is-clear') ? null : key.dataset.key);
        });

        // --- windows ---
        let win = null;
        let winAnchor = null;   // the desktop icon the window zooms out of / back into

        function zoom(el, fromRect, reverse) {
            if (REDUCED_MOTION || !fromRect) return Promise.resolve();
            const to = el.getBoundingClientRect();
            const frames = [
                { transform: `translate(${fromRect.left - to.left}px, ${fromRect.top - to.top}px) scale(${fromRect.width / to.width}, ${fromRect.height / to.height})`, opacity: 0.2 },
                { transform: 'translate(0px, 0px) scale(1, 1)', opacity: 1 }
            ];
            if (reverse) frames.reverse();
            return el.animate(frames, { duration: reverse ? 200 : 280, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: reverse ? 'forwards' : 'none' }).finished.catch(() => {});
        }

        function openWindow(title, body, fromRect, anchor, viaKeyboard) {
            if (win) win.remove();
            win = document.createElement('div');
            win.className = 'desk-window';
            win.setAttribute('role', 'dialog');
            win.setAttribute('aria-label', title);
            win.innerHTML = `
                <div class="dw-titlebar"><span class="dw-title">${esc(title)}</span><button type="button" class="dw-close" aria-label="Close ${esc(title)}">[x]</button></div>
                <div class="dw-body">${body}</div>`;
            winLayer.appendChild(win);
            winAnchor = anchor;
            tasks.innerHTML = `<span class="desk-task">${esc(title)}</span>`;
            zoom(win, fromRect, false);
            if (viaKeyboard) win.querySelector('.dw-close').focus({ preventScroll: true });
            return win;
        }

        async function closeWindow() {
            if (!win) return;
            const el = win;
            win = null;
            await zoom(el, winAnchor && winAnchor.getBoundingClientRect(), true);
            el.remove();
            tasks.innerHTML = '';
            statusline.textContent = IDLE_STATUS;
            if (winAnchor) winAnchor.focus({ preventScroll: true });
        }

        function openApp(p, fromRect, viaKeyboard) {
            const video = p.links.find(l => l.video);
            const links = p.links.filter(l => l.url).map(l => `<a class="dw-link${l.primary ? ' is-primary' : ''}" href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join('');
            const el = openWindow(p.title, `
                <div class="dw-app">
                    <div class="dw-media">
                        <div class="dw-shots">${p.images.map((src, i) => `<img src="${PDIR}${src}" alt="${esc(p.title)} screenshot ${i + 1}"${i ? ' hidden' : ''}>`).join('')}</div>
                        <div class="dw-media-bar">
                            ${p.images.length > 1 ? `<button type="button" class="dw-nav" data-step="-1" aria-label="Previous screenshot">&lt;</button><span class="dw-count">1/${p.images.length}</span><button type="button" class="dw-nav" data-step="1" aria-label="Next screenshot">&gt;</button>` : ''}
                            ${video ? `<button type="button" class="dw-demo" data-video="${video.video}">PLAY DEMO</button>` : ''}
                        </div>
                    </div>
                    <div class="dw-info">
                        <p class="dw-tagline">${esc(p.tagline)}</p>
                        ${p.stats ? `<div class="dw-stats">${p.stats.map(([v, l]) => `<span class="dw-stat"><b>${v}</b>${l}</span>`).join('')}</div>` : ''}
                        <div class="dw-links">${links}</div>
                        <p class="dw-desc">${esc(p.desc)}</p>
                        <div class="dw-tech">${p.tech.map(t => {
                            const key = keyForTech.get(norm(t));
                            return key ? `<button type="button" class="dw-cap" data-key="${esc(key)}">${esc(t)}</button>` : `<span class="dw-cap">${esc(t)}</span>`;
                        }).join('')}</div>
                    </div>
                </div>`, fromRect, iconsEl.querySelector(`[data-id="${p.id}"]`), viaKeyboard);
            statusline.textContent = `> RUNNING: ${p.title.toUpperCase()}`;
            applyKey();   // light the caps that match the active key

            const shots = [...el.querySelectorAll('.dw-shots img')];
            let shot = 0;
            el.addEventListener('click', e => {
                const nav = e.target.closest('.dw-nav');
                if (nav && shots.length) {
                    shots[shot].hidden = true;
                    shot = (shot + Number(nav.dataset.step) + shots.length) % shots.length;
                    shots[shot].hidden = false;
                    el.querySelector('.dw-count').textContent = `${shot + 1}/${shots.length}`;
                }
                const demo = e.target.closest('.dw-demo');
                if (demo) {
                    const src = PDIR + demo.dataset.video;
                    el.querySelector('.dw-shots').innerHTML = `<video controls autoplay playsinline src="${src}"></video>`;
                    el.querySelector('.dw-media-bar').remove();
                }
                const cap = e.target.closest('button.dw-cap');
                if (cap) pressKey(cap.dataset.key);
                if (e.target.closest('.dw-shots')) el.querySelector('.dw-app').classList.toggle('is-wide');
            });
        }

        screen.addEventListener('click', e => {
            if (e.target.closest('.dw-close')) { closeWindow(); return; }
            const icon = e.target.closest('.desk-icon');
            if (!icon) return;
            const rect = icon.querySelector('.app-icon').getBoundingClientRect();
            openApp(byId(icon.dataset.id), rect, e.detail === 0 /* Enter/Space on a focused icon */);
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && win) closeWindow();
        });

        statusline.textContent = IDLE_STATUS;
    })();

    /* ============================================================
       PROGRAM: trophy_case.exe
       Awards as objects in a lit glass cabinet. Picking one up
       spins it and the plaque beside the case fills in.
       ============================================================ */
    (function initTrophyCase() {
        const cabinet = document.getElementById('cabinet');
        const plaque = document.getElementById('plaque');
        if (!cabinet || !plaque) return;

        const shelves = cabinet.querySelectorAll('.cabinet-shelf');
        const statusline = document.getElementById('trophy-statusline');
        const CUP = '<img class="award-cup" src="PicsPortfolio/sprites/trophy-s.png" alt="">';
        const ART = {
            gold: CUP,
            bronze: CUP,
            certificate: '<span class="award-cert"><span class="cert-seal"></span></span>'
        };

        AWARDS.forEach(a => {
            shelves[a.shelf].insertAdjacentHTML('beforeend', `
                <button type="button" class="award award-${a.kind}" data-id="${a.id}" aria-label="${a.event}">
                    <span class="award-art">${ART[a.kind]}</span>
                    <span class="award-plate">${a.plate}</span>
                </button>`);
        });

        function show(id, spin) {
            const a = AWARDS.find(x => x.id === id);
            cabinet.querySelectorAll('.award').forEach(b => b.classList.toggle('is-active', b.dataset.id === id));
            if (spin && !REDUCED_MOTION) {
                cabinet.querySelector(`[data-id="${id}"] .award-art`).animate(
                    [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(360deg)' }],
                    { duration: 900, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' });
            }
            plaque.innerHTML = `
                <span class="plaque-kicker">${a.when}</span>
                <h3 class="plaque-title">${a.event}</h3>
                <span class="plaque-place">${a.place}</span>
                ${a.prize ? `<span class="plaque-prize">${a.prize}</span>` : ''}
                ${a.note ? `<p class="plaque-note">${a.note}</p>` : ''}
                ${a.host ? `<span class="plaque-host">${a.host}</span>` : ''}
                ${a.photo ? `<figure class="plaque-photo"><img src="PicsPortfolio/awards/${a.photo}" alt="${a.alt}" loading="lazy"><figcaption>${a.caption}</figcaption></figure>` : ''}`;
            if (spin && !REDUCED_MOTION) plaque.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' });
            statusline.textContent = `> INSPECTING: ${a.event.toUpperCase()}`;
        }

        cabinet.addEventListener('click', e => {
            const award = e.target.closest('.award');
            if (award) show(award.dataset.id, true);
        });
        show(AWARDS[0].id, false);
        statusline.textContent = `> ${AWARDS.length} AWARDS ON THE SHELVES — CLICK ONE TO INSPECT`;
    })();

    /* ============================================================
       PROGRAM: quest_console.exe
       A cartridge flies from the rack into the console slot (its
       top stays sticking out, like a real cart) and the CRT boots
       into that quest. Clips only load while their cart is in.
       ============================================================ */
    (function initQuestConsole() {
        const rack = document.getElementById('cart-rack');
        const seat = document.getElementById('console-seat');
        const program = document.getElementById('screen-program');
        if (!rack || !seat || !program) return;

        const idle = document.getElementById('screen-idle');
        const led = document.getElementById('console-led');
        const ejectBtn = document.getElementById('console-eject');
        const statusline = document.getElementById('quest-statusline');
        const QDIR = 'PicsPortfolio/quests/';
        const IDLE_STATUS = '> INSERT A CARTRIDGE';
        const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const fmt = n => n.toLocaleString('en-US');
        const wait = anim => anim.finished.catch(() => {});

        const cartBody = q => `
            <span class="cart-body" style="--label:${q.label}">
                <span class="cart-label">
                    <span class="cart-title">${q.cart || q.name.toUpperCase()}</span>
                    ${q.sprite ? `<img src="PicsPortfolio/sprites/${q.sprite}" alt=""${q.sith ? ' class="cart-sith"' : ''}>` : `<span class="cart-art-text">${q.art}</span>`}
                </span>
            </span>`;

        QUESTS.forEach(q => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'cart';
            btn.dataset.id = q.id;
            btn.setAttribute('aria-label', `Insert the ${q.name} cartridge`);
            btn.innerHTML = cartBody(q);
            rack.appendChild(btn);
        });

        // --- cartridge flight: rack <-> slot ---
        function flyCart(q, rackBtn, direction) {
            const from = rackBtn.getBoundingClientRect();
            const to = seat.getBoundingClientRect();
            const sunk = from.height - to.height;   // the part that disappears into the slot
            const ghost = document.createElement('div');
            ghost.className = 'cart-ghost';
            ghost.style.cssText = `left:${from.left}px; top:${from.top}px; width:${from.width}px; height:${from.height}px;`;
            ghost.innerHTML = cartBody(q);
            document.body.appendChild(ghost);
            const dx = to.left - from.left;
            const dy = to.top - sunk - from.top;
            const frames = [
                { transform: 'translate(0px, 0px)', clipPath: 'inset(0px 0px 0px 0px)', offset: 0 },
                { transform: `translate(${dx}px, ${dy - 26}px)`, clipPath: 'inset(0px 0px 0px 0px)', offset: 0.55 },
                { transform: `translate(${dx}px, ${dy}px)`, clipPath: 'inset(0px 0px 0px 0px)', offset: 0.7 },
                { transform: `translate(${dx}px, ${dy + sunk}px)`, clipPath: `inset(0px 0px ${sunk}px 0px)`, offset: 1 }
            ];
            if (direction === 'out') frames.reverse().forEach(f => { f.offset = 1 - f.offset; });
            const anim = ghost.animate(frames, { duration: direction === 'in' ? 720 : 520, easing: 'cubic-bezier(0.3, 0.7, 0.3, 1)' });
            return wait(anim).then(() => ghost.remove());
        }

        const CRT_ON = [
            { transform: 'scale(1, 0.004)', filter: 'brightness(5)', offset: 0 },
            { transform: 'scale(1, 0.004)', filter: 'brightness(5)', offset: 0.3 },
            { transform: 'scale(1, 1)', filter: 'brightness(1.8)', offset: 0.7 },
            { transform: 'scale(1, 1)', filter: 'brightness(1)', offset: 1 }
        ];
        const CRT_OFF = [
            { transform: 'scale(1, 1)', filter: 'brightness(1)', offset: 0 },
            { transform: 'scale(1, 0.004)', filter: 'brightness(4)', offset: 0.65 },
            { transform: 'scale(0, 0.004)', filter: 'brightness(6)', offset: 1 }
        ];

        let current = null;
        let busy = false;
        let cleanups = [];

        async function insert(id) {
            if (busy || (current && current.id === id)) return;
            busy = true;
            if (current) await eject(true);
            const q = QUESTS.find(x => x.id === id);
            const btn = rack.querySelector(`[data-id="${id}"]`);
            btn.classList.add('is-out');
            if (!REDUCED_MOTION) await flyCart(q, btn, 'in');
            seat.innerHTML = cartBody(q);
            seat.disabled = false;
            ejectBtn.disabled = false;
            led.classList.add('is-on');
            current = q;
            idle.hidden = true;
            program.hidden = false;
            if (q.id === 'clash') renderClash();
            else if (q.race) renderF1(q.race);
            else if (q.match) renderBarca(q.match);
            else renderTitles(q.titles);
            if (!REDUCED_MOTION) program.animate(CRT_ON, { duration: 480, easing: 'ease-out' });
            statusline.textContent = `> RUNNING: ${q.name.toUpperCase()}`;
            busy = false;
        }

        async function eject(chained) {
            if (!current || (busy && !chained)) return;
            busy = true;
            const q = current;
            const btn = rack.querySelector(`[data-id="${q.id}"]`);
            cleanups.forEach(fn => fn());
            cleanups = [];
            if (!REDUCED_MOTION) await wait(program.animate(CRT_OFF, { duration: 260, easing: 'ease-in', fill: 'forwards' }));
            program.getAnimations().forEach(a => a.cancel());
            program.innerHTML = '';   // drops any video/iframe so it stops downloading
            program.hidden = true;
            idle.hidden = false;
            seat.innerHTML = '';
            seat.disabled = true;
            ejectBtn.disabled = true;
            led.classList.remove('is-on');
            current = null;
            if (!REDUCED_MOTION) await flyCart(q, btn, 'out');
            btn.classList.remove('is-out');
            statusline.textContent = IDLE_STATUS;
            if (!chained) busy = false;
        }

        rack.addEventListener('click', e => {
            const cart = e.target.closest('.cart');
            if (cart) insert(cart.dataset.id);
        });
        seat.addEventListener('click', () => eject());
        ejectBtn.addEventListener('click', () => eject());

        // dropping a dragged cart onto the console inserts it too (people try that first)
        const consoleEl = seat.closest('.console');
        let dragId = null;
        rack.addEventListener('dragstart', e => e.preventDefault());
        rack.addEventListener('pointerdown', e => {
            const cart = e.target.closest('.cart');
            dragId = cart && e.pointerType === 'mouse' ? cart.dataset.id : null;
        });
        document.addEventListener('pointermove', e => {
            if (dragId) consoleEl.classList.toggle('is-drop-target', !!e.target.closest('.console'));
        });
        document.addEventListener('pointerup', e => {
            if (dragId && e.target.closest('.console')) insert(dragId);
            dragId = null;
            consoleEl.classList.remove('is-drop-target');
        });

        // --- screens ---
        function setClip(box, clip, label) {
            box.innerHTML = `<video muted loop playsinline ${REDUCED_MOTION ? 'controls preload="none"' : 'autoplay preload="auto"'} poster="${QDIR}${clip}.jpg" aria-label="${esc(label)}"><source src="${QDIR}${clip}.mp4" type="video/mp4"></video>`;
        }

        function countUp(el, target) {
            if (REDUCED_MOTION) { el.textContent = fmt(target); return; }
            const start = performance.now();
            let raf = requestAnimationFrame(function step(now) {
                const t = Math.min((now - start) / 1100, 1);
                el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - t, 3))));
                if (t < 1) raf = requestAnimationFrame(step);
            });
            cleanups.push(() => cancelAnimationFrame(raf));
        }

        function renderClash() {
            const d = window.CLASH_DATA && window.CLASH_DATA.player;
            if (!d) { program.innerHTML = '<div class="qp-nosignal">NO SIGNAL</div>'; return; }
            const avg = (d.deck.reduce((s, c) => s + (c.elixir || 0), 0) / d.deck.length).toFixed(1);
            const synced = new Date(`${window.CLASH_DATA.synced}T00:00:00`)
                .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
            program.innerHTML = `
                <div class="qp qp-clash">
                    <div class="qp-side">
                        <span class="qp-kicker">${esc(d.name.toUpperCase())} · ${esc(d.tag)}</span>
                        <div class="qp-trophies"><img src="PicsPortfolio/sprites/trophy-s.png" alt=""><span class="qp-big" id="qp-trophies">0</span></div>
                        <span class="qp-kicker">TROPHIES</span>
                        <span class="qp-sub">BEST ${fmt(d.bestTrophies)}</span>
                        ${d.arena ? `<span class="qp-sub">${esc(d.arena.toUpperCase())}</span>` : ''}
                        <span class="qp-sub qp-muted">AVG ELIXIR ${avg} · SYNCED ${synced}</span>
                    </div>
                    <div class="qp-deck">
                        ${d.deck.map(c => `
                            <div class="qp-card rarity-${esc(c.rarity)}${c.evolved ? ' is-evo' : ''}">
                                <img src="data/cr/${esc(c.img)}" alt="${esc(c.name)}">
                                ${c.elixir != null ? `<span class="qp-elixir">${c.elixir}</span>` : ''}
                                <span class="qp-lvl">LV${c.level}</span>
                            </div>`).join('')}
                    </div>
                </div>
                <p class="qp-legal">This material is unofficial and is not endorsed by Supercell. See <a href="https://supercell.com/en/fan-content-policy/" target="_blank" rel="noopener">Supercell's Fan Content Policy</a>.</p>`;
            countUp(program.querySelector('#qp-trophies'), d.trophies);
        }

        function renderTitles(titles) {
            program.innerHTML = `
                <div class="qp qp-film">
                    <div class="qp-clip"></div>
                    <div class="qp-side">
                        <span class="qp-kicker"></span>
                        <h4 class="qp-title"></h4>
                        <div class="qp-posters">
                            ${titles.map((t, i) => `<button type="button" class="qp-poster" data-i="${i}" aria-label="Play ${esc(t.title)}"><img src="${QDIR}${t.poster}" alt=""></button>`).join('')}
                        </div>
                    </div>
                </div>`;
            const show = i => {
                const t = titles[i];
                program.querySelector('.qp-kicker').textContent = t.meta;
                program.querySelector('.qp-title').textContent = t.title;
                program.querySelectorAll('.qp-poster').forEach((p, j) => p.classList.toggle('is-active', j === i));
                setClip(program.querySelector('.qp-clip'), t.clip, t.title);
            };
            program.querySelector('.qp-posters').addEventListener('click', e => {
                const p = e.target.closest('.qp-poster');
                if (p) show(Number(p.dataset.i));
            });
            show(0);
        }

        function renderF1(race) {
            // podium drawn P2 · P1 · P3, like the real thing
            const steps = [1, 0, 2].map(i => `
                <div class="qp-step p${i + 1} team-${race.podium[i][1]}">
                    <span class="qp-driver">${race.podium[i][0]}</span>
                    <span class="qp-block">${i + 1}</span>
                </div>`).join('');
            program.innerHTML = `
                <div class="qp qp-f1">
                    <div class="qp-clip">
                        <button type="button" class="qp-yt" aria-label="Play ${esc(race.title)} highlights">
                            <img src="${QDIR}${race.thumb}" alt="">
                            <span class="qp-play">PLAY</span>
                        </button>
                    </div>
                    <div class="qp-side">
                        <span class="qp-kicker">${race.when}</span>
                        <h4 class="qp-title">${race.title}</h4>
                        <div class="qp-podium">${steps}</div>
                    </div>
                </div>`;
            // the YouTube player only loads once someone presses play
            program.querySelector('.qp-yt').addEventListener('click', e => {
                e.currentTarget.parentElement.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${race.video}?autoplay=1&rel=0" title="${esc(race.title)} highlights" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
            });
        }

        function renderBarca(m) {
            program.innerHTML = `
                <div class="qp qp-barca">
                    <div class="qp-clip"></div>
                    <button type="button" class="qp-board" aria-label="Replay the goals">
                        <span class="qp-kicker">${m.stage}</span>
                        <span class="qp-score"><span>BAR</span><b class="qp-home">0</b><i>-</i><b class="qp-away">0</b><span>PSG</span></span>
                        <span class="qp-sub">AGG <b class="qp-agg"></b><span class="qp-remontada">LA REMONTADA</span></span>
                        <ol class="qp-goals">${m.goals.map(([min, who, side]) => `<li class="is-${side}"><span>${min}</span>${who}</li>`).join('')}</ol>
                        <span class="qp-kicker">${m.venue}</span>
                    </button>
                </div>`;
            setClip(program.querySelector('.qp-clip'), m.clip, 'Camp Nou celebrating a Barcelona goal');
            const board = program.querySelector('.qp-board');
            const goals = [...board.querySelectorAll('.qp-goals li')];
            let timer = null;
            const paint = (home, away) => {
                board.querySelector('.qp-home').textContent = home;
                board.querySelector('.qp-away').textContent = away;
                board.querySelector('.qp-agg').textContent = `${m.firstLeg[0] + home}-${m.firstLeg[1] + away}`;
            };
            const replay = () => {
                clearTimeout(timer);
                board.classList.remove('is-final');
                goals.forEach(li => li.classList.remove('is-in'));
                let home = 0, away = 0, i = 0;
                paint(0, 0);
                const next = () => {
                    if (i === goals.length) { board.classList.add('is-final'); return; }
                    goals[i].classList.add('is-in');
                    if (m.goals[i][2] === 'home') home++; else away++;
                    paint(home, away);
                    i++;
                    timer = setTimeout(next, REDUCED_MOTION ? 0 : 650);
                };
                timer = setTimeout(next, REDUCED_MOTION ? 0 : 500);
            };
            board.addEventListener('click', replay);
            cleanups.push(() => clearTimeout(timer));
            replay();
        }

        // pause looping clips while the console is scrolled out of view
        new IntersectionObserver(([entry]) => {
            program.querySelectorAll('video').forEach(v => {
                if (entry.isIntersecting && !REDUCED_MOTION) v.play().catch(() => {});
                else v.pause();
            });
        }).observe(program.parentElement);
    })();

    /* ============================================================
       PROGRAM: chess_match.pgn — experience
       The roster doubles as a scoresheet: hovering a role plays its
       move on the board, clicking one opens the full detail window.
       The game replays itself once when the section comes into view.
       ============================================================ */
    (function initExperience() {
        const board = document.getElementById('chess-board');
        const sheet = document.getElementById('scoresheet');
        const source = document.getElementById('exp-source');
        if (!board || !sheet || !source) return;

        const fromSq = document.getElementById('chess-from');
        const toSq = document.getElementById('chess-to');
        const moveLabel = document.getElementById('chess-move-label');
        const moveNote = document.getElementById('chess-move-note');
        const piecesEl = document.getElementById('board-pieces');
        const statusline = document.getElementById('chess-statusline');
        const dialog = document.getElementById('exp-dialog');
        const articles = [...source.querySelectorAll('.experience-item')];
        const N = CHESS_MOVES.length;

        // 10x12 pixel sprites, drawn as one path each
        const SPRITES = {
            p: ['..........', '....##....', '...####...', '...####...', '....##....', '...####...', '..######..', '..######..', '.########.', '.########.', '##########', '..........'],
            r: ['..........', '.##.##.##.', '.########.', '.########.', '..######..', '..######..', '..######..', '..######..', '.########.', '.########.', '##########', '..........'],
            n: ['..........', '...#####..', '..######..', '.#######..', '#####.##..', '..######..', '...#####..', '...#####..', '..######..', '.########.', '##########', '..........'],
            b: ['..........', '....##....', '...####...', '...####...', '..###.##..', '..######..', '..######..', '...####...', '..######..', '.########.', '##########', '..........'],
            q: ['..........', '#.#.##.#.#', '.########.', '..######..', '..######..', '...####...', '..######..', '..######..', '.########.', '.########.', '##########', '..........'],
            k: ['..........', '....##....', '..######..', '....##....', '...####...', '..######..', '..######..', '..######..', '.########.', '.########.', '##########', '..........']
        };
        const pathOf = rows => rows.flatMap((row, y) => [...row].map((c, x) => c === '#' ? `M${x} ${y}h1v1h-1z` : '')).join('');
        const PATHS = Object.fromEntries(Object.entries(SPRITES).map(([k, rows]) => [k, pathOf(rows)]));

        const BACK_RANK = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
        const file = sq => sq.charCodeAt(0) - 97;
        const rank = sq => 8 - Number(sq[1]);

        const pieces = [];
        BACK_RANK.forEach((type, i) => {
            const f = String.fromCharCode(97 + i);
            pieces.push({ id: `${f}1`, type, colour: 'w' }, { id: `${f}2`, type: 'p', colour: 'w' });
            pieces.push({ id: `${f}7`, type: 'p', colour: 'b' }, { id: `${f}8`, type, colour: 'b' });
        });
        piecesEl.innerHTML = pieces.map(p => `
            <span class="piece piece-${p.colour}" data-id="${p.id}">
                <svg viewBox="0 0 10 12" shape-rendering="crispEdges" aria-hidden="true"><path d="${PATHS[p.type]}"/></svg>
            </span>`).join('');
        const els = new Map([...piecesEl.children].map(el => [el.dataset.id, el]));

        function placeBoard(idx) {
            const at = new Map(pieces.map(p => [p.id, p.id]));   // piece id → square
            for (let step = 0; step <= idx; step++) {
                CHESS_MOVES[step].moves.forEach(([from, to]) => {
                    for (const [id, sq] of at) if (sq === from) { at.set(id, to); break; }
                });
            }
            at.forEach((sq, id) => {
                const el = els.get(id);
                el.style.setProperty('--f', file(sq));
                el.style.setProperty('--r', rank(sq));
            });
        }

        let activeIdx = -1;
        function showMove(idx) {
            if (idx === activeIdx) return;
            activeIdx = idx;
            const move = CHESS_MOVES[idx];
            const [from, to] = move.moves[0];
            [[fromSq, from], [toSq, to]].forEach(([el, sq]) => {
                el.style.setProperty('--f', file(sq));
                el.style.setProperty('--r', rank(sq));
            });
            placeBoard(idx);
            moveLabel.textContent = move.san;
            moveNote.textContent = move.note;
            sheet.querySelectorAll('button').forEach((b, i) => b.classList.toggle('is-on', i === idx));
        }

        // roster rows, built from the articles
        sheet.innerHTML = articles.map((a, i) => `
            <li><button type="button" data-move="${i}">
                <span class="ss-san">${CHESS_MOVES[i].san}</span>
                <span class="ss-role">${a.querySelector('.exp-title').textContent}</span>
                <span class="ss-org">${a.querySelector('.exp-company').textContent}</span>
                <span class="ss-date">${a.querySelector('.exp-date').textContent}</span>
                <span class="ss-open">OPEN</span>
            </button></li>`).join('');

        sheet.addEventListener('pointerover', e => {
            const btn = e.target.closest('button');
            if (btn) showMove(Number(btn.dataset.move));
        });
        sheet.addEventListener('focusin', e => {
            const btn = e.target.closest('button');
            if (btn) showMove(Number(btn.dataset.move));
        });

        // --- detail window ---
        const ed = {
            file: document.getElementById('ed-file'), move: document.getElementById('ed-move'),
            role: document.getElementById('ed-role'), org: document.getElementById('ed-org'),
            date: document.getElementById('ed-date'), bullets: document.getElementById('ed-bullets')
        };
        const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

        function openRole(idx) {
            const a = articles[idx];
            showMove(idx);
            ed.file.textContent = `${slug(a.querySelector('.exp-title').textContent)}.log`;
            ed.move.textContent = `${CHESS_MOVES[idx].san} — ${CHESS_MOVES[idx].note}`;
            ed.role.textContent = a.querySelector('.exp-title').textContent;
            ed.org.textContent = a.querySelector('.exp-company').textContent;
            ed.date.textContent = a.querySelector('.exp-date').textContent;
            ed.bullets.replaceChildren(a.querySelector('.exp-body ul').cloneNode(true));
            dialog.showModal();
            statusline.textContent = `> ${a.querySelector('.exp-title').textContent.toUpperCase()}`;
        }

        sheet.addEventListener('click', e => {
            const btn = e.target.closest('button');
            if (btn) openRole(Number(btn.dataset.move));
        });
        document.getElementById('ed-close').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

        // replay the game once when the section scrolls into view
        placeBoard(-1);
        showMove(0);
        if (!REDUCED_MOTION) {
            let timer = null;
            const io = new IntersectionObserver(([entry]) => {
                if (!entry.isIntersecting) return;
                io.disconnect();
                let i = 0;
                timer = setInterval(() => {
                    showMove(i);
                    if (++i === N) clearInterval(timer);
                }, 700);
            }, { threshold: 0.4 });
            io.observe(board);
        } else {
            showMove(N - 1);
        }
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
       PROGRAM: profile.sys — the ID badge
       Flips for contact links, leans toward the cursor, and the
       "now" lines read live from the rest of the site.
       ============================================================ */
    (function initProfile() {
        const badge = document.getElementById('badge');
        if (!badge) return;

        const front = badge.querySelector('.badge-front');
        const backBtn = badge.querySelector('.badge-flip-back');
        const flip = on => {
            badge.classList.toggle('is-flipped', on);
            front.tabIndex = on ? -1 : 0;
            badge.querySelectorAll('.badge-back a, .badge-back button').forEach(el => { el.tabIndex = on ? 0 : -1; });
            (on ? backBtn : front).focus({ preventScroll: true });
        };
        badge.querySelectorAll('.badge-back a, .badge-back button').forEach(el => { el.tabIndex = -1; });
        front.addEventListener('click', () => flip(true));
        backBtn.addEventListener('click', () => flip(false));

        if (!REDUCED_MOTION && window.matchMedia('(hover: hover)').matches) {
            badge.addEventListener('pointermove', e => {
                const r = badge.getBoundingClientRect();
                badge.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 18}deg`);
                badge.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -12}deg`);
            });
            badge.addEventListener('pointerleave', () => {
                badge.style.setProperty('--ry', '0deg');
                badge.style.setProperty('--rx', '0deg');
            });
        }

        const facts = [];
        const book = BOOKS.find(b => b.status === 'reading');
        if (book) facts.push(['reading', book.title, 'books']);
        const cr = window.CLASH_DATA && window.CLASH_DATA.player;
        if (cr) facts.push(['ladder', `${cr.trophies.toLocaleString('en-US')} trophies`, 'gallery']);
        const now = document.getElementById('profile-now');
        now.innerHTML = facts.map(([k, v, id]) => `<li><span>${k}</span><a href="#${id}">${v}</a></li>`).join('');

        // in-page links clear the fixed header, same as the nav
        document.querySelectorAll('.profile-now a, .badge-to-contact').forEach(a => a.addEventListener('click', e => {
            const target = document.getElementById(a.getAttribute('href').slice(1));
            if (!target) return;
            e.preventDefault();
            window.scrollTo({ top: target.offsetTop - 100, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
        }));
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
        '.profile, .workstation, .trophy-case, .bookshelf, .quest-console, .memory-card, .boss-window'
    );
    elementsToAnimate.forEach(element => {
        observer.observe(element);
    });

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
                        ? 'GOD MODE ON — the keyboard just unlocked RGB.'
                        : 'GOD MODE OFF — back to teal.');
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
