// js/AppController.js
import { ArticleManager } from './managers/ArticleManager.js';
import { ArticleStorage } from './storage/ArticleStorage.js';
import { SyncManager } from './managers/SyncManager.js';
// 1. Capturamos los elementos del DOM (Interfaz)
const articleForm = document.getElementById('article-form');
const titleInput = document.getElementById('article-title');
const authorsInput = document.getElementById('article-authors');
const pdfInput = document.getElementById('article-pdf');
const formMessage = document.getElementById('form-message');

// 2. Función principal de inicialización
async function init() {
    console.log("AppController inicializado.");

    // --- NUEVO: REGISTRO DEL SERVICE WORKER ---
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('./sw.js');
            console.log("✅ Service Worker activo (Arquitectura PWA)");
        } catch (error) {
            console.error("❌ Error al registrar el SW:", error);
        }
    }

    // --- NUEVO: ESCUCHAR CAMBIOS DE CONEXIÓN ---
    window.addEventListener('online', () => handleNetworkChange(true));
    window.addEventListener('offline', () => handleNetworkChange(false));

    setupEventListeners();
    await SyncManager.syncArticles();
    // VALIDACIÓN DE LA HISTORIA #1
    ArticleStorage.findAll().then(articles => {
        console.log("Prueba de lectura IndexedDB:", articles);
    });
}

// 3. Configuramos los "escuchadores" de eventos
function setupEventListeners() {
    articleForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const title = titleInput.value;
        const authors = authorsInput.value;
        const file = pdfInput.files[0];

        if (!file) {
            showMessage("Por favor, selecciona un archivo PDF.", "red");
            return;
        }

        try {
            const submitBtn = articleForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = "Guardando...";

            // Llamamos a la Lógica de Negocio (Sigue funcionando igual)
            const savedArticle = await ArticleManager.createArticle(title, authors, file);
            // 2. Intenta sincronizar inmediatamente a MariaDB
            await SyncManager.syncArticles();
            
            showMessage(`¡Éxito! Guardado localmente con ID: ${savedArticle.id.split('-')[0]}...`, "green");
            articleForm.reset();

        } catch (error) {
            showMessage("Hubo un error al guardar el artículo.", "red");
            console.error(error);
        } finally {
            const submitBtn = articleForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = "Subir Artículo";
        }
    });
}

// --- NUEVO: MANEJO VISUAL DE RED ---
async function handleNetworkChange(isOnline) {
    if (isOnline) {
        showMessage("Conexión restaurada. El sistema está listo para sincronizar.", "blue");
        await SyncManager.syncArticles();
        showMessage("Datos sincronizados con el servidor.", "green");
    } else {
        alert("Estás en modo Offline. Puedes seguir trabajando, tus datos se guardan en el navegador.");
        showMessage("Trabajando sin conexión (Modo Local)", "orange");
    }
}

// 4. Función auxiliar para mostrar mensajes en la UI
function showMessage(text, color) {
    formMessage.textContent = text;
    formMessage.style.color = color;
    formMessage.hidden = false;
    
    setTimeout(() => {
        formMessage.hidden = true;
    }, 5000);
}

// Arrancamos la aplicación
init();
