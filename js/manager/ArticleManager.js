// js/managers/ArticleManager.js
import { ArticleStorage } from '../storage/ArticleStorage.js';

export const ArticleManager = {
    /**
     * Crea un nuevo artículo, le asigna metadatos automáticos y lo guarda.
     * @param {string} title - Título del artículo
     * @param {string} authors - Nombres de los autores
     * @param {File} file - Objeto File/Blob del PDF
     * @returns {Promise<Object>} El objeto artículo creado
     */
    async createArticle(title, authors, file) {
        try {
            // 1. Construir el objeto Artículo (Aplicando reglas de negocio)
            const newArticle = {
                // crypto.randomUUID() es una API nativa del navegador para generar IDs únicos
                id: crypto.randomUUID(), 
                title: title.trim(),
                authors: authors.trim(),
                status: 'recibido', // Todo artículo nuevo entra con este estado por defecto
                file: file,         // Guardamos el PDF directamente
                createdAt: new Date().toISOString()
            };

            // 2. Delegar la persistencia a la capa de Storage
            await ArticleStorage.save(newArticle);

            // 3. Retornar el artículo por si el Controller necesita mostrar información (ej. el ID)
            return newArticle;
            
        } catch (error) {
            console.error("Error en ArticleManager al crear artículo:", error);
            // Lanzamos el error para que el Controller lo maneje y muestre en la UI
            throw new Error("No se pudo guardar el artículo localmente."); 
        }
    }
};
