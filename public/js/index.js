// jquery.ready() analogous to window.onload
$(document).ready(() => {
    $(".form-create-account").submit(e => {
        // don't reload the page
        e.preventDefault();
        // get creds
        let username = $("#username").val(), 
            email = $("#email").val(), 
            password = $("#password").val();

        // atempt to sign up
        $.post("/signup", { username, email, password }, res => {
            if (!res.success)
                $(".form-err").html(res.message);
            // go to login if succeeds
            else document.location = "/login";
        });
    })
    
    // time in milliseconds
    let showMsgAfterMillSecs = 1000;

    let stopedTypingTimerUsr = 0;
    let stopedTypingTimerEml = 0;
    let stopedTypingTimerPas = 0;
    
    let showingUsrMsg = true;
    let showingEmlMsg = true;
    let showingPasMsg = true;

    let regexUsername = /^[a-zA-z\d]{4,}$/i;
    let regexPassword = /^(?=.*\d)[a-zA-z\d]{8,}/;
    let regexEmail = /^[\w\d!#$%&'*+-\/=?^`{|}~]+@[a-z\d\-]+.[a-z\d\-]+(.[a-z\d\-]+)?/;

    // starts typing
    $("#username").on("input change", () => {
        stopedTypingTimerUsr = 0;
        showingUsrMsg = false;
    });

    $("#email").on("input change", () => {
        stopedTypingTimerEml = 0;
        showingEmlMsg = false;
    });

    $("#password").on("input change", () => {
        stopedTypingTimerPas = 0;
        showingPasMsg = false;
    });

    // iterates
    setInterval(() => {
        // update timers
        stopedTypingTimerUsr += 100;
        stopedTypingTimerEml += 100;
        stopedTypingTimerPas += 100;

        // Username Messages
        if ((stopedTypingTimerUsr >= showMsgAfterMillSecs) && !showingUsrMsg) {
            showingUsrMsg = true;
            currUsername = $("#username").val();
            if (!regexUsername.test(currUsername))
                $(".username-labl-err").append("<p>Username not between 4-30 characters.</p>");
        }
        
        // Email Messages
        if ((stopedTypingTimerEml >= showMsgAfterMillSecs) && !showingEmlMsg) {
            showingEmlMsg = true;
            currEmail = $("#email").val();
            g = regexEmail.test(currEmail)
            if (!g) {
                $(".email-labl-err").append("<p>Invalid email format.</p>");
            }
        }

        // Password Messages
        if ((stopedTypingTimerPas >= showMsgAfterMillSecs) && !showingPasMsg) {
            showingPasMsg = true;
            currPassword = $("#password").val();
            if (!regexPassword.test(currPassword))
                $(".password-labl-err").append("<p>Invalid password format.</p>");
        }

        // remove messages if not meant to be showing
        if (!showingUsrMsg)
            $(".username-labl-err p").remove();
        if (!showingEmlMsg)
            $(".email-labl-err p").remove();
        if (!showingPasMsg)
            $(".password-labl-err p").remove();

    // ten times per second 1000/100
    }, 100);
});