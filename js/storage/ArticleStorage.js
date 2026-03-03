const DB_NAME = 'PeerReviewDB';
const DB_VERSION = 1;
const STORE_NAME = 'articles';

export const ArticleStorage = {
    // 1. Inicializar la base de datos (Sin cambios)
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    console.log(`Object Store '${STORE_NAME}' creado.`);
                }
            };

            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    },

    // 2. Guardar un artículo (CON FLAG DE SINCRONIZACIÓN)
    async save(article) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await this.init();
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                
                // --- CAMBIO AQUÍ: Agregamos el estado 'synced' ---
                const articleToSave = {
                    ...article,
                    synced: article.synced || false, // Si no viene, es false por defecto
                    updatedAt: new Date().toISOString()
                };

                const request = store.put(articleToSave); 

                request.onsuccess = () => {
                    console.log(`Artículo ${article.id} guardado localmente (Sincronizado: ${articleToSave.synced}).`);
                    resolve(articleToSave); // Devolvemos el objeto completo
                };

                request.onerror = (event) => reject(event.target.error);
            } catch (error) {
                reject(error);
            }
        });
    },

    // 3. NUEVO MÉTODO: Marcar como sincronizado
    /**
     * Cambia el estado de un artículo a synced: true después de subirlo a MariaDB.
     */
    async markAsSynced(id) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await this.init();
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                
                const getRequest = store.get(id);

                getRequest.onsuccess = () => {
                    const article = getRequest.result;
                    if (article) {
                        article.synced = true;
                        store.put(article); // Actualizamos el registro
                        resolve();
                    } else {
                        reject("Artículo no encontrado para sincronizar.");
                    }
                };
            } catch (error) {
                reject(error);
            }
        });
    },

    // 4. Recuperar todos los artículos (Sin cambios)
    async findAll() {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await this.init();
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAll();

                request.onsuccess = (event) => {
                    const articles = event.target.result || [];
                    resolve(articles);
                };

                request.onerror = (event) => reject(event.target.error);
            } catch (error) {
                reject(error);
            }
        });
    }
};
