// js/managers/SyncManager.js
import { ArticleStorage } from '../storage/ArticleStorage.js';

export const SyncManager = {
    async syncArticles() {
        if (!navigator.onLine) return; // Si no hay internet, ni lo intentamos

        const allArticles = await ArticleStorage.findAll();
        const pending = allArticles.filter(art => !art.synced);

        if (pending.length === 0) return;

        console.log(`🔄 Sincronizando ${pending.length} artículos pendientes...`);

        for (const article of pending) {
            try {
                const response = await fetch('http://localhost:3000/api/articles', {
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
    }
};