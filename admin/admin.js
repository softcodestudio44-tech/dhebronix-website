// ===== DHEBRONIX ADMIN DASHBOARD - FINAL FIXED VERSION =====

import { dbGetAll, dbGetOne, dbAdd, dbUpdate, dbDelete, dbSaveSettings, dbGetSettings } from '../js/firebase-config.js';

// ===== EDITING STATE =====
let editingEventId = null;
let editingEquipmentId = null;
let editingBlogId = null;
let editingTestimonialId = null;
let editingTeamId = null;
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
    const titles = { dashboard:'Dashboard', events:'Events & Setups', equipment:'Equipment', blog:'Blog Posts', gallery:'Image Gallery', testimonials:'Testimonials', team:'Team Members', messages:'Messages', settings:'Settings' };
    pageTitle.textContent = titles[pageName] || 'Dashboard';
    document.getElementById('sidebar').classList.remove('open');
    loadPageData(pageName);
}
sidebarLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); navigateTo(link.getAttribute('data-page')); }); });
window.navigateTo = navigateTo;

// ===== SIDEBAR TOGGLE =====
document.getElementById('sidebarToggle').addEventListener('click', () => { document.getElementById('sidebar').classList.toggle('open'); });

// ===== LOGOUT =====
document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); if (confirm('Logout?')) { localStorage.removeItem('dhebronix_admin_logged_in'); window.location.href = 'admin-login.html'; } });

// ===== FORMS =====
function showForm(formId) { document.getElementById(formId).style.display = 'block'; document.getElementById(formId).scrollIntoView({ behavior: 'smooth' }); }
window.showForm = showForm;

function hideForm(formId) {
    document.getElementById(formId).style.display = 'none';
    editingEventId = null; editingEquipmentId = null; editingBlogId = null; editingTestimonialId = null; editingTeamId = null;
    originalEventImages = []; originalEquipmentImages = []; originalBlogImage = ''; originalTeamImage = '';
    const t = document.getElementById('eventFormTitle');
    if (t) t.innerHTML = '<i class="fas fa-calendar-plus"></i> Add New Event';
}
window.hideForm = hideForm;

// ===== TOAST =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    toastMsg.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== IMAGE COMPRESSION - THIS IS THE KEY FIX =====
function compressImage(file, maxWidth = 800, quality = 0.6) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize if too large
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG
                const compressed = canvas.toDataURL('image/jpeg', quality);
                resolve(compressed);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function getImageCompressed(inputId) {
    return new Promise(async (resolve) => {
        const input = document.getElementById(inputId);
        if (!input || !input.files || !input.files[0]) {
            resolve('');
            return;
        }
        const compressed = await compressImage(input.files[0]);
        resolve(compressed);
    });
}

function getAllImagesCompressed(inputId) {
    return new Promise(async (resolve) => {
        const input = document.getElementById(inputId);
        if (!input || !input.files || input.files.length === 0) {
            resolve([]);
            return;
        }
        const results = [];
        for (const file of Array.from(input.files)) {
            const compressed = await compressImage(file);
            results.push(compressed);
        }
        resolve(results);
    });
}

function getPreviewImages(previewId) {
    const images = [];
    document.querySelectorAll(`#${previewId} .preview-item img`).forEach(img => {
        if (img.src) images.push(img.src);
    });
    return images;
}

// ===== IMAGE PREVIEW =====
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
                div.innerHTML = `<img src="${e.target.result}" alt="Preview"><button class="remove-preview" onclick="this.parentElement.remove()">×</button>`;
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
    showToast(isEditing ? 'Updating...' : 'Saving...');

    // Get NEW compressed images from file input
    const newImages = await getAllImagesCompressed('eventImages');

    // Get images currently in preview (old ones user kept)
    let previewImages = getPreviewImages('eventImagePreview');

    // Remove any images that are also in newImages (avoid duplicates from preview)
    // previewImages already includes the new ones from setupImagePreview
    // So we just use previewImages if available
    let finalImages;
    if (previewImages.length > 0) {
        finalImages = previewImages;
    } else if (isEditing) {
        finalImages = originalEventImages;
    } else {
        finalImages = [];
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
        if (success) showToast('Event updated!');
    } else {
        success = await dbAdd('events', event);
        if (success) showToast('Event added!');
    }

    if (success) {
        this.reset();
        document.getElementById('eventImagePreview').innerHTML = '';
        document.getElementById('eventImages').value = '';
        hideForm('eventForm');
        loadEvents();
        updateDashboardStats();
    } else {
        showToast('Error! Try with smaller image or without image.', 'error');
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

async function deleteEvent(id) { if (!confirm('Delete this event?')) return; await dbDelete('events', id); showToast('Event deleted!', 'error'); loadEvents(); updateDashboardStats(); }
window.deleteEvent = deleteEvent;

// ============================================
// ===== EQUIPMENT: ADD & EDIT =====
// ============================================
document.getElementById('addEquipmentForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const isEditing = editingEquipmentId !== null;
    showToast(isEditing ? 'Updating...' : 'Saving...');

    let previewImages = getPreviewImages('productImagePreview');
    let finalImages;
    if (previewImages.length > 0) {
        finalImages = previewImages;
    } else if (isEditing) {
        finalImages = originalEquipmentImages;
    } else {
        finalImages = [];
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
        if (success) showToast('Equipment updated!');
    } else {
        success = await dbAdd('equipment', product);
        if (success) showToast('Equipment added!');
    }

    if (success) {
        this.reset();
        document.getElementById('productImagePreview').innerHTML = '';
        document.getElementById('productImages').value = '';
        hideForm('equipmentForm');
        loadEquipment();
        updateDashboardStats();
    } else {
        showToast('Error! Try with smaller image.', 'error');
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

async function deleteEquipment(id) { if (!confirm('Delete?')) return; await dbDelete('equipment', id); showToast('Deleted!', 'error'); loadEquipment(); updateDashboardStats(); }
window.deleteEquipment = deleteEquipment;

// ============================================
// ===== BLOG: ADD & EDIT =====
// ============================================
document.getElementById('addBlogForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const isEditing = editingBlogId !== null;
    showToast(isEditing ? 'Updating...' : 'Publishing...');

    const newImage = await getImageCompressed('blogImage');
    const previewImg = document.querySelector('#blogImagePreview .preview-item img');
    const previewImage = previewImg ? previewImg.src : '';

    let finalImage = newImage || previewImage || (isEditing ? originalBlogImage : '');

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
        if (success) showToast('Post updated!');
    } else {
        success = await dbAdd('blogs', post);
        if (success) showToast('Post published!');
    }

    if (success) {
        this.reset();
        document.getElementById('blogImagePreview').innerHTML = '';
        document.getElementById('blogImage').value = '';
        hideForm('blogForm');
        loadBlogs();
        updateDashboardStats();
    } else {
        showToast('Error! Try with smaller image.', 'error');
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

async function deleteBlog(id) { if (!confirm('Delete?')) return; await dbDelete('blogs', id); showToast('Deleted!', 'error'); loadBlogs(); updateDashboardStats(); }
window.deleteBlog = deleteBlog;

// ============================================
// ===== TESTIMONIAL: ADD & EDIT =====
// ============================================
document.getElementById('addTestimonialForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const isEditing = editingTestimonialId !== null;
    const testimonial = { name: document.getElementById('testimonialName').value, event: document.getElementById('testimonialEvent').value, rating: document.getElementById('testimonialRating').value, text: document.getElementById('testimonialText').value };
    let success;
    if (isEditing) { success = await dbUpdate('testimonials', editingTestimonialId, testimonial); if (success) showToast('Updated!'); }
    else { success = await dbAdd('testimonials', testimonial); if (success) showToast('Added!'); }
    if (success) { this.reset(); hideForm('testimonialForm'); loadTestimonials(); }
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

async function deleteTestimonial(id) { if (!confirm('Delete?')) return; await dbDelete('testimonials', id); showToast('Deleted!', 'error'); loadTestimonials(); }
window.deleteTestimonial = deleteTestimonial;

// ============================================
// ===== TEAM: ADD & EDIT =====
// ============================================
document.getElementById('addTeamForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const isEditing = editingTeamId !== null;
    const newImage = await getImageCompressed('teamImage');
    const previewImg = document.querySelector('#teamImagePreview .preview-item img');
    const previewImage = previewImg ? previewImg.src : '';
    let finalImage = newImage || previewImage || (isEditing ? originalTeamImage : '');

    const member = { name: document.getElementById('teamName').value, role: document.getElementById('teamRole').value, linkedin: document.getElementById('teamLinkedin').value, instagram: document.getElementById('teamInstagram').value, bio: document.getElementById('teamBio').value, image: finalImage };
    let success;
    if (isEditing) { success = await dbUpdate('team', editingTeamId, member); if (success) showToast('Updated!'); }
    else { success = await dbAdd('team', member); if (success) showToast('Added!'); }
    if (success) { this.reset(); document.getElementById('teamImagePreview').innerHTML = ''; document.getElementById('teamImage').value = ''; hideForm('teamForm'); loadTeam(); }
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

async function deleteTeamMember(id) { if (!confirm('Remove?')) return; await dbDelete('team', id); showToast('Removed!', 'error'); loadTeam(); }
window.deleteTeamMember = deleteTeamMember;

// ============================================
// ===== LOAD DATA =====
// ============================================
async function loadEvents() {
    const events = await dbGetAll('events'); const tbody = document.getElementById('eventsTableBody'); const empty = document.getElementById('eventsEmpty');
    if (!tbody) return;
    if (events.length === 0) { tbody.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    tbody.innerHTML = events.map(event => `<tr><td><img src="${event.images && event.images[0] ? event.images[0] : 'https://via.placeholder.com/50x50/1a1a1a/8B1A1A?text=📷'}" class="table-img"></td><td><strong>${event.title}</strong></td><td><span class="status-badge available">${event.category || ''}</span></td><td>${event.date || ''}</td><td>${event.venue || ''}</td><td><div class="table-actions"><button class="table-btn edit" onclick="editEvent('${event.id}')"><i class="fas fa-edit"></i></button><button class="table-btn delete" onclick="deleteEvent('${event.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
}

async function loadEquipment() {
    const equipment = await dbGetAll('equipment'); const tbody = document.getElementById('equipmentTableBody'); const empty = document.getElementById('equipmentEmpty');
    if (!tbody) return;
    if (equipment.length === 0) { tbody.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    tbody.innerHTML = equipment.map(item => `<tr><td><img src="${item.images && item.images[0] ? item.images[0] : 'https://via.placeholder.com/50x50/1a1a1a/8B1A1A?text=🔊'}" class="table-img"></td><td><strong>${item.name}</strong><br><small style="color:var(--admin-text-muted)">${item.brand || ''}</small></td><td>${item.category || ''}</td><td style="color:var(--admin-primary-light);font-weight:600;">₦${Number(item.price || 0).toLocaleString()}</td><td><span class="status-badge ${item.condition === 'new' ? 'available' : 'draft'}">${item.condition || 'new'}</span></td><td><span class="status-badge ${item.available !== false ? 'available' : 'sold'}">${item.available !== false ? 'Available' : 'Sold'}</span></td><td><div class="table-actions"><button class="table-btn edit" onclick="editEquipment('${item.id}')"><i class="fas fa-edit"></i></button><button class="table-btn delete" onclick="deleteEquipment('${item.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
}

async function loadBlogs() {
    const blogs = await dbGetAll('blogs'); const tbody = document.getElementById('blogTableBody'); const empty = document.getElementById('blogEmpty');
    if (!tbody) return;
    if (blogs.length === 0) { tbody.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    tbody.innerHTML = blogs.map(post => `<tr><td><img src="${post.image || 'https://via.placeholder.com/50x50/1a1a1a/8B1A1A?text=📝'}" class="table-img"></td><td><strong>${post.title}</strong></td><td>${post.category || ''}</td><td>${post.author || ''}</td><td>${post.date || ''}</td><td><span class="status-badge ${post.status === 'published' ? 'published' : 'draft'}">${post.status || 'published'}</span></td><td><div class="table-actions"><button class="table-btn edit" onclick="editBlog('${post.id}')"><i class="fas fa-edit"></i></button><button class="table-btn delete" onclick="deleteBlog('${post.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
}

async function loadTestimonials() {
    const testimonials = await dbGetAll('testimonials'); const tbody = document.getElementById('testimonialTableBody'); const empty = document.getElementById('testimonialEmpty');
    if (!tbody) return;
    if (testimonials.length === 0) { tbody.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    tbody.innerHTML = testimonials.map(t => `<tr><td><strong>${t.name}</strong></td><td>${t.event}</td><td>${'⭐'.repeat(parseInt(t.rating) || 5)}</td><td style="max-width:300px;">${(t.text || '').substring(0, 100)}...</td><td><div class="table-actions"><button class="table-btn edit" onclick="editTestimonial('${t.id}')"><i class="fas fa-edit"></i></button><button class="table-btn delete" onclick="deleteTestimonial('${t.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
}

async function loadTeam() {
    const team = await dbGetAll('team'); const grid = document.getElementById('teamCardsGrid'); const empty = document.getElementById('teamEmpty');
    if (!grid) return;
    if (team.length === 0) { grid.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    grid.innerHTML = team.map(member => `<div class="admin-team-card"><img src="${member.image || 'https://via.placeholder.com/400x200/1a1a1a/8B1A1A?text=👤'}" alt="${member.name}"><h4>${member.name}</h4><p>${member.role}</p><div style="padding:0 15px 15px;display:flex;gap:8px;justify-content:center;"><button class="table-btn edit" onclick="editTeamMember('${member.id}')"><i class="fas fa-edit"></i></button><button class="table-btn delete" onclick="deleteTeamMember('${member.id}')"><i class="fas fa-trash"></i></button></div></div>`).join('');
}

// ============================================
// ===== SETTINGS =====
// ============================================
const companyForm = document.getElementById('companySettingsForm');
if (companyForm) {
    dbGetSettings('company').then(s => { if (s) { document.getElementById('companyName').value = s.name || ''; document.getElementById('companyPhone').value = s.phone || ''; document.getElementById('companyEmail').value = s.email || ''; document.getElementById('companyAddress').value = s.address || ''; document.getElementById('companyWhatsapp').value = s.whatsapp || ''; } });
    companyForm.addEventListener('submit', async function (e) { e.preventDefault(); await dbSaveSettings('company', { name: document.getElementById('companyName').value, phone: document.getElementById('companyPhone').value, email: document.getElementById('companyEmail').value, address: document.getElementById('companyAddress').value, whatsapp: document.getElementById('companyWhatsapp').value }); showToast('Settings saved!'); });
}

const socialForm = document.getElementById('socialSettingsForm');
if (socialForm) {
    dbGetSettings('social').then(s => { if (s) { document.getElementById('socialFacebook').value = s.facebook || ''; document.getElementById('socialInstagram').value = s.instagram || ''; document.getElementById('socialYoutube').value = s.youtube || ''; document.getElementById('socialTwitter').value = s.twitter || ''; } });
    socialForm.addEventListener('submit', async function (e) { e.preventDefault(); await dbSaveSettings('social', { facebook: document.getElementById('socialFacebook').value, instagram: document.getElementById('socialInstagram').value, youtube: document.getElementById('socialYoutube').value, twitter: document.getElementById('socialTwitter').value }); showToast('Social links saved!'); });
}

const passwordForm = document.getElementById('passwordForm');
if (passwordForm) { passwordForm.addEventListener('submit', function (e) { e.preventDefault(); if (document.getElementById('newPassword').value !== document.getElementById('confirmPassword').value) { showToast('Passwords do not match!', 'error'); return; } showToast('Password updated!'); this.reset(); }); }

// ===== DASHBOARD =====
async function updateDashboardStats() {
    const [events, equipment, blogs, messages] = await Promise.all([dbGetAll('events'), dbGetAll('equipment'), dbGetAll('blogs'), dbGetAll('messages')]);
    const el = (id) => document.getElementById(id);
    if (el('totalEvents')) el('totalEvents').textContent = events.length;
    if (el('totalProducts')) el('totalProducts').textContent = equipment.length;
    if (el('totalBlogs')) el('totalBlogs').textContent = blogs.length;
    if (el('totalMessages')) el('totalMessages').textContent = messages.length;
}

// ===== TEXT FORMATTING =====
function formatText(type) { const ta = document.getElementById('blogContent'); const s = ta.selectionStart; const e = ta.selectionEnd; const sel = ta.value.substring(s, e); let f = ''; switch(type) { case 'bold': f=`**${sel}**`; break; case 'italic': f=`*${sel}*`; break; case 'underline': f=`__${sel}__`; break; case 'h2': f=`\n## ${sel}\n`; break; case 'h3': f=`\n### ${sel}\n`; break; case 'ul': f=`\n- ${sel}\n`; break; case 'link': const u=prompt('URL:'); if(u) f=`[${sel}](${u})`; else return; break; } ta.value = ta.value.substring(0,s)+f+ta.value.substring(e); }
window.formatText = formatText;
function saveDraft() { document.getElementById('addBlogForm').dispatchEvent(new Event('submit')); }
window.saveDraft = saveDraft;

// ===== LOAD PAGE =====
async function loadPageData(page) { switch(page) { case 'events': await loadEvents(); break; case 'equipment': await loadEquipment(); break; case 'blog': await loadBlogs(); break; case 'testimonials': await loadTestimonials(); break; case 'team': await loadTeam(); break; case 'dashboard': await updateDashboardStats(); break; } }

// ===== INIT =====
const adminNameEl = document.getElementById('adminName');
if (adminNameEl) adminNameEl.textContent = localStorage.getItem('dhebronix_admin_user') || 'Admin';
updateDashboardStats(); loadEvents(); loadEquipment(); loadBlogs(); loadTestimonials(); loadTeam();