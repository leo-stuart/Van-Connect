// Arquivo: codigo/public/modulos/localizador.js (VERSÃO CORRIGIDA E MELHORADA)

document.addEventListener('DOMContentLoaded', () => {
    // Pega o ID da rota e do motorista da URL
    const params = new URLSearchParams(document.location.search);
    const routeId = parseInt(params.get("routeId"));
    const driverId = parseInt(params.get("driverId")); // Necessário para o rastreamento

    let map;
    let vanMarker;
    let studentMarkers = []; // Array para guardar os marcadores dos alunos

    /**
     * Função principal que busca os dados e inicializa o mapa e o rastreamento.
     */
    async function inicializarLocalizador() {
        const mapContainer = document.getElementById('map');
        const infoPanel = document.querySelector('.info');

        if (!routeId || !driverId) {
            const errorMessage = "Erro: ID da rota ou do motorista não foi encontrado na URL.";
            console.error(errorMessage);
            mapContainer.innerHTML = `<p class="error-message">${errorMessage}</p>`;
            infoPanel.style.display = 'none';
            return;
        }

        try {
            // 1. Busca a rota e expande os dados do motorista e dos alunos nos pontos de coleta
            const rotaResponse = await fetch(`https://van-connect-api.onrender.com/routes/${routeId}?_expand=driver`);
            if (!rotaResponse.ok) throw new Error("Rota não encontrada.");
            const rota = await rotaResponse.json();

            // Pega o veículo associado ao motorista
            const veiculoResponse = await fetch(`https://van-connect-api.onrender.com/vehicles?driverId=${rota.driver.id}`);
            const veiculos = await veiculoResponse.json();
            const veiculo = veiculos.length > 0 ? veiculos[0] : { model: 'Não informado' };

            // 2. Popula o painel de informações
            document.getElementById('van-driver').innerText = rota.driver.name;
            document.getElementById('van-model').innerText = veiculo.model;
            document.getElementById('route-name').innerText = rota.routeName;
            document.getElementById('image').innerHTML = `<img src="${rota.driver.photoUrl || '../../images/avatars/avatar_placeholder.png'}" alt="Foto de ${rota.driver.name}">`;

            // 3. Inicializa o mapa
            const initialCoords = rota.driver.realtimeLocation?.longLat || [-43.9397233, -19.9332786];

            mapboxgl.accessToken = 'pk.eyJ1Ijoicm9tbWVsY2FybmVpcm8tcHVjIiwiYSI6ImNsb3ZuMTBoejBsd2gyamwzeDZzcWl5b3oifQ.VPWc3qoyon8Z_-URfKpvKg';
            map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v12',
                center: initialCoords,
                zoom: 13
            });
            map.addControl(new mapboxgl.NavigationControl());
            
            // 4. Cria o marcador da van
            const el = document.createElement('div');
            el.className = 'van-marker';
            el.style.cssText = `
            background-image: url(../../images/icons/van-icon.png);
            width: 40px;
            height: 40px;
            background-size: contain;
            background-repeat: no-repeat;
        `;
            vanMarker = new mapboxgl.Marker(el)
                .setLngLat(initialCoords)
                .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>${rota.driver.name}</h3>`))
                .addTo(map);

            // 5. Adiciona marcadores para cada ponto de coleta (alunos) e ponto final
            addRoutePointsToMap(rota.pickupPoints || [], rota.endPoint);

            // 6. Inicia o rastreamento em tempo real
            iniciarRastreamentoSSE(rota.driver.id);

        } catch (error) {
            console.error("Erro ao inicializar o localizador:", error);
            mapContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
            infoPanel.style.display = 'none';
        }
    }

    /**
     * Adiciona os marcadores de alunos e ponto final no mapa.
     * @param {Array} pickupPoints - Array de pontos de coleta da rota.
     * @param {Object} endPoint - Objeto do ponto final da rota.
     */
    async function addRoutePointsToMap(pickupPoints, endPoint) {
        // Limpa marcadores de alunos antigos
        studentMarkers.forEach(marker => marker.remove());
        studentMarkers = [];

        // Marcador para o Ponto Final (Escola/Destino)
        if (endPoint?.longLat) {
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>Ponto Final</h3><p>${endPoint.name || 'Destino da rota'}</p>`);
            new mapboxgl.Marker({ color: "red" })
                .setLngLat(endPoint.longLat)
                .setPopup(popup)
                .addTo(map);
        }

        // Marcadores para os Pontos de Coleta (Alunos)
        for (const point of pickupPoints) {
            if (point.longLat && point.studentId) {
                // Busca o nome do aluno para o popup
                const studentRes = await fetch(`https://van-connect-api.onrender.com/students/${point.studentId}`);
                const student = await studentRes.json();
                const studentName = student?.name || 'Aluno';
                
                const popup = new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`<h5><i class="fa fa-child" aria-hidden="true"></i> Ponto de Coleta</h5><p>${studentName}</p>`);

                const marker = new mapboxgl.Marker({ color: "orange" })
                    .setLngLat(point.longLat)
                    .setPopup(popup)
                    .addTo(map);
                studentMarkers.push(marker);
            }
        }
    }

    /**
     * Conecta-se ao servidor para receber atualizações de localização em tempo real.
     * @param {number} driverId - O ID do motorista a ser rastreado.
     */
    function iniciarRastreamentoSSE(driverId) {
        if (!map || !vanMarker) {
            console.error("Mapa ou marcador da van não inicializados.");
            return;
        }
        
        // Usamos o endpoint SSE do nosso servidor Node.js
        const eventSource = new EventSource(`https://van-connect-api.onrender.com/motoristas/${driverId}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.realtimeLocation?.longLat) {
                    const newCoords = data.realtimeLocation.longLat;
                    vanMarker.setLngLat(newCoords);
                    map.panTo(newCoords);
                }
            } catch (e) {
                // Ignora erros de parsing que podem ocorrer se a conexão for instável
            }
        };

        eventSource.onerror = () => {
            // Tenta reconectar após 5 segundos se houver um erro
            eventSource.close();
            setTimeout(() => iniciarRastreamentoSSE(driverId), 5000);
        };
    }

    // Inicia todo o processo.
    inicializarLocalizador();

    async function getAndDrawRoutePath(startLngLat, pickupPoints, endLngLat) {
    if (!map || !startLngLat || !endLngLat) {
        console.warn("Map or coordinates missing for drawing route path.");
        return;
    }

    const mapboxAccessToken = mapboxgl.accessToken;
    const profile = 'mapbox/driving-traffic';

    // Create waypoints string including all pickup points
    let waypoints = startLngLat.join(',');
    if (pickupPoints && pickupPoints.length > 0) {
        waypoints += ';' + pickupPoints.map(point => point.longLat.join(',')).join(';');
    }
    waypoints += ';' + endLngLat.join(',');

    const apiUrl = `https://api.mapbox.com/directions/v5/${profile}/${waypoints}?alternatives=false&geometries=geojson&overview=full&steps=false&access_token=${mapboxAccessToken}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error fetching route from Mapbox Directions API:', response.status, errorData.message);
            return;
        }
        const routeData = await response.json();

        if (routeData.routes && routeData.routes.length > 0) {
            const routeGeometry = routeData.routes[0].geometry;

            if (map.getSource('route-to-endpoint')) {
                map.getSource('route-to-endpoint').setData({
                    type: 'Feature',
                    properties: {},
                    geometry: routeGeometry
                });
            } else {
                map.addSource('route-to-endpoint', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: routeGeometry
                    }
                });
                map.addLayer({
                    id: 'route-to-endpoint-layer',
                    type: 'line',
                    source: 'route-to-endpoint',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#007cbf',
                        'line-width': 6,
                        'line-opacity': 0.75
                    }
                });
            }
            console.log('Route path drawn/updated from van to endpoint.');
        } else {
            console.warn('No route found by Mapbox Directions API');
        }
    } catch (error) {
        console.error('Error in getAndDrawRoutePath:', error);
    }
}
});