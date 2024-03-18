const send = () =>
{
    let creds = {};
    creds.name = document.getElementById("name").value;
    creds.pass = document.getElementById("pass").value;
    
    let csrf = document.getElementById("csrf").value;
    
    jQuery.ajax({
        url: '/agent_login',
        type: 'POST',
        dataType: 'json',
        headers: {
            "X-CSRF-Token": csrf.substring(0,csrf.length-1)
        },
        data: JSON.stringify(creds),
        contentType: 'application/json',
        success: function(data)
        {
            console.log(data);
            if (data.err){
            if (data.err=="2fa"){
                //show the input for code 
                $(".cover").css("display","flex");
                //and delete other errs
                show_err(null);
            }
            else if (data.err == "wc"){
               show_err("Cod greșit!");
            }
            else
        {
            show_err("Datele introduse nu sunt corecte!")
        }
        }
        else
        {
            //do the redirect 
            window.location.href = "/user_form";
        }
        }
    })
}


const show_err = (msg)=>{
    if (msg){
        if ($(".err").hasClass("vis"))
        {
            //only change the text 
            $(".err").text(msg);
        }
        else
        $(".err").removeClass("invis").addClass("vis").text(msg);
}
else{
    //hide the err 
    $(".err").removeClass("vis").addClass("invis");
}
}