// Arquivo: codigo/public/modulos/perfilMotorista/detalhes.js
document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "http://localhost:3000";
    Auth.setupHeader("nav-links-container");

    const profileContent = document.getElementById("profile-content");
    const routesContainer = document.getElementById("driver-routes-container");
    const driverProfilePage = document.getElementById("driver-profile-page");

    const urlParams = new URLSearchParams(window.location.search);
    const driverId = urlParams.get("driverId");

    let schoolMap = new Map(); // Mapa para armazenar escolas

    if (!driverId) {
        document.querySelector("main").innerHTML =
            '<h1 class="error-message">Erro: ID do motorista não fornecido na URL.</h1>';
        return;
    }

    async function loadPublicProfile() {
        try {
            // MERGE: Adicionada a busca por 'vehicles' para obter os modelos dos veículos.
            const [driverRes, routesRes, schoolsRes, vehiclesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/drivers/${driverId}`),
                fetch(`${API_BASE_URL}/routes?driverId=${driverId}`),
                fetch(`${API_BASE_URL}/schools`),
                fetch(`${API_BASE_URL}/vehicles`) // Busca todos os veículos
            ]);

            if (!driverRes.ok) throw new Error("Motorista não encontrado.");
            if (!routesRes.ok) throw new Error("Erro ao carregar as rotas do motorista.");
            if (!schoolsRes.ok) throw new Error("Erro ao carregar a lista de escolas.");

            // MERGE: Cria um mapa de veículos para consulta rápida (ID -> Objeto Veículo)
            let vehicleMap = new Map();
            if (vehiclesRes.ok) {
                const vehicles = await vehiclesRes.json();
                vehicleMap = new Map(vehicles.map(v => [String(v.id), v]));
            }

            const schools = await schoolsRes.json();
            schoolMap = new Map(schools.map(s => [String(s.id), s.name]));

            const driver = await driverRes.json();
            const routes = await routesRes.json();

            renderProfile(driver);
            // MERGE: Passa o mapa de veículos para a função que renderiza as rotas.
            renderRoutes(routes, vehicleMap);

            driverProfilePage?.classList.add("loaded");
        } catch (error) {
            console.error("Erro ao carregar perfil público:", error);
            profileContent.innerHTML = `<p class="error-message">Não foi possível carregar o perfil. (${error.message})</p>`;
            routesContainer.innerHTML = '';
        }
    }

    function renderProfile(driver) {
        profileContent.innerHTML = `
            <div class="profile-header">
                <div class="profile-picture">
                    <img src="${driver.photoUrl || "../../images/avatars/avatar_placeholder.png"}" alt="Foto de ${driver.name}">
                </div>
                <div class="profile-title">
                    <h1>${driver.name}</h1>
                    <span class="status-badge status-${driver.status.toLowerCase().replace(/ /g, "-")}">${driver.status}</span>
                </div>
            </div>
            <div class="profile-details">
                <h4>Contato</h4>
                <p><strong>Email:</strong> ${driver.contactEmail}</p>
                <p><strong>Telefone:</strong> ${driver.phone}</p>
            </div>
        `;
    }

    // MERGE: A função agora aceita 'vehicleMap' como parâmetro.
    function renderRoutes(routes, vehicleMap) {
        routesContainer.innerHTML = "";

        if (routes.length === 0) {
            routesContainer.innerHTML = "<p>Nenhuma rota disponível para este motorista no momento.</p>";
            return;
        }

        routes.forEach((route) => {
            const card = document.createElement("div");
            card.className = "route-card-detailed";
            const price = Number(route.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

            const neighborhoods = route.neighborhoodsServed.join(", ");
            const schools = route.schoolIds && route.schoolIds.length > 0
                ? route.schoolIds.map(id => schoolMap.get(String(id)) || 'Escola desconhecida').join(', ')
                : "Nenhuma escola específica listada.";

            // MERGE: Busca o modelo do veículo no mapa usando o 'vehicleId' da rota.
            const vehicle = vehicleMap.get(String(route.vehicleId));
            const vanModel = vehicle ? vehicle.model : 'Não informado';

            // MERGE: Usa a variável 'vanModel' para exibir o modelo correto do veículo.
            card.innerHTML = `
                <div class="info">
                    <h3>${route.routeName}</h3>
                    <p><strong>Veículo:</strong> ${vanModel}</p>
                    <p><strong>Turno:</strong> ${route.shift}</p>
                    <p><strong>Bairros:</strong> ${neighborhoods}</p>
                    <p><strong>Escolas:</strong> ${schools}</p>
                    <p><strong>Detalhes:</strong> ${route.details || 'Nenhum detalhe adicional.'}</p>
                </div>
                <div class="actions">
                    <p class="price">${price} / mês</p>
                    <button class="cta-button hire-btn" data-route-id="${route.id}">Contratar</button>
                </div>
            `;
            routesContainer.appendChild(card);
        });
    }

    routesContainer.addEventListener("click", async (e) => {
        if (e.target.classList.contains("hire-btn")) {
            if (!Auth.isAuthenticated()) {
                alert("Você precisa fazer login para contratar uma rota.");
                sessionStorage.setItem("redirectURL", window.location.href);
                window.location.href = Auth.LOGIN_PAGE;
                return;
            }

            const currentUser = Auth.getCurrentUser();
            if (currentUser.role !== 'parent') {
                alert("Apenas pais ou responsáveis podem contratar rotas.");
                return;
            }
            
            try {
                const studentsResponse = await fetch(`${API_BASE_URL}/students?parentId=${currentUser.id}`);
                const students = await studentsResponse.json();

                if (students.length === 0) {
                    alert("Você precisa cadastrar um aluno em 'Minha Área' antes de poder contratar uma rota.");
                    return;
                }
                
                const studentId = students[0].id; 
                const routeId = e.target.dataset.routeId;
                const driverIdFromUrl = urlParams.get("driverId");

                window.location.href = `../pagamento/pagamento.html?routeId=${routeId}&driverId=${driverIdFromUrl}&studentId=${studentId}`;
            
            } catch (error) {
                console.error("Erro ao buscar alunos do usuário:", error);
                alert("Ocorreu um erro ao iniciar o processo de contratação. Tente novamente.");
            }
        }
    });

    loadPublicProfile();
});