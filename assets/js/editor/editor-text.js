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
        
        
        // Detectar automaticamente contadores existentes
        this.detectAndSetupCounters(container);
        
        // Marcar container como processado para evitar reprocessamento
        if (container !== document && !container.hasAttribute('data-hardem-processed')) {
            container.setAttribute('data-hardem-processed', 'true');
        }
        
        container.querySelectorAll(this.core.editableSelectors.join(',')).forEach(element => {
            // Pular elementos do editor
            if (this.core.utils.isEditorElement(element)) return;
            
            // Pular elementos já configurados
            if (element.classList.contains('hardem-editable-element') || 
                element.hasAttribute('data-hardem-processed')) return;
            
            // Pular elementos com data-no-edit
            if (element.hasAttribute('data-no-edit')) return;
            
            // NOVO: Verificação especial para contadores
            if (this.isCounterElement(element)) {
                // Verificar se o contador está em animação
                const odometerSpan = element.querySelector('span.odometer');
                if (odometerSpan && (odometerSpan.classList.contains('odometer-animating-up') || 
                                   odometerSpan.classList.contains('odometer-animating-down'))) {
                    return; // Não processar contadores em animação
                }
            }
            
            this.makeTextElementEditable(element);
        });
    }

    /**
     * NOVO: Detectar e configurar contadores automaticamente
     */
    detectAndSetupCounters(container = document) {
        
        // Encontrar todos os elementos span.odometer com data-key
        const odometerElements = container.querySelectorAll('span.odometer[data-key]');
        
        odometerElements.forEach(odometerSpan => {
            const dataKey = odometerSpan.getAttribute('data-key');
            const dataCount = odometerSpan.getAttribute('data-count');
            const currentText = odometerSpan.textContent.trim();
            const parentElement = odometerSpan.closest('[data-key]');
            
            
            // Verificar se já existe no contentMap
            if (!this.core.contentMap[dataKey]) {
                this.core.contentMap[dataKey] = {};
            }
            
            // Se não tem dados de contador salvos, usar o data-count como valor inicial
            if (!this.core.contentMap[dataKey].isCounter && !this.core.contentMap[dataKey].text) {
                const suffix = this.getCounterSuffix(parentElement || odometerSpan.parentElement);
                const initialValue = parseFloat(dataCount) || 0;
                
                this.core.contentMap[dataKey].isCounter = true;
                this.core.contentMap[dataKey].counterValue = initialValue;
                this.core.contentMap[dataKey].counterSuffix = suffix;
                this.core.contentMap[dataKey].elementInfo = this.core.utils.collectElementInfo ? 
                    this.core.utils.collectElementInfo(parentElement || odometerSpan) : null;
                this.core.contentMap[dataKey].timestamp = new Date().toISOString();
                
            } else if (this.core.contentMap[dataKey].text && !this.core.contentMap[dataKey].isCounter) {
                // Se já tem texto salvo, converter para contador
                const numericValue = parseFloat(this.core.contentMap[dataKey].text) || 0;
                const suffix = this.getCounterSuffix(parentElement || odometerSpan.parentElement);
                
                this.core.contentMap[dataKey].isCounter = true;
                this.core.contentMap[dataKey].counterValue = numericValue;
                this.core.contentMap[dataKey].counterSuffix = suffix;
                
            }
            
            // Configurar o elemento pai para edição apenas se o modo de edição estiver ativo
            if (parentElement && this.core.editMode) {
                this.makeCounterEditable(parentElement);
            } else if (parentElement && !this.core.editMode) {
            }
        });
    }

    /**
     * Tornar elemento de texto editável
     */
    makeTextElementEditable(element) {
        // CRÍTICO: Só configurar elementos editáveis se o modo de edição estiver ativo
        if (!this.core.editMode) {
            return;
        }
        
        // Evitar elementos do próprio editor
        if (element.closest('.hardem-editor-toolbar') || 
            element.closest('.hardem-editor-sidepanel') ||
            element.classList.contains('hardem-editable-element')) {
            return;
        }
        
        // Tratamento especial para contadores
        if (this.isCounterElement(element)) {
            this.makeCounterEditable(element);
            return;
        }
        
        // Verificar explicitamente se é um container de serviço
        if (this.core.utils.isServiceMenuContainer(element)) {
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
                    this.core.contentMap[dataKey].isDropdownContent = true;
                } else {
                }
                
                // Forçar salvamento imediato para elementos de dropdown
                if (isInDropdown) {
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
        const panelContent = document.querySelector('.hardem-editor-sidepanel-content');
        
        if (!panelContent) {
            return;
        }
        
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
                this.core.contentMap[dataKey].isDropdownContent = true;
                
                // Forçar salvamento imediato para elementos de dropdown
                this.core.storage.saveContent();
            } else {
            }
            
            this.core.ui.showAlert('Texto atualizado!', 'success');
        }
    }

    /**
     * Verificar se elemento é um contador
     */
    isCounterElement(element) {
        return element.classList.contains('counter') && element.classList.contains('title');
    }

    /**
     * Tratar contador como elemento único
     */
    makeCounterEditable(element) {
        // CRÍTICO: Só configurar contadores editáveis se o modo de edição estiver ativo
        if (!this.core.editMode) {
            return;
        }
        
        // Verificar se já foi processado para evitar duplicação
        if (element.classList.contains('hardem-counter-element') || 
            element.hasAttribute('data-hardem-processed')) {
            return;
        }

        // NOVO: Verificar se o contador tem animação ativa (odometer)
        const odometerSpan = element.querySelector('span.odometer');
        if (odometerSpan && odometerSpan.classList.contains('odometer-animating-up')) {
            // Aguardar animação terminar antes de processar
            setTimeout(() => {
                if (!element.classList.contains('hardem-counter-element')) {
                    this.makeCounterEditable(element);
                }
            }, 1000);
            return;
        }

        // Verificar se já tem data-key
        let dataKey = element.getAttribute('data-key');
        if (!dataKey) {
            dataKey = this.core.utils.generateDataKey(element);
            element.setAttribute('data-key', dataKey);
        }

        // Adicionar classe de editável
        element.classList.add('hardem-editable');
        element.classList.add('hardem-editable-element');
        element.classList.add('hardem-counter-element');
        
        // Marcar como processado para evitar reprocessamento
        element.setAttribute('data-hardem-processed', 'true');
        
        // NOVO: Marcar o odometer também para evitar conflitos
        if (odometerSpan) {
            odometerSpan.setAttribute('data-hardem-processed', 'true');
        }
        
        // Tooltip
        element.title = `Editar contador: ${dataKey}`;

        // Obter o número atual do contador
        const currentNumber = odometerSpan ? odometerSpan.getAttribute('data-count') : '0';
        const suffix = this.getCounterSuffix(element);

        // Remover listeners anteriores se existirem
        if (element._counterListeners) {
            element.removeEventListener('dblclick', element._counterListeners.doubleClick);
            element.removeEventListener('click', element._counterListeners.click);
        }

        // Eventos especiais para contadores
        const handleDoubleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.startCounterEditing(element, currentNumber, suffix);
        };

        const handleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.core.selectElement(element);
        };

        // Armazenar referências dos listeners para remoção posterior
        element._counterListeners = {
            doubleClick: handleDoubleClick,
            click: handleClick
        };

        element.addEventListener('dblclick', handleDoubleClick);
        element.addEventListener('click', handleClick);
        
        // Neutralizar efeitos problemáticos
        this.neutralizeElementEffects(element);
        
    }

    /**
     * Obter sufixo do contador (k+, +, etc.)
     */
    getCounterSuffix(counterElement) {
        const fullText = counterElement.textContent || '';
        const odometerSpan = counterElement.querySelector('span.odometer');
        if (odometerSpan) {
            return fullText.replace(odometerSpan.textContent, '').trim();
        }
        return '';
    }

    /**
     * Iniciar edição de contador
     */
    startCounterEditing(element, currentNumber, suffix) {
        const dataKey = element.getAttribute('data-key');
        
        // Criar input para o número
        const input = document.createElement('input');
        input.type = 'number';
        input.value = currentNumber;
        input.step = 'any';
        input.style.cssText = `
            width: 100px;
            padding: 8px;
            border: 2px solid #3498db;
            font-family: inherit;
            font-size: inherit;
            font-weight: inherit;
            color: inherit;
            background: white;
            border-radius: 3px;
            margin-right: 5px;
        `;

        // Criar span para mostrar o sufixo
        const suffixSpan = document.createElement('span');
        suffixSpan.textContent = suffix;
        suffixSpan.style.cssText = `
            font-family: inherit;
            font-size: inherit;
            font-weight: inherit;
            color: inherit;
        `;

        // Container para input + sufixo
        const editContainer = document.createElement('div');
        editContainer.style.cssText = `
            display: inline-flex;
            align-items: center;
            background: rgba(52, 152, 219, 0.1);
            padding: 4px;
            border-radius: 3px;
        `;
        editContainer.appendChild(input);
        editContainer.appendChild(suffixSpan);

        const finishEditing = () => {
            try {
                const newNumber = parseFloat(input.value) || 0;
                
                if (newNumber !== parseFloat(currentNumber)) {
                    // Atualizar o contador
                    const odometerSpan = element.querySelector('span.odometer');
                    if (odometerSpan) {
                        // Atualizar o data-count para o novo valor
                        odometerSpan.setAttribute('data-count', newNumber.toString());
                        
                        // Atualizar o texto diretamente (não resetar para 00)
                        odometerSpan.textContent = newNumber.toString();
                        
                        // Se houver animação odometer, reinicializar
                        if (typeof jQuery !== 'undefined' && jQuery.fn.counterUp) {
                            setTimeout(() => {
                                if (odometerSpan && document.contains(odometerSpan)) {
                                    // Resetar para 0 e animar até o novo valor
                                    odometerSpan.textContent = '0';
                                    jQuery(odometerSpan).counterUp({
                                        delay: 10,
                                        time: 1000
                                    });
                                }
                            }, 200);
                        }
                    }
                    
                    // Salvar no contentMap
                    if (!this.core.contentMap[dataKey]) {
                        this.core.contentMap[dataKey] = {};
                    }
                    this.core.contentMap[dataKey].counterValue = newNumber;
                    this.core.contentMap[dataKey].counterSuffix = suffix;
                    this.core.contentMap[dataKey].isCounter = true;
                    this.core.contentMap[dataKey].elementInfo = this.core.utils.collectElementInfo ? 
                        this.core.utils.collectElementInfo(element) : null;
                    this.core.contentMap[dataKey].timestamp = new Date().toISOString();
                    
                    
                    this.core.ui.showAlert(`Contador atualizado para ${newNumber}${suffix}!`, 'success');
                }
                
                // Restaurar elemento original com verificações de segurança
                if (element && document.contains(element)) {
                    element.style.display = '';
                }
                
                // Remover container de edição com verificação de segurança
                if (editContainer && editContainer.parentNode && document.contains(editContainer)) {
                    editContainer.remove();
                }
                
                // Re-aplicar configurações de edição apenas se o elemento ainda existir
                if (element && document.contains(element)) {
                    // Aguardar um momento antes de reconfigurar para evitar conflitos
                    setTimeout(() => {
                        if (element && document.contains(element) && !element.classList.contains('hardem-counter-element')) {
                            this.makeCounterEditable(element);
                        }
                    }, 100);
                }
                
            } catch (error) {
                
                // Fallback: tentar restaurar estado básico
                try {
                    if (element && document.contains(element)) {
                        element.style.display = '';
                    }
                    if (editContainer && editContainer.parentNode && document.contains(editContainer)) {
                        editContainer.remove();
                    }
                } catch (fallbackError) {
                }
            }
        };

        // Esconder elemento original e mostrar input
        element.style.display = 'none';
        element.parentNode.insertBefore(editContainer, element.nextSibling);
        
        // Eventos do input
        input.addEventListener('blur', finishEditing);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                try {
                    if (element && document.contains(element)) {
                        element.style.display = '';
                    }
                    if (editContainer && editContainer.parentNode && document.contains(editContainer)) {
                        editContainer.remove();
                    }
                    if (element && document.contains(element)) {
                        setTimeout(() => {
                            if (!element.classList.contains('hardem-counter-element')) {
                                this.makeCounterEditable(element);
                            }
                        }, 100);
                    }
                } catch (error) {
                }
            }
        });

        // Focar no input
        input.focus();
        input.select();
    }
}

// Expor classe globalmente
window.HardemTextEditor = HardemTextEditor; 