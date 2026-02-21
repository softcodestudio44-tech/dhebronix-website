// ===== DHEBRONIX - FIREBASE SITE DATA =====
import { dbGetAll, dbGetSettings } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', async function () {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    switch (currentPage) {
        case 'index.html':
        case '':
            await loadHomePageData();
            break;
        case 'events.html':
            await loadEventsPageData();
            break;
        case 'equipment.html':
            await loadEquipmentPageData();
            break;
        case 'blog.html':
            await loadBlogPageData();
            break;
        case 'about.html':
            await loadAboutPageData();
            break;
        case 'contact.html':
            loadContactPageData();
            break;
    }

    await loadSiteSettings();
});

// ===== HOME PAGE =====
async function loadHomePageData() {
    const events = await dbGetAll('events');
    const testimonials = await dbGetAll('testimonials');

    // Load latest 3 events
    const grid = document.querySelector('.latest-events .events-grid');
    if (grid && events.length > 0) {
        const latest = events.slice(-3).reverse();
        grid.innerHTML = latest.map(event => {
            const image = (event.images && event.images[0]) || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600';
            const date = event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
            const venue = event.venue ? event.venue.split(',')[0] : '';
            return `
                <div class="event-card">
                    <div class="event-image">
                        <img src="${image}" alt="${event.title}">
                        <div class="event-overlay">
                            <span class="event-category">${event.category || 'Event'}</span>
                            <a href="events.html" class="event-view"><i class="fas fa-eye"></i></a>
                        </div>
                    </div>
                    <div class="event-info">
                        <h3>${event.title}</h3>
                        <div class="event-meta">
                            <span><i class="fas fa-calendar"></i> ${date}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${venue}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Load testimonials
    const tGrid = document.querySelector('.testimonials-grid');
    if (tGrid && testimonials.length > 0) {
        const latest = testimonials.slice(-3).reverse();
        tGrid.innerHTML = latest.map(t => `
            <div class="testimonial-card">
                <div class="testimonial-stars">
                    ${Array(parseInt(t.rating) || 5).fill('<i class="fas fa-star"></i>').join('')}
                </div>
                <p class="testimonial-text">"${t.text}"</p>
                <div class="testimonial-author">
                    <div class="author-avatar"><i class="fas fa-user-circle"></i></div>
                    <div class="author-info">
                        <h4>${t.name}</h4>
                        <span>${t.event}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// ===== EVENTS PAGE =====
async function loadEventsPageData() {
    const events = await dbGetAll('events');
    const grid = document.querySelector('.events-portfolio-grid');
    if (!grid || events.length === 0) return;

    const sorted = [...events].sort((a, b) => new Date(b.date) - new Date(a.date));
    const icons = { wedding: 'fa-heart', corporate: 'fa-building', concert: 'fa-music', church: 'fa-church', party: 'fa-birthday-cake', other: 'fa-calendar' };

    grid.innerHTML = sorted.map(event => {
        const image = (event.images && event.images[0]) || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600';
        const date = event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
        const icon = icons[event.category] || 'fa-calendar';
        const equipTags = event.equipment ? event.equipment.split(',').map(e => `<span class="equip-tag">${e.trim()}</span>`).join('') : '';

        return `
            <div class="portfolio-card" data-category="${event.category || 'other'}">
                <div class="portfolio-image">
                    <img src="${image}" alt="${event.title}">
                    <div class="portfolio-overlay">
                        <div class="portfolio-details">
                            <span class="portfolio-category"><i class="fas ${icon}"></i> ${event.category || 'Event'}</span>
                            <h3>${event.title}</h3>
                            <p><i class="fas fa-map-marker-alt"></i> ${event.venue || ''}</p>
                        </div>
                    </div>
                </div>
                <div class="portfolio-info">
                    <h3>${event.title}</h3>
                    <div class="portfolio-meta">
                        <span><i class="fas fa-calendar"></i> ${date}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${(event.venue || '').split(',')[0]}</span>
                        ${event.guests ? `<span><i class="fas fa-users"></i> ${event.guests} Guests</span>` : ''}
                    </div>
                    <div class="portfolio-equipment">${equipTags}</div>
                </div>
            </div>
        `;
    }).join('');

    // Re-setup filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            document.querySelectorAll('.portfolio-card').forEach(card => {
                card.style.display = (filter === 'all' || card.dataset.category === filter) ? 'block' : 'none';
            });
        });
    });
}

// ===== EQUIPMENT PAGE =====
async function loadEquipmentPageData() {
    const equipment = await dbGetAll('equipment');
    const grid = document.querySelector('.products-grid');
    if (!grid || equipment.length === 0) return;

    const settings = await dbGetSettings('company');
    const whatsappNum = settings ? (settings.whatsapp || '2348012345678').replace(/[^0-9]/g, '') : '2348012345678';
    const available = equipment.filter(item => item.available !== false);

    grid.innerHTML = available.map(item => {
        const image = (item.images && item.images[0]) || `https://via.placeholder.com/400x300/1a1a1a/8B1A1A?text=${encodeURIComponent(item.name)}`;
        const price = Number(item.price || 0).toLocaleString();
        const oldPrice = item.oldPrice ? Number(item.oldPrice).toLocaleString() : '';
        const whatsappMsg = encodeURIComponent(`I'm interested in ${item.name} (₦${price})`);

        return `
            <div class="product-card" data-category="${item.category || 'other'}">
                <div class="product-image">
                    <img src="${image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/400x300/1a1a1a/8B1A1A?text=${encodeURIComponent(item.name)}'">
                    <span class="product-badge ${item.condition === 'new' ? 'new' : 'used'}">${item.condition || 'New'}</span>
                    <div class="product-actions">
                        <a href="https://wa.me/${whatsappNum}?text=${whatsappMsg}" target="_blank" class="product-inquiry"><i class="fab fa-whatsapp"></i></a>
                    </div>
                </div>
                <div class="product-info">
                    <span class="product-category">${item.category || ''}</span>
                    <h3>${item.name}</h3>
                    <p class="product-specs">${item.specs || ''}</p>
                    <div class="product-price">
                        ${oldPrice ? `<span class="price-old">₦${oldPrice}</span>` : ''}
                        <span class="price">₦${price}</span>
                    </div>
                    <a href="https://wa.me/${whatsappNum}?text=${whatsappMsg}" target="_blank" class="btn btn-product"><i class="fab fa-whatsapp"></i> Inquire Now</a>
                </div>
            </div>
        `;
    }).join('');

    // Re-setup filters
    document.querySelectorAll('.equip-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.equip-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            document.querySelectorAll('.product-card').forEach(card => {
                card.style.display = (filter === 'all' || card.dataset.category === filter) ? 'block' : 'none';
            });
        });
    });
}

// ===== BLOG PAGE =====
async function loadBlogPageData() {
    const blogs = await dbGetAll('blogs');
    const postsContainer = document.querySelector('.blog-posts');
    if (!postsContainer || blogs.length === 0) return;

    const published = blogs.filter(b => b.status === 'published');
    const sorted = [...published].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sorted.length === 0) return;

    const featured = sorted[0];
    const rest = sorted.slice(1);
    const featuredDate = featured.date ? new Date(featured.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

    let html = `
        <article class="blog-card featured">
            <div class="blog-image">
                <img src="${featured.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'}" alt="${featured.title}">
                <span class="blog-category">${featured.category || 'General'}</span>
            </div>
            <div class="blog-content">
                <div class="blog-meta">
                    <span><i class="fas fa-calendar"></i> ${featuredDate}</span>
                    <span><i class="fas fa-user"></i> ${featured.author || 'DHEBRONIX Team'}</span>
                </div>
                <h2><a href="#">${featured.title}</a></h2>
                <p>${featured.excerpt || (featured.content || '').substring(0, 200)}...</p>
                <a href="#" class="blog-read-more">Read More <i class="fas fa-arrow-right"></i></a>
            </div>
        </article>
    `;

    if (rest.length > 0) {
        html += '<div class="blog-grid">';
        html += rest.map(post => {
            const postDate = post.date ? new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            return `
                <article class="blog-card">
                    <div class="blog-image">
                        <img src="${post.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600'}" alt="${post.title}">
                        <span class="blog-category">${post.category || 'General'}</span>
                    </div>
                    <div class="blog-content">
                        <div class="blog-meta"><span><i class="fas fa-calendar"></i> ${postDate}</span></div>
                        <h3><a href="#">${post.title}</a></h3>
                        <p>${post.excerpt || (post.content || '').substring(0, 120)}...</p>
                        <a href="#" class="blog-read-more">Read More <i class="fas fa-arrow-right"></i></a>
                    </div>
                </article>
            `;
        }).join('');
        html += '</div>';
    }

    postsContainer.innerHTML = html;
}

// ===== ABOUT PAGE =====
async function loadAboutPageData() {
    const team = await dbGetAll('team');
    const grid = document.querySelector('.team-grid');
    if (!grid || team.length === 0) return;

    grid.innerHTML = team.map(member => {
        const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2);
        const hasImage = member.image && member.image !== '';
        const imageHTML = hasImage
            ? `<img src="${member.image}" alt="${member.name}" onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#8B1A1A,#C41E3A);font-size:60px;font-weight:700;color:white;font-family:Orbitron,sans-serif;\\'>${initials}</div>'">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#8B1A1A,#C41E3A);font-size:60px;font-weight:700;color:white;font-family:Orbitron,sans-serif;">${initials}</div>`;

        return `
            <div class="team-card">
                <div class="team-image">
                    ${imageHTML}
                    <div class="team-social">
                        ${member.linkedin ? `<a href="${member.linkedin}" target="_blank"><i class="fab fa-linkedin"></i></a>` : ''}
                        ${member.instagram ? `<a href="${member.instagram}" target="_blank"><i class="fab fa-instagram"></i></a>` : ''}
                    </div>
                </div>
                <div class="team-info">
                    <h3>${member.name}</h3>
                    <p>${member.role}</p>
                </div>
            </div>
        `;
    }).join('');
}

// ===== CONTACT PAGE =====
function loadContactPageData() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const { dbAdd } = await import('./firebase-config.js');

        const message = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            service: document.getElementById('service').value,
            eventDate: document.getElementById('event-date').value,
            message: document.getElementById('message').value,
            read: false
        };

        await dbAdd('messages', message);

        const settings = await dbGetSettings('company');
        const whatsappNum = settings ? (settings.whatsapp || '2348012345678').replace(/[^0-9]/g, '') : '2348012345678';

        let msg = `*New Inquiry - DHEBRONIX*%0A%0A*Name:* ${message.name}%0A*Email:* ${message.email}%0A*Phone:* ${message.phone}%0A*Service:* ${message.service}%0A*Message:* ${message.message}`;
        window.open(`https://wa.me/${whatsappNum}?text=${msg}`, '_blank');

        alert('Thank you! Message sent.');
        form.reset();
    });
}

// ===== SITE SETTINGS =====
async function loadSiteSettings() {
    const settings = await dbGetSettings('company');
    const social = await dbGetSettings('social');

    if (settings) {
        const whatsappFloat = document.querySelector('.whatsapp-float');
        if (whatsappFloat && settings.whatsapp) {
            whatsappFloat.href = `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`;
        }

        const footerContact = document.querySelector('.footer-contact ul');
        if (footerContact) {
            footerContact.innerHTML = `
                ${settings.address ? `<li><i class="fas fa-map-marker-alt"></i> ${settings.address}</li>` : ''}
                ${settings.phone ? `<li><i class="fas fa-phone"></i> ${settings.phone}</li>` : ''}
                ${settings.email ? `<li><i class="fas fa-envelope"></i> ${settings.email}</li>` : ''}
                <li><i class="fas fa-clock"></i> Mon - Sat: 8AM - 8PM</li>
            `;
        }
    }
    if (social) {
        document.querySelectorAll('.footer-social a').forEach(link => {
            const icon = link.querySelector('i');
            if (!icon) return;
            if (icon.classList.contains('fa-facebook-f') && social.facebook) link.href = social.facebook;
            if (icon.classList.contains('fa-instagram') && social.instagram) link.href = social.instagram;
            if (icon.classList.contains('fa-youtube') && social.youtube) link.href = social.youtube;
            if (icon.classList.contains('fa-twitter') && social.twitter) link.href = social.twitter;
            if (social.facebook)  document.getElementById('fbLink').href = social.facebook;
            if (social.instagram) document.getElementById('igLink').href = social.instagram;
            if (social.youtube)   document.getElementById('ytLink').href = social.youtube;
            if (social.twitter)   document.getElementById('twLink').href = social.twitter;
        });
    }
}
