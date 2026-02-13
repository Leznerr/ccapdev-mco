/* file: js/view-lab.js */
$(document).ready(function() {

    // --- State & Selectors ---
    let selectedSeat = null;
    let walkInName = "Walk-in Student";
    const isTech = currentUser?.role === "Technician";

    const $bldgSelect = $('#building-selector'), $labSelect = $('#lab-selector'), $date = $('#date-selector');
    const $seatDisplay = $('#selected-seat-display'), $btnReserve = $('#btn-reserve'), $seatGrid = $('#seat-grid');
    const $lockedCards = $('#time-card, #confirm-card');

    // --- Helpers ---
    const getSelectedTimes = () => $('.time-slot-checkbox:checked').map((_, el) => el.value).get();
    const toggleLocks = (locked) => $lockedCards.toggleClass('locked-element', locked).toggleClass('unlocked-element', !locked);
    const updateUI = () => {
        $seatDisplay.text(selectedSeat || 'None').toggleClass('active', !!selectedSeat);
        $btnReserve.prop('disabled', !(currentUser && selectedSeat && getSelectedTimes().length));
    };

    // --- 1. Initialization ---
    const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];
    const formatTime = t => { let [h, m] = t.split(':'); return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`; };

    timeSlots.forEach((start, i) => {
        if (i === timeSlots.length - 1) return;
        const val = `${start} - ${timeSlots[i + 1]}`, id = `time-${i}`;
        $('#time-slots-grid').append(`<div class="time-slot-option"><input type="checkbox" id="${id}" value="${val}" class="time-slot-checkbox"><label for="${id}" class="time-slot-label">${formatTime(start)} - ${formatTime(timeSlots[i + 1])}</label></div>`);
    });

    buildings.forEach(b => $bldgSelect.append(new Option(b.name, b.id)));
    
    // Set dates (Today to +6 days) using quick ISO strings
    const d = new Date(), f = date => date.toISOString().split('T')[0];
    $date.attr({ min: f(d), max: f(new Date(d.setDate(d.getDate() + 6))) }).val(f(new Date()));

    if (isTech) {
        walkInName = sessionStorage.getItem('currentWalkIn') || walkInName;
        $('#tech-context').show(); $('#walkin-display-name').text(walkInName);
        $('#student-controls').hide(); $btnReserve.text("Confirm Walk-in");
    } else if (!currentUser) {
        $btnReserve.text("Login Required").prop('disabled', true); $('#student-controls').hide();
    }

    // --- 2. UI Flow Events ---
    $bldgSelect.change(function() {
        selectedSeat = null; $('.time-slot-checkbox').prop('checked', false); updateUI();
        $labSelect.html('<option value="" disabled selected>Select a lab room...</option>')
                  .append(labs.filter(l => l.buildingId === this.value).map(l => new Option(l.name, l.id)));
        $('#lab-group').fadeIn(); $('#lab-info-box, #map-wrapper').hide();
        toggleLocks(true); $('#map-placeholder').show();
    });

    $labSelect.change(function() {
        const lab = labs.find(l => l.id === this.value);
        if (!lab) return;
        selectedSeat = null; $('.time-slot-checkbox').prop('checked', false); updateUI();
        
        $('#lab-location').text(lab.location); $('#lab-capacity').text(`${lab.capacity} Seats`);
        $('#lab-info-box, #map-wrapper').fadeIn();
        toggleLocks(false); $('#map-placeholder').hide();
        renderSeats();
    });

    $date.change(() => $labSelect.val() && renderSeats());
    $(document).on('change', '.time-slot-checkbox', () => { updateUI(); renderSeats(); });

    // --- 3. Map Rendering ---
    function renderSeats() {
        $seatGrid.empty().append('<div></div>').append([1,2,3,4,5].map(c => `<div class="grid-label">${c}</div>`));
        const occupied = new Map(), selTimes = getSelectedTimes();
        
        reservations.filter(r => r.lab === $labSelect.val() && r.date === $date.val() && r.status === "Active" && selTimes.includes(r.time))
                    .forEach(r => occupied.set(r.seat, r));

        if (selectedSeat && occupied.has(selectedSeat)) selectedSeat = null;
        updateUI();

        ['A', 'B', 'C', 'D'].forEach(row => {
            $seatGrid.append(`<div class="grid-label">${row}</div>`);
            [1,2,3,4,5].forEach(col => {
                const id = `${row}${col}`, res = occupied.get(id), $s = $(`<div class="seat">${id}</div>`);
                
                if (res) {
                    if (currentUser && res.reserver === currentUser.username) {
                        $s.addClass('user-owned').append(`<span class="tooltip-text">Your Booking</span>`);
                    } else {
                        $s.addClass('occupied').append(res.isAnonymous ? `<span class="tooltip-text">Occupied (Anon)</span>` : `<span class="tooltip-text">Reserved by: <br><span class="tooltip-user-link">${res.reserver}</span></span>`);
                        if (!res.isAnonymous) $s.css('cursor', 'pointer').click(() => window.location.href = `profile.html?user=${encodeURIComponent(res.reserver)}`);
                    }
                } else {
                    $s.attr('title', 'Available').toggleClass('selected', selectedSeat === id).click(function() {
                        selectedSeat = selectedSeat === id ? null : id;
                        renderSeats(); // Simple state-based re-render
                    });
                }
                $seatGrid.append($s);
            });
        });
    }

    setInterval(() => $labSelect.val() && renderSeats(), 10000);

    // --- 4. Submission ---
    $btnReserve.click(function() {
        if (!currentUser) return window.location.href = "login.html";
        const selTimes = getSelectedTimes();
        
        if (reservations.some(r => r.lab === $labSelect.val() && r.date === $date.val() && r.seat === selectedSeat && selTimes.includes(r.time) && r.status === "Active")) {
            alert(`Oops! Seat ${selectedSeat} was just taken.`); return renderSeats();
        }

        const groupId = Date.now(), isAnon = !isTech && $('#anon-check').is(':checked');
        reservations.push(...selTimes.map((t, i) => ({ id: groupId + i, reservationGroupId: groupId, lab: $labSelect.val(), seat: selectedSeat, date: $date.val(), time: t, reserver: isTech ? walkInName : currentUser.username, status: "Active", isAnonymous: isAnon })));

        $('#modal-ref-id').text(`#${groupId}`); $('#modal-slots-count').text(`${selTimes.length} slot(s) reserved`);
        $('#success-modal').fadeIn(300);
        
        selectedSeat = null; $('.time-slot-checkbox').prop('checked', false);
        renderSeats();
    });

    $('#btn-finish').click(() => $('#success-modal').fadeOut());
});