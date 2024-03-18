$(document).ready(function(){
    get_my_res()
})

function get_my_res()
{
    $.ajax({
        url: "/get_my_res",
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

                    h5s[0].querySelector("img").src = order.image_name ? "/profile_uploads/"+order.image_name : "/assets/images/apppictures/farmer.png";
                    h5s[0].querySelector("b").textContent = order.bis_name;
                    h5s[1].querySelector("b").textContent = order.judet+", "+order.loc+", "+order.adresa;
                    h5s[2].querySelector("b").textContent = order.date;
                    h5s[3].querySelector("b").textContent = order.trans_price+ " RON";
                    h5s[4].querySelector("b").textContent = get_status(order.status);

                    let cols = temp.querySelectorAll(".col-auto");
                    if (order.image!="")
                    temp.querySelector(".col-auto img").src = '/uploads/'+order.image;

                    cols[1].textContent = order.name;
                    cols[2].textContent = order.qty + " " + get_unit(order.unit);

                    cols[3].textContent = order.price + " RON / unitate";
                    cols[4].textContent = parseInt(order.price)*parseInt(order.qty) + " RON";
                    if (order.status==3)
                    {
                        let action_temp = document.querySelector("#action_btns").content.cloneNode(true);
                        let anim_hide =action_temp.querySelector(".anim_hide");
                        let bs = action_temp.querySelectorAll("b");
                        bs[0].textContent = order.cont_bancar;
                        action_temp.querySelectorAll("button")[0].onclick = function(){
                            show_data(this,anim_hide);
                        }
                        action_temp.querySelectorAll("button")[1].onclick = function(){
                            export_as_pdf(order.id_res);
                        }
                        temp.querySelector("div").appendChild(action_temp);
                        
                        //afiseaza 

                    }
                    else if (order.status==4)
                    {
                        let action_temp = document.querySelector("#action_btns_export").content.cloneNode(true);
    
                        action_temp.querySelectorAll("button")[0].onclick = function(){
                            export_as_pdf(order.id_res);
                        }
                        temp.querySelector("div").appendChild(action_temp);
                        
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

function show_data(button,where)
{
    button.textContent = "Ascunde date transfer"
    button.onclick = function(){
        hide_data(button,where);
    }
    where.style.maxHeight = "50px";
}

function hide_data(button,where){
    button.textContent = "Afiseaza date transfer"
    button.onclick = function(){
        show_data(button,where);
    }
    where.style.maxHeight = "0px";
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
        return "Acceptata - in asteptare livrare pentru data stabilita";
        break;
        case 3:
            return "Asteptare plata de catre utilizator -  daca nu platesti, fermierul nu va trimite comanda";
            break;
        case 4: 
        return "Asteptare livrare la data selectata";
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

function process_date(date)
{
    let date_part = date.split("T")[0].split("-");
    let hour_part = date.split("T")[1].split("\.");

    return date_part[2]+"."+date_part[1]+"."+date_part[0]+"  "+hour_part[0];
}

function export_as_pdf(res_id)
{


    $.ajax({
        url: "/get_res_data",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"res_id": res_id}),
        success: function(data)
        {
            console.log(data);
            if (data.length!=0)
            {
                data = data[0];
                  init_pdf();
                  if(data.need_pay==1)
                  create_need_pay();
         gen(data.nume_firma.trim(),`${data.client_name}`,`${data.from_judet}, ${data.from_oras}, ${data.from_adresa}`,`${data.judet}, ${data.loc}, ${data.adresa}`,[`${data.id_res}`,`${process_date(data.trimis)}`,`${data.date}`,`${data.trans_price} RON`,`${data.cont_bancar}`],1);
     
         create_row(`${data.name}`,`${data.qty} x bucati`,`${data.price_per_kg!=0 ? data.price_per_kg + " RON / kg" : data.price+" RON / unitate"} `,`${parseInt(data.price)*parseInt(data.qty)} RON`);
     x=5;
     y+=5;
                display_text(`Total de plata: ${parseInt(data.price)*parseInt(data.qty) + parseInt(data.trans_price)} RON`,16);
     done("test");
            }
        }
    })
   
}