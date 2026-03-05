/* file: js/script.js */
$(document).ready(function() {
    const role = (typeof currentUser !== "undefined" && currentUser) ? currentUser.role : null;
    const isTech = role === "Lab Technician";

    // Layout mode: tech uses only sidebar, others use top navbar.
    $(".navbar").toggleClass("role-hidden", isTech);
    $(".admin-sidebar").toggleClass("role-hidden", !isTech);
    $("body").toggleClass("admin-global-layout", isTech);

    if (!currentUser) {
        $("#nav-profile, #nav-admin, #btn-logout-nav").hide();
        $("#btn-login-nav").show();
    } else if (role === "Student") {
        $("#nav-admin, #btn-login-nav").hide();
        $("#nav-profile, #btn-logout-nav").show();
    } else if (isTech) {
        $("#nav-profile, #nav-admin, #btn-logout-nav").show();
        $("#btn-login-nav").hide();
    } else {
        $("#nav-profile, #nav-admin, #btn-logout-nav").hide();
        $("#btn-login-nav").show();
    }

    const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    const currentHash = (window.location.hash || "").toLowerCase();
    const normalizeHref = (href) => ((href || "").split("?")[0].split("#")[0].split("/").pop() || "").toLowerCase();
    const normalizeHash = (href) => {
        const value = String(href || "");
        const hashIndex = value.indexOf("#");
        return hashIndex === -1 ? "" : value.slice(hashIndex).toLowerCase();
    };

    // Keep top navbar underline in sync with selected page.
    const $topLinks = $(".nav-menu .nav-link");
    $topLinks.removeClass("active");
    $topLinks.each(function() {
        if (normalizeHref($(this).attr("href")) === currentPage) {
            $(this).addClass("active");
            return false;
        }
    });

    // Keep sidebar selected state in sync; only one item stays active.
    const $sidebarLinks = $(".admin-sidebar .sidebar-link").not(".logout");
    $sidebarLinks.removeClass("active");
    let matchedSidebar = false;
    $sidebarLinks.each(function() {
        if (matchedSidebar) return;
        const href = $(this).attr("href");
        if (normalizeHref(href) !== currentPage) return;

        if (currentPage === "admin-dashboard.html") {
            const expectedHash = currentHash || "#overview";
            const linkHash = normalizeHash(href) || "#overview";
            if (linkHash === expectedHash) {
                $(this).addClass("active");
                matchedSidebar = true;
            }
            return;
        }

        $(this).addClass("active");
        matchedSidebar = true;
    });

    $(document).off("click", ".nav-menu .nav-link").on("click", ".nav-menu .nav-link", function() {
        $(".nav-menu .nav-link").removeClass("active");
        $(this).addClass("active");
    });

    $(document).off("click", ".admin-sidebar .sidebar-link:not(.logout)").on("click", ".admin-sidebar .sidebar-link:not(.logout)", function() {
        $(".admin-sidebar .sidebar-link").removeClass("active");
        $(this).addClass("active");
    });

    const handleLogout = function(e) {
        e.preventDefault();
        if (typeof clearAuthSession === "function") {
            clearAuthSession();
        } else if (typeof sessionStorage !== "undefined") {
            sessionStorage.removeItem("currentUsername");
            sessionStorage.removeItem("currentRole");
            sessionStorage.removeItem("currentUser");
        }
        if (typeof currentUser !== "undefined") {
            currentUser = null;
        }
        window.location.href = "login.html";
    };

    $(document).off("click", "#btn-logout-nav").on("click", "#btn-logout-nav", handleLogout);
    $(document).off("click", ".admin-sidebar .sidebar-link.logout").on("click", ".admin-sidebar .sidebar-link.logout", handleLogout);
});
