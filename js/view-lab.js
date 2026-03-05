/* file: js/view-lab.js */
$(document).ready(function() {
    // --- State & Selectors ---
    let selectedSeat = null;
    let walkInTarget = null;
    const isTech = currentUser?.role === "Lab Technician";

    const $bldgSelect = $('#building-selector'), $labSelect = $('#lab-selector'), $date = $('#date-selector');
    const $seatDisplay = $('#selected-seat-display'), $btnReserve = $('#btn-reserve'), $seatGrid = $('#seat-grid');
    const $lockedCards = $('#time-card, #confirm-card');

    // --- Helpers ---
    const getSelectedTimes = () => $('.time-slot-checkbox:checked').map((_, el) => el.value).get();
    const findUserByQuery = query => {
        const needle = String(query || "").trim().toLowerCase();
        if (!needle || typeof users === "undefined") return null;
        const fullNameOf = user => `${user.firstName} ${user.lastName}`.toLowerCase();
        return users.find(user =>
            user.username.toLowerCase() === needle ||
            user.email.toLowerCase() === needle ||
            fullNameOf(user) === needle
        ) || users.find(user =>
            user.username.toLowerCase().includes(needle) ||
            user.email.toLowerCase().includes(needle) ||
            fullNameOf(user).includes(needle)
        ) || null;
    };
    const syncReservationsFromStorage = () => {
        if (typeof localStorage === "undefined" || typeof STORAGE_RESERVATIONS_KEY === "undefined") return;
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_RESERVATIONS_KEY) || "null");
            if (!Array.isArray(stored) || !Array.isArray(reservations)) return;
            reservations.length = 0;
            stored.forEach((entry, index) => {
                const normalized = (typeof normalizeReservation === "function")
                    ? normalizeReservation(entry, index)
                    : entry;
                reservations.push(normalized);
            });
        } catch (err) {
            // Ignore malformed local data and continue using in-memory state.
        }
    };
    const toggleLocks = (locked) => $lockedCards.toggleClass('locked-element', locked).toggleClass('unlocked-element', !locked);
    const updateUI = () => {
        $seatDisplay.text(selectedSeat || 'None').toggleClass('active', !!selectedSeat);
        if (!currentUser) {
            $btnReserve.prop('disabled', false);
            return;
        }
        if (isTech) {
            $btnReserve.prop('disabled', !(selectedSeat && getSelectedTimes().length && walkInTarget));
            return;
        }
        $btnReserve.prop('disabled', !(selectedSeat && getSelectedTimes().length));
    };
    const refreshWalkInTarget = () => {
        if (!isTech) return;
        const raw = $('#walkin-target-input').val().trim();
        if (!raw) {
            walkInTarget = null;
            $('#walkin-display-name').text('Not set');
            updateUI();
            return;
        }
        const matched = findUserByQuery(raw);
        if (matched) {
            walkInTarget = {
                reserver: `${matched.username} (walk-in)`,
                reservedForUsername: matched.username,
                profileUsername: matched.username,
                displayName: `${matched.username} (walk-in)`
            };
        } else {
            walkInTarget = {
                reserver: `${raw} (walk-in)`,
                reservedForUsername: null,
                profileUsername: null,
                displayName: `${raw} (walk-in)`
            };
        }
        $('#walkin-display-name').text(walkInTarget.displayName);
        updateUI();
    };

    // --- 1. Initialization ---
    const timeRanges = [
        ["09:00", "09:30"], ["09:30", "10:00"], ["10:00", "10:30"], ["10:30", "11:00"],
        ["11:00", "11:30"], ["11:30", "12:00"], ["13:00", "13:30"], ["13:30", "14:00"],
        ["14:00", "14:30"], ["14:30", "15:00"], ["15:00", "15:30"], ["15:30", "16:00"],
        ["16:00", "16:30"], ["16:30", "17:00"], ["17:00", "17:30"], ["17:30", "18:00"]
    ];
    const formatTime = t => { let [h, m] = t.split(':'); return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`; };

    timeRanges.forEach(([start, end], i) => {
        const val = `${start} - ${end}`;
        const id = `time-${i}`;
        $('#time-slots-grid').append(`<div class="time-slot-option"><input type="checkbox" id="${id}" value="${val}" class="time-slot-checkbox"><label for="${id}" class="time-slot-label">${formatTime(start)} - ${formatTime(end)}</label></div>`);
    });

    buildings.forEach(b => $bldgSelect.append(new Option(b.name, b.id)));
    
    // Set dates (Today to +6 days) using quick ISO strings
    const d = new Date(), f = date => date.toISOString().split('T')[0];
    $date.attr({ min: f(d), max: f(new Date(d.setDate(d.getDate() + 6))) }).val(f(new Date()));

    if (isTech) {
        $('#tech-context, #tech-walkin-controls').show();
        $('#walkin-display-name').text('Not set');
        $('#student-controls').hide();
        $btnReserve.text("Confirm Walk-in");
        $('#walkin-target-input').on('input blur', refreshWalkInTarget);
    } else if (!currentUser) {
        $btnReserve.text("Login to Reserve").prop('disabled', false); $('#student-controls').hide();
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
        syncReservationsFromStorage();
        $seatGrid.empty().append('<div></div>').append([1,2,3,4,5].map(c => `<div class="grid-label">${c}</div>`));
        const occupied = new Map(), selTimes = getSelectedTimes(), hasTimeFilter = selTimes.length > 0;
        
        reservations.filter(r => r.lab === $labSelect.val() && r.date === $date.val() && r.status === "Active" && (hasTimeFilter ? selTimes.includes(r.time) : true))
                    .forEach(r => occupied.set(r.seat, r));

        if (selectedSeat && occupied.has(selectedSeat)) selectedSeat = null;
        updateUI();

        ['A', 'B', 'C', 'D'].forEach(row => {
            $seatGrid.append(`<div class="grid-label">${row}</div>`);
            [1,2,3,4,5].forEach(col => {
                const id = `${row}${col}`, res = occupied.get(id), $s = $(`<div class="seat">${id}</div>`);
                
                if (res) {
                    const isOwnedByCurrentUser = !!currentUser && (
                        res.reserver === currentUser.username ||
                        res.reservedForUsername === currentUser.username
                    );
                    if (isOwnedByCurrentUser) {
                        $s.addClass('user-owned').append(`<span class="tooltip-text">Your Booking</span>`);
                    } else {
                        $s.addClass('occupied').append(res.isAnonymous ? `<span class="tooltip-text">Occupied (Anon)</span>` : `<span class="tooltip-text">Reserved by: <br><span class="tooltip-user-link">${res.reserver}</span></span>`);
                        if (!res.isAnonymous) {
                            const profileUsername = res.profileUsername || res.reservedForUsername || (
                                typeof users !== "undefined" && users.some(user => user.username === res.reserver) ? res.reserver : null
                            );
                            if (profileUsername) {
                                $s.css('cursor', 'pointer').click(() => window.location.href = `profile.html?user=${encodeURIComponent(profileUsername)}`);
                            }
                        }
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
    window.addEventListener('storage', function(e) {
        if (e.key !== STORAGE_RESERVATIONS_KEY) return;
        syncReservationsFromStorage();
        if ($labSelect.val()) {
            renderSeats();
        }
    });

    // --- 4. Submission ---
    $btnReserve.click(function() {
        if (!currentUser) {
            alert("You must log in first before reserving a slot.");
            window.location.href = "login.html";
            return;
        }
        const selTimes = getSelectedTimes();
        if (!$labSelect.val()) {
            alert("Please select a lab first.");
            return;
        }
        if (!selectedSeat) {
            alert("Please select a seat first.");
            return;
        }
        if (!selTimes.length) {
            alert("Please select at least one time slot.");
            return;
        }
        if (isTech && !walkInTarget) {
            alert("Please enter a walk-in student name first.");
            return;
        }
        
        syncReservationsFromStorage();
        if (reservations.some(r => r.lab === $labSelect.val() && r.date === $date.val() && r.seat === selectedSeat && selTimes.includes(r.time) && r.status === "Active")) {
            alert(`Oops! Seat ${selectedSeat} was just taken.`); return renderSeats();
        }

        const groupId = Date.now(), isAnon = !isTech && $('#anon-check').is(':checked');
        const requestedAt = new Date().toISOString();
        reservations.push(...selTimes.map((t, i) => ({
            id: groupId + i,
            reservationGroupId: groupId,
            lab: $labSelect.val(),
            seat: selectedSeat,
            date: $date.val(),
            time: t,
            reserver: isTech ? walkInTarget.reserver : currentUser.username,
            reservedForUsername: isTech ? walkInTarget.reservedForUsername : currentUser.username,
            profileUsername: isTech ? walkInTarget.profileUsername : currentUser.username,
            status: "Active",
            isAnonymous: isAnon,
            requestedAt
        })));
        if (typeof saveReservations === "function") {
            saveReservations();
        }

        $('#modal-ref-id').text(`#${groupId}`); $('#modal-slots-count').text(`${selTimes.length} slot(s) reserved`);
        $('#success-modal').fadeIn(300);
        
        selectedSeat = null; $('.time-slot-checkbox').prop('checked', false);
        renderSeats();
    });

    $('#btn-finish').click(() => $('#success-modal').fadeOut());

    $('#btn-user-search').click(function() {
        const query = $('#user-search-query').val();
        const foundUser = findUserByQuery(query || "");
        if (!foundUser) {
            alert("No matching user found.");
            return;
        }
        window.location.href = `profile.html?user=${encodeURIComponent(foundUser.username)}`;
    });

    $('#user-search-query').on('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            $('#btn-user-search').trigger('click');
        }
    });

    const savedLab = sessionStorage.getItem('homeSearchLab');
    const savedDate = sessionStorage.getItem('homeSearchDate');
    const savedTime = sessionStorage.getItem('homeSearchTime');

    if (savedLab && savedDate && savedTime) {
        const labObj = labs.find(l => l.id === savedLab);
        
        if (labObj) {
            // 1. Auto-select Building
            $bldgSelect.val(labObj.buildingId).trigger('change');
            
            // 2. Auto-select Lab (Reveals map)
            $labSelect.val(savedLab).trigger('change');
            
            // 3. Auto-set Date
            $date.val(savedDate).trigger('change');
            
            // 4. Auto-check the correct Time Slot
            // We use a tiny timeout to ensure the DOM has finished generating the checkboxes
            setTimeout(() => {
                $(`input.time-slot-checkbox[value="${savedTime}"]`).prop('checked', true).trigger('change');
            }, 50);
        }

        // Clean up memory so it doesn't auto-fill on standard visits
        sessionStorage.removeItem('homeSearchLab');
        sessionStorage.removeItem('homeSearchDate');
        sessionStorage.removeItem('homeSearchTime');
    }
});
