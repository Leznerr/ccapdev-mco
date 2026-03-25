/* file: js/admin.js */
(async function() {
    if (!currentUser) {
        window.location.replace("/");
        return;
    }

    if (currentUser.role !== "Lab Technician") {
        window.location.replace("/");
        return;
    }

    let labsCache = [];
    let buildingsCache = [];
    let groupedReservations = [];

    const modal = document.getElementById("modal");
    const modalCancel = document.getElementById("modal-cancel");
    const modalConfirm = document.getElementById("modal-confirm");

    const statTotalReservations = document.getElementById("stat-total-reservations");
    const statMostUsedLab = document.getElementById("stat-most-used-lab");
    const statAvailableSeats = document.getElementById("stat-available-seats");
    const statNoShows = document.getElementById("stat-no-shows");

    const labBuildingSelect = document.getElementById("lab-building");
    const labRoomSelect = document.getElementById("lab-room");
    const labTimeSelect = document.getElementById("lab-time");

    let pendingGroupId = null;

    const timeRanges = [
        ["09:00", "09:30"], ["09:30", "10:00"], ["10:00", "10:30"], ["10:30", "11:00"],
        ["11:00", "11:30"], ["11:30", "12:00"], ["13:00", "13:30"], ["13:30", "14:00"],
        ["14:00", "14:30"], ["14:30", "15:00"], ["15:00", "15:30"], ["15:30", "16:00"],
        ["16:00", "16:30"], ["16:30", "17:00"], ["17:00", "17:30"], ["17:30", "18:00"]
    ];

    const parseTimeToMinutes = (value) => {
        const cleaned = String(value || "").trim().toUpperCase();
        if (!cleaned) return null;
        const match = cleaned.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/);
        if (!match) return null;
        let hour = Number(match[1]);
        const minute = Number(match[2]);
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
        const meridiem = match[3] || null;
        if (meridiem) {
            if (hour === 12) hour = 0;
            if (meridiem === "PM") hour += 12;
        }
        return (hour * 60) + minute;
    };

    const formatTime = (value) => {
        const minutes = parseTimeToMinutes(value);
        if (!Number.isFinite(minutes)) return String(value || "");
        const hour24 = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const suffix = hour24 >= 12 ? "PM" : "AM";
        const hour12 = hour24 % 12 || 12;
        return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
    };

    const formatTimeRange = (range) => {
        const [start, end] = String(range || "").split(" - ").map((item) => item.trim());
        if (!start || !end) return String(range || "");
        return `${formatTime(start)} - ${formatTime(end)}`;
    };

    const rangeToKey = (range) => {
        const [start, end] = String(range || "").split(" - ").map((item) => item.trim());
        const startMin = parseTimeToMinutes(start);
        const endMin = parseTimeToMinutes(end);
        if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) return null;
        return `${startMin}-${endMin}`;
    };

    const parseSlotStartMinutes = (timeRange) => {
        const [start] = String(timeRange || "").split(" - ");
        const minutes = parseTimeToMinutes(start);
        return Number.isFinite(minutes) ? minutes : 0;
    };

    const parseSlotDateTime = (date, timeRange) => {
        const [start] = String(timeRange || "").split(" - ");
        const minutes = parseTimeToMinutes(start);
        if (!Number.isFinite(minutes)) return new Date("invalid");
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return new Date(`${date}T${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`);
    };

    const formatNoShowTime = (dateObj) => dateObj.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });

    const getNoShowEligibleAt = (group) => {
        const sorted = [...group].sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return parseSlotStartMinutes(a.timeSlot) - parseSlotStartMinutes(b.timeSlot);
        });
        if (!sorted.length) return null;
        const startDateTime = parseSlotDateTime(sorted[0].date, sorted[0].timeSlot);
        if (Number.isNaN(startDateTime.getTime())) return null;
        return new Date(startDateTime.getTime() + (10 * 60 * 1000));
    };

    const getTimeRangeDisplay = (group) => {
        const sorted = [...group].sort((a, b) => parseSlotStartMinutes(a.timeSlot) - parseSlotStartMinutes(b.timeSlot));
        if (!sorted.length) return "N/A";
        if (sorted.length === 1) return formatTimeRange(sorted[0].timeSlot);
        const start = sorted[0].timeSlot.split(" - ")[0];
        const end = sorted[sorted.length - 1].timeSlot.split(" - ")[1];
        return formatTimeRange(`${start} - ${end}`);
    };

    const getBuildingName = (labCode) => {
        const lab = labsCache.find((entry) => entry.code === labCode) || null;
        if (!lab) return labCode || "N/A";
        const building = buildingsCache.find((entry) => entry.code === lab.buildingCode) || null;
        return building ? building.name : (labCode || "N/A");
    };

    const getLabDisplayName = (labCode) => {
        const lab = labsCache.find((entry) => entry.code === labCode) || null;
        return lab ? lab.name : (labCode || "N/A");
    };

    const formatDateInput = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };

    const setStatValue = (element, value) => {
        if (element) element.textContent = value;
    };

    const getCurrentSlotRange = () => {
        const now = new Date();
        const minutes = now.getHours() * 60 + now.getMinutes();
        for (const [start, end] of timeRanges) {
            const startMin = parseTimeToMinutes(start);
            const endMin = parseTimeToMinutes(end);
            if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) continue;
            if (minutes >= startMin && minutes < endMin) {
                return `${start} - ${end}`;
            }
        }
        return null;
    };

    function groupReservations(reservations) {
        const grouped = {};
        reservations.forEach((reservation) => {
            const key = String(reservation.reservationGroupId || reservation.reservationId);
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(reservation);
        });
        return Object.values(grouped);
    }

    async function loadLookupData() {
        try {
            const [labs, buildings] = await Promise.all([
                api.getLabs(),
                api.getBuildings()
            ]);
            labsCache = labs;
            buildingsCache = buildings;
        } catch (error) {
            console.error(error);
            labsCache = [];
            buildingsCache = [];
        }
    }

    async function loadActiveReservations() {
        try {
            const reservations = await api.getReservations({ status: "Active" });
            groupedReservations = groupReservations(reservations);
            renderActiveReservations();
        } catch (error) {
            console.error(error);
            alert("Unable to load active reservations.");
        }
    }

    async function loadDashboardStats() {
        const today = formatDateInput(new Date());
        try {
            const [todayReservations, activeTodayReservations] = await Promise.all([
                api.getReservations({ date: today }),
                api.getReservations({ date: today, status: "Active" })
            ]);

            const todayGroupIds = new Set(
                todayReservations.map((reservation) =>
                    String(reservation.reservationGroupId || reservation.reservationId || "")
                )
            );
            setStatValue(statTotalReservations, `${todayGroupIds.size} bookings`);

            if (!todayReservations.length) {
                setStatValue(statMostUsedLab, "N/A");
            } else {
                const counts = todayReservations.reduce((acc, reservation) => {
                    const code = reservation.labCode || "N/A";
                    acc[code] = (acc[code] || 0) + 1;
                    return acc;
                }, {});
                const mostUsedCode = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
                setStatValue(statMostUsedLab, getLabDisplayName(mostUsedCode));
            }

            const currentSlot = getCurrentSlotRange();
            const totalCapacity = labsCache.reduce((sum, lab) => sum + Number(lab.capacity || 0), 0);
            if (!currentSlot) {
                setStatValue(statAvailableSeats, `${totalCapacity} seats`);
            } else {
                const currentKey = rangeToKey(currentSlot);
                const occupiedNow = activeTodayReservations.filter(
                    (reservation) => rangeToKey(reservation.timeSlot) === currentKey
                );
                const availableSeats = Math.max(totalCapacity - occupiedNow.length, 0);
                setStatValue(statAvailableSeats, `${availableSeats} seats`);
            }

            const groupedToday = groupReservations(activeTodayReservations);
            const now = Date.now();
            const noShowCount = groupedToday.filter((group) => {
                const eligibleAt = getNoShowEligibleAt(group);
                return eligibleAt && eligibleAt.getTime() <= now;
            }).length;
            setStatValue(statNoShows, `${noShowCount} students`);
        } catch (error) {
            console.error(error);
            setStatValue(statTotalReservations, "--");
            setStatValue(statMostUsedLab, "--");
            setStatValue(statAvailableSeats, "--");
            setStatValue(statNoShows, "--");
        }
    }

    function renderActiveReservations() {
        const tbody = document.getElementById("reservations-tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!groupedReservations.length) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#6c757d;">No active reservations.</td></tr>`;
            return;
        }

        groupedReservations
            .sort((a, b) => {
                const aFirst = [...a].sort((x, y) => parseSlotStartMinutes(x.timeSlot) - parseSlotStartMinutes(y.timeSlot))[0];
                const bFirst = [...b].sort((x, y) => parseSlotStartMinutes(x.timeSlot) - parseSlotStartMinutes(y.timeSlot))[0];
                if (aFirst.date !== bFirst.date) return aFirst.date.localeCompare(bFirst.date);
                return parseSlotStartMinutes(aFirst.timeSlot) - parseSlotStartMinutes(bFirst.timeSlot);
            })
            .forEach((group) => {
                const first = group[0];
                const groupId = String(first.reservationGroupId);
                const displayName = first.isAnonymous ? "Anonymous User" : (first.reservedForUsername || first.reserverUsername);

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${displayName}</td>
                    <td>#${groupId}</td>
                    <td>${getBuildingName(first.labCode)}</td>
                    <td>${first.labCode}</td>
                    <td>${first.seat}</td>
                    <td>${first.date}</td>
                    <td>${getTimeRangeDisplay(group)}</td>
                    <td>${first.status}</td>
                    <td><button class="remove-btn" data-group-id="${groupId}">Remove</button></td>
                `;
                tbody.appendChild(tr);
            });
    }

    function initializeDateInputRange() {
        const dateInput = document.getElementById("lab-date");
        if (!dateInput) return;

        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 6);

        dateInput.setAttribute("min", formatDateInput(today));
        dateInput.setAttribute("max", formatDateInput(nextWeek));
        dateInput.value = formatDateInput(today);
    }

    function populateBuildingOptions() {
        if (!labBuildingSelect) return;
        labBuildingSelect.innerHTML = `<option value="" disabled selected>Choose a Building...</option>`;
        buildingsCache.forEach((building) => {
            const option = document.createElement("option");
            option.value = building.code;
            option.textContent = building.name;
            labBuildingSelect.appendChild(option);
        });
    }

    function populateLabOptions(buildingCode) {
        if (!labRoomSelect) return;
        labRoomSelect.innerHTML = `<option value="" disabled selected>Choose a Lab...</option>`;
        labsCache
            .filter((lab) => lab.buildingCode === buildingCode)
            .forEach((lab) => {
                const option = document.createElement("option");
                option.value = lab.code;
                option.textContent = lab.name;
                labRoomSelect.appendChild(option);
            });
    }

    function populateTimeOptions() {
        if (!labTimeSelect) return;
        labTimeSelect.innerHTML = `<option value="" disabled selected>Choose a Time...</option>`;
        timeRanges.forEach(([start, end]) => {
            const option = document.createElement("option");
            const label = `${formatTime(start)} - ${formatTime(end)}`;
            option.value = label;
            option.textContent = label;
            labTimeSelect.appendChild(option);
        });
    }

    function initializeAvailabilityForm() {
        const labForm = document.getElementById("lab-form");
        if (!labForm) return;

        if (labBuildingSelect && !labBuildingSelect.dataset.listenerAttached) {
            labBuildingSelect.addEventListener("change", function() {
                populateLabOptions(this.value);
            });
            labBuildingSelect.dataset.listenerAttached = "true";
        }

        labForm.addEventListener("submit", async function(event) {
            event.preventDefault();

            const room = labRoomSelect ? labRoomSelect.value : "";
            const date = document.getElementById("lab-date").value;
            const time = labTimeSelect ? labTimeSelect.value : "";

            if (!room || !date || !time) {
                alert("Please fill in all fields");
                return;
            }

            try {
                const availability = await api.getLabAvailability(room, date, time);
                document.getElementById("total-seats").textContent = availability.totalSeats;
                document.getElementById("occupied-seats").textContent = availability.occupiedSeats;
                document.getElementById("remaining-seats").textContent = availability.availableSeats;
                document.getElementById("lab-info").style.display = "block";
            } catch (error) {
                console.error(error);
                alert("Unable to check laboratory availability.");
            }
        });
    }

    document.addEventListener("click", function(event) {
        const removeBtn = event.target.closest(".remove-btn");
        if (removeBtn && modal) {
            pendingGroupId = String(removeBtn.dataset.groupId || "");
            modal.style.display = "flex";
        }
    });

    if (modalCancel && modal) {
        modalCancel.addEventListener("click", function() {
            modal.style.display = "none";
            pendingGroupId = null;
        });
    }

    if (modalConfirm && modal) {
        modalConfirm.addEventListener("click", async function() {
            if (!pendingGroupId) {
                modal.style.display = "none";
                return;
            }

            const targetGroup = groupedReservations.find((group) => String(group[0].reservationGroupId) === pendingGroupId) || null;
            if (!targetGroup) {
                modal.style.display = "none";
                pendingGroupId = null;
                await loadActiveReservations();
                return;
            }

            const eligibleAt = getNoShowEligibleAt(targetGroup);
            if (eligibleAt && Date.now() < eligibleAt.getTime()) {
                alert(`No-show removal is only allowed 10 minutes after start time.\nEligible at: ${formatNoShowTime(eligibleAt)}`);
                return;
            }

            try {
                await api.deleteReservationGroup(pendingGroupId);
                await loadActiveReservations();
                modal.style.display = "none";
                pendingGroupId = null;
            } catch (error) {
                console.error(error);
                alert("Unable to remove reservation.");
            }
        });
    }

    if (window && modal) {
        window.addEventListener("click", function(event) {
            if (event.target === modal) {
                modal.style.display = "none";
                pendingGroupId = null;
            }
        });
    }

    await loadLookupData();
    populateBuildingOptions();
    populateTimeOptions();
    initializeDateInputRange();
    initializeAvailabilityForm();
    await loadDashboardStats();
    await loadActiveReservations();

    setInterval(async function() {
        await loadActiveReservations();
        await loadDashboardStats();
    }, 10000);
})();
