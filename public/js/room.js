const sockio = io();

// local idea of the current users
var local_users = [];

var selfUsername;

function updateUsers() {
  // clears users
  $(".currentUserList ul").html("");
  for (let userIndex = 0; userIndex < local_users.length; userIndex++) {
    const user = local_users[userIndex];
    // add each user to userlist with link pointing to the users page
    $(".currentUserList ul").append("<li><a href='/user/"+ user.uid +"'>" + user.username + "</a></li>");
  }
}

// adds a user
function addUser(user) {
  local_users.push(user);
  updateUsers();
}

function removeUser(user) {
  // filter users
  local_users = local_users.filter(value => {
    // check if attribs are the same, if so remove
    return (value.username != user.username) && (value.uid != user.uid);
  });
  updateUsers();
}

function addMessage(data) {
  // add message
  $(".messages ul").append("<li>" + DOMPurify.sanitize(data.message) + "</li>");
  // scroll to the bottom of the screen
  $(".messages").scrollTop($(".messages").prop("scrollHeight"));
}

function sendMessage() {
  // get the message from user
  let message = $(".message_to_send").val()
  // send the message
  sockio.emit("message", { message });
  // clear the input box
  $(".message_to_send").val("");
  // add the message to the screen
  addMessage({ message: selfUsername + ": " + message });
}

sockio.on("usernames", users => {
  // upon connection we get the users in the room
  local_users = users;
  updateUsers()
});

sockio.on("username", user => {
  // we also get our username
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
