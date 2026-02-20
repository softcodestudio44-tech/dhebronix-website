// ===== DHEBRONIX ADMIN DASHBOARD JAVASCRIPT =====

// ===== DATA STORAGE (localStorage) =====
const DB = {
    get: (key) => JSON.parse(localStorage.getItem(`dhebronix_${key}`)) || [],
    set: (key, data) => localStorage.setItem(`dhebronix_${key}`, JSON.stringify(data)),
    getOne: (key) => JSON.parse(localStorage.getItem(`dhebronix_${key}`)) || null,
    setOne: (key, data) => localStorage.setItem(`dhebronix_${key}`, JSON.stringify(data))
};

// ===== NAVIGATION =====
const sidebarLinks = document.querySelectorAll('.sidebar-link[data-page]');
const adminPages = document.querySelectorAll('.admin-page');
const pageTitle = document.getElementById('pageTitle');

function navigateTo(pageName) {
    adminPages.forEach(p => p.classList.remove('active'));
    sidebarLinks.forEach(l => l.classList.remove('active'));

    const page = document.getElementById(`page-${pageName}`);
    const link = document.querySelector(`[data-page="${pageName}"]`);

    if (page) page.classList.add('active');
    if (link) link.classList.add('active');

    const titles = {
        dashboard: 'Dashboard',
        events: 'Events & Setups',
        equipment: 'Equipment',
        blog: 'Blog Posts',
        gallery: 'Image Gallery',
        testimonials: 'Testimonials',
        team: 'Team Members',
        messages: 'Messages',
        settings: 'Settings'
    };
    pageTitle.textContent = titles[pageName] || 'Dashboard';

    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');

    // Refresh data display
    loadPageData(pageName);
}

sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.getAttribute('data-page'));
    });
});

// ===== SIDEBAR TOGGLE =====
document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// ===== LOGOUT =====
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('dhebronix_admin_logged_in');
        window.location.href = 'admin-login.html';
    }
});

// ===== SHOW/HIDE FORMS =====
function showForm(formId) {
    document.getElementById(formId).style.display = 'block';
    document.getElementById(formId).scrollIntoView({ behavior: 'smooth' });
}

function hideForm(formId) {
    document.getElementById(formId).style.display = 'none';
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    toastMsg.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== IMAGE PREVIEW =====
function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('change', function() {
        const preview = document.getElementById(previewId);
        preview.innerHTML = '';

        Array.from(this.files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button class="remove-preview" onclick="this.parentElement.remove()">×</button>
                `;
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    });
}

// Setup all image previews
setupImagePreview('eventImages', 'eventImagePreview');
setupImagePreview('productImages', 'productImagePreview');
setupImagePreview('blogImage', 'blogImagePreview');
setupImagePreview('teamImage', 'teamImagePreview');

// ===== IMAGE TO BASE64 =====
function getImageData(inputId) {
    return new Promise((resolve) => {
        const input = document.getElementById(inputId);
        if (!input || !input.files || !input.files[0]) {
            resolve('');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(input.files[0]);
    });
}

function getAllImagesData(inputId) {
    return new Promise((resolve) => {
        const input = document.getElementById(inputId);
        if (!input || !input.files || input.files.length === 0) {
            resolve([]);
            return;
        }
        const promises = Array.from(input.files).map(file => {
            return new Promise((res) => {
                const reader = new FileReader();
                reader.onload = (e) => res(e.target.result);
                reader.readAsDataURL(file);
            });
        });
        Promise.all(promises).then(resolve);
    });
}

// ===== ADD EVENT =====
document.getElementById('addEventForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const images = await getAllImagesData('eventImages');
    const event = {
        id: Date.now(),
        title: document.getElementById('eventTitle').value,
        category: document.getElementById('eventCategory').value,
        date: document.getElementById('eventDate').value,
        venue: document.getElementById('eventVenue').value,
        guests: document.getElementById('eventGuests').value,
        equipment: document.getElementById('eventEquipment').value,
        description: document.getElementById('eventDescription').value,
        testimonial: document.getElementById('eventTestimonial').value,
        images: images,
        createdAt: new Date().toISOString()
    };

    const events = DB.get('events');
    events.push(event);
    DB.set('events', events);

    addActivity(`New event added: ${event.title}`);
    showToast('Event added successfully!');
    this.reset();
    document.getElementById('eventImagePreview').innerHTML = '';
    hideForm('eventForm');
    loadEvents();
    updateDashboardStats();
});

// ===== ADD EQUIPMENT =====
document.getElementById('addEquipmentForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const images = await getAllImagesData('productImages');
    const product = {
        id: Date.now(),
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: document.getElementById('productPrice').value,
        oldPrice: document.getElementById('productOldPrice').value,
        condition: document.getElementById('productCondition').value,
        brand: document.getElementById('productBrand').value,
        specs: document.getElementById('productSpecs').value,
        description: document.getElementById('productDescription').value,
        available: document.getElementById('productAvailable').checked,
        images: images,
        createdAt: new Date().toISOString()
    };

    const equipment = DB.get('equipment');
    equipment.push(product);
    DB.set('equipment', equipment);

    addActivity(`New equipment listed: ${product.name}`);
    showToast('Equipment added successfully!');
    this.reset();
    document.getElementById('productImagePreview').innerHTML = '';
    hideForm('equipmentForm');
    loadEquipment();
    updateDashboardStats();
});

// ===== ADD BLOG POST =====
document.getElementById('addBlogForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const image = await getImageData('blogImage');
    const post = {
        id: Date.now(),
        title: document.getElementById('blogTitle').value,
        category: document.getElementById('blogCategory').value,
        author: document.getElementById('blogAuthor').value,
        date: document.getElementById('blogDate').value || new Date().toISOString().split('T')[0],
        content: document.getElementById('blogContent').value,
        excerpt: document.getElementById('blogExcerpt').value,
        tags: document.getElementById('blogTags').value,
        image: image,
        status: 'published',
        createdAt: new Date().toISOString()
    };

    const blogs = DB.get('blogs');
    blogs.push(post);
    DB.set('blogs', blogs);

    addActivity(`Blog published: ${post.title}`);
    showToast('Blog post published!');
    this.reset();
    document.getElementById('blogImagePreview').innerHTML = '';
    hideForm('blogForm');
    loadBlogs();
    updateDashboardStats();
});

// ===== ADD TESTIMONIAL =====
document.getElementById('addTestimonialForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const testimonial = {
        id: Date.now(),
        name: document.getElementById('testimonialName').value,
        event: document.getElementById('testimonialEvent').value,
        rating: document.getElementById('testimonialRating').value,
        text: document.getElementById('testimonialText').value,
        createdAt: new Date().toISOString()
    };

    const testimonials = DB.get('testimonials');
    testimonials.push(testimonial);
    DB.set('testimonials', testimonials);

    showToast('Testimonial added!');
    this.reset();
    hideForm('testimonialForm');
    loadTestimonials();
});

// ===== ADD TEAM MEMBER =====
document.getElementById('addTeamForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const image = await getImageData('teamImage');
    const member = {
        id: Date.now(),
        name: document.getElementById('teamName').value,
        role: document.getElementById('teamRole').value,
        linkedin: document.getElementById('teamLinkedin').value,
        instagram: document.getElementById('teamInstagram').value,
        bio: document.getElementById('teamBio').value,
        image: image,
        createdAt: new Date().toISOString()
    };

    const team = DB.get('team');
    team.push(member);
    DB.set('team', team);

    showToast('Team member added!');
    this.reset();
    document.getElementById('teamImagePreview').innerHTML = '';
    hideForm('teamForm');
    loadTeam();
});

// ===== DELETE FUNCTIONS =====
function deleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    const events = DB.get('events').filter(e => e.id !== id);
    DB.set('events', events);
    showToast('Event deleted!', 'error');
    loadEvents();
    updateDashboardStats();
}

function deleteEquipment(id) {
    if (!confirm('Delete this equipment?')) return;
    const equipment = DB.get('equipment').filter(e => e.id !== id);
    DB.set('equipment', equipment);
    showToast('Equipment deleted!', 'error');
    loadEquipment();
    updateDashboardStats();
}

function deleteBlog(id) {
    if (!confirm('Delete this blog post?')) return;
    const blogs = DB.get('blogs').filter(b => b.id !== id);
    DB.set('blogs', blogs);
    showToast('Blog post deleted!', 'error');
    loadBlogs();
    updateDashboardStats();
}

function deleteTestimonial(id) {
    if (!confirm('Delete this testimonial?')) return;
    const testimonials = DB.get('testimonials').filter(t => t.id !== id);
    DB.set('testimonials', testimonials);
    showToast('Testimonial deleted!', 'error');
    loadTestimonials();
}

function deleteTeamMember(id) {
    if (!confirm('Remove this team member?')) return;
    const team = DB.get('team').filter(t => t.id !== id);
    DB.set('team', team);
    showToast('Team member removed!', 'error');
    loadTeam();
}

// ===== LOAD DATA FUNCTIONS =====
function loadEvents() {
    const events = DB.get('events');
    const tbody = document.getElementById('eventsTableBody');
    const empty = document.getElementById('eventsEmpty');

    if (!tbody) return;

    if (events.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    tbody.innerHTML = events.map(event => `
        <tr>
            <td><img src="${event.images && event.images[0] ? event.images[0] : 'https://via.placeholder.com/50x50/1a1a1a/8B1A1A?text=📷'}" class="table-img" alt="${event.title}"></td>
            <td><strong>${event.title}</strong></td>
            <td><span class="status-badge available">${event.category}</span></td>
            <td>${event.date}</td>
            <td>${event.venue}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editEvent(${event.id})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="table-btn delete" onclick="deleteEvent(${event.id})" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function loadEquipment() {
    const equipment = DB.get('equipment');
    const tbody = document.getElementById('equipmentTableBody');
    const empty = document.getElementById('equipmentEmpty');

    if (!tbody) return;

    if (equipment.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    tbody.innerHTML = equipment.map(item => `
        <tr>
            <td><img src="${item.images && item.images[0] ? item.images[0] : 'https://via.placeholder.com/50x50/1a1a1a/8B1A1A?text=🔊'}" class="table-img" alt="${item.name}"></td>
            <td><strong>${item.name}</strong><br><small style="color:var(--admin-text-muted)">${item.brand || ''}</small></td>
            <td>${item.category}</td>
            <td style="color:var(--admin-primary-light);font-weight:600;">₦${Number(item.price).toLocaleString()}</td>
            <td><span class="status-badge ${item.condition === 'new' ? 'available' : 'draft'}">${item.condition}</span></td>
            <td><span class="status-badge ${item.available ? 'available' : 'sold'}">${item.available ? 'Available' : 'Sold'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editEquipment(${item.id})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="table-btn delete" onclick="deleteEquipment(${item.id})" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function loadBlogs() {
    const blogs = DB.get('blogs');
    const tbody = document.getElementById('blogTableBody');
    const empty = document.getElementById('blogEmpty');

    if (!tbody) return;

    if (blogs.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    tbody.innerHTML = blogs.map(post => `
        <tr>
            <td><img src="${post.image || 'https://via.placeholder.com/50x50/1a1a1a/8B1A1A?text=📝'}" class="table-img" alt="${post.title}"></td>
            <td><strong>${post.title}</strong></td>
            <td>${post.category}</td>
            <td>${post.author}</td>
            <td>${post.date}</td>
            <td><span class="status-badge ${post.status === 'published' ? 'published' : 'draft'}">${post.status}</span></td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editBlog(${post.id})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="table-btn delete" onclick="deleteBlog(${post.id})" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function loadTestimonials() {
    const testimonials = DB.get('testimonials');
    const tbody = document.getElementById('testimonialTableBody');
    const empty = document.getElementById('testimonialEmpty');

    if (!tbody) return;

    if (testimonials.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    tbody.innerHTML = testimonials.map(t => `
        <tr>
            <td><strong>${t.name}</strong></td>
            <td>${t.event}</td>
            <td>${'⭐'.repeat(t.rating)}</td>
            <td style="max-width:300px;">${t.text.substring(0, 100)}...</td>
           <td>
    <div class="table-actions">
        <button class="table-btn edit" onclick="editTestimonial(${t.id})" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="table-btn delete" onclick="deleteTestimonial(${t.id})" title="Delete"><i class="fas fa-trash"></i></button>
    </div>
</td>
        </tr>
    `).join('');
}

function loadTeam() {
    const team = DB.get('team');
    const grid = document.getElementById('teamCardsGrid');
    const empty = document.getElementById('teamEmpty');

    if (!grid) return;

    if (team.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    grid.innerHTML = team.map(member => `
        <div class="admin-team-card">
            <img src="${member.image || 'https://via.placeholder.com/400x200/1a1a1a/8B1A1A?text=👤'}" alt="${member.name}">
            <h4>${member.name}</h4>
            <p>${member.role}</p>
            <div style="padding:0 15px 15px;display:flex;gap:8px;justify-content:center;">
                <button class="table-btn edit" onclick="editTeamMember(${member.id})" title="Edit">
                <button class="table-btn delete" onclick="deleteTeamMember(${member.id})" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

// ===== GALLERY =====
const galleryUpload = document.getElementById('galleryUpload');
if (galleryUpload) {
    galleryUpload.addEventListener('change', function() {
        const gallery = DB.get('gallery');

        Array.from(this.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                gallery.push({
                    id: Date.now() + Math.random(),
                    src: e.target.result,
                    name: file.name,
                    size: (file.size / 1024).toFixed(1) + ' KB',
                    uploadedAt: new Date().toISOString()
                });
                DB.set('gallery', gallery);
                loadGallery();
            };
            reader.readAsDataURL(file);
        });

        showToast('Images uploaded!');
    });
}

function loadGallery() {
    const gallery = DB.get('gallery');
    const grid = document.getElementById('galleryGrid');

    if (!grid) return;

    grid.innerHTML = `
        <div class="gallery-upload-card" onclick="document.getElementById('galleryUpload').click()">
            <i class="fas fa-plus"></i>
            <p>Upload Images</p>
        </div>
    `;

    gallery.forEach(img => {
        grid.innerHTML += `
            <div class="gallery-item">
                <img src="${img.src}" alt="${img.name}">
                <div class="gallery-item-overlay">
                    <span>${img.name}</span>
                    <button class="table-btn delete" onclick="deleteGalleryImage(${img.id})" style="width:24px;height:24px;font-size:10px;"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
}

function deleteGalleryImage(id) {
    if (!confirm('Delete this image?')) return;
    const gallery = DB.get('gallery').filter(img => img.id !== id);
    DB.set('gallery', gallery);
    loadGallery();
    showToast('Image deleted!', 'error');
}

// ===== SETTINGS =====
const companyForm = document.getElementById('companySettingsForm');
if (companyForm) {
    companyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const settings = {
            name: document.getElementById('companyName').value,
            phone: document.getElementById('companyPhone').value,
            email: document.getElementById('companyEmail').value,
            address: document.getElementById('companyAddress').value,
            whatsapp: document.getElementById('companyWhatsapp').value
        };
        DB.setOne('settings', settings);
        showToast('Company settings saved!');
    });
}

const socialForm = document.getElementById('socialSettingsForm');
if (socialForm) {
    socialForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const social = {
            facebook: document.getElementById('socialFacebook').value,
            instagram: document.getElementById('socialInstagram').value,
            youtube: document.getElementById('socialYoutube').value,
            twitter: document.getElementById('socialTwitter').value
        };
        DB.setOne('social', social);
        showToast('Social links saved!');
    });
}

const passwordForm = document.getElementById('passwordForm');
if (passwordForm) {
    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmPassword').value;

        if (newPass !== confirmPass) {
            showToast('Passwords do not match!', 'error');
            return;
        }

        DB.setOne('admin_password', newPass);
        showToast('Password updated!');
        this.reset();
    });
}

// ===== ACTIVITY LOG =====
function addActivity(message) {
    const activities = DB.get('activities');
    activities.unshift({
        message: message,
        time: new Date().toLocaleString()
    });
    if (activities.length > 20) activities.pop();
    DB.set('activities', activities);
    loadActivities();
}

function loadActivities() {
    const activities = DB.get('activities');
    const list = document.getElementById('activityList');
    if (!list) return;

    if (activities.length === 0) return;

    list.innerHTML = activities.slice(0, 8).map(a => `
        <div class="activity-item">
            <i class="fas fa-circle" style="color:var(--admin-primary-light);font-size:8px;"></i>
            <p>${a.message}</p>
            <span>${a.time}</span>
        </div>
    `).join('');
}

// ===== DASHBOARD STATS =====
function updateDashboardStats() {
    const el = (id) => document.getElementById(id);
    if (el('totalEvents')) el('totalEvents').textContent = DB.get('events').length;
    if (el('totalProducts')) el('totalProducts').textContent = DB.get('equipment').length;
    if (el('totalBlogs')) el('totalBlogs').textContent = DB.get('blogs').length;
    if (el('totalMessages')) el('totalMessages').textContent = DB.get('messages').length;
}

// ===== TEXT FORMATTING (Blog Editor) =====
function formatText(type) {
    const textarea = document.getElementById('blogContent');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);

    let formatted = '';
    switch(type) {
        case 'bold': formatted = `**${selected}**`; break;
        case 'italic': formatted = `*${selected}*`; break;
        case 'underline': formatted = `__${selected}__`; break;
        case 'h2': formatted = `\n## ${selected}\n`; break;
        case 'h3': formatted = `\n### ${selected}\n`; break;
        case 'ul': formatted = `\n- ${selected}\n`; break;
        case 'link':
            const url = prompt('Enter URL:');
            if (url) formatted = `[${selected}](${url})`;
            else return;
            break;
    }

    textarea.value = textarea.value.substring(0, start) + formatted + textarea.value.substring(end);
    textarea.focus();
}

function saveDraft() {
    document.getElementById('addBlogForm').dispatchEvent(new Event('submit'));
}

// ===== LOAD PAGE DATA =====
function loadPageData(page) {
    switch(page) {
        case 'events': loadEvents(); break;
        case 'equipment': loadEquipment(); break;
        case 'blog': loadBlogs(); break;
        case 'testimonials': loadTestimonials(); break;
        case 'team': loadTeam(); break;
        case 'gallery': loadGallery(); break;
        case 'dashboard':
            updateDashboardStats();
            loadActivities();
            break;
    }
}

// ===== ADMIN NAME =====
const adminNameEl = document.getElementById('adminName');
if (adminNameEl) {
    adminNameEl.textContent = localStorage.getItem('dhebronix_admin_user') || 'Admin';
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    updateDashboardStats();
    loadActivities();
    loadEvents();
    loadEquipment();
    loadBlogs();
    loadTestimonials();
    loadTeam();
    loadGallery();
});
// ===== EDIT EVENT =====
function editEvent(id) {
    const events = DB.get('events');
    const event = events.find(e => e.id === id);
    if (!event) return;

    // Show form
    showForm('eventForm');
    document.getElementById('eventFormTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Event';

    // Fill form with existing data
    document.getElementById('eventTitle').value = event.title || '';
    document.getElementById('eventCategory').value = event.category || '';
    document.getElementById('eventDate').value = event.date || '';
    document.getElementById('eventVenue').value = event.venue || '';
    document.getElementById('eventGuests').value = event.guests || '';
    document.getElementById('eventEquipment').value = event.equipment || '';
    document.getElementById('eventDescription').value = event.description || '';
    document.getElementById('eventTestimonial').value = event.testimonial || '';

    // Show existing images
    const preview = document.getElementById('eventImagePreview');
    preview.innerHTML = '';
    if (event.images && event.images.length > 0) {
        event.images.forEach(img => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `
                <img src="${img}" alt="Event Image">
                <button class="remove-preview" onclick="this.parentElement.remove()">×</button>
            `;
            preview.appendChild(div);
        });
    }

    // Change form to UPDATE mode
    const form = document.getElementById('addEventForm');
    form.onsubmit = async function(e) {
        e.preventDefault();

        // Get new images if uploaded
        const newImages = await getAllImagesData('eventImages');
        
        // Keep existing images from preview
        const existingImages = [];
        document.querySelectorAll('#eventImagePreview .preview-item img').forEach(img => {
            existingImages.push(img.src);
        });

        // Combine existing + new images
        const allImages = [...existingImages, ...newImages];

        // Update event data
        event.title = document.getElementById('eventTitle').value;
        event.category = document.getElementById('eventCategory').value;
        event.date = document.getElementById('eventDate').value;
        event.venue = document.getElementById('eventVenue').value;
        event.guests = document.getElementById('eventGuests').value;
        event.equipment = document.getElementById('eventEquipment').value;
        event.description = document.getElementById('eventDescription').value;
        event.testimonial = document.getElementById('eventTestimonial').value;
        if (allImages.length > 0) event.images = allImages;
        event.updatedAt = new Date().toISOString();

        // Save
        const index = events.findIndex(e => e.id === id);
        events[index] = event;
        DB.set('events', events);

        addActivity(`Event updated: ${event.title}`);
        showToast('Event updated successfully!');
        form.reset();
        preview.innerHTML = '';
        hideForm('eventForm');
        loadEvents();

        // Reset form back to ADD mode
        resetEventForm();
    };
}

function resetEventForm() {
    const form = document.getElementById('addEventForm');
    document.getElementById('eventFormTitle').innerHTML = '<i class="fas fa-calendar-plus"></i> Add New Event';
    form.onsubmit = async function(e) {
        e.preventDefault();

        const images = await getAllImagesData('eventImages');
        const event = {
            id: Date.now(),
            title: document.getElementById('eventTitle').value,
            category: document.getElementById('eventCategory').value,
            date: document.getElementById('eventDate').value,
            venue: document.getElementById('eventVenue').value,
            guests: document.getElementById('eventGuests').value,
            equipment: document.getElementById('eventEquipment').value,
            description: document.getElementById('eventDescription').value,
            testimonial: document.getElementById('eventTestimonial').value,
            images: images,
            createdAt: new Date().toISOString()
        };

        const events = DB.get('events');
        events.push(event);
        DB.set('events', events);

        addActivity(`New event added: ${event.title}`);
        showToast('Event added successfully!');
        this.reset();
        document.getElementById('eventImagePreview').innerHTML = '';
        hideForm('eventForm');
        loadEvents();
        updateDashboardStats();
    };
}


// ===== EDIT EQUIPMENT =====
function editEquipment(id) {
    const equipment = DB.get('equipment');
    const item = equipment.find(e => e.id === id);
    if (!item) return;

    // Show form
    showForm('equipmentForm');

    // Fill form with existing data
    document.getElementById('productName').value = item.name || '';
    document.getElementById('productCategory').value = item.category || '';
    document.getElementById('productPrice').value = item.price || '';
    document.getElementById('productOldPrice').value = item.oldPrice || '';
    document.getElementById('productCondition').value = item.condition || 'new';
    document.getElementById('productBrand').value = item.brand || '';
    document.getElementById('productSpecs').value = item.specs || '';
    document.getElementById('productDescription').value = item.description || '';
    document.getElementById('productAvailable').checked = item.available !== false;

    // Show existing images
    const preview = document.getElementById('productImagePreview');
    preview.innerHTML = '';
    if (item.images && item.images.length > 0) {
        item.images.forEach(img => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `
                <img src="${img}" alt="Product Image">
                <button class="remove-preview" onclick="this.parentElement.remove()">×</button>
            `;
            preview.appendChild(div);
        });
    }

    // Change form to UPDATE mode
    const form = document.getElementById('addEquipmentForm');
    form.onsubmit = async function(e) {
        e.preventDefault();

        const newImages = await getAllImagesData('productImages');
        
        const existingImages = [];
        document.querySelectorAll('#productImagePreview .preview-item img').forEach(img => {
            existingImages.push(img.src);
        });

        const allImages = [...existingImages, ...newImages];

        // Update item data
        item.name = document.getElementById('productName').value;
        item.category = document.getElementById('productCategory').value;
        item.price = document.getElementById('productPrice').value;
        item.oldPrice = document.getElementById('productOldPrice').value;
        item.condition = document.getElementById('productCondition').value;
        item.brand = document.getElementById('productBrand').value;
        item.specs = document.getElementById('productSpecs').value;
        item.description = document.getElementById('productDescription').value;
        item.available = document.getElementById('productAvailable').checked;
        if (allImages.length > 0) item.images = allImages;
        item.updatedAt = new Date().toISOString();

        // Save
        const index = equipment.findIndex(e => e.id === id);
        equipment[index] = item;
        DB.set('equipment', equipment);

        addActivity(`Equipment updated: ${item.name}`);
        showToast('Equipment updated successfully!');
        form.reset();
        preview.innerHTML = '';
        hideForm('equipmentForm');
        loadEquipment();

        // Reset form back to ADD mode
        resetEquipmentForm();
    };
}

function resetEquipmentForm() {
    const form = document.getElementById('addEquipmentForm');
    form.onsubmit = async function(e) {
        e.preventDefault();

        const images = await getAllImagesData('productImages');
        const product = {
            id: Date.now(),
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: document.getElementById('productPrice').value,
            oldPrice: document.getElementById('productOldPrice').value,
            condition: document.getElementById('productCondition').value,
            brand: document.getElementById('productBrand').value,
            specs: document.getElementById('productSpecs').value,
            description: document.getElementById('productDescription').value,
            available: document.getElementById('productAvailable').checked,
            images: images,
            createdAt: new Date().toISOString()
        };

        const equipment = DB.get('equipment');
        equipment.push(product);
        DB.set('equipment', equipment);

        addActivity(`New equipment listed: ${product.name}`);
        showToast('Equipment added successfully!');
        this.reset();
        document.getElementById('productImagePreview').innerHTML = '';
        hideForm('equipmentForm');
        loadEquipment();
        updateDashboardStats();
    };
}


// ===== EDIT BLOG POST =====
function editBlog(id) {
    const blogs = DB.get('blogs');
    const post = blogs.find(b => b.id === id);
    if (!post) return;

    // Show form
    showForm('blogForm');

    // Fill form with existing data
    document.getElementById('blogTitle').value = post.title || '';
    document.getElementById('blogCategory').value = post.category || '';
    document.getElementById('blogAuthor').value = post.author || 'DHEBRONIX Team';
    document.getElementById('blogDate').value = post.date || '';
    document.getElementById('blogContent').value = post.content || '';
    document.getElementById('blogExcerpt').value = post.excerpt || '';
    document.getElementById('blogTags').value = post.tags || '';

    // Show existing image
    const preview = document.getElementById('blogImagePreview');
    preview.innerHTML = '';
    if (post.image) {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
            <img src="${post.image}" alt="Blog Image">
            <button class="remove-preview" onclick="this.parentElement.remove()">×</button>
        `;
        preview.appendChild(div);
    }

    // Change form to UPDATE mode
    const form = document.getElementById('addBlogForm');
    form.onsubmit = async function(e) {
        e.preventDefault();

        const newImage = await getImageData('blogImage');
        
        // Check if existing image still in preview
        const existingImg = document.querySelector('#blogImagePreview .preview-item img');
        const finalImage = newImage || (existingImg ? existingImg.src : post.image);

        // Update post data
        post.title = document.getElementById('blogTitle').value;
        post.category = document.getElementById('blogCategory').value;
        post.author = document.getElementById('blogAuthor').value;
        post.date = document.getElementById('blogDate').value;
        post.content = document.getElementById('blogContent').value;
        post.excerpt = document.getElementById('blogExcerpt').value;
        post.tags = document.getElementById('blogTags').value;
        if (finalImage) post.image = finalImage;
        post.updatedAt = new Date().toISOString();

        // Save
        const index = blogs.findIndex(b => b.id === id);
        blogs[index] = post;
        DB.set('blogs', blogs);

        addActivity(`Blog updated: ${post.title}`);
        showToast('Blog post updated!');
        form.reset();
        preview.innerHTML = '';
        hideForm('blogForm');
        loadBlogs();

        // Reset form back to ADD mode
        resetBlogForm();
    };
}

function resetBlogForm() {
    const form = document.getElementById('addBlogForm');
    form.onsubmit = async function(e) {
        e.preventDefault();

        const image = await getImageData('blogImage');
        const post = {
            id: Date.now(),
            title: document.getElementById('blogTitle').value,
            category: document.getElementById('blogCategory').value,
            author: document.getElementById('blogAuthor').value,
            date: document.getElementById('blogDate').value || new Date().toISOString().split('T')[0],
            content: document.getElementById('blogContent').value,
            excerpt: document.getElementById('blogExcerpt').value,
            tags: document.getElementById('blogTags').value,
            image: image,
            status: 'published',
            createdAt: new Date().toISOString()
        };

        const blogs = DB.get('blogs');
        blogs.push(post);
        DB.set('blogs', blogs);

        addActivity(`Blog published: ${post.title}`);
        showToast('Blog post published!');
        this.reset();
        document.getElementById('blogImagePreview').innerHTML = '';
        hideForm('blogForm');
        loadBlogs();
        updateDashboardStats();
    };
}


// ===== EDIT TEAM MEMBER =====
function editTeamMember(id) {
    const team = DB.get('team');
    const member = team.find(t => t.id === id);
    if (!member) return;

    showForm('teamForm');

    document.getElementById('teamName').value = member.name || '';
    document.getElementById('teamRole').value = member.role || '';
    document.getElementById('teamLinkedin').value = member.linkedin || '';
    document.getElementById('teamInstagram').value = member.instagram || '';
    document.getElementById('teamBio').value = member.bio || '';

    // Show existing image
    const preview = document.getElementById('teamImagePreview');
    preview.innerHTML = '';
    if (member.image) {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
            <img src="${member.image}" alt="Team Photo">
            <button class="remove-preview" onclick="this.parentElement.remove()">×</button>
        `;
        preview.appendChild(div);
    }

    const form = document.getElementById('addTeamForm');
    form.onsubmit = async function(e) {
        e.preventDefault();

        const newImage = await getImageData('teamImage');
        const existingImg = document.querySelector('#teamImagePreview .preview-item img');
        const finalImage = newImage || (existingImg ? existingImg.src : member.image);

        member.name = document.getElementById('teamName').value;
        member.role = document.getElementById('teamRole').value;
        member.linkedin = document.getElementById('teamLinkedin').value;
        member.instagram = document.getElementById('teamInstagram').value;
        member.bio = document.getElementById('teamBio').value;
        if (finalImage) member.image = finalImage;
        member.updatedAt = new Date().toISOString();

        const index = team.findIndex(t => t.id === id);
        team[index] = member;
        DB.set('team', team);

        showToast('Team member updated!');
        form.reset();
        preview.innerHTML = '';
        hideForm('teamForm');
        loadTeam();

        resetTeamForm();
    };
}

function resetTeamForm() {
    const form = document.getElementById('addTeamForm');
    form.onsubmit = async function(e) {
        e.preventDefault();

        const image = await getImageData('teamImage');
        const member = {
            id: Date.now(),
            name: document.getElementById('teamName').value,
            role: document.getElementById('teamRole').value,
            linkedin: document.getElementById('teamLinkedin').value,
            instagram: document.getElementById('teamInstagram').value,
            bio: document.getElementById('teamBio').value,
            image: image,
            createdAt: new Date().toISOString()
        };

        const team = DB.get('team');
        team.push(member);
        DB.set('team', team);

        showToast('Team member added!');
        this.reset();
        document.getElementById('teamImagePreview').innerHTML = '';
        hideForm('teamForm');
        loadTeam();
    };
}


// ===== EDIT TESTIMONIAL =====
function editTestimonial(id) {
    const testimonials = DB.get('testimonials');
    const testimonial = testimonials.find(t => t.id === id);
    if (!testimonial) return;

    showForm('testimonialForm');

    document.getElementById('testimonialName').value = testimonial.name || '';
    document.getElementById('testimonialEvent').value = testimonial.event || '';
    document.getElementById('testimonialRating').value = testimonial.rating || '5';
    document.getElementById('testimonialText').value = testimonial.text || '';

    const form = document.getElementById('addTestimonialForm');
    form.onsubmit = function(e) {
        e.preventDefault();

        testimonial.name = document.getElementById('testimonialName').value;
        testimonial.event = document.getElementById('testimonialEvent').value;
        testimonial.rating = document.getElementById('testimonialRating').value;
        testimonial.text = document.getElementById('testimonialText').value;
        testimonial.updatedAt = new Date().toISOString();

        const index = testimonials.findIndex(t => t.id === id);
        testimonials[index] = testimonial;
        DB.set('testimonials', testimonials);

        showToast('Testimonial updated!');
        form.reset();
        hideForm('testimonialForm');
        loadTestimonials();

        resetTestimonialForm();
    };
}

function resetTestimonialForm() {
    const form = document.getElementById('addTestimonialForm');
    form.onsubmit = function(e) {
        e.preventDefault();

        const testimonial = {
            id: Date.now(),
            name: document.getElementById('testimonialName').value,
            event: document.getElementById('testimonialEvent').value,
            rating: document.getElementById('testimonialRating').value,
            text: document.getElementById('testimonialText').value,
            createdAt: new Date().toISOString()
        };

        const testimonials = DB.get('testimonials');
        testimonials.push(testimonial);
        DB.set('testimonials', testimonials);

        showToast('Testimonial added!');
        form.reset();
        hideForm('testimonialForm');
        loadTestimonials();
    };
}
// ===== PRE-LOAD EXISTING WEBSITE DATA =====
// This loads the equipment that's already on your website into the admin

function preloadExistingData() {
    // Only run if no data exists yet
    const existingEquipment = DB.get('equipment');
    const existingEvents = DB.get('events');
    const existingBlogs = DB.get('blogs');
    const existingTestimonials = DB.get('testimonials');
    const existingTeam = DB.get('team');

    // PRE-LOAD EQUIPMENT
    if (existingEquipment.length === 0) {
        const defaultEquipment = [
            {
                id: 1001,
                name: 'JBL EON 615',
                category: 'speakers',
                price: '450000',
                oldPrice: '',
                condition: 'new',
                brand: 'JBL',
                specs: '1000W, 15" Two-Way Active Speaker',
                description: 'Professional powered PA speaker perfect for live events, conferences, and outdoor gatherings. Crystal clear sound with powerful bass.',
                available: true,
                images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=400&q=80'],
                createdAt: new Date().toISOString()
            },
            {
                id: 1002,
                name: 'Yamaha MG20XU',
                category: 'mixers',
                price: '380000',
                oldPrice: '',
                condition: 'new',
                brand: 'Yamaha',
                specs: '20-Channel Mixing Console with USB & Effects',
                description: 'Professional mixing console with built-in SPX effects, USB audio interface, and 20 input channels for live sound and recording.',
                available: true,
                images: ['https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=400&q=80'],
                createdAt: new Date().toISOString()
            },
            {
                id: 1003,
                name: 'Shure SM58',
                category: 'microphones',
                price: '65000',
                oldPrice: '',
                condition: 'new',
                brand: 'Shure',
                specs: 'Dynamic Vocal Microphone - Industry Standard',
                description: 'The world\'s most popular vocal microphone. Tuned for vocals with brightened midrange and bass rolloff. Extremely durable.',
                available: true,
                images: ['https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80'],
                createdAt: new Date().toISOString()
            },
            {
                id: 1004,
                name: 'Crown XLS 2502',
                category: 'amplifiers',
                price: '250000',
                oldPrice: '350000',
                condition: 'used',
                brand: 'Crown',
                specs: '2-Channel 775W Power Amplifier',
                description: 'High-performance power amplifier with advanced PureBand crossover system. Lightweight and efficient.',
                available: true,
                images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=80'],
                createdAt: new Date().toISOString()
            },
            {
                id: 1005,
                name: 'LED Par Stage Lights (Set of 4)',
                category: 'lighting',
                price: '120000',
                oldPrice: '',
                condition: 'new',
                brand: 'Generic',
                specs: '36 LED RGBW Par Can, DMX512 Control',
                description: 'Professional LED par lights with RGBW color mixing, DMX512 control, and multiple lighting modes. Perfect for stage and event lighting.',
                available: true,
                images: ['https://images.unsplash.com/photo-1504509546545-e000b4a62425?auto=format&fit=crop&w=400&q=80'],
                createdAt: new Date().toISOString()
            },
            {
                id: 1006,
                name: 'XLR Cable Bundle (10-Pack)',
                category: 'accessories',
                price: '85000',
                oldPrice: '',
                condition: 'new',
                brand: 'Pro Audio',
                specs: '25ft Professional XLR Cables, Gold Plated',
                description: 'Professional-grade XLR cables with gold-plated connectors. Durable braided shield for noise-free signal transmission.',
                available: true,
                images: ['https://images.unsplash.com/photo-1563330232-57114bb0823c?auto=format&fit=crop&w=400&q=80'],
                createdAt: new Date().toISOString()
            },
            {
                id: 1007,
                name: 'JBL SRX818SP Subwoofer',
                category: 'speakers',
                price: '650000',
                oldPrice: '',
                condition: 'new',
                brand: 'JBL',
                specs: '18" 1000W Powered Subwoofer',
                description: 'High-powered subwoofer delivering deep, punchy bass for concerts and large events. Built-in DSP and amplifier.',
                available: true,
                images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=400&q=80'],
                createdAt: new Date().toISOString()
            },
            {
                id: 1008,
                name: 'Sennheiser EW 100 G4',
                category: 'microphones',
                price: '280000',
                oldPrice: '',
                condition: 'new',
                brand: 'Sennheiser',
                specs: 'Wireless Handheld Microphone System',
                description: 'Professional wireless microphone system with reliable RF performance and excellent sound quality.',
                available: true,
                images: ['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80'],
                createdAt: new Date().toISOString()
            },
            {
                id: 1009,
                name: '230W Moving Head Beam (Pair)',
                category: 'lighting',
                price: '150000',
                oldPrice: '200000',
                condition: 'used',
                brand: 'Generic',
                specs: '7R Sharpy Beam, DMX512, 16 Prism',
                description: 'Professional moving head beam lights with sharp beam effects, rainbow prism, and DMX control. Great for concerts and clubs.',
                available: true,
                images: ['https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=400&q=80'],
                createdAt: new Date().toISOString()
            }
        ];

        DB.set('equipment', defaultEquipment);
    }

    // PRE-LOAD EVENTS
    if (existingEvents.length === 0) {
        const defaultEvents = [
            {
                id: 2001,
                title: 'Afrobeats Live Concert',
                category: 'concert',
                date: '2025-01-15',
                venue: 'Eko Convention Center, Lagos',
                guests: '2000+',
                equipment: '12 Speakers, 8 Monitors, Digital Mixer, Stage Lights',
                description: 'A massive Afrobeats concert featuring top Nigerian artists. Full sound engineering with complete stage lighting.',
                testimonial: '',
                images: ['https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=80'],
                createdAt: new Date().toISOString()
            },
            {
                id: 2002,
                title: 'Johnson Wedding Reception',
                category: 'wedding',
                date: '2024-12-20',
                venue: 'Landmark Event Center, Lagos',
                guests: '500',
                equipment: '6 Speakers, Wireless Mics, LED Lights',
                description: 'An elegant wedding reception with crystal-clear sound. Wireless microphones for speeches and dance floor sound system.',
                testimonial: 'DHEBRONIX made our wedding reception absolutely perfect!',
                images: ['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=600&q=80'],
                createdAt: new Date().toISOString()
            },
            {
                id: 2003,
                title: 'Annual Tech Conference',
                category: 'corporate',
                date: '2024-11-10',
                venue: 'Transcorp Hilton, Abuja',
                guests: '300',
                equipment: 'Line Array, Podium Mic, Projector',
                description: 'Professional corporate conference setup with clear audio for keynote speakers and panel discussions.',
                testimonial: '',
                images: ['https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=600&q=80'],
                createdAt: new Date().toISOString()
            },
            {
                id: 2004,
                title: 'Praise Night Concert',
                category: 'church',
                date: '2024-10-05',
                venue: 'Redemption Camp, Lagos',
                guests: '1000+',
                equipment: '10 Speakers, 6 Monitors, Band Setup',
                description: 'Powerful praise and worship night with full band setup and immersive audio.',
                testimonial: '',
                images: ['https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=600&q=80'],
                createdAt: new Date().toISOString()
            },
            {
                id: 2005,
                title: '50th Birthday Celebration',
                category: 'party',
                date: '2024-09-15',
                venue: 'Oriental Hotel, Lagos',
                guests: '200',
                equipment: '4 Speakers, DJ Setup, Uplighting',
                description: 'Intimate birthday celebration with professional DJ setup and ambient lighting.',
                testimonial: '',
                images: ['https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=600&q=80'],
                createdAt: new Date().toISOString()
            },
            {
                id: 2006,
                title: 'Okafor Royal Wedding',
                category: 'wedding',
                date: '2024-08-08',
                venue: 'Ibadan, Oyo State',
                guests: '800',
                equipment: '8 Speakers, Wireless Mics, Moving Lights',
                description: 'Grand traditional and white wedding celebration spanning two days with full sound coverage.',
                testimonial: '',
                images: ['https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=600&q=80'],
                createdAt: new Date().toISOString()
            }
        ];

        DB.set('events', defaultEvents);
    }

    // PRE-LOAD BLOG POSTS
    if (existingBlogs.length === 0) {
        const defaultBlogs = [
            {
                id: 3001,
                title: 'How to Choose the Right Sound System for Your Wedding',
                category: 'sound-tips',
                author: 'DHEBRONIX Team',
                date: '2025-02-15',
                content: 'Planning your dream wedding? The sound system is one of the most important elements. From the first dance to the last song, here is everything you need to know about selecting the perfect audio setup for your big day.',
                excerpt: 'Planning your dream wedding? The sound system is one of the most important elements that can make or break your reception.',
                tags: 'wedding, sound, tips, audio',
                image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80',
                status: 'published',
                createdAt: new Date().toISOString()
            },
            {
                id: 3002,
                title: 'Top 5 Sound Engineering Mistakes to Avoid at Live Events',
                category: 'sound-tips',
                author: 'DHEBRONIX Team',
                date: '2025-02-10',
                content: 'Even experienced sound engineers make these common mistakes. Learn how to avoid them and deliver flawless audio at every event.',
                excerpt: 'Even experienced sound engineers make these common mistakes. Learn how to avoid them.',
                tags: 'sound engineering, mistakes, tips',
                image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
                status: 'published',
                createdAt: new Date().toISOString()
            },
            {
                id: 3003,
                title: 'Behind the Scenes: Setting Up for a 500-Person Conference',
                category: 'behind-scenes',
                author: 'DHEBRONIX Team',
                date: '2025-02-05',
                content: 'Take a look at what goes into preparing sound for a major corporate conference from start to finish.',
                excerpt: 'Take a look at what goes into preparing sound for a major corporate conference.',
                tags: 'corporate, conference, setup',
                image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
                status: 'published',
                createdAt: new Date().toISOString()
            },
            {
                id: 3004,
                title: 'Equipment Maintenance Tips for Longevity',
                category: 'maintenance',
                author: 'DHEBRONIX Team',
                date: '2025-01-28',
                content: 'Your sound equipment is an investment. Here is how to properly maintain it to ensure it lasts for years.',
                excerpt: 'Your sound equipment is an investment. Here is how to properly maintain it.',
                tags: 'maintenance, equipment, tips',
                image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=800&q=80',
                status: 'published',
                createdAt: new Date().toISOString()
            }
        ];

        DB.set('blogs', defaultBlogs);
    }

    // PRE-LOAD TESTIMONIALS
    if (existingTestimonials.length === 0) {
        const defaultTestimonials = [
            {
                id: 4001,
                name: 'Adebayo & Funke Johnson',
                event: 'Wedding Reception',
                rating: '5',
                text: 'DHEBRONIX made our wedding reception absolutely perfect! The sound quality was incredible and the team was so professional. Highly recommended!',
                createdAt: new Date().toISOString()
            },
            {
                id: 4002,
                name: 'Chidera Okafor',
                event: 'GTBank Corporate Event',
                rating: '5',
                text: 'We have used DHEBRONIX for all our corporate events. Their attention to detail and professionalism is unmatched. The sound is always crystal clear.',
                createdAt: new Date().toISOString()
            },
            {
                id: 4003,
                name: 'Pastor Emmanuel Ade',
                event: 'Church Concert',
                rating: '5',
                text: 'Amazing concert setup! 500+ guests and every person could hear perfectly. DHEBRONIX are true professionals who know their craft.',
                createdAt: new Date().toISOString()
            }
        ];

        DB.set('testimonials', defaultTestimonials);
    }

    // PRE-LOAD TEAM
    if (existingTeam.length === 0) {
        const defaultTeam = [
            {
                id: 5001,
                name: 'Adebowale Prince Aderibigbe',
                role: 'Founder & Lead Sound Engineer',
                linkedin: '',
                instagram: '',
                bio: 'Founder and lead sound engineer with over 10 years of experience in professional sound engineering and multimedia production.',
                image: '',
                createdAt: new Date().toISOString()
            }
        ];

        DB.set('team', defaultTeam);
    }

    // Refresh all displays
    updateDashboardStats();
    loadActivities();
    loadEvents();
    loadEquipment();
    loadBlogs();
    loadTestimonials();
    loadTeam();
    loadGallery();
}

// RUN PRELOAD ON PAGE LOAD
preloadExistingData();