
  const labCapacityData = {
    'GK-304B': 30,
    'GK-404A': 30,
    'AG-1904': 40,
    'AG-702': 40,
    'VL-201': 20
  };

  // forsubmission of lab form
  document.getElementById('lab-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const building = document.getElementById('lab-building').value;
    const room = document.getElementById('lab-room').value;
    const date = document.getElementById('lab-date').value;
    const time = document.getElementById('lab-time').value;
    
    if (!building || !room || !date || !time) {
      alert('Please fill in all fields');
      return;
    }

    const totalSeats = labCapacityData[room] || 50;
    const occupiedSeats = Math.floor(Math.random() * totalSeats);
    const remainingSeats = totalSeats - occupiedSeats;

    document.getElementById('total-seats').textContent = totalSeats;
    document.getElementById('occupied-seats').textContent = occupiedSeats;
    document.getElementById('remaining-seats').textContent = remainingSeats;
    document.getElementById('lab-info').style.display = 'block';
  });

  // date constraints (7)
  const dateInput = document.getElementById('lab-date');
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 6);
  
  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  dateInput.setAttribute('min', formatDate(today));
  dateInput.setAttribute('max', formatDate(nextWeek));
  dateInput.value = formatDate(today);



  // chart initialize
  document.addEventListener('DOMContentLoaded', function () {

    const chartA = document.getElementById('reservationsChart');

    if (chartA) {
      const reservationsChart = new Chart(chartA, {
        type: 'line',
        data: {
          labels: ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM'],
          datasets: [{
            label: 'Reservations',
            data: [5, 10, 7, 12, 8, 15],
            fill: true,
            backgroundColor: 'rgba(56, 124, 68, 0.2)',
            borderColor: '#387C44',
            tension: 0.3,
            pointRadius: 5,
            pointBackgroundColor: '#387C44'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });

    }

  });

 
  // modal logic
  const modal = document.getElementById('modal');
  const modalCancel = document.getElementById('modal-cancel');
  const modalConfirm = document.getElementById('modal-confirm');

  let currentRow = null;

  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-btn')) {
      currentRow = e.target.closest('tr');
      modal.style.display = 'flex';
    }
  });

  modalCancel.addEventListener('click', () => {
    modal.style.display = 'none';
    currentRow = null;
  });

  modalConfirm.addEventListener('click', () => {
    if (currentRow) {
      currentRow.remove();
    }
    modal.style.display = 'none';
    currentRow = null;
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      currentRow = null;
    }
  });
