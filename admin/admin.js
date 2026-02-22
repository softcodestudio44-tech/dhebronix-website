// ===== DHEBRONIX ADMIN DASHBOARD - FIREBASE VERSION (FULLY FIXED) =====

import { dbGetAll, dbGetOne, dbAdd, dbUpdate, dbDelete, dbSaveSettings, dbGetSettings } from '../js/firebase-config.js';

// ===== EDITING STATE VARIABLES =====
let editingEventId = null;
let editingEquipmentId = null;
let editingBlogId = null;
let editingTestimonialId = null;
let editingTeamId = null;

// Store original images when editing
let originalEventImages = [];
let originalEquipmentImages = [];
let originalBlogImage = '';
let originalTeamImage = '';

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

    document.getElementById('sidebar').classList.remove('open');
    loadPageData(pageName);
}

sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.getAttribute('data-page'));
    });
});

window.navigateTo = navigateTo;

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
window.showForm = showForm;

function hideForm(formId) {
    document.getElementById(formId).style.display = 'none';
    resetEditingState();
}
window.hideForm = hideForm;

function resetEditingState() {
    editingEventId = null;
    editingEquipmentId = null;
    editingBlogId = null;
    editingTestimonialId = null;
    editingTeamId = null;
    originalEventImages = [];
    originalEquipmentImages = [];
    originalBlogImage = '';
    originalTeamImage = '';

    const eventTitle = document.getElementById('eventFormTitle');
    if (eventTitle) eventTitle.innerHTML = '<i class="fas fa-calendar-plus"></i> Add New Event';
}

// ===== TOAST =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    toastMsg.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== IMAGE HELPERS =====
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

// Get all images currently showing in preview (both old and new)
function getPreviewImages(previewId) {
    const images = [];
    document.querySelectorAll(`#${previewId} .preview-item img`).forEach(img => {
        if (img.src) images.push(img.src);
    });
    return images;
}

// ===== IMAGE PREVIEW SETUP =====
function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('change', function () {
        const preview = document.getElementById(previewId);
        Array.from(this.files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = function (e) {
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

setupImagePreview('eventImages', 'eventImagePreview');
setupImagePreview('productImages', 'productImagePreview');
setupImagePreview('blogImage', 'blogImagePreview');
setupImagePreview('teamImage', 'teamImagePreview');

// ============================================
// ===== EVENT: ADD & EDIT =====
// ============================================
document.getElementById('addEventForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const isEditing = editingEventId !== null;
    showToast(isEditing ? 'Updating event...' : 'Saving event...');

    // Get images from preview area (includes both old and newly added)
    let finalImages = getPreviewImages('eventImagePreview');

    // If no images in preview and we're editing, keep original images
    if (finalImages.length === 0 && isEditing) {
        finalImages = originalEventImages;
    }

    const event = {
        title: document.getElementById('eventTitle').value,
        category: document.getElementById('eventCategory').value,
        date: document.getElementById('eventDate').value,
        venue: document.getElementById('eventVenue').value,
        guests: document.getElementById('eventGuests').value,
        equipment: document.getElementById('eventEquipment').value,
        description: document.getElementById('eventDescription').value,
        testimonial: document.getElementById('eventTestimonial').value,
        images: finalImages
    };

    let success;
    if (isEditing) {
        success = await dbUpdate('events', editingEventId, event);
        if (success) showToast('Event updated successfully!');
    } else {
        success = await dbAdd('events', event);
        if (success) showToast('Event added successfully!');
    }

    if (success) {
        this.reset();
        document.getElementById('eventImagePreview').innerHTML = '';
        hideForm('eventForm');
        loadEvents();
        updateDashboardStats();
    } else {
        showToast('Error saving event!', 'error');
    }
});

async function editEvent(id) {
    const events = await dbGetAll('events');
    const event = events.find(e => e.id === id);
    if (!event) return;

    editingEventId = id;
    originalEventImages = event.images || [];
    document.getElementById('eventFormTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Event';

    showForm('eventForm');
    document.getElementById('eventTitle').value = event.title || '';
    document.getElementById('eventCategory').value = event.category || '';
    document.getElementById('eventDate').value = event.date || '';
    document.getElementById('eventVenue').value = event.venue || '';
    document.getElementById('eventGuests').value = event.guests || '';
    document.getElementById('eventEquipment').value = event.equipment || '';
    document.getElementById('eventDescription').value = event.description || '';
    document.getElementById('eventTestimonial').value = event.testimonial || '';

    // Clear file input
    document.getElementById('eventImages').value = '';

    const preview = document.getElementById('eventImagePreview');
    preview.innerHTML = '';
    if (event.images && event.images.length > 0) {
        event.images.forEach(img => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `<img src="${img}" alt="Event"><button class="remove-preview" onclick="this.parentElement.remove()">×</button>`;
            preview.appendChild(div);
        });
    }
}
window.editEvent = editEvent;

async function deleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    await dbDelete('events', id);
    showToast('Event deleted!', 'error');
    loadEvents();
    updateDashboardStats();
}
window.deleteEvent = deleteEvent;

// ============================================
// ===== EQUIPMENT: ADD & EDIT =====
// ============================================
document.getElementById('addEquipmentForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const isEditing = editingEquipmentId !== null;
    showToast(isEditing ? 'Updating equipment...' : 'Saving equipment...');

    let finalImages = getPreviewImages('productImagePreview');
    if (finalImages.length === 0 && isEditing) {
        finalImages = originalEquipmentImages;
    }

    const product = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: document.getElementById('productPrice').value,
        oldPrice: document.getElementById('productOldPrice').value,
        condition: document.getElementById('productCondition').value,
        brand: document.getElementById('productBrand').value,
        specs: document.getElementById('productSpecs').value,
        description: document.getElementById('productDescription').value,
        available: document.getElementById('productAvailable').checked,
        images: finalImages
    };

    let success;
    if (isEditing) {
        success = await dbUpdate('equipment', editingEquipmentId, product);
        if (success) showToast('Equipment updated successfully!');
    } else {
        success = await dbAdd('equipment', product);
        if (success) showToast('Equipment added successfully!');
    }

    if (success) {
        this.reset();
        document.getElementById('productImagePreview').innerHTML = '';
        hideForm('equipmentForm');
        loadEquipment();
        updateDashboardStats();
    } else {
        showToast('Error saving equipment!', 'error');
    }
});

async function editEquipment(id) {
    const equipment = await dbGetAll('equipment');
    const item = equipment.find(e => e.id === id);
    if (!item) return;

    editingEquipmentId = id;
    originalEquipmentImages = item.images || [];
    showForm('equipmentForm');

    document.getElementById('productName').value = item.name || '';
    document.getElementById('productCategory').value = item.category || '';
    document.getElementById('productPrice').value = item.price || '';
    document.getElementById('productOldPrice').value = item.oldPrice || '';
    document.getElementById('productCondition').value = item.condition || 'new';
    document.getElementById('productBrand').value = item.brand || '';
    document.getElementById('productSpecs').value = item.specs || '';
    document.getElementById('productDescription').value = item.description || '';
    document.getElementById('productAvailable').checked = item.available !== false;

    document.getElementById('productImages').value = '';

    const preview = document.getElementById('productImagePreview');
    preview.innerHTML = '';
    if (item.images && item.images.length > 0) {
        item.images.forEach(img => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `<img src="${img}" alt="Product"><button class="remove-preview" onclick="this.parentElement.remove()">×</button>`;
            preview.appendChild(div);
        });
    }
}
window.editEquipment = editEquipment;

async function deleteEquipment(id) {
    if (!confirm('Delete this equipment?')) return;
    await dbDelete('equipment', id);
    showToast('Equipment deleted!', 'error');
    loadEquipment();
    updateDashboardStats();
}
window.deleteEquipment = deleteEquipment;

// ============================================
// ===== BLOG: ADD & EDIT =====
// ============================================
document.getElementById('addBlogForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const isEditing = editingBlogId !== null;
    showToast(isEditing ? 'Updating post...' : 'Publishing post...');

    // Check for new image upload
    const newImage = await getImageData('blogImage');

    // Check preview for existing image
    const previewImg = document.querySelector('#blogImagePreview .preview-item img');
    const previewImage = previewImg ? previewImg.src : '';

    // Priority: new upload > preview image > original image
    let finalImage = '';
    if (newImage) {
        finalImage = newImage;
    } else if (previewImage) {
        finalImage = previewImage;
    } else if (isEditing) {
        finalImage = originalBlogImage;
    }

    const post = {
        title: document.getElementById('blogTitle').value,
        category: document.getElementById('blogCategory').value,
        author: document.getElementById('blogAuthor').value,
        date: document.getElementById('blogDate').value || new Date().toISOString().split('T')[0],
        content: document.getElementById('blogContent').value,
        excerpt: document.getElementById('blogExcerpt').value,
        tags: document.getElementById('blogTags').value,
        image: finalImage,
        status: 'published'
    };

    let success;
    if (isEditing) {
        success = await dbUpdate('blogs', editingBlogId, post);
        if (success) showToast('Blog post updated!');
    } else {
        success = await dbAdd('blogs', post);
        if (success) showToast('Blog post published!');
    }

    if (success) {
        this.reset();
        document.getElementById('blogImagePreview').innerHTML = '';
        hideForm('blogForm');
        loadBlogs();
        updateDashboardStats();
    } else {
        showToast('Error saving post!', 'error');
    }
});

async function editBlog(id) {
    const blogs = await dbGetAll('blogs');
    const post = blogs.find(b => b.id === id);
    if (!post) return;

    editingBlogId = id;
    originalBlogImage = post.image || '';
    showForm('blogForm');

    document.getElementById('blogTitle').value = post.title || '';
    document.getElementById('blogCategory').value = post.category || '';
    document.getElementById('blogAuthor').value = post.author || 'DHEBRONIX Team';
    document.getElementById('blogDate').value = post.date || '';
    document.getElementById('blogContent').value = post.content || '';
    document.getElementById('blogExcerpt').value = post.excerpt || '';
    document.getElementById('blogTags').value = post.tags || '';

    document.getElementById('blogImage').value = '';

    const preview = document.getElementById('blogImagePreview');
    preview.innerHTML = '';
    if (post.image) {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `<img src="${post.image}" alt="Blog"><button class="remove-preview" onclick="this.parentElement.remove()">×</button>`;
        preview.appendChild(div);
    }
}
window.editBlog = editBlog;

async function deleteBlog(id) {
    if (!confirm('Delete this blog post?')) return;
    await dbDelete('blogs', id);
    showToast('Blog post deleted!', 'error');
    loadBlogs();
    updateDashboardStats();
}
window.deleteBlog = deleteBlog;

// ============================================
// ===== TESTIMONIAL: ADD & EDIT =====
// ============================================
document.getElementById('addTestimonialForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const isEditing = editingTestimonialId !== null;

    const testimonial = {
        name: document.getElementById('testimonialName').value,
        event: document.getElementById('testimonialEvent').value,
        rating: document.getElementById('testimonialRating').value,
        text: document.getElementById('testimonialText').value
    };

    let success;
    if (isEditing) {
        success = await dbUpdate('testimonials', editingTestimonialId, testimonial);
        if (success) showToast('Testimonial updated!');
    } else {
        success = await dbAdd('testimonials', testimonial);
        if (success) showToast('Testimonial added!');
    }

    if (success) {
        this.reset();
        hideForm('testimonialForm');
        loadTestimonials();
    }
});

async function editTestimonial(id) {
    const testimonials = await dbGetAll('testimonials');
    const t = testimonials.find(x => x.id === id);
    if (!t) return;

    editingTestimonialId = id;
    showForm('testimonialForm');

    document.getElementById('testimonialName').value = t.name || '';
    document.getElementById('testimonialEvent').value = t.event || '';
    document.getElementById('testimonialRating').value = t.rating || '5';
    document.getElementById('testimonialText').value = t.text || '';
}
window.editTestimonial = editTestimonial;

async function deleteTestimonial(id) {
    if (!confirm('Delete this testimonial?')) return;
    await dbDelete('testimonials', id);
    showToast('Testimonial deleted!', 'error');
    loadTestimonials();
}
window.deleteTestimonial = deleteTestimonial;

// ============================================
// ===== TEAM: ADD & EDIT =====
// ============================================
document.getElementById('addTeamForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const isEditing = editingTeamId !== null;
    const newImage = await getImageData('teamImage');

    // Check preview for existing image
    const previewImg = document.querySelector('#teamImagePreview .preview-item img');
    const previewImage = previewImg ? previewImg.src : '';

    let finalImage = '';
    if (newImage) {
        finalImage = newImage;
    } else if (previewImage) {
        finalImage = previewImage;
    } else if (isEditing) {
        finalImage = originalTeamImage;
    }

    const member = {
        name: document.getElementById('teamName').value,
        role: document.getElementById('teamRole').value,
        linkedin: document.getElementById('teamLinkedin').value,
        instagram: document.getElementById('teamInstagram').value,
        bio: document.getElementById('teamBio').value,
        image: finalImage
    };

    let success;
    if (isEditing) {
        success = await dbUpdate('team', editingTeamId, member);
        if (success) showToast('Team member updated!');
    } else {
        success = await dbAdd('team', member);
        if (success) showToast('Team member added!');
    }

    if (success) {
        this.reset();
        document.getElementById('teamImagePreview').innerHTML = '';
        hideForm('teamForm');
        loadTeam();
    }
});

async function editTeamMember(id) {
    const team = await dbGetAll('team');
    const member = team.find(t => t.id === id);
    if (!member) return;

    editingTeamId = id;
    originalTeamImage = member.image || '';
    showForm('teamForm');

    document.getElementById('teamName').value = member.name || '';
    document.getElementById('teamRole').value = member.role || '';
    document.getElementById('teamLinkedin').value = member.linkedin || '';
    document.getElementById('teamInstagram').value = member.instagram || '';
    document.getElementById('teamBio').value = member.bio || '';

    document.getElementById('teamImage').value = '';

    const preview = document.getElementById('teamImagePreview');
    preview.innerHTML = '';
    if (member.image) {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `<img src="${member.image}" alt="Team"><button class="remove-preview" onclick="this.parentElement.remove()">×</button>`;
        preview.appendChild(div);
    }
}
window.editTeamMember = editTeamMember;

async function deleteTeamMember(id) {
    if (!confirm('Remove this team member?')) return;
    await dbDelete('team', id);
    showToast('Team member removed!', 'error');
    loadTeam();
}
window.deleteTeamMember = deleteTeamMember;

// ============================================
// ===== LOAD DATA FUNCTIONS =====
// ============================================
async function loadEvents() {
    const events = await dbGetAll('events');
    const tbody = document.getElementById('eventsTableBody');
    const empty = document.getElementById('eventsEmpty');

    if (!tbody) return;

    if (events.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';
    tbody.innerHTML = events.map(event => `
        <tr>
            <td><img src="${event.images && event.images[0] ? event.images[0] : 'https://via.placeholder.com/50x50/1a1a1a/8B1A1A?text=📷'}" class="table-img" alt="${event.title}"></td>
            <td><strong>${event.title}</strong></td>
            <td><span class="status-badge available">${event.category || ''}</span></td>
            <td>${event.date || ''}</td>
            <td>${event.venue || ''}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editEvent('${event.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="table-btn delete" onclick="deleteEvent('${event.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadEquipment() {
    const equipment = await dbGetAll('equipment');
    const tbody = document.getElementById('equipmentTableBody');
    const empty = document.getElementById('equipmentEmpty');

    if (!tbody) return;

    if (equipment.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';
    tbody.innerHTML = equipment.map(item => `
        <tr>
            <td><img src="${item.images && item.images[0] ? item.images[0] : 'https://via.placeholder.com/50x50/1a1a1a/8B1A1A?text=🔊'}" class="table-img" alt="${item.name}"></td>
            <td><strong>${item.name}</strong><br><small style="color:var(--admin-text-muted)">${item.brand || ''}</small></td>
            <td>${item.category || ''}</td>
            <td style="color:var(--admin-primary-light);font-weight:600;">₦${Number(item.price || 0).toLocaleString()}</td>
            <td><span class="status-badge ${item.condition === 'new' ? 'available' : 'draft'}">${item.condition || 'new'}</span></td>
            <td><span class="status-badge ${item.available !== false ? 'available' : 'sold'}">${item.available !== false ? 'Available' : 'Sold'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editEquipment('${item.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="table-btn delete" onclick="deleteEquipment('${item.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadBlogs() {
    const blogs = await dbGetAll('blogs');
    const tbody = document.getElementById('blogTableBody');
    const empty = document.getElementById('blogEmpty');

    if (!tbody) return;

    if (blogs.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';
    tbody.innerHTML = blogs.map(post => `
        <tr>
            <td><img src="${post.image || 'https://via.placeholder.com/50x50/1a1a1a/8B1A1A?text=📝'}" class="table-img" alt="${post.title}"></td>
            <td><strong>${post.title}</strong></td>
            <td>${post.category || ''}</td>
            <td>${post.author || ''}</td>
            <td>${post.date || ''}</td>
            <td><span class="status-badge ${post.status === 'published' ? 'published' : 'draft'}">${post.status || 'published'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editBlog('${post.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="table-btn delete" onclick="deleteBlog('${post.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadTestimonials() {
    const testimonials = await dbGetAll('testimonials');
    const tbody = document.getElementById('testimonialTableBody');
    const empty = document.getElementById('testimonialEmpty');

    if (!tbody) return;

    if (testimonials.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';
    tbody.innerHTML = testimonials.map(t => `
        <tr>
            <td><strong>${t.name}</strong></td>
            <td>${t.event}</td>
            <td>${'⭐'.repeat(parseInt(t.rating) || 5)}</td>
            <td style="max-width:300px;">${(t.text || '').substring(0, 100)}...</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn edit" onclick="editTestimonial('${t.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="table-btn delete" onclick="deleteTestimonial('${t.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadTeam() {
    const team = await dbGetAll('team');
    const grid = document.getElementById('teamCardsGrid');
    const empty = document.getElementById('teamEmpty');

    if (!grid) return;

    if (team.length === 0) {
        grid.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';
    grid.innerHTML = team.map(member => `
        <div class="admin-team-card">
            <img src="${member.image || 'https://via.placeholder.com/400x200/1a1a1a/8B1A1A?text=👤'}" alt="${member.name}">
            <h4>${member.name}</h4>
            <p>${member.role}</p>
            <div style="padding:0 15px 15px;display:flex;gap:8px;justify-content:center;">
                <button class="table-btn edit" onclick="editTeamMember('${member.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="table-btn delete" onclick="deleteTeamMember('${member.id}')" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

// ============================================
// ===== SETTINGS =====
// ============================================
const companyForm = document.getElementById('companySettingsForm');
if (companyForm) {
    dbGetSettings('company').then(settings => {
        if (settings) {
            document.getElementById('companyName').value = settings.name || '';
            document.getElementById('companyPhone').value = settings.phone || '';
            document.getElementById('companyEmail').value = settings.email || '';
            document.getElementById('companyAddress').value = settings.address || '';
            document.getElementById('companyWhatsapp').value = settings.whatsapp || '';
        }
    });

    companyForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        await dbSaveSettings('company', {
            name: document.getElementById('companyName').value,
            phone: document.getElementById('companyPhone').value,
            email: document.getElementById('companyEmail').value,
            address: document.getElementById('companyAddress').value,
            whatsapp: document.getElementById('companyWhatsapp').value
        });
        showToast('Company settings saved!');
    });
}

const socialForm = document.getElementById('socialSettingsForm');
if (socialForm) {
    dbGetSettings('social').then(settings => {
        if (settings) {
            document.getElementById('socialFacebook').value = settings.facebook || '';
            document.getElementById('socialInstagram').value = settings.instagram || '';
            document.getElementById('socialYoutube').value = settings.youtube || '';
            document.getElementById('socialTwitter').value = settings.twitter || '';
        }
    });

    socialForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        await dbSaveSettings('social', {
            facebook: document.getElementById('socialFacebook').value,
            instagram: document.getElementById('socialInstagram').value,
            youtube: document.getElementById('socialYoutube').value,
            twitter: document.getElementById('socialTwitter').value
        });
        showToast('Social links saved!');
    });
}

const passwordForm = document.getElementById('passwordForm');
if (passwordForm) {
    passwordForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmPassword').value;

        if (newPass !== confirmPass) {
            showToast('Passwords do not match!', 'error');
            return;
        }

        showToast('Password updated! (Update admin-login.html too)');
        this.reset();
    });
}

// ============================================
// ===== DASHBOARD STATS =====
// ============================================
async function updateDashboardStats() {
    const events = await dbGetAll('events');
    const equipment = await dbGetAll('equipment');
    const blogs = await dbGetAll('blogs');
    const messages = await dbGetAll('messages');

    const el = (id) => document.getElementById(id);
    if (el('totalEvents')) el('totalEvents').textContent = events.length;
    if (el('totalProducts')) el('totalProducts').textContent = equipment.length;
    if (el('totalBlogs')) el('totalBlogs').textContent = blogs.length;
    if (el('totalMessages')) el('totalMessages').textContent = messages.length;
}

// ============================================
// ===== TEXT FORMATTING =====
// ============================================
function formatText(type) {
    const textarea = document.getElementById('blogContent');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    let formatted = '';
    switch (type) {
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
}
window.formatText = formatText;

function saveDraft() {
    document.getElementById('addBlogForm').dispatchEvent(new Event('submit'));
}
window.saveDraft = saveDraft;

// ============================================
// ===== LOAD PAGE DATA =====
// ============================================
async function loadPageData(page) {
    switch (page) {
        case 'events': await loadEvents(); break;
        case 'equipment': await loadEquipment(); break;
        case 'blog': await loadBlogs(); break;
        case 'testimonials': await loadTestimonials(); break;
        case 'team': await loadTeam(); break;
        case 'dashboard': await updateDashboardStats(); break;
    }
}

// ===== ADMIN NAME =====
const adminNameEl = document.getElementById('adminName');
if (adminNameEl) {
    adminNameEl.textContent = localStorage.getItem('dhebronix_admin_user') || 'Admin';
}

// ===== INITIALIZE =====
updateDashboardStats();
loadEvents();
loadEquipment();
loadBlogs();
loadTestimonials();
loadTeam();