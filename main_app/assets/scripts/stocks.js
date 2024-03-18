$(document).ready(function(){

    get_stocks();
})


function get_prod_id(){
    let path = location.pathname;
    return path.split("/")[2];
}

function get_stocks()
{
    $.ajax({
        url: "/get_stocks",
        type:"POST",
        contentType: "application/json",
        data: JSON.stringify({"prod_id":get_prod_id()}),
        success: function(data){
            console.log(data);
        }
    })
}