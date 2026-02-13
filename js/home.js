const lab = document.getElementById("lab");
const btn = document.getElementById("find-slots-btn");

lab.addEventListener("click", function() {
        document.getElementById("lab").style.backgroundColor = "#417C33";
        document.getElementById("lab").style.color = "#F2F0EF";
        console.log("It Works!");
});

btn.addEventListener("click", function() {
        document.location.href="view-lab.html"
        //document.getElementById("error-msg").innerHTML = "Invalid Selection";
});