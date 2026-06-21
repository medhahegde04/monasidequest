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

    function type() {
        if (index < text.length) {
            heroTitle.textContent += text[index];
            index++;
            setTimeout(type, 85);
        }
        else {
            heroTitle.classList.add('done');
            document.querySelectorAll('.hero-tagline, .hero-intro').forEach(el => el.classList.add('visible'));
        }
    }

    setTimeout(type, 1000);
}