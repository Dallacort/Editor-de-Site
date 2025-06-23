/**
 * HARDEM Editor Utils - Módulo de Utilitários
 * Funções auxiliares e utilitárias compartilhadas
 * @version 1.0.0
 */

class HardemEditorUtils {
    constructor(core) {
        this.core = core;
    }

    /**
     * Verificar se elemento pertence ao editor
     */
    isEditorElement(element) {
        if (!element) return false;
        
        const editorSelectors = [
            '.hardem-editor-toolbar',
            '.hardem-editor-sidepanel',
            '.hardem-alert',
            '.hardem-processing-overlay',
            '#hardem-editor-styles'
        ];
        
        return editorSelectors.some(selector => {
            try {
                return element.matches(selector) || element.closest(selector);
            } catch (e) {
                return false;
            }
        });
    }

    /**
     * Verificar se um elemento é um container de menu de serviço que não deve ser editável
     */
    isServiceMenuContainer(element) {
        // Verificar se é um container de serviço não editável
        return (element.classList.contains('single-service-menu') ||
               element.classList.contains('service-mega-menu-style') ||
               element.classList.contains('row') && element.closest('.service-mega-menu-style') ||
               element.classList.contains('col-lg-12') && element.closest('.service-mega-menu-style') ||
               element.classList.contains('container') && element.closest('.service-mega-menu-style') ||
               element.classList.contains('icon') && !element.querySelector('img') && element.closest('.service-mega-menu-style'));
    }

    /**
     * Verificar se elemento é editável
     */
    isElementEditable(element) {
        if (!element) return false;
        
        // Elementos do editor não são editáveis
        if (this.isEditorElement(element)) return false;
        
        // Elementos com data-no-edit não são editáveis
        if (element.hasAttribute('data-no-edit')) return false;
        
        // Containers de serviço não são editáveis
        if (this.isServiceMenuContainer(element)) return false;
        
        // Verificar se corresponde aos seletores editáveis
        return this.core.editableSelectors.some(selector => {
            try {
                return element.matches(selector);
            } catch (e) {
                return false;
            }
        }) || element.tagName === 'IMG' || this.hasBackgroundImage(element);
    }

    /**
     * Verificar se elemento tem imagem de background
     */
    hasBackgroundImage(element) {
        const computedStyle = getComputedStyle(element);
        const backgroundImage = element.style.backgroundImage || computedStyle.backgroundImage;
        return backgroundImage && backgroundImage !== 'none' && !backgroundImage.includes('gradient');
    }

    /**
     * Gerar data-key único para elemento
     */
    generateDataKey(element) {
        // Coletar informações únicas do elemento
        const tagName = element.tagName.toLowerCase();
        const className = element.className ? element.className.replace(/\s+/g, '-') : '';
        const id = element.id || '';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5);
        
        // Tentar identificar contexto do elemento (slide, card, etc.)
        const context = this.getElementContext(element);
        
        // Gerar base do key
        let baseKey = '';
        
        if (id) {
            baseKey = `${tagName}-${id}`;
        } else if (className) {
            baseKey = `${tagName}-${className}`;
        } else {
            baseKey = `${tagName}-${context}`;
        }
        
        // Adicionar timestamp e random para unicidade
        const uniqueKey = `${baseKey}-${timestamp}-${random}`;
        
        // Verificar se já existe e gerar alternativo se necessário
        return this.ensureUniqueDataKey(uniqueKey, element);
    }

    /**
     * Garantir que data-key seja único
     */
    ensureUniqueDataKey(proposedKey, element) {
        const maxAttempts = 100;
        let attempt = 0;
        let finalKey = proposedKey;
        
        while (attempt < maxAttempts) {
            // Verificar se key já existe em elemento diferente
            const existingElement = document.querySelector(`[data-key="${finalKey}"]`);
            
            if (!existingElement || existingElement === element) {
                // Key é único ou pertence ao mesmo elemento
                break;
            }
            
            // Gerar nova variação
            attempt++;
            const randomSuffix = Math.random().toString(36).substr(2, 3);
            finalKey = `${proposedKey}-${attempt}-${randomSuffix}`;
        }
        
        if (attempt >= maxAttempts) {
            console.warn('Não foi possível gerar data-key único após 100 tentativas');
            finalKey = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
        }
        
        return finalKey;
    }

    /**
     * Obter contexto do elemento (slide, card, section, etc.)
     */
    getElementContext(element) {
        // Verificar se está em slide
        if (element.closest('.swiper-slide, .carousel-item, .slide')) {
            const slideElement = element.closest('.swiper-slide, .carousel-item, .slide');
            const slideIndex = this.getSlideIndex(slideElement);
            return `slide${slideIndex}`;
        }
        
        // Verificar se está em card
        if (element.closest('.card, .item, .box')) {
            return 'card';
        }
        
        // Verificar se está em section específica
        const section = element.closest('section, article, div[class*="section"]');
        if (section) {
            const sectionClass = section.className ? section.className.split(' ')[0] : 'section';
            return sectionClass;
        }
        
        // Posição no DOM como último recurso
        const siblings = Array.from(element.parentElement?.children || []);
        const index = siblings.indexOf(element);
        return `pos${index}`;
    }

    /**
     * Obter índice do slide
     */
    getSlideIndex(slideElement) {
        if (!slideElement) return 0;
        
        const parent = slideElement.parentElement;
        const slides = Array.from(parent.children).filter(child => 
            child.classList.contains('swiper-slide') ||
            child.classList.contains('carousel-item') ||
            child.classList.contains('slide') ||
            child.classList.contains('owl-item') ||
            child.classList.contains('item')
        );
        
        return slides.indexOf(slideElement);
    }

    /**
     * Gerar data-key único com contexto específico
     */
    generateUniqueDataKey(element) {
        const tagName = element.tagName.toLowerCase();
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5);
        
        // Incluir informações do contexto para tornar mais específico
        let context = '';
        
        // Verificar contexto de carrossel PRIMEIRO (mais específico)
        if (element.closest('.banner-swiper-main-wrapper-four')) {
            context = 'banner_carousel_';
        } else if (element.closest('.mySwiper-banner-four')) {
            context = 'main_carousel_';
        } else if (element.closest('.mySwiper-thumbnail')) {
            context = 'thumb_carousel_';
        } else if (element.closest('.swiper')) {
            context = 'carousel_';
        } else if (element.closest('header')) {
            context = 'header_';
        } else if (element.closest('footer')) {
            context = 'footer_';
        } else if (element.closest('.about')) {
            context = 'about_';
        } else if (element.closest('.service')) {
            context = 'service_';
        } else if (element.closest('.our-working-process-area-4')) {
            context = 'our-workin_'; // Prefixo específico para essa seção
        } else if (element.closest('.single-right-content')) {
            context = 'single-rig_'; // Prefixo específico para essa seção
        } else if (element.closest('.banner')) {
            context = 'banner_';
        }
        
        // Incluir classe principal se existir
        if (element.className) {
            const mainClass = element.className.trim().split(/\s+/)[0];
            if (mainClass && mainClass.length > 0) {
                context += mainClass.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '') + '_';
            }
        }
        
        // Se tem ID, incluir parte dele
        if (element.id) {
            context += element.id.substring(0, 8) + '_';
        }
        
        return `${context}${tagName}_${timestamp}_${random}`;
    }

    /**
     * Obter texto direto do elemento (apenas filhos de texto)
     */
    getDirectTextContent(element) {
        let text = '';
        
        for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            }
        }
        
        return text.trim();
    }

    /**
     * Obter descrição do tipo de elemento
     */
    getElementTypeDescription(element) {
        const tagName = element.tagName.toLowerCase();
        
        const descriptions = {
            'h1': 'Título Principal (H1)',
            'h2': 'Título Secundário (H2)', 
            'h3': 'Título Terciário (H3)',
            'h4': 'Título H4',
            'h5': 'Título H5',
            'h6': 'Título H6',
            'p': 'Parágrafo',
            'span': 'Texto Inline',
            'div': 'Div',
            'a': 'Link',
            'button': 'Botão',
            'img': 'Imagem',
            'li': 'Item de Lista',
            'td': 'Célula de Tabela',
            'th': 'Cabeçalho de Tabela',
            'label': 'Rótulo',
            'figcaption': 'Legenda'
        };
        
        let desc = descriptions[tagName] || tagName.toUpperCase();
        
        // Adicionar classes se houver
        if (element.className) {
            const classes = element.className.split(' ')
                .filter(cls => !cls.startsWith('hardem-'))
                .slice(0, 2)
                .join(', ');
            if (classes) {
                desc += ` (.${classes})`;
            }
        }
        
        return desc;
    }

    /**
     * Obter localização do elemento na página
     */
    getElementLocation(element) {
        if (element.closest('.swiper')) return 'Carrossel';
        if (element.closest('header')) return 'Cabeçalho';
        if (element.closest('footer')) return 'Rodapé';
        if (element.closest('.banner')) return 'Banner';
        if (element.closest('.about')) return 'Seção Sobre';
        if (element.closest('.service')) return 'Seção Serviços';
        if (element.closest('.contact')) return 'Seção Contato';
        return 'Conteúdo Principal';
    }

    /**
     * Detectar seção da página baseada na posição Y
     */
    detectPageSection(y) {
        const pageHeight = document.documentElement.scrollHeight;
        const percentage = (y / pageHeight) * 100;
        
        if (percentage < 10) return 'Topo';
        if (percentage < 30) return 'Header';
        if (percentage < 70) return 'Meio';
        if (percentage < 90) return 'Rodapé';
        return 'Final';
    }

    /**
     * Coletar informações detalhadas do elemento
     */
    collectElementInfo(element) {
        // Coletar todos os atributos importantes, não apenas data-*
        const allAttributes = {};
        for (const attr of element.attributes) {
            if (attr.name !== 'data-key' && !attr.name.startsWith('hardem-')) {
                allAttributes[attr.name] = attr.value;
            }
        }

        // Informações específicas para mapeamento entre páginas
        const headerInfo = this.getHeaderMappingInfo(element);

        // NOVO: Informações específicas para elementos de dropdown
        const dropdownInfo = this.getDropdownInfo(element);

        return {
            tagName: element.tagName.toLowerCase(),
            className: element.className,
            id: element.id,
            textContent: this.getDirectTextContent(element),
            attributes: allAttributes, // Todos os atributos, não apenas data-*
            cssSelector: this.generateCSSSelector(element),
            xpath: this.generateXPath(element), // Usar a nova função generateXPath
            pathFromBody: this.getElementPath(element),
            position: {
                x: element.getBoundingClientRect().left,
                y: element.getBoundingClientRect().top
            },
            // Informações adicionais para melhor identificação
            parentInfo: {
                tagName: element.parentElement?.tagName.toLowerCase(),
                className: element.parentElement?.className,
                id: element.parentElement?.id
            },
            // Informações específicas para header
            headerMappingInfo: headerInfo,
            isInHeader: element.closest('header') !== null,
            
            // NOVO: Informações específicas para dropdown
            dropdownInfo: dropdownInfo,
            isInDropdown: dropdownInfo.isInDropdown,
            
            childIndex: Array.from(element.parentElement?.children || []).indexOf(element),
            siblingCount: element.parentElement?.children.length || 0,
            hasBackground: this.hasBackgroundImage(element),
            computedStyles: {
                display: getComputedStyle(element).display,
                position: getComputedStyle(element).position,
                fontSize: getComputedStyle(element).fontSize,
                fontWeight: getComputedStyle(element).fontWeight,
                color: getComputedStyle(element).color
            }
        };
    }

    /**
     * Obter informações específicas para mapeamento de header
     */
    getHeaderMappingInfo(element) {
        if (!element.closest('header')) {
            return null;
        }

        const headerContainer = element.closest('header');
        const headerClasses = headerContainer.className.split(/\s+/).filter(c => c);
        
        // Identificar tipo de header
        let headerType = 'unknown';
        if (headerClasses.includes('header-four')) {
            headerType = 'header-four'; // Home
        } else if (headerClasses.includes('heder-one')) {
            headerType = 'heder-one'; // Outras páginas
        }

        // Identificar seção dentro do header
        let headerSection = 'main';
        if (element.closest('.header-top')) {
            headerSection = 'top';
        } else if (element.closest('.header-bottom')) {
            headerSection = 'bottom';
        } else if (element.closest('.nav-area')) {
            headerSection = 'navigation';
        } else if (element.closest('.logo-area')) {
            headerSection = 'logo';
        }

        // Identificar tipo de conteúdo
        let contentType = 'text';
        if (element.tagName.toLowerCase() === 'img') {
            contentType = 'image';
        } else if (element.tagName.toLowerCase() === 'a') {
            contentType = 'link';
        } else if (element.closest('.logo')) {
            contentType = 'logo';
        } else if (element.closest('.nav, .menu')) {
            contentType = 'navigation';
        }

        return {
            headerType,
            headerSection,
            contentType,
            headerClasses,
            nearbyText: this.getNearbyText(element),
            hierarchyLevel: this.getHeaderHierarchyLevel(element)
        };
    }

    /**
     * Obter texto próximo ao elemento (para contexto)
     */
    getNearbyText(element) {
        const parent = element.parentElement;
        if (!parent) return '';

        // Coletar texto de elementos irmãos
        const siblings = Array.from(parent.children);
        const texts = siblings
            .map(sibling => sibling.textContent ? sibling.textContent.trim() : '')
            .filter(text => text.length > 0 && text.length < 50) // Textos curtos relevantes
            .slice(0, 3); // Máximo 3 textos

        return texts.join(' | ');
    }

    /**
     * Obter nível hierárquico no header
     */
    getHeaderHierarchyLevel(element) {
        let level = 0;
        let current = element;
        const header = element.closest('header');

        while (current && current !== header) {
            level++;
            current = current.parentElement;
        }

        return level;
    }

    /**
     * Gerar seletor CSS para elemento
     */
    generateCSSSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }
        
        let selector = element.tagName.toLowerCase();
        
        if (element.className) {
            const classes = element.className.split(' ')
                .filter(cls => cls && !cls.startsWith('hardem-'))
                .slice(0, 3);
            if (classes.length > 0) {
                selector += '.' + classes.join('.');
            }
        }
        
        // Adicionar posição se necessário
        const siblings = Array.from(element.parentNode.children)
            .filter(sibling => sibling.tagName === element.tagName);
        
        if (siblings.length > 1) {
            const index = siblings.indexOf(element) + 1;
            selector += `:nth-child(${index})`;
        }
        
        return selector;
    }

    /**
     * Obter caminho XPath do elemento
     */
    getElementPath(element) {
        const paths = [];
        
        for (; element && element.nodeType === Node.ELEMENT_NODE; element = element.parentNode) {
            let index = 0;
            let hasFollowingSiblings = false;
            
            for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
                if (sibling.nodeType === Node.DOCUMENT_TYPE_NODE) continue;
                
                if (sibling.nodeName === element.nodeName) {
                    ++index;
                }
            }
            
            for (let sibling = element.nextSibling; sibling && !hasFollowingSiblings; sibling = sibling.nextSibling) {
                if (sibling.nodeName === element.nodeName) {
                    hasFollowingSiblings = true;
                }
            }
            
            const tagName = element.nodeName.toLowerCase();
            const pathIndex = (index || hasFollowingSiblings) ? `[${index + 1}]` : '';
            paths.splice(0, 0, tagName + pathIndex);
        }
        
        return paths.length ? '/' + paths.join('/') : null;
    }

    /**
     * Obter atributos de dados do elemento
     */
    getDataAttributes(element) {
        const dataAttrs = {};
        
        for (const attr of element.attributes) {
            if (attr.name.startsWith('data-') && attr.name !== 'data-key') {
                dataAttrs[attr.name] = attr.value;
            }
        }
        
        return dataAttrs;
    }

    /**
     * Debounce - evitar execuções repetidas
     */
    debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    /**
     * Throttle - limitar execuções por tempo
     */
    throttle(func, delay) {
        let inThrottle;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, delay);
            }
        };
    }

    /**
     * Sanitizar string para uso em HTML
     */
    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Formatar bytes em string legível
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Verificar se elemento está visível na viewport
     */
    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Rolar para elemento
     */
    scrollToElement(element, offset = 100) {
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const scrollPosition = elementPosition - offset;
        
        window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
        });
    }

    /**
     * Copiar texto para clipboard
     */
    copyToClipboard(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback para navegadores antigos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                return Promise.resolve();
            } catch (err) {
                return Promise.reject(err);
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }

    /**
     * Validar formato de arquivo
     */
    validateFileType(file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']) {
        return allowedTypes.includes(file.type);
    }

    /**
     * Validar tamanho de arquivo
     */
    validateFileSize(file, maxSizeMB = 5) {
        // SVG pode ser maior que outros formatos de imagem
        if (file.type === 'image/svg+xml') {
            maxSizeMB = Math.max(maxSizeMB, 10); // Permitir até 10MB para SVG
        }
        
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        const isValid = file.size <= maxSizeBytes;
        
        if (!isValid) {
            console.warn(`Arquivo muito grande: ${this.formatBytes(file.size)}, máximo permitido: ${maxSizeMB}MB`);
        }
        
        return isValid;
    }

    /**
     * Gerar XPath para um elemento
     */
    generateXPath(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        // Se o elemento tem um ID único, usar isso
        if (element.id) {
            return `//*[@id="${element.id}"]`;
        }

        const parts = [];
        let current = element;

        while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
            let tagName = current.tagName.toLowerCase();
            let index = 1;
            
            // Contar elementos irmãos com a mesma tag
            let sibling = current.previousElementSibling;
            while (sibling) {
                if (sibling.tagName.toLowerCase() === tagName) {
                    index++;
                }
                sibling = sibling.previousElementSibling;
            }
            
            // Adicionar classes se existirem para tornar mais específico
            let classInfo = '';
            if (current.className && typeof current.className === 'string') {
                const classes = current.className.trim().split(/\s+/)
                    .filter(cls => cls && !cls.startsWith('hardem-'))
                    .slice(0, 2); // Usar apenas as 2 primeiras classes
                
                if (classes.length > 0) {
                    classInfo = `[contains(@class, "${classes[0]}")]`;
                }
            }
            
            // Verificar se há outros elementos com a mesma tag
            const sameTagSiblings = Array.from(current.parentNode?.children || [])
                .filter(child => child.tagName.toLowerCase() === tagName);
            
            if (sameTagSiblings.length > 1) {
                parts.unshift(`${tagName}[${index}]${classInfo}`);
            } else {
                parts.unshift(`${tagName}${classInfo}`);
            }
            
            current = current.parentElement;
        }

        return parts.length > 0 ? '//' + parts.join('/') : '';
    }

    /**
     * NOVO: Obter informações específicas para elementos de dropdown
     */
    getDropdownInfo(element) {
        const dropdownContainer = element.closest('.has-dropdown, .submenu, .rts-mega-menu, .dropdown, .nav-item');
        
        if (!dropdownContainer) {
            return { isInDropdown: false };
        }

        // Identificar tipo de dropdown
        let dropdownType = 'unknown';
        if (dropdownContainer.classList.contains('has-dropdown')) {
            dropdownType = 'has-dropdown';
        } else if (dropdownContainer.classList.contains('submenu')) {
            dropdownType = 'submenu';
        } else if (dropdownContainer.classList.contains('rts-mega-menu')) {
            dropdownType = 'mega-menu';
        } else if (dropdownContainer.classList.contains('dropdown')) {
            dropdownType = 'dropdown';
        }

        // Encontrar o menu pai
        const parentMenu = element.closest('.main-nav, .nav, .menu');
        const menuLevel = this.getDropdownLevel(element);

        // Identificar posição no dropdown
        const dropdownItems = Array.from(dropdownContainer.querySelectorAll('a, span, p, li'));
        const itemIndex = dropdownItems.indexOf(element);

        // Coletar texto de elementos próximos para contexto
        const siblingTexts = dropdownItems
            .slice(Math.max(0, itemIndex - 1), itemIndex + 2)
            .map(item => item.textContent?.trim())
            .filter(text => text && text.length > 0);

        return {
            isInDropdown: true,
            dropdownType,
            dropdownContainer: {
                className: dropdownContainer.className,
                tagName: dropdownContainer.tagName.toLowerCase()
            },
            parentMenu: parentMenu ? {
                className: parentMenu.className,
                tagName: parentMenu.tagName.toLowerCase()
            } : null,
            menuLevel,
            itemIndex,
            totalItems: dropdownItems.length,
            siblingTexts,
            isVisible: getComputedStyle(dropdownContainer).display !== 'none',
            dropdownPath: this.getDropdownPath(element)
        };
    }

    /**
     * NOVO: Obter nível do dropdown (quantos níveis de menu)
     */
    getDropdownLevel(element) {
        let level = 0;
        let current = element;
        
        while (current) {
            if (current.classList?.contains('submenu') || 
                current.classList?.contains('has-dropdown') ||
                current.classList?.contains('dropdown')) {
                level++;
            }
            current = current.parentElement;
        }
        
        return level;
    }

    /**
     * NOVO: Obter caminho específico do dropdown
     */
    getDropdownPath(element) {
        if (!element) return '';
        const path = [];
        let current = element;

        while(current && !current.matches('.dropdown-menu, .sub-menu, .menu-item')) {
            current = current.parentElement;
        }

        while (current) {
            const parentItem = current.closest('.menu-item');
            if (parentItem) {
                const link = parentItem.querySelector('a');
                path.unshift(link ? link.textContent.trim().substring(0, 20) : `item-${this.getDropdownLevel(parentItem)}`);
            }
            current = current.parentElement?.closest('.menu-item');
        }
        
        return path.join(' > ');
    }

    /**
     * Extrai a URL real de uma string de imagem (pode ser data URI, URL http, ou proxy)
     * Por enquanto, apenas retorna a string se for uma string válida.
     * @param {string} imageSrc - A fonte da imagem.
     * @returns {string} - A URL da imagem.
     */
    extractImageUrl(imageSrc) {
        if (typeof imageSrc === 'string' && imageSrc.trim() !== '') {
            // Lógica futura poderia extrair de um objeto ou limpar a URL.
            // Por agora, retorna a fonte como está para evitar quebras.
            // Isso assume que o src é uma URL utilizável (direta, data URI, ou proxy).
            return imageSrc;
        }
        console.warn('extractImageUrl recebeu uma fonte de imagem inválida:', imageSrc);
        return ''; // Retorna uma string vazia para evitar erros
    }
}

// Expor a classe globalmente
window.HardemEditorUtils = HardemEditorUtils; 