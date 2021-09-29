const sockio = io();

var local_users = [];
var selfUsername;

function updateUsers(users) {
  $(".currentUserList ul").html("");
  for (let userIndex = 0; userIndex < users.length; userIndex++) {
    const user = users[userIndex];
    $(".currentUserList ul").append("<li>" + user + "</li>");
  }
}

function addUser(username) {
  local_users.push(username);
  updateUsers(local_users);
}

function removeUser(username) {
  local_users = local_users.filter((value, index, arr) => {
    return value != username;
  });
  updateUsers(local_users);
}

function addMessage(data) {
  $(".messages ul").append("<li>" + data.message + "</li>");
  $(".messages").scrollTop($(".messages").prop("scrollHeight"));
}

function sendMessage() {
  let message = $(".message_to_send").val()
  sockio.emit("message", { message });
  $(".message_to_send").val("");
  addMessage({ message: selfUsername + ": " + message });
}

sockio.on("usernames", usernames => {
  usernames.forEach(username => {
    addUser(username);
  });
});

sockio.on("username", username => {
  selfUsername = username;
});

sockio.on("message", data => {
  addMessage(data);
});

sockio.on("user_joined", data => {
  addUser(data);
});

sockio.on("user_left", data => {
  removeUser(data);
});

$(document).ready(() => {
  $(".btn").click(() => {
    sendMessage();
  });
});
