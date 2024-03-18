
$(document).ready(function(){
    $("input:not(.code)").on("focus",function(){
        //now move the label up

         $(this).parent().find("label").addClass("label_ac");
         $(this).parent().find(".line").addClass("on");

    })
    $("input:not(.code)").on("focusout",function(){
        //move the label down
        //only if in input is no text 
        if ($(this).val().trim()==''){
            //just to be sure 
            $(this).val("");
            $(this).parent().find(".line").removeClass("on");
            $(this).parent().find("label").removeClass("label_ac");
    }
    })

    //gooogle auth code input listeners
    $("input.code").on("keydown",function(event){
        let is_ok = ( event.ctrlKey || event.altKey 
            || (47<event.keyCode && event.keyCode<58 && event.shiftKey==false) 
            || (95<event.keyCode && event.keyCode<106)
            || (event.keyCode==8) || (event.keyCode==9) 
            || (event.keyCode>34 && event.keyCode<40) 
            || (event.keyCode==46) );
        
            if (is_ok && $(this).val().length!=0)
            {
                if (event.keyCode != 8 && event.keyCode != 46){
                //we can hop to the next input
                if ( $(this).next()[0] !== undefined && $(this).next()[0].tagName == "SPAN")
                {
                    //then we next again 
                $(this).next().next().select();
                }
                $(this).next().select();
            }
            else{
                //delete current one 
                $(this).val('');
                //we should go  backwards 
                $(this).prev().select();
                return false;
            }
            }
            else{
                if ($(this).val().length==0 && (event.keyCode == 8 || event.keyCode == 46))
                {
                    //only go backwards 
                        //delete current one 
                $(this).val('');
                //we should go  backwards 
                $(this).prev().select();
                return false;
                }
            }

            return is_ok;
    })
})

const close_2fa = ()=>{
    $('.cover').css("display","none")
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
const get_code = () =>{
    let code = '';
    $("#code input").each(function(index,elem){
        if ($(elem).val().length!=0){
            code+=$(elem).val();
        }
    })
    console.log(code);
    return code;
}
const send = () =>
{
    let creds = {};
    creds.name = document.getElementById("name").value;
    creds.pass = document.getElementById("pass").value;
    creds.code = get_code();
    let csrf = document.getElementById("csrf").value;
    
    jQuery.ajax({
        url: '/login',
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
            if (data.link)
            {
                window.location.href = data.link;
            }
            else{
                window.location.href = "/index";

            }
        }
        },
        error: function(err)
        {
            console.log(err);
        }
    })
}