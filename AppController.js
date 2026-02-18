// js/AppController.js
import { ArticleManager } from './managers/ArticleManager.js';
import { ArticleStorage } from './storage/ArticleStorage.js';

// 1. Capturamos los elementos del DOM (Interfaz)
const articleForm = document.getElementById('article-form');
const titleInput = document.getElementById('article-title');
const authorsInput = document.getElementById('article-authors');
const pdfInput = document.getElementById('article-pdf');
const formMessage = document.getElementById('form-message');

// 2. Función principal de inicialización
function init() {
    console.log("AppController inicializado.");
    setupEventListeners();
    // VALIDACIÓN DE LA HISTORIA #1
    ArticleStorage.findAll().then(articles => {
        console.log("Prueba de lectura IndexedDB:", articles);
    });
}

// 3. Configuramos los "escuchadores" de eventos
function setupEventListeners() {
    // Escuchar el evento "submit" del formulario de carga de artículos
    articleForm.addEventListener('submit', async (event) => {
        // Evitamos que la página se recargue (comportamiento por defecto de HTML)
        event.preventDefault();

        // Extraemos los valores
        const title = titleInput.value;
        const authors = authorsInput.value;
        const file = pdfInput.files[0]; // Capturamos el archivo PDF

        // Validamos que haya un archivo (por seguridad extra)
        if (!file) {
            showMessage("Por favor, selecciona un archivo PDF.", "red");
            return;
        }

        try {
            // Deshabilitamos el botón mientras guarda
            const submitBtn = articleForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = "Guardando...";

            // Llamamos a la Lógica de Negocio
            const savedArticle = await ArticleManager.createArticle(title, authors, file);

            // Si llegamos aquí, fue un éxito
            showMessage(`¡Éxito! Artículo guardado localmente con ID: ${savedArticle.id.split('-')[0]}...`, "green");
            
            // Limpiamos el formulario
            articleForm.reset();

        } catch (error) {
            // Manejo de errores
            showMessage("Hubo un error al guardar el artículo.", "red");
            console.error(error);
        } finally {
            // Restauramos el botón
            const submitBtn = articleForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = "Subir Artículo";
        }
    });
}

// 4. Función auxiliar para mostrar mensajes en la UI
function showMessage(text, color) {
    formMessage.textContent = text;
    formMessage.style.color = color;
    formMessage.hidden = false;
    
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        formMessage.hidden = true;
    }, 5000);
}

// Arrancamos la aplicación
init();