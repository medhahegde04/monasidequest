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