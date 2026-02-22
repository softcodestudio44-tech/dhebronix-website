// ===== DHEBRONIX - FIREBASE CONFIG (FINAL) =====

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, deleteDoc, query } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAi1X6DplE5PwxgS_9274KqZKjGDrBDVQA",
    authDomain: "dhebronix-website.firebaseapp.com",
    projectId: "dhebronix-website",
    storageBucket: "dhebronix-website.firebasestorage.app",
    messagingSenderId: "236667482363",
    appId: "1:236667482363:web:178fa15ad4e0d591c9405e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function dbGetAll(collectionName) {
    try {
        const snapshot = await getDocs(query(collection(db, collectionName)));
        const data = [];
        snapshot.forEach(d => data.push({ id: d.id, ...d.data() }));
        return data;
    } catch (error) {
        console.error(`Error getting ${collectionName}:`, error);
        return [];
    }
}

async function dbGetOne(collectionName, docId) {
    try {
        const docSnap = await getDoc(doc(db, collectionName, docId.toString()));
        if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
        return null;
    } catch (error) {
        console.error(`Error:`, error);
        return null;
    }
}

async function dbAdd(collectionName, data) {
    try {
        const docId = Date.now().toString();
        await setDoc(doc(db, collectionName, docId), { ...data, createdAt: new Date().toISOString() });
        return docId;
    } catch (error) {
        console.error(`Error adding:`, error);
        return null;
    }
}

async function dbUpdate(collectionName, docId, data) {
    try {
        await setDoc(doc(db, collectionName, docId.toString()), { ...data, updatedAt: new Date().toISOString() });
        return true;
    } catch (error) {
        console.error(`Error updating:`, error);
        return false;
    }
}

async function dbDelete(collectionName, docId) {
    try {
        await deleteDoc(doc(db, collectionName, docId.toString()));
        return true;
    } catch (error) {
        console.error(`Error deleting:`, error);
        return false;
    }
}

async function dbSaveSettings(settingsName, data) {
    try {
        await setDoc(doc(db, "settings", settingsName), data);
        return true;
    } catch (error) {
        console.error(`Error:`, error);
        return false;
    }
}

async function dbGetSettings(settingsName) {
    try {
        const docSnap = await getDoc(doc(db, "settings", settingsName));
        if (docSnap.exists()) return docSnap.data();
        return null;
    } catch (error) {
        console.error(`Error:`, error);
        return null;
    }
}

export { db, dbGetAll, dbGetOne, dbAdd, dbUpdate, dbDelete, dbSaveSettings, dbGetSettings };