/* file: js/profile.js */
$(document).ready(async function() {
    const authUser = currentUser || null;
    const viewUser = new URLSearchParams(window.location.search).get("user");

    let targetUser = null;
    let labsCache = [];
    let groupedReservations = [];

    const editSlotStarts = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];
    const isTech = !!authUser && authUser.role === "Lab Technician";

    if (viewUser) {
        try {
            targetUser = await api.getUser(viewUser);
        } catch (error) {
            window.location.replace("/");
            return;
        }
    } else if (authUser) {
        try {
            targetUser = await api.getUser(authUser.username);
        } catch (error) {
            window.location.replace("/");
            return;
        }
    }

    if (!targetUser) {
        window.location.replace("/");
        return;
    }

    let currentAuthUser = authUser;
    if (currentAuthUser && targetUser.username === currentAuthUser.username) {
        currentAuthUser = targetUser;
        currentUser = targetUser;
    }

    const isViewMode = !currentAuthUser || targetUser.username !== currentAuthUser.username;

    const parseTimeToMinutes = (value) => {
        const cleaned = String(value || "").trim().toUpperCase();
        if (!cleaned) return null;
        const match = cleaned.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/);
        if (!match) return null;
        let hour = Number(match[1]);
        const minute = Number(match[2]);
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
        if (minute < 0 || minute > 59) return null;
        const meridiem = match[3] || null;
        if (meridiem) {
            if (hour < 1 || hour > 12) return null;
            if (hour === 12) hour = 0;
            if (meridiem === "PM") hour += 12;
        } else if (hour < 0 || hour > 23) {
            return null;
        }
        return (hour * 60) + minute;
    };

    const formatMinutesTo12 = (minutes) => {
        const hour24 = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const suffix = hour24 >= 12 ? "PM" : "AM";
        const hour12 = hour24 % 12 || 12;
        return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
    };

    const formatTime = (value) => {
        const minutes = parseTimeToMinutes(value);
        if (!Number.isFinite(minutes)) return String(value || "");
        return formatMinutesTo12(minutes);
    };

    const formatTimeRange = (range) => {
        const [start, end] = String(range || "").split(" - ").map((item) => item.trim());
        if (!start || !end) return String(range || "");
        return `${formatTime(start)} - ${formatTime(end)}`;
    };

    const parseSlotStart = (timeRange) => {
        const [start] = String(timeRange || "").split(" - ");
        const minutes = parseTimeToMinutes(start);
        return Number.isFinite(minutes) ? minutes : 0;
    };

    const toDateTime = (date, timeRange) => {
        const [start] = String(timeRange || "").split(" - ");
        const minutes = parseTimeToMinutes(start);
        if (!Number.isFinite(minutes)) return new Date("invalid");
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return new Date(`${date}T${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`);
    };

    const formatDateTime = (iso) => {
        const dt = new Date(iso);
        if (Number.isNaN(dt.getTime())) return "N/A";
        return dt.toLocaleString([], {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    };

    const formatNoShowTime = (dateObj) => dateObj.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });

    function getNoShowEligibleTime(group) {
        const sortedGroup = [...group].sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return parseSlotStart(a.timeSlot) - parseSlotStart(b.timeSlot);
        });
        if (!sortedGroup.length) return null;
        const firstDateTime = toDateTime(sortedGroup[0].date, sortedGroup[0].timeSlot);
        if (Number.isNaN(firstDateTime.getTime())) return null;
        return new Date(firstDateTime.getTime() + (10 * 60 * 1000));
    }

    function initEditTimeSlotsGrid() {
        const $grid = $("#edit-time-slots-grid");
        if (!$grid.length || $grid.children().length) return;

        editSlotStarts.forEach((start, index) => {
            const [h, m] = start.split(":").map(Number);
            const totalMinutes = (h * 60) + m + 30;
            const endHour = Math.floor(totalMinutes / 60);
            const endMinute = totalMinutes % 60;
            const end = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
            const value = `${formatTime(start)} - ${formatTime(end)}`;
            const id = `edit-time-${index}`;

            $grid.append(
                `<div class="time-slot-option">
                    <input type="checkbox" id="${id}" value="${value}" class="time-slot-checkbox">
                    <label for="${id}" class="time-slot-label">${formatTime(start)} - ${formatTime(end)}</label>
                </div>`
            );
        });
    }

    function updateNavbar() {
        if (!currentAuthUser) {
            $("#btn-login-nav").show();
            $("#btn-logout-nav").hide();
            return;
        }
        $("#btn-login-nav").hide();
        $("#btn-logout-nav").show();
    }

    function renderProfile(user) {
        $("#user-name").text(`${user.firstName} ${user.lastName}`);
        $("#user-desc").text(user.bio || "No bio added yet.");
        $("#user-email span").text(user.email);

        const avatarUrl = user.profilePic || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0d5f28&color=fff`;
        $("#user-pic").attr("src", avatarUrl);

        if (isViewMode) {
            $("title").text(`${user.firstName}'s Profile - ArcherLabs`);
        }
    }

    async function loadLabs() {
        try {
            labsCache = await api.getLabs();
            const $labSelect = $("#edit-res-lab");
            $labSelect.empty();
            labsCache.forEach((lab) => $labSelect.append(new Option(lab.name, lab.code)));
        } catch (error) {
            console.error(error);
            labsCache = [];
        }

        const $seatSelect = $("#edit-res-seat");
        if ($seatSelect.find("option").length === 0) {
            ["A", "B", "C", "D"].forEach((row) => {
                [1, 2, 3, 4, 5].forEach((col) => {
                    $seatSelect.append(new Option(`${row}${col}`, `${row}${col}`));
                });
            });
        }
    }

    function groupReservations(reservations) {
        const grouped = {};
        reservations.forEach((reservation) => {
            const key = String(reservation.reservationGroupId || reservation.reservationId);
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(reservation);
        });
        return Object.values(grouped);
    }

    async function fetchHistoryReservations() {
        if (isViewMode) {
            return api.getReservations({
                status: "Active",
                profileUsername: targetUser.username
            });
        }
        if (isTech) {
            return api.getReservations({ status: "Active" });
        }
        return api.getReservations({
            status: "Active",
            profileUsername: currentAuthUser.username
        });
    }

    function renderHistoryTable(groups) {
        const $tbody = $("#history-table-body");
        $tbody.empty();

        $("#total-res").text(groups.length);
        $("#res-table").toggle(groups.length > 0);
        $("#empty-state").toggle(groups.length === 0);

        groups.forEach((group) => {
            const sortedGroup = [...group].sort((a, b) => parseSlotStart(a.timeSlot) - parseSlotStart(b.timeSlot));
            const first = sortedGroup[0];
            const timeDisplay = sortedGroup.length > 1
                ? formatTimeRange(`${sortedGroup[0].timeSlot.split(" - ")[0]} - ${sortedGroup[sortedGroup.length - 1].timeSlot.split(" - ")[1]}`)
                : formatTimeRange(first.timeSlot);
            const walkInLabel = (first.reservedForUsername && first.reservedForUsername !== first.reserverUsername)
                ? `Walk-in: ${first.reservedForUsername}`
                : `By: ${first.reserverUsername}`;
            const owner = isTech ? `<br><small style="color:#888; font-weight: normal;">${walkInLabel}</small>` : "";
            const statusClass = first.status === "Active" ? "status-active" : "status-completed";
            const requestedLabel = formatDateTime(first.requestedAt);

            const canEdit = !isViewMode && first.status === "Active" && (
                isTech ||
                first.reserverUsername === currentAuthUser.username ||
                first.reservedForUsername === currentAuthUser.username ||
                first.profileUsername === currentAuthUser.username
            );

            let actions = "";
            if (canEdit) {
                actions += `<button class="btn-icon edit btn-edit-res" data-group-id="${first.reservationGroupId}" title="Edit"><i class="fas fa-pen"></i></button>`;
            }
            if (!isViewMode && isTech) {
                actions += `<button class="btn-icon delete btn-no-show" data-group-id="${first.reservationGroupId}" title="Remove No-show"><i class="fas fa-user-times"></i></button>`;
            } else if (!isViewMode && first.status === "Active") {
                actions += `<button class="btn-icon delete btn-delete" data-group-id="${first.reservationGroupId}" title="Cancel"><i class="fas fa-trash"></i></button>`;
            }

            $tbody.append(`<tr>
                <td><strong>${first.labCode}</strong>${owner}</td>
                <td>
                    <div><strong style="font-size: 0.78rem;">Requested:</strong> <small style="color:#888; font-weight: 600;">${requestedLabel}</small></div>
                    <div style="margin-top: 4px;"><strong style="font-size: 0.78rem;">Reserved:</strong> <small style="color:#888; font-weight: 600;">${first.date} ${timeDisplay}</small></div>
                </td>
                <td><span style="background: var(--color-bg); padding: 4px 10px; border-radius: 6px; font-weight: bold;">${first.seat}</span></td>
                <td><span class="${statusClass}">${first.status}</span></td>
                <td><div class="action-buttons">${actions || '<span style="color:#ccc;">-</span>'}</div></td>
            </tr>`);
        });
    }

    async function loadHistory() {
        try {
            const reservations = await fetchHistoryReservations();
            groupedReservations = groupReservations(reservations);
            renderHistoryTable(groupedReservations);
        } catch (error) {
            console.error(error);
            alert("Failed to load reservation history.");
        }
    }

    async function deleteReservationGroup(groupId) {
        try {
            await api.deleteReservationGroup(groupId);
            await loadHistory();
        } catch (error) {
            console.error(error);
            alert("Unable to remove reservation.");
        }
    }

    updateNavbar();
    renderProfile(targetUser);
    initEditTimeSlotsGrid();
    await loadLabs();

    if (isViewMode) {
        $("#btn-toggle-edit, #btn-delete-account").hide();
        $(".content-header h1").text(`Public Reservations: ${targetUser.firstName} ${targetUser.lastName}`);
    } else if (isTech) {
        $(".content-header h1").text("No-Show Reservation Monitoring");
        $(".stat-label").text("Managed Reservations");
        $("#btn-delete-account").hide();
    }

    await loadHistory();

    if (!currentAuthUser) {
        return;
    }

    $("#btn-toggle-edit").off("click").on("click", function() {
        const isEditing = $("#profile-edit").is(":visible");

        if (isEditing) {
            $("#profile-edit").hide();
            $("#profile-display").show();
            $(this).html('<i class="fas fa-user-edit"></i> Edit Profile')
                .removeClass("btn-danger")
                .addClass("btn-outline-primary");
        } else {
            $("#profile-display").hide();
            $("#profile-edit").show();
            $("#edit-name").val(`${currentAuthUser.firstName} ${currentAuthUser.lastName}`);
            $("#edit-desc").val(currentAuthUser.bio || "");
            $("#edit-pic").val(currentAuthUser.profilePic || "");
            $(this).html('<i class="fas fa-times"></i> Cancel Edit')
                .removeClass("btn-outline-primary")
                .addClass("btn-danger");
        }
    });

    $("#btn-save-profile").off("click").on("click", async function() {
        const name = $("#edit-name").val().trim();
        if (!name) {
            alert("Name cannot be empty.");
            return;
        }

        const parts = name.split(" ");
        const payload = {
            firstName: parts[0],
            lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
            bio: $("#edit-desc").val(),
            profilePic: $("#edit-pic").val().trim()
        };

        try {
            const updatedUser = await api.updateUser(currentAuthUser.username, payload);
            currentAuthUser = updatedUser;
            currentUser = updatedUser;
            targetUser = updatedUser;

            const auth = getAuthSession();
            setAuthSession(updatedUser, !!(auth && auth.remember));

            renderProfile(updatedUser);
            $("#profile-edit").hide();
            $("#profile-display").show();
            $("#btn-toggle-edit").html('<i class="fas fa-user-edit"></i> Edit Profile')
                .removeClass("btn-danger")
                .addClass("btn-outline-primary");
        } catch (error) {
            console.error(error);
            alert("Unable to update profile.");
        }
    });

    $("#btn-delete-account").off("click").on("click", function() {
        $("#delete-account-modal").fadeIn(200);
    });

    $("#cancel-delete").off("click").on("click", function() {
        $("#delete-account-modal").fadeOut(200);
    });

    $("#confirm-delete").off("click").on("click", async function() {
        if (currentAuthUser.role !== "Student") {
            alert("Only student accounts can be deleted.");
            return;
        }

        try {
            const ownReservations = await api.getReservations({
                status: "Active",
                profileUsername: currentAuthUser.username
            });
            const groupIds = [...new Set(ownReservations.map((reservation) => reservation.reservationGroupId))];
            for (const groupId of groupIds) {
                await api.deleteReservationGroup(groupId);
            }

            await api.deleteUser(currentAuthUser.username);
            clearAuthSession();
            currentUser = null;
            $("#delete-account-modal").fadeOut(200);
            alert("Account deleted successfully.");
            window.location.replace("/");
        } catch (error) {
            console.error(error);
            alert("Unable to delete account.");
        }
    });

    $("#btn-logout-nav").off("click").on("click", function(event) {
        event.preventDefault();
        clearAuthSession();
        currentUser = null;
        window.location.href = "/login";
    });

    $("#history-table-body").off("click", ".btn-edit-res").on("click", ".btn-edit-res", async function() {
        const groupId = Number($(this).data("group-id"));
        let result = null;
        try {
            result = await api.getReservationGroup(groupId);
        } catch (error) {
            alert("Cannot load reservation details.");
            return;
        }

        const group = result.reservations || [];
        if (!group.length) return;
        const first = group[0];

        const today = new Date();
        const max = new Date();
        max.setDate(today.getDate() + 6);
        const toDateInput = (value) => value.toISOString().split("T")[0];
        $("#edit-res-date").attr({ min: toDateInput(today), max: toDateInput(max) });

        $("#edit-res-id").val(first.reservationId);
        $("#edit-res-lab").val(first.labCode);
        $("#edit-res-date").val(first.date);
        $("#edit-res-seat").val(first.seat);
        $("#edit-time-slots-grid .time-slot-checkbox").prop("checked", false);
        group.forEach((slot) => {
            $("#edit-time-slots-grid .time-slot-checkbox")
                .filter((_, element) => element.value === slot.timeSlot)
                .prop("checked", true);
        });

        $("#edit-reservation-modal")
            .data("editGroupId", groupId)
            .data("groupPayload", first)
            .fadeIn(200);
    });

    $("#history-table-body").off("click", ".btn-no-show").on("click", ".btn-no-show", function() {
        const groupId = Number($(this).data("group-id"));
        const targetGroup = groupedReservations.find((group) => Number(group[0].reservationGroupId) === groupId);
        if (!targetGroup) return;

        const eligibleAt = getNoShowEligibleTime(targetGroup);
        if (eligibleAt && Date.now() < eligibleAt.getTime()) {
            alert(`No-show removal is only allowed 10 minutes after start time.\nEligible at: ${formatNoShowTime(eligibleAt)}`);
            return;
        }

        if (confirm("Remove this no-show? Cancels all slots.")) {
            deleteReservationGroup(groupId);
        }
    });

    $("#history-table-body").off("click", ".btn-delete").on("click", ".btn-delete", function() {
        const groupId = Number($(this).data("group-id"));
        if (confirm("Cancel this reservation?")) {
            deleteReservationGroup(groupId);
        }
    });

    $("#cancel-edit-reservation").off("click").on("click", function() {
        $("#edit-reservation-modal").fadeOut(200);
    });

    $("#save-edit-reservation").off("click").on("click", async function() {
        const groupId = Number($("#edit-reservation-modal").data("editGroupId"));
        const basePayload = $("#edit-reservation-modal").data("groupPayload") || {};

        const selectedTimes = $("#edit-time-slots-grid .time-slot-checkbox:checked").map((_, el) => el.value).get();
        if (!selectedTimes.length) {
            alert("Please select at least one time slot.");
            return;
        }

        const labCode = $("#edit-res-lab").val();
        const date = $("#edit-res-date").val();
        const seat = $("#edit-res-seat").val();
        if (!labCode || !date || !seat) {
            alert("Please complete all reservation fields.");
            return;
        }

        try {
            const payload = {
                labCode,
                date,
                seat,
                slots: selectedTimes,
                status: basePayload.status || "Active",
                reserverUsername: basePayload.reserverUsername,
                isAnonymous: !!basePayload.isAnonymous
            };
            if (basePayload.reservedForUsername !== null && basePayload.reservedForUsername !== undefined) {
                payload.reservedForUsername = basePayload.reservedForUsername;
            }
            if (basePayload.profileUsername !== null && basePayload.profileUsername !== undefined) {
                payload.profileUsername = basePayload.profileUsername;
            }

            await api.replaceReservationGroup(groupId, payload);
            $("#edit-reservation-modal").fadeOut(200);
            await loadHistory();
        } catch (error) {
            console.error(error);
            if (error.status === 409) {
                alert("Another reservation already exists for the selected lab/date/seat/time.");
                return;
            }
            alert("Unable to update reservation.");
        }
    });

    $("#history-search").on("keyup", function() {
        const value = $(this).val().toLowerCase();
        $("#history-table-body tr").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
    });
});
