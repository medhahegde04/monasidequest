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
    const linksRow = (project.github || github.live) ? `<div class="project-links">${githubLink}${liveLink}</div>` : '';

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