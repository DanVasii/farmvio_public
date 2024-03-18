
var couriers = {},notify;
$(document).ready(function(){


    notify = new Notify();
    get_couriers();
})

function get_couriers(){
    $.ajax({
        url: "/couriers",
        type: "GET",
        success: function(data){
            //console.log(data);
            if (data && data.length!=0){
                for (index in data){
                    couriers[data[index].id] = data[index].courierName;
                    
                }
                couriers[101] = "Ridicare personala";
                couriers[102] = "Transport realizat de catre fermier";
                populate_orders();
            }
            else{
                alert("Server error, try refreshing the page!");
            }
        }
    })
}

function process_date(date)
{
    let date_part = date.split("T")[0].split("-");
    let hour_part = date.split("T")[1].split("\.");

    return date_part[2]+"."+date_part[1]+"."+date_part[0]+"  "+hour_part[0];
}

function populate_orders()
{
        $.ajax({
            url: "/my_orders",
            type: "POST",
            contentType: "application/json",
            success: function (data){
                console.log(data);
                if (data && data.length!=0){
                    let point_totals = {};
                    let already_big = [],frag;
                    frag = document.createDocumentFragment();
                    for (index in data){
                        if (!already_big.includes(data[index].order_id))
                        {
                            already_big.push(data[index].order_id);
                            //create the templae 
                            let temp = document.getElementById("big_order").content.cloneNode(true);
                            temp.querySelector(".col-12").dataset.big_id = data[index].order_id;
                            temp.querySelector(".big_order").textContent = data[index].order_id;
                            temp.querySelector(".order_date").textContent = process_date(data[index].date);
                            //now push the child to this template 
                            let child_temp = document.getElementById("small_order").content.cloneNode(true);

                            child_temp.querySelector(".col-12").dataset.small_id = data[index].child_order_id;

                            //now let's populate the child 
                            child_temp.querySelector(".small_order").textContent = data[index].child_order_id;

                            let small_order_id = data[index].child_order_id;

                               switch(parseInt(data[index].status)){
                                case 0:
                                    child_temp.querySelector("div").classList.add("bg-primary-light")
                                    if (data[index].courier_id<100)
                                    child_temp.querySelector(".status").textContent = "Așteptăm prețul final de transport de la fermier ";
                                    else{
                                        child_temp.querySelector(".status").innerHTML = `<i class="fas fa-circle text-primary"></i><br> Așteptăm răspunsul fermierului `;
                                    }
                                    break;
                                case 1:
                                    child_temp.querySelector("div").classList.add("bg-info-light")
                                    child_temp.querySelector(".status").innerHTML = `<i class="fas fa-circle text-info"></i><br> Așteptăm decizia ta`;
                                    //show the buttons 
                                    child_temp.querySelector(".col-12").appendChild(document.getElementById("button_temp").content.cloneNode(true));
                                    child_temp.querySelector(".acc").onclick = function(){
                                        accept_order(small_order_id);
                                    }
                                    child_temp.querySelector(".proposal").onclick = function(){
                                        open_proposal(small_order_id);
                                    }
                                    child_temp.querySelector(".dec").onclick = function(){
                                        console.log("declined");
                                    }
                                    break;
                                    case 2:
                                        child_temp.querySelector("div").classList.add("bg-primary-light")
                                        child_temp.querySelector(".status").innerHTML = `<i class="fas fa-circle text-primary"></i><br> Asteptare confirmare fermier`;
                                    break;  
                                    case 3:
                                        child_temp.querySelector("div").classList.add("bg-primary-light")
                                    //here we tell the user that he is waiting for farmer's response
                                    child_temp.querySelector(".status").innerHTML = `  <i class="fas fa-circle text-primary"></i><br> Așteptăm răspunsul fermierului la pentru propunerea trimisă!`;

                                    break;
                                    case 4:
                                        child_temp.querySelector("div").classList.add("bg-info-light")
                                        //here we are in process of delivering 
                                        child_temp.querySelector(".status").innerHTML = `  <i class="fas fa-circle text-info"></i><br> Așteptăm ridicarea coletului de către curier!`;

                                    break;
                                    case 5:  
                                        child_temp.querySelector("div").classList.add("bg-success-light")
                                    child_temp.querySelector(".status").innerHTML = `  <i class="fas fa-circle text-success"></i><br> Propunerea a fost acceptată!`;
                                    break;
                                    case 6:
                                        child_temp.querySelector("div").classList.add("bg-success-light")
                                        child_temp.querySelector(".status").innerHTML = `  <i class="fas fa-circle text-success"></i><br> Comanda a fost livrată prin curier!`;
                                    break;
                                    case 7:
                                        child_temp.querySelector("div").classList.add("bg-danger-light")
                                        child_temp.querySelector(".status").innerHTML = `  <i class="fas fa-circle text-danger"></i><br> Propunerea a fost refuzată de către fermier!`;

                                    break;
                                    case 8:
                                        child_temp.querySelector("div").classList.add("bg-danger-light")
                                        child_temp.querySelector(".status").innerHTML = `  <i class="fas fa-circle text-danger"></i><br> Propunerea a fost refuzată de tine!`;
                                    break;
                                    case 9:
                                        child_temp.querySelector("div").classList.add("bg-success-light")
                                        child_temp.querySelector(".status").innerHTML = `  <i class="fas fa-circle text-success"></i><br> Comandă finalizată (clientul ridică personal produsele)`;
                
                                    break;
                            }

                            if (data[index].courier_id<99)
                            {
                                child_temp.querySelector(".courier").innerHTML = `<i class="fas fa-truck-loading text-primary"></i><br> Curier - ${couriers[data[index].courier_id]}`;

                            }
                            else
                            child_temp.querySelector(".courier").innerHTML = `<i class="far fa-handshake text-primary"></i><br> ${couriers[data[index].courier_id]}`;

                            if (data[index].courier_id!=101)
                            child_temp.querySelector(".final_cost").textContent = data[index].cost ? data[index].cost : "asteptam raspuns de la fermier";
                            else{
                                child_temp.querySelector(".final_cost").textContent = "Ridicare personala"
                            }
                            //create tr 
                            //ad the current prod
                            if (point_totals[data[index]['child_order_id']])
                            {
                                point_totals[data[index]['child_order_id']] += parseFloat(parseInt(data[index].qty) * parseFloat(data[index].price));
                            }
                            else{
                                point_totals[data[index]['child_order_id']] = parseFloat(parseInt(data[index].qty) * parseFloat(data[index].price));

                            }
                            child_temp.querySelector(".prods").appendChild(get_tr_prod(data[index]));
                            

                            if(temp.querySelectorAll(".row[data-farmer_slug='"+data[index].farmer_slug+"']").length == 0){
                                //create 
                                let farmer_div = document.createElement("div");
                                farmer_div.className = "row align-items-center";
                                farmer_div.style = "border-left: 5px solid black;margin-top: 20px";
                                farmer_div.dataset.farmer_slug = data[index].farmer_slug;

                                let image_col = document.createElement("div");
                                image_col.className = "col-auto mb-2";
                                image_col.style = "font-size: 18px; font-weight: bold"
                                image_col.textContent = "Produse vândute de: ";

                                let img = document.createElement("img");
                                img.style = "width: 60px; height: 60px; border-radius: 50%; box-shadow: 0px 0px 5px black;margin-left: 10px"
                                if (data[index].farmer_image)
                                img.src = "/profile_uploads/"+data[index].farmer_image;
                                else{
                                    img.src = '/assets/images/apppictures/3.jpg';
                                }

                                let name_col = document.createElement("div");
                                name_col.className = "col-auto mb-2";
                                name_col.style.fontSize = "18px";
                                name_col.textContent = data[index].bis_name || "Nedefinit";


                                
                                let button_col = document.createElement("div");
                                button_col.className = "col mb-2";
                                button_col.style = 'text-align: end;';

                                if (data[index].status==5 || data[index].status==6 || data[index].status==9){
                                let button_export = document.createElement("button");
                                button_export.className = "waves-effect waves-light btn btn-secondary btn-flat ";
                                button_export.textContent = "Exportă sub-comanda ca PDF";
                                button_export.onclick = function(){
                                    export_pdf(small_order_id);
                                }

                                button_col.appendChild(button_export);
                            }


                                image_col.appendChild(img);
                                farmer_div.appendChild(image_col);
                                farmer_div.appendChild(name_col);
                                farmer_div.appendChild(button_col);
                                farmer_div.appendChild(child_temp);
                                temp.querySelector(".small_orders").appendChild(farmer_div);
                            }
                            else{
                                //add to the farmer div 
                                temp.querySelector(".row[data-farmer_slug='"+data[index].farmer_slug+"']").appendChild(child_temp);
                            }

                          
                            frag.appendChild(temp);   
                        }
                        else{
                            //we check if the small_order_id is already created 
                            if (frag.querySelector(".col-12[data-small_id='"+data[index].child_order_id+"']"))
                            {
                                //we can only add the prods 
                                frag.querySelector(".col-12[data-small_id='"+data[index].child_order_id+"'] .prods").appendChild(get_tr_prod(data[index]));
                            }
                            else{
                                //create and add 
                                let child_temp = document.getElementById("small_order").content.cloneNode(true);

                            child_temp.querySelector(".col-12").dataset.small_id = data[index].child_order_id;

                            //now let's populate the child 
                            child_temp.querySelector(".small_order").textContent = data[index].child_order_id;
                                let small_order_id = data[index].child_order_id;
                            switch(parseInt(data[index].status)){
                                case 0:
                                    child_temp.querySelector("div").classList.add("bg-primary-light")
                                    if (data[index].courier_id<100)
                                    child_temp.querySelector(".status").textContent = "Așteptăm prețul final de transport de la fermier ";
                                    else{
                                        child_temp.querySelector(".status").textContent = "Așteptăm răspunsul fermierului ";
                                    }
                                    break;
                                case 1:
                                    child_temp.querySelector("div").classList.add("bg-info-light")
                                    child_temp.querySelector(".status").textContent = " Așteptăm decizia ta";
                                    //show the buttons 
                                    child_temp.querySelector(".col-12").appendChild(document.getElementById("button_temp").content.cloneNode(true));
                                    child_temp.querySelector(".acc").onclick = function(){
                                        accept_order(small_order_id);
                                    }
                                    child_temp.querySelector(".proposal").onclick = function(){
                                        open_proposal(small_order_id);
                                    }
                                    child_temp.querySelector(".dec").onclick = function(){
                                        console.log("declined");
                                    }
                                    break;
                                    case 2:
                                        child_temp.querySelector("div").classList.add("bg-primary-light")
                                        child_temp.querySelector(".status").textContent = "Asteptare confirmare fermier";
                                    break;  
                                    case 3:
                                        child_temp.querySelector("div").classList.add("bg-primary-light")
                                    //here we tell the user that he is waiting for farmer's response
                                    child_temp.querySelector(".status").textContent = "Așteptăm răspunsul fermierului la pentru propunerea trimisă!";

                                    break;
                                    case 4:
                                        child_temp.querySelector("div").classList.add("bg-info-light")
                                        //here we are in process of delivering 
                                        child_temp.querySelector(".status").textContent = "Așteptăm ridicarea coletului de către curier!";

                                    break;
                                    case 5:  
                                        child_temp.querySelector("div").classList.add("bg-success-light")
                                    child_temp.querySelector(".status").textContent = "Propunerea a fost acceptată!";
                                    break;
                                    case 6:
                                        child_temp.querySelector("div").classList.add("bg-success-light")
                                        child_temp.querySelector(".status").textContent = "Comanda a fost livrată prin curier!";
                                    break;
                                    case 7:
                                        child_temp.querySelector("div").classList.add("bg-danger-light")
                                        child_temp.querySelector(".status").textContent = "Propunerea a fost refuzată de către fermier!";

                                    break;
                                    case 8:
                                        child_temp.querySelector("div").classList.add("bg-danger-light")
                                        child_temp.querySelector(".status").textContent = "Propunerea a fost refuzată de tine!";
                                    break;
                                    case 9:
                                        child_temp.querySelector("div").classList.add("bg-success-light")
                                        child_temp.querySelector(".status").textContent = " Comandă finalizată (clientul ridică personal produsele)";
                
                                    break;
                            }
                            

                            child_temp.querySelector(".courier").textContent = couriers[data[index].courier_id];
                            child_temp.querySelector(".final_cost").textContent = data[index].cost ? data[index].cost : "asteptam raspuns de la fermier";
                            if (point_totals[data[index]['child_order_id']])
                            {
                                point_totals[data[index]['child_order_id']] += parseFloat(parseInt(data[index].qty) * parseFloat(data[index].price));
                            }
                            else{
                                point_totals[data[index]['child_order_id']] = parseFloat(parseInt(data[index].qty) * parseFloat(data[index].price));

                            }
                            child_temp.querySelector(".prods").appendChild(get_tr_prod(data[index]));

                            if(frag.querySelectorAll(".col-12[data-big_id='"+data[index].order_id+"'] .small_orders .row[data-farmer_slug='"+data[index].farmer_slug+"']").length == 0){
                                //create 
                                let farmer_div = document.createElement("div");
                                farmer_div.className = "row align-items-center";
                                farmer_div.style = "border-left: 5px solid black;margin-top: 20px";
                                farmer_div.dataset.farmer_slug = data[index].farmer_slug;

                                let image_col = document.createElement("div");
                                image_col.className = "col-auto mb-2";
                                image_col.style = "font-size: 18px; font-weight: bold"
                                image_col.textContent = "Produse vândute de: ";

                                let img = document.createElement("img");
                                img.style = "width: 60px; height: 60px; border-radius: 50%;box-shadow: 0px 0px 5px black;margin-left: 10px"
                                if (data[index].farmer_image)
                                img.src = "/profile_uploads/"+data[index].farmer_image;
                                else{
                                    img.src = '/assets/images/apppictures/3.jpg';
                                }

                                let name_col = document.createElement("div");
                                name_col.className = "col-auto mb-2";
                                name_col.style.fontSize = "18px";
                                name_col.textContent = data[index].bis_name || "Nedefinit";

                                
                                image_col.appendChild(img);
                                farmer_div.appendChild(image_col);
                                farmer_div.appendChild(name_col);
                                farmer_div.appendChild(child_temp);
                                frag.querySelector(".col-12[data-big_id='"+data[index].order_id+"'] .small_orders ").appendChild(farmer_div)
                            }
                            else{
                                //add to the farmer div 
                                frag.querySelector(".col-12[data-big_id='"+data[index].order_id+"'] .small_orders .row[data-farmer_slug='"+data[index].farmer_slug+"']").appendChild(child_temp)

                            }

                            //now add this child to parent 
                           // frag.querySelector(".col-12[data-big_id='"+data[index].order_id+"'] .small_orders").appendChild(child_temp);
                            }
                        }
                    }   
                    console.log(point_totals);
                    Object.keys(point_totals).map((elem)=>{
                        frag.querySelector(".col-12[data-small_id='"+elem+"'] .total").innerHTML = `<b>Total: </b>${parseFloat(point_totals[elem]).toFixed(2)} RON`
                    })
                    document.getElementById("orders").appendChild(frag);
                }
            }
        })
}

function open_proposal(order_id){
    //open the 
    let parent =document.querySelector(".proposal_container"); 
    parent.style.display = "block";
    parent.querySelectorAll("span")[0].textContent = order_id;
    parent.querySelector(".send_prop").onclick = null;
    parent.querySelector(".send_prop").onclick = function(){
        send_prop(order_id);
    };
    
}

function close_prop(){
    document.querySelector(".proposal_container").style.display = "none";

}

function send_prop(order_id){
    let data = {};
    data.order_id = order_id;
    data.proposal = document.querySelector("#proposal_select").value;
    data.comments = document.querySelector("#proposal_comments").value;

    $.ajax({
        url: "/send_proposal",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function(data){
            console.log(data);
            if (data == "OK")
            {
                refresh_order(order_id);

                notify.show_success("Succes!","Propunerea a fost trimisa");
                close_prop();
            }
            else{
                if (data.err)
                notify.show_error("Eroare!",data.err);
                else
                {
                    notify.show_error("Eroare!","Te rugam sa incerci mai tarziu!");

                }
            }
        }
    })
}
function accept_order(order_id)
{
    $.ajax({
        url: "/accept_order",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"order_id":order_id}),
        success: function(data){
            refresh_order(order_id);
            if (data == "OK")
            {
                alert("Comanda a fost acceptata");
            }
        }
    })
}

function decline_order(order_id){
    $.ajax({
        url: "/decline_order",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"order_id":order_id}),
        success: function(data){
            refresh_order(order_id);
            console.log(data);
        }
    })
}

function refresh_order(order_id){
        let working_elem = null;
        Array.from(document.querySelectorAll(".small_orders div")).forEach(elem=>{
           if (elem.dataset.small_id == order_id){
                working_elem = elem;
           }
        })
        if (working_elem){
            $.ajax({
                url: "/refresh_order",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({"order_id":order_id}),
                success: function(data){
                    if (data && data.err){
                        window.location.reload();
                    }
                    else{
                        //we have something to work on 
                        //remove the buttons 
                        working_elem.querySelector(".acc").parentElement.parentElement.parentElement.parentElement.remove();
                        //update status 
                        switch(parseInt(data[0].status)){

                                case 3:
                                    working_elem.querySelector(".status").textContent = "Waiting for farmer response";
                                break;
                                case 4:
                                    working_elem.querySelector(".status").textContent = "Waiting for the courier to pick up the order! It's coming soon!";
                                break;
                        }
                    }
                }
            })
        }
        else{
            window.location.reload();
        }
}


function get_tr_prod(data)
{
    let tr = document.querySelector("#prod_row_temp").content.cloneNode(true);
    
    if (data.prod_image)
    {
        tr.querySelector("img").src = "/uploads/"+data.prod_image;
    }

    tr.querySelector(".nume").textContent = data.name;
    tr.querySelector(".cant").textContent = data.qty + " unități";
    tr.querySelector(".pr").textContent = data.price+ " RON";
    tr.querySelector(".tot").textContent = parseFloat(parseInt(data.qty) *  parseFloat(data.price)) + " RON";
    return tr;
}

function export_pdf(order_id){
    console.log(order_id);
    $.ajax({
        url: "/get_small_order_pdf",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"order_id": order_id}),
        success: function(data){
            console.log(data);
            
          init_pdf();
          add_image().then((response)=>{
              gen(data[0].bis_name,data[0].nume,`${data[0].judet_from}, ${data[0].oras_from}, ${data[0].adresa_from}`,`${data[0].judet_to}, ${data[0].oras_to}, ${data[0].strada_to}`,[data[0].parent_order,order_id,process_date(data[0].date),"Fermier",(data[0]?.cost || "-")]);
         
                JSON.parse(data[0].prods).map(prod=>{
                    create_row(prod.name.toString(),`${prod.qty} x bucati`,`${prod.price} RON`,"100 RON");
                })
                done(order_id);
            })
        },error: function(){
            notify.show_error("Eroare!","Te rugăm să încerci mai târziu!");
        }
    })
}