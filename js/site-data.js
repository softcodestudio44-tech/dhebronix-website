// ===== DHEBRONIX - CONNECT ADMIN DATA TO MAIN WEBSITE =====
// This file reads data saved by the admin panel and displays it on the website

const SiteDB = {
    get: (key) => JSON.parse(localStorage.getItem(`dhebronix_${key}`)) || [],
    getOne: (key) => JSON.parse(localStorage.getItem(`dhebronix_${key}`)) || null
};

// ===== WAIT FOR PAGE TO LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    
    // Detect which page we're on
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    switch(currentPage) {
        case 'index.html':
        case '':
            loadHomePageData();
            break;
        case 'events.html':
            loadEventsPageData();
            break;
        case 'equipment.html':
            loadEquipmentPageData();
            break;
        case 'blog.html':
            loadBlogPageData();
            break;
        case 'about.html':
            loadAboutPageData();
            break;
        case 'contact.html':
            loadContactPageData();
            break;
    }

    // Load settings on ALL pages
    loadSiteSettings();
});


// ===================================================
// ===== HOME PAGE DATA =====
// ===================================================
function loadHomePageData() {
    loadHomeEvents();
    loadHomeTestimonials();
    loadHomeStats();
}

function loadHomeEvents() {
    const events = SiteDB.get('events');
    const grid = document.querySelector('.latest-events .events-grid');
    
    if (!grid || events.length === 0) return;

    // Show latest 3 events
    const latestEvents = events.slice(-3).reverse();

    grid.innerHTML = latestEvents.map(event => {
        const image = (event.images && event.images[0]) 
            ? event.images[0] 
            : 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600';
        
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

function loadHomeTestimonials() {
    const testimonials = SiteDB.get('testimonials');
    const grid = document.querySelector('.testimonials-grid');
    
    if (!grid || testimonials.length === 0) return;

    const latestTestimonials = testimonials.slice(-3).reverse();

    grid.innerHTML = latestTestimonials.map(t => {
        const stars = '★'.repeat(parseInt(t.rating) || 5);
        
        return `
            <div class="testimonial-card">
                <div class="testimonial-stars">
                    ${Array(parseInt(t.rating) || 5).fill('<i class="fas fa-star"></i>').join('')}
                </div>
                <p class="testimonial-text">"${t.text}"</p>
                <div class="testimonial-author">
                    <div class="author-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="author-info">
                        <h4>${t.name}</h4>
                        <span>${t.event}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function loadHomeStats() {
    const events = SiteDB.get('events');
    const equipment = SiteDB.get('equipment');
    const testimonials = SiteDB.get('testimonials');

    // Update stat numbers if they exist and have more than default
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 4) {
        if (events.length > 0) statNumbers[0].setAttribute('data-target', Math.max(50, events.length));
        if (testimonials.length > 0) statNumbers[1].setAttribute('data-target', Math.max(100, testimonials.length * 10));
        if (equipment.length > 0) statNumbers[3].setAttribute('data-target', Math.max(500, equipment.length * 10));
    }
}


// ===================================================
// ===== EVENTS PAGE DATA =====
// ===================================================
function loadEventsPageData() {
    const events = SiteDB.get('events');
    const grid = document.querySelector('.events-portfolio-grid');
    
    if (!grid || events.length === 0) return;

    // Sort events by date (newest first)
    const sortedEvents = [...events].sort((a, b) => new Date(b.date) - new Date(a.date));

    grid.innerHTML = sortedEvents.map((event, index) => {
        const image = (event.images && event.images[0]) 
            ? event.images[0] 
            : 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600';
        
        const date = event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
        const fullDate = event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
        const venue = event.venue || '';
        const venueShort = venue.split(',')[0] || '';
        
        // Category icons
        const categoryIcons = {
            wedding: 'fa-heart',
            corporate: 'fa-building',
            concert: 'fa-music',
            church: 'fa-church',
            party: 'fa-birthday-cake',
            other: 'fa-calendar'
        };
        const icon = categoryIcons[event.category] || 'fa-calendar';

        // Equipment tags
        const equipTags = event.equipment 
            ? event.equipment.split(',').map(e => `<span class="equip-tag">${e.trim()}</span>`).join('') 
            : '';

        return `
            <div class="portfolio-card" data-category="${event.category || 'other'}">
                <div class="portfolio-image">
                    <img src="${image}" alt="${event.title}">
                    <div class="portfolio-overlay">
                        <div class="portfolio-details">
                            <span class="portfolio-category"><i class="fas ${icon}"></i> ${event.category || 'Event'}</span>
                            <h3>${event.title}</h3>
                            <p><i class="fas fa-calendar"></i> ${fullDate}</p>
                            <p><i class="fas fa-map-marker-alt"></i> ${venue}</p>
                            <button class="portfolio-expand" onclick='showEventDetails(${JSON.stringify(event).replace(/'/g, "&#39;")})'>
                                <i class="fas fa-expand"></i> View Details
                            </button>
                        </div>
                    </div>
                </div>
                <div class="portfolio-info">
                    <h3>${event.title}</h3>
                    <div class="portfolio-meta">
                        <span><i class="fas fa-calendar"></i> ${date}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${venueShort}</span>
                        ${event.guests ? `<span><i class="fas fa-users"></i> ${event.guests} Guests</span>` : ''}
                    </div>
                    <div class="portfolio-equipment">
                        ${equipTags}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Re-setup filter buttons
    setupEventFilters();
}

function setupEventFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.portfolio-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            cards.forEach(card => {
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
}

function showEventDetails(event) {
    const modal = document.getElementById('eventModal');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalBody) return;

    const image = (event.images && event.images[0]) 
        ? event.images[0] 
        : 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800';

    const fullDate = event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

    const equipList = event.equipment 
        ? event.equipment.split(',').map(e => `<li style="background:rgba(139,26,26,0.15);color:var(--primary-light);padding:6px 14px;border-radius:50px;font-size:12px;">${e.trim()}</li>`).join('') 
        : '';

    // Image gallery
    let galleryHTML = '';
    if (event.images && event.images.length > 1) {
        galleryHTML = `
            <div style="display:flex;gap:8px;margin-bottom:20px;overflow-x:auto;padding:5px 0;">
                ${event.images.map(img => `
                    <img src="${img}" alt="${event.title}" style="width:100px;height:80px;object-fit:cover;border-radius:6px;cursor:pointer;border:2px solid var(--border-color);" onclick="this.parentElement.previousElementSibling.src='${img}'">
                `).join('')}
            </div>
        `;
    }

    modalBody.innerHTML = `
        <img src="${image}" alt="${event.title}" style="width:100%;height:300px;object-fit:cover;border-radius:10px 10px 0 0;">
        ${galleryHTML}
        <div style="padding:30px;">
            <span style="background:var(--gradient);padding:5px 15px;border-radius:50px;font-size:12px;font-weight:600;text-transform:capitalize;">${event.category || 'Event'}</span>
            <h2 style="font-family:'Orbitron',sans-serif;font-size:24px;margin:15px 0 10px;">${event.title}</h2>
            <div style="display:flex;gap:20px;flex-wrap:wrap;font-size:13px;color:var(--text-muted);margin-bottom:20px;">
                <span><i class="fas fa-calendar" style="color:var(--primary-light);margin-right:5px;"></i>${fullDate}</span>
                <span><i class="fas fa-map-marker-alt" style="color:var(--primary-light);margin-right:5px;"></i>${event.venue || ''}</span>
                ${event.guests ? `<span><i class="fas fa-users" style="color:var(--primary-light);margin-right:5px;"></i>${event.guests} Guests</span>` : ''}
            </div>
            ${event.description ? `<p style="font-size:14px;color:var(--text-light);line-height:1.8;margin-bottom:20px;">${event.description}</p>` : ''}
            ${equipList ? `
                <h3 style="font-size:16px;margin-bottom:12px;"><i class="fas fa-cog" style="color:var(--primary-light);margin-right:8px;"></i>Equipment Used</h3>
                <ul style="list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin-bottom:25px;">
                    ${equipList}
                </ul>
            ` : ''}
            ${event.testimonial ? `
                <div style="background:rgba(139,26,26,0.1);border-left:3px solid var(--primary-light);padding:15px 20px;border-radius:0 8px 8px 0;margin-bottom:20px;">
                    <p style="font-style:italic;font-size:14px;color:var(--text-light);">"${event.testimonial}"</p>
                </div>
            ` : ''}
            <a href="contact.html" class="btn btn-primary"><i class="fas fa-calendar-check"></i> Book Similar Setup</a>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}


// ===================================================
// ===== EQUIPMENT PAGE DATA =====
// ===================================================
function loadEquipmentPageData() {
    const equipment = SiteDB.get('equipment');
    const grid = document.querySelector('.products-grid');
    
    if (!grid || equipment.length === 0) return;

    // Only show available items
    const availableItems = equipment.filter(item => item.available !== false);

    grid.innerHTML = availableItems.map(item => {
        const image = (item.images && item.images[0]) 
            ? item.images[0] 
            : 'https://via.placeholder.com/400x300/1a1a1a/8B1A1A?text=' + encodeURIComponent(item.name);
        
        const price = Number(item.price).toLocaleString();
        const oldPrice = item.oldPrice ? Number(item.oldPrice).toLocaleString() : '';
        
        const conditionClass = item.condition === 'new' ? 'new' : 'used';
        const conditionText = item.condition ? item.condition.charAt(0).toUpperCase() + item.condition.slice(1) : 'New';

        const whatsappMsg = encodeURIComponent(`I'm interested in ${item.name} (₦${price})`);
        const settings = SiteDB.getOne('settings');
        const whatsappNum = settings ? settings.whatsapp : '2348037280457';

        return `
            <div class="product-card" data-category="${item.category || 'other'}">
                <div class="product-image">
                    <img src="${image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/400x300/1a1a1a/8B1A1A?text=${encodeURIComponent(item.name)}'">
                    <span class="product-badge ${conditionClass}">${conditionText}</span>
                    <div class="product-actions">
                        <button class="product-quick-view" onclick='showProductDetails(${JSON.stringify(item).replace(/'/g, "&#39;")})'><i class="fas fa-eye"></i></button>
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

    // Re-setup filter buttons
    setupEquipmentFilters();
}

function setupEquipmentFilters() {
    const filterButtons = document.querySelectorAll('.equip-filter-btn');
    const cards = document.querySelectorAll('.product-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            cards.forEach(card => {
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
}

function showProductDetails(item) {
    // Create a modal for product details
    let modal = document.getElementById('productModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'productModal';
        modal.className = 'event-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" onclick="closeProductModal()"><i class="fas fa-times"></i></button>
                <div class="modal-body" id="productModalBody"></div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeProductModal();
        });
    }

    const image = (item.images && item.images[0]) 
        ? item.images[0] 
        : 'https://via.placeholder.com/800x400/1a1a1a/8B1A1A?text=' + encodeURIComponent(item.name);

    const price = Number(item.price).toLocaleString();
    const oldPrice = item.oldPrice ? Number(item.oldPrice).toLocaleString() : '';
    const settings = SiteDB.getOne('settings');
    const whatsappNum = settings ? settings.whatsapp : '2348037280457';
    const whatsappMsg = encodeURIComponent(`I'm interested in ${item.name} (₦${price})`);

    // Image gallery
    let galleryHTML = '';
    if (item.images && item.images.length > 1) {
        galleryHTML = `
            <div style="display:flex;gap:8px;padding:0 30px;overflow-x:auto;">
                ${item.images.map(img => `
                    <img src="${img}" alt="${item.name}" style="width:80px;height:60px;object-fit:cover;border-radius:6px;cursor:pointer;border:2px solid var(--border-color);" onclick="document.getElementById('productMainImg').src='${img}'">
                `).join('')}
            </div>
        `;
    }

    document.getElementById('productModalBody').innerHTML = `
        <img id="productMainImg" src="${image}" alt="${item.name}" style="width:100%;height:300px;object-fit:cover;border-radius:10px 10px 0 0;">
        ${galleryHTML}
        <div style="padding:30px;">
            <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:15px;">
                <div>
                    <span style="background:rgba(139,26,26,0.15);color:var(--primary-light);padding:4px 12px;border-radius:50px;font-size:11px;text-transform:uppercase;font-weight:600;">${item.category || ''}</span>
                    <span style="background:${item.condition === 'new' ? '#27ae60' : '#f39c12'};color:white;padding:4px 12px;border-radius:50px;font-size:11px;text-transform:uppercase;font-weight:600;margin-left:5px;">${item.condition || 'New'}</span>
                </div>
                <div style="text-align:right;">
                    ${oldPrice ? `<span style="font-size:16px;color:var(--text-muted);text-decoration:line-through;">₦${oldPrice}</span><br>` : ''}
                    <span style="font-family:'Orbitron',sans-serif;font-size:28px;font-weight:700;color:var(--primary-light);">₦${price}</span>
                </div>
            </div>
            
            <h2 style="font-family:'Orbitron',sans-serif;font-size:22px;margin:15px 0 5px;">${item.name}</h2>
            ${item.brand ? `<p style="font-size:14px;color:var(--text-muted);margin-bottom:15px;">Brand: <strong>${item.brand}</strong></p>` : ''}
            ${item.specs ? `<p style="font-size:14px;color:var(--text-light);margin-bottom:15px;"><i class="fas fa-info-circle" style="color:var(--primary-light);margin-right:5px;"></i>${item.specs}</p>` : ''}
            ${item.description ? `<p style="font-size:14px;color:var(--text-muted);line-height:1.8;margin-bottom:25px;">${item.description}</p>` : ''}
            
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <a href="https://wa.me/${whatsappNum}?text=${whatsappMsg}" target="_blank" class="btn btn-primary"><i class="fab fa-whatsapp"></i> Inquire on WhatsApp</a>
                <a href="tel:+${whatsappNum}" class="btn btn-outline"><i class="fas fa-phone"></i> Call Us</a>
            </div>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}


// ===================================================
// ===== BLOG PAGE DATA =====
// ===================================================
function loadBlogPageData() {
    const blogs = SiteDB.get('blogs');
    const postsContainer = document.querySelector('.blog-posts');
    
    if (!postsContainer || blogs.length === 0) return;

    // Only show published posts
    const publishedBlogs = blogs.filter(b => b.status === 'published');
    const sortedBlogs = [...publishedBlogs].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedBlogs.length === 0) return;

    // Featured post (latest)
    const featured = sortedBlogs[0];
    const restPosts = sortedBlogs.slice(1);

    const featuredDate = featured.date ? new Date(featured.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
    const featuredImage = featured.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800';

    let html = `
        <article class="blog-card featured">
            <div class="blog-image">
                <img src="${featuredImage}" alt="${featured.title}">
                <span class="blog-category">${featured.category || 'General'}</span>
            </div>
            <div class="blog-content">
                <div class="blog-meta">
                    <span><i class="fas fa-calendar"></i> ${featuredDate}</span>
                    <span><i class="fas fa-user"></i> ${featured.author || 'DHEBRONIX Team'}</span>
                </div>
                <h2><a href="#">${featured.title}</a></h2>
                <p>${featured.excerpt || featured.content.substring(0, 200)}...</p>
                <a href="#" class="blog-read-more">Read More <i class="fas fa-arrow-right"></i></a>
            </div>
        </article>
    `;

    // Rest of posts grid
    if (restPosts.length > 0) {
        html += '<div class="blog-grid">';
        html += restPosts.map(post => {
            const postDate = post.date ? new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            const postImage = post.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600';

            return `
                <article class="blog-card">
                    <div class="blog-image">
                        <img src="${postImage}" alt="${post.title}">
                        <span class="blog-category">${post.category || 'General'}</span>
                    </div>
                    <div class="blog-content">
                        <div class="blog-meta">
                            <span><i class="fas fa-calendar"></i> ${postDate}</span>
                        </div>
                        <h3><a href="#">${post.title}</a></h3>
                        <p>${post.excerpt || post.content.substring(0, 120)}...</p>
                        <a href="#" class="blog-read-more">Read More <i class="fas fa-arrow-right"></i></a>
                    </div>
                </article>
            `;
        }).join('');
        html += '</div>';
    }

    postsContainer.innerHTML = html;

    // Update sidebar recent posts
    updateBlogSidebar(sortedBlogs);
}

function updateBlogSidebar(blogs) {
    const recentWidget = document.querySelector('.recent-widget');
    if (!recentWidget) return;

    const recentPosts = blogs.slice(0, 3);
    let html = '<h3>Recent Posts</h3>';

    html += recentPosts.map(post => {
        const postDate = post.date ? new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        const postImage = post.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=100';

        return `
            <div class="recent-post">
                <img src="${postImage}" alt="${post.title}">
                <div>
                    <a href="#">${post.title}</a>
                    <span>${postDate}</span>
                </div>
            </div>
        `;
    }).join('');

    recentWidget.innerHTML = html;
}


// ===================================================
// ===== ABOUT PAGE DATA =====
// ===================================================
function loadAboutPageData() {
    loadTeamSection();
}

function loadTeamSection() {
    const team = SiteDB.get('team');
    const grid = document.querySelector('.team-grid');
    
    if (!grid || team.length === 0) return;

    grid.innerHTML = team.map(member => {
        const image = member.image || 'https://via.placeholder.com/400x300/1a1a1a/8B1A1A?text=' + encodeURIComponent(member.name.split(' ')[0]);

        return `
            <div class="team-card">
                <div class="team-image">
                    <img src="${image}" alt="${member.name}">
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


// ===================================================
// ===== CONTACT PAGE DATA =====
// ===================================================
function loadContactPageData() {
    // Save contact form messages to admin
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        // Remove existing listener and add new one
        contactForm.removeEventListener('submit', handleContactSubmit);
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

function handleContactSubmit(e) {
    e.preventDefault();

    const message = {
        id: Date.now(),
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        service: document.getElementById('service').value,
        eventDate: document.getElementById('event-date').value,
        message: document.getElementById('message').value,
        date: new Date().toISOString(),
        read: false
    };

    // Save to admin messages
    const messages = SiteDB.get('messages');
    messages.push(message);
    localStorage.setItem('dhebronix_messages', JSON.stringify(messages));

    // Also send via WhatsApp
    const settings = SiteDB.getOne('settings');
    const whatsappNum = settings ? settings.whatsapp : '2348037280457';

    let whatsappMsg = `*New Inquiry from DHEBRONIX Website*%0A%0A`;
    whatsappMsg += `*Name:* ${message.name}%0A`;
    whatsappMsg += `*Email:* ${message.email}%0A`;
    whatsappMsg += `*Phone:* ${message.phone}%0A`;
    whatsappMsg += `*Service:* ${message.service}%0A`;
    if (message.eventDate) whatsappMsg += `*Event Date:* ${message.eventDate}%0A`;
    whatsappMsg += `*Message:* ${message.message}`;

    window.open(`https://wa.me/${whatsappNum}?text=${whatsappMsg}`, '_blank');

    alert('Thank you! Your message has been sent.');
    this.reset();
}


// ===================================================
// ===== SITE SETTINGS (All Pages) =====
// ===================================================
function loadSiteSettings() {
    const settings = SiteDB.getOne('settings');
    const social = SiteDB.getOne('social');

    if (settings) {
        // Update phone numbers
        document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
            if (settings.whatsapp) {
                const currentText = link.href.split('text=')[1] || '';
                link.href = `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}${currentText ? '?text=' + currentText : ''}`;
            }
        });

        // Update WhatsApp float button
        const whatsappFloat = document.querySelector('.whatsapp-float');
        if (whatsappFloat && settings.whatsapp) {
            whatsappFloat.href = `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`;
        }

        // Update footer contact info
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

    // Update social media links
    if (social) {
        document.querySelectorAll('.footer-social a, .social-links-large a').forEach(link => {
            const icon = link.querySelector('i');
            if (!icon) return;

            if (icon.classList.contains('fa-facebook-f') && social.facebook) link.href = social.facebook;
            if (icon.classList.contains('fa-instagram') && social.instagram) link.href = social.instagram;
            if (icon.classList.contains('fa-youtube') && social.youtube) link.href = social.youtube;
            if (icon.classList.contains('fa-twitter') && social.twitter) link.href = social.twitter;
        });
    }
}