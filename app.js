// Configuración de la aplicación
const APP_NAME = 'Buscador Ley de Tránsito';
const CACHE_NAME = 'buscador-ley-transito-v1';
const DATA_URL = 'ley_18290_articulos.ndjson';

// Elementos del DOM
const searchInput = document.getElementById('searchInput');
const searchForm = document.querySelector('.search-container');
const suggestionsContainer = document.getElementById('suggestions');
const resultsContainer = document.getElementById('resultsContainer');
const initialState = document.getElementById('initialState');
const loadingState = document.getElementById('loadingState');
const noResults = document.getElementById('noResults');
const installBtn = document.getElementById('installBtn');
const installBtnMobile = document.getElementById('installBtnMobile');

// Variables globales
let articles = [];
let deferredPrompt;

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar datos
    await loadArticles();
    
    // Configurar eventos
    setupEventListeners();
    
    // Configurar PWA
    setupPWA();
    
    // Mostrar sugerencias iniciales
    showInitialSuggestions();
});

// Carga los artículos desde el archivo NDJSON
async function loadArticles() {
    try {
        showLoading(true);
        const response = await fetch(DATA_URL);
        const text = await response.text();
        articles = text.split('\n')
            .filter(line => line.trim() !== '')
            .map((line, index) => {
                try {
                    const article = JSON.parse(line);
                    // Asegurarse de que el artículo tenga un número
                    if (!article.numero && article.id) {
                        article.numero = article.id;
                    }
                    return article;
                } catch (e) {
                    console.error('Error al parsear línea:', line);
                    return null;
                }
            })
            .filter(article => article !== null);
            
        console.log(`Se cargaron ${articles.length} artículos`);
        console.log('Primer artículo:', articles[0]);
    } catch (error) {
        console.error('Error al cargar los artículos:', error);
        showError('No se pudieron cargar los artículos. Intente recargar la página.');
    } finally {
        showLoading(false);
    }
}

// Configura los event listeners
function setupEventListeners() {
    // Búsqueda al escribir
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Búsqueda al hacer clic en sugerencias
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const query = e.currentTarget.querySelector('h3').textContent;
            searchInput.value = query;
            handleSearch({ target: { value: query } });
        });
    });
    
    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!searchForm.contains(e.target)) {
            suggestionsContainer.classList.add('hidden');
        }
    });
}

// Maneja la búsqueda
function handleSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    
    if (!query) {
        showInitialState();
        return;
    }
    
    // Mostrar sugerencias si hay texto
    showSuggestions(query);
    
    // Si la búsqueda tiene al menos 3 caracteres, buscar
    if (query.length >= 3) {
        searchArticles(query);
    } else {
        showInitialState();
    }
}

// Busca artículos que coincidan con la consulta
function searchArticles(query) {
    showLoading(true);
    
    // Usar setTimeout para no bloquear la UI
    setTimeout(() => {
        try {
            const results = [];
            const queryWords = query.toLowerCase().split(/\s+/);
            
            // Buscar coincidencias en los artículos
            articles.forEach(article => {
                if (!article || !article.texto) return;
                
                const text = article.texto.toLowerCase();
                const hasAllWords = queryWords.every(word => text.includes(word));
                
                if (hasAllWords) {
                    // Calcular relevancia (cuántas veces aparecen las palabras)
                    const relevance = queryWords.reduce((count, word) => {
                        const regex = new RegExp(escapeRegExp(word), 'gi');
                        const matches = text.match(regex);
                        return count + (matches ? matches.length : 0);
                    }, 0);
                    
                    results.push({ article, relevance });
                }
            });
            
            // Ordenar por relevancia
            results.sort((a, b) => b.relevance - a.relevance);
            
            // Mostrar resultados
            displayResults(results.map(r => r.article), query);
        } catch (error) {
            console.error('Error al buscar artículos:', error);
            showError('Ocurrió un error al realizar la búsqueda.');
        } finally {
            showLoading(false);
        }
    }, 100);
}

// Muestra los resultados de la búsqueda
function displayResults(results, query) {
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
        showNoResults();
        return;
    }
    
    // Ocultar estados iniciales
    initialState.classList.add('hidden');
    noResults.classList.add('hidden');
    
    // Mostrar cantidad de resultados
    const resultsCount = document.createElement('div');
    resultsCount.className = 'mb-6 text-gray-600';
    resultsCount.textContent = `Se encontraron ${results.length} resultados para "${query}"`;
    resultsContainer.appendChild(resultsCount);
    
    // Mostrar cada resultado
    results.forEach(article => {
        const resultElement = createResultElement(article, query);
        resultsContainer.appendChild(resultElement);
    });
    
    // Desplazarse suavemente a los resultados
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Crea un elemento de resultado mejorado
function createResultElement(article, query) {
    const { id, numero, seccion, texto } = article;
    const queryWords = query.toLowerCase().split(/\s+/);
    
    // Extraer el título y el contenido del artículo
    const titleMatch = texto.match(/^(.*?\n)/);
    const title = titleMatch ? titleMatch[0].trim() : `Artículo ${numero}`;
    let content = titleMatch ? texto.substring(titleMatch[0].length).trim() : texto;
    
    // Limitar la vista previa del contenido
    const previewLength = 300;
    const showMoreButton = content.length > previewLength;
    const previewContent = showMoreButton ? content.substring(0, previewLength) + '...' : content;
    
    // Resaltar términos de búsqueda en el título y contenido
    const highlightText = (text) => {
        let result = text;
        queryWords.forEach(word => {
            if (word.length > 2) {
                const regex = new RegExp(`(${escapeRegExp(word)})`, 'gi');
                result = result.replace(regex, '<span class="highlight">$1</span>');
            }
        });
        return result;
    };
    
    // Crear el elemento del artículo mejorado
    const articleElement = document.createElement('article');
    articleElement.className = 'result-card bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-200';
    articleElement.innerHTML = `
        <div class="p-6">
            <div class="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-2">
                <div class="flex items-center">
                    <div class="bg-blue-100 text-blue-800 rounded-lg p-3 mr-4">
                        <i class="fas fa-article text-xl"></i>
                    </div>
                    <div class="relative">
                        <div class="absolute -left-3 -top-3 bg-blue-100 text-blue-700 font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm transform rotate-12 shadow-sm">
                            #${article.numero || article.id}
                        </div>
                        <h2 class="text-2xl font-extrabold text-gray-800 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                            Artículo ${article.numero || article.id}
                        </h2>
                        <p class="text-sm text-gray-600 mt-1 flex items-center">
                            <i class="fas fa-tag text-blue-500 mr-1"></i>
                            ${seccion}
                        </p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-xs font-medium bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                        ${seccion.split(' ')[0]}
                    </span>
                    <button class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                        <i class="far fa-bookmark mr-1"></i>
                        Guardar
                    </button>
                </div>
            </div>
            
            <div class="ml-16">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">${highlightText(title)}</h3>
                <div class="prose max-w-none text-gray-700 mb-4">
                    <p class="whitespace-pre-line">${highlightText(previewContent)}</p>
                </div>
                
                <div class="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                    <div class="text-sm text-gray-500">
                        <span class="inline-flex items-center mr-3">
                            <i class="far fa-file-alt mr-1"></i>
                            ${content.split('\n').filter(l => l.trim() !== '').length} párrafos
                        </span>
                        <span class="inline-flex items-center">
                            <i class="far fa-keyboard mr-1"></i>
                            ${content.length} caracteres
                        </span>
                    </div>
                    
                    <div class="flex space-x-2">
                        <button class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                            <i class="fas fa-expand-alt mr-1"></i>
                            Ampliar
                        </button>
                        <button class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                            <i class="fas fa-share-alt mr-1"></i>
                            Compartir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Agregar funcionalidad al botón de ampliar
    const expandButton = articleElement.querySelector('button:first-of-type');
    expandButton.addEventListener('click', () => {
        const contentElement = articleElement.querySelector('p.whitespace-pre-line');
        if (contentElement.textContent.endsWith('...')) {
            contentElement.textContent = content;
            expandButton.innerHTML = '<i class="fas fa-compress-alt mr-1"></i> Contraer';
        } else {
            contentElement.textContent = previewContent;
            expandButton.innerHTML = '<i class="fas fa-expand-alt mr-1"></i> Ampliar';
        }
    });
    
    return articleElement;
}

// Muestra sugerencias de búsqueda
function showSuggestions(query) {
    if (!query) {
        suggestionsContainer.classList.add('hidden');
        return;
    }
    
    // Obtener sugerencias (ejemplo simple)
    const suggestions = [
        'licencia de conducir',
        'límites de velocidad',
        'sanciones de tránsito',
        'documentación vehicular',
        'seguro obligatorio',
        'alcoholemia',
        'uso del cinturón',
        'transporte escolar'
    ].filter(s => s.includes(query.toLowerCase()));
    
    // Mostrar sugerencias
    if (suggestions.length > 0) {
        suggestionsContainer.innerHTML = suggestions
            .map(s => `<div class="p-3 hover:bg-gray-50 cursor-pointer">${s}</div>`)
            .join('');
        suggestionsContainer.classList.remove('hidden');
        
        // Manejar clic en sugerencia
        suggestionsContainer.querySelectorAll('div').forEach((item, index) => {
            item.addEventListener('click', () => {
                searchInput.value = suggestions[index];
                suggestionsContainer.classList.add('hidden');
                searchArticles(suggestions[index]);
            });
        });
    } else {
        suggestionsContainer.classList.add('hidden');
    }
}

// Muestra sugerencias iniciales
function showInitialSuggestions() {
    // Implementar lógica para mostrar sugerencias basadas en búsquedas populares
}

// Muestra el estado de carga
function showLoading(show) {
    if (show) {
        loadingState.classList.remove('hidden');
        resultsContainer.innerHTML = '';
        initialState.classList.add('hidden');
        noResults.classList.add('hidden');
    } else {
        loadingState.classList.add('hidden');
    }
}

// Muestra el estado inicial
function showInitialState() {
    initialState.classList.remove('hidden');
    resultsContainer.innerHTML = '';
    noResults.classList.add('hidden');
}

// Muestra el estado de sin resultados
function showNoResults() {
    noResults.classList.remove('hidden');
    resultsContainer.innerHTML = '';
    initialState.classList.add('hidden');
}

// Muestra un mensaje de error
function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative';
    errorElement.innerHTML = `
        <strong class="font-bold">¡Error!</strong>
        <span class="block sm:inline">${message}</span>
    `;
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(errorElement);
}

// Configura la funcionalidad PWA
function setupPWA() {
    // Detectar si el navegador soporta PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful');
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
    
    // Manejar el evento beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevenir que Chrome 67 y versiones anteriores muestren automáticamente el prompt
        e.preventDefault();
        // Guardar el evento para que se pueda activar más tarde
        deferredPrompt = e;
        // Mostrar botones de instalación
        installBtn.style.display = 'flex';
        installBtnMobile.style.display = 'flex';
    });
    
    // Manejar clic en el botón de instalación
    installBtn.addEventListener('click', installApp);
    installBtnMobile.addEventListener('click', installApp);
}

// Instala la aplicación
function installApp() {
    if (!deferredPrompt) return;
    
    // Mostrar el prompt de instalación
    deferredPrompt.prompt();
    
    // Esperar a que el usuario responda al prompt
    deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
            console.log('Usuario aceptó la instalación');
        } else {
            console.log('Usuario rechazó la instalación');
        }
        
        // Limpiar el prompt guardado
        deferredPrompt = null;
        
        // Ocultar botones de instalación
        installBtn.style.display = 'none';
        installBtnMobile.style.display = 'none';
    });
}

// Utilidades
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
