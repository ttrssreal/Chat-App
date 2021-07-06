const sockio = io();

function sendMessage() {
  socketio.emit("message", {
    message: $(".message_to_send").val(),
  });
  $(".message_to_send").val("");
}

function updateUsers(usersInRoom) {
  $(".currentUserList ul").html("");
  for (let userIndex = 0; userIndex < usersInRoom.length; userIndex++) {
    const user = usersInRoom[userIndex];
    $(".currentUserList ul").append("<li>" + user + "</li>");
  }
}

$(document).ready(() => {

  sockio.on("update_users", data => {
    updateUsers(data);
  });

  sockio.on("message", data => {
    $(".messages ul").append("<li>" + data.message + "</li>");
    $(".messages").scrollTop($(".messages").prop("scrollHeight"));
  });

  // sockio.on("new_user", data => {
  //   usersInRoom.push(data);
  //   updateUsers(usersInRoom);
  // });

  // sockio.on("user_left", data => {
  //   usersInRoom = usersInRoom.filter((value, index, arr) => {
  //     return value != data;
  //   });
  //   updateUsers(usersInRoom);
  // });

  $(".btn").click(() => {

  });
});
