        document.addEventListener('DOMContentLoaded', () => {
            Auth.setupHeader('nav-links-container');

            const calculatorForm = document.getElementById('calculator-form');
            const resultsContainer = document.getElementById('calculator-results');
            const resultsContent = document.getElementById('results-content');
            const CO2_PER_LITER = 2.3; // kg de CO2 por litro de gasolina (aproximado)

            calculatorForm.addEventListener('submit', (e) => {
                e.preventDefault();

                // Obter valores do formulário
                const distancia = parseFloat(document.getElementById('distancia').value);
                const consumo = parseFloat(document.getElementById('consumo').value);
                const precoCombustivel = parseFloat(document.getElementById('preco_combustivel').value);
                const diasLetivos = parseInt(document.getElementById('dias_letivos').value);
                const custoVan = parseFloat(document.getElementById('custo_van').value);

                // Validar entradas
                if (isNaN(distancia) || isNaN(consumo) || isNaN(precoCombustivel) || isNaN(diasLetivos) || isNaN(custoVan) || consumo <= 0) {
                    alert('Por favor, preencha todos os campos com valores válidos.');
                    return;
                }

                // Calcular
                const litrosPorDia = distancia / consumo;
                const litrosPorMes = litrosPorDia * diasLetivos;
                const gastoCombustivelMensal = litrosPorMes * precoCombustivel;
                const economiaMensal = gastoCombustivelMensal - custoVan;
                const co2Evitado = litrosPorMes * CO2_PER_LITER;

                // Montar o HTML dos resultados
                let economiaHtml;
                if (economiaMensal > 0) {
                    economiaHtml = `
                        <div class="result-card economy">
                            <h3>Economia Financeira Mensal</h3>
                            <p class="result-value">R$ ${economiaMensal.toFixed(2).replace('.', ',')}</p>
                            <p class="result-description">Este é o valor que você economiza todo mês ao optar pela van.</p>
                        </div>
                    `;
                } else {
                    economiaHtml = `
                        <div class="result-card extra-cost">
                            <h3>Custo Adicional Mensal</h3>
                            <p class="result-value">R$ ${Math.abs(economiaMensal).toFixed(2).replace('.', ',')}</p>
                            <p class="result-description">Neste cenário, a van teria um custo extra. Considere também a economia de tempo e a redução de estresse!</p>
                        </div>
                    `;
                }
                
                resultsContent.innerHTML = `
                    <div class="result-card">
                        <h3>Gasto com Carro</h3>
                        <p class="result-value">R$ ${gastoCombustivelMensal.toFixed(2).replace('.', ',')}</p>
                        <p class="result-description">Seu gasto mensal estimado com combustível para este trajeto.</p>
                    </div>
                    
                    ${economiaHtml}

                    <div class="result-card carbon">
                        <h3>Pegada de Carbono</h3>
                        <p class="result-value">${co2Evitado.toFixed(1).replace('.', ',')} kg</p>
                        <p class="result-description">De CO₂ que você deixa de emitir na atmosfera por mês.</p>
                    </div>
                `;

                // Exibir resultados
                resultsContainer.style.display = 'block';
                resultsContainer.scrollIntoView({ behavior: 'smooth' });
            });
        });