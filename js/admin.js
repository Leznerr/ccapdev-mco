/* file: js/admin.js */
(function() {
  if (typeof currentUser === "undefined" || !currentUser) {
    window.location.replace("index.html");
    return;
  }

  if (currentUser.role !== "Lab Technician") {
    window.location.replace("index.html");
    return;
  }

  const labCapacityData = {
    'GK-304B': 40,
    'GK-404A': 45,
    'AG-1904': 35,
    'AG-702': 30,
    'VL-201': 30
  };

  const getGroupKey = (reservation) => String(reservation.reservationGroupId || reservation.id);
  const parseSlotStartMinutes = (timeRange) => {
    const [start] = String(timeRange || "").split(" - ");
    const [h, m] = start.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
    return (h * 60) + m;
  };
  const parseSlotDateTime = (date, timeRange) => {
    const [start] = String(timeRange || "").split(" - ");
    return new Date(`${date}T${start}:00`);
  };
  const formatNoShowTime = (dateObj) => dateObj.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
  const getNoShowEligibleAt = (group) => {
    const sorted = [...group].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return parseSlotStartMinutes(a.time) - parseSlotStartMinutes(b.time);
    });
    if (!sorted.length) return null;
    const startDateTime = parseSlotDateTime(sorted[0].date, sorted[0].time);
    if (Number.isNaN(startDateTime.getTime())) return null;
    return new Date(startDateTime.getTime() + (10 * 60 * 1000));
  };
  const getTimeRangeDisplay = (group) => {
    const sorted = [...group].sort((a, b) => parseSlotStartMinutes(a.time) - parseSlotStartMinutes(b.time));
    if (!sorted.length) return "N/A";
    if (sorted.length === 1) return sorted[0].time;
    const start = sorted[0].time.split(" - ")[0];
    const end = sorted[sorted.length - 1].time.split(" - ")[1];
    return `${start} - ${end}`;
  };
  const getBuildingName = (labId) => {
    const lab = (typeof labs !== "undefined") ? labs.find(l => l.id === labId) : null;
    const building = (typeof buildings !== "undefined" && lab)
      ? buildings.find(b => b.id === lab.buildingId)
      : null;
    return building ? building.name : (labId || "N/A");
  };
  const renderActiveReservations = () => {
    const tbody = document.getElementById("reservations-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const grouped = {};
    (reservations || [])
      .filter(res => res.status === "Active")
      .forEach(res => {
        const key = getGroupKey(res);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(res);
      });

    const groups = Object.values(grouped);
    if (!groups.length) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#6c757d;">No active reservations.</td></tr>`;
      return;
    }

    groups
      .sort((a, b) => {
        const aFirst = [...a].sort((x, y) => parseSlotStartMinutes(x.time) - parseSlotStartMinutes(y.time))[0];
        const bFirst = [...b].sort((x, y) => parseSlotStartMinutes(x.time) - parseSlotStartMinutes(y.time))[0];
        if (aFirst.date !== bFirst.date) return aFirst.date.localeCompare(bFirst.date);
        return parseSlotStartMinutes(aFirst.time) - parseSlotStartMinutes(bFirst.time);
      })
      .forEach(group => {
        const first = group[0];
        const groupId = getGroupKey(first);
        const displayName = first.isAnonymous ? "Anonymous User" : first.reserver;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${displayName}</td>
          <td>#${groupId}</td>
          <td>${getBuildingName(first.lab)}</td>
          <td>${first.lab}</td>
          <td>${first.seat}</td>
          <td>${first.date}</td>
          <td>${getTimeRangeDisplay(group)}</td>
          <td>${first.status}</td>
          <td><button class="remove-btn" data-group-id="${groupId}">Remove</button></td>
        `;
        tbody.appendChild(tr);
      });
  };

  const labForm = document.getElementById('lab-form');
  if (labForm) {
    labForm.addEventListener('submit', function(e) {
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
      const occupiedSeatSet = new Set(
        (reservations || [])
          .filter(res =>
            res.status === "Active" &&
            res.lab === room &&
            res.date === date &&
            res.time === time
          )
          .map(res => res.seat)
      );
      const occupiedSeats = occupiedSeatSet.size;
      const remainingSeats = totalSeats - occupiedSeats;

      document.getElementById('total-seats').textContent = totalSeats;
      document.getElementById('occupied-seats').textContent = occupiedSeats;
      document.getElementById('remaining-seats').textContent = remainingSeats;
      document.getElementById('lab-info').style.display = 'block';
    });
  }

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

  if (dateInput) {
    dateInput.setAttribute('min', formatDate(today));
    dateInput.setAttribute('max', formatDate(nextWeek));
    dateInput.value = formatDate(today);
  }

  document.addEventListener('DOMContentLoaded', function() {
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
    renderActiveReservations();
  });

  const modal = document.getElementById('modal');
  const modalCancel = document.getElementById('modal-cancel');
  const modalConfirm = document.getElementById('modal-confirm');

  let pendingGroupId = null;

  document.addEventListener('click', function(e) {
    const removeBtn = e.target.closest('.remove-btn');
    if (removeBtn && modal) {
      pendingGroupId = String(removeBtn.dataset.groupId || "");
      modal.style.display = 'flex';
    }
  });

  if (modalCancel && modal) {
    modalCancel.addEventListener('click', () => {
      modal.style.display = 'none';
      pendingGroupId = null;
    });
  }

  if (modalConfirm && modal) {
    modalConfirm.addEventListener('click', () => {
      if (!pendingGroupId) {
        modal.style.display = 'none';
        return;
      }

      const targetGroup = (reservations || []).filter(res => getGroupKey(res) === pendingGroupId);
      if (!targetGroup.length) {
        modal.style.display = 'none';
        pendingGroupId = null;
        renderActiveReservations();
        return;
      }

      const eligibleAt = getNoShowEligibleAt(targetGroup);
      if (eligibleAt && Date.now() < eligibleAt.getTime()) {
        alert(`No-show removal is only allowed 10 minutes after start time.\nEligible at: ${formatNoShowTime(eligibleAt)}`);
        return;
      }

      for (let i = reservations.length - 1; i >= 0; i--) {
        if (getGroupKey(reservations[i]) === pendingGroupId) {
          reservations.splice(i, 1);
        }
      }
      if (typeof saveReservations === "function") {
        saveReservations();
      }

      renderActiveReservations();
      modal.style.display = 'none';
      pendingGroupId = null;
    });
  }

  if (window && modal) {
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        pendingGroupId = null;
      }
    });
  }

  if (typeof STORAGE_RESERVATIONS_KEY !== "undefined") {
    window.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_RESERVATIONS_KEY) return;
      if (typeof localStorage === "undefined") return;
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_RESERVATIONS_KEY) || "null");
        if (!Array.isArray(stored)) return;
        reservations.length = 0;
        stored.forEach((entry, index) => {
          const normalized = (typeof normalizeReservation === "function")
            ? normalizeReservation(entry, index)
            : entry;
          reservations.push(normalized);
        });
        renderActiveReservations();
      } catch (err) {
        // Ignore malformed storage payloads.
      }
    });
  }

  // Script is loaded at the end of body; render once immediately.
  renderActiveReservations();
})();
