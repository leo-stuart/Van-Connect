document.addEventListener('DOMContentLoaded', () => {
    Auth.protectPage();
    const currentUser = Auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'parent') {
        alert('Acesso negado. Esta área é restrita aos pais e responsáveis.');
        window.location.href = Auth.DEFAULT_REDIRECT_PAGE;
        return;
    }

    const API_BASE_URL = 'http://localhost:3000';
    const summaryContainer = document.getElementById('summary-cards-container');
    const studentsContainer = document.getElementById('students-container');
    const parentProfileForm = document.getElementById('parent-profile-form');
    const profileImg = document.getElementById('profile-img');
    const studentModal = document.getElementById('student-modal');
    const studentForm = document.getElementById('student-form');
    const studentModalTitle = document.getElementById('student-modal-title');
    const openStudentAvatarBtn = document.getElementById('open-student-avatar-modal-btn');
    const studentAvatarModal = document.getElementById('student-avatar-modal');
    const studentAvatarGrid = document.getElementById('student-avatar-grid');
    const avatarModal = document.getElementById('avatar-modal');
    const changePhotoBtn = document.getElementById('change-photo-btn');

    let allContracts = [];
    let allStudents = [];

    const setFieldValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        } else {
            console.warn(`Elemento com ID '${id}' não encontrado no formulário.`);
        }
    };

    async function geocodeAddress(addressString) {
        if (!addressString) return null;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Falha na resposta da API de geocodificação');
            const data = await response.json();
            if (data && data.length > 0) {
                return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
            }
            return null;
        } catch (error) {
            console.error("Erro na geocodificação:", error);
            return null;
        }
    }

    async function loadParentProfile() {
        setFieldValue('parent-name', currentUser.nome || '');
        setFieldValue('parent-email', currentUser.email || '');
        setFieldValue('parent-phone', currentUser.celular || '');
        if (profileImg) {
            profileImg.src = currentUser.photoUrl || '../../images/avatars/avatar_placeholder.png';
        }
    }

    async function loadDashboardData() {
        try {
            const [baseContractsRes, studentsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/contracts?parentId=${currentUser.id}`),
                fetch(`${API_BASE_URL}/students?parentId=${currentUser.id}`)
            ]);
            if (!baseContractsRes.ok || !studentsRes.ok) throw new Error('Não foi possível carregar os dados do painel.');
            const baseContracts = await baseContractsRes.json();
            allStudents = await studentsRes.json();
            allContracts = await Promise.all(
                baseContracts.map(async (contract) => {
                    const [routeRes, driverRes, studentRes] = await Promise.all([
                        fetch(`${API_BASE_URL}/routes/${contract.routeId}`),
                        fetch(`${API_BASE_URL}/drivers/${contract.driverId}`),
                        fetch(`${API_BASE_URL}/students/${contract.studentId}`)
                    ]);
                    return {
                        ...contract,
                        route: routeRes.ok ? await routeRes.json() : null,
                        driver: driverRes.ok ? await driverRes.json() : null,
                        student: studentRes.ok ? await studentRes.json() : null,
                    };
                })
            );
            displaySummary(allContracts);
            displayStudents(allStudents, allContracts);
        } catch (error) {
            console.error('Erro ao carregar dados do painel:', error);
            if (summaryContainer) summaryContainer.innerHTML = `<p class="no-results">${error.message}</p>`;
            if (studentsContainer) studentsContainer.innerHTML = `<p class="no-results">${error.message}</p>`;
        }
    }

    function displaySummary(contracts) {
        if (!summaryContainer) return;
        summaryContainer.innerHTML = '';
        if (contracts.length === 0) {
            summaryContainer.innerHTML = '<p class="no-results">Você ainda não possui contratos ativos. <a href="../filtros/filtros.html">Clique aqui para buscar uma rota</a>.</p>';
            return;
        }
        contracts.forEach(contract => {
            const price = Number(contract.route?.price || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
            const contractCard = document.createElement('div');
            contractCard.className = 'contract-card';
            contractCard.innerHTML = `
                <div class="contract-info">
                    <h4>${contract.student?.name || 'Aluno não identificado'}</h4>
                    <p><strong>Rota:</strong> ${contract.route?.routeName || 'Rota não encontrada'}</p>
                    <p><strong>Motorista:</strong> ${contract.driver?.name || 'Motorista não encontrado'}</p>
                </div>
                <div class="contract-details">
                    <p class="price">${price} / mês</p>
                    <a href="../perfilMotorista/detalhes.html?driverId=${contract.driver?.id}" class="cta-button details-btn">Ver Detalhes</a>
                </div>
            `;
            summaryContainer.appendChild(contractCard);
        });
    }

    function displayStudents(students, contracts) {
        if (!studentsContainer) return;
        studentsContainer.innerHTML = '';
        if (students.length === 0) {
            studentsContainer.innerHTML = '<p class="no-results">Nenhum aluno cadastrado. Clique em "Adicionar Aluno" para começar.</p>';
            return;
        }
        students.forEach(student => {
            const contract = contracts.find(c => String(c.studentId) === String(student.id));
            const driver = contract ? contract.driver : null;
            const studentCard = document.createElement('div');
            studentCard.className = 'student-card';
            studentCard.innerHTML = `
                <div class="student-photo"><img src="${student.photoUrl || '../../images/avatars/avatar_placeholder.png'}" alt="Foto de ${student.name}"></div>
                <div class="student-info">
                    <h4>${student.name}</h4>
                    <p><strong>Escola:</strong> ${student.school || 'Não informada'}</p>
                    <p><strong>Turma:</strong> ${student.class || 'Não informada'}</p>
                    ${driver ? `<div class="driver-contact"><img src="${driver.photoUrl || '../../images/avatars/avatar_placeholder.png'}" alt="Foto de ${driver.name}"><div><strong>Motorista Responsável:</strong><p>${driver.name}</p></div><button class="cta-button contact-driver-btn" data-driver-id="${driver.id}">Contato</button></div>` : '<p>Nenhum motorista atribuído.</p>'}
                </div>
                <div class="student-actions">
                    <button class="btn edit-btn" data-id="${student.id}">Editar</button>
                    <button class="btn delete-btn" data-id="${student.id}">Excluir</button>
                </div>`;
            studentCard.querySelector('.edit-btn').addEventListener('click', () => openStudentModal(student));
            studentCard.querySelector('.delete-btn').addEventListener('click', () => deleteStudent(student.id));
            if (driver) {
                const contactButton = studentCard.querySelector('.contact-driver-btn');
                contactButton.addEventListener('click', () => {
                    if (driver.phone) {
                        const phoneNumber = driver.phone.replace(/\D/g, '');
                        window.open(`https://wa.me/55${phoneNumber}`, '_blank');
                    } else {
                        alert('O número de telefone do motorista não está disponível.');
                    }
                });
            }
            studentsContainer.appendChild(studentCard);
        });
    }

    function openStudentModal(student = null) {
        if (!studentForm || !studentModal) return;
        studentForm.reset();
        studentModalTitle.textContent = student ? 'Editar Aluno' : 'Adicionar Aluno';
        
        setFieldValue('student-id', student ? student.id : '');
        setFieldValue('student-name', student ? student.name : '');
        setFieldValue('student-school', student ? student.school : '');
        setFieldValue('student-class', student ? student.class : '');
        setFieldValue('student-photo', student ? student.photoUrl : '');
        setFieldValue('student-street', student?.address?.street || '');
        setFieldValue('student-number', student?.address?.number || '');
        setFieldValue('student-neighborhood', student?.address?.neighborhood || '');
        setFieldValue('student-city', student?.address?.city || 'Belo Horizonte');

        studentModal.style.display = 'flex';
    }

    function closeStudentModal() {
        if (studentModal) studentModal.style.display = 'none';
    }

    async function openStudentAvatarModal() {
        if (!studentAvatarGrid || !studentAvatarModal) return;
        studentAvatarGrid.innerHTML = '<p class="loading-message">Carregando...</p>';
        studentAvatarModal.style.display = 'flex';
        try {
            const response = await fetch(`${API_BASE_URL}/avatars`);
            if (!response.ok) throw new Error('Falha ao buscar avatares.');
            const avatars = await response.json();
            studentAvatarGrid.innerHTML = '';
            avatars.forEach(avatar => {
                const img = document.createElement('img');
                img.src = avatar.url;
                img.alt = `Avatar ${avatar.id}`;
                img.style.cursor = 'pointer';
                img.addEventListener('click', () => {
                    setFieldValue('student-photo', avatar.url);
                    studentAvatarModal.style.display = 'none';
                });
                studentAvatarGrid.appendChild(img);
            });
        } catch (error) {
            studentAvatarGrid.innerHTML = `<p class="no-results">${error.message}</p>`;
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    }

    async function openAvatarModal() {
        const avatarGrid = document.getElementById('avatar-grid');
        if (!avatarGrid || !avatarModal) return;
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
                img.style.cursor = 'pointer';
                img.addEventListener('click', () => selectAvatar(avatar.url));
                avatarGrid.appendChild(img);
            });
        } catch (error) {
            avatarGrid.innerHTML = `<p class="no-results">${error.message}</p>`;
        }
    }

    async function selectAvatar(photoUrl) {
        try {
            const response = await fetch(`${API_BASE_URL}/usuarios/${currentUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoUrl })
            });
            if (!response.ok) throw new Error('Não foi possível atualizar a foto.');
            if(profileImg) profileImg.src = photoUrl;
            currentUser.photoUrl = photoUrl;
            sessionStorage.setItem('usuarioCorrente', JSON.stringify(currentUser));
            closeModal('avatar-modal');
            alert('Avatar atualizado com sucesso!');
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }

    async function saveStudent(event) {
        event.preventDefault();
        const submitButton = studentForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        try {
            const studentAddress = {
                street: document.getElementById('student-street').value.trim(),
                number: document.getElementById('student-number').value.trim(),
                neighborhood: document.getElementById('student-neighborhood').value.trim(),
                city: document.getElementById('student-city').value.trim(),
            };
            const fullAddressString = `${studentAddress.street}, ${studentAddress.number}, ${studentAddress.neighborhood}, ${studentAddress.city}`;
            const coordinates = await geocodeAddress(fullAddressString);
            if (!coordinates) {
                throw new Error('Não foi possível encontrar as coordenadas para o endereço fornecido. Verifique os dados e tente novamente.');
            }
            const id = document.getElementById('student-id').value;
            const studentData = {
                name: document.getElementById('student-name').value,
                school: document.getElementById('student-school').value,
                class: document.getElementById('student-class').value,
                photoUrl: document.getElementById('student-photo').value,
                parentId: currentUser.id,
                address: studentAddress,
                longLat: coordinates
            };
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_BASE_URL}/students/${id}` : `${API_BASE_URL}/students`;
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            });
            if (!response.ok) throw new Error('Falha ao salvar aluno.');
            closeStudentModal();
            await loadDashboardData();
        } catch (error) {
            alert(`Erro: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar';
        }
    }

    async function deleteStudent(studentId) {
        if (!confirm('Tem certeza que deseja excluir este perfil de aluno?\nTODOS OS CONTRATOS ASSOCIADOS A ELE SERÃO CANCELADOS.')) return;
        try {
            const contractsToDelete = allContracts.filter(c => String(c.studentId) === String(studentId));
            for (const contract of contractsToDelete) {
                await fetch(`${API_BASE_URL}/contracts/${contract.id}`, { method: 'DELETE' });
                if (contract.route?.vehicleId) {
                    const vehicle = await fetch(`${API_BASE_URL}/vehicles/${contract.route.vehicleId}`).then(res => res.json());
                    if (vehicle) {
                        await fetch(`${API_BASE_URL}/vehicles/${vehicle.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ availableSpots: vehicle.availableSpots + 1 })
                        });
                    }
                }
            }
            const response = await fetch(`${API_BASE_URL}/students/${studentId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Falha ao excluir o perfil do aluno.');
            alert('Aluno e todos os seus contratos foram excluídos com sucesso.');
            await loadDashboardData();
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }

    if (parentProfileForm) {
        parentProfileForm.addEventListener('submit', async(e) => {
            e.preventDefault();
            const dataToSave = {
                nome: document.getElementById('parent-name').value,
                email: document.getElementById('parent-email').value,
                celular: document.getElementById('parent-phone').value,
            };
            try {
                const response = await fetch(`${API_BASE_URL}/usuarios/${currentUser.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSave)
                });
                if (!response.ok) throw new Error('Falha ao salvar o perfil.');
                alert('Perfil atualizado com sucesso!');
                const updatedUser = { ...currentUser, ...dataToSave };
                sessionStorage.setItem('usuarioCorrente', JSON.stringify(updatedUser));
                Auth.setupHeader('nav-links-container');
            } catch (error) {
                alert(`Erro: ${error.message}`);
            }
        });
    }

    document.getElementById('add-student-btn')?.addEventListener('click', () => openStudentModal());
    if (studentForm) studentForm.addEventListener('submit', saveStudent);
    studentModal?.querySelector('.cancel-button').addEventListener('click', closeStudentModal);
    changePhotoBtn?.addEventListener('click', openAvatarModal);
    openStudentAvatarBtn?.addEventListener('click', openStudentAvatarModal);
    studentAvatarModal?.querySelector('.cancel-button').addEventListener('click', () => studentAvatarModal.style.display = 'none');
    avatarModal?.querySelector('.cancel-button').addEventListener('click', () => closeModal('avatar-modal'));

    loadDashboardData();
    loadParentProfile();
});