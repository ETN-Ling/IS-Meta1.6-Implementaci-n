// js/managers/SyncManager.js
import { ArticleStorage } from '../storage/ArticleStorage.js';

export const SyncManager = {
    async syncArticles() {
        if (!navigator.onLine) return;

        const allArticles = await ArticleStorage.findAll();
        const pending = allArticles.filter(art => !art.synced);

        if (pending.length === 0) return;

        console.log(`🔄 Sincronizando ${pending.length} artículos pendientes...`);

        for (const article of pending) {
            try {
                const response = await fetch('http://10.21.43.116:3000/api/articles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(article)
                });

                if (response.ok) {
                    await ArticleStorage.markAsSynced(article.id);
                    console.log(`Articulo ${article.id} sincronizado con MariaDB`);
                }
            } catch (error) {
                console.error("Falló la sincronización para el artículo:", article.id);
            }
        }
    },

    async fetchServerArticles() {
        try {
            const response = await fetch('http://10.21.43.116:3000/api/articles');
            if (!response.ok) throw new Error("Error en la respuesta del servidor");
            
            const articles = await response.json();
            return articles;
        } catch (error) {
            console.error("No se pudieron obtener artículos del servidor:", error);
            return []; // Devolvemos lista vacía para evitar errores en la UI
        }
    },

    async updateArticleStatus(id, newStatus) {
        try {
            // Usamos la misma IP que ya tienes funcionando arriba
            const response = await fetch(`http://10.21.43.116:3000/api/articles/${id}/status`, {
                method: 'PUT', // PUT porque estamos modificando algo que ya existe
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (!response.ok) throw new Error("Error al actualizar en el servidor");
            return true; // Retorna true si todo salió bien
        } catch (error) {
            console.error("Error al cambiar estado:", error);
            return false;
        }
    }
};
