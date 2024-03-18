
var notify;
$(document).ready(function(){
    notify = new Notify();
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
            if (data == "OK"){
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