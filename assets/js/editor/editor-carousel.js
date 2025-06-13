/**
 * HARDEM Carousel Editor - Módulo de Edição de Carrossel
 * Gerencia edição de carrosséis e sliders
 * @version 1.0.0
 */

class HardemCarouselEditor {
    constructor(core) {
        this.core = core;
    }

    /**
     * Configurar edição de carrosséis
     */
    setupCarouselEditing(container = document) {
        // Buscar elementos de carrossel
        const carouselSelectors = [
            '.carousel',
            '.slider',
            '.swiper-container',
            '.owl-carousel',
            '[data-ride="carousel"]'
        ];
        
        carouselSelectors.forEach(selector => {
            container.querySelectorAll(selector).forEach(carousel => {
                if (!this.core.utils.isEditorElement(carousel)) {
                    this.makeCarouselEditable(carousel);
                }
            });
        });
        
        console.log('Carrosséis configurados para edição');
    }

    /**
     * Tornar carrossel editável
     */
    makeCarouselEditable(carousel) {
        carousel.classList.add('hardem-editable');
        
        const dataKey = carousel.getAttribute('data-key') || this.core.utils.generateDataKey(carousel);
        carousel.setAttribute('data-key', dataKey);
        
        carousel.title = `Editar carrossel: ${dataKey}`;
        
        // Eventos
        const handleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleCarouselClick(carousel);
        };

        const handleDoubleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showCarouselManagementPanel(carousel);
        };

        carousel.addEventListener('click', handleClick);
        carousel.addEventListener('dblclick', handleDoubleClick);
        
        console.log(`✅ Carrossel editável: ${dataKey}`);
    }

    /**
     * Manipular clique no carrossel
     */
    handleCarouselClick(carousel) {
        this.core.selectElement(carousel);
    }

    /**
     * Mostrar painel de gerenciamento do carrossel
     */
    showCarouselManagementPanel(carouselContainer) {
        const panelContent = document.getElementById('hardem-panel-content');
        const dataKey = carouselContainer.getAttribute('data-key');
        const slides = this.getCarouselSlides(carouselContainer);
        
        let html = `
            <h4>Gerenciar Carrossel</h4>
            <div class="hardem-form-group">
                <label><strong>Carrossel:</strong> ${dataKey}</label>
                <label><strong>Total de Slides:</strong> ${slides.length}</label>
            </div>
            <hr>
        `;
        
        // Botões de ação
        html += `
            <div class="hardem-form-group">
                <button onclick="window.hardemEditor.carouselEditor.previewCarousel('${dataKey}')" 
                        style="background: #3498db;">
                    👁️ Visualizar Carrossel
                </button>
                <button onclick="window.hardemEditor.carouselEditor.resetCarouselToDefaults('${dataKey}')" 
                        style="background: #e74c3c;">
                    🔄 Restaurar Padrão
                </button>
            </div>
            <hr>
        `;
        
        // Lista de slides
        html += '<h5>Slides:</h5>';
        
        slides.forEach((slide, index) => {
            const slideImg = slide.querySelector('img');
            const slideText = this.core.utils.getDirectTextContent(slide);
            
            html += `
                <div class="hardem-form-group" style="border: 1px solid #ddd; padding: 8px; margin: 4px 0; border-radius: 3px;">
                    <strong>Slide ${index + 1}</strong><br>
                    ${slideImg ? `<img src="${slideImg.src}" style="max-width: 60px; height: auto; margin: 4px 0;">` : ''}
                    ${slideText ? `<small>${slideText.substring(0, 50)}...</small>` : ''}
                    <br>
                    <button onclick="window.hardemEditor.carouselEditor.editSlide('${dataKey}', ${index})" 
                            style="margin: 2px; font-size: 10px; padding: 4px 8px;">
                        ✏️ Editar
                    </button>
                    <button onclick="window.hardemEditor.carouselEditor.uploadSlideImage(${index})" 
                            style="margin: 2px; font-size: 10px; padding: 4px 8px;">
                        📷 Imagem
                    </button>
                    <button onclick="window.hardemEditor.carouselEditor.uploadSlideBackground(${index})" 
                            style="margin: 2px; font-size: 10px; padding: 4px 8px;">
                        🖼️ Background
                    </button>
                </div>
            `;
        });
        
        // Botão aplicar todas as mudanças
        html += `
            <div class="hardem-form-group">
                <button onclick="window.hardemEditor.carouselEditor.applyAllCarouselChanges()" 
                        class="success" style="width: 100%;">
                    ✅ Aplicar Todas as Mudanças
                </button>
            </div>
        `;
        
        panelContent.innerHTML = html;
        this.core.ui.openSidePanel();
        
        // Armazenar referência do carrossel atual
        this.currentCarousel = carouselContainer;
        this.currentSlides = slides;
    }

    /**
     * Obter slides do carrossel
     */
    getCarouselSlides(carousel) {
        const slideSelectors = [
            '.carousel-item',
            '.slide',
            '.swiper-slide',
            '.owl-item',
            '.item'
        ];
        
        let slides = [];
        
        for (const selector of slideSelectors) {
            slides = Array.from(carousel.querySelectorAll(selector));
            if (slides.length > 0) break;
        }
        
        return slides;
    }

    /**
     * Editar slide específico
     */
    editSlide(carouselDataKey, slideIndex) {
        const carousel = document.querySelector(`[data-key="${carouselDataKey}"]`);
        if (!carousel) return;
        
        const slides = this.getCarouselSlides(carousel);
        const slide = slides[slideIndex];
        
        if (!slide) return;
        
        // Selecionar slide para edição
        this.core.selectElement(slide);
        
        // Destacar slide
        this.highlightCarouselSlide(slideIndex);
    }

    /**
     * Upload de imagem para slide
     */
    uploadSlideImage(slideIndex) {
        if (!this.currentSlides || !this.currentSlides[slideIndex]) return;
        
        const slide = this.currentSlides[slideIndex];
        const img = slide.querySelector('img');
        
        if (!img) {
            this.core.ui.showAlert('Nenhuma imagem encontrada neste slide!', 'error');
            return;
        }
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processSlideImageUpload(file, img, slideIndex);
            }
            input.remove();
        };
        
        document.body.appendChild(input);
        input.click();
    }

    /**
     * Upload de background para slide
     */
    uploadSlideBackground(slideIndex) {
        if (!this.currentSlides || !this.currentSlides[slideIndex]) return;
        
        const slide = this.currentSlides[slideIndex];
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processSlideBackgroundUpload(file, slide, slideIndex);
            }
            input.remove();
        };
        
        document.body.appendChild(input);
        input.click();
    }

    /**
     * Processar upload de imagem do slide
     */
    processSlideImageUpload(file, imgElement, slideIndex) {
        const processing = this.core.ui.showProcessingMessage('Processando imagem do slide...');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const newImageSrc = e.target.result;
            const dataKey = imgElement.getAttribute('data-key') || this.core.utils.generateDataKey(imgElement);
            
            // Aplicar nova imagem
            imgElement.src = newImageSrc;
            imgElement.setAttribute('data-key', dataKey);
            
            // Salvar no contentMap
            if (!this.core.contentMap[dataKey]) {
                this.core.contentMap[dataKey] = {};
            }
            this.core.contentMap[dataKey].src = newImageSrc;
            this.core.contentMap[dataKey].type = 'carousel-slide-image';
            this.core.contentMap[dataKey].slideIndex = slideIndex;
            
            processing.hide();
            this.core.ui.showAlert(`Imagem do slide ${slideIndex + 1} atualizada!`, 'success');
            
            console.log(`Imagem do slide atualizada: ${dataKey}`);
        };
        
        reader.readAsDataURL(file);
    }

    /**
     * Processar upload de background do slide
     */
    processSlideBackgroundUpload(file, slideElement, slideIndex) {
        const processing = this.core.ui.showProcessingMessage('Processando background do slide...');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const newImageSrc = e.target.result;
                let dataKey = slideElement.getAttribute('data-key');
                
                // Gerar data-key se não existir
                if (!dataKey) {
                    dataKey = this.core.utils.generateDataKey(slideElement);
                    slideElement.setAttribute('data-key', dataKey);
                }
                
                // Aplicar background com força
                slideElement.style.setProperty('background-image', `url("${newImageSrc}")`, 'important');
                slideElement.style.setProperty('background-size', 'cover', 'important');
                slideElement.style.setProperty('background-position', 'center', 'important');
                slideElement.style.setProperty('background-repeat', 'no-repeat', 'important');
                
                // Salvar no contentMap
                if (!this.core.contentMap[dataKey]) {
                    this.core.contentMap[dataKey] = {};
                }
                this.core.contentMap[dataKey].backgroundImage = newImageSrc;
                this.core.contentMap[dataKey].type = 'carousel-slide-background';
                this.core.contentMap[dataKey].slideIndex = slideIndex;
                
                // Salvar informações detalhadas do elemento para recuperação
                this.core.contentMap[dataKey].elementInfo = {
                    tagName: slideElement.tagName,
                    className: slideElement.className,
                    cssSelector: this.core.utils.generateCSSSelector(slideElement),
                    xpath: this.core.utils.generateXPath(slideElement)
                };
                
                // Esconder overlay de processamento
                processing.hide();
                
                // Forçar re-renderização
                slideElement.style.display = 'none';
                slideElement.offsetHeight; // Trigger reflow
                slideElement.style.display = '';
                
                this.core.ui.showAlert(`Background do slide ${slideIndex + 1} atualizado!`, 'success');
                
                console.log(`Background do slide atualizado: ${dataKey}`, this.core.contentMap[dataKey]);
                
                // Atualizar painel se estiver aberto
                if (this.core.currentElement === slideElement) {
                    setTimeout(() => {
                        this.core.ui.populateSidePanel(slideElement);
                    }, 100);
                }
            } catch (error) {
                console.error('Erro ao processar background:', error);
                processing.hide();
                this.core.ui.showAlert('Erro ao processar background do slide!', 'error');
            }
        };
        
        reader.onerror = (error) => {
            console.error('Erro ao ler arquivo:', error);
            processing.hide();
            this.core.ui.showAlert('Erro ao ler arquivo de imagem!', 'error');
        };
        
        reader.readAsDataURL(file);
    }

    /**
     * Destacar slide específico
     */
    highlightCarouselSlide(slideIndex) {
        // Remover destaque anterior
        document.querySelectorAll('.hardem-slide-highlight').forEach(el => {
            el.classList.remove('hardem-slide-highlight');
        });
        
        if (this.currentSlides && this.currentSlides[slideIndex]) {
            this.currentSlides[slideIndex].classList.add('hardem-slide-highlight');
            
            // Adicionar estilo de destaque temporário
            const style = document.createElement('style');
            style.innerHTML = `
                .hardem-slide-highlight {
                    outline: 3px solid #e74c3c !important;
                    outline-offset: 2px !important;
                }
            `;
            document.head.appendChild(style);
            
            // Remover após 3 segundos
            setTimeout(() => {
                this.currentSlides[slideIndex].classList.remove('hardem-slide-highlight');
                style.remove();
            }, 3000);
        }
    }

    /**
     * Visualizar carrossel
     */
    previewCarousel() {
        if (!this.currentCarousel) return;
        
        // Rolar até o carrossel
        this.core.utils.scrollToElement(this.currentCarousel);
        
        // Destacar carrossel
        this.currentCarousel.style.outline = '3px solid #3498db';
        this.currentCarousel.style.outlineOffset = '5px';
        
        // Destacar slides em sequência
        const slides = this.currentSlides;
        let currentIndex = 0;
        
        const highlightNextSlide = () => {
            // Remover destaque anterior
            slides.forEach(slide => {
                slide.style.outline = '';
                slide.style.outlineOffset = '';
            });
            
            // Destacar slide atual
            if (slides[currentIndex]) {
                slides[currentIndex].style.outline = '2px solid #e74c3c';
                slides[currentIndex].style.outlineOffset = '2px';
            }
            
            currentIndex = (currentIndex + 1) % slides.length;
            
            if (currentIndex === 0) {
                // Parar após um ciclo completo
                setTimeout(() => {
                    slides.forEach(slide => {
                        slide.style.outline = '';
                        slide.style.outlineOffset = '';
                    });
                    this.currentCarousel.style.outline = '';
                    this.currentCarousel.style.outlineOffset = '';
                }, 1000);
            } else {
                setTimeout(highlightNextSlide, 1000);
            }
        };
        
        setTimeout(highlightNextSlide, 500);
    }

    /**
     * Restaurar carrossel aos padrões
     */
    resetCarouselToDefaults() {
        if (!this.currentCarousel) return;
        
        if (confirm('Tem certeza que deseja restaurar este carrossel aos padrões? Todas as personalizações serão perdidas.')) {
            const carouselDataKey = this.currentCarousel.getAttribute('data-key');
            
            // Remover dados do carrossel do contentMap
            Object.keys(this.core.contentMap).forEach(key => {
                const content = this.core.contentMap[key];
                if (content.type && content.type.includes('carousel')) {
                    delete this.core.contentMap[key];
                }
            });
            
            // Restaurar imagens originais dos slides
            this.currentSlides.forEach(slide => {
                const img = slide.querySelector('img');
                if (img && img.dataset.originalSrc) {
                    img.src = img.dataset.originalSrc;
                }
                
                if (slide.dataset.originalBackground) {
                    slide.style.backgroundImage = slide.dataset.originalBackground;
                }
            });
            
            this.core.ui.showAlert('Carrossel restaurado aos padrões!', 'success');
            console.log(`Carrossel restaurado: ${carouselDataKey}`);
        }
    }

    /**
     * Popular painel do slide do carrossel
     */
    populateCarouselSlidePanel(slideElement, content) {
        const panelContent = document.getElementById('hardem-panel-content');
        const dataKey = slideElement.getAttribute('data-key') || this.core.utils.generateDataKey(slideElement);
        
        let html = `
            <h4>🎠 Editar Slide do Carrossel</h4>
            <div class="hardem-form-group">
                <label><strong>Slide:</strong> ${dataKey}</label>
            </div>
            <hr>
        `;
        
        // Edição de texto do slide
        const titleElement = slideElement.querySelector('.title, h1, h2, h3, h4, h5, h6');
        const descElement = slideElement.querySelector('.disc, .description, p');
        
        if (titleElement) {
            const titleText = content.title || this.core.utils.getDirectTextContent(titleElement);
            html += `
                <div class="hardem-form-group">
                    <label for="hardem-slide-title">Título do Slide:</label>
                    <input type="text" id="hardem-slide-title" value="${titleText}" placeholder="Digite o título...">
                </div>
            `;
        }
        
        if (descElement) {
            const descText = content.description || this.core.utils.getDirectTextContent(descElement);
            html += `
                <div class="hardem-form-group">
                    <label for="hardem-slide-desc">Descrição do Slide:</label>
                    <textarea id="hardem-slide-desc" placeholder="Digite a descrição...">${descText}</textarea>
                </div>
            `;
        }
        
        // Upload de background
        html += `
            <div class="hardem-form-group">
                <label for="hardem-slide-bg">Imagem de Fundo do Slide:</label>
                <input type="file" id="hardem-slide-bg" accept="image/*">
                <button onclick="window.hardemEditor.carouselEditor.uploadSlideBackgroundFromPanel()">
                    📤 Upload Background
                </button>
            </div>
        `;
        
        html += `
            <div class="hardem-form-group">
                <button onclick="window.hardemEditor.carouselEditor.applySlideChanges()" class="success">
                    ✅ Aplicar Mudanças do Slide
                </button>
            </div>
        `;
        
        panelContent.innerHTML = html;
    }

    /**
     * Aplicar mudanças do slide
     */
    applySlideChanges() {
        if (!this.core.currentElement) return;
        
        const slideElement = this.core.currentElement;
        const dataKey = slideElement.getAttribute('data-key');
        
        // Aplicar título
        const titleInput = document.getElementById('hardem-slide-title');
        const titleElement = slideElement.querySelector('.title, h1, h2, h3, h4, h5, h6');
        if (titleInput && titleElement && titleInput.value.trim()) {
            titleElement.textContent = titleInput.value.trim();
            
            if (!this.core.contentMap[dataKey]) {
                this.core.contentMap[dataKey] = {};
            }
            this.core.contentMap[dataKey].title = titleInput.value.trim();
        }
        
        // Aplicar descrição
        const descInput = document.getElementById('hardem-slide-desc');
        const descElement = slideElement.querySelector('.disc, .description, p');
        if (descInput && descElement && descInput.value.trim()) {
            descElement.textContent = descInput.value.trim();
            
            if (!this.core.contentMap[dataKey]) {
                this.core.contentMap[dataKey] = {};
            }
            this.core.contentMap[dataKey].description = descInput.value.trim();
        }
        
        this.core.ui.showAlert('Mudanças do slide aplicadas!', 'success');
        console.log('Mudanças do slide aplicadas para:', dataKey);
    }

    /**
     * Upload de background do slide via painel
     */
    uploadSlideBackgroundFromPanel() {
        if (!this.core.currentElement) {
            this.core.ui.showAlert('Selecione um slide primeiro!', 'error');
            return;
        }

        const fileInput = document.getElementById('hardem-slide-bg');
        if (!fileInput || !fileInput.files[0]) {
            this.core.ui.showAlert('Selecione um arquivo de imagem!', 'error');
            return;
        }

        const file = fileInput.files[0];
        const slideElement = this.core.currentElement;
        
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            this.core.ui.showAlert('Por favor, selecione apenas arquivos de imagem!', 'error');
            return;
        }
        
        // Validar tamanho do arquivo (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.core.ui.showAlert('Arquivo muito grande! Máximo 5MB.', 'error');
            return;
        }
        
        this.processSlideBackgroundUpload(file, slideElement, 0);
    }

    /**
     * Upload de thumbnail do carrossel
     */
    uploadCarouselThumbnail(thumbIndex) {
        if (!this.currentCarousel) return;
        
        const thumbs = this.currentCarousel.querySelectorAll('.mySwiper-thumbnail .swiper-slide');
        if (!thumbs[thumbIndex]) {
            this.core.ui.showAlert('Thumbnail não encontrado!', 'error');
            return;
        }
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processCarouselThumbnailUpload(file, thumbs[thumbIndex], thumbIndex);
            }
            input.remove();
        };
        
        document.body.appendChild(input);
        input.click();
    }

    /**
     * Processar upload de thumbnail
     */
    processCarouselThumbnailUpload(file, thumbElement, thumbIndex) {
        const processing = this.core.ui.showProcessingMessage('Processando thumbnail...');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const newImageSrc = e.target.result;
            const imgElement = thumbElement.querySelector('img');
            
            if (imgElement) {
                const dataKey = imgElement.getAttribute('data-key') || this.core.utils.generateDataKey(imgElement);
                
                // Aplicar nova imagem
                imgElement.src = newImageSrc;
                imgElement.setAttribute('data-key', dataKey);
                
                // Salvar no contentMap
                if (!this.core.contentMap[dataKey]) {
                    this.core.contentMap[dataKey] = {};
                }
                this.core.contentMap[dataKey].src = newImageSrc;
                this.core.contentMap[dataKey].type = 'carousel-thumbnail';
                this.core.contentMap[dataKey].thumbIndex = thumbIndex;
                
                processing.hide();
                this.core.ui.showAlert(`Thumbnail ${thumbIndex + 1} atualizado!`, 'success');
                
                console.log(`Thumbnail atualizado: ${dataKey}`);
            }
        };
        
        reader.readAsDataURL(file);
    }

    /**
     * Destacar slide específico
     */
    highlightCarouselSlide(slideIndex) {
        if (!this.currentCarousel) return;
        
        const slides = this.currentCarousel.querySelectorAll('.mySwiper-banner-four .swiper-slide');
        const targetSlide = slides[slideIndex];
        
        if (targetSlide) {
            // Remove highlight de outros elementos
            document.querySelectorAll('.hardem-highlight-element').forEach(el => {
                el.classList.remove('hardem-highlight-element');
            });
            
            // Adiciona highlight ao slide
            targetSlide.classList.add('hardem-highlight-element');
            
            // Scroll para o elemento
            targetSlide.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Remover highlight após 3 segundos
            setTimeout(() => {
                targetSlide.classList.remove('hardem-highlight-element');
            }, 3000);
            
            this.core.ui.showAlert(`📍 Slide ${slideIndex + 1} destacado!`, 'success');
        }
    }

    /**
     * Destacar thumbnail específico
     */
    highlightCarouselThumbnail(thumbIndex) {
        if (!this.currentCarousel) return;
        
        const thumbs = this.currentCarousel.querySelectorAll('.mySwiper-thumbnail .swiper-slide');
        const targetThumb = thumbs[thumbIndex];
        
        if (targetThumb) {
            // Remover highlight anterior
            document.querySelectorAll('.hardem-highlight-element').forEach(el => {
                el.classList.remove('hardem-highlight-element');
            });
            
            // Adicionar estilo de destaque temporário se não existir
            if (!document.getElementById('hardem-highlight-style')) {
                const style = document.createElement('style');
                style.id = 'hardem-highlight-style';
                style.innerHTML = `
                    .hardem-highlight-element {
                        outline: 3px solid #e74c3c !important;
                        outline-offset: 2px !important;
                        animation: hardem-pulse 1s infinite;
                    }
                    @keyframes hardem-pulse {
                        0% { outline-color: #e74c3c; }
                        50% { outline-color: #c0392b; }
                        100% { outline-color: #e74c3c; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            targetThumb.classList.add('hardem-highlight-element');
            targetThumb.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            setTimeout(() => {
                targetThumb.classList.remove('hardem-highlight-element');
            }, 3000);
            
            this.core.ui.showAlert(`📍 Thumbnail ${thumbIndex + 1} destacado!`, 'success');
        }
    }

    /**
     * Pré-visualizar carrossel (simular clique nos slides)
     */
    previewCarousel() {
        if (!this.currentCarousel) return;
        
        const slides = this.currentCarousel.querySelectorAll('.mySwiper-banner-four .swiper-slide');
        
        if (slides.length === 0) {
            this.core.ui.showAlert('❌ Nenhum slide encontrado para pré-visualizar!', 'error');
            return;
        }
        
        this.core.ui.showAlert('🎬 Iniciando pré-visualização do carrossel...', 'info');
        
        let currentSlideIndex = 0;
        const highlightNextSlide = () => {
            // Remove highlight anterior
            document.querySelectorAll('.hardem-highlight-element').forEach(el => {
                el.classList.remove('hardem-highlight-element');
            });
            
            // Destaca slide atual
            const currentSlide = slides[currentSlideIndex];
            currentSlide.classList.add('hardem-highlight-element');
            currentSlide.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            currentSlideIndex = (currentSlideIndex + 1) % slides.length;
            
            if (currentSlideIndex === 0) {
                // Fim da pré-visualização
                setTimeout(() => {
                    document.querySelectorAll('.hardem-highlight-element').forEach(el => {
                        el.classList.remove('hardem-highlight-element');
                    });
                    this.core.ui.showAlert('✅ Pré-visualização concluída!', 'success');
                }, 1500);
            } else {
                // Continua para o próximo slide
                setTimeout(highlightNextSlide, 1500);
            }
        };
        
        highlightNextSlide();
    }

    /**
     * Restaurar carrossel para configurações padrão
     */
    resetCarouselToDefaults() {
        if (!confirm('🔄 Tem certeza que deseja restaurar o carrossel para as configurações padrão? Esta ação não pode ser desfeita.')) {
            return;
        }
        
        if (!this.currentCarousel) return;
        
        const slides = this.currentCarousel.querySelectorAll('.mySwiper-banner-four .swiper-slide');
        const thumbs = this.currentCarousel.querySelectorAll('.mySwiper-thumbnail .swiper-slide');
        
        // Textos padrão para os slides
        const defaultTexts = [
            {
                title: "Let's Build Future Home Together",
                description: "We are dedicated to building structures that last and relationships that endure. With a focus on quality, precision, and innovation."
            },
            {
                title: "Excellence in Construction",
                description: "From residential to commercial projects, we deliver exceptional results with attention to detail and professional craftsmanship."
            },
            {
                title: "Your Dream, Our Expertise",
                description: "Transform your vision into reality with our experienced team of construction professionals and innovative building solutions."
            },
            {
                title: "Quality Construction Services",
                description: "Providing comprehensive construction services with commitment to quality, safety, and customer satisfaction."
            }
        ];
        
        // Restaurar textos dos slides
        slides.forEach((slide, index) => {
            const titleElement = slide.querySelector('.title');
            const descElement = slide.querySelector('.disc');
            
            if (titleElement && defaultTexts[index]) {
                titleElement.textContent = defaultTexts[index].title;
                const titleDataKey = titleElement.getAttribute('data-key') || `slide_title_${index}`;
                this.core.contentMap[titleDataKey] = defaultTexts[index].title;
            }
            
            if (descElement && defaultTexts[index]) {
                descElement.textContent = defaultTexts[index].description;
                const descDataKey = descElement.getAttribute('data-key') || `slide_desc_${index}`;
                this.core.contentMap[descDataKey] = defaultTexts[index].description;
            }
            
            // Remover backgrounds customizados
            const bgElement = slide.querySelector('.bg-banner-four');
            if (bgElement) {
                bgElement.style.removeProperty('background-image');
                const bgDataKey = bgElement.getAttribute('data-key');
                if (bgDataKey && this.core.contentMap[bgDataKey]) {
                    delete this.core.contentMap[bgDataKey];
                }
            }
        });
        
        // Restaurar thumbnails padrão
        const defaultThumbs = [
            'assets/images/banner/09.webp',
            'assets/images/banner/10.webp',
            'assets/images/banner/09.webp',
            'assets/images/banner/10.webp',
            'assets/images/banner/09.webp'
        ];
        
        thumbs.forEach((thumb, index) => {
            const imgElement = thumb.querySelector('img');
            if (imgElement && defaultThumbs[index]) {
                imgElement.src = defaultThumbs[index];
                const thumbDataKey = imgElement.getAttribute('data-key');
                if (thumbDataKey && this.core.contentMap[thumbDataKey]) {
                    delete this.core.contentMap[thumbDataKey];
                }
            }
        });
        
        // Salvar alterações
        this.core.storage.saveContent();
        
        // Recarregar o painel do carrossel
        this.showCarouselManagementPanel(this.currentCarousel);
        
        this.core.ui.showAlert('🔄 Carrossel restaurado para configurações padrão!', 'success');
    }

    /**
     * Aplicar todas as mudanças do carrossel
     */
    applyAllCarouselChanges() {
        if (!this.currentCarousel) return;
        
        const mainSlides = this.currentCarousel.querySelectorAll('.mySwiper-banner-four .swiper-slide');
        
        let changesApplied = 0;
        
        // Aplicar mudanças nos slides principais
        mainSlides.forEach((slide, index) => {
            const titleInput = document.getElementById(`slide-title-${index}`);
            const descInput = document.getElementById(`slide-desc-${index}`);
            
            if (titleInput && titleInput.value.trim()) {
                const titleElement = slide.querySelector('.title');
                if (titleElement) {
                    titleElement.textContent = titleInput.value.trim();
                    const titleDataKey = titleElement.getAttribute('data-key') || `slide_title_${index}`;
                    titleElement.setAttribute('data-key', titleDataKey);
                    this.core.contentMap[titleDataKey] = titleInput.value.trim();
                    changesApplied++;
                }
            }
            
            if (descInput && descInput.value.trim()) {
                const descElement = slide.querySelector('.disc');
                if (descElement) {
                    descElement.textContent = descInput.value.trim();
                    const descDataKey = descElement.getAttribute('data-key') || `slide_desc_${index}`;
                    descElement.setAttribute('data-key', descDataKey);
                    this.core.contentMap[descDataKey] = descInput.value.trim();
                    changesApplied++;
                }
            }
        });
        
        if (changesApplied > 0) {
            this.core.ui.showAlert(`✅ ${changesApplied} alterações aplicadas no carrossel!`, 'success');
            this.core.storage.saveContent();
        } else {
            this.core.ui.showAlert('ℹ️ Nenhuma alteração encontrada para aplicar.', 'info');
        }
    }
}

// Expor classe globalmente
window.HardemCarouselEditor = HardemCarouselEditor; 