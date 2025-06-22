/**
 * HARDEM Text Editor - Módulo de Edição de Texto
 * Gerencia edição inline e elementos de texto
 * @version 1.0.0
 */

class HardemTextEditor {
    constructor(core) {
        this.core = core;
    }

    /**
     * Configurar elementos editáveis
     */
    setupEditableElements(container = document) {
        if (!this.core.editMode) return;
        
        // Marcar container como processado para evitar reprocessamento
        if (container !== document && !container.hasAttribute('data-hardem-processed')) {
            container.setAttribute('data-hardem-processed', 'true');
        }
        
        container.querySelectorAll(this.core.editableSelectors.join(',')).forEach(element => {
            // Pular elementos do editor
            if (this.core.utils.isEditorElement(element)) return;
            
            // Pular elementos já configurados
            if (element.classList.contains('hardem-editable-element')) return;
            
            // Pular elementos com data-no-edit
            if (element.hasAttribute('data-no-edit')) return;
            
            this.makeTextElementEditable(element);
        });
        
        // console.log('Elementos de texto configurados para edição');
    }

    /**
     * Tornar elemento de texto editável
     */
    makeTextElementEditable(element) {
        // Evitar elementos do próprio editor
        if (element.closest('.hardem-editor-toolbar') || 
            element.closest('.hardem-editor-sidepanel') ||
            element.classList.contains('hardem-editable-element')) {
            return;
        }
        
        // Verificar explicitamente se é um container de serviço
        if (this.core.utils.isServiceMenuContainer(element)) {
            console.log('Ignorando container de serviço:', element);
            return; // Não tornar editável
        }
        
        // Verificar se está no header e aplicar regras especiais
        if (element.closest('header')) {
            // Verificar elementos de navegação que não devem ser editáveis
            if (element.classList.contains('header-bottom') ||
                element.classList.contains('nav-area') || 
                element.classList.contains('main-nav') || 
                element.classList.contains('rts-mega-menu')) {
                return; // Não tornar editável
            }
            
            // Para links no header, verificar se são links de navegação complexos (com dropdown)
            if (element.tagName === 'A' && (
                element.querySelector('.rts-mega-menu') || 
                element.querySelector('.submenu'))) {
                
                // Verificar se é um container de dropdown (não deve ser editável)
                if (element.querySelector('.rts-mega-menu') || element.querySelector('.submenu')) {
                    return; // Não tornar editável
                }
            }
            
            // NOVO: Permitir edição de textos simples dentro de dropdowns
            // Se é um elemento de texto simples (span, p, a sem filhos complexos) dentro de dropdown, permitir edição
            if (element.closest('.submenu, .has-dropdown') && 
                (element.tagName === 'SPAN' || element.tagName === 'P' || 
                 (element.tagName === 'A' && !element.querySelector('.rts-mega-menu, .submenu')))) {
                // Permitir edição de textos simples em dropdowns
                console.log(`🔓 Permitindo edição de texto em dropdown: ${element.tagName} - "${element.textContent?.trim().substring(0, 30)}..."`);
            }
        }
        
        // Verificar se é um elemento de texto válido
        if (!this.isTextElement(element)) return;
        
        // Verificar se já tem data-key (para evitar reprocessamento)
        let dataKey = element.getAttribute('data-key');
        if (!dataKey) {
            dataKey = this.core.utils.generateDataKey(element);
            element.setAttribute('data-key', dataKey);
        }
        
        // Adicionar classe de editável
        element.classList.add('hardem-editable');
        element.classList.add('hardem-editable-element');
        
        // Tooltip
        element.title = `Editar: ${dataKey}`;

        // Eventos de edição
        const handleDoubleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.startInlineEditing(element);
        };

        const handleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleElementClick(e);
        };

        element.addEventListener('dblclick', handleDoubleClick);
        element.addEventListener('click', handleClick);
        
        // Neutralizar efeitos problemáticos
        this.neutralizeElementEffects(element);
        
        // console.log(`✅ Elemento de texto editável: ${dataKey}`);
    }

    /**
     * Iniciar edição inline
     */
    startInlineEditing(element) {
        if (!this.isSafeForDirectEdit(element)) {
            this.core.selectElement(element);
            return;
        }

        const originalText = this.core.utils.getDirectTextContent(element);
        const dataKey = element.getAttribute('data-key');
        
        // Criar input de edição
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalText;
        input.style.cssText = `
            width: 100%;
            padding: 4px;
            border: 2px solid #3498db;
            font-family: inherit;
            font-size: inherit;
            font-weight: inherit;
            color: inherit;
            background: white;
            border-radius: 3px;
        `;

        const finishEditing = () => {
            const newText = input.value.trim();
            
            if (newText && newText !== originalText) {
                element.textContent = newText;
                
                // Salvar no contentMap com informações de header
                if (!this.core.contentMap[dataKey]) {
                    this.core.contentMap[dataKey] = {};
                }
                this.core.contentMap[dataKey].text = newText;
                this.core.contentMap[dataKey].isHeaderContent = element.closest('header') !== null;
                this.core.contentMap[dataKey].elementInfo = this.core.utils.collectElementInfo ? 
                    this.core.utils.collectElementInfo(element) : null;
                this.core.contentMap[dataKey].timestamp = new Date().toISOString();
                
                // NOVO: Debug melhorado para dropdowns
                const isInDropdown = element.closest('.submenu, .has-dropdown') !== null;
                if (isInDropdown) {
                    console.log(`🔽 Texto de dropdown salvo: ${dataKey} = "${newText}" (header: ${this.core.contentMap[dataKey].isHeaderContent})`);
                    this.core.contentMap[dataKey].isDropdownContent = true;
                } else {
                    console.log(`📝 Texto atualizado: ${dataKey} = "${newText}" (header: ${this.core.contentMap[dataKey].isHeaderContent})`);
                }
                
                // Forçar salvamento imediato para elementos de dropdown
                if (isInDropdown) {
                    console.log(`💾 Forçando salvamento imediato para dropdown: ${dataKey}`);
                    this.core.storage.saveContent();
                }
                
                this.core.ui.showAlert('Texto atualizado!', 'success');
            }
            
            // Restaurar elemento original
            element.style.display = '';
            input.remove();
            
            // Re-aplicar configurações de edição
            this.makeTextElementEditable(element);
        };

        // Eventos do input
        input.addEventListener('blur', finishEditing);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Escape') {
                element.style.display = '';
                input.remove();
                this.makeTextElementEditable(element);
            }
        });

        // Substituir elemento pelo input
        element.style.display = 'none';
        element.parentNode.insertBefore(input, element.nextSibling);
        input.focus();
        input.select();
    }

    /**
     * Manipular clique em elemento
     */
    handleElementClick(event) {
        // Impedir comportamento padrão
        event.preventDefault();
        event.stopPropagation();
        
        // Obter elementos sobrepostos usando o método filtrado
        const overlappingElements = this.getOverlappingElements(event);
        
        // Caso especial para overlay de imagens (hidden-content)
        if (event.target.closest('.hidden-content') || event.target.classList.contains('hidden-content')) {
            if (overlappingElements.length > 0) {
                this.showOverlappingElementsPanel(overlappingElements);
                return;
            }
        }
        
        // Tratar situação específica de cards de serviço
        const clickedElement = event.target;
        if (clickedElement.classList.contains('single-service-style-4') || 
            (clickedElement.tagName === 'A' && clickedElement.classList.contains('single-service-style-4'))) {
            
            // Encontrar elementos seguros dentro do serviço para edição
            const safeElements = [];
            
            // Adicionar título
            const title = clickedElement.querySelector('h5.title');
            if (title) safeElements.push(title);
            
            // Adicionar descrição
            const desc = clickedElement.querySelector('p.disc');
            if (desc) safeElements.push(desc);
            
            // Adicionar imagem
            const img = clickedElement.querySelector('img');
            if (img) safeElements.push(img);
            
            // Adicionar botão "View Details"
            const viewBtn = clickedElement.querySelector('.hidden-content span');
            if (viewBtn) safeElements.push(viewBtn);
            
            // Se encontramos elementos seguros, mostrar painel de elementos sobrepostos com eles
            if (safeElements.length > 0) {
                this.showOverlappingElementsPanel(safeElements);
                return;
            }
        }
        
        // Forçar exibição de panel para elementos sobrepostos quando há mais de um
        if (overlappingElements.length > 1) {
            this.showOverlappingElementsPanel(overlappingElements);
            return;
        }
        
        // Se houver apenas um elemento, selecionar normalmente
        if (overlappingElements.length === 1) {
            this.core.selectElement(overlappingElements[0]);
            return;
        }
        
        // Se não há elementos editáveis após a filtragem, informar ao usuário
        if (overlappingElements.length === 0) {
            this.core.ui.showAlert('Nenhum elemento editável encontrado nesta área.', 'error');
        }
    }

    /**
     * Obter elementos sobrepostos na posição do clique
     */
    getOverlappingElements(event) {
        const elements = [];
        const elementsFromPoint = document.elementsFromPoint(event.clientX, event.clientY);
        
        // Verificar se estamos em um dropdown de serviço
        const isInServiceMenu = elementsFromPoint.some(el => 
            el.closest('.rts-mega-menu.service-mega-menu-style') !== null);
        
        // Se estamos em um menu de serviço, comportamento especial
        if (isInServiceMenu) {
            const clickedElement = event.target;
            
            // Ignorar cliques em elementos de fundo no dropdown de serviços
            if (clickedElement.classList.contains('single-service-menu') || 
                clickedElement.classList.contains('service-mega-menu-style') ||
                clickedElement.classList.contains('rts-mega-menu') ||
                clickedElement.classList.contains('row') ||
                clickedElement.classList.contains('col-lg-12') ||
                clickedElement.classList.contains('container') ||
                (clickedElement.classList.contains('icon') && !clickedElement.querySelector('img')) ||
                clickedElement.closest('.service-mega-menu-style') && 
                    !clickedElement.classList.contains('title') && 
                    !clickedElement.classList.contains('details') && 
                    clickedElement.tagName !== 'IMG') {
                
                console.log('Clique ignorado em elemento não editável do menu de serviços');
                return [];
            }
            
            // Verificar componentes específicos de item de serviço
            if (clickedElement.tagName === 'IMG' && clickedElement.closest('.icon')) {
                elements.push(clickedElement);
                return elements;
            }
            
            if (clickedElement.classList.contains('title') ||
                clickedElement.tagName === 'H5' && clickedElement.classList.contains('title')) {
                elements.push(clickedElement);
                return elements;
            }
            
            if (clickedElement.classList.contains('details') ||
                clickedElement.tagName === 'P' && clickedElement.classList.contains('details')) {
                elements.push(clickedElement);
                return elements;
            }
            
            // Calcular distâncias para elementos próximos
            if (clickedElement.classList.contains('single-service-menu') ||
                clickedElement.closest('.single-service-menu')) {
                const serviceMenu = clickedElement.classList.contains('single-service-menu') ? 
                    clickedElement : clickedElement.closest('.single-service-menu');
                
                const iconEl = serviceMenu.querySelector('.icon img');
                const titleEl = serviceMenu.querySelector('.title');
                const detailsEl = serviceMenu.querySelector('.details');
                
                const distances = [];
                
                const calculateDistance = (el) => {
                    if (!el) return Infinity;
                    const rect = el.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    return Math.sqrt(
                        Math.pow(centerX - event.clientX, 2) + 
                        Math.pow(centerY - event.clientY, 2)
                    );
                };
                
                if (iconEl) distances.push({el: iconEl, dist: calculateDistance(iconEl)});
                if (titleEl) distances.push({el: titleEl, dist: calculateDistance(titleEl)});
                if (detailsEl) distances.push({el: detailsEl, dist: calculateDistance(detailsEl)});
                
                distances.sort((a, b) => a.dist - b.dist);
                
                if (distances.length > 0) {
                    const closestDistance = distances[0].dist;
                    if (closestDistance < 50) {
                        elements.push(distances[0].el);
                        return elements;
                    } else {
                        console.log('Clique muito distante de elementos editáveis específicos');
                        return [];
                    }
                }
            }
            
            if (this.core.utils.isElementEditable(clickedElement) &&
               !this.core.utils.isServiceMenuContainer(clickedElement)) {
                elements.push(clickedElement);
                return elements;
            } else {
                return [];
            }
        }
        
        // Comportamento normal para o resto da página
        for (const el of elementsFromPoint) {
            // Ignorar elementos do editor
            if (this.core.utils.isEditorElement(el)) continue;
            
            // Verificar se é um elemento potencialmente editável
            if (el.hasAttribute('data-key') || 
                this.core.editableSelectors.some(selector => el.matches(selector)) ||
                el.tagName === 'IMG' ||
                (window.getComputedStyle(el).backgroundImage !== 'none' && 
                 !window.getComputedStyle(el).backgroundImage.includes('gradient'))) {
                
                // Verificação específica para evitar problema no header
                if (el.tagName === 'A' && el.closest('header') && 
                    (el.classList.contains('main-nav') || 
                     el.parentElement.classList.contains('main-nav') || 
                     el.parentElement.classList.contains('submenu'))) {
                    
                    if (el.querySelector('.rts-mega-menu') || el.querySelector('.submenu')) {
                        continue;
                    }
                }
                
                elements.push(el);
            }
        }
        
        // Filtrar elementos do header que podem causar problemas
        const filteredElements = elements.filter(el => {
            if (this.core.utils.isServiceMenuContainer(el)) {
                return false;
            }
            
            const isInHeader = el.closest('header') !== null;
            
            if (isInHeader) {
                if (el.classList.contains('rts-mega-menu') || 
                    el.classList.contains('submenu') || 
                    el.classList.contains('wrapper') ||
                    el.classList.contains('header-bottom') ||
                    el.classList.contains('nav-area')) {
                    return false;
                }
                
                if (el.tagName === 'A' && (
                    el.classList.contains('has-dropdown') || 
                    el.parentElement.classList.contains('has-dropdown'))) {
                    const rect = el.getBoundingClientRect();
                    const isDirectClick = 
                        event.clientX >= rect.left && 
                        event.clientX <= rect.right && 
                        event.clientY >= rect.top && 
                        event.clientY <= rect.bottom;
                    
                    return isDirectClick;
                }
                
                if (el.tagName === 'A' && el.textContent.trim()) {
                    return true;
                }
                
                if (['SPAN', 'H5', 'H4', 'H3', 'H2', 'H1', 'P'].includes(el.tagName) && 
                    el.textContent.trim() && 
                    !el.closest('.rts-mega-menu')) {
                    return true;
                }
            }
            
            return true;
        });
        
        return filteredElements;
    }

    /**
     * Mostrar painel de elementos sobrepostos
     */
    showOverlappingElementsPanel(elements) {
        const panelContent = document.getElementById('hardem-panel-content');
        
        let html = `
            <h4>Elementos Sobrepostos</h4>
            <p>Vários elementos foram encontrados na posição clicada. Selecione qual deseja editar:</p>
        `;
        
        elements.forEach((element, index) => {
            const dataKey = element.getAttribute('data-key');
            const description = this.core.utils.getElementTypeDescription(element);
            const location = this.core.utils.getElementLocation(element);
            
            html += `
                <div class="hardem-form-group" style="border: 1px solid #ddd; padding: 8px; margin: 4px 0; border-radius: 3px;">
                    <strong>${description}</strong><br>
                    <small>${location}</small><br>
                    <small>Key: ${dataKey}</small><br>
                    <button onclick="window.hardemEditor.textEditor.selectElementFromOverlap(${index})" 
                            style="margin-top: 4px;">
                        Selecionar Este
                    </button>
                </div>
            `;
        });
        
        panelContent.innerHTML = html;
        this.core.ui.openSidePanel();
        
        // Armazenar elementos para seleção posterior
        this.overlappingElements = elements;
    }

    /**
     * Selecionar elemento da lista de sobrepostos
     */
    selectElementFromOverlap(index) {
        if (this.overlappingElements && this.overlappingElements[index]) {
            this.core.selectElement(this.overlappingElements[index]);
        }
    }

    /**
     * Destacar elementos sobrepostos
     */
    highlightOverlappingElements() {
        if (!this.overlappingElements) return;
        
        // Remover highlights anteriores
        document.querySelectorAll('.hardem-highlight-overlap').forEach(el => {
            el.classList.remove('hardem-highlight-overlap');
        });
        
        // Adicionar highlight aos elementos sobrepostos
        this.overlappingElements.forEach((element, index) => {
            element.classList.add('hardem-highlight-overlap');
            // Adicionar número do índice
            element.setAttribute('data-overlap-index', index);
        });
        
        // Adicionar estilo se não existir
        if (!document.getElementById('hardem-overlap-style')) {
            const style = document.createElement('style');
            style.id = 'hardem-overlap-style';
            style.innerHTML = `
                .hardem-highlight-overlap {
                    outline: 2px dashed #f39c12 !important;
                    outline-offset: 2px !important;
                    background: rgba(243, 156, 18, 0.1) !important;
                }
                .hardem-highlight-overlap::before {
                    content: attr(data-overlap-index);
                    position: absolute;
                    top: -20px;
                    left: 0;
                    background: #f39c12;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 1000000;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remover highlight após 10 segundos
        setTimeout(() => {
            document.querySelectorAll('.hardem-highlight-overlap').forEach(el => {
                el.classList.remove('hardem-highlight-overlap');
                el.removeAttribute('data-overlap-index');
            });
        }, 10000);
    }

    /**
     * Desabilitar efeitos de hover em elemento
     */
    disableHoverEffects(element) {
        // Aplicar estilo que cancela hover
        element.style.setProperty('pointer-events', 'auto', 'important');
        element.style.setProperty('transition', 'none', 'important');
        
        // Salvar estado original se não foi salvo
        if (!element.hasAttribute('data-original-hover-saved')) {
            const computedStyle = getComputedStyle(element);
            element.setAttribute('data-original-cursor', computedStyle.cursor || '');
            element.setAttribute('data-original-hover-saved', 'true');
        }
        
        // Aplicar cursor de edição
        element.style.setProperty('cursor', 'text', 'important');
    }

    /**
     * Verificar se elemento é seguro para edição direta
     */
    isSafeForDirectEdit(element) {
        // Elementos que não devem ser editados diretamente
        const unsafeSelectors = [
            'a', 'button', '.btn', '[onclick]', '[href]',
            '.carousel', '.slider', '.menu', '.nav'
        ];
        
        return !unsafeSelectors.some(selector => {
            try {
                return element.matches(selector) || element.closest(selector);
            } catch (e) {
                return false;
            }
        });
    }

    /**
     * Verificar se elemento é de texto
     */
    isTextElement(element) {
        const textTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'DIV', 'A', 'BUTTON', 'LI', 'TD', 'TH', 'LABEL', 'FIGCAPTION'];
        const hasTextContent = element.textContent && element.textContent.trim().length > 0;
        const isTextTag = textTags.includes(element.tagName);
        
        return isTextTag && hasTextContent;
    }

    /**
     * Neutralizar efeitos problemáticos do elemento
     */
    neutralizeElementEffects(element) {
        // Salvar estilos originais
        if (!element._originalStyles) {
            element._originalStyles = {
                pointerEvents: element.style.pointerEvents,
                userSelect: element.style.userSelect,
                transition: element.style.transition
            };
        }
        
        // Aplicar estilos temporários para edição
        element.style.pointerEvents = 'auto';
        element.style.userSelect = 'text';
        element.style.transition = 'none';
    }

    /**
     * Restaurar efeitos originais do elemento
     */
    restoreElementEffects(element) {
        if (element._originalStyles) {
            element.style.pointerEvents = element._originalStyles.pointerEvents;
            element.style.userSelect = element._originalStyles.userSelect;
            element.style.transition = element._originalStyles.transition;
            delete element._originalStyles;
        }
    }

    /**
     * Aplicar mudança de texto do painel
     */
    applyTextChange() {
        if (!this.core.currentElement) return;

        const element = this.core.currentElement;
        const textInput = document.getElementById('hardem-text-input');
        
        if (textInput && textInput.value.trim() !== '') {
            const newText = textInput.value.trim();
            const dataKey = element.getAttribute('data-key');
            
            element.textContent = newText;
            
            // Salvar no contentMap com informações de header
            if (!this.core.contentMap[dataKey]) {
                this.core.contentMap[dataKey] = {};
            }
            this.core.contentMap[dataKey].text = newText;
            this.core.contentMap[dataKey].isHeaderContent = element.closest('header') !== null;
            this.core.contentMap[dataKey].elementInfo = this.core.utils.collectElementInfo ? 
                this.core.utils.collectElementInfo(element) : null;
            this.core.contentMap[dataKey].timestamp = new Date().toISOString();
            
            // NOVO: Debug melhorado para dropdowns via painel
            const isInDropdown = element.closest('.submenu, .has-dropdown') !== null;
            if (isInDropdown) {
                console.log(`🔽 Texto de dropdown salvo via painel: ${dataKey} = "${newText}" (header: ${this.core.contentMap[dataKey].isHeaderContent})`);
                this.core.contentMap[dataKey].isDropdownContent = true;
                
                // Forçar salvamento imediato para elementos de dropdown
                console.log(`💾 Forçando salvamento imediato para dropdown via painel: ${dataKey}`);
                this.core.storage.saveContent();
            } else {
                console.log(`📝 Texto atualizado via painel: ${dataKey} = "${newText}" (header: ${this.core.contentMap[dataKey].isHeaderContent})`);
            }
            
            this.core.ui.showAlert('Texto atualizado!', 'success');
        }
    }
}

// Expor classe globalmente
window.HardemTextEditor = HardemTextEditor; 