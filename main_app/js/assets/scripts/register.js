
$(document).ready(function(){
    $("input").on("focus",function(){
        //now move the label up
         $(this).parent().find("label").addClass("label_ac");
         $(this).parent().find(".line").addClass("on");

    })
    $("input").on("focusout",function(){

        //move the label down
        //only if in input is no text 
        if ($(this).val().trim()==''){
            //just to be sure 
            $(this).val("");
            $(this).parent().find(".line").removeClass("on");
            $(this).parent().find("label").removeClass("label_ac");
    }
    })
})
const send = () =>
{
    let creds = {};
    creds.name = document.getElementById("name").value;
    creds.pass = document.getElementById("pass").value;
    creds.real_name = document.getElementById("rname").value;
    creds.pass_repeat = document.getElementById("pass_verif").value;
    creds.phone_number = document.getElementById("phone").value;
    creds.email = document.getElementById("email").value;
    let csrf = document.getElementById('csrf').value;
    csrf = csrf.substring(0,csrf.length-1);
    jQuery.ajax({
        url: '/register',
        type: 'POST',
        dataType: 'json',
        headers:{
            "X-CSRF-Token": csrf
        },
        data: JSON.stringify(creds),
        contentType: 'application/json',
        success: function(data)
        {
            console.log(data);
            //remove all errors 
            $(".err").text('');
            if (data.errors)
            {

                if (data.errors['general'])
                {
                    //if we have a server error
                    $(".err[data-bind='server']").text("Server error! Try again later")
                }
                //then show the errors 
                for(key in data.errors){
                    $(".err[data-bind='"+key+"']").text(data.errors[key]);
                }
            }
        },
        error: function(err)
        {
            console.log(err);
        }
    })
}