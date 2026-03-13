document.getElementById("lab-building").addEventListener("change", function () {
    const selectedCode = this.value;
    const labSelect = document.getElementById("lab-room");
    Array.from(labSelect.options).forEach(opt => {
        if (!opt.value) return;
        opt.hidden = opt.dataset.building !== selectedCode;
    });
    labSelect.value = "";
});

const dateInput = document.getElementById("lab-date");
const today = new Date();
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 6);

const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

dateInput.setAttribute("min", formatDate(today));
dateInput.setAttribute("max", formatDate(nextWeek));
dateInput.value = formatDate(today);

document.getElementById("lab-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const labCode  = document.getElementById("lab-room").value;
    const date     = document.getElementById("lab-date").value;
    const timeSlot = document.getElementById("lab-time").value;

    if (!labCode || !date || !timeSlot) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        const params = new URLSearchParams({ labCode, date, timeSlot });
        const res    = await fetch(`/api/admin/labs/availability?${params}`);
        const data   = await res.json();

        if (!res.ok) {
            alert(data.error || "Failed to fetch availability.");
            return;
        }

        document.getElementById("total-seats").textContent     = data.totalSeats;
        document.getElementById("occupied-seats").textContent  = data.occupiedSeats;
        document.getElementById("remaining-seats").textContent = data.remainingSeats;
        document.getElementById("lab-info").style.display      = "block";
    } catch (err) {
        console.error(err);
        alert("An error occurred while checking availability.");
    }
});


const detailModal    = document.getElementById("detail-modal");
const confirmModal   = document.getElementById("confirm-modal");
const detailView     = document.getElementById("detail-view");
const detailEditForm = document.getElementById("detail-edit-form");

let currentRow   = null;
let currentDocId = null; 

function openDetailModal(row) {
    currentRow   = row;
    currentDocId = row.dataset.id;

    document.getElementById("d-name").textContent     = row.dataset.name;
    document.getElementById("d-id").textContent       = row.dataset.bookingId;
    document.getElementById("d-building").textContent = row.dataset.building;
    document.getElementById("d-room").textContent     = row.dataset.room;
    document.getElementById("d-seat").textContent     = row.dataset.seat;
    document.getElementById("d-date").textContent     = row.dataset.date;
    document.getElementById("d-time").textContent     = row.dataset.time;
    document.getElementById("d-status").textContent   = row.dataset.status;

    showViewMode();
    detailModal.style.display = "flex";
}

function showViewMode() {
    document.getElementById("detail-modal-title").textContent = "Reservation Details";
    detailView.style.display     = "block";
    detailEditForm.style.display = "none";
}

function showEditMode() {
    document.getElementById("detail-modal-title").textContent = "Edit Reservation";

    document.getElementById("e-building").value = currentRow.dataset.buildingCode;
    document.getElementById("e-room").value      = currentRow.dataset.room;
    document.getElementById("e-seat").value      = currentRow.dataset.seat;
    document.getElementById("e-date").value      = currentRow.dataset.date;
    document.getElementById("e-time").value      = currentRow.dataset.time;

    detailView.style.display     = "none";
    detailEditForm.style.display = "block";
}

function closeDetailModal() {
    detailModal.style.display = "none";
    showViewMode();
}

document.addEventListener("click", function (e) {
    if (e.target.classList.contains("view-btn")) {
        openDetailModal(e.target.closest("tr"));
    }
});

document.getElementById("detail-close").addEventListener("click", closeDetailModal);
document.getElementById("detail-cancel").addEventListener("click", closeDetailModal);
window.addEventListener("click", (e) => { if (e.target === detailModal) closeDetailModal(); });

document.getElementById("detail-edit").addEventListener("click", showEditMode);
document.getElementById("edit-cancel").addEventListener("click", showViewMode);

document.getElementById("edit-save").addEventListener("click", async () => {
    if (!currentDocId) return;

    const buildingSelect = document.getElementById("e-building");
    const buildingCode   = buildingSelect.value;
    const buildingName   = buildingSelect.options[buildingSelect.selectedIndex].dataset.name;
    const labCode        = document.getElementById("e-room").value;
    const seat           = document.getElementById("e-seat").value.trim();
    const date           = document.getElementById("e-date").value;
    const timeSlot       = document.getElementById("e-time").value;

    if (!seat) {
        alert("Seat cannot be empty.");
        return;
    }

    try {
        const res  = await fetch(`/api/admin/reservations/${currentDocId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ buildingCode, buildingName, labCode, seat, date, timeSlot })
        });
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Failed to update reservation.");
            return;
        }

        currentRow.dataset.buildingCode = buildingCode;
        currentRow.dataset.building     = buildingName;
        currentRow.dataset.room         = labCode;
        currentRow.dataset.seat         = seat;
        currentRow.dataset.date         = date;
        currentRow.dataset.time         = timeSlot;

        const cells = currentRow.querySelectorAll("td");
        cells[1].textContent = labCode;
        cells[2].textContent = date;
        cells[3].textContent = timeSlot;

        document.getElementById("d-building").textContent = buildingName;
        document.getElementById("d-room").textContent     = labCode;
        document.getElementById("d-seat").textContent     = seat;
        document.getElementById("d-date").textContent     = date;
        document.getElementById("d-time").textContent     = timeSlot;

        showViewMode();
    } catch (err) {
        console.error(err);
        alert("An error occurred while saving changes.");
    }
});

document.getElementById("detail-remove").addEventListener("click", () => {
    detailModal.style.display  = "none";
    confirmModal.style.display = "flex";
});

document.getElementById("modal-cancel").addEventListener("click", () => {
    confirmModal.style.display = "none";
    currentRow   = null;
    currentDocId = null;
});

document.getElementById("modal-confirm").addEventListener("click", async () => {
    if (!currentDocId) return;

    try {
        const res = await fetch(`/api/admin/reservations/${currentDocId}`, {
            method: "DELETE"
        });
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Failed to remove reservation.");
            return;
        }

        if (currentRow) currentRow.remove();
    } catch (err) {
        console.error(err);
        alert("An error occurred while removing the reservation.");
    } finally {
        confirmModal.style.display = "none";
        currentRow   = null;
        currentDocId = null;
    }
});

window.addEventListener("click", (e) => {
    if (e.target === confirmModal) {
        confirmModal.style.display = "none";
        currentRow   = null;
        currentDocId = null;
    }
});