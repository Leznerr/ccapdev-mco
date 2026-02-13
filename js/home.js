const lab = document.getElementById("lab");
const btn = document.getElementById("find-slots-btn");

lab.addEventListener("click", function() {
        document.getElementById("lab").style.backgroundColor = "#417C33";
        document.getElementById("lab").style.color = "#F2F0EF";
        console.log("It Works!");
});

btn.addEventListener("click", function() {
    const bldg = document.getElementById("building-selector").value;
    const date = document.getElementById("date-selector").value;
    const time = document.getElementById("time-selector").value;

    if(bldg != "" && date != '' && time != ""){
        document.location.href="view-labs.html"
    }
    else{
        document.getElementById("error-msg").innerHTML = "Invalid Selection";
    }
});