var current_step = 1,token="",qr_code=null,copied = null,copy_timeout = null,notify;
$(document).ready(function(){

    notify = new Notify();
    $(".input_holder input").on("focus",function(){
        //move the label 
        $(this).parent().find("label").css({"top":"-10px","color":"#339AF0"});
        //set the line to active 
        $(this).parent().find(".line").css("width","100%");
    })
    
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
                if ($(this).prev()[0].tagName == "SPAN")
                $(this).prev().prev().select();
                else
                $(this).prev().select();
                return false;
                }
            }

            return is_ok;
    })
    $(".key_holder").click(function(){
        //show the msg 
        $(".copied").css("display","block");
        let $input = $(this).find("input");
        console.log($input.val())
        $input.select();
        document.execCommand("copy");
        //show the copy button 
        let holder =document.getElementsByClassName("key_holder")[0] 
        let top = holder.offsetTop;
        $(".copied").css({
            "top":(top+holder.offsetHeight+3)+"px",
            "left": (holder.offsetLeft + holder.offsetWidth/2 - 50)+"px"
        })
            if (copy_timeout!=null){
                clearTimeout(copy_timeout)
            }
            copy_timeout = setTimeout(hide_copy,1200);
    })
    $(".input_holder input").on("focusout",function(){
        //bring it down only if there is not text 
        if ($(this).val().trim().length==0){
            //if there are some whitespaces , then remove them 
            $(this).val('');
            $(this).parent().find(".line").css("width","0%")
            $(this).parent().find("label").css({"top":"5px","color":"black"});
    }
    })
    $("#fa").on("change",function(){
        //post request to /change_auth
        send();
        //now we should show the steps
        $(".steps").css("display","block");
})
})

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

const send = (def_code = "") =>
{
    let csrf = document.getElementById("csrf").value;
    csrf = csrf.substring(0,csrf.length-1);
    //TODO get_code
    let code = get_code();
    console.log(code);
    if (code.trim()=="")
    code = def_code;
    console.log(token);
    $.ajax({
        url: "/change_auth",
        type: "POST",
        dataType: "json",
        headers:{
            "X-CSRF-Token": csrf
        },
        data: JSON.stringify({"code":code,"token":token}),
        contentType: "application/json",
        success: function (data){
            console.log(data);
            if (data.status == "pending"){
                
                //show code input 
                $("#code_handler").css("display","block");
                token = data.link.split("secret=")[1];
                token = token.trim();
                //add the code to the input 
                $("#key").val(token);
                //load te qr 
                if(qr_code==null)
                {
                    //init 
                    qr_code = new QRCode("qrcode", {
                        text: data.link.trim(),
                        width: 128,
                        height: 128,
                        colorDark : "#000000",
                        colorLight : "#ffffff",
                        correctLevel : QRCode.CorrectLevel.H
                    });
                    
                }
                else{
                    qr_code.clear();
                    qr_code.makeCode(data.link);
                }
                
            }
            else if (data.code!=null && data.code == "ok"){
                //hide 
                $(".steps").css("display","none");
            }
            else if (data.code!=null && data.code=="nok"){
                        $("#wc").css("max-height","100px");
            }
        },
        error: function (err){
            alert("Server error! Try again later !");
        }
    })

}
function hide_copy(){
    $(".copied").css("display","none");
}
function next(){
    current_step++;
    //do the action for current step 
    if (current_step>3){
        send("123456");
    }
    
    if (current_step>3){
        current_step = 3;
    }
    //lets move the progress bar by 33.3%
    $(".custom_progress").css("width",(current_step-1)*50+"%");
    //now move to the current_step 
    $(".step_display span[data-index='"+current_step+"']").addClass("step_active");
    //now set the prev step to passed
    $(".step_display span[data-index='"+(current_step-1)+"']").removeClass("step_active").addClass("step_passed")
    //we can move the step_content
    $(".step_content").css("left",-295*(current_step-1)+"px")
}

function change(what){
    if (what == "security"){
        //goto security
        //left 0%;
        $(".options_list").css("left","0%");
    }
    else{
        //goto p_data
        //left -100%;
        $(".options_list").css("left","-100%");
    }
}

function change_pass(){
    //make the request to the server
    //with #conf_password and password 
    let creds = {};
    creds.new_pass = document.getElementById("password").value;
    creds.rep_new_pass = document.getElementById("conf_password").value;
    let csrf = document.getElementById("csrf").value;
    $.ajax({
        url: "/change_pass",
        type: "POST",
        contentType: "application/json",
        headers: {
            "X-CSRF-Token": csrf.substring(0,csrf.length-1)
        },
        data: JSON.stringify(creds),
        dataType: "json",
        success: function(data){
          
            if (data.err!=null){
                $("#password").css("border-color","red");
                $("#conf_password").css("border-color","red");

                $("#pass_err").text(data.err);
                $("#pass_err").css("max-height","100px");
            }
            else{
                $("#password").css("border-color","#86a4c3");
                $("#conf_password").css("border-color","#86a4c3");
                $("#pass_err").text("");
                $("#pass_err").css("max-height","0px");
                notify.show_success("Succes!","Parola a fost modificată!");
            }
        },error: function()
        {
            notify.show_error("Eroare!","Te rugăm să încerci mai târziu!")
        }

    })
}
function change_mail(){
    //make the request
    let csrf = document.getElementById("csrf").value;

    $.ajax({
        url: '/change_mail',
        type: 'POST',
        headers: {
            "X-CSRF-Token": csrf.substring(0,csrf.length-1)
        },
        data: JSON.stringify({"new_mail":document.getElementById("new_email").value}),
        contentType: 'application/json',
        success: function(data){
            if (data.err){
                notify.show_error("Eroare!",data.err);
            }
            else{
                //add the email addr 
                document.querySelector("#modal-center b").textContent = document.querySelector("#new_email").value;
                $("#modal-center").modal("show")
                notify.show_success("Succes!","Am trimis un email de confirmare pe această adresă!")
                //show the code 
            }
        },error: function(data)
        {
            notify.show_error("Eroare!","Te rugăm să încerci mai târziu!");
        }
    })
}

function verify_mail(){
    let code = "";
    //build the code
    Array.from(document.querySelectorAll("#email_code input")).forEach(elem=>{
        code+=elem.value.trim();
    })

    $.ajax({
        url: "/verify_mail",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"code": code}),
        success: function(data){
            if (data.err)
            {
                document.querySelector("#email_code_err").textContent = data.err;
                document.querySelector("#email_code_err").style.maxHeight = "100px";
            }
            else{
                document.querySelector("#email_code_err").style.maxHeight = "0px";
                notify.show_success("Succes!","Adresa de email a fost verifcată!");
                $("#modal-center").modal("hide")
                //change the button
                document.querySelector("#email_von").disabled = true;
                document.querySelector("#email_von").textContent = "Verificat";
            }
        },error: function(){
            notify.show_error("Eroare!","Te rugăm să încerci mai târziu!");
        }
    })
}


function change_phone(){
    //make the request
    let csrf = document.getElementById("csrf").value;

    $.ajax({
        url: '/change_phone',
        type: 'POST',
        headers: {
            "X-CSRF-Token": csrf.substring(0,csrf.length-1)
        },
        data: JSON.stringify({"new_phone":document.getElementById("new_phone").value}),
        contentType: 'application/json',
        success: function(data){
            if (data.err){
                notify.show_error("Eroare!",data.err);
            }
            else{
                //add the email addr 
                document.querySelector("#modal-phone b").textContent = document.querySelector("#new_phone").value;
                $("#modal-phone").modal("show")
                notify.show_success("Succes!","Am trimis un mesaj de confirmare pe acest număr!")
                //show the code 
            }
        },error: function(data)
        {
            notify.show_error("Eroare!","Te rugăm să încerci mai târziu!");
        }
    })
}

function verify_phone(){
    let code = "";
    //build the code
    Array.from(document.querySelectorAll("#phone_code input")).forEach(elem=>{
        code+=elem.value.trim();
    })

    $.ajax({
        url: "/verify_phone",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"code":code}),
        success: function(data){
            if (data.err)
            {
                document.querySelector("#phone_code_err").textContent = data.err;
                document.querySelector("#phone_code_err").style.maxHeight = "100px";
            }
            else{
                document.querySelector("#phone_code_err").style.maxHeight = "0px";
                notify.show_success("Succes!","Numărul de telefon a fost verifcat!");
                $("#modal-phone").modal("hide")
                //change the button
                document.querySelector("#phone_von").disabled = true;
                document.querySelector("#phone_von").textContent = "Verificat";
            }
        },error: function(){
            notify.show_error("Eroare!","Te rugăm să încerci mai târziu!");
        }
    })
}


function send_verify_mail()
{
  
    
    $.ajax({
        url: "/send_email_verify",
        type: "POST",
        contentType: "application/json",
        success: function(data)
        {       
            console.log(data);
            if (data.err){
                notify.show_error("Eroare!",data.err);
            }
            else{
                //add the email addr 
                document.querySelector("#modal-center b").textContent = data.email;
                $("#modal-center").modal("show")
                notify.show_success("Succes!","Am trimis un email de confirmare pe această adresă!")

            }

        },error: function()
        {
            notify.show_error("Eroare!","Te rugăm să încerci mai târziu!");
        }
    })
}


function send_verify_phone()
{
    $.ajax({
        url: "/send_verify_phone",
        type: "POST",
        contentType: "application/json",
        success: function(data)
        {       
            console.log(data);
            if (data.err){
                notify.show_error("Eroare!",data.err);
            }
            else{
                //add the email addr 
                document.querySelector("#modal-center b").textContent = data.phone;
                $("#modal-phone").modal("show")
                notify.show_success("Succes!","Am trimis un mesaj de confirmare pe acest număr!")

            }

        },error: function()
        {
            notify.show_error("Eroare!","Te rugăm să încerci mai târziu!");
        }
    })
}