var notify;
$(document).ready(function(){
    notify = new Notify();
    populate_reservations();
})

function populate_reservations()
{
    $.ajax({
        url: "/get_cereri_rezervare",
        type: "POST",
        contentType: "application/json",
        success: function(data)
        {
            console.log(data);
            if (data.length!=0)
            {
                let parent = document.querySelector("#main_content");
                data.map((order)=>{
                    let temp = document.querySelector("#res_temp").content.cloneNode(true);
                    temp.querySelector("h4 b").textContent = order.id_res;
                    let h5s = temp.querySelectorAll("h5");

                    h5s[0].querySelector("b").textContent = order.order_user_name;
                    h5s[1].querySelector("b").textContent = order.judet+", "+order.loc+", "+order.adresa;
                    h5s[2].querySelector("b").textContent = order.date;
                    h5s[3].querySelector("b").textContent = get_status(order.status);

                    let cols = temp.querySelectorAll(".col-auto");
                    if (order.image!="")
                    temp.querySelector(".col-auto img").src = '/uploads/'+order.image;

                    cols[1].textContent = order.name;
                    cols[2].textContent = order.qty + " " + get_unit(order.unit);

                    cols[3].textContent = order.price + " RON / unitate";
                    cols[4].textContent = parseInt(order.price)*parseInt(order.qty) + " RON";
                    if (order.status==0)
                    {
                        let actions = document.querySelector("#action_btns").content.cloneNode(true);
                        let order_id = order.id_res;
                        if (order.need_pay == 1){
                        actions.querySelector(".btn-success").textContent = "Accepta si cere plata";
                        actions.querySelector(".btn-success").onclick = function(){
                            change_status(3,order_id);
                        }
                        }
                        else
                        {
                            actions.querySelector(".btn-success").onclick = function(){
                                change_status(1,order_id);
                            }
                        }

                        actions.querySelector(".btn-danger").onclick = function(){
                            change_status(2,order_id);
                        }
                       
                        temp.querySelector("div").appendChild(actions);
                    }
                    else if (order.status==3){
                        let order_id = order.id_res;

                        let button  = document.createElement("button");
                        button.textContent = "Confirma primirea platii";
                        button.className = "btn btn-success";
                        button.onclick = function(){
                            change_status(4,order_id);
                        }
                        temp.querySelector("div").appendChild(button);
                    }
                    parent.appendChild(temp);
                })
            }
            else{
                //show no reslts 
            }
        }
    })
}

function get_unit(unit)
{
    switch(unit)
    {
        case "kg":
            return "Kilograme";
        break;
        case "b":
            return "Bucăți";
            break;
    }
}
function get_status(status)
{
    switch(status)
    {
        case 0:
            return "In asteptare raspuns de la fermier";
        break;
        case 1:
            return "Anulata de catre fermier";
        break;
        case 2:
            return "Acceptata - fara nevoie de plata";
        break;
        case 3:
            return "Asteptare plata de catre utilizator ";
        break;
        case 4: 
        return "Comanda platita";
        break;
        case 5:
            return "Anulata de client";
        break;

    }
}

function change_status(status,order_id)
{
    $.ajax({
        url: "/change_res_status",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"status": status,order_id}),
        success: function(data){
            notify.show_success("Succes!","Statusul comenzii a fost actualizat!");
        },error: function(){
            notify.show_error("Eroare!","Statusul comenzii nu a fost actualizat!")
        }
    })
}