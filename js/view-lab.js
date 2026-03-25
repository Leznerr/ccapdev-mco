/* file: js/view-lab.js */
$(document).ready(async function() {
    const authUser = currentUser || null;
    const isTech = authUser?.role === "Lab Technician";

    let selectedSeat = null;
    let walkInTarget = null;
    let usersCache = [];
    let labsCache = [];
    let activeReservations = [];

    const $bldgSelect = $("#building-selector");
    const $labSelect = $("#lab-selector");
    const $date = $("#date-selector");
    const $seatDisplay = $("#selected-seat-display");
    const $btnReserve = $("#btn-reserve");
    const $seatGrid = $("#seat-grid");
    const $lockedCards = $("#time-card, #confirm-card");

    const timeRanges = [
        ["09:00", "09:30"], ["09:30", "10:00"], ["10:00", "10:30"], ["10:30", "11:00"],
        ["11:00", "11:30"], ["11:30", "12:00"], ["13:00", "13:30"], ["13:30", "14:00"],
        ["14:00", "14:30"], ["14:30", "15:00"], ["15:00", "15:30"], ["15:30", "16:00"],
        ["16:00", "16:30"], ["16:30", "17:00"], ["17:00", "17:30"], ["17:30", "18:00"]
    ];

    const formatTime = (value) => {
        const [hour, minute] = String(value || "").split(":").map(Number);
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
            return String(value || "");
        }
        const suffix = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
    };

    const normalizeTimeRangeLabel = (value) => {
        const cleaned = String(value || "").trim();
        if (!cleaned) return "";
        if (/\b(AM|PM)\b/i.test(cleaned)) return cleaned;
        const parts = cleaned.split(" - ");
        if (parts.length !== 2) return cleaned;
        return `${formatTime(parts[0])} - ${formatTime(parts[1])}`;
    };

    const getSelectedTimes = () => $(".time-slot-checkbox:checked").map((_, el) => el.value).get();
    const toggleLocks = (locked) => $lockedCards.toggleClass("locked-element", locked).toggleClass("unlocked-element", !locked);

    const findUserByQuery = (query) => {
        const needle = String(query || "").trim().toLowerCase();
        if (!needle) return null;

        const fullNameOf = (user) => `${user.firstName} ${user.lastName}`.toLowerCase();
        return usersCache.find((user) =>
            user.username.toLowerCase() === needle ||
            user.email.toLowerCase() === needle ||
            fullNameOf(user) === needle
        ) || usersCache.find((user) =>
            user.username.toLowerCase().includes(needle) ||
            user.email.toLowerCase().includes(needle) ||
            fullNameOf(user).includes(needle)
        ) || null;
    };

    const getSelectedLab = () => labsCache.find((lab) => lab.code === $labSelect.val()) || null;
    const canOpenPublicProfile = (username) => !!(username && usersCache.some((user) => user.username === username));

    function updateReserveButtonState() {
        $seatDisplay.text(selectedSeat || "None").toggleClass("active", !!selectedSeat);

        if (!authUser) {
            $btnReserve.prop("disabled", false);
            return;
        }

        const hasSeat = !!selectedSeat;
        const hasTimes = getSelectedTimes().length > 0;
        if (isTech) {
            $btnReserve.prop("disabled", !(hasSeat && hasTimes && walkInTarget));
            return;
        }
        $btnReserve.prop("disabled", !(hasSeat && hasTimes));
    }

    function refreshWalkInTarget() {
        if (!isTech) return;

        const raw = $("#walkin-target-input").val().trim();
        if (!raw) {
            walkInTarget = null;
            $("#walkin-display-name").text("Not set");
            updateReserveButtonState();
            return;
        }

        const matched = findUserByQuery(raw);
        if (matched) {
            walkInTarget = {
                displayName: `${matched.username} (walk-in)`,
                reservedForUsername: matched.username,
                profileUsername: matched.username
            };
        } else {
            walkInTarget = {
                displayName: `${raw} (walk-in)`,
                reservedForUsername: `${raw} (walk-in)`
            };
        }

        $("#walkin-display-name").text(walkInTarget.displayName);
        updateReserveButtonState();
    }

    async function loadActiveReservationsForSelection() {
        const labCode = $labSelect.val();
        const date = $date.val();
        if (!labCode || !date) {
            activeReservations = [];
            return;
        }
        activeReservations = await api.getReservations({
            labCode,
            date,
            status: "Active"
        });
    }

    async function renderSeats() {
        const labCode = $labSelect.val();
        if (!labCode) return;

        try {
            await loadActiveReservationsForSelection();
        } catch (error) {
            console.error(error);
            alert("Unable to load seat availability.");
            return;
        }

        $seatGrid.empty().append("<div></div>").append([1, 2, 3, 4, 5].map((col) => `<div class="grid-label">${col}</div>`));
        const selectedTimes = getSelectedTimes();
        const hasTimeFilter = selectedTimes.length > 0;

        const occupiedBySeat = new Map();
        activeReservations
            .filter((reservation) => !hasTimeFilter || selectedTimes.includes(reservation.timeSlot))
            .forEach((reservation) => {
                occupiedBySeat.set(reservation.seat, reservation);
            });

        if (selectedSeat && occupiedBySeat.has(selectedSeat)) {
            selectedSeat = null;
        }
        updateReserveButtonState();

        ["A", "B", "C", "D"].forEach((row) => {
            $seatGrid.append(`<div class="grid-label">${row}</div>`);
            [1, 2, 3, 4, 5].forEach((col) => {
                const seatId = `${row}${col}`;
                const reservation = occupiedBySeat.get(seatId);
                const $seat = $(`<div class="seat">${seatId}</div>`);

                if (reservation) {
                    const isOwnedByCurrentUser = !!authUser && (
                        reservation.reserverUsername === authUser.username ||
                        reservation.reservedForUsername === authUser.username ||
                        reservation.profileUsername === authUser.username
                    );

                    if (isOwnedByCurrentUser) {
                        $seat.addClass("user-owned").append('<span class="tooltip-text">Your Booking</span>');
                    } else {
                        $seat.addClass("occupied");
                        if (reservation.isAnonymous) {
                            $seat.append('<span class="tooltip-text">Reserved by: <br><span class="tooltip-user-link">Anonymous</span></span>');
                        } else {
                            const reservedName = reservation.reservedForUsername || reservation.reserverUsername || "Reserved";
                            $seat.append(`<span class="tooltip-text">Reserved by: <br><span class="tooltip-user-link">${reservedName}</span></span>`);
                        }

                        const profileUsername = reservation.profileUsername || reservation.reservedForUsername || null;
                        if (!reservation.isAnonymous && canOpenPublicProfile(profileUsername)) {
                            // UPDATED: Removed .html
                            $seat.css("cursor", "pointer").on("click", function() {
                                window.location.href = `/profile?user=${encodeURIComponent(profileUsername)}`;
                            });
                        }
                    }
                } else {
                    $seat
                        .attr("title", "Available")
                        .toggleClass("selected", selectedSeat === seatId)
                        .on("click", function() {
                            selectedSeat = selectedSeat === seatId ? null : seatId;
                            renderSeats();
                        });
                }

                $seatGrid.append($seat);
            });
        });
    }

    function setDateRange() {
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 6);
        const toDateInput = (value) => value.toISOString().split("T")[0];
        $date.attr({
            min: toDateInput(today),
            max: toDateInput(maxDate)
        }).val(toDateInput(new Date()));
    }

    function initializeTimeSlots() {
        $("#time-slots-grid").empty();
        timeRanges.forEach(([start, end], index) => {
            const value = `${formatTime(start)} - ${formatTime(end)}`;
            const id = `time-${index}`;
            $("#time-slots-grid").append(
                `<div class="time-slot-option">
                    <input type="checkbox" id="${id}" value="${value}" class="time-slot-checkbox">
                    <label for="${id}" class="time-slot-label">${formatTime(start)} - ${formatTime(end)}</label>
                </div>`
            );
        });
    }

    function populateBuildings(buildings) {
        $bldgSelect.empty().append('<option value="" disabled selected>Select a building...</option>');
        buildings.forEach((building) => {
            $bldgSelect.append(new Option(building.name, building.code));
        });
    }

    function populateLabs(buildingCode) {
        $labSelect.empty().append('<option value="" disabled selected>Select a lab room...</option>');
        labsCache
            .filter((lab) => lab.buildingCode === buildingCode)
            .forEach((lab) => {
                $labSelect.append(new Option(lab.name, lab.code));
            });
    }

    function initializeRoleSpecificUI() {
        if (isTech) {
            $("#tech-context, #tech-walkin-controls").show();
            $("#student-controls").hide();
            $("#walkin-display-name").text("Not set");
            $btnReserve.text("Confirm Walk-in");
            $("#walkin-target-input").on("input blur", refreshWalkInTarget);
        } else if (!authUser) {
            $("#student-controls").hide();
            $btnReserve.text("Login to Reserve").prop("disabled", false);
        }
    }

    async function initializeData() {
        try {
            const [buildings, labs, users] = await Promise.all([
                api.getBuildings(),
                api.getLabs(),
                api.getUsers()
            ]);
            labsCache = labs;
            usersCache = users;
            populateBuildings(buildings);
        } catch (error) {
            console.error(error);
            alert("Failed to load initial lab data.");
        }
    }

    function applySavedSearch() {
        const savedLab = sessionStorage.getItem("homeSearchLab");
        const savedDate = sessionStorage.getItem("homeSearchDate");
        const savedTime = sessionStorage.getItem("homeSearchTime");

        if (!savedLab || !savedDate || !savedTime) return;
        const lab = labsCache.find((entry) => entry.code === savedLab);
        if (!lab) return;

        $bldgSelect.val(lab.buildingCode).trigger("change");
        $labSelect.val(savedLab).trigger("change");
        $date.val(savedDate).trigger("change");

        setTimeout(() => {
            const normalizedTime = normalizeTimeRangeLabel(savedTime);
            const $slot = $(`input.time-slot-checkbox[value="${normalizedTime}"]`);
            if ($slot.length) {
                $slot.prop("checked", true).trigger("change");
                return;
            }
            $(`input.time-slot-checkbox[value="${savedTime}"]`).prop("checked", true).trigger("change");
        }, 60);

        sessionStorage.removeItem("homeSearchLab");
        sessionStorage.removeItem("homeSearchDate");
        sessionStorage.removeItem("homeSearchTime");
    }

    $bldgSelect.on("change", function() {
        selectedSeat = null;
        $(".time-slot-checkbox").prop("checked", false);
        updateReserveButtonState();

        populateLabs(this.value);
        $("#lab-group").fadeIn();
        $("#lab-info-box, #map-wrapper").hide();
        $("#map-placeholder").show();
        toggleLocks(true);
    });

    $labSelect.on("change", async function() {
        const lab = getSelectedLab();
        if (!lab) return;

        selectedSeat = null;
        $(".time-slot-checkbox").prop("checked", false);
        updateReserveButtonState();

        $("#lab-location").text(lab.location);
        $("#lab-capacity").text(`${lab.capacity} Seats`);
        $("#lab-info-box, #map-wrapper").fadeIn();
        $("#map-placeholder").hide();
        toggleLocks(false);
        await renderSeats();
    });

    $date.on("change", async function() {
        if ($labSelect.val()) {
            await renderSeats();
        }
    });

    $(document).on("change", ".time-slot-checkbox", async function() {
        updateReserveButtonState();
        if ($labSelect.val()) {
            await renderSeats();
        }
    });

    $btnReserve.on("click", async function() {
        if (!authUser) {
            alert("You must log in first before reserving a slot.");
            // UPDATED: Removed .html
            window.location.href = "/login";
            return;
        }

        const labCode = $labSelect.val();
        const date = $date.val();
        const slots = getSelectedTimes();
        const seat = selectedSeat;

        if (!labCode) {
            alert("Please select a lab first.");
            return;
        }
        if (!seat) {
            alert("Please select a seat first.");
            return;
        }
        if (!slots.length) {
            alert("Please select at least one time slot.");
            return;
        }
        if (isTech && !walkInTarget) {
            alert("Please enter a walk-in student name first.");
            return;
        }

        const payload = {
            labCode,
            seat,
            date,
            slots,
            reserverUsername: authUser.username,
            status: "Active",
            isAnonymous: !isTech && $("#anon-check").is(":checked")
        };

        if (isTech) {
            payload.reservedForUsername = walkInTarget.reservedForUsername;
            if (walkInTarget.profileUsername) {
                payload.profileUsername = walkInTarget.profileUsername;
            }
        } else {
            payload.reservedForUsername = authUser.username;
            payload.profileUsername = authUser.username;
        }

        try {
            const result = await api.createReservationGroup(payload);
            $("#modal-ref-id").text(`#${result.reservationGroupId}`);
            $("#modal-slots-count").text(`${result.count} slot(s) reserved`);
            $("#success-modal").fadeIn(300);

            selectedSeat = null;
            $(".time-slot-checkbox").prop("checked", false);
            await renderSeats();
        } catch (error) {
            console.error(error);
            if (error.status === 409) {
                alert(`Oops! Seat ${seat} was just taken.`);
                await renderSeats();
                return;
            }
            alert("Unable to complete reservation right now.");
        }
    });

    $("#btn-finish").on("click", function() {
        $("#success-modal").fadeOut();
    });

    $("#btn-user-search").on("click", function() {
        const query = $("#user-search-query").val();
        const foundUser = findUserByQuery(query || "");
        if (!foundUser) {
            alert("No matching user found.");
            return;
        }
        // UPDATED: Removed .html
        window.location.href = `/profile?user=${encodeURIComponent(foundUser.username)}`;
    });

    $("#user-search-query").on("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            $("#btn-user-search").trigger("click");
        }
    });

    setInterval(async function() {
        if ($labSelect.val()) {
            await renderSeats();
        }
    }, 10000);

    initializeTimeSlots();
    setDateRange();
    initializeRoleSpecificUI();
    await initializeData();
    applySavedSearch();
    updateReserveButtonState();
});
