
var couriers = {};
$(document).ready(function(){

    $.when(get_couriers()).done(function(){
        get_money();
        get_order_stats();
    })
})
function get_order_stats()
{
    $.ajax({
        url: "/order_stats",
        type: "POST",
        contentType: "application/json",
        success: function(data){
            console.log(data);
            document.querySelector("#pending_orders").textContent = data[0].pending_order ;
            document.querySelector("#sent_orders").textContent = data[1].pending_order;
            document.querySelector("#completed_orders").textContent = data[2].pending_order;
        }
    })
}
function get_money()
{
    $.ajax({
        url: "/colete_money",
        type: "POST",
        contentType: "application/json",
        success: function(data){
            document.querySelector("#money").textContent = data.price;
        }
    })
}
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
                console.log(couriers);
                populate_orders();
            }
            else{
                alert("Server error, try refreshing the page!");
            }
        }
    })
}
function populate_orders(){
    $.ajax({
        url: "/orders",
        type: "POST",
        contentType: "application/json",
        success: function(data){
            console.log(data);
            let already = [];
           if (data && data.length!=0){
               //show the orders 
               let frag = document.createDocumentFragment();
                for (index in data){
                    if (!already.includes(data[index].child_order_id)){

                    let temp = document.getElementById("order_temp").content.cloneNode(true);
                    let order_id = data[index].child_order_id;
                    let user_id  = data[index].by_user_id;
                    temp.querySelector(".col-12").dataset.wpid = order_id;
                    temp.querySelector(".order_item").dataset.wpid = order_id;
                    temp.querySelector(".nr_cmd").textContent = order_id;
                    temp.querySelector(".courier").textContent = "Curier - "+couriers[data[index].courier_id];

                        //contact user listener 
                        temp.querySelector(".contact_user_btn").onclick = function(){
                            show_user_contact(this,order_id);
                        }

                        temp.querySelector(".message_user").onclick = function(){
                            send_new_user(user_id);
                        }

                    //set the status 
                    let status = parseInt(data[index].status);
                    let coms = data[index].comments;
                    let prop = data[index].prop_id;
                    let strong,span;
                    switch(status){
                        case 0: 
                        temp.querySelector(".status").innerHTML = " <i class='fas fa-circle text-primary'></i> Asteptare estimare pret transport";
                        temp.querySelector(".action_btn").textContent = "Trimite estimare pret";
                        temp.querySelector(".action_btn").onclick = function(){
                            cost_estimate(order_id);
                        }
                        break;
                        case 1: 
                        //we wait for user's response
                        temp.querySelector(".status").innerHTML = " <i class='fas fa-circle text-danger'></i> Asteptare raspuns client";
                        temp.querySelector(".action_btn").textContent = "Asteptare raspuns de la client";
                        temp.querySelector(".action_btn").disabled = true;
                        break;
                        case 2: 
                        temp.querySelector(".status").innerHTML = " <i class='fas fa-circle text-success'></i> Comanda acceptata de catre client";
                        temp.querySelector(".action_btn").textContent = "Trimite curier";   
                        temp.querySelector(".action_btn").onclick = function(){
                            order_courier(order_id);
                        }
                        break;
                        case 3:
                        
                        //get client proposal 
                        let prop_temp = document.getElementById("proposal").content.cloneNode(true) ;
                        prop_temp.querySelector(".proposed_method").textContent = get_prop(prop);
                        prop_temp.querySelector(".proposed_coms").textContent = coms; 
                        temp.querySelector(".status").innerHTML = " Clientul a propus alta metoda!";
                            //show the buttons 
                            let temp_buttons = document.querySelector("#button_temp").content.cloneNode(true);

                            //add the click lisetner to the new accept decline buttons 
                            temp_buttons.querySelector('.acc').onclick = function(){
                                accept_offer(order_id);
                            }
                            temp_buttons.querySelector('.dec').onclick = function(){
                                decline_offer(order_id);
                            }

                            //remove the prev button 
                            temp.querySelector(".action_btn").remove();
                            
                            temp.querySelector(".order_item").appendChild(prop_temp);
                            temp.querySelector(".order_item").appendChild(temp_buttons);
                        break;
                        case 4:
                            temp.querySelector(".status").innerHTML = " In curs de livrare ";
                            temp.querySelector(".action_btn").textContent = " Detalii livrare";
                            temp.querySelector(".action_btn").onclick = function(){
                                    show_courier_stats(order_id);
                            }
                        break;
                        case 5:
                            //status when the order is finished after farmer has accepted the offer 
                            temp.querySelector(".status").innerHTML = " Comanda finalizata prin acceptarea propunerii ";
                            temp.querySelector(".courier").innerHTML = get_prop(prop);
                            //add the proposal comments 
                            strong = document.createElement("strong");
                            strong.textContent = "Comentarii metoda livrare: ";
                            span = document.createElement("span");
                            span.textContent = coms;
                            temp.querySelector(".col-12").insertBefore(strong, temp.querySelector(".contact_user_btn"));
                            temp.querySelector(".col-12").insertBefore(span, temp.querySelector(".contact_user_btn"));
                            temp.querySelector(".col-12").insertBefore(document.createElement("br"), temp.querySelector(".contact_user_btn"));
                            temp.querySelector(".action_btn").textContent = "Comanda finalizata";
                            temp.querySelector(".action_btn").disabled = true;
                            
                        break;

                        case 7:
                            //cancelled by farmer
                            temp.querySelector(".status").innerHTML = " Comanda anulata prin refuzul propunerii de la client";
                            temp.querySelector(".action_btn").textContent = "Comanda anulata";
                            temp.querySelector(".action_btn").disabled = true;
                            

                            strong = document.createElement("strong");
                            strong.textContent = "Metoda de livrare propusa: ";
                            span = document.createElement("span");
                            span.textContent = get_prop(prop);
                            temp.querySelector(".col-12").insertBefore(strong, temp.querySelector(".contact_user_btn"));
                            temp.querySelector(".col-12").insertBefore(span, temp.querySelector(".contact_user_btn"));
                            temp.querySelector(".col-12").insertBefore(document.createElement("br"), temp.querySelector(".contact_user_btn"));

                             strong = document.createElement("strong");
                            strong.textContent = "Comentarii metoda livrare propusa: ";
                            span = document.createElement("span");
                            span.textContent = coms;
                            temp.querySelector(".col-12").insertBefore(strong, temp.querySelector(".contact_user_btn"));
                            temp.querySelector(".col-12").insertBefore(span, temp.querySelector(".contact_user_btn"));
                            temp.querySelector(".col-12").insertBefore(document.createElement("br"), temp.querySelector(".contact_user_btn"));
                        break;
                        case 8:
                            //order canceleed by the client 
                            temp.querySelector(".status").innerHTML = " Comanda anulata de catre client";
                            temp.querySelector(".action_btn").textContent = "Comanda anulata";
                            temp.querySelector(".action_btn").disabled = true;
                        break;
                    }


                    //append the prod 
                    let li = document.createElement("li");
                    li.textContent = data[index].qty+" X "+data[index].name;

                    temp.querySelector(".prods").appendChild(li);
                    frag.appendChild(temp);
                    already.push(data[index].child_order_id);
                }
                else{
                    //we just append the prod 
                    let parent = frag.querySelector(".order_item[data-wpid='"+data[index].child_order_id+"']");
                    let li = document.createElement("li");
                    li.textContent = data[index].qty+" X "+data[index].name;

                    parent.querySelector(".prods").appendChild(li);
                }
                }

                document.getElementById("orders").appendChild(frag);
           }
        }
    })
}

function get_prop(prop){
    switch(parseInt(prop))
    {
        case -2:
            return "Ridicare personala";
        case -3:
            return "Livrare de catre fermier prin alte metode";
        case -4:
            return "Alta metoda";

    }
}
function cost_estimate(order_id){
   //open the pop_window 
   document.getElementsByClassName("pop_window")[0].dataset.order_id = order_id;
   document.getElementsByClassName("pop_window")[0].style.display = "flex";
   document.getElementsByClassName("pop_window")[0].getElementsByClassName("bg-gradient-success")[0].onclick = function(){
       send_estimate(order_id);
   }
}

function order_courier(order_id){
    $.ajax({
        url: "/order_courier",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"order_id":order_id}),
        success: function(data){
            refresh_state(order_id);

            console.log(data);
        }
    })
}

function close_pop(){
    document.getElementsByClassName("pop_window")[0].dataset.order_id = 0;
    document.getElementsByClassName("pop_window")[0].style.display = "none";
}
function send_estimate(order_id){
    
    let delivery_data = {};
    delivery_data.weight = document.getElementById("weight").value;
    delivery_data.len = document.getElementById("len").value;
    delivery_data.width = document.getElementById("width").value;
    delivery_data.height = document.getElementById("height").value;

    $.ajax({
        url: "/send_delivery_cost",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"order_id":order_id,"sizes":delivery_data}),
        success: function(data){
            refresh_state(order_id);
            console.log(data);
        }
    })
}

function show_courier_stats(order_id){
    $.ajax({
        url: "/courier_stats",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"order_id":order_id}),
        success: function(data){
            console.log(data);
        }

    })
}

    function show_user_contact(elem,order_id)
    {
        if (elem.parentElement.querySelectorAll(".user_contact_infos li").length == 0){
        $.ajax({
            url: "/get_client_contact",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({"order_id":order_id}),
            success: function(data){
                if (data)
                {
                    let ul = elem.parentElement.querySelector(".user_contact_infos");
                    //we now create 2 li's 
                    let li;
                    li = document.createElement("li");
                    li.innerHTML = "<strong>Nume:</strong> "+ ((data.nume && data.nume.trim().length!=0) ? data.nume : "-");
                    ul.appendChild(li);

                    li = document.createElement("li");
                    li.innerHTML = "<strong>Telefon: </strong>"+ ((data.telefon && data.telefon.trim().length!=0) ? data.telefon : "-");
                    ul.appendChild(li);
                    ul.style.maxHeight = "100px";
                    elem.textContent = "Hide user contact";
                }
                else{
                    //notify.show_error("Server error!","Please try again later!");
                }
            }

        })
    }
    else{
        //we have something , now let's check what the button says 
        if (parseInt(elem.parentElement.querySelector(".user_contact_infos").style.maxHeight)!=0)
        {
            //then we hide it 
            elem.parentElement.querySelector(".user_contact_infos").style.maxHeight = "0px";
            elem.textContent = "Contact user";
        }
        else{
            elem.parentElement.querySelector(".user_contact_infos").style.maxHeight = "100px";
            elem.textContent = "Hide user contact";
        }
    }
    }


    function accept_offer(order_id){
        $.ajax({
            url: '/accept_offer',
            type: 'POST',
            contentType: "application/json",
            data: JSON.stringify({"order_id":order_id}),
            success: function(data){
                refresh_state(order_id);
                console.log("refreshed");
                console.log(data);
            }
        })
    }
    function decline_offer(order_id){
        $.ajax({
            url: '/decline_offer',
            type: 'POST',
            contentType: "application/json",
            data: JSON.stringify({"order_id":order_id}),
            success: function(data){
                refresh_state(order_id);
                console.log(data);
            }
        })
    }


    function refresh_state(order_id){
        //search through all the orders the one with this wpid
        let working_elem = null;
        Array.from(document.querySelectorAll(".order_item")).forEach(elem=>{
            if (elem.dataset.wpid.trim() == order_id.trim())
            {
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
                        data = data[0];
                        let status = data.status;
                        let strong,span,btn,strongs,spans;
                        switch(status){
                            case 1:
                                working_elem.querySelector(".status").innerHTML = " <i class='fas fa-circle text-danger'></i> Asteptare raspuns client";
                                working_elem.querySelector(".action_btn").textContent = "Asteptare raspuns de la client";
                                working_elem.querySelector(".action_btn").disabled = true;
                                working_elem.querySelector(".action_btn").onclick = null;
                            break;
                            case 4:
                                working_elem.querySelector(".status").innerHTML = " In curs de livrare ";
                                working_elem.querySelector(".action_btn").textContent = " Detalii livrare";
                                working_elem.querySelector(".action_btn").onclick = null;
                                working_elem.querySelector(".action_btn").onclick = function(){
                                        show_courier_stats(order_id);
                                }
                            break;
                            case 5:
                                //first remove the acc dec bts
                                working_elem.querySelector(".acc").parentElement.parentElement.parentElement.parentElement.remove();
                                //remove the last 2 spans and strongs
                                strongs = working_elem.querySelectorAll("strong");
                                spans  =working_elem.querySelectorAll("span");
                                strongs[strongs.length-1].remove();
                                strongs[strongs.length-2].remove();
                                spans[spans.length-1].remove();
                                spans[spans.length-2].remove();

                                btn = document.createElement("button");
                                btn.type = "button";
                                btn.className = "waves-effect waves-light btn btn-primary mb-5 action_btn";
                               
                                //add the action btn 
                                working_elem.querySelector(".status").innerHTML = " Comanda finalizata prin acceptarea propunerii ";
                                working_elem.querySelector(".courier").innerHTML = get_prop(data.prop_id);
                                //add the proposal comments 
                                strong = document.createElement("strong");
                                strong.textContent = "Comentarii metoda livrare: ";
                                span = document.createElement("span");
                                span.textContent = data.comments;
                                working_elem.insertBefore(strong, working_elem.querySelector(".contact_user_btn"));
                                working_elem.insertBefore(span, working_elem.querySelector(".contact_user_btn"));
                                working_elem.insertBefore(document.createElement("br"), working_elem.querySelector(".contact_user_btn"));

                                btn.textContent = "Comanda finalizata";
                                btn.disabled = true;
                                working_elem.appendChild(btn);
                                break;
                                case 7:
                                    //remove prev 
                                    working_elem.querySelector(".acc").parentElement.parentElement.parentElement.parentElement.remove();
                                    strongs = working_elem.querySelectorAll("strong");
                                    spans  =working_elem.querySelectorAll("span");
                                    strongs[strongs.length-1].remove();
                                    strongs[strongs.length-2].remove();
                                    spans[spans.length-1].remove();
                                    spans[spans.length-2].remove();

                                //cancelled by farmer
                                working_elem.querySelector(".status").innerHTML = " Comanda anulata prin refuzul propunerii de la client";
                   
                                

                                strong = document.createElement("strong");
                                strong.textContent = "Metoda de livrare propusa: ";
                                span = document.createElement("span");
                                span.textContent = get_prop(data.prop_id);

                                working_elem.insertBefore(strong, working_elem.querySelector(".contact_user_btn"));
                                working_elem.insertBefore(span, working_elem.querySelector(".contact_user_btn"));
                                working_elem.insertBefore(document.createElement("br"), working_elem.querySelector(".contact_user_btn"));

                                strong = document.createElement("strong");
                                strong.textContent = "Comentarii metoda livrare propusa: ";
                                span = document.createElement("span");
                                span.textContent = data.comments;

                                working_elem.insertBefore(strong, working_elem.querySelector(".contact_user_btn"));
                                working_elem.insertBefore(span, working_elem.querySelector(".contact_user_btn"));
                                working_elem.insertBefore(document.createElement("br"), working_elem.querySelector(".contact_user_btn"));

                                btn = document.createElement("button");
                                btn.type = "button";
                                btn.className = "waves-effect waves-light btn btn-primary mb-5 action_btn";
                                btn.textContent = "Comanda anulata";
                                btn.disabled = true;

                                working_elem.appendChild(btn);
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