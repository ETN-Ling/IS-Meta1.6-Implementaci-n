// js/managers/ArticleManager.js
import { ArticleStorage } from '../storage/ArticleStorage.js';

export const ArticleManager = {
     async createArticle(title, authors, file) {
        try {
            // 1. Validar que el archivo exista
            if (!file) {
                throw new Error("Debes seleccionar un archivo PDF.");
            }
            // 2. Validar que sea estrictamente un PDF
            if (file.type !== 'application/pdf') {
                throw new Error("Formato no permitido. Solo se aceptan archivos PDF.");
            }
            // 3. Validar tamaño máximo (Ejemplo: 5MB)
            const MAX_SIZE_MB = 20;
            const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
            if (file.size > MAX_SIZE_BYTES) {
                throw new Error(`El archivo es demasiado grande. El límite es de ${MAX_SIZE_MB}MB.`);
            }// Construir el objeto Artículo
            const newArticle = {
                id: Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9), 
                title: title.trim(),
                authors: authors.trim(),
                status: 'recibido',
                file: file, // El PDF se guarda como Blob en IndexedDB
                synced: false, // Importante para que el SyncManager sepa que debe subirlo
                createdAt: new Date().toISOString()
            };

            // Delegar la persistencia a la capa de Storage
            await ArticleStorage.save(newArticle);

            return newArticle;
            
        } catch (error) {
            console.error("Error en ArticleManager:", error.message);
            throw error; 
        }
    }
};
