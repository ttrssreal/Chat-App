$(document).ready(() => {
    $(".setFavRoomContainer").hide();

    $(".setFavRoomBtn").click(() => {
        let rName = $(".rid").val();
        $.post("/favourite", { rName }, res => {
            document.location = "/dashboard";
        });
    });

    $(".openSetFavRoom").click(() => {
        $(".setFavRoomContainer").toggle();
    });
})