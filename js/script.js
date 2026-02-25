// ===== DHEBRONIX MULTIMEDIA COMPANY - JAVASCRIPT =====

// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== HAMBURGER MENU =====
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu on link click
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
}

// ===== BACK TO TOP BUTTON =====
const backToTop = document.getElementById('backToTop');
if (backToTop) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== STATS COUNTER ANIMATION =====
const statNumbers = document.querySelectorAll('.stat-number');

function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = Math.floor(current);
    }, 16);
}

// Intersection Observer for stats
if (statNumbers.length > 0) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(num => statsObserver.observe(num));
}

// ===== SCROLL ANIMATIONS =====
const fadeElements = document.querySelectorAll('.service-card, .event-card, .testimonial-card, .team-card, .value-card, .portfolio-card, .product-card, .blog-card, .feature-item, .highlight, .contact-info-item');

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in', 'visible');
            fadeObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

fadeElements.forEach(el => {
    el.classList.add('fade-in');
    fadeObserver.observe(el);
});

// ===== EVENT FILTER (Events Page) =====
const filterButtons = document.querySelectorAll('.filter-btn');
const portfolioCards = document.querySelectorAll('.portfolio-card');

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active button
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');

        portfolioCards.forEach(card => {
            if (filter === 'all' || card.getAttribute('data-category') === filter) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    });
});

// ===== EQUIPMENT FILTER =====
const equipFilterButtons = document.querySelectorAll('.equip-filter-btn');
const productCards = document.querySelectorAll('.product-card');

if (equipFilterButtons.length > 0) {
    equipFilterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            equipFilterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            productCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = 'block';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// ===== EVENT MODAL =====
const eventData = [
    {
        title: 'Afrobeats Live Concert',
        date: 'January 15, 2025',
        venue: 'Eko Convention Center, Lagos',
        guests: '2000+',
        category: 'Concert',
        description: 'A massive Afrobeats concert featuring top Nigerian artists. We provided full sound engineering with 12 speakers, 8 monitors, digital mixing, and complete stage lighting.',
        equipment: ['12 JBL VTX Line Array Speakers', '8 Stage Monitors', 'Yamaha CL5 Digital Mixer', '24 Moving Head Lights', '16 Wireless Microphones', 'Subwoofer Array'],
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'
    },
    {
        title: 'Johnson Wedding Reception',
        date: 'December 20, 2024',
        venue: 'Landmark Event Center, Lagos',
        guests: '500',
        category: 'Wedding',
        description: 'An elegant wedding reception with crystal-clear sound throughout the venue. Wireless microphones for speeches, background music during dinner, and dance floor sound system.',
        equipment: ['6 JBL EON Speakers', '4 Wireless Microphones', 'Yamaha MG20 Mixer', 'LED Uplighting x20', 'DJ Equipment Setup'],
        image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800'
    },
    {
        title: 'Annual Tech Conference',
        date: 'November 10, 2024',
        venue: 'Transcorp Hilton, Abuja',
        guests: '300',
        category: 'Corporate',
        description: 'Professional corporate conference setup with multiple breakout rooms. Clear audio for keynote speakers, panel discussions, and Q&A sessions.',
        equipment: ['Line Array System', 'Podium Microphone', 'Lapel Mics x4', 'Digital Mixer', '2 Projectors', 'Confidence Monitors'],
        image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800'
    },
    {
        title: 'Praise Night Concert',
        date: 'October 5, 2024',
        venue: 'Redemption Camp, Lagos',
        guests: '1000+',
        category: 'Church',
        description: 'Powerful praise and worship night with full band setup. Delivered rich, immersive audio that filled the entire auditorium.',
        equipment: ['10 Line Array Speakers', '6 Stage Monitors', 'Band Drum Shield', '32-Channel Mixer', 'In-Ear Monitors x8', 'Stage Lighting'],
        image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800'
    },
    {
        title: '50th Birthday Celebration',
        date: 'September 15, 2024',
        venue: 'Oriental Hotel, Lagos',
        guests: '200',
        category: 'Party',
        description: 'An intimate yet energetic birthday celebration with professional DJ setup, ambient lighting, and crystal-clear speech system.',
        equipment: ['4 JBL Speakers', 'DJ Controller Setup', 'Wireless Mic x2', 'LED Par Lights x12', 'Uplighting'],
        image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800'
    },
    {
        title: 'Okafor Royal Wedding',
        date: 'August 8, 2024',
        venue: 'Ibadan, Oyo State',
        guests: '800',
        category: 'Wedding',
        description: 'A grand traditional and white wedding celebration spanning two days. Full sound coverage for both indoor and outdoor venues.',
        equipment: ['8 Active Speakers', '4 Wireless Microphones', 'Moving Head Lights x8', 'Digital Mixer', 'Subwoofer x4', 'LED Dance Floor Lighting'],
        image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800'
    }
];

function openEventModal(index) {
    const event = eventData[index];
    const modal = document.getElementById('eventModal');
    const modalBody = document.getElementById('modalBody');

    if (modal && modalBody) {
        modalBody.innerHTML = `
            <img src="${event.image}" alt="${event.title}" style="width:100%;height:300px;object-fit:cover;border-radius:10px 10px 0 0;">
            <div style="padding:30px;">
                <span style="background:var(--gradient);padding:5px 15px;border-radius:50px;font-size:12px;font-weight:600;">${event.category}</span>
                <h2 style="font-family:'Orbitron',sans-serif;font-size:24px;margin:15px 0 10px;">${event.title}</h2>
                <div style="display:flex;gap:20px;flex-wrap:wrap;font-size:13px;color:var(--text-muted);margin-bottom:20px;">
                    <span><i class="fas fa-calendar" style="color:var(--primary-light);margin-right:5px;"></i>${event.date}</span>
                    <span><i class="fas fa-map-marker-alt" style="color:var(--primary-light);margin-right:5px;"></i>${event.venue}</span>
                    <span><i class="fas fa-users" style="color:var(--primary-light);margin-right:5px;"></i>${event.guests} Guests</span>
                </div>
                <p style="font-size:14px;color:var(--text-light);line-height:1.8;margin-bottom:20px;">${event.description}</p>
                <h3 style="font-size:16px;margin-bottom:12px;"><i class="fas fa-cog" style="color:var(--primary-light);margin-right:8px;"></i>Equipment Used</h3>
                <ul style="list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin-bottom:25px;">
                    ${event.equipment.map(item => `<li style="background:rgba(139,26,26,0.15);color:var(--primary-light);padding:6px 14px;border-radius:50px;font-size:12px;">${item}</li>`).join('')}
                </ul>
                <a href="contact.html" class="btn btn-primary"><i class="fas fa-calendar-check"></i> Book Similar Setup</a>
            </div>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Close modal on outside click
const eventModal = document.getElementById('eventModal');
if (eventModal) {
    eventModal.addEventListener('click', (e) => {
        if (e.target === eventModal) {
            closeEventModal();
        }
    });
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEventModal();
    }
});

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const service = document.getElementById('service').value;
        const eventDate = document.getElementById('event-date').value;
        const message = document.getElementById('message').value;

        // Create WhatsApp message
        let whatsappMsg = `*New Inquiry from DHEBRONIX Website*%0A%0A`;
        whatsappMsg += `*Name:* ${name}%0A`;
        whatsappMsg += `*Email:* ${email}%0A`;
        whatsappMsg += `*Phone:* ${phone}%0A`;
        whatsappMsg += `*Service:* ${service}%0A`;
        if (eventDate) whatsappMsg += `*Event Date:* ${eventDate}%0A`;
        whatsappMsg += `*Message:* ${message}`;

        // Open WhatsApp with message
        window.open(`https://wa.me/2348037280457?text=${whatsappMsg}`, '_blank');

        // Show success message
        alert('Thank you! Your message is being sent via WhatsApp.');
        contactForm.reset();
    });
}

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ===== ACTIVE NAV LINK HIGHLIGHT =====
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
        link.classList.add('active');
    }
});
// ===== HIDE PRELOADER =====
window.addEventListener('load', function() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 500);
    }
});