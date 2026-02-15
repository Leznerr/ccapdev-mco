/* file: js/home.js */
$(document).ready(function() {
    // --- 1. Initialize Building Dropdown ---
    if (typeof buildings !== 'undefined') {
        buildings.forEach(b => {
            $('#home-building-selector').append(new Option(b.name, b.id));
        });
    }

    // --- 2. Set Date Constraints (Next 7 days) ---
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 6);
    
    const formatDate = d => d.toISOString().split('T')[0];
    $('#home-date-selector').attr({
        min: formatDate(today),
        max: formatDate(maxDate)
    }).val(formatDate(today));

    // --- 3. Initialize Time Slots ---
    const intervals = [
        "09:00 - 09:30", "09:30 - 10:00", "10:00 - 10:30", "10:30 - 11:00", 
        "11:00 - 11:30", "11:30 - 12:00", "13:00 - 13:30", "13:30 - 14:00", 
        "14:00 - 14:30", "14:30 - 15:00", "15:00 - 15:30", "15:30 - 16:00", 
        "16:00 - 16:30", "16:30 - 17:00", "17:00 - 17:30", "17:30 - 18:00"
    ];
    intervals.forEach(t => $('#home-time-selector').append(new Option(t, t)));

    // --- 4. Cascade: Building -> Lab ---
    $('#home-building-selector').on('change', function() {
        const selectedBuildingId = $(this).val();
        const $labSelect = $('#home-lab-selector');
        
        // Reset and enable lab dropdown
        $labSelect.prop('disabled', false).empty().append('<option value="" disabled selected>Select Lab...</option>');
        
        // Filter labs based on chosen building
        labs.filter(l => l.buildingId === selectedBuildingId).forEach(l => {
            $labSelect.append(new Option(l.name, l.id));
        });

        // Reset UI buttons
        $('#availability-result').hide();
        $('#btn-check-availability').show();
    });

    // --- 5. Check Availability Logic ---
    $('#btn-check-availability').on('click', function() {
        const labId = $('#home-lab-selector').val();
        const date = $('#home-date-selector').val();
        const time = $('#home-time-selector').val();

        if (!labId) {
            alert("Please select both a building and a laboratory.");
            return;
        }

        const targetLab = labs.find(l => l.id === labId);
        
        // Count how many reservations match the exact lab, date, time, and are "Active"
        const occupiedCount = reservations.filter(r => 
            r.lab === labId && r.date === date && r.time === time && r.status === "Active"
        ).length;

        const availableSeats = targetLab.capacity - occupiedCount;

        // Display results
        $('#available-count').text(availableSeats);
        $('#target-lab-name').text(targetLab.name);
        
        $(this).hide(); // Hide check button
        $('#availability-result').fadeIn(300); // Show result box
    });

    // --- 6. Seamless Navigation to Reserve ---
    $('#btn-go-to-lab').on('click', function() {
        // Save the search parameters so view-lab.html can read them instantly
        sessionStorage.setItem('homeSearchLab', $('#home-lab-selector').val());
        sessionStorage.setItem('homeSearchDate', $('#home-date-selector').val());
        sessionStorage.setItem('homeSearchTime', $('#home-time-selector').val());
        
        window.location.href = "view-lab.html";
    });
});