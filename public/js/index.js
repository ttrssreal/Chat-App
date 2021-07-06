$(document).ready(() => {
    let showMsgAfterMillSecs = 1000;

    let stopedTypingTimerUsr = 0;
    let stopedTypingTimerEml = 0;
    let stopedTypingTimerPas = 0;
    
    let showingUsrMsg = true;
    let showingEmlMsg = true;
    let showingPasMsg = true;

    
    let regexUsername = /^[a-z][^\W_]{4,29}$/i;
    let regexPassword = /^(?=[^a-z]*[a-z])(?=\D*\d)[^:&.~\s]{8,1000}$/;
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
            $.post(
                "/is_username_reg",
                { username: currUsername },
                result => {
                    if (result)
                        $(".username-labl-err").append("<p>Sorry, this username is already registered.</p>");
                }
            );
            if (!regexUsername.test(currUsername))
                $(".username-labl-err").append("<p>Username not between 5-30 characters.</p>");
        }
        
        //Email Messages
        if ((stopedTypingTimerEml >= showMsgAfterMillSecs) && !showingEmlMsg) {
            showingEmlMsg = true;
            currEmail = $("#email").val();
            $.post(
                "/is_email_reg",
                { email: currEmail },
                result => {
                    if (result)
                        $(".email-labl-err").append("<p>Email has already registered</p>");
                }
            );
            if (!regexEmail.test(currEmail))
                $(".email-labl-err").append("<p>Invalid email format.</p>");
        }

        //Password Messages
        if ((stopedTypingTimerPas >= showMsgAfterMillSecs) && !showingPasMsg) {
            showingPasMsg = true;
            currPassword = $("#password").val();
            if (!regexPassword.test(currPassword))
                $(".password-labl-err").append("<p>Password not at least 8 characters long or dosent have at least one number</p>");
        }
        
        if (!showingUsrMsg)
            $(".username-labl-err p").html("");
        if (!showingEmlMsg)
            $(".email-labl-err p").html("");
        if (!showingPasMsg)
            $(".password-labl-err p").html("");

    }, 100);

    
});