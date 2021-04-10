const socketio = io();

$(document).ready(() => {
  socketio.on("message", data => {
    $(".messages ul").append("<li>" + data.message + "</li>");
    $(".messages").scrollTop($(".messages").prop("scrollHeight"));
  });

  socketio.on("new_user", data => {
      $(".currentUserList ul").append("<li>" + data + "</li>");
  });

  $(".btn").click(() => {
    socketio.emit("message", {
      sender: "John",
      message: $(".message_to_send").val(),
    });
  });
});
