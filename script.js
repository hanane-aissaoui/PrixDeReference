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
  
      if (name && bid) {
        competitors.push({ name, bid, isNew: true });
        updateCompetitorsList();
  
        // Clear the input fields after adding a competitor
        document.getElementById('competitor-name').value = '';
        document.getElementById('competitor-bid').value = '';
      }
  
      modal.style.display = 'none';
    });
  
    calculateBtn.addEventListener('click', () => {
      const estimation = parseFloat(estimationInput.value);
      if (isNaN(estimation) || competitors.length === 0) {
        alert('Please enter a valid estimation and add competitors.');
        return;
      }
  
      const type = travauxRadio.checked ? 'T' : servicesRadio.checked ? 'S' : null;
      if (!type) {
        alert('Please select a market type.');
        return;
      }
  
      let filteredCompetitors;
      if (type === 'T') {
        filteredCompetitors = competitors.filter(comp => comp.bid >= estimation * 0.8 && comp.bid <= estimation * 1.2);
      } else {
        filteredCompetitors = competitors.filter(comp => comp.bid >= estimation * 0.75 && comp.bid <= estimation * 1.2);
      }
  
      // Apply background color based on filtering result
      if (filteredCompetitors.length > 0) {
        estimationInput.classList.remove('error');
        estimationInput.classList.add('success');
      } else {
        estimationInput.classList.remove('success');
        estimationInput.classList.add('error');
      }
  
      // Remove 'new' class from all competitors
      competitors.forEach(comp => comp.isNew = false);
  
      updateCompetitorsList(filteredCompetitors);
  
      const sum = filteredCompetitors.reduce((acc, comp) => acc + comp.bid, 0);
      const avg = sum / filteredCompetitors.length;
      const referencePrice = (estimation + avg) / 2;
      referencePriceElem.textContent = referencePrice.toFixed(2);
  
      const closestUnder = filteredCompetitors.filter(comp => comp.bid < referencePrice).sort((a, b) => b.bid - a.bid)[0];
      const closestOver = filteredCompetitors.filter(comp => comp.bid > referencePrice).sort((a, b) => a.bid - b.bid)[0];
  
      if (closestUnder) {
        alert(`The closest offer below the reference price is: ${closestUnder.bid}`);
      } else if (closestOver) {
        alert(`The closest offer above the reference price is: ${closestOver.bid}`);
      }
    });
  
    function updateCompetitorsList(filteredCompetitors = []) {
      const estimation = parseFloat(estimationInput.value);
      competitorsList.innerHTML = '';
      competitors.forEach((competitor, index) => {
        const competitorElem = document.createElement('div');
        competitorElem.className = 'competitor';
        const isFiltered = filteredCompetitors.includes(competitor);
        const percentage = ((estimation - competitor.bid) / estimation) * 100;
        const sign = percentage > 0 ? '-' : '+';
        const absolutePercentage = Math.abs(percentage);
        competitorElem.innerHTML = `
          <span class="rank">${index + 1}</span>
          <span class="name">${competitor.name}</span>
          <span class="bid">${competitor.bid.toFixed(2)}</span>
          <span class="percentage">${sign}${absolutePercentage.toFixed(2)}%</span>
          <button class="delete-btn" onclick="removeCompetitor(${index})">X</button>
        `;
        competitorElem.classList.toggle('new', competitor.isNew);
        competitorElem.style.backgroundColor = isFiltered ? 'green' : 'white';
        competitorsList.appendChild(competitorElem);
      });
    }
  
    window.removeCompetitor = function (index) {
      competitors.splice(index, 1);
      updateCompetitorsList();
    };
  
    initializeBtn.addEventListener('click', () => {
      // Clear inputs
      estimationInput.value = '';
      travauxRadio.checked = false;
      servicesRadio.checked = false;
      referencePriceElem.textContent = '-';
  
      // Clear competitors array and update UI
      competitors = [];
      updateCompetitorsList();
  
      // Remove success and error classes
      estimationInput.classList.remove('success', 'error');
    });
  });
  