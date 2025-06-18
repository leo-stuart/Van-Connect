// Arquivo: codigo/public/modulos/meus-contratos/meus-contratos.js
document.addEventListener("DOMContentLoaded", () => {
    // --- 1. CONFIGURAÇÃO E AUTENTICAÇÃO ---
    const API_BASE_URL = "https://van-connect-api.onrender.com";
    Auth.protectPage(); // Garante que apenas usuários logados acessem
    const currentUser = Auth.getCurrentUser();
    
    // --- 2. ELEMENTOS DO DOM ---
    const contractsContainer = document.getElementById('contracts-container');

    // --- 3. FUNÇÕES ---

    /**
     * Carrega e renderiza os contratos do usuário logado de forma otimizada.
     */
    async function loadUserContracts() {
        if (!currentUser) {
            contractsContainer.innerHTML = '<p class="error-message">Não foi possível identificar o usuário. Por favor, faça login novamente.</p>';
            return;
        }

        try {
            // OTIMIZAÇÃO: Usa _expand para buscar contratos e dados relacionados em uma única chamada.
            const response = await fetch(`${API_BASE_URL}/contracts?parentId=${currentUser.id}&_expand=route&_expand=driver&_expand=student`);
            if (!response.ok) {
                throw new Error("Falha ao buscar os contratos.");
            }
            const detailedContracts = await response.json();

            renderContracts(detailedContracts);

        } catch (error) {
            console.error("Erro ao carregar contratos:", error);
            contractsContainer.innerHTML = `<p class="error-message">Ocorreu um erro ao carregar seus contratos. Tente novamente mais tarde.</p>`;
        }
    }

    /**
     * Renderiza os cards de contrato na página.
     * @param {Array} contracts - A lista de contratos a ser exibida.
     */
    function renderContracts(contracts) {
        contractsContainer.innerHTML = ''; // Limpa a mensagem de "carregando"

        if (contracts.length === 0) {
            contractsContainer.innerHTML = `
                <div class="no-contracts-message">
                    <h3>Nenhum Contrato Encontrado</h3>
                    <p>Você ainda não possui nenhum contrato de transporte ativo.</p>
                    <a href="../filtros/filtros.html" class="cta-button" style="margin-top: 20px;">Buscar Rotas</a>
                </div>
            `;
            return;
        }

        contracts.forEach(contract => {
            const contractCard = document.createElement('div');
            contractCard.className = 'contract-card';

            const contractDate = new Date(contract.date).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric'
            });

            const studentName = contract.student?.name || 'Aluno não encontrado';
            const routeName = contract.route?.routeName || 'Rota não encontrada';
            const driverName = contract.driver?.name || 'Motorista não encontrado';
            const driverPhone = contract.driver?.phone || 'Não disponível';

            const routeId = contract.route?.id;
            const driverId = contract.driver?.id;
            
            // Container para os botões de ação
            const actionsHtml = `
                <div class="contract-actions">
                    ${routeId && driverId ? `<button class="btn-acompanhar" data-route-id="${routeId}" data-driver-id="${driverId}">Acompanhar</button>` : `<button class="btn-acompanhar" disabled>Rota Indisponível</button>`}
                    <button class="btn-finalizar" data-contract-id="${contract.id}">Finalizar Contrato</button>
                </div>
            `;

            contractCard.innerHTML = `
                <h3>${studentName}</h3>
                <div class="contract-details">
                    <p><strong>Rota:</strong> ${routeName}</p>
                    <p><strong>Motorista:</strong> ${driverName}</p>
                    <p><strong>Contato do Motorista:</strong> ${driverPhone}</p>
                </div>
                <div class="contract-footer">
                    <p class="date">Contratado em: ${contractDate}</p>
                    <span class="status status-${contract.status}">${contract.status}</span>
                </div>
                ${actionsHtml}
            `;
            contractsContainer.appendChild(contractCard);
        });
    }

    // --- 4. EVENT LISTENER UNIFICADO ---
    contractsContainer.addEventListener('click', async (event) => {
        const target = event.target;

        // Ação para o botão de acompanhar
        if (target.matches('.btn-acompanhar') && target.dataset.routeId && target.dataset.driverId) {
            const routeId = target.dataset.routeId;
            const driverId = target.dataset.driverId;
            window.location.href = `../localizador/localizador.html?routeId=${routeId}&driverId=${driverId}`;
        }

        // Ação para o novo botão de finalizar contrato
        if (target.matches('.btn-finalizar') && target.dataset.contractId) {
            const contractId = target.dataset.contractId;
            const confirmDelete = window.confirm("Tem certeza que deseja finalizar este contrato? Esta ação não pode ser desfeita.");

            if (confirmDelete) {
                try {
                    const response = await fetch(`${API_BASE_URL}/contracts/${contractId}`, {
                        method: 'DELETE'
                    });
                    if (!response.ok) {
                        throw new Error("Falha ao tentar finalizar o contrato.");
                    }
                    alert("Contrato finalizado com sucesso!");
                    loadUserContracts(); // Recarrega a lista para remover o card do contrato
                } catch (error) {
                    console.error("Erro ao finalizar contrato:", error);
                    alert(error.message);
                }
            }
        }
    });
    
    // --- 5. EXECUÇÃO INICIAL ---
    loadUserContracts();
});