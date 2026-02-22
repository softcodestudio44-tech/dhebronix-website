// ===== DHEBRONIX ADMIN - FINAL VERSION =====

import { dbGetAll, dbAdd, dbUpdate, dbDelete, dbSaveSettings, dbGetSettings } from '../js/firebase-config.js';

let editingEventId = null;
let editingEquipmentId = null;
let editingBlogId = null;
let editingTestimonialId = null;
let editingTeamId = null;
let originalEventImages = [];
let originalEquipmentImages = [];
let originalBlogImage = '';
let originalTeamImage = '';

// ===== AGGRESSIVE IMAGE COMPRESSION =====
// This makes phone photos small enough for Firebase
function compressImage(file) {
    return new Promise((resolve) => {
        // If file is already small (like a URL), skip
        if (typeof file === 'string') { resolve(file); return; }

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');

                // Max 400px wide - small enough for Firebase
                let width = img.width;
                let height = img.height;
                const maxSize = 400;

                if (width > height) {
                    if (width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
                } else {
                    if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
                }

                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);

                // Very aggressive compression - 0.4 quality
                const result = canvas.toDataURL('image/jpeg', 0.4);

                // Check size - Firebase limit is ~1MB per field
                // Base64 is ~33% bigger than binary
                // So we need the string to be under ~700KB
                if (result.length > 700000) {
                    // Even smaller
                    canvas.width = 300;
                    canvas.height = (height * 300) / width;
                    canvas.getContext('2d').drawImage(img, 0, 0, 300, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.3));
                } else {
                    resolve(result);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function getCompressedImage(inputId) {
    const input = document.getElementById(inputId);
    if (!input || !input.files || !input.files[0]) return '';
    return await compressImage(input.files[0]);
}

async function getAllCompressedImages(inputId) {
    const input = document.getElementById(inputId);
    if (!input || !input.files || input.files.length === 0) return [];
    const results = [];
    for (const file of Array.from(input.files)) {
        const compressed = await compressImage(file);
        results.push(compressed);
    }
    return results;
}

function getPreviewImages(previewId) {
    const images = [];
    document.querySelectorAll(`#${previewId} .preview-item img`).forEach(img => {
        if (img.src) images.push(img.src);
    });
    return images;
}

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

document.getElementById('sidebarToggle').addEventListener('click', () => { document.getElementById('sidebar').classList.toggle('open'); });

document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); if (confirm('Logout?')) { localStorage.removeItem('dhebronix_admin_logged_in'); window.location.href = 'admin-login.html'; } });

function showForm(formId) { document.getElementById(formId).style.display = 'block'; document.getElementById(formId).scrollIntoView({ behavior: 'smooth' }); }
window.showForm = showForm;

function hideForm(formId) {
    document.getElementById(formId).style.display = 'none';
    // Reset form inside
    const form = document.getElementById(formId).querySelector('form');
    if (form) form.reset();
    // Clear previews
    document.querySelectorAll(`#${formId} .image-preview`).forEach(p => p.innerHTML = '');
    // Reset editing state
    editingEventId = null; editingEquipmentId = null; editingBlogId = null;
    editingTestimonialId = null; editingTeamId = null;
    originalEventImages = []; originalEquipmentImages = [];
    originalBlogImage = ''; originalTeamImage = '';
    const t = document.getElementById('eventFormTitle');
    if (t) t.innerHTML = '<i class="fas fa-calendar-plus"></i> Add New Event';
}
window.hideForm = hideForm;

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== IMAGE PREVIEW =====
function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('change', async function () {
        const preview = document.getElementById(previewId);
        for (const file of Array.from(this.files)) {
            // Show compressed preview
            const compressed = await compressImage(file);
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `<img src="${compressed}" alt="Preview"><button class="remove-preview" onclick="this.parentElement.remove()">×</button>`;
            preview.appendChild(div);
        }
        // Clear the file input after processing
        this.value = '';
    });
}
setupImagePreview('eventImages', 'eventImagePreview');
setupImagePreview('productImages', 'productImagePreview');
setupImagePreview('blogImage', 'blogImagePreview');
setupImagePreview('teamImage', 'teamImagePreview');

// ============================================
// ===== EVENTS =====
// ============================================
document.getElementById('addEventForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const isEditing = editingEventId !== null;
    showToast(isEditing ? 'Updating...' : 'Saving...');

    // Images are already compressed in preview
    let finalImages = getPreviewImages('eventImagePreview');
    if (finalImages.length === 0 && isEditing) finalImages = originalEventImages;

    const data = {
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
        success = await dbUpdate('events', editingEventId, data);
    } else {
        success = await dbAdd('events', data);
    }

    if (success) {
        showToast(isEditing ? 'Event updated!' : 'Event added!');
        hideForm('eventForm');
        loadEvents();
        updateDashboardStats();
    } else {
        showToast('Error saving! Image may be too large. Try a smaller photo.', 'error');
    }
});

async function editEvent(id) {
    const events = await dbGetAll('events');
    const item = events.find(e => e.id === id);
    if (!item) return;
    editingEventId = id;
    originalEventImages = item.images || [];
    document.getElementById('eventFormTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Event';
    showForm('eventForm');
    document.getElementById('eventTitle').value = item.title || '';
    document.getElementById('eventCategory').value = item.category || '';
    document.getElementById('eventDate').value = item.date || '';
    document.getElementById('eventVenue').value = item.venue || '';
    document.getElementById('eventGuests').value = item.guests || '';
    document.getElementById('eventEquipment').value = item.equipment || '';
    document.getElementById('eventDescription').value = item.description || '';
    document.getElementById('eventTestimonial').value = item.testimonial || '';
    const preview = document.getElementById('eventImagePreview');
    preview.innerHTML = '';
    (item.images || []).forEach(img => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `<img src="${img}" alt="Event"><button class="remove-preview" onclick="this.parentElement.remove()">×</button>`;
        preview.appendChild(div);
    });
}
window.editEvent = editEvent;
async function deleteEvent(id) { if (!confirm('Delete?')) return; await dbDelete('events', id); showToast('Deleted!', 'error'); loadEvents(); updateDashboardStats(); }
window.deleteEvent = deleteEvent;

// ============================================
// ===== EQUIPMENT =====
// ============================================
document.getElementById('addEquipmentForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const isEditing = editingEquipmentId !== null;
    showToast(isEditing ? 'Updating...' : 'Saving...');

    let finalImages = getPreviewImages('productImagePreview');
    if (finalImages.length === 0 && isEditing) finalImages = originalEquipmentImages;

    const data = {
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
    if (isEditing) { success = await dbUpdate('equipment', editingEquipmentId, data); }
    else { success = await dbAdd('equipment', data); }

    if (success) {
        showToast(isEditing ? 'Updated!' : 'Added!');
        hideForm('equipmentForm');
        loadEquipment(); updateDashboardStats();
    } else {
        showToast('Error! Try smaller image.', 'error');
    }
});

async function editEquipment(id) {
    const items = await dbGetAll('equipment');
    const item = items.find(e => e.id === id);
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
    const preview = document.getElementById('productImagePreview');
    preview.innerHTML = '';
    (item.images || []).forEach(img => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `<img src="${img}" alt=""><button class="remove-preview" onclick="this.parentElement.remove()">×</button>`;
        preview.appendChild(div);
    });
}
window.editEquipment = editEquipment;
async function deleteEquipment(id) { if (!confirm('Delete?')) return; await dbDelete('equipment', id); showToast('Deleted!', 'error'); loadEquipment(); updateDashboardStats(); }
window.deleteEquipment = deleteEquipment;

// ============================================
// ===== BLOG =====
// ============================================
document.getElementById('addBlogForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const isEditing = editingBlogId !== null;
    showToast(isEditing ? 'Updating...' : 'Publishing...');

    // Get image from preview (already compressed)
    const previewImg = document.querySelector('#blogImagePreview .preview-item img');
    let finalImage = previewImg ? previewImg.src : (isEditing ? originalBlogImage : '');

    const data = {
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
    if (isEditing) { success = await dbUpdate('blogs', editingBlogId, data); }
    else { success = await dbAdd('blogs', data); }

    if (success) {
        showToast(isEditing ? 'Updated!' : 'Published!');
        hideForm('blogForm');
        loadBlogs(); updateDashboardStats();
    } else {
        showToast('Error! Try smaller image.', 'error');
    }
});

async function editBlog(id) {
    const items = await dbGetAll('blogs');
    const item = items.find(b => b.id === id);
    if (!item) return;
    editingBlogId = id;
    originalBlogImage = item.image || '';
    showForm('blogForm');
    document.getElementById('blogTitle').value = item.title || '';
    document.getElementById('blogCategory').value = item.category || '';
    document.getElementById('blogAuthor').value = item.author || 'DHEBRONIX Team';
    document.getElementById('blogDate').value = item.date || '';
    document.getElementById('blogContent').value = item.content || '';
    document.getElementById('blogExcerpt').value = item.excerpt || '';
    document.getElementById('blogTags').value = item.tags || '';
    const preview = document.getElementById('blogImagePreview');
    preview.innerHTML = '';
    if (item.image) {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `<img src="${item.image}" alt=""><button class="remove-preview" onclick="this.parentElement.remove()">×</button>`;
        preview.appendChild(div);
    }
}
window.editBlog = editBlog;
async function deleteBlog(id) { if (!confirm('Delete?')) return; await dbDelete('blogs', id); showToast('Deleted!', 'error'); loadBlogs(); updateDashboardStats(); }
window.deleteBlog = deleteBlog;

// ============================================
// ===== TESTIMONIALS =====
// ============================================
document.getElementById('addTestimonialForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const isEditing = editingTestimonialId !== null;
    const data = { name: document.getElementById('testimonialName').value, event: document.getElementById('testimonialEvent').value, rating: document.getElementById('testimonialRating').value, text: document.getElementById('testimonialText').value };
    let success;
    if (isEditing) { success = await dbUpdate('testimonials', editingTestimonialId, data); }
    else { success = await dbAdd('testimonials', data); }
    if (success) { showToast(isEditing ? 'Updated!' : 'Added!'); hideForm('testimonialForm'); loadTestimonials(); }
});

async function editTestimonial(id) {
    const items = await dbGetAll('testimonials');
    const item = items.find(x => x.id === id);
    if (!item) return;
    editingTestimonialId = id;
    showForm('testimonialForm');
    document.getElementById('testimonialName').value = item.name || '';
    document.getElementById('testimonialEvent').value = item.event || '';
    document.getElementById('testimonialRating').value = item.rating || '5';
    document.getElementById('testimonialText').value = item.text || '';
}
window.editTestimonial = editTestimonial;
async function deleteTestimonial(id) { if (!confirm('Delete?')) return; await dbDelete('testimonials', id); showToast('Deleted!', 'error'); loadTestimonials(); }
window.deleteTestimonial = deleteTestimonial;

// ============================================
// ===== TEAM =====
// ============================================
document.getElementById('addTeamForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const isEditing = editingTeamId !== null;

    const previewImg = document.querySelector('#teamImagePreview .preview-item img');
    let finalImage = previewImg ? previewImg.src : (isEditing ? originalTeamImage : '');

    const data = { name: document.getElementById('teamName').value, role: document.getElementById('teamRole').value, linkedin: document.getElementById('teamLinkedin').value, instagram: document.getElementById('teamInstagram').value, bio: document.getElementById('teamBio').value, image: finalImage };
    let success;
    if (isEditing) { success = await dbUpdate('team', editingTeamId, data); }
    else { success = await dbAdd('team', data); }
    if (success) { showToast(isEditing ? 'Updated!' : 'Added!'); hideForm('teamForm'); loadTeam(); }
});

async function editTeamMember(id) {
    const items = await dbGetAll('team');
    const item = items.find(t => t.id === id);
    if (!item) return;
    editingTeamId = id;
    originalTeamImage = item.image || '';
    showForm('teamForm');
    document.getElementById('teamName').value = item.name || '';
    document.getElementById('teamRole').value = item.role || '';
    document.getElementById('teamLinkedin').value = item.linkedin || '';
    document.getElementById('teamInstagram').value = item.instagram || '';
    document.getElementById('teamBio').value = item.bio || '';
    const preview = document.getElementById('teamImagePreview');
    preview.innerHTML = '';
    if (item.image) {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `<img src="${item.image}" alt=""><button class="remove-preview" onclick="this.parentElement.remove()">×</button>`;
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
    const items = await dbGetAll('events'); const tbody = document.getElementById('eventsTableBody'); const empty = document.getElementById('eventsEmpty');
    if (!tbody) return;
    if (items.length === 0) { tbody.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    tbody.innerHTML = items.map(e => `<tr><td><img src="${e.images && e.images[0] ? e.images[0] : 'https://via.placeholder.com/50/111/8B1A1A?text=+'}" class="table-img"></td><td><strong>${e.title}</strong></td><td><span class="status-badge available">${e.category || ''}</span></td><td>${e.date || ''}</td><td>${e.venue || ''}</td><td><div class="table-actions"><button class="table-btn edit" onclick="editEvent('${e.id}')"><i class="fas fa-edit"></i></button><button class="table-btn delete" onclick="deleteEvent('${e.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
}

async function loadEquipment() {
    const items = await dbGetAll('equipment'); const tbody = document.getElementById('equipmentTableBody'); const empty = document.getElementById('equipmentEmpty');
    if (!tbody) return;
    if (items.length === 0) { tbody.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    tbody.innerHTML = items.map(i => `<tr><td><img src="${i.images && i.images[0] ? i.images[0] : 'https://via.placeholder.com/50/111/8B1A1A?text=+'}" class="table-img"></td><td><strong>${i.name}</strong><br><small style="color:var(--admin-text-muted)">${i.brand||''}</small></td><td>${i.category||''}</td><td style="color:var(--admin-primary-light);font-weight:600;">₦${Number(i.price||0).toLocaleString()}</td><td><span class="status-badge ${i.condition==='new'?'available':'draft'}">${i.condition||'new'}</span></td><td><span class="status-badge ${i.available!==false?'available':'sold'}">${i.available!==false?'Available':'Sold'}</span></td><td><div class="table-actions"><button class="table-btn edit" onclick="editEquipment('${i.id}')"><i class="fas fa-edit"></i></button><button class="table-btn delete" onclick="deleteEquipment('${i.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
}

async function loadBlogs() {
    const items = await dbGetAll('blogs'); const tbody = document.getElementById('blogTableBody'); const empty = document.getElementById('blogEmpty');
    if (!tbody) return;
    if (items.length === 0) { tbody.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    tbody.innerHTML = items.map(p => `<tr><td><img src="${p.image||'https://via.placeholder.com/50/111/8B1A1A?text=+'}" class="table-img"></td><td><strong>${p.title}</strong></td><td>${p.category||''}</td><td>${p.author||''}</td><td>${p.date||''}</td><td><span class="status-badge ${p.status==='published'?'published':'draft'}">${p.status||'published'}</span></td><td><div class="table-actions"><button class="table-btn edit" onclick="editBlog('${p.id}')"><i class="fas fa-edit"></i></button><button class="table-btn delete" onclick="deleteBlog('${p.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
}

async function loadTestimonials() {
    const items = await dbGetAll('testimonials'); const tbody = document.getElementById('testimonialTableBody'); const empty = document.getElementById('testimonialEmpty');
    if (!tbody) return;
    if (items.length === 0) { tbody.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    tbody.innerHTML = items.map(t => `<tr><td><strong>${t.name}</strong></td><td>${t.event}</td><td>${'⭐'.repeat(parseInt(t.rating)||5)}</td><td style="max-width:300px;">${(t.text||'').substring(0,100)}...</td><td><div class="table-actions"><button class="table-btn edit" onclick="editTestimonial('${t.id}')"><i class="fas fa-edit"></i></button><button class="table-btn delete" onclick="deleteTestimonial('${t.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
}

async function loadTeam() {
    const items = await dbGetAll('team'); const grid = document.getElementById('teamCardsGrid'); const empty = document.getElementById('teamEmpty');
    if (!grid) return;
    if (items.length === 0) { grid.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    grid.innerHTML = items.map(m => `<div class="admin-team-card"><img src="${m.image||'https://via.placeholder.com/400x200/111/8B1A1A?text=👤'}" alt="${m.name}"><h4>${m.name}</h4><p>${m.role}</p><div style="padding:0 15px 15px;display:flex;gap:8px;justify-content:center;"><button class="table-btn edit" onclick="editTeamMember('${m.id}')"><i class="fas fa-edit"></i></button><button class="table-btn delete" onclick="deleteTeamMember('${m.id}')"><i class="fas fa-trash"></i></button></div></div>`).join('');
}

// ===== SETTINGS =====
const companyForm = document.getElementById('companySettingsForm');
if (companyForm) {
    dbGetSettings('company').then(s => { if(s) { document.getElementById('companyName').value=s.name||''; document.getElementById('companyPhone').value=s.phone||''; document.getElementById('companyEmail').value=s.email||''; document.getElementById('companyAddress').value=s.address||''; document.getElementById('companyWhatsapp').value=s.whatsapp||''; }});
    companyForm.addEventListener('submit', async function(e) { e.preventDefault(); await dbSaveSettings('company', { name:document.getElementById('companyName').value, phone:document.getElementById('companyPhone').value, email:document.getElementById('companyEmail').value, address:document.getElementById('companyAddress').value, whatsapp:document.getElementById('companyWhatsapp').value }); showToast('Saved!'); });
}
const socialForm = document.getElementById('socialSettingsForm');
if (socialForm) {
    dbGetSettings('social').then(s => { if(s) { document.getElementById('socialFacebook').value=s.facebook||''; document.getElementById('socialInstagram').value=s.instagram||''; document.getElementById('socialYoutube').value=s.youtube||''; document.getElementById('socialTwitter').value=s.twitter||''; }});
    socialForm.addEventListener('submit', async function(e) { e.preventDefault(); await dbSaveSettings('social', { facebook:document.getElementById('socialFacebook').value, instagram:document.getElementById('socialInstagram').value, youtube:document.getElementById('socialYoutube').value, twitter:document.getElementById('socialTwitter').value }); showToast('Saved!'); });
}

async function updateDashboardStats() {
    const [events,equipment,blogs,messages] = await Promise.all([dbGetAll('events'),dbGetAll('equipment'),dbGetAll('blogs'),dbGetAll('messages')]);
    const el=(id)=>document.getElementById(id);
    if(el('totalEvents')) el('totalEvents').textContent=events.length;
    if(el('totalProducts')) el('totalProducts').textContent=equipment.length;
    if(el('totalBlogs')) el('totalBlogs').textContent=blogs.length;
    if(el('totalMessages')) el('totalMessages').textContent=messages.length;
}

function formatText(type) { const ta=document.getElementById('blogContent'); const s=ta.selectionStart; const e=ta.selectionEnd; const sel=ta.value.substring(s,e); let f=''; switch(type){case 'bold':f=`**${sel}**`;break;case 'italic':f=`*${sel}*`;break;case 'underline':f=`__${sel}__`;break;case 'h2':f=`\n## ${sel}\n`;break;case 'h3':f=`\n### ${sel}\n`;break;case 'ul':f=`\n- ${sel}\n`;break;case 'link':const u=prompt('URL:');if(u)f=`[${sel}](${u})`;else return;break;} ta.value=ta.value.substring(0,s)+f+ta.value.substring(e); }
window.formatText = formatText;
window.saveDraft = function() { document.getElementById('addBlogForm').dispatchEvent(new Event('submit')); };

async function loadPageData(page) { switch(page){case 'events':await loadEvents();break;case 'equipment':await loadEquipment();break;case 'blog':await loadBlogs();break;case 'testimonials':await loadTestimonials();break;case 'team':await loadTeam();break;case 'dashboard':await updateDashboardStats();break;}}

const adminNameEl = document.getElementById('adminName');
if (adminNameEl) adminNameEl.textContent = localStorage.getItem('dhebronix_admin_user') || 'Admin';

updateDashboardStats(); loadEvents(); loadEquipment(); loadBlogs(); loadTestimonials(); loadTeam();