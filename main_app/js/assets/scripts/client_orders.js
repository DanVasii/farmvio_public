
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
                populate_orders();
            }
            else{
                alert("Server error, try refreshing the page!");
            }
        }
    })
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

                            //now push the child to this template 
                            let child_temp = document.getElementById("small_order").content.cloneNode(true);

                            child_temp.querySelector(".col-12").dataset.small_id = data[index].child_order_id;

                            //now let's populate the child 
                            child_temp.querySelector(".small_order").textContent = data[index].child_order_id;

                            let small_order_id = data[index].child_order_id;

                               switch(parseInt(data[index].status)){
                                case 0:
                                    child_temp.querySelector(".status").textContent = "Waiting for delivery price ";
                                    break;
                                case 1:
                                    child_temp.querySelector(".status").textContent = " Waiting for your decision";
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
                                        child_temp.querySelector(".status").textContent = "Asteptare confirmare fermier";
                                    break;  
                                    case 3:
                                    //here we tell the user that he is waiting for farmer's response
                                    
                                    break;
                                    case 4:
                                        //here we are in process of delivering 
                                        child_temp.querySelector(".status").textContent = "Waiting for the courier to pick up the order! It's coming soon!";

                                    break;
                            }


                            child_temp.querySelector(".courier").textContent = couriers[data[index].courier_id];
                            child_temp.querySelector(".final_cost").textContent = data[index].cost ? data[index].cost : "asteptam raspuns de la fermier";

                            let li = document.createElement("li");
                            li.textContent = data[index].qty+" X "+data[index].name;
                            //ad the current prod
                            child_temp.querySelector(".prods").appendChild(li);
                            
                            temp.querySelector(".small_orders").appendChild(child_temp);

                            frag.appendChild(temp);   
                        }
                        else{
                            //we check if the small_order_id is already created 
                            if (frag.querySelector(".col-12[data-small_id='"+data[index].child_order_id+"']"))
                            {
                                //we can only add the prods 
                                let li = document.createElement("li");
                                li.textContent = data[index].qty+" X "+data[index].name;
                                frag.querySelector(".col-12[data-small_id='"+data[index].child_order_id+"'] .prods").appendChild(li);
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
                                    child_temp.querySelector(".status").textContent = "Waiting for delivery price ";
                                    break;
                                case 1:
                                    child_temp.querySelector(".status").textContent = " Waiting for your decision";
                                    child_temp.querySelector(".col-12").appendChild(document.getElementById("button_temp").content.cloneNode(true));
                                    child_temp.querySelector(".acc").onclick = function(){
                                       accept_order(small_order_id);
                                    }
                                    child_temp.querySelector(".proposal").onclick = function(){
                                        open_proposal(small_order_id);
                                    }
                                    child_temp.querySelector(".dec").onclick = function(){
                                       decline_order(small_order_id);
                                    }
                                    break;
                                    case 2:
                                        child_temp.querySelector(".status").textContent = "Asteptare confirmare fermier";
                                    break;
                                    case 3:
                                        child_temp.querySelector(".status").textContent = "Waiting for farmer response";
                                    break;
                                    case 4:
                                        child_temp.querySelector(".status").textContent = "Waiting for the courier to pick up the order! It's coming soon!";
                                    break;
                            }
                            

                            child_temp.querySelector(".courier").textContent = couriers[data[index].courier_id];
                            child_temp.querySelector(".final_cost").textContent = data[index].cost ? data[index].cost : "asteptam raspuns de la fermier";

                            let li = document.createElement("li");
                            li.textContent = data[index].qty+" X "+data[index].name;
                            //ad the current prod
                            child_temp.querySelector(".prods").appendChild(li);

                            //now add this child to parent 
                            frag.querySelector(".col-12[data-big_id='"+data[index].order_id+"'] .small_orders").appendChild(child_temp);
                            }
                        }
                    }   
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