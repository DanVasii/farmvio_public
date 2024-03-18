
var notify;
$(document).ready(function(){
    notify = new Notify();

    
    $("input.code").on("keydown",function(event){
  
        
        let is_ok = ( ( parseInt(event.key) != "NaN" && parseInt(event.key)>=0 && parseInt(event.key)<=9) || event.keyCode == 229);
        console.log(is_ok);
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
                if (event.key === "Backspace")
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
})

function get_total_orders(){
    $.ajax({
        url: "/get_total_orders",
        type: "POST",
        success: function(data){
            
        }
    })
}

function open_edit(){
    let inputs = document.querySelectorAll("#main_content input");
    for (let i = 0;i<4;i++){
        inputs[i].disabled = false;
    }
    document.querySelector(".action_edit").onclick = null;
    document.querySelector(".action_edit").onclick = function(){
        close_edit();
    }
    document.querySelector(".action_edit").textContent = "Finalizeaza editarea";
}

function close_edit(){
  
    $.ajax({
        url: "/change_personal_data",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"real_name":document.querySelector("#real_name").value,"username":document.querySelector("#username").value,"email":document.querySelector("#email").value,"phone":document.querySelector("#phone").value}),
        success: function(data){
            console.log(data);
            if (data.succ){
                //remove prev errs 
                Array.from(document.querySelectorAll(".invalid-feedback")).forEach(elem=>{
                    elem.style.display = "none";
                })
                let inputs = document.querySelectorAll("#main_content input");
                for (let i = 0;i<4;i++){
                    inputs[i].disabled = true;
                }
                //now send the ajax 
                document.querySelector(".action_edit").onclick = null;
                document.querySelector(".action_edit").onclick = function(){
                    open_edit();
                }
                
    document.querySelector(".action_edit").textContent = "Editeaza datele personale";
                notify.show_success("Succes!","Date au fost modificate");
                if (data.email)
                {
                    //verifica 
                    let email_von = document.querySelector("#email_von");
                    email_von.disabled = false;
                    email_von.textContent = "Verifică";
                    email_von.onclick = function(){
                        send_verify_mail();
                    }

                }
                if (data.phone){
                    //verifica 
                    let phone_von = document.querySelector("#phone_von");
                    phone_von.disabled = false;
                    phone_von.textContent = "Verifică";
                    phone_von.onclick = function(){
                        send_verify_phone();
                    }
                }
            }
            else 
            {
                Object.keys(data).map(id=>{
                    document.querySelector("#"+id).parentElement.querySelector(".invalid-feedback").textContent = data[id];
                    document.querySelector("#"+id).parentElement.querySelector(".invalid-feedback").style.display = "block";
                })
            }
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
    document.querySelector("#modal-center b").textContent = "";
    $("#modal-phone").modal("show")
    notify.show_success("Succes!","Am trimis un mesaj de confirmare pe acest număr!")
    $.ajax({
        url: "/3",
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