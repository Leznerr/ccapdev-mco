/* file: js/profile.js */
$(document).ready(function() {

    // Prevent access if not logged in
    if (typeof currentUser === 'undefined' || !currentUser) {
        window.location.href = "login.html";
        return;
    }

    // --- 1. State & Setup ---
    const isTech = currentUser.role === "Technician";
    
    // Safely figure out if we are viewing someone else's profile
    let viewUser = null;
    try { viewUser = new URLSearchParams(window.location.search).get('user'); } catch(e) {}
    
    let targetUser = currentUser;
    if (viewUser && viewUser !== currentUser.username && typeof users !== 'undefined') {
        const foundUser = users.find(u => u.username === viewUser);
        if (foundUser) targetUser = foundUser;
    }
    const isViewMode = targetUser.username !== currentUser.username;

    // --- 2. Render Functions ---
    function updateNavbar() {
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
            $('title').text(`${user.firstName}'s Profile - AnimoLabs`);
        }
    }

    updateNavbar();
    renderProfile(targetUser);

    // --- 3. Visibility Context ---
    if (isViewMode) {
        $('#history, #btn-toggle-edit, #btn-delete-account').hide();
    } else {
        if (isTech) {
            $('.content-header h1').text('No-Show Reservation Monitoring');
            $('.stat-label').text('Managed Reservations');
        }
        loadHistory();
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
        alert("Account deleted successfully."); 
        window.location.href = "login.html"; // Log them out natively
    });

    // --- 6. Navbar Logout Flow ---
    $('#btn-logout-nav').off('click').on('click', function(e) {
        e.preventDefault(); 
        currentUser = null; 
        window.location.href = "login.html";
    });

    // --- 7. History & Reservations Logic ---
    function loadHistory() {
        const $tbody = $('#history-table-body');
        $tbody.empty();
        
        if (typeof reservations === 'undefined') return;

        const myRes = isTech ? reservations.filter(r => r.status === "Active") : reservations.filter(r => r.reserver === currentUser.username);
        
        // Group consecutive reservations into one visual block
        const groups = Object.values(myRes.reduce((acc, res) => {
            const id = res.reservationGroupId || res.id;
            (acc[id] = acc[id] || []).push(res);
            return acc;
        }, {}));

        $('#total-res').text(groups.length);
        $('#res-table').toggle(groups.length > 0);
        $('#empty-state').toggle(groups.length === 0);

        groups.forEach(g => {
            const r = g[0];
            const timeDisplay = g.length > 1 ? `${g[0].time.split(' - ')[0]} - ${g[g.length - 1].time.split(' - ')[1]}` : r.time;
            const owner = isTech ? `<br><small style="color:#888; font-weight: normal;">By: ${r.reserver}</small>` : "";
            const statusClass = r.status === "Active" ? "status-active" : "status-completed";
            
            let actions = "";
            if (r.status === "Active" && (isTech || r.reserver === currentUser.username)) {
                actions += `<button class="btn-icon edit btn-edit-res" data-id="${r.id}" title="Edit"><i class="fas fa-pen"></i></button>`;
            }

            if (isTech) {
                actions += `<button class="btn-icon delete btn-no-show" data-id="${r.id}" title="Remove No-show"><i class="fas fa-user-times"></i></button>`;
            } else if (r.status === "Active") {
                actions += `<button class="btn-icon delete btn-delete" data-id="${r.id}" title="Cancel"><i class="fas fa-trash"></i></button>`;
            }

            $tbody.append(`<tr>
                <td><strong>${r.lab}</strong>${owner}</td>
                <td>
                    ${r.date}<br><small style="color:#888; font-weight: 600;">${timeDisplay}</small>
                </td>
                <td><span style="background: var(--gray-light); padding: 4px 10px; border-radius: 6px; font-weight: bold;">${r.seat}</span></td>
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
        
        const d = new Date(), f = x => x.toISOString().split('T')[0];
        $('#edit-res-date').attr({ min: f(d), max: f(new Date(d.setDate(d.getDate() + 6))) });
        
        $('#edit-res-id').val(target.id);
        $('#edit-res-lab').val(target.lab);
        $('#edit-res-date').val(target.date);
        $('#edit-res-time').val(target.time);
        $('#edit-res-seat').val(target.seat);
        $('#edit-reservation-modal').fadeIn(200);
    });

    $('#history-table-body').off('click', '.btn-no-show').on('click', '.btn-no-show', function() {
        if (confirm("Remove this no-show? Cancels all slots.")) removeReservationGroup($(this).data('id'));
    });

    $('#history-table-body').off('click', '.btn-delete').on('click', '.btn-delete', function() {
        if (confirm("Cancel this reservation?")) removeReservationGroup($(this).data('id'));
    });

    function removeReservationGroup(id) {
        const target = reservations.find(r => r.id === id);
        if (!target) return;
        const gId = target.reservationGroupId;
        for (let i = reservations.length - 1; i >= 0; i--) {
            if (gId ? reservations[i].reservationGroupId === gId : reservations[i].id === target.id) {
                reservations.splice(i, 1);
            }
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

        target.lab = $('#edit-res-lab').val();
        target.date = $('#edit-res-date').val();
        target.time = $('#edit-res-time').val();
        target.seat = $('#edit-res-seat').val();
        
        $('#edit-reservation-modal').fadeOut(200);
        loadHistory();
    });

    $('#history-search').on('keyup', function() {
        const v = $(this).val().toLowerCase();
        $("#history-table-body tr").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(v) > -1);
        });
    });
});