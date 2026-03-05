/* file: js/profile.js */
$(document).ready(function() {

    // --- 1. State & Setup ---
    const authUser = (typeof currentUser !== 'undefined') ? currentUser : null;
    let viewUser = null;
    try { viewUser = new URLSearchParams(window.location.search).get('user'); } catch(e) {}

    let targetUser = null;
    if (viewUser && typeof users !== 'undefined') {
        targetUser = users.find(u => u.username === viewUser) || null;
        if (!targetUser) {
            window.location.replace("index.html");
            return;
        }
    } else if (authUser) {
        targetUser = authUser;
    }
    if (!targetUser) {
        window.location.replace("index.html");
        return;
    }

    const isTech = !!authUser && authUser.role === "Lab Technician";
    const isViewMode = !authUser || targetUser.username !== authUser.username;
    const editSlotStarts = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];
    const toDisplayTime = t => {
        const [rawHour, rawMinute] = t.split(':').map(Number);
        const hour12 = rawHour % 12 || 12;
        const suffix = rawHour >= 12 ? 'PM' : 'AM';
        return `${String(hour12).padStart(2, '0')}:${String(rawMinute).padStart(2, '0')} ${suffix}`;
    };
    const groupKey = reservation => String(reservation.reservationGroupId || reservation.id);
    const parseSlotStart = timeRange => {
        const [h, m] = timeRange.split(" - ")[0].split(":").map(Number);
        return (h * 60) + m;
    };
    const toDateTime = (date, timeRange) => {
        const [start] = timeRange.split(" - ");
        return new Date(`${date}T${start}:00`);
    };
    const formatDateTime = iso => {
        const dt = new Date(iso);
        if (Number.isNaN(dt.getTime())) return "N/A";
        return dt.toLocaleString([], {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    };
    const getGroupReservations = gId => reservations.filter(r => groupKey(r) === String(gId));
    const getNoShowEligibleTime = gId => {
        const group = getGroupReservations(gId).sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return parseSlotStart(a.time) - parseSlotStart(b.time);
        });
        if (!group.length) return null;
        const firstDateTime = toDateTime(group[0].date, group[0].time);
        if (Number.isNaN(firstDateTime.getTime())) return null;
        return new Date(firstDateTime.getTime() + (10 * 60 * 1000));
    };

    function initEditTimeSlotsGrid() {
        const $grid = $('#edit-time-slots-grid');
        if (!$grid.length || $grid.children().length) return;

        editSlotStarts.forEach((start, index) => {
            const [h, m] = start.split(':').map(Number);
            const totalMinutes = (h * 60) + m + 30;
            const endHour = Math.floor(totalMinutes / 60);
            const endMinute = totalMinutes % 60;
            const end = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
            const value = `${start} - ${end}`;
            const id = `edit-time-${index}`;

            $grid.append(
                `<div class="time-slot-option">
                    <input type="checkbox" id="${id}" value="${value}" class="time-slot-checkbox">
                    <label for="${id}" class="time-slot-label">${toDisplayTime(start)} - ${toDisplayTime(end)}</label>
                </div>`
            );
        });
    }

    // --- 2. Render Functions ---
    function updateNavbar() {
        if (!authUser) {
            $('#btn-login-nav').show();
            $('#btn-logout-nav').hide();
            return;
        }
        $('#btn-login-nav').hide();
        $('#btn-logout-nav').show();
    }

    function renderProfile(user) {
        $('#user-name').text(`${user.firstName} ${user.lastName}`);
        $('#user-desc').text(user.bio || "No bio added yet.");
        $('#user-email span').text(user.email);
        
        const avatarUrl = user.profilePic || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0d5f28&color=fff`;
        $('#user-pic').attr('src', avatarUrl);
        
        if (isViewMode) {
            $('title').text(`${user.firstName}'s Profile - ArcherLabs`);
        }
    }

    updateNavbar();
    renderProfile(targetUser);
    initEditTimeSlotsGrid();

    // --- 3. Visibility Context ---
    if (isViewMode) {
        $('#btn-toggle-edit, #btn-delete-account').hide();
        $('.content-header h1').text(`Public Reservations: ${targetUser.firstName} ${targetUser.lastName}`);
        loadHistory();
    } else {
        if (isTech) {
            $('.content-header h1').text('No-Show Reservation Monitoring');
            $('.stat-label').text('Managed Reservations');
            $('#btn-delete-account').hide();
        }
        loadHistory();
    }

    // Public profile mode (visitor) is read-only.
    if (!authUser) {
        return;
    }

    // --- 4. EXPLICIT EDIT PROFILE FLOW ---
    $('#btn-toggle-edit').off('click').on('click', function() {
        const isEditing = $('#profile-edit').is(':visible');
        
        if (isEditing) {
            // Cancel Editing & Go Back
            $('#profile-edit').hide();
            $('#profile-display').show();
            $(this).html('<i class="fas fa-user-edit"></i> Edit Profile')
                    .removeClass('btn-danger').addClass('btn-outline-primary');
        } else {
            // Start Editing
            $('#profile-display').hide();
            $('#profile-edit').show();
            
            // Pre-fill inputs with current data
            $('#edit-name').val(`${currentUser.firstName} ${currentUser.lastName}`);
            $('#edit-desc').val(currentUser.bio || "");
            $('#edit-pic').val(currentUser.profilePic || "");
            
            $(this).html('<i class="fas fa-times"></i> Cancel Edit')
                    .removeClass('btn-outline-primary').addClass('btn-danger');
        }
    });

    $('#btn-save-profile').off('click').on('click', function() {
        const name = $('#edit-name').val().trim();
        if (!name) {
            alert("Name cannot be empty.");
            return;
        }
        
        const parts = name.split(' ');
        currentUser.firstName = parts[0];
        currentUser.lastName = parts.length > 1 ? parts.slice(1).join(' ') : "";
        currentUser.bio = $('#edit-desc').val();
        currentUser.profilePic = $('#edit-pic').val().trim();
        const userIndex = users.findIndex(u => u.username === currentUser.username);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...currentUser };
        }
        if (typeof saveUsers === "function") {
            saveUsers();
        }
        if (typeof getAuthSession === "function" && typeof setAuthSession === "function") {
            const auth = getAuthSession();
            setAuthSession(currentUser, !!(auth && auth.remember));
        }
        
        // Render new data and close form
        renderProfile(currentUser);
        $('#profile-edit').hide();
        $('#profile-display').show();
        $('#btn-toggle-edit').html('<i class="fas fa-user-edit"></i> Edit Profile')
                             .removeClass('btn-danger').addClass('btn-outline-primary');
    });

    // --- 5. EXPLICIT DELETE ACCOUNT FLOW ---
    $('#btn-delete-account').off('click').on('click', function() {
        $('#delete-account-modal').fadeIn(200);
    });

    $('#cancel-delete').off('click').on('click', function() {
        $('#delete-account-modal').fadeOut(200);
    });

    $('#confirm-delete').off('click').on('click', function() {
        if (currentUser.role !== "Student") {
            alert("Only student accounts can be deleted.");
            return;
        }

        for (let i = users.length - 1; i >= 0; i--) {
            if (users[i].username === currentUser.username) {
                users.splice(i, 1);
            }
        }
        for (let i = reservations.length - 1; i >= 0; i--) {
            if (
                reservations[i].reserver === currentUser.username ||
                reservations[i].reservedForUsername === currentUser.username
            ) {
                reservations.splice(i, 1);
            }
        }

        if (typeof saveUsers === "function") saveUsers();
        if (typeof saveReservations === "function") saveReservations();
        if (typeof clearAuthSession === "function") clearAuthSession();
        $('#delete-account-modal').fadeOut(200);
        currentUser = null;
        alert("Account deleted successfully.");
        window.location.replace("index.html");
    });

    // --- 6. Navbar Logout Flow ---
    $('#btn-logout-nav').off('click').on('click', function(e) {
        e.preventDefault(); 
        if (typeof clearAuthSession === "function") clearAuthSession();
        currentUser = null;
        window.location.href = "login.html";
    });

    // --- 7. History & Reservations Logic ---
    function loadHistory() {
        const $tbody = $('#history-table-body');
        $tbody.empty();
        
        if (typeof reservations === 'undefined') return;

        const myRes = isViewMode
            ? reservations.filter(r =>
                r.status === "Active" &&
                (r.reserver === targetUser.username || r.reservedForUsername === targetUser.username)
            )
            : (isTech
                ? reservations.filter(r => r.status === "Active")
                : reservations.filter(r =>
                    r.reserver === currentUser.username ||
                    r.reservedForUsername === currentUser.username
                ));
        
        // Group consecutive reservations into one visual block
        const groups = Object.values(myRes.reduce((acc, res) => {
            const id = groupKey(res);
            (acc[id] = acc[id] || []).push(res);
            return acc;
        }, {}));

        $('#total-res').text(groups.length);
        $('#res-table').toggle(groups.length > 0);
        $('#empty-state').toggle(groups.length === 0);

        groups.forEach(g => {
            const sortedGroup = [...g].sort((a, b) => parseSlotStart(a.time) - parseSlotStart(b.time));
            const r = sortedGroup[0];
            const timeDisplay = sortedGroup.length > 1
                ? `${sortedGroup[0].time.split(' - ')[0]} - ${sortedGroup[sortedGroup.length - 1].time.split(' - ')[1]}`
                : r.time;
            const owner = isTech ? `<br><small style="color:#888; font-weight: normal;">By: ${r.reserver}</small>` : "";
            const statusClass = r.status === "Active" ? "status-active" : "status-completed";
            const requestedLabel = formatDateTime(r.requestedAt);
            
            let actions = "";
            if (!isViewMode && r.status === "Active" && (isTech || r.reserver === currentUser.username || r.reservedForUsername === currentUser.username)) {
                actions += `<button class="btn-icon edit btn-edit-res" data-id="${r.id}" title="Edit"><i class="fas fa-pen"></i></button>`;
            }

            if (!isViewMode && isTech) {
                actions += `<button class="btn-icon delete btn-no-show" data-id="${r.id}" title="Remove No-show"><i class="fas fa-user-times"></i></button>`;
            } else if (!isViewMode && r.status === "Active") {
                actions += `<button class="btn-icon delete btn-delete" data-id="${r.id}" title="Cancel"><i class="fas fa-trash"></i></button>`;
            }

            $tbody.append(`<tr>
                <td><strong>${r.lab}</strong>${owner}</td>
                <td>
                    <div><strong style="font-size: 0.78rem;">Requested:</strong> <small style="color:#888; font-weight: 600;">${requestedLabel}</small></div>
                    <div style="margin-top: 4px;"><strong style="font-size: 0.78rem;">Reserved:</strong> <small style="color:#888; font-weight: 600;">${r.date} ${timeDisplay}</small></div>
                </td>
                <td><span style="background: var(--color-bg); padding: 4px 10px; border-radius: 6px; font-weight: bold;">${r.seat}</span></td>
                <td><span class="${statusClass}">${r.status}</span></td>
                <td><div class="action-buttons">${actions || '<span style="color:#ccc;">-</span>'}</div></td>
            </tr>`);
        });

        // Setup Edit Modal dropdown options if they are empty
        if (typeof labs !== 'undefined' && $('#edit-res-lab option').length === 0) {
            labs.forEach(l => $('#edit-res-lab').append(new Option(l.name, l.id)));
        }
        if ($('#edit-res-seat option').length === 0) {
            ['A','B','C','D'].forEach(r => [1,2,3,4,5].forEach(c => $('#edit-res-seat').append(new Option(`${r}${c}`, `${r}${c}`))));
        }
    }

    // --- Production-Ready Event Delegation for Table Buttons ---
    $('#history-table-body').off('click', '.btn-edit-res').on('click', '.btn-edit-res', function() {
        const id = $(this).data('id');
        const target = reservations.find(r => r.id === id);
        if (!target) return;
        const groupId = groupKey(target);
        const groupedSlots = getGroupReservations(groupId);
        
        const d = new Date(), f = x => x.toISOString().split('T')[0];
        $('#edit-res-date').attr({ min: f(d), max: f(new Date(d.setDate(d.getDate() + 6))) });
        
        $('#edit-res-id').val(target.id);
        $('#edit-res-lab').val(target.lab);
        $('#edit-res-date').val(target.date);
        $('#edit-res-seat').val(target.seat);
        $('#edit-time-slots-grid .time-slot-checkbox').prop('checked', false);
        groupedSlots.forEach(slot => {
            $('#edit-time-slots-grid .time-slot-checkbox').filter((_, el) => el.value === slot.time).prop('checked', true);
        });
        $('#edit-reservation-modal').data('editGroupId', groupId);
        $('#edit-reservation-modal').fadeIn(200);
    });

    $('#history-table-body').off('click', '.btn-no-show').on('click', '.btn-no-show', function() {
        const clickedId = $(this).data('id');
        const target = reservations.find(r => r.id === clickedId);
        if (!target) return;
        const gId = groupKey(target);
        const eligibleAt = getNoShowEligibleTime(gId);
        if (!eligibleAt) return;

        if (Date.now() < eligibleAt.getTime()) {
            alert(`No-show removal is only allowed 10 minutes after start time.\nEligible at: ${formatDateTime(eligibleAt.toISOString())}`);
            return;
        }

        if (confirm("Remove this no-show? Cancels all slots.")) removeReservationGroup(clickedId);
    });

    $('#history-table-body').off('click', '.btn-delete').on('click', '.btn-delete', function() {
        if (confirm("Cancel this reservation?")) removeReservationGroup($(this).data('id'));
    });

    function removeReservationGroup(id) {
        const target = reservations.find(r => r.id === id);
        if (!target) return;
        const gId = groupKey(target);
        for (let i = reservations.length - 1; i >= 0; i--) {
            if (groupKey(reservations[i]) === gId) {
                reservations.splice(i, 1);
            }
        }
        if (typeof saveReservations === "function") {
            saveReservations();
        }
        loadHistory();
    }

    // --- 8. Edit Modal Controls & Search ---
    $('#cancel-edit-reservation').off('click').on('click', function() {
        $('#edit-reservation-modal').fadeOut(200);
    });
    
    $('#save-edit-reservation').off('click').on('click', function() {
        const target = reservations.find(r => r.id === Number($('#edit-res-id').val()));
        if (!target) return alert("Cannot edit reservation.");
        const groupId = String($('#edit-reservation-modal').data('editGroupId') || groupKey(target));
        const selectedTimes = $('#edit-time-slots-grid .time-slot-checkbox:checked').map((_, el) => el.value).get();
        if (!selectedTimes.length) return alert("Please select at least one time slot.");

        const updatedLab = $('#edit-res-lab').val();
        const updatedDate = $('#edit-res-date').val();
        const updatedSeat = $('#edit-res-seat').val();
        if (!updatedLab || !updatedDate || !updatedSeat) {
            alert("Please complete all reservation fields.");
            return;
        }
        const numericGroupId = Number(groupId);
        const hasConflict = reservations.some(r =>
            groupKey(r) !== groupId &&
            r.status === "Active" &&
            r.lab === updatedLab &&
            r.date === updatedDate &&
            r.seat === updatedSeat &&
            selectedTimes.includes(r.time)
        );
        if (hasConflict) {
            alert("Another reservation already exists for the selected lab/date/seat/time.");
            return;
        }

        for (let i = reservations.length - 1; i >= 0; i--) {
            if (groupKey(reservations[i]) === groupId) {
                reservations.splice(i, 1);
            }
        }

        selectedTimes.forEach((time, index) => {
            reservations.push({
                id: Number.isFinite(numericGroupId) ? numericGroupId + index : Date.now() + index,
                reservationGroupId: groupId,
                lab: updatedLab,
                seat: updatedSeat,
                date: updatedDate,
                time,
                reserver: target.reserver,
                reservedForUsername: target.reservedForUsername,
                profileUsername: target.profileUsername,
                status: target.status || "Active",
                isAnonymous: !!target.isAnonymous,
                requestedAt: target.requestedAt || new Date().toISOString()
            });
        });

        if (typeof saveReservations === "function") {
            saveReservations();
        }
        loadHistory();
        $('#edit-reservation-modal').fadeOut(200);
    });

    $('#history-search').on('keyup', function() {
        const v = $(this).val().toLowerCase();
        $("#history-table-body tr").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(v) > -1);
        });
    });
});
