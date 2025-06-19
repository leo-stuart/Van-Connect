// Função para copiar a chave PIX (sem alterações)
function copyToClipboard() {
    const pix = document.getElementById('chave-pix');
    navigator.clipboard.writeText(pix.textContent);
    alert('Chave PIX copiada para a área de transferência!');
}

// Função para carregar dados e gerar QR Code (sem alterações na lógica principal)
function carregarDadosEGerarQRCode() {
    const params = new URLSearchParams(document.location.search);
    const routeId = params.get('routeId');
    const driverId = params.get('driverId');

    const backLink = document.getElementById('back-to-details-link');
    if (driverId) {
        backLink.href = `../perfilMotorista/detalhes.html?driverId=${driverId}`;
    }

    if (!routeId || !driverId) {
        mostrarErro("ID da rota ou do motorista não especificado na URL");
        return;
    }

    function mostrarErro(mensagem) {
        console.error(mensagem);
        const errorElement = document.getElementById("erro");
        if (errorElement) {
            errorElement.textContent = mensagem;
            errorElement.style.display = "block";
        }
    }

    Promise.all([
            fetch(`https://van-connect-api.onrender.com/routes/${routeId}`).then(res => res.json()),
            fetch(`https://van-connect-api.onrender.com/drivers/${driverId}`).then(res => res.json())
        ])
        .then(([route, driver]) => {
            if (!route || !driver || !route.price || !driver.chavePix) {
                throw new Error('Dados da rota ou do motorista estão incompletos');
            }

            document.getElementById('valor-pix').textContent = `R$ ${route.price.toFixed(2).replace('.', ',')}`;
            const valorFormatado = route.price.toString();
            const pixUrl = `https://van-connect-api.onrender.com/api/pix?nome=${encodeURIComponent(driver.name)}&cidade=${encodeURIComponent(driver.cidade || 'Belo Horizonte')}&valor=${encodeURIComponent(valorFormatado)}&chave=${encodeURIComponent(driver.chavePix)}`;

            return fetch(pixUrl).then(res => res.json());
        })
        .then(data => {
            if (!data || !data.brcode) {
                throw new Error('Resposta da API PIX inválida');
            }
            document.getElementById("chave-pix").textContent = data.brcode;
            new QRCode(document.getElementById("qrcode"), {
                text: data.brcode,
                width: 256,
                height: 256
            });
            document.getElementById('status').textContent = 'Pix Gerado! Escaneie para pagar.';

            let tempoTotal = 15 * 60;
            const contador = document.getElementById('timer');
            const intervalo = setInterval(() => {
                const minutos = Math.floor(tempoTotal / 60);
                const segundos = tempoTotal % 60;
                contador.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
                if (--tempoTotal < 0) {
                    clearInterval(intervalo);
                    contador.textContent = "Expirado";
                    document.getElementById("btn-pagamento").disabled = true;
                }
            }, 1000);
        })
        .catch(err => {
            mostrarErro(`Erro ao carregar PIX: ${err.message}`);
        });
}

// --- LÓGICA DE CRIAÇÃO DE CONTRATO (MODIFICADA) ---
document.getElementById("btn-pagamento").addEventListener("click", async () => {
    const btn = document.getElementById("btn-pagamento");
    btn.disabled = true;
    btn.textContent = "Processando...";

    const params = new URLSearchParams(document.location.search);
    const routeId = params.get('routeId');
    const driverId = params.get('driverId');
    const studentId = params.get('studentId');

    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
        alert("Erro de autenticação. Por favor, faça login novamente.");
        btn.disabled = false;
        btn.textContent = "Pagamento Concluído";
        return;
    }

    try {
        // 1. Buscar dados do aluno e da rota em paralelo
        const [studentRes, routeRes] = await Promise.all([
            fetch(`https://van-connect-api.onrender.com/students/${studentId}`),
            fetch(`https://van-connect-api.onrender.com/routes/${routeId}`)
        ]);

        if (!studentRes.ok || !routeRes.ok) {
            throw new Error('Não foi possível encontrar os dados do aluno ou da rota.');
        }

        const student = await studentRes.json();
        const route = await routeRes.json();

        if (!student.longLat) {
            throw new Error('O aluno não possui um endereço com coordenadas válidas. Edite o perfil do aluno na sua área.');
        }

        // 2. Adicionar o ponto de coleta do aluno à rota
        const newPickupPoint = {
            studentId: student.id,
            longLat: student.longLat
        };

        // Garante que o array pickupPoints exista e adiciona o novo ponto
        const updatedPickupPoints = route.pickupPoints ? [...route.pickupPoints, newPickupPoint] : [newPickupPoint];

        // 3. Salvar a rota atualizada com o novo ponto de coleta
        await fetch(`https://van-connect-api.onrender.com/routes/${route.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pickupPoints: updatedPickupPoints })
        });
        
        // 4. Criar o objeto do novo contrato
        const newContract = {
            studentId: studentId,
            routeId: routeId,
            driverId: driverId,
            parentId: currentUser.id,
            date: new Date().toISOString().split('T')[0],
            status: "ativo",
            paymentStatus: "pago"
        };

        // 5. Salvar o novo contrato
        const contractResponse = await fetch('https://van-connect-api.onrender.com/contracts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newContract)
        });

        if (!contractResponse.ok) {
            throw new Error('Falha ao salvar o contrato no servidor.');
        }

        // 6. Exibir sucesso e redirecionar
        document.getElementById("mensagem-sucesso").style.display = "block";
        btn.textContent = "Pagamento Concluído";

        setTimeout(() => {
            window.location.href = '../meus-contratos/meus-contratos.html';
        }, 3000);

    } catch (error) {
        console.error("Erro ao criar contrato:", error);
        alert(`Ocorreu um erro: ${error.message}`);
        btn.disabled = false;
        btn.textContent = "Tentar Novamente";
    }
});


// Executar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', carregarDadosEGerarQRCode);