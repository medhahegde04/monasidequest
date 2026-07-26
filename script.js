/* ---------- PARTICLE BACKGROUND ---------- */
const canvas = document.createElement('canvas');
canvas.id = 'particle-canvas';
document.body.prepend(canvas);
const ctx = canvas.getContext('2d');

let particles = [];
const PARTICLE_COUNT = 55;
const MAX_DIST = 140;

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function randomBetween(a, b) {
    return a + Math.random() * (b - a);
}

// Create all particles with random positions and slow drift speeds
function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x:      Math.random() * canvas.width,
            y:      Math.random() * canvas.height,
            vx:     randomBetween(-0.18, 0.18), // horizontal drift speed
            vy:     randomBetween(-0.18, 0.18), // vertical drift speed
            radius: randomBetween(1, 2.5),
            alpha:  randomBetween(0.25, 0.6),
        });
    }
}
initParticles();

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Move each particle and wrap around screen edges
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around instead of bouncing
        if (p.x < 0)             p.x = canvas.width;
        if (p.x > canvas.width)  p.x = 0;
        if (p.y < 0)             p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw the dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(106, 159, 216, ${p.alpha})`;
        ctx.fill();
    });

    // Draw connecting lines between nearby particles
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx   = particles[i].x - particles[j].x;
            const dy   = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < MAX_DIST) {
                // Line fades out as distance increases
                const alpha = (1 - dist / MAX_DIST) * 0.18;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(106, 159, 216, ${alpha})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(drawParticles);
}
drawParticles();



/* ---------- CUSTOM CURSOR ---------- */
const dot  = document.createElement('div');
const ring = document.createElement('div');
dot.id  = 'cursor-dot';
ring.id = 'cursor-ring';
document.body.append(dot, ring);

let mouseX = 0, mouseY = 0; // actual mouse position
let ringX  = 0, ringY  = 0; // ring's current lagging position

// Dot snaps to mouse immediately
document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
});

function animateRing() {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
}
animateRing();

// Grow cursor when hovering links, buttons, and interactive elements
document.querySelectorAll('a, button, .filter-btn, .btn, .learning-card, .project-card').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});



/* ---------- NAVIGATION SCROLL EFFECTS ---------- */
const navbar = document.getElementById('navbar');
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
    } 
    else {
        navbar.classList.remove('scrolled');
    }

    let current = '';
    sections.forEach(section => {
        if (window.scrollY >= section.offsetTop - 140) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});



/* ---------- HAMBURGER MENU ---------- */
const hamburger = document.getElementById('hamburger');
const navLinksList = document.getElementById('nav-links');
const navOverlay = document.getElementById('nav-overlay');

if (hamburger && navLinksList) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        navLinksList.classList.toggle('open');
        navOverlay.classList.toggle('open');
    });

    // Close menu when a link is clicked
    navLinksList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('open');
            navLinksList.classList.remove('open');
            navOverlay.classList.remove('open');
        });
    });

    // Close menu when overlay is clicked
    navOverlay.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinksList.classList.remove('open');
        navOverlay.classList.remove('open');
    });
}


/* ---------- HERO TITLE TYPING ANIMATION ---------- */
const heroTitle = document.getElementById('hero-title');

if (heroTitle) {
    const text = "Hi, I'm Medha."
    let index = 0;
    let isDeleting = false;
    let hasRevealed = false;

    const typeSpeed = 85;      //ms per char while typing
    const deleteSpeed = 45;    //ms per char while deleting
    const typePause = 4000;    //ms to wait after fully typed
    const deletePause = 600;   //ms to wait after fully deleted 

    function type() {
        if (!isDeleting) {
            heroTitle.textContent = text.slice(0, index + 1);
            index++;
            
            if (index === text.length) {
                if(!hasRevealed) {
                    document.querySelectorAll('.hero-tagline, .hero-intro').forEach(el => el.classList.add('visible'));
                    hasRevealed = true;
                }
                setTimeout(() => {
                    isDeleting = true;
                    type();
                }, typePause);
                return;
            }
        }
        else {
            heroTitle.textContent = text.slice(0, index - 1);
            index--;
            
            if (index === 0) {
                isDeleting = false;
                setTimeout(type, deletePause);
                return;
            }
        }

        setTimeout(type, isDeleting ? deleteSpeed : typeSpeed);
    }

    setTimeout(type, 600);
}

if (!heroTitle) {
    document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
}



/* ---------- SCROLL REVEAL EFFECTS ---------- */
const revealEls = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
        else {
            entry.target.classList.remove('visible');
        }
    });
}, {
    threshold: 0.35,
    rootMargin: '0px 0px -40px 0px'
});

revealEls.forEach(el => observer.observe(el));



/* ---------- DYNAMIC PROJECT DISPLAY ---------- */
function buildCard(project) {
    const githubLink = project.github ? `<a href="${project.github}" target="_blank" class="project-link">Github →</a>` : '';
    const liveLink = project.live ? `<a href="${project.live}" target="_blank" class="project-link">Live →</a>` : '';
    const linksRow = (project.github || project.live) ? `<div class="project-links">${githubLink}${liveLink}</div>` : '';

    return `
         <div class="project-card reveal" data-domain="${project.domain}">
            <div class="project-card-header">
                <span class="project-tag ${project.tagClass}">${project.tag}</span>
                <span class="project-status">${project.status}</span>
            </div>
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            ${linksRow}
        </div>
    `;
}

function observeNewCards(container) {
    container.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

const featuredContainer = document.getElementById('featured-projects');
if (featuredContainer) {
    const featured = projects.filter(p => p.featured);
    featuredContainer.innerHTML = featured.length ? featured.map(buildCard).join('') : `<p class="projects-empty">Nothing here yet — check back soon.</p>`;
    observeNewCards(featuredContainer);
}

const allContainer = document.getElementById('all-projects');
if (allContainer) {
    allContainer.innerHTML = projects.length ? projects.map(buildCard).join('') : `<p class="projects-empty">Nothing here yet — check back soon.</p>`;
    observeNewCards(allContainer);
}



/* ---------- PROJECT FILTER ---------- */
const filterBtns = document.querySelectorAll('.filter-btn');
 
if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
 
            document.querySelectorAll('.project-card').forEach(card => {
                const match = filter === 'all' || card.getAttribute('data-domain') === filter;
                card.classList.toggle('hidden', !match);
            });
        });
    });
}



/* ---------- COPY EMAIL ---------- */
function copyEmail() {
    const email = 'medhahegde04@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
        const confirm = document.getElementById('copy-confirm');
        if (confirm) {
            confirm.classList.add('show');
            setTimeout(() => confirm.classList.remove('show'), 2000);
        }
    });
}