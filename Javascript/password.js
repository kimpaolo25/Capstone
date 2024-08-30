
const password = document.getElementById("password");
const chk = document.getElementById("chk");

chk.onchange = function(e){
    password.type = chk.checked ? "text" : "password";
};