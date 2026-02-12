/* file: js/view-lab.js */

$(document).ready(function() {
    // DOM cache
    const $building = $('#building-selector');
    const $lab = $('#lab-selector');
    const $date = $('#date-selector');
    const $time = $('#time-selector');
    const $selectedSeat = $('#selected-seat-display');
    const $studentControls = $('#student-controls');
    const $anonCheck = $('#anon-check');
    const $btnReserve = $('#btn-reserve');
    const $labGroup = $('#lab-group');
    const $labInfo = $('#lab-info-box');
    const $dateTimeCard = $('#date-time-card');
    const $mapPlaceholder = $('#map-placeholder');
    const $mapWrapper = $('#map-wrapper');
    const $grid = $('#seat-grid');

    // Init: set dropdowns, date limits, role context
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 6);

    const formatDate = d => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    $building.html('<option value="" disabled selected>Choose a Building...</option>');
    buildings.forEach(b => $building.append(`<option value="${b.id}">${b.name}</option>`));

    $date.attr('min', formatDate(today));
    $date.attr('max', formatDate(nextWeek));
    $date.val(formatDate(today));

    let walkInName = 'Walk-in Student';

    const setRoleUI = () => {
        if (!currentUser) {
            $btnReserve.text('Login to Reserve').prop('disabled', true).css('background-color', '#adb5bd');
            $studentControls.hide();
            return;
        }

        if (currentUser.role === 'Technician') {
            const stored = sessionStorage.getItem('currentWalkIn');
            if (stored) walkInName = stored;
            $('#tech-context').show();
            $('#walkin-display-name').text(walkInName);
            $studentControls.hide();
            $btnReserve.text('Confirm Walk-in Reservation').css('background-color', '#e67e22');
        }
    };

    setRoleUI();

    // === EVENTS ===
    // Building -> load labs, reset map
    $building.on('change', function () {
        const selected = $(this).val();
        const filtered = labs.filter(l => l.buildingId === selected);
        $lab.html('<option value="" disabled selected>Choose a Lab...</option>');
        filtered.forEach(l => $lab.append(`<option value="${l.id}">${l.name}</option>`));

        $labGroup.fadeIn();
        $labInfo.hide();
        $dateTimeCard.css({ opacity: '0.5', 'pointer-events': 'none' });
        $mapPlaceholder.show();
        $mapWrapper.hide();
    });

    // Lab -> show info + map
    $lab.on('change', function () {
        const selectedLab = labs.find(l => l.id === $(this).val());
        if (!selectedLab) return;

        $('#lab-location').text(selectedLab.location);
        $('#lab-capacity').text(`${selectedLab.capacity} Seats`);
        $labInfo.fadeIn();
        $dateTimeCard.css({ opacity: '1', 'pointer-events': 'auto' });
        $mapPlaceholder.hide();
        $mapWrapper.fadeIn();
        renderSeats();
    });

    // Date/Time change -> refresh grid
    $date.add($time).on('change', () => {
        resetSelection();
        renderSeats();
    });

    // === RENDER GRID ===
    let selectedSeat = null;

    const findReservation = (labId, date, time, seatId) =>
        reservations.find(r =>
            r.lab === labId &&
            r.date === date &&
            r.time === time &&
            r.seat === seatId &&
            r.status === 'Active'
        );

    function renderSeats() {
        const currentLabId = $lab.val();
        if (!currentLabId) return;

        $grid.empty();
        const date = $date.val();
        const time = $time.val();
        const rows = ['A', 'B', 'C', 'D'];
        const cols = [1, 2, 3, 4, 5];

        $grid.append('<div></div>');
        cols.forEach(col => $grid.append(`<div class="grid-label">${col}</div>`));

        rows.forEach(row => {
            $grid.append(`<div class="grid-label">${row}</div>`);
            cols.forEach(col => {
                const seatId = `${row}${col}`;
                const res = findReservation(currentLabId, date, time, seatId);
                const seatEl = $('<div></div>').addClass('seat').text(seatId);

                if (res) {
                    if (currentUser && res.reserver === currentUser.username) {
                        seatEl.addClass('user-owned')
                               .append('<span class="tooltip-text">Your Booking</span>'); // Ikaw nag-book
                    } else {
                        seatEl.addClass('occupied');
                        if (res.isAnonymous) {
                            seatEl.append('<span class="tooltip-text">Occupied (Anonymous)</span>'); // walang name
                        } else {
                            seatEl.append(`<span class="tooltip-text">Reserved by: ${res.reserver}<br><small>(Click to view profile)</small></span>`)
                                   .css('cursor', 'pointer')
                                   .click(() => window.location.href = `profile.html?user=${encodeURIComponent(res.reserver)}`);
                        }
                    }
                } else {
                    seatEl.attr('title', 'Available').click(function () {
                        $('.seat').removeClass('selected');
                        $(this).addClass('selected');
                        selectedSeat = seatId;
                        $selectedSeat.text(`Selected: ${seatId}`).addClass('active');
                        if (currentUser) $btnReserve.prop('disabled', false);
                    });
                }

                $grid.append(seatEl);
            });
        });
    }

    function resetSelection() {
        selectedSeat = null;
        $selectedSeat.text('Select a Seat').removeClass('active');
        $btnReserve.prop('disabled', true);
    }

    // === AUTO REFRESH ===
    setInterval(() => {
        if ($lab.val()) renderSeats();
    }, 10000);

    // === RESERVE ===
    $btnReserve.on('click', function () {
        if (!currentUser) {
            alert('Please login to reserve.');
            window.location.href = 'login.html';
            return;
        }

        const newRes = {
            id: Date.now(),
            lab: $lab.val(),
            seat: selectedSeat,
            date: $date.val(),
            time: $time.val(),
            reserver: currentUser.role === 'Technician' ? walkInName : currentUser.username,
            status: 'Active',
            isAnonymous: currentUser.role === 'Technician' ? false : $anonCheck.is(':checked')
        };

        reservations.push(newRes);
        showSuccessModal(newRes);
        renderSeats();
    });

    const showSuccessModal = res => {
        $('#success-modal .modal-content p')
            .html(`Reservation Reference:<br><strong style="font-size: 1.5rem; color:#387C44;">#${res.id}</strong>`);
        $('#success-modal').fadeIn(300);
    };

    $('#btn-finish').on('click', function () {
        $('#success-modal').fadeOut();
        resetSelection();
        renderSeats();
    });
});
