// deno-lint-ignore-file

function updateScreen() {
    var request = new XMLHttpRequest();
    request.open("GET", "screen.bmp", true);
    request.responseType = "blob";
    request.onload = response;
    request.send();
}

function response() {
    if (this.status === 200) {
        let urlCreator = window.URL || window.webkitURL;
        let imageUrl = urlCreator.createObjectURL(this.response);
        document.getElementById("screen").src = imageUrl;
    }
    setTimeout(updateScreen, 50 - (new Date().getTime() % 50));
}

updateScreen();