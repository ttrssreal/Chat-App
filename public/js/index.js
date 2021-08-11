$(document).ready(() => {
    let showMsgAfterMillSecs = 1000;

    let stopedTypingTimerUsr = 0;
    let stopedTypingTimerEml = 0;
    let stopedTypingTimerPas = 0;
    
    let showingUsrMsg = true;
    let showingEmlMsg = true;
    let showingPasMsg = true;

    
    let regexUsername = /^[a-z][^\W_]{3,29}$/i;
    let regexPassword = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    let regexEmail = /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/;

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

    setInterval(() => {
        //Username Messages
        stopedTypingTimerUsr += 100;
        stopedTypingTimerEml += 100;
        stopedTypingTimerPas += 100;
        
        if ((stopedTypingTimerUsr >= showMsgAfterMillSecs) && !showingUsrMsg) {
            showingUsrMsg = true;
            currUsername = $("#username").val();
            if (!regexUsername.test(currUsername))
                $(".username-labl-err").append("<p>Username not between 4-30 characters.</p>");
        }
        
        //Email Messages
        if ((stopedTypingTimerEml >= showMsgAfterMillSecs) && !showingEmlMsg) {
            showingEmlMsg = true;
            currEmail = $("#email").val();
            if (!regexEmail.test(currEmail));
                $(".email-labl-err").append("<p>Invalid email format.</p>");
        }

        if ((stopedTypingTimerPas >= showMsgAfterMillSecs) && !showingPasMsg) {
            showingPasMsg = true;
            currPassword = $("#password").val();
            if (!regexPassword.test(currPassword))
                $(".password-labl-err").append("<p>Invalid password format.</p>");
        }
        
        if (!showingUsrMsg)
            $(".username-labl-err p").html("");
        if (!showingEmlMsg)
            $(".email-labl-err p").html("");
        if (!showingPasMsg)
            $(".password-labl-err p").html("");

    }, 100);

    
});