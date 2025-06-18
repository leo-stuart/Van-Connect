// Arquivo: codigo/public/modulos/areaMotorista/areaMotorista.js CORRIGIDO E MELHORADO
document.addEventListener('DOMContentLoaded', () => {
    Auth.protectPage();
    Auth.setupHeader('nav-links-container');

    const currentUser = Auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'driver') {
        document.querySelector('main').innerHTML = `<h1>Acesso Negado</h1><p>Você não tem permissão para acessar esta página.</p>`;
        return;
    }

    const API_BASE_URL = 'http://localhost:3000';
    const driverId = currentUser.driverId;

    let driverData = null;
    let vehiclesData = [];
    let schoolsData = [];
    let routesData = [];

    const welcomeEl = document.getElementById('driver-welcome');
    const profileForm = document.getElementById('profile-form');
    const fleetContainer = document.getElementById('fleet-container');
    const routesContainer = document.getElementById('driver-routes-container');
    const vehicleModalContainer = document.getElementById('vehicle-form-modal');
    const routeModalContainer = document.getElementById('route-form-modal');
    const avatarModal = document.getElementById('avatar-modal');
    const changePhotoBtn = document.getElementById('change-photo-btn');

    async function loadDashboard() {
        try {
            const [driverRes, allVehiclesRes, allRoutesRes, schoolsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/drivers/${driverId}`),
                fetch(`${API_BASE_URL}/vehicles?driverId=${driverId}`),
                fetch(`${API_BASE_URL}/routes?driverId=${driverId}`),
                fetch(`${API_BASE_URL}/schools`)
            ]);

            driverData = await driverRes.json();
            vehiclesData = await allVehiclesRes.json();
            routesData = await allRoutesRes.json();
            schoolsData = await schoolsRes.json();

            welcomeEl.textContent = `Painel de Controle de ${driverData.name.split(' ')[0]}`;
            populateProfileForm(driverData);
            displayFleet(vehiclesData);
            displayRoutes(routesData);
            document.getElementById('current-year').textContent = new Date().getFullYear();

        } catch (error) {
            console.error("Erro ao carregar o dashboard:", error);
            welcomeEl.textContent = 'Erro ao carregar dados.';
            fleetContainer.innerHTML = '<p class="error-message">Não foi possível carregar a frota. Tente novamente mais tarde.</p>';
            routesContainer.innerHTML = '<p class="error-message">Não foi possível carregar as rotas.</p>';
        }
    }

    function populateProfileForm(driver) {
        document.getElementById('profile-name').value = driver.name || '';
        document.getElementById('profile-email').value = driver.contactEmail || '';
        document.getElementById('profile-phone').value = driver.phone || '';
        document.getElementById('profile-cnh').value = driver.cnh || '';
        document.getElementById('profile-cnh-validity').value = driver.cnhValidity || '';
        document.getElementById('profile-emergency-contact').value = driver.emergencyContact || '';
        const profileImg = document.getElementById('profile-img');
        profileImg.src = driver.photoUrl || '../../images/avatars/avatar_placeholder.png';
    }

    function displayFleet(vehicles) {
        fleetContainer.innerHTML = '';
        if (vehicles.length === 0) {
            fleetContainer.innerHTML = '<p>Nenhum veículo cadastrado. Clique em "Adicionar" para começar.</p>';
            return;
        }
        vehicles.forEach(v => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-info">
                    <h4>${v.model}</h4>
                    <p>Placa: ${v.plate} | Vagas: ${v.availableSpots}/${v.capacity}</p>
                </div>
                <div class="item-actions">
                    <button class="btn btn-primary edit-vehicle-btn" data-id="${v.id}">Editar</button>
                    <button class="btn btn-danger delete-vehicle-btn" data-id="${v.id}">Excluir</button>
                </div>`;
            fleetContainer.appendChild(card);
        });
    }

    function displayRoutes(routes) {
        routesContainer.innerHTML = '';
        if (routes.length === 0) {
            routesContainer.innerHTML = '<p>Nenhuma rota cadastrada. Clique em "Adicionar" para começar.</p>';
            return;
        }
        routes.forEach(r => {
            const vehicle = vehiclesData.find(v => String(v.id) === String(r.vehicleId));
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-info">
                    <h4>${r.routeName}</h4>
                    <p>Veículo: ${vehicle ? vehicle.model : 'Não especificado'} | Preço: R$${Number(r.price).toFixed(2)}</p>
                </div>
                <div class="item-actions">
                    <a href="../localizador/driver-tracker.html?driverId=${r.driverId}&routeId=${r.id}" target="_blank" class="btn btn-success" title="Iniciar Rastreamento da Rota">Rastrear</a>
                    <button class="btn btn-secondary manage-btn" data-id="${r.id}" title="Gerenciar Vagas e Alunos">Vagas</button>
                    <div class="action-dropdown">
                        <button class="btn btn-more" title="Mais Opções">...</button>
                        <div class="dropdown-menu">
                            <button class="dropdown-item edit-btn" data-id="${r.id}">Editar Rota</button>
                            <button class="dropdown-item delete-btn" data-id="${r.id}">Excluir Rota</button>
                        </div>
                    </div>
                </div>`;
            routesContainer.appendChild(card);
        });
    }

    // O restante do arquivo (funções de modal, delete, etc.) permanece o mesmo.
    // ... (cole o restante do seu arquivo areaMotorista.js aqui)
    function openVehicleModal(id = null) {
        const isEdit = id !== null;
        const vehicle = isEdit ? vehiclesData.find(v => String(v.id) === String(id)) : {};
        const title = isEdit ? 'Editar Veículo' : 'Adicionar Novo Veículo';

        vehicleModalContainer.innerHTML = `
            <div class="modal-content">
                <form id="vehicle-form">
                    <h2>${title}</h2>
                    <div class="form-grid">
                        <div class="form-group"><label for="vehicle-model">Modelo</label><input type="text" id="vehicle-model" class="form-control" value="${vehicle?.model || ''}" required></div>
                        <div class="form-group"><label for="vehicle-plate">Placa</label><input type="text" id="vehicle-plate" class="form-control" value="${vehicle?.plate || ''}" required></div>
                        <div class="form-group"><label for="vehicle-capacity">Capacidade (Nº de lugares)</label><input type="number" id="vehicle-capacity" class="form-control" value="${vehicle?.capacity || ''}" required></div>
                    </div>
                    <div class="form-actions"><button type="button" class="cancel-button">Cancelar</button><button type="submit" class="cta-button">Salvar</button></div>
                </form>
            </div>`;

        vehicleModalContainer.style.display = 'flex';
        vehicleModalContainer.querySelector('.cancel-button').addEventListener('click', () => closeModal('vehicle'));

        document.getElementById('vehicle-form').addEventListener('submit', async e => {
            e.preventDefault();
            const capacity = parseInt(document.getElementById('vehicle-capacity').value, 10);
            const vehiclePayload = {
                driverId: String(driverId),
                model: document.getElementById('vehicle-model').value,
                plate: document.getElementById('vehicle-plate').value,
                capacity: capacity,
                availableSpots: isEdit ? vehicle.availableSpots : capacity,
            };

            const url = isEdit ? `${API_BASE_URL}/vehicles/${id}` : `${API_BASE_URL}/vehicles`;
            const method = isEdit ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vehiclePayload) });
                if (!response.ok) throw new Error('Falha ao salvar veículo.');
                alert(`Veículo ${isEdit ? 'atualizado' : 'adicionado'} com sucesso!`);
                closeModal('vehicle');
                loadDashboard();
            } catch (error) {
                alert(`Erro: ${error.message}`);
            }
        });
    }

    async function openRouteModal(id = null) {
        if (vehiclesData.length === 0) {
            alert("Você precisa cadastrar um veículo antes de adicionar uma rota.");
            return;
        }

        const isEdit = id !== null;
        const route = isEdit ? routesData.find(r => r.id == id) : {};
        const title = isEdit ? 'Editar Rota' : 'Adicionar Nova Rota';
        const vehicleOptions = vehiclesData.map(v => `<option value="${v.id}" ${String(v.id) === String(route.vehicleId) ? 'selected' : ''}>${v.model} (${v.plate})</option>`).join('');
        const schoolCheckboxes = schoolsData.map(s => `<div class="checkbox-item"><input type="checkbox" id="school-${s.id}" value="${s.id}" ${route.schoolIds && route.schoolIds.includes(s.id) ? 'checked' : ''}><label for="school-${s.id}">${s.name}</label></div>`).join('');

        routeModalContainer.innerHTML = `
            <div class="modal-content">
                <form id="route-form"><h2>${title}</h2>
                    <div class="form-grid">
                        <div class="form-group"><label>Nome da Rota</label><input type="text" id="route-name" class="form-control" value="${route.routeName || ''}" required></div>
                        <div class="form-group"><label>Veículo</label><select id="route-vehicle" class="form-control" required>${vehicleOptions}</select></div>
                        <div class="form-group"><label>Turno</label><select id="route-shift" class="form-control">${['Manhã', 'Tarde', 'Noite'].map(s => `<option value="${s}" ${s === route.shift ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Preço (R$)</label><input type="number" id="route-price" step="0.01" class="form-control" value="${route.price || ''}" required></div>
                    </div>
                    <div class="form-group"><label>Bairros (separados por vírgula)</label><input type="text" id="route-neighborhoods" class="form-control" value="${(route.neighborhoodsServed || []).join(', ')}"></div>
                    <div class="form-group"><label>Escolas Atendidas</label><div class="checkbox-group">${schoolCheckboxes}</div></div>
                    <div class="form-actions"><button type="button" class="cancel-btn">Cancelar</button><button type="submit" class="cta-button">Salvar</button></div>
                </form>
            </div>`;

        routeModalContainer.style.display = 'flex';
        routeModalContainer.querySelector('.cancel-btn').addEventListener('click', () => closeModal('route'));

        document.getElementById('route-form').addEventListener('submit', async e => {
            e.preventDefault();
            const selectedSchoolIds = Array.from(document.querySelectorAll('#route-form .checkbox-item input:checked')).map(cb => parseInt(cb.value, 10));
            const routePayload = {
                driverId: driverId,
                vehicleId: parseInt(document.getElementById('route-vehicle').value, 10),
                routeName: document.getElementById('route-name').value,
                shift: document.getElementById('route-shift').value,
                price: parseFloat(document.getElementById('route-price').value),
                neighborhoodsServed: document.getElementById('route-neighborhoods').value.split(',').map(n => n.trim()).filter(Boolean),
                schoolIds: selectedSchoolIds
            };

            const url = isEdit ? `${API_BASE_URL}/routes/${id}` : `${API_BASE_URL}/routes`;
            const method = isEdit ? 'PUT' : 'POST';

            try {
                await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(routePayload) });
                alert(`Rota ${isEdit ? 'atualizada' : 'adicionada'} com sucesso!`);
                closeModal('route');
                loadDashboard();
            } catch { alert('Erro ao salvar rota.'); }
        });
    }

    async function deleteVehicle(id) {
        const isVehicleInUse = routesData.some(route => route.vehicleId == id);
        if (isVehicleInUse) {
            alert('Não é possível excluir este veículo, pois ele está sendo utilizado em uma ou mais de suas rotas. Por favor, edite as rotas primeiro.');
            return;
        }
        if (confirm('Tem certeza de que deseja excluir este veículo?')) {
            try {
                const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Falha ao excluir o veículo.');
                alert('Veículo excluído com sucesso!');
                loadDashboard();
            } catch (error) {
                alert(`Erro: ${error.message}`);
            }
        }
    }

    async function deleteRoute(id) {
        const contracts = await fetch(`${API_BASE_URL}/contracts?routeId=${id}`).then(res => res.json());
        if (contracts.length > 0) {
            alert('Não é possível excluir esta rota, pois ela possui contratos ativos. Cancele os contratos primeiro.');
            return;
        }
        if (confirm('Tem certeza de que deseja excluir esta rota?')) {
            try {
                const res = await fetch(`${API_BASE_URL}/routes/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Falha ao excluir a rota.');
                alert('Rota excluída com sucesso!');
                loadDashboard();
            } catch (error) {
                alert(`Erro: ${error.message}`);
            }
        }
    }

    async function openOccupancyModal(routeId) {
        const occupancyModalContainer = document.getElementById('occupancy-modal');
        occupancyModalContainer.style.display = 'flex';
        occupancyModalContainer.innerHTML = `<div class="modal-content"><p class="loading-message">Carregando informações de vagas...</p></div>`;

        try {
            const [routeRes, contractsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/routes/${routeId}`),
                fetch(`${API_BASE_URL}/contracts?routeId=${routeId}&_expand=student`)
            ]);

            if (!routeRes.ok) throw new Error('Rota não encontrada.');

            const route = await routeRes.json();
            const vehicle = vehiclesData.find(v => v.id == route.vehicleId);
            const contracts = await contractsRes.json();

            if (!vehicle) throw new Error(`Veículo com ID ${route.vehicleId} não foi encontrado. Verifique o cadastro.`);

            const capacity = vehicle.capacity;
            const spotsTaken = contracts.length;
            const spotsAvailable = capacity - spotsTaken;

            if (vehicle.availableSpots !== spotsAvailable) {
                await fetch(`${API_BASE_URL}/vehicles/${vehicle.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ availableSpots: spotsAvailable }),
                });
                loadDashboard(); // Recarrega para exibir os dados atualizados
            }

            const studentListItems = contracts.length > 0
                ? contracts.map(c => `<li>${c.student?.name || 'Aluno não encontrado'}</li>`).join('')
                : '<li>Nenhum aluno contratado para esta rota.</li>';

            occupancyModalContainer.innerHTML = `
                <div class="modal-content">
                    <h2>Gerenciamento de Vagas: ${route.routeName}</h2>
                    <p><strong>Veículo:</strong> ${vehicle.model} (Placa: ${vehicle.plate})</p>
                    <div class="occupancy-summary">
                        <div class="summary-item"><strong>Capacidade Total:</strong><span>${capacity}</span></div>
                        <div class="summary-item"><strong>Vagas Ocupadas:</strong><span>${spotsTaken}</span></div>
                        <div class="summary-item"><strong>Vagas Disponíveis:</strong><span>${spotsAvailable}</span></div>
                    </div>
                    <h4>Alunos na Rota:</h4>
                    <ul class="student-list">${studentListItems}</ul>
                    <div class="form-actions"><button type="button" class="cancel-button">Fechar</button></div>
                </div>`;
            occupancyModalContainer.querySelector('.cancel-button').addEventListener('click', () => closeModal('occupancy'));

        } catch (error) {
            console.error("Erro ao abrir modal de vagas:", error);
            occupancyModalContainer.innerHTML = `<div class="modal-content"><p class="error-message">${error.message}</p><div class="form-actions"><button type="button" class="cancel-button">Fechar</button></div></div>`;
            occupancyModalContainer.querySelector('.cancel-button').addEventListener('click', () => closeModal('occupancy'));
        }
    }

    function closeModal(type) {
        const container = document.getElementById(`${type}-form-modal`) || document.getElementById(`${type}-modal`);
        if (container) container.style.display = 'none';
    }

    async function openAvatarModal() {
        const avatarGrid = document.getElementById('avatar-grid');
        avatarGrid.innerHTML = '<p class="loading-message">Carregando...</p>';
        avatarModal.style.display = 'flex';

        try {
            const response = await fetch(`${API_BASE_URL}/avatars`);
            if (!response.ok) throw new Error('Falha ao buscar avatares.');
            const avatars = await response.json();

            avatarGrid.innerHTML = '';
            avatars.forEach(avatar => {
                const img = document.createElement('img');
                img.src = avatar.url;
                img.alt = `Avatar ${avatar.id}`;
                img.dataset.url = avatar.url;
                img.addEventListener('click', () => selectAvatar(avatar.url));
                avatarGrid.appendChild(img);
            });
        } catch (error) {
            avatarGrid.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    async function selectAvatar(photoUrl) {
        try {
            const response = await fetch(`${API_BASE_URL}/drivers/${driverId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoUrl: photoUrl })
            });

            if (!response.ok) throw new Error('Não foi possível atualizar a foto.');

            driverData.photoUrl = photoUrl;
            document.getElementById('profile-img').src = photoUrl;
            closeModal('avatar');
            alert('Avatar atualizado com sucesso!');

        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }

    profileForm.addEventListener('submit', async e => {
        e.preventDefault();
        const updatedDriverData = { ...driverData, name: document.getElementById('profile-name').value, contactEmail: document.getElementById('profile-email').value, phone: document.getElementById('profile-phone').value, cnh: document.getElementById('profile-cnh').value, cnhValidity: document.getElementById('profile-cnh-validity').value, emergencyContact: document.getElementById('profile-emergency-contact').value };
        try {
            await fetch(`${API_BASE_URL}/drivers/${driverId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedDriverData) });
            alert('Perfil atualizado com sucesso!');
            driverData = updatedDriverData;
            welcomeEl.textContent = `Painel de Controle de ${driverData.name.split(' ')[0]}`;
        } catch (error) {
            alert('Erro ao salvar perfil.');
        }
    });

    document.getElementById('add-vehicle-btn').addEventListener('click', () => openVehicleModal());
    document.getElementById('add-route-btn').addEventListener('click', () => openRouteModal());
    changePhotoBtn.addEventListener('click', openAvatarModal);
    document.getElementById('avatar-cancel-btn').addEventListener('click', () => closeModal('avatar'));

    fleetContainer.addEventListener('click', e => {
        if (e.target.matches('.edit-vehicle-btn')) openVehicleModal(e.target.dataset.id);
        if (e.target.matches('.delete-vehicle-btn')) deleteVehicle(e.target.dataset.id);
    });

    routesContainer.addEventListener('click', e => {
        const dropdown = e.target.closest('.action-dropdown');
        if (dropdown && e.target.matches('.btn-more')) {
            dropdown.classList.toggle('open');
            return;
        }

        if (e.target.matches('.manage-btn')) openOccupancyModal(e.target.dataset.id);
        if (e.target.matches('.edit-btn')) openRouteModal(e.target.dataset.id);
        if (e.target.matches('.delete-btn')) deleteRoute(e.target.dataset.id);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.action-dropdown')) {
            document.querySelectorAll('.action-dropdown.open').forEach(dropdown => {
                dropdown.classList.remove('open');
            });
        }
    });

    loadDashboard();
});