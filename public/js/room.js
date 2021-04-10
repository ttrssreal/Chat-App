const socket = new WebSocket('ws://localhost:5000');

socket.on("connected", () => {
    alert("connected")
});


function updateChat() {
    $.ajax({
        type: "POST",
        url: "/dostuff",
        data: {'todo': 'update'},
        dataType: "json",
        success: data => {
            alert(data);
        }
    });
}

$(document).ready(() => {
    // setInterval('updateChat()', 2000)
    
});