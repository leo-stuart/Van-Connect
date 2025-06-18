// Arquivo: codigo/public/modulos/filtros/filtros.js (Versão Corrigida)

document.addEventListener('DOMContentLoaded', () => {
    const resultsContainer = document.getElementById('results-container');
    const filterForm = document.getElementById('filter-form');
    const clearFiltersButton = document.getElementById('clear-filters-button');
    const sortSelect = document.getElementById('sort-select');
    const API_BASE_URL = 'http://localhost:3000';

    // **ALTERAÇÃO**: Obter o usuário atual para tornar as avaliações específicas.
    const currentUser = Auth.getCurrentUser();


    let allData = { routes: [], drivers: [], schools: [], vehicles: [], avaliacoes: [] };

    async function fetchInitialData() {
        resultsContainer.innerHTML = '<p class="loading-message">Carregando rotas...</p>';
        try {
            console.log('Fetching initial data...'); // Debug log
            const [routesRes, driversRes, schoolsRes, vehiclesRes, avaliacoesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/routes`),
                fetch(`${API_BASE_URL}/drivers`),
                fetch(`${API_BASE_URL}/schools`),
                fetch(`${API_BASE_URL}/vehicles`),
                fetch(`${API_BASE_URL}/avaliacoes`)
            ]);

            // Check if any response is not ok
            if (!routesRes.ok) throw new Error(`Failed to fetch routes: ${routesRes.status}`);
            if (!driversRes.ok) throw new Error(`Failed to fetch drivers: ${driversRes.status}`);
            if (!schoolsRes.ok) throw new Error(`Failed to fetch schools: ${schoolsRes.status}`);
            if (!vehiclesRes.ok) throw new Error(`Failed to fetch vehicles: ${vehiclesRes.status}`);
            if (!avaliacoesRes.ok) throw new Error(`Failed to fetch ratings: ${avaliacoesRes.status}`);

            allData = {
                routes: await routesRes.json(),
                drivers: await driversRes.json(),
                schools: await schoolsRes.json(),
                vehicles: await vehiclesRes.json(),
                avaliacoes: await avaliacoesRes.json()
            };


            applyFilters();
        } catch (error) {
            console.error("Erro ao carregar dados iniciais:", error);
            resultsContainer.innerHTML = `<p class="no-results">Erro ao carregar as rotas: ${error.message}</p>`;
        }
    }

    function calcularMediaAvaliacoes(routeId, avaliacoes) {
        if (routeId === null || routeId === undefined) return null;
        const notas = avaliacoes
            .filter(av => String(av.routeId) === String(routeId))
            .map(av => av.rating);
        if (notas.length === 0) return null;
        const soma = notas.reduce((a, b) => a + b, 0);
        return soma / notas.length;
    }

    function displayRoutes(routesToDisplay) {
        resultsContainer.innerHTML = '';

        const driverMap = new Map(allData.drivers.map(d => [String(d.id), d.name]));
        const schoolMap = new Map(allData.schools.map(s => [String(s.id), s.name]));
        const driverVehiclesMap = new Map();
        allData.vehicles.forEach(vehicle => {
            if (vehicle.driverId) {
                if (!driverVehiclesMap.has(vehicle.driverId)) {
                    driverVehiclesMap.set(vehicle.driverId, []);
                }
                driverVehiclesMap.get(vehicle.driverId).push(vehicle);
            }
        });

        const availableRoutes = routesToDisplay.filter(route => {
            const driverVehicles = driverVehiclesMap.get(String(route.driverId)) || [];
            return driverVehicles.some(vehicle => vehicle.availableSpots > 0);
        });

        if (availableRoutes.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">Nenhuma rota encontrada com os critérios selecionados.</p>';
            return;
        }

        availableRoutes.forEach(route => {
            const routeCardLink = document.createElement('a');
            routeCardLink.href = `../perfilMotorista/detalhes.html?driverId=${route.driverId}`;
            routeCardLink.className = 'route-card';
            routeCardLink.setAttribute('aria-label', `Ver detalhes da rota ${route.routeName}`);

            const driverName = driverMap.get(String(route.driverId)) || 'Não atribuído';
            const driverVehicles = driverVehiclesMap.get(String(route.driverId)) || [];
            const vehicle = driverVehicles.find(v => v.availableSpots > 0);
            const spots = vehicle ? vehicle.availableSpots : 'N/D';
            const price = Number(route.price).toFixed(2).replace('.', ',');
            const neighborhoods = route.neighborhoodsServed?.join(', ') || 'Não informado';

            let schoolsList;
            if (route.schoolIds && route.schoolIds.length > 0) {
                schoolsList = `<ul class="schools-list-summary">${route.schoolIds.map(id => `<li>${schoolMap.get(String(id)) || 'Escola desconhecida'}</li>`).join('')}</ul>`;
            } else {
                schoolsList = '<span>Nenhuma escola específica listada.</span>';
            }

            const mediaAvaliacao = calcularMediaAvaliacoes(route.id, allData.avaliacoes);
            const numeroAvaliacoes = allData.avaliacoes.filter(av => String(av.routeId) === String(route.id)).length;
            const hasValidId = route.id !== null && route.id !== undefined;

            const averageStarsHTML = mediaAvaliacao ? `<div class="stars" title="Média: ${mediaAvaliacao.toFixed(1)} de 5 estrelas">${'★'.repeat(Math.round(mediaAvaliacao))}${'☆'.repeat(5 - Math.round(mediaAvaliacao))} <span class="rating-count">(${numeroAvaliacoes} ${numeroAvaliacoes === 1 ? 'avaliação' : 'avaliações'})</span></div>` : `<div class="stars stars-empty">Sem avaliações</div>`;
            
            let userInteractionHTML = '';
            // **ALTERAÇÃO**: Apenas usuários logados como 'parent' podem ver a interface de avaliação.
            if (currentUser && currentUser.role === 'parent' && hasValidId) {
                // **ALTERAÇÃO**: Verifica se o usuário atual já avaliou esta rota, checando o array de avaliações.
                const hasUserRated = allData.avaliacoes.some(av => String(av.routeId) === String(route.id) && String(av.userId) === String(currentUser.id));
                
                if (hasUserRated) {
                    userInteractionHTML = `<div class="rating-voted">Obrigado por sua avaliação!</div>`;
                } else {
                    userInteractionHTML = `<div class="rating-interactive" data-route-id="${route.id}"><span class="rating-label">Avalie:</span>${[1, 2, 3, 4, 5].map(num => `<span class="star" data-score="${num}">☆</span>`).join('')}</div>`;
                }
            }

            routeCardLink.innerHTML = `<h3>${route.routeName || 'Rota sem nome'}</h3><p><strong>Motorista:</strong> ${driverName}</p><p><strong>Turno:</strong> ${route.shift}</p><p><strong>Bairros Atendidos:</strong> ${neighborhoods}</p><div class="school-info"><strong>Escolas Atendidas:</strong>${schoolsList}</div><div class="rating-section">${averageStarsHTML}${userInteractionHTML}</div><p class="price">R$ ${price} / mês</p><p><strong>Vagas Disponíveis:</strong> ${spots}</p>`;
            resultsContainer.appendChild(routeCardLink);
        });
    }

    resultsContainer.addEventListener('click', async (e) => {
        if (!e.target.classList.contains('star')) return;
        e.preventDefault();
        e.stopPropagation();

        // **ALTERAÇÃO**: Garante que apenas usuários logados e do tipo 'parent' possam avaliar.
        if (!currentUser || currentUser.role !== 'parent') {
            alert("Você precisa estar logado como um responsável para avaliar uma rota.");
            return;
        }

        const score = parseInt(e.target.dataset.score);
        const routeId = e.target.closest('.rating-interactive').dataset.routeId;

        if (!routeId || routeId === 'undefined' || routeId === 'null') {
            console.error("Tentativa de avaliar rota com ID inválido:", routeId);
            alert("Não é possível avaliar esta rota pois seu identificador é inválido.");
            return;
        }

        const hasUserRated = allData.avaliacoes.some(av => String(av.routeId) === String(routeId) && String(av.userId) === String(currentUser.id));
        if (hasUserRated) {
            alert("Você já avaliou essa rota!");
            return;
        }

        try {
            // **ALTERAÇÃO**: Inclui o ID do usuário ao enviar a nova avaliação.
            const newEvaluation = {
                routeId: routeId,
                rating: score,
                userId: currentUser.id // Adiciona o ID do usuário logado
            };

            await fetch(`${API_BASE_URL}/avaliacoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEvaluation)
            });
            
            alert("Obrigado por sua avaliação!");
            fetchInitialData();

        } catch (err) {
            console.error("Erro ao enviar avaliação", err);
            alert("Erro ao registrar sua avaliação.");
        }
    });
    
    function sortRoutes(routes, sortBy) {
        switch (sortBy) {
            case 'price-asc':
                return routes.sort((a, b) => a.price - b.price);
            case 'price-desc':
                return routes.sort((a, b) => b.price - a.price);
            case 'rating-desc':
                return routes.sort((a, b) => {
                    const ratingA = calcularMediaAvaliacoes(a.id, allData.avaliacoes) || 0;
                    const ratingB = calcularMediaAvaliacoes(b.id, allData.avaliacoes) || 0;
                    return ratingB - ratingA;
                });
            default:
                return routes;
        }
    }

    function applyFilters() {
        const bairroValue = document.getElementById('bairro-input').value.trim().toLowerCase();
        const turnoValue = document.getElementById('turno-select').value;
        const escolaValue = document.getElementById('escola-input').value.trim().toLowerCase();
        
        let filteredRoutes = allData.routes;

        if (bairroValue) {
            filteredRoutes = filteredRoutes.filter(route => route.neighborhoodsServed?.some(bairro => bairro.toLowerCase().includes(bairroValue)));
        }
        if (turnoValue) {
            filteredRoutes = filteredRoutes.filter(route => route.shift === turnoValue);
        }
        if (escolaValue) {
            const schoolMap = new Map(allData.schools.map(s => [String(s.id), s.name.toLowerCase()]));
            filteredRoutes = filteredRoutes.filter(route => route.schoolIds?.some(schoolId => {
                const schoolName = schoolMap.get(String(schoolId));
                return schoolName && schoolName.includes(escolaValue);
            }));
        }

        const sortValue = sortSelect.value;
        const sortedRoutes = sortRoutes(filteredRoutes, sortValue);
        
        displayRoutes(sortedRoutes);
    }

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        applyFilters();
    });

    sortSelect.addEventListener('change', applyFilters);

    clearFiltersButton.addEventListener('click', () => {
        filterForm.reset();
        sortSelect.value = 'default';
        applyFilters();
    });

    fetchInitialData();
});