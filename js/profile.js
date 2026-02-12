/* file: js/profile.js */

$(document).ready(function() {

    // Init: guard guests
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }
    const isTechnician = currentUser.role === "Technician";

    // Navbar state (only for logged-in user)
    const updateNavbar = () => {
        const avatarUrl = currentUser.profilePic
            ? currentUser.profilePic
            : `https://ui-avatars.com/api/?name=${currentUser.firstName}+${currentUser.lastName}&background=0d5f28&color=fff`;

        $('#btn-login-nav').hide();
        $('#user-profile-dropdown').show();
        $('#nav-user-name').text(`${currentUser.firstName} ${currentUser.lastName}`);
        $('#dropdown-role').text(currentUser.role);
        $('#nav-user-pic').attr('src', avatarUrl);
    };

    updateNavbar();

    // Check for "View Profile" mode (via URL param)
    const urlParams = new URLSearchParams(window.location.search);
    const viewUser = urlParams.get('user');

    // Decide which profile to load
    let targetUser = currentUser;
    let isViewMode = false;

    if (viewUser && viewUser !== currentUser.username) {
        // We are viewing someone else's profile
        const foundUser = users.find(u => u.username === viewUser);
        if (foundUser) {
            targetUser = foundUser;
            isViewMode = true;
        }
    }

    // Load Data
    renderProfile(targetUser, isViewMode);
    
    // Only load history if viewing OWN profile
    if (!isViewMode) {
        if (isTechnician) {
            $('.content-header h1').text('No-Show Reservation Monitoring');
            $('.stat-label').text('Managed Reservations');
        }
        loadHistory();
    } else {
        $('.profile-content').hide(); // Hide history section for visitors
        $('.btn-outline-primary').hide(); // Hide Edit button
        $('.btn-text-danger').hide(); // Hide Delete button
    }

    // ==========================================
    // 2. PROFILE RENDERING
    // ==========================================
    function renderProfile(user, viewOnly) {
        $('#user-name').text(`${user.firstName} ${user.lastName}`);
        $('#user-desc').text(user.bio || "No bio added yet.");
        $('#user-email').text(user.email);
        
        // Use profilePic or fallback generator
        const avatarUrl = user.profilePic ? user.profilePic : 
            `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0D8ABC&color=fff`;
        
        $('#user-pic').attr('src', avatarUrl);
        
        // Adjust Header Title for View Mode
        if(viewOnly) {
            $('title').text(`${user.firstName}'s Profile - AnimoLabs`);
        }
    }

    // Edit profile toggles
    $('#btn-toggle-edit').click(function() {
        const isEditing = $('#profile-edit').is(':visible');

        if (isEditing) {
            // Cancel / Switch to View
            $('#profile-display').show();
            $('#profile-edit').hide();
            $(this).html('<i class="fas fa-user-edit"></i> Edit Profile');
            $(this).removeClass('btn-danger').addClass('btn-outline-primary');
        } else {
            // Switch to Edit
            $('#profile-display').hide();
            $('#profile-edit').show();
            
            // Pre-fill inputs
            $('#edit-name').val(`${currentUser.firstName} ${currentUser.lastName}`);
            $('#edit-desc').val(currentUser.bio);
            
            $(this).html('<i class="fas fa-times"></i> Cancel');
            $(this).removeClass('btn-outline-primary').addClass('btn-danger');
        }
    });

    $('#btn-save-profile').click(function() {
        const fullName = $('#edit-name').val();
        const newBio = $('#edit-desc').val();

        if(fullName.trim() === "") {
            alert("Name cannot be empty.");
            return;
        }

        // Simple First/Last name split
        const names = fullName.split(' ');
        currentUser.firstName = names[0];
        currentUser.lastName = names.length > 1 ? names.slice(1).join(' ') : "";
        currentUser.bio = newBio;

        // Re-render & Close Edit
        renderProfile(currentUser, false);
        $('#btn-toggle-edit').click(); 
    });

    function getReservationStartDateTime(res) {
        if (!res || !res.date || !res.time) return null;

        const timeStart = res.time.split(' - ')[0];
        if (!timeStart) return null;

        const [year, month, day] = res.date.split('-').map(Number);
        const [hour, minute] = timeStart.split(':').map(Number);

        if ([year, month, day, hour, minute].some(Number.isNaN)) return null;
        return new Date(year, month - 1, day, hour, minute, 0, 0);
    }

    function canTechnicianRemoveNoShow(res) {
        if (!res || res.status !== "Active") return false;
        const start = getReservationStartDateTime(res);
        if (!start) return false;

        const now = new Date();
        const end = new Date(start.getTime() + (10 * 60 * 1000));
        return now >= start && now <= end;
    }

    function removeReservationGroupById(id, requireNoShowWindow, confirmMessage) {
        const target = reservations.find(r => r.id === id);
        if (!target) return;

        if (requireNoShowWindow && !canTechnicianRemoveNoShow(target)) {
            alert("This reservation is outside the 10-minute no-show removal window.");
            loadHistory();
            return;
        }

        if (!confirm(confirmMessage)) return;

        const hasGroup = target.reservationGroupId !== undefined && target.reservationGroupId !== null;

        for (let i = reservations.length - 1; i >= 0; i--) {
            const sameReservation = hasGroup
                ? reservations[i].reservationGroupId === target.reservationGroupId
                : reservations[i].id === target.id;

            if (sameReservation) reservations.splice(i, 1);
        }

        loadHistory();
    }

    // History table for own reservations / technician monitoring
    function loadHistory() {
        const tableBody = $('#history-table-body');
        const emptyState = $('#empty-state');
        const tableElement = $('#res-table');

        tableBody.empty();

        const myRes = isTechnician
            ? reservations.filter(r => r.status === "Active")
            : reservations.filter(r => r.reserver === currentUser.username);
        
        // Update Counter
        $('#total-res').text(myRes.length);

        if (myRes.length === 0) { // wala pang bookings
            tableElement.hide();
            emptyState.fadeIn(); 
        } else {
            emptyState.hide();
            tableElement.show();

            myRes.forEach(res => {
                const statusClass = res.status === "Active" ? "status-active" : "status-completed";
                const ownerLabel = isTechnician
                    ? `<br><small style="color:#888">By: ${res.reserver}</small>`
                    : "";

                let actionCell = `<span style="color:#ccc;">-</span>`;

                if (isTechnician) {
                    actionCell = canTechnicianRemoveNoShow(res)
                        ? `<button class="btn-delete btn-no-show" data-id="${res.id}" title="Remove No-show (cancel whole reservation)"><i class="fas fa-user-times"></i></button>`
                        : `<span style="color:#999;" title="Only available within 10 minutes after start time.">Not eligible</span>`;
                } else if (res.status === "Active") {
                    actionCell = `<button class="btn-delete" data-id="${res.id}" title="Cancel Reservation"><i class="fas fa-trash"></i></button>`;
                }

                const row = `
                    <tr id="row-${res.id}">
                        <td><strong>${res.lab}</strong>${ownerLabel}</td>
                        <td>
                            ${res.date}<br>
                            <small style="color:#888">${res.time}</small>
                        </td>
                        <td>${res.seat}</td>
                        <td><span class="${statusClass}">${res.status}</span></td>
                        <td>${actionCell}</td>
                    </tr>
                `;
                tableBody.append(row);
            });

            if (isTechnician) {
                $('.btn-no-show').off('click').on('click', function() {
                    const id = $(this).data('id');
                    removeReservationGroupById(
                        id,
                        true,
                        "Remove this no-show reservation? This will cancel all slots under the same reservation."
                    );
                });
            } else {
                // Bind student cancel action
                $('.btn-delete').off('click').on('click', function() {
                    const id = $(this).data('id');
                    deleteReservation(id);
                });
            }
        }
    }

    function deleteReservation(id) {
        removeReservationGroupById(
            id,
            false,
            "Are you sure you want to cancel this reservation?"
        );
    }

    // Quick search filter
    $('#history-search').on('keyup', function() {
        const value = $(this).val().toLowerCase();
        $("#history-table-body tr").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
    });

    // Delete account modal flow
    $('#btn-delete-account').click(() => $('#delete-account-modal').fadeIn(200));
    $('#cancel-delete').click(() => $('#delete-account-modal').fadeOut(200));

    $('#confirm-delete').click(function() {
        alert("Account deleted. Redirecting to home...");
        // In a real app, API call here.
        // For mock, simply logout:
        window.location.href = "index.html";
    });

});
