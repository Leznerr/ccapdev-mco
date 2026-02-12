/* file: js/view-lab.js */

$(document).ready(function() {

    // ==========================================
    // 1. INITIALIZATION & CONFIGURATION
    // ==========================================
    
    const buildingSelect = $('#building-selector');
    const labSelect = $('#lab-selector');
    const dateInput = $('#date-selector');
    const timeSelect = $('#time-selector');
    
    // 1.1 Populate Building Dropdown from data.js
    buildingSelect.html('<option value="" disabled selected>Choose a Building...</option>');
    buildings.forEach(b => {
        buildingSelect.append(`<option value="${b.id}">${b.name}</option>`);
    });

    // 1.2 Apply Date Constraints (Today to +7 Days)
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 6); 

    // Helper to format date as YYYY-MM-DD for HTML input
    const formatDate = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    dateInput.attr('min', formatDate(today));
    dateInput.attr('max', formatDate(nextWeek));
    dateInput.val(formatDate(today)); 

    // 1.3 Check User Role & Setup Context
    let walkInName = "Walk-in Student"; // Default generic name

    if (typeof currentUser !== 'undefined' && currentUser) {
        if (currentUser.role === "Technician") {
            // TECHNICIAN MODE
            // Check if a specific name was passed from Admin Dashboard (Session Storage)
            if(sessionStorage.getItem('currentWalkIn')) {
                walkInName = sessionStorage.getItem('currentWalkIn');
            }
            
            // Show Technician Controls
            $('#tech-context').show(); 
            $('#walkin-display-name').text(walkInName);
            $('#student-controls').hide();            
            $('#btn-reserve').text("Confirm Walk-in Reservation").css("background-color", "#e67e22"); 
        }
    } else {
        // GUEST MODE (Strict Restriction)
        $('#btn-reserve').text("Login to Reserve").prop('disabled', true).css('background-color', '#adb5bd');
        $('.checkbox-group').hide();
    }


    // ==========================================
    // 2. DROPDOWN EVENTS
    // ==========================================

    // Event: Building Selected -> Populate Labs
    buildingSelect.change(function() {
        const selectedBldgId = $(this).val();
        const filteredLabs = labs.filter(l => l.buildingId === selectedBldgId);
        resetSelection();
        
        labSelect.html('<option value="" disabled selected>Choose a Lab...</option>');
        filteredLabs.forEach(l => {
            labSelect.append(`<option value="${l.id}">${l.name}</option>`);
        });

        // UI Updates
        $('#lab-group').fadeIn();
        $('#lab-info-box').hide();
        $('#date-time-card').css({ 'opacity': '0.5', 'pointer-events': 'none' });
        $('#map-placeholder').show();
        $('#map-wrapper').hide();
    });

    // Event: Lab Selected -> Show Details & Map
    labSelect.change(function() {
        const selectedLabId = $(this).val();
        const lab = labs.find(l => l.id === selectedLabId);

        if (lab) {
            resetSelection();
            $('#lab-location').text(lab.location);
            $('#lab-capacity').text(`${lab.capacity} Seats`);
            $('#lab-info-box').fadeIn();
            
            // Unlock Date/Time Selection
            $('#date-time-card').css({ 'opacity': '1', 'pointer-events': 'auto' });
            
            // Switch Map View
            $('#map-placeholder').hide();
            $('#map-wrapper').fadeIn();
            
            renderSeats();
        }
    });

    // Event: Date or Time Changed -> Refresh Map
    $('#date-selector, #time-selector').change(function(){
        resetSelection();
        renderSeats();
    });


    // ==========================================
    // 3. SEAT MAP RENDERING (Grid System)
    // ==========================================
    
    let selectedSeats = [];

    function updateSelectionDisplay() {
        if (selectedSeats.length === 0) {
            $('#selected-seat-display').text('Select Seat(s)').removeClass('active');
            if (currentUser) $('#btn-reserve').prop('disabled', true);
            return;
        }

        $('#selected-seat-display')
            .text(`Selected (${selectedSeats.length}): ${selectedSeats.join(', ')}`)
            .addClass('active');
        if (currentUser) $('#btn-reserve').prop('disabled', false);
    }

    function renderSeats() {
        const grid = $('#seat-grid');
        grid.empty(); 

        const currentLabId = labSelect.val();
        const date = dateInput.val();
        const time = timeSelect.val();
        const matchingReservations = reservations.filter(r =>
            r.lab === currentLabId &&
            r.date === date &&
            r.time === time &&
            r.status === "Active"
        );
        const occupiedSeatSet = new Set(matchingReservations.map(r => r.seat));

        // If any selected seat was taken during refresh, auto-remove it from selection.
        selectedSeats = selectedSeats.filter(seatId => !occupiedSeatSet.has(seatId));
        updateSelectionDisplay();

        // Grid Configuration: 5 Columns x 4 Rows
        const rows = ['A', 'B', 'C', 'D'];
        const cols = [1, 2, 3, 4, 5];

        // 3.1 Render Header Row (1, 2, 3, 4, 5)
        grid.append('<div></div>'); // Empty top-left corner
        cols.forEach(col => grid.append(`<div class="grid-label">${col}</div>`));

        // 3.2 Render Rows (A, B, C, D)
        rows.forEach(row => {
            grid.append(`<div class="grid-label">${row}</div>`); // Row Label

            cols.forEach(col => {
                const seatId = `${row}${col}`;
                
                // Check Global Reservations Array (from data.js)
                const res = matchingReservations.find(r => r.seat === seatId);

                const seatEl = $('<div></div>').addClass('seat').text(seatId);
                
                // === SEAT STATE LOGIC ===
                if (res) {
                    // --- OCCUPIED ---
                    if (currentUser && res.reserver === currentUser.username) {
                        // Current User's Booking
                        seatEl.addClass('user-owned');
                        seatEl.append(`<span class="tooltip-text">Your Booking</span>`);
                    } else {
                        // Other User's Booking
                        seatEl.addClass('occupied');
                        
                        if (res.isAnonymous) {
                            seatEl.append(`<span class="tooltip-text">Occupied (Anonymous)</span>`);
                        } else {
                            // SHOW NAME as explicit clickable link (spec requirement)
                            const profileUrl = `profile.html?user=${encodeURIComponent(res.reserver)}`;
                            seatEl.append(
                                `<span class="tooltip-text">Reserved by: <a class="tooltip-user-link" href="${profileUrl}">${res.reserver}</a><small>(Click username to view profile)</small></span>`
                            );
                        }
                    }
                } else {
                    // --- AVAILABLE ---
                    seatEl.attr('title', 'Available');
                    if (selectedSeats.includes(seatId)) seatEl.addClass('selected');
                    seatEl.click(function() {
                        if (selectedSeats.includes(seatId)) {
                            selectedSeats = selectedSeats.filter(id => id !== seatId);
                            $(this).removeClass('selected');
                        } else {
                            selectedSeats.push(seatId);
                            $(this).addClass('selected');
                        }

                        updateSelectionDisplay();
                    });
                }
                grid.append(seatEl);
            });
        });
    }

    function resetSelection() {
        selectedSeats = [];
        $('#selected-seat-display').text('Select Seat(s)').removeClass('active');
        if (currentUser) $('#btn-reserve').prop('disabled', true);
    }


    // ==========================================
    // 4. AUTO-REFRESH (Real-Time Feature)
    // ==========================================
    // Refreshes the grid every 10 seconds to check for new bookings
    setInterval(function() {
        if (labSelect.val()) { 
            console.log("Auto-refreshing seat availability...");
            renderSeats();
        }
    }, 10000); 


    // ==========================================
    // 5. RESERVATION ACTION
    // ==========================================
    
    $('#btn-reserve').click(function() {
        // Double check login
        if (!currentUser) {
            alert("Please login to reserve.");
            window.location.href = "login.html";
            return;
        }

        if (selectedSeats.length === 0) {
            alert("Please select at least one seat.");
            return;
        }

        // Prepare Reservation Data
        let finalReserver = currentUser.username;
        let isAnon = false;

        if (currentUser.role === "Technician") {
            finalReserver = walkInName; 
            isAnon = false; // Walk-ins cannot be anonymous
        } else {
            finalReserver = currentUser.username;
            isAnon = $('#anon-check').is(':checked');
        }

        // Final conflict check right before save (prevents stale UI bookings).
        const labId = labSelect.val();
        const selectedDate = dateInput.val();
        const selectedTime = timeSelect.val();
        const conflictingSeats = selectedSeats.filter(seatId =>
            reservations.some(r =>
                r.lab === labId &&
                r.date === selectedDate &&
                r.time === selectedTime &&
                r.seat === seatId &&
                r.status === "Active"
            )
        );

        if (conflictingSeats.length > 0) {
            alert(`These seats are no longer available: ${conflictingSeats.join(', ')}. Please select again.`);
            selectedSeats = selectedSeats.filter(seatId => !conflictingSeats.includes(seatId));
            updateSelectionDisplay();
            renderSeats();
            return;
        }

        // One booking can include multiple slots; group them under one reservation id.
        const reservationGroupId = Date.now();
        const newReservations = selectedSeats.map((seatId, index) => ({
            id: reservationGroupId + index,
            reservationGroupId,
            lab: labId,
            seat: seatId,
            date: selectedDate,
            time: selectedTime,
            requestDateTime: new Date().toISOString(),
            reserver: finalReserver,
            status: "Active",
            isAnonymous: isAnon
        }));

        // Save to Mock Database (Array in data.js)
        reservations.push(...newReservations);

        // UI Feedback
        showSuccessModal(reservationGroupId, newReservations.length);
        resetSelection();
        renderSeats(); // Immediately refresh grid to show "User Owned" status
    });

    // Display Success Modal with Reference ID 
    function showSuccessModal(referenceId, slotCount) {

        
        // Inject Reference ID into Modal Text
        // Uses inline style for immediate visibility
        $('.modal-content p').html(`Reservation Reference:<br><strong style="font-size: 1.5rem; color:#387C44;">#${referenceId}</strong><br><small>${slotCount} slot(s) reserved</small>`);
        
        // Show Modal
        $('#success-modal').fadeIn(300);
    }

    // Close Modal Handler
    $('#btn-finish').click(function() {
        $('#success-modal').fadeOut();
        resetSelection(); // Reset selection state after finishing
        renderSeats();    // One last re-render to ensure clean state
    });

});
