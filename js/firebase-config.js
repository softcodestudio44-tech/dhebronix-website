// ===== DHEBRONIX - FIREBASE CONFIGURATION =====
// This connects your website to Firebase database

// Firebase CDN imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAi1X6DplE5PwxgS_9274KqZKjGDrBDVQA",
    authDomain: "dhebronix-website.firebaseapp.com",
    projectId: "dhebronix-website",
    storageBucket: "dhebronix-website.firebasestorage.app",
    messagingSenderId: "236667482363",
    appId: "1:236667482363:web:178fa15ad4e0d591c9405e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== DATABASE HELPER FUNCTIONS =====

// GET all documents from a collection
async function dbGetAll(collectionName) {
    try {
        const q = query(collection(db, collectionName));
        const snapshot = await getDocs(q);
        const data = [];
        snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data;
    } catch (error) {
        console.error(`Error getting ${collectionName}:`, error);
        return [];
    }
}

// GET single document
async function dbGetOne(collectionName, docId) {
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error(`Error getting ${collectionName}/${docId}:`, error);
        return null;
    }
}

// ADD document
async function dbAdd(collectionName, data) {
    try {
        const docId = Date.now().toString();
        const docRef = doc(db, collectionName, docId);
        await setDoc(docRef, { ...data, createdAt: new Date().toISOString() });
        return docId;
    } catch (error) {
        console.error(`Error adding to ${collectionName}:`, error);
        return null;
    }
}

// UPDATE document
async function dbUpdate(collectionName, docId, data) {
    try {
        const docRef = doc(db, collectionName, docId.toString());
        await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
        return true;
    } catch (error) {
        console.error(`Error updating ${collectionName}/${docId}:`, error);
        // If document doesn't exist, create it
        try {
            const docRef = doc(db, collectionName, docId.toString());
            await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
            return true;
        } catch (err) {
            console.error(`Error creating ${collectionName}/${docId}:`, err);
            return false;
        }
    }
}

// DELETE document
async function dbDelete(collectionName, docId) {
    try {
        const docRef = doc(db, collectionName, docId.toString());
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error(`Error deleting ${collectionName}/${docId}:`, error);
        return false;
    }
}

// SAVE settings (single document)
async function dbSaveSettings(settingsName, data) {
    try {
        const docRef = doc(db, "settings", settingsName);
        await setDoc(docRef, data);
        return true;
    } catch (error) {
        console.error(`Error saving settings:`, error);
        return false;
    }
}

// GET settings
async function dbGetSettings(settingsName) {
    try {
        const docRef = doc(db, "settings", settingsName);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error(`Error getting settings:`, error);
        return null;
    }
}

// Export everything
export { db, dbGetAll, dbGetOne, dbAdd, dbUpdate, dbDelete, dbSaveSettings, dbGetSettings };