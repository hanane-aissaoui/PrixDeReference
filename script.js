document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const addCompetitorBtn = document.getElementById('add-competitor-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const competitorForm = document.getElementById('competitor-form');
    const competitorsList = document.getElementById('competitors-list');
    const calculateBtn = document.getElementById('calculate-btn');
    const initializeBtn = document.getElementById('initialize-btn');
    const referencePriceElem = document.getElementById('reference-price');
    const estimationInput = document.getElementById('estimation');
    const travauxRadio = document.getElementById('travaux');
    const servicesRadio = document.getElementById('services');
    const resultsSection = document.getElementById('results');

    let competitors = [];

    addCompetitorBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    competitorForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const name = document.getElementById('competitor-name').value;
        const bid = parseFloat(document.getElementById('competitor-bid').value);

        if (name && !isNaN(bid)) {
            competitors.push({ name, bid });
            updateCompetitorsList();

            document.getElementById('competitor-name').value = '';
            document.getElementById('competitor-bid').value = '';
        }

        modal.style.display = 'none';
    });

    calculateBtn.addEventListener('click', () => {
        const estimation = parseFloat(estimationInput.value);
        if (isNaN(estimation)) {
            alert('Veuillez saisir une estimation valide.');
            return;
        }
        if (competitors.length === 0) {
            alert('Veuillez ajouter des concurrents.');
            return;
        }

        const type = travauxRadio.checked ? 'T' : servicesRadio.checked ? 'S' : null;
        if (!type) {
            alert('Veuillez sélectionner un type de marché.');
            return;
        }

        const referencePrice = calculateReferencePrice(estimation, type);

        // Mettre à jour le prix de référence affiché
        referencePriceElem.textContent = referencePrice.toFixed(2);

        // Mettre à jour les tableaux avec les conditions spécifiques
        updateTables(referencePrice, estimation, type);

        resultsSection.style.display = 'block';
    });

    function calculateReferencePrice(estimation, type) {
        const filteredCompetitors = competitors.filter(comp => 
            (type === 'T' ? comp.bid >= estimation * 0.8 && comp.bid <= estimation * 1.2 : comp.bid >= estimation * 0.75 && comp.bid <= estimation * 1.2)
        );
        const sum = filteredCompetitors.reduce((acc, comp) => acc + comp.bid, 0);
        const avg = sum / filteredCompetitors.length;
        return (estimation + avg) / 2;
    }
    function calculateEcart(offer, estimation) {
        const ecart = ((offer - estimation) / estimation * 100).toFixed(2);
        return `${ecart}%`; // Ajouter le symbole "%"
    }
    function calculateEcart(offer, estimation) {
        const ecart = ((offer - estimation) / estimation * 100).toFixed(2);
        const sign = ecart >= 0 ? '+' : ''; // Ajouter le signe "+" pour les valeurs positives
        return `${sign}${ecart}%`; // Afficher l'écart avec le symbole "%"
    }
    function updateTables(referencePrice, estimation, type) {
        const excesList = document.getElementById('exces-list');
        const anormBasseList = document.getElementById('anorm-basse-list');
        const classementList = document.getElementById('classement-list');
    
        // Offres Excès
        const excesCompetitors = competitors.filter(comp => comp.bid > referencePrice &&
            (type === 'T' ? comp.bid > estimation * 1.2 : comp.bid > estimation * 1.2)
        );
        excesList.innerHTML = excesCompetitors.length ? excesCompetitors.map(comp => 
            `<tr><td>${comp.name}</td><td>${comp.bid.toFixed(2)} (${calculateEcart(comp.bid, estimation)})</td></tr>`
        ).join('') : '<tr><td colspan="2">Néant</td></tr>';
    
        // Offres Anorm Basse
        const anormBasseCompetitors = competitors.filter(comp => comp.bid < referencePrice &&
            (type === 'T' ? comp.bid < estimation * 0.8 : comp.bid < estimation * 0.75)
        );
        anormBasseList.innerHTML = anormBasseCompetitors.length ? anormBasseCompetitors.map(comp => 
            `<tr><td>${comp.name}</td><td>${comp.bid.toFixed(2)} (${calculateEcart(comp.bid, estimation)})</td></tr>`
        ).join('') : '<tr><td colspan="2">Néant</td></tr>';
    
        // Récupérer les noms des concurrents des offres excès et anormalement basses
        const excludedCompetitors = new Set([
            ...excesCompetitors.map(comp => comp.name),
            ...anormBasseCompetitors.map(comp => comp.name)
        ]);
    
        // Classement Offres
        const classementCompetitors = competitors
            .filter(comp => !excludedCompetitors.has(comp.name)) // Exclure les concurrents déjà listés
            .map(comp => ({
                ...comp,
                ecart: calculateEcart(comp.bid, estimation)
            }));
    
        // Séparer les concurrents en deux groupes
        const belowReference = classementCompetitors.filter(comp => comp.bid < referencePrice);
        const aboveReference = classementCompetitors.filter(comp => comp.bid >= referencePrice);
    
        // Trier les groupes
        belowReference.sort((a, b) => b.bid - a.bid); // Décroissant pour les offres inférieures
        aboveReference.sort((a, b) => a.bid - b.bid); // Croissant pour les offres supérieures
    
        // Fusionner les deux groupes
        const sortedCompetitors = [...belowReference, ...aboveReference];
    
        classementList.innerHTML = sortedCompetitors.length ? sortedCompetitors.map((comp, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${comp.name}</td>
                <td>${comp.bid.toFixed(2)}</td>
                <td>${comp.ecart}</td>
            </tr>
        `).join('') : '<tr><td colspan="4">Néant</td></tr>';
    
        // Trouver l'offre la plus proche du prix de référence
        let closestBelow = null;
        let closestAbove = null;
    
        if (belowReference.length > 0) {
            closestBelow = belowReference.reduce((prev, curr) => Math.abs(curr.bid - referencePrice) < Math.abs(prev.bid - referencePrice) ? curr : prev);
        }
        if (aboveReference.length > 0) {
            closestAbove = aboveReference.reduce((prev, curr) => Math.abs(curr.bid - referencePrice) < Math.abs(prev.bid - referencePrice) ? curr : prev);
        }
    
        // Afficher le message approprié
        const messageElem = document.getElementById('closest-offer-message');
        if (closestBelow) {
             messageElem.textContent =`L'offre la plus proche du prix de référence par défaut est ${closestBelow.bid.toFixed(2)} DH.`;
        } else if (closestAbove) {
            messageElem.textContent = `L'offre la plus proche du prix de référence par excès est ${closestAbove.bid.toFixed(2)} DH.`;
        } else {
            messageElem.textContent = 'Aucune offre ne correspond aux critères.';
        }
    }
    
    
    function updateCompetitorsList() {
        competitorsList.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Nom de Concurrent</th>
                        <th>Montant de l'offre financière</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${competitors.map((competitor, index) => `
                        <tr>
                            <td>${competitor.name}</td>
                            <td>${competitor.bid.toFixed(2)}</td>
                            <td><button class="delete-btn" data-index="${index}">X</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Ajouter un écouteur d'événement pour les boutons de suppression
        competitorsList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'), 10);
                competitors.splice(index, 1);
                updateCompetitorsList();
            });
        });
    }

    initializeBtn.addEventListener('click', () => {
        competitors = [];
        estimationInput.value = '';
        referencePriceElem.textContent = '-';
        document.getElementById('exces-list').innerHTML = '<tr><td colspan="2">Néant</td></tr>';
        document.getElementById('anorm-basse-list').innerHTML = '<tr><td colspan="2">Néant</td></tr>';
        document.getElementById('classement-list').innerHTML = '<tr><td colspan="4">Néant</td></tr>';
        updateCompetitorsList();
        resultsSection.style.display = 'none';
    });

   
    
});    
