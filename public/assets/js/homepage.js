document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/homepageContent';

    async function fetchHomepageData() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Falha ao carregar conteúdo da homepage.');
            }
            const content = await response.json();
            
            // Garante que o link da calculadora sempre aponte para o caminho correto
            if (content.calculatorCta) {
                content.calculatorCta.buttonLink = '/public/modulos/calculadora/calculadora.html';
            }
            
            renderHomepage(content);

        } catch (error) {
            console.error(error);
            const heroTitle = document.getElementById('hero-title');
            if (heroTitle) {
                heroTitle.textContent = "Conteúdo indisponível";
            }
        }
    }


    function renderHomepage(content) {
        // Seção Hero
        if (content.hero) {
            const heroTitle = document.getElementById('hero-title');
            const heroSubtitle = document.getElementById('hero-subtitle');
            const heroBtn = document.getElementById('hero-cta-button');
            const heroSection = document.getElementById('hero-section');

            if(heroTitle) heroTitle.textContent = content.hero.title;
            if(heroSubtitle) heroSubtitle.textContent = content.hero.subtitle;
            if(heroBtn) {
                heroBtn.textContent = content.hero.ctaButtonText;
                heroBtn.href = content.hero.ctaButtonLink;
            }
            if (heroSection && content.hero.backgroundImage) {
                heroSection.style.backgroundImage = `url(${content.hero.backgroundImage})`;
            }
        }

        // Seção Como Funciona
        const howTitle = document.getElementById('how-title');
        const stepsContainer = document.getElementById('how-steps-container');
        if (howTitle && stepsContainer && content.howItWorks && content.howItWorks.steps) {
            howTitle.textContent = content.howItWorks.title;
            stepsContainer.innerHTML = content.howItWorks.steps.map(step => 
                `<div class="step-card">
                    <img src="${step.icon}" alt="">
                    <h3>${step.title}</h3>
                    <p>${step.description || ''}</p>
                </div>`
            ).join('');
        }

        // Seção Rotas em Destaque
        const featuredTitle = document.getElementById('featured-title');
        const routesContainer = document.getElementById('featured-routes-container');
        if (featuredTitle && routesContainer && content.featuredRoutes && content.featuredRoutes.routes) {
            featuredTitle.textContent = content.featuredRoutes.title;
            routesContainer.innerHTML = content.featuredRoutes.routes.map(route => 
                `<article class="route-card-featured">
                    <div class="route-image"><img src="${route.image}" alt=""></div>
                    <div class="route-info">
                        <h3>${route.routeName}</h3>
                        <p><strong>Bairros:</strong> ${route.mainNeighborhoods}</p>
                        <p><strong>Escolas:</strong> ${route.mainSchools}</p>
                        <p class="route-price">R$ ${Number(route.price).toFixed(2).replace('.', ',')}</p>
                        <a href="${route.detailsLink}" class="cta-button">Ver Detalhes</a>
                    </div>
                </article>`
            ).join('');
        }

        // Seção Depoimentos
        const testimonialsTitle = document.getElementById('testimonials-title');
        const testimonialsContainer = document.getElementById('testimonials-container');
        if (testimonialsTitle && testimonialsContainer && content.testimonials && content.testimonials.reviews) {
            testimonialsTitle.textContent = content.testimonials.title;
            const reviews = content.testimonials.reviews;
            let currentReview = 0;

            function showReview(index) {
                if(!reviews[index]) return;
                testimonialsContainer.innerHTML = `
                    <div class="testimonial-item active">
                        <img src="${reviews[index].avatar}" alt="Avatar de ${reviews[index].author}" class="avatar">
                        <blockquote>${reviews[index].quote}</blockquote>
                        <p class="author">- ${reviews[index].author}</p>
                    </div>`;
            }

            showReview(currentReview);

            document.getElementById('next-testimonial').addEventListener('click', () => {
                currentReview = (currentReview + 1) % reviews.length;
                showReview(currentReview);
            });

            document.getElementById('prev-testimonial').addEventListener('click', () => {
                currentReview = (currentReview - 1 + reviews.length) % reviews.length;
                showReview(currentReview);
            });
        }
        
        // Seção Estatísticas
        const statsTitle = document.getElementById('stats-title');
        const statsContainer = document.getElementById('stats-container');
        if (statsTitle && statsContainer && content.stats && content.stats.items) {
            statsTitle.textContent = content.stats.title;
            statsContainer.innerHTML = content.stats.items.map(stat => 
                `<div class="stat-item">
                    <img src="${stat.icon}" alt="">
                    <div class="stat-value">${stat.value}</div>
                    <div class="stat-label">${stat.label}</div>
                </div>`
            ).join('');
        }
        
        // Seção CTA Calculadora
        if (content.calculatorCta) {
            const ctaTitle = document.getElementById('calculator-cta-title');
            const ctaSubtitle = document.getElementById('calculator-cta-subtitle');
            const ctaButton = document.getElementById('calculator-cta-button');

            if(ctaTitle) ctaTitle.textContent = content.calculatorCta.title;
            if(ctaSubtitle) ctaSubtitle.textContent = content.calculatorCta.subtitle;
            if(ctaButton) {
                ctaButton.textContent = content.calculatorCta.buttonText;
                // Garante que o link sempre aponte para o caminho correto
                ctaButton.href = '/public/modulos/calculadora/calculadora.html';
            }
        }

        // Atualiza o ano no rodapé
        const currentYearEl = document.getElementById('current-year');
        if (currentYearEl) {
            currentYearEl.textContent = new Date().getFullYear();
        }
    }
    
    fetchHomepageData();
});