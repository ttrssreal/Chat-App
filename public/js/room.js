const sockio = io();

var local_users = [];
var selfUsername;

function updateUsers() {
  $(".currentUserList ul").html("");
  for (let userIndex = 0; userIndex < local_users.length; userIndex++) {
    const user = local_users[userIndex];
    $(".currentUserList ul").append("<li><a href='/user/"+ user.uid +"'>" + user.username + "</a></li>");
  }
}

function addUser(user) {
  local_users.push(user);
  updateUsers();
}

function removeUser(user) {
  console.log(local_users)
  console.log("User to remove: ", user)
  local_users = local_users.filter(value => {
    return (value.username != user.username) && (value.uid != user.uid);
  });
  console.log(local_users)
  updateUsers();
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

sockio.on("usernames", users => {
  local_users = users;
  updateUsers()
});

sockio.on("username", user => {
  selfUsername = user;
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
  $(".sendButton").click(() => {
    sendMessage();
  });
});
