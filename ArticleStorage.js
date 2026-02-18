// js/storage/ArticleStorage.js

const DB_NAME = 'PeerReviewDB';
const DB_VERSION = 1;
const STORE_NAME = 'articles';

export const ArticleStorage = {
    // 1. Inicializar la base de datos
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            // onupgradeneeded se ejecuta la primera vez que se crea la DB 
            // o si cambiamos el DB_VERSION
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Creamos la "tabla" (Object Store) para los artículos si no existe
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    console.log(`Object Store '${STORE_NAME}' creado.`);
                }
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                console.error("IndexedDB Error:", event.target.error);
                reject(event.target.error);
            };
        });
    },
    // 2. Guardar un artículo en la base de datos
    async save(article) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await this.init();
                // Abrimos una transacción de lectura/escritura
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                
                // Usamos put() en lugar de add() para que sirva tanto para crear como para actualizar
                const request = store.put(article); 

                request.onsuccess = () => {
                    console.log(`Artículo ${article.id} guardado con éxito.`);
                    resolve(article.id);
                };

                request.onerror = (event) => {
                    console.error("Error guardando artículo:", event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    },
    // --- NUEVO MÉTODO PARA LA HISTORIA TÉCNICA #1 ---
    /**
     * Recupera todos los artículos guardados en la base de datos local.
     * @returns {Promise<Array>} Un array con los objetos de los artículos.
     */
    async findAll() {
        return new Promise(async (resolve, reject) => {
            try {
                // 1. Aseguramos que la DB esté inicializada
                const db = await this.init();
                
                // 2. Abrimos una transacción de "solo lectura"
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                
                // 3. Usamos getAll() para traer todos los registros
                const request = store.getAll();

                // 4. Resolvemos o rechazamos la promesa según el resultado
                request.onsuccess = (event) => {
                    // Si no hay datos, result es undefined, devolvemos un array vacío []
                    const articles = event.target.result || [];
                    console.log(`Recuperados ${articles.length} artículos de la base de datos.`);
                    resolve(articles);
                };

                request.onerror = (event) => {
                    console.error("Error al recuperar los artículos:", event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }
};