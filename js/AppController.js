// js/AppController.js
import { ArticleManager } from './managers/ArticleManager.js';
import { ArticleStorage } from './storage/ArticleStorage.js';
import { SyncManager } from './managers/SyncManager.js';

const articleForm = document.getElementById('article-form');
const titleInput = document.getElementById('article-title');
const authorsInput = document.getElementById('article-authors');
const pdfInput = document.getElementById('article-pdf');
const formMessage = document.getElementById('form-message');

async function init() {
    console.log("🚀 AppController inicializado.");

    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('./sw.js');
            console.log("Service Worker activo");
        } catch (error) {
            console.error("Error al registrar el SW:", error);
        }
    }

    window.addEventListener('online', () => handleNetworkChange(true));
    window.addEventListener('offline', () => handleNetworkChange(false));

    setupEventListeners();
    await SyncManager.syncArticles();
}

function setupEventListeners() {
    // --- ENVÍO DE FORMULARIO ---
    articleForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const title = titleInput.value;
        const authors = authorsInput.value;
        const file = pdfInput.files[0];

        try {
            const submitBtn = articleForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = "Guardando...";

            const savedArticle = await ArticleManager.createArticle(title, authors, file);
            await SyncManager.syncArticles();
            
            showMessage(`¡Éxito! Guardado localmente con ID: ${savedArticle.id.split('-')[0]}...`, "green");
            articleForm.reset();
        } catch (error) {
            showMessage(error.message, "red");
        } finally {
            const submitBtn = articleForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = "Subir Artículo";
        }
    });

    // --- CAMBIO DE ROL ---
    const roleSelector = document.getElementById('role-selector');
    const viewAuthor = document.getElementById('view-article-form');
    const viewDashboard = document.getElementById('view-dashboard');

    roleSelector.addEventListener('change', async (e) => {
        const selectedRole = e.target.value;
        console.log("Cambiando a rol:", selectedRole);

        // Si es Editor o Revisor, muestran la tabla (Dashboard)
        if (selectedRole === 'Editor' || selectedRole === 'Reviewer' || selectedRole === 'Revisor') {
            viewAuthor.hidden = true;
            viewDashboard.hidden = false;
            await loadDashboardData(); // Recargamos la tabla para aplicar los filtros de rol
        } else {
            // Si es Autor, muestra el formulario
            viewAuthor.hidden = false;
            viewDashboard.hidden = true;
        }
    });

    document.getElementById('btn-refresh-dashboard')?.addEventListener('click', loadDashboardData);
}

async function loadDashboardData() {
    const tbody = document.getElementById('articles-table-body');
    if (!tbody) return;

    // Saber qué rol está activo en este momento
    const currentRole = document.getElementById('role-selector').value;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Consultando servidor...</td></tr>';

    // Traemos TODOS los artículos del servidor
    const allArticles = await SyncManager.fetchServerArticles();

    // 1. Filtrar los artículos según el rol
    let articlesToShow = allArticles;
    
    if (currentRole === 'Reviewer' || currentRole === 'Revisor') {
        // El revisor ahora verá "recibido", "en revision" y "en espera"
        articlesToShow = allArticles.filter(art => 
            art.status === 'recibido' || 
            art.status === 'en revision' || 
            art.status === 'en espera'
        );
    }

    if (articlesToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay artículos disponibles para tu rol.</td></tr>';
        return;
    }

    // 2. Pintar la tabla con el botón correcto
    tbody.innerHTML = ''; 
    articlesToShow.forEach(art => {
        let botonAccion = '';

        if (currentRole === 'Editor') {
            botonAccion = `<button class="btn-view" onclick="window.revisarArticulo('${art.id}', '${art.title}')">Revisar</button>`;
        } else if (currentRole === 'Reviewer' || currentRole === 'Revisor') {
            botonAccion = `<button class="btn-view" style="background-color: #10b981;" onclick="window.evaluarArticulo('${art.id}', '${art.title}')">Evaluar</button>`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 10px; color: #666;">${art.id.substring(0, 8)}</td>
            <td style="padding: 10px;"><strong>${art.title}</strong></td>
            <td style="padding: 10px;">${art.authors}</td>
            <td style="padding: 10px;"><span class="status-badge status-${art.status}">${art.status}</span></td>
            <td style="padding: 10px;">
                ${botonAccion}
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function handleNetworkChange(isOnline) {
    if (isOnline) {
        showMessage("En línea - Sincronizando...", "blue");
        await SyncManager.syncArticles();
    } else {
        showMessage("Modo Offline activo", "orange");
    }
}

function showMessage(text, color) {
    formMessage.textContent = text;
    formMessage.style.color = color;
    formMessage.hidden = false;
    setTimeout(() => { formMessage.hidden = true; }, 5000);
}
// Función para el Editor
window.revisarArticulo = async function(id, title) {
    const nuevoEstado = prompt(`Revisando (Editor): "${title}"\nEscribe el nuevo estado (ej. aceptado, rechazado, en revision):`);
    
    if (nuevoEstado && nuevoEstado.trim() !== "") {
        const exito = await SyncManager.updateArticleStatus(id, nuevoEstado.trim().toLowerCase());
        if (exito) {
            alert("¡Estado actualizado con éxito!");
            await loadDashboardData();
        } else {
            alert("Hubo un error al actualizar el estado.");
        }
    }
};

// Función para el Revisor
window.evaluarArticulo = async function(id, title) {
    const veredicto = prompt(`📝 Evaluando (Revisor): "${title}"\nIngresa tu veredicto (ej. aprobado, requiere cambios, rechazado):`);
    
    if (veredicto && veredicto.trim() !== "") {
        const exito = await SyncManager.updateArticleStatus(id, veredicto.trim().toLowerCase());
        if (exito) {
            alert("¡Evaluación enviada con éxito al Editor!");
            await loadDashboardData(); 
        } else {
            alert("Error al enviar la evaluación.");
        }
    }
};

init();
