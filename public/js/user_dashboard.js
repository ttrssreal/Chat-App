$(document).ready(() => {
    // initialy hide the selector
    $(".setFavRoomContainer").hide();

    $(".setFavRoomBtn").click(() => {
        // set the favourite room via post req to /favourite
        let rName = $(".rid").val();
        $.post("/favourite", { rName }, res => {
            document.location = "/dashboard";
        });
    });

    $(".openSetFavRoom").click(() => {
        // on click hide/show the selector
        $(".setFavRoomContainer").toggle();
    });
})