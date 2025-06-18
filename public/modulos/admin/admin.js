// Arquivo: admin.js (Versão Corrigida e Funcional)
document.addEventListener('DOMContentLoaded', () => {
    // 1. --- AUTHENTICATION & INITIALIZATION ---
    const API_URL = 'http://localhost:3000';
    const currentUser = Auth.getCurrentUser();

    if (!currentUser || currentUser.role !== 'admin') {
        alert('Acesso negado. Você precisa ser um administrador para ver esta página.');
        window.location.href = '/modulos/login/login.html';
        return;
    }

    Auth.setupHeader('nav-links-container');

    // 2. --- DOM ELEMENT REFERENCES ---
    const modals = {
        driver: new bootstrap.Modal(document.getElementById('driver-modal')),
        vehicle: new bootstrap.Modal(document.getElementById('vehicle-modal')),
        route: new bootstrap.Modal(document.getElementById('route-modal')),
        school: new bootstrap.Modal(document.getElementById('school-modal')),
        user: new bootstrap.Modal(document.getElementById('user-modal')),
        student: new bootstrap.Modal(document.getElementById('student-modal')),
        contract: new bootstrap.Modal(document.getElementById('contract-modal')),
    };

    const tableBodies = {
        drivers: document.getElementById('drivers-table-body'),
        vehicles: document.getElementById('vehicles-table-body'),
        routes: document.getElementById('routes-table-body'),
        schools: document.getElementById('schools-table-body'),
        users: document.getElementById('users-table-body'),
        students: document.getElementById('students-table-body'),
        contracts: document.getElementById('contracts-table-body'),
    };
    
    const addButtons = {
        driver: document.getElementById('btn-new-driver'),
        vehicle: document.getElementById('btn-new-vehicle'),
        route: document.getElementById('btn-new-route'),
        school: document.getElementById('btn-new-school'),
        user: document.getElementById('btn-new-user'),
        student: document.getElementById('btn-new-student'),
        contract: document.getElementById('btn-new-contract'),
    };

    let allData = {};

    // 3. --- HELPER FUNCTIONS ---
    const populateSelect = (element, items, valueField, textField, prompt) => {
        element.innerHTML = `<option value="">${prompt}</option>`;
        element.innerHTML += items.map(item => `<option value="${item[valueField]}">${item[textField]}</option>`).join('');
    };

    const checkDependencies = () => {
        addButtons.vehicle.disabled = allData.drivers.length === 0;
        addButtons.vehicle.title = addButtons.vehicle.disabled ? 'Cadastre um motorista primeiro' : 'Adicionar Novo Veículo';
        
        addButtons.route.disabled = allData.drivers.length === 0 || allData.vehicles.length === 0;
        addButtons.route.title = addButtons.route.disabled ? 'Cadastre motoristas e veículos primeiro' : 'Adicionar Nova Rota';

        const parents = allData.usuarios.filter(u => u.role === 'parent');
        addButtons.student.disabled = parents.length === 0 || allData.schools.length === 0;
        addButtons.student.title = addButtons.student.disabled ? 'Cadastre responsáveis e escolas primeiro' : 'Adicionar Novo Aluno';

        addButtons.contract.disabled = allData.students.length === 0 || allData.routes.length === 0;
        addButtons.contract.title = addButtons.contract.disabled ? 'Cadastre alunos e rotas primeiro' : 'Adicionar Novo Contrato';
    };

    // 4. --- DATA LOADING & RENDERING ---
    const fetchData = async (endpoint) => {
        try {
            const response = await fetch(`${API_URL}/${endpoint}`);
            if (!response.ok) throw new Error(`Erro ao buscar ${endpoint}`);
            return await response.json();
        } catch (error) {
            console.error(error);
            alert(`Falha ao carregar dados: ${error.message}`);
            return [];
        }
    };

    const loadAllData = async () => {
        const [drivers, vehicles, routes, schools, contracts, students, usuarios] = await Promise.all([
            fetchData('drivers'), fetchData('vehicles'), fetchData('routes'),
            fetchData('schools'), fetchData('contracts'), fetchData('students'),
            fetchData('usuarios')
        ]);
        allData = { drivers, vehicles, routes, schools, contracts, students, usuarios };
        renderAllTables();
        checkDependencies();
    };

    const renderAllTables = () => {
        renderDrivers(allData.drivers);
        renderVehicles(allData.vehicles);
        renderRoutes(allData.routes);
        renderSchools(allData.schools);
        renderUsers(allData.usuarios);
        renderStudents(allData.students);
        renderContracts(allData.contracts);
    };
    
    const renderDrivers = (drivers) => {
        tableBodies.drivers.innerHTML = drivers.map(d => `
            <tr>
                <td>${d.id}</td>
                <td>${d.name}</td>
                <td>${d.contactEmail || 'N/A'}</td>
                <td>${d.phone || 'N/A'}</td>
                <td><span class="badge bg-${d.status === 'Ativo' ? 'success' : 'warning'}">${d.status || 'N/A'}</span></td>
                <td class="text-end action-buttons">
                    <button class="btn btn-sm btn-warning edit-driver" data-id="${d.id}"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn btn-sm btn-danger delete-driver" data-id="${d.id}"><i class="bi bi-trash-fill"></i></button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="6" class="text-center">Nenhum motorista cadastrado.</td></tr>';
    };

    const renderVehicles = (vehicles) => {
        const driverMap = new Map(allData.drivers.map(d => [String(d.id), d.name]));
        tableBodies.vehicles.innerHTML = vehicles.map(v => `
            <tr>
                <td>${v.id}</td>
                <td>${v.model}</td>
                <td>${v.plate}</td>
                <td>${v.capacity}</td>
                <td>${driverMap.get(String(v.driverId)) || 'Não atribuído'}</td>
                <td class="text-end action-buttons">
                    <button class="btn btn-sm btn-warning edit-vehicle" data-id="${v.id}"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn btn-sm btn-danger delete-vehicle" data-id="${v.id}"><i class="bi bi-trash-fill"></i></button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="6" class="text-center">Nenhum veículo cadastrado.</td></tr>';
    };

     const renderRoutes = (routes) => {
        const driverMap = new Map(allData.drivers.map(d => [String(d.id), d.name]));
        tableBodies.routes.innerHTML = routes.map(r => `
            <tr>
                <td>${r.id}</td>
                <td>${r.routeName}</td>
                <td>${r.shift}</td>
                <td>R$ ${Number(r.price).toFixed(2)}</td>
                <td>${driverMap.get(String(r.driverId)) || 'Não atribuído'}</td>
                <td class="text-end action-buttons">
                    <button class="btn btn-sm btn-warning edit-route" data-id="${r.id}"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn btn-sm btn-danger delete-route" data-id="${r.id}"><i class="bi bi-trash-fill"></i></button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="6" class="text-center">Nenhuma rota cadastrada.</td></tr>';
    };

    const renderSchools = (schools) => {
        tableBodies.schools.innerHTML = schools.map(s => `
            <tr>
                <td>${s.id}</td>
                <td>${s.name}</td>
                <td>${s.logo || 'N/A'}</td>
                <td class="text-end action-buttons">
                    <button class="btn btn-sm btn-warning edit-school" data-id="${s.id}"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn btn-sm btn-danger delete-school" data-id="${s.id}"><i class="bi bi-trash-fill"></i></button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="text-center">Nenhuma escola cadastrada.</td></tr>';
    };

    const renderUsers = (users) => {
        tableBodies.users.innerHTML = users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.nome}</td>
                <td>${u.login}</td>
                <td>${u.email}</td>
                <td><span class="badge bg-secondary">${u.role}</span></td>
                <td class="text-end action-buttons">
                    <button class="btn btn-sm btn-warning edit-user" data-id="${u.id}"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn btn-sm btn-danger delete-user" data-id="${u.id}"><i class="bi bi-trash-fill"></i></button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="6" class="text-center">Nenhum usuário cadastrado.</td></tr>';
    };

    const renderStudents = (students) => {
        const parentMap = new Map(allData.usuarios.filter(u => u.role === 'parent').map(u => [String(u.id), u.nome]));
        const schoolMap = new Map(allData.schools.map(s => [String(s.id), s.name]));
        tableBodies.students.innerHTML = students.map(s => `
            <tr>
                <td>${s.id}</td>
                <td>${s.name}</td>
                <td>${parentMap.get(String(s.parentId)) || 'N/A'}</td>
                <td>${schoolMap.get(String(s.schoolId || s.school)) || 'N/A'}</td>
                <td class="text-end action-buttons">
                    <button class="btn btn-sm btn-warning edit-student" data-id="${s.id}"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn btn-sm btn-danger delete-student" data-id="${s.id}"><i class="bi bi-trash-fill"></i></button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5" class="text-center">Nenhum aluno cadastrado.</td></tr>';
    };

    const renderContracts = (contracts) => {
        const studentMap = new Map(allData.students.map(s => [String(s.id), s]));
        const routeMap = new Map(allData.routes.map(r => [String(r.id), r]));
        const parentMap = new Map(allData.usuarios.filter(u => u.role === 'parent').map(p => [String(p.id), p.nome]));
        const driverMap = new Map(allData.drivers.map(d => [String(d.id), d.name]));

        tableBodies.contracts.innerHTML = contracts.map(c => {
            const student = studentMap.get(String(c.studentId));
            const route = routeMap.get(String(c.routeId));
            
            const parentName = student ? parentMap.get(String(student.parentId)) : 'N/A';
            const driverName = route ? driverMap.get(String(route.driverId)) : 'N/A';

            return `
                <tr>
                    <td>${c.id}</td>
                    <td>${student?.name || 'N/A'}</td>
                    <td>${parentName}</td>
                    <td>${route?.routeName || 'N/A'}</td>
                    <td>${driverName}</td>
                    <td>${c.status}</td>
                    <td>${c.paymentStatus || 'N/A'}</td>
                    <td class="text-end action-buttons">
                        <button class="btn btn-sm btn-warning edit-contract" data-id="${c.id}"><i class="bi bi-pencil-fill"></i></button>
                        <button class="btn btn-sm btn-danger delete-contract" data-id="${c.id}"><i class="bi bi-trash-fill"></i></button>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="8" class="text-center">Nenhum contrato cadastrado.</td></tr>';
    };


    // 5. --- CRUD OPERATIONS ---
    const saveData = async (endpoint, data, id) => {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/${endpoint}/${id}` : `${API_URL}/${endpoint}`;
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Falha ao salvar em ${endpoint}`);
            }
            await loadAllData();
            return true;
        } catch (error) {
            console.error(`Erro ao salvar ${endpoint}:`, error);
            alert(`Erro ao salvar: ${error.message}`);
            return false;
        }
    };

    const deleteData = async (endpoint, id) => {
        if (!confirm(`Tem certeza que deseja excluir o item ${id} de ${endpoint}? Esta ação não pode ser desfeita.`)) return;
        try {
            const response = await fetch(`${API_URL}/${endpoint}/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error(`Falha ao deletar em ${endpoint}`);
            await loadAllData();
        } catch (error) {
            console.error(`Erro ao deletar ${endpoint}:`, error);
            alert(`Erro ao deletar: ${error.message}`);
        }
    };

    // 6. --- EVENT LISTENERS (abbreviated for brevity, no changes here) ---
    
    // --- Motorista Listeners ---
    addButtons.driver.addEventListener('click', () => {
        document.getElementById('driver-form').reset();
        document.getElementById('driver-modal-title').innerText = 'Novo Motorista';
        document.getElementById('driver-id').value = '';
        modals.driver.show();
    });

    document.getElementById('save-driver-button').addEventListener('click', async () => {
        const id = document.getElementById('driver-id').value;
        const data = {
            name: document.getElementById('driver-name').value,
            contactEmail: document.getElementById('driver-email').value,
            phone: document.getElementById('driver-phone').value,
            status: document.getElementById('driver-status').value,
        };
        if (await saveData('drivers', data, id)) modals.driver.hide();
    });
    
    tableBodies.drivers.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-driver');
        if (editButton) {
            const id = editButton.dataset.id;
            const driver = allData.drivers.find(d => String(d.id) === String(id));
            if (driver) {
                document.getElementById('driver-modal-title').innerText = 'Editar Motorista';
                document.getElementById('driver-id').value = driver.id;
                document.getElementById('driver-name').value = driver.name;
                document.getElementById('driver-email').value = driver.contactEmail;
                document.getElementById('driver-phone').value = driver.phone;
                document.getElementById('driver-status').value = driver.status;
                modals.driver.show();
            }
        }
        const deleteButton = e.target.closest('.delete-driver');
        if (deleteButton) {
            const id = deleteButton.dataset.id;
            const isDriverInUse = allData.routes.some(route => String(route.driverId) === String(id));
            if (isDriverInUse) {
                alert('Não é possível excluir este motorista, pois ele está associado a uma ou mais rotas. Por favor, reatribua ou exclua as rotas primeiro.');
                return;
            }
            deleteData('drivers', id);
        }
    });

    // --- Veículo Listeners ---
    addButtons.vehicle.addEventListener('click', () => {
        document.getElementById('vehicle-form').reset();
        document.getElementById('vehicle-modal-title').innerText = 'Novo Veículo';
        document.getElementById('vehicle-id').value = '';
        populateSelect(document.getElementById('vehicle-driver-id'), allData.drivers, 'id', 'name', 'Selecione um motorista');
        modals.vehicle.show();
    });

    document.getElementById('save-vehicle-button').addEventListener('click', async () => {
        const id = document.getElementById('vehicle-id').value;
        const capacity = parseInt(document.getElementById('vehicle-capacity').value);
        const vehicleData = {
            model: document.getElementById('vehicle-model').value,
            plate: document.getElementById('vehicle-plate').value,
            capacity: capacity,
            driverId: document.getElementById('vehicle-driver-id').value,
        };
        if (!id) {
            vehicleData.availableSpots = capacity;
        }
        if (await saveData('vehicles', vehicleData, id)) modals.vehicle.hide();
    });

    tableBodies.vehicles.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-vehicle');
        if (editButton) {
            const id = editButton.dataset.id;
            const vehicle = allData.vehicles.find(v => String(v.id) === String(id));
            if (vehicle) {
                const driverSelect = document.getElementById('vehicle-driver-id');
                populateSelect(driverSelect, allData.drivers, 'id', 'name', 'Selecione um motorista');
                driverSelect.value = vehicle.driverId;

                document.getElementById('vehicle-modal-title').innerText = 'Editar Veículo';
                document.getElementById('vehicle-id').value = vehicle.id;
                document.getElementById('vehicle-model').value = vehicle.model;
                document.getElementById('vehicle-plate').value = vehicle.plate;
                document.getElementById('vehicle-capacity').value = vehicle.capacity;
                modals.vehicle.show();
            }
        }
        const deleteButton = e.target.closest('.delete-vehicle');
        if (deleteButton) {
            const id = deleteButton.dataset.id;
            const isVehicleInUse = allData.routes.some(route => String(route.vehicleId) === String(id));
            if (isVehicleInUse) {
                alert('Não é possível excluir este veículo, pois ele está sendo usado em uma ou mais rotas.');
                return;
            }
            deleteData('vehicles', id);
        }
    });

    // --- Rota Listeners ---
    addButtons.route.addEventListener('click', () => {
        document.getElementById('route-form').reset();
        document.getElementById('route-modal-title').innerText = 'Nova Rota';
        document.getElementById('route-id').value = '';
        populateSelect(document.getElementById('route-driver-id'), allData.drivers, 'id', 'name', 'Selecione um motorista');
        populateSelect(document.getElementById('route-vehicle-id'), allData.vehicles, 'id', 'model', 'Selecione um veículo');
        document.getElementById('route-schools-checkboxes').innerHTML = allData.schools.map(s => `
            <div class="form-check"><input class="form-check-input" type="checkbox" value="${s.id}" id="school-${s.id}"><label class="form-check-label" for="school-${s.id}">${s.name}</label></div>
        `).join('');
        modals.route.show();
    });

    document.getElementById('save-route-button').addEventListener('click', async () => {
        const id = document.getElementById('route-id').value;
        const selectedSchoolIds = Array.from(document.querySelectorAll('#route-schools-checkboxes input:checked')).map(cb => cb.value);
        const data = {
            routeName: document.getElementById('route-name').value,
            shift: document.getElementById('route-shift').value,
            price: parseFloat(document.getElementById('route-price').value),
            driverId: document.getElementById('route-driver-id').value,
            vehicleId: document.getElementById('route-vehicle-id').value,
            neighborhoodsServed: document.getElementById('route-neighborhoods').value.split(',').map(n => n.trim()).filter(n => n),
            schoolIds: selectedSchoolIds
        };
        if (await saveData('routes', data, id)) modals.route.hide();
    });

    tableBodies.routes.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-route');
        if (editButton) {
            const id = editButton.dataset.id;
            const route = allData.routes.find(r => String(r.id) === String(id));
            if (route) {
                document.getElementById('route-modal-title').innerText = 'Editar Rota';
                document.getElementById('route-id').value = route.id;
                populateSelect(document.getElementById('route-driver-id'), allData.drivers, 'id', 'name', 'Selecione um motorista');
                document.getElementById('route-driver-id').value = route.driverId;
                populateSelect(document.getElementById('route-vehicle-id'), allData.vehicles, 'id', 'model', 'Selecione um veículo');
                document.getElementById('route-vehicle-id').value = route.vehicleId;
                document.getElementById('route-schools-checkboxes').innerHTML = allData.schools.map(s => `
                    <div class="form-check"><input class="form-check-input" type="checkbox" value="${s.id}" id="school-edit-${s.id}" ${route.schoolIds?.includes(s.id) ? 'checked' : ''}><label class="form-check-label" for="school-edit-${s.id}">${s.name}</label></div>
                `).join('');
                document.getElementById('route-name').value = route.routeName;
                document.getElementById('route-shift').value = route.shift;
                document.getElementById('route-price').value = route.price;
                document.getElementById('route-neighborhoods').value = route.neighborhoodsServed?.join(', ') || '';
                modals.route.show();
            }
        }
        const deleteButton = e.target.closest('.delete-route');
        if (deleteButton) {
            const id = deleteButton.dataset.id;
            const isRouteInUse = allData.contracts.some(c => String(c.routeId) === String(id));
            if (isRouteInUse) {
                alert('Não é possível excluir esta rota, pois ela possui contratos ativos.');
                return;
            }
            deleteData('routes', id);
        }
    });

    // --- Escola Listeners ---
    addButtons.school.addEventListener('click', () => {
        document.getElementById('school-form').reset();
        document.getElementById('school-modal-title').innerText = 'Nova Escola';
        document.getElementById('school-id').value = '';
        modals.school.show();
    });

    document.getElementById('save-school-button').addEventListener('click', async () => {
        const id = document.getElementById('school-id').value;
        const data = {
            name: document.getElementById('school-name').value,
            logo: document.getElementById('school-logo').value,
        };
        if (await saveData('schools', data, id)) modals.school.hide();
    });

    tableBodies.schools.addEventListener('click', (e) => {
        if (e.target.closest('.edit-school')) {
            const id = e.target.closest('.edit-school').dataset.id;
            const school = allData.schools.find(s => String(s.id) === String(id));
            if (school) {
                document.getElementById('school-modal-title').innerText = 'Editar Escola';
                document.getElementById('school-id').value = school.id;
                document.getElementById('school-name').value = school.name;
                document.getElementById('school-logo').value = school.logo || '';
                modals.school.show();
            }
        }
        if (e.target.closest('.delete-school')) {
            const id = e.target.closest('.delete-school').dataset.id;
            const isSchoolInUse = allData.routes.some(route => route.schoolIds?.includes(id));
            if (isSchoolInUse) {
                alert('Não é possível excluir esta escola, pois ela está associada a uma ou mais rotas.');
                return;
            }
             const isStudentInUse = allData.students.some(student => String(student.schoolId) === String(id));
             if(isStudentInUse) {
                alert('Não é possível excluir esta escola, pois ela está associada a um ou mais alunos.');
                return;
            }
            deleteData('schools', id);
        }
    });

    // --- Usuário Listeners ---
    addButtons.user.addEventListener('click', () => {
        document.getElementById('user-form').reset();
        document.getElementById('user-modal-title').innerText = 'Novo Usuário';
        document.getElementById('user-id').value = '';
        document.getElementById('user-password').setAttribute('required', 'required');
        modals.user.show();
    });

    document.getElementById('save-user-button').addEventListener('click', async () => {
        const id = document.getElementById('user-id').value;
        const password = document.getElementById('user-password').value;
        const data = {
            nome: document.getElementById('user-name').value,
            login: document.getElementById('user-login').value,
            email: document.getElementById('user-email').value,
            celular: document.getElementById('user-phone').value,
            role: document.getElementById('user-role').value,
        };
        if (password) {
            data.senha = password;
        }
        if (await saveData('usuarios', data, id)) modals.user.hide();
    });

    tableBodies.users.addEventListener('click', (e) => {
        if (e.target.closest('.edit-user')) {
            const id = e.target.closest('.edit-user').dataset.id;
            const user = allData.usuarios.find(u => String(u.id) === String(id));
            if (user) {
                document.getElementById('user-modal-title').innerText = 'Editar Usuário';
                document.getElementById('user-id').value = user.id;
                document.getElementById('user-name').value = user.nome;
                document.getElementById('user-login').value = user.login;
                document.getElementById('user-email').value = user.email;
                document.getElementById('user-phone').value = user.celular || '';
                document.getElementById('user-role').value = user.role;
                document.getElementById('user-password').value = '';
                document.getElementById('user-password').removeAttribute('required');
                modals.user.show();
            }
        }
        if (e.target.closest('.delete-user')) {
            const id = e.target.closest('.delete-user').dataset.id;
            if (String(currentUser.id) === String(id)) {
                alert("Não é possível excluir o seu próprio usuário administrador.");
                return;
            }
            deleteData('usuarios', id);
        }
    });
    
    // --- Aluno Listeners ---
    addButtons.student.addEventListener('click', () => {
        document.getElementById('student-form').reset();
        document.getElementById('student-modal-title').innerText = 'Novo Aluno';
        document.getElementById('student-id').value = '';
        const parents = allData.usuarios.filter(u => u.role === 'parent');
        populateSelect(document.getElementById('student-parent-id'), parents, 'id', 'nome', 'Selecione um Responsável');
        populateSelect(document.getElementById('student-school'), allData.schools, 'id', 'name', 'Selecione uma Escola');
        modals.student.show();
    });

    document.getElementById('save-student-button').addEventListener('click', async () => {
        const id = document.getElementById('student-id').value;
        const data = {
            name: document.getElementById('student-name').value,
            parentId: document.getElementById('student-parent-id').value,
            schoolId: document.getElementById('student-school').value,
            class: document.getElementById('student-class').value,
            photoUrl: document.getElementById('student-photo-url').value,
        };
        if (await saveData('students', data, id)) modals.student.hide();
    });

    tableBodies.students.addEventListener('click', (e) => {
        if (e.target.closest('.edit-student')) {
            const id = e.target.closest('.edit-student').dataset.id;
            const student = allData.students.find(s => String(s.id) === String(id));
            if (student) {
                document.getElementById('student-modal-title').innerText = 'Editar Aluno';
                document.getElementById('student-id').value = student.id;
                document.getElementById('student-name').value = student.name;
                const parents = allData.usuarios.filter(u => u.role === 'parent');
                populateSelect(document.getElementById('student-parent-id'), parents, 'id', 'nome', 'Selecione um Responsável');
                document.getElementById('student-parent-id').value = student.parentId;
                populateSelect(document.getElementById('student-school'), allData.schools, 'id', 'name', 'Selecione uma Escola');
                document.getElementById('student-school').value = student.schoolId;
                document.getElementById('student-class').value = student.class || '';
                document.getElementById('student-photo-url').value = student.photoUrl || '';
                modals.student.show();
            }
        }
        if (e.target.closest('.delete-student')) {
            const id = e.target.closest('.delete-student').dataset.id;
            const isStudentInUse = allData.contracts.some(c => String(c.studentId) === String(id));
            if(isStudentInUse) {
                alert('Não é possível excluir este aluno, pois ele possui contratos ativos.');
                return;
            }
            deleteData('students', id);
        }
    });

    // --- Contrato Listeners ---
    addButtons.contract.addEventListener('click', () => {
        document.getElementById('contract-form').reset();
        document.getElementById('contract-modal-title').innerText = 'Novo Contrato';
        document.getElementById('contract-id').value = '';
        populateSelect(document.getElementById('contract-student-id'), allData.students, 'id', 'name', 'Selecione um Aluno');
        populateSelect(document.getElementById('contract-route-id'), allData.routes, 'id', 'routeName', 'Selecione uma Rota');
        modals.contract.show();
    });
    
    document.getElementById('save-contract-button').addEventListener('click', async () => {
        const id = document.getElementById('contract-id').value;
        const studentId = document.getElementById('contract-student-id').value;
        const routeId = document.getElementById('contract-route-id').value;
        
        const student = allData.students.find(s => String(s.id) === studentId);
        const route = allData.routes.find(r => String(r.id) === routeId);

        const data = {
            studentId: studentId,
            routeId: routeId,
            parentId: student ? student.parentId : null,
            driverId: route ? route.driverId : null,
            date: document.getElementById('contract-date').value,
            status: document.getElementById('contract-status').value,
            paymentStatus: document.getElementById('contract-payment-status').value,
        };
        if (await saveData('contracts', data, id)) modals.contract.hide();
    });
    
    tableBodies.contracts.addEventListener('click', (e) => {
        if (e.target.closest('.edit-contract')) {
            const id = e.target.closest('.edit-contract').dataset.id;
            const contract = allData.contracts.find(c => String(c.id) === String(id));
            if (contract) {
                document.getElementById('contract-modal-title').innerText = 'Editar Contrato';
                document.getElementById('contract-id').value = contract.id;
                populateSelect(document.getElementById('contract-student-id'), allData.students, 'id', 'name', 'Selecione um Aluno');
                document.getElementById('contract-student-id').value = contract.studentId;
                populateSelect(document.getElementById('contract-route-id'), allData.routes, 'id', 'routeName', 'Selecione uma Rota');
                document.getElementById('contract-route-id').value = contract.routeId;
                document.getElementById('contract-date').value = contract.date ? new Date(contract.date).toISOString().split('T')[0] : '';
                document.getElementById('contract-status').value = contract.status;
                document.getElementById('contract-payment-status').value = contract.paymentStatus || 'pendente';
                modals.contract.show();
            }
        }
        if (e.target.closest('.delete-contract')) {
            const id = e.target.closest('.delete-contract').dataset.id;
            deleteData('contracts', id);
        }
    });

    // --- INICIALIZAÇÃO ---
    loadAllData();
});