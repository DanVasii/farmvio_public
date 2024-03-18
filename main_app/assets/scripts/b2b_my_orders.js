$(document).ready(function(){
    parse_b2b_orders();
})

function parse_b2b_orders(){
    $.ajax({
        url: "/my_orders",
        type: "POST",
        contentType: "application/json",
        success: function(data){
            console.log(data);
            //start parsing em  
            let already_coms = {};
             let temp,frag,parent,prod_temp,old_tag;
            console.log(data);
            if (data && data.length!=0){
                data.map(elem=>{
                    let order_id = elem.order_id;
                    let cid = elem.cid;
                    if (already_coms[order_id]){
                        //just add 
                        if (!elem.name && elem.prod_keyw!=""){
                            //special order
                            prod_temp = document.querySelector("#custom_order_temp").content.cloneNode(true);
                            prod_temp.querySelector(".row").dataset.cid = elem.cid;
    
                            //populate tags now 
                            let words = elem.prod_keyw.split(",");
                            words.map(word=>{
                                if (word.trim()!=""){
                                    span = document.createElement("span");
                                    span.className = "old_tag";
                                    span.textContent = word;
                                    prod_temp.querySelector(".tags_col").appendChild(span);
                                }
                            })
    
                            //populate details 
                            prod_temp.querySelector(".details_col").textContent = elem.prod_details;
                            //populate qty 
                            prod_temp.querySelector(".qty_col").textContent = elem.prod_qty + " unitati";
    
    
                            already_coms[order_id].querySelector(".order_content").appendChild(prod_temp);
                        }
                        else{
                            //normal 
                            prod_temp = document.querySelector("#normal_prod").content.cloneNode(true);    
    
                            prod_temp.querySelector(".row").dataset.cid = elem.cid;
                            //set image 
                            if (elem.image!="")
                            prod_temp.querySelector(".image_col img").src = "/uploads/"+elem.image;
                            
                            //set name 
                            prod_temp.querySelector(".name_col").textContent = elem.name;
    
                            //set qty 
                            prod_temp.querySelector(".qty_col").textContent = elem.prod_qty + " unitati ";
    
                            //set adresa 
                            prod_temp.querySelector(".adresa_col").textContent = elem.judet+", "+elem.oras+", "+elem.adresa;
    
                            already_coms[order_id].querySelector(".order_content").appendChild(prod_temp);
                          
    
                        }
                    }
                    else{
                        //create 
                        temp = document.querySelector("#order_temp").content.cloneNode(true);
                        temp.querySelector(".order_id").textContent = order_id;
                      temp.querySelector(".order_status").textContent = get_status(elem.order_status);
                      let date = elem.order_time.split("T");
                        temp.querySelector(".order_date").textContent = convertDigitIn(date[0])+ "  "+date[1].split(".")[0];

                        if (elem.final == 0)
                        {
                            temp.querySelector(".see_final").disabled = true;
                        }
                        else{
                            temp.querySelector(".see_final").onclick = function(){
                                get_final_offer(order_id,elem.order_status);
                            }
                        }

                        if (elem.name == "" && elem.prod_keyw!=""){
                            //special order
                            prod_temp = document.querySelector("#custom_order_temp").content.cloneNode(true);
                            prod_temp.querySelector(".row").dataset.cid = elem.cid;
    
                            //populate tags now 
                            let words = elem.prod_keyw.split(",");
                            words.map(word=>{
                                if (word.trim()!=""){
                                    span = document.createElement("span");
                                    span.className = "old_tag";
                                    span.textContent = word;
                                    prod_temp.querySelector(".tags_col").appendChild(span);
                                }
                            })
    
                            //populate details 
                            prod_temp.querySelector(".details_col").textContent = elem.prod_details;
                            //populate qty 
                            prod_temp.querySelector(".qty_col").textContent = elem.prod_qty + " unitati";    
                           
    
                            temp.querySelector(".order_content").appendChild(prod_temp);
                        }
                        else{
                            //normal 
                            prod_temp = document.querySelector("#normal_prod").content.cloneNode(true);
                            prod_temp.querySelector(".row").dataset.cid = elem.cid;
    
                            //set image 
                            if (elem.image!="")
                            prod_temp.querySelector(".image_col img").src = "/uploads/"+elem.image;
                            
                            //set name 
                            prod_temp.querySelector(".name_col").textContent = elem.name;
    
                            //set qty 
                            prod_temp.querySelector(".qty_col").textContent = elem.prod_qty + " unitati ";
    
    
                            //set adresa 
                            prod_temp.querySelector(".adresa_col").textContent = elem.judet+", "+elem.oras+", "+elem.adresa;
    
                            temp.querySelector(".order_content").appendChild(prod_temp);
    
                        }
                        already_coms[order_id] = temp;
                    }
                })
                
                for (index in already_coms){
                    document.querySelector("#orders").append(already_coms[index]);
    
                }
            }

        },error: function(){
            alert("eroare de server")
        }
    })
}

function get_status(order_status){
    order_status = parseInt(order_status);

    switch(order_status){
        case 0:
            return "In procesare";
        case 1: 
        return "Asteptare raspuns";
        case 2: 
        return "Comanda acceptata";
        case 3:
            return "Comanda refuzata";
    }
}

function convertDigitIn(str){
    return str.split('-').reverse().join('-');
 }

 function get_final_offer(order_id,status){

    document.querySelector(".product_searcher").dataset.order_id = order_id;
    get_costs(order_id);

     document.querySelector(".product_searcher").style.transform = "scale(1)";
     document.querySelector(".product_searcher_bg").style.visibility = "visible";
     document.querySelector(".product_searcher_bg").style.opacity = "1";
    $.ajax({
        url: "/get_final_offer_client",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"order_id":order_id}),
        success: function(data){
            if (status != 1)
            {
                document.querySelector(".product_searcher .actions").style.display = "none";
            }
            else
            document.querySelector(".product_searcher .actions").style.display = "flex";

            console.log(data);
            //remove all of em 
            Array.from(document.querySelectorAll(".final_prod_bid")).forEach(elem=>{
                elem.remove();
            })
            if (data && data.length!=0)
            {
                ///set the order_id 
                let frag,already_added = {},span,bid_temp;
                data.map(bid=>{
                    if (already_added[bid.id])
                    {
                        temp = already_added[bid.id];


                         //check the prod_type 
                         if (bid.original_prod_id == -1){
                             if (bid.name!=null){
                            //custom           

                                 //add the bid 

                                 bid_temp = document.querySelector("#bid_container").content.cloneNode(true);
                                 bid_temp.querySelector(".prod_name").textContent = bid.name;
                                 bid_temp.querySelector(".del_from").textContent = bid.judet+", "+bid.oras+", "+bid.adresa;;
                                 bid_temp.querySelector(".sold_by").textContent = bid.bis_name;
                                 bid_temp.querySelector(".new_price").textContent = bid.new_price+" RON pentru "+bid.new_qty + " unitati";
                                 if (bid.image){
                                    bid_temp.querySelector(".prod_image img").src = "/uploads/"+bid.image;
                                }
     
                                 temp.querySelector(".bids").appendChild(bid_temp);
                             }

                        }
                        else
                        {
                            //normal prod 
                            if (bid.name!=null){
                            //add the bid 

                             bid_temp = document.querySelector("#bid_container").content.cloneNode(true);
                            bid_temp.querySelector(".prod_name").textContent = bid.name;
                            bid_temp.querySelector(".del_from").textContent = bid.judet+", "+bid.oras+", "+bid.adresa;;
                            bid_temp.querySelector(".sold_by").textContent = bid.bis_name;
                            bid_temp.querySelector(".new_price").textContent = bid.new_price+" RON pentru "+bid.new_qty + " unitati";

                            if (bid.image){
                                bid_temp.querySelector(".prod_image img").src = "/uploads/"+bid.image;
                            }
                            temp.querySelector(".bids").appendChild(bid_temp);
                            }

                        }
                    }
                    else{
                        //create 
                        let temp = document.querySelector("#prod_bids").content.cloneNode(true);
                        console.log(bid.id);
                        //check the prod_type 
                        if (bid.original_prod_id == -1){
                            
                            //custom 
                            temp.querySelector(".prod_image").remove();
                            temp.querySelector(".prod_name").remove();
                            temp.querySelector(".del_from").remove();
                            temp.querySelector(".sold_by").remove();

                            //set the needed dataa 
                            let words = bid.prod_keyw.split(',');
                            words.map(word=>{
                                if (word.trim()!=""){
                                    //create 
                                     span = document.createElement("span");
                                    span.className = "old_tag";
                                    span.textContent = word;
                                    temp.querySelector(".prod_keyw").appendChild(span);
                                }
                            })
                             span = document.createElement("span");
                            span.textContent = bid.prod_details;
                            temp.querySelector(".prod_details").appendChild(span);
                            temp.querySelector(".original_qty").textContent = bid.original_qty +" unitati";
                            temp.querySelector(".original_qty").style.paddingTop = "10px";

                            

                                 //add the bid 
                            if (bid.name!=null){
                                 bid_temp = document.querySelector("#bid_container").content.cloneNode(true);
                                 bid_temp.querySelector(".prod_name").textContent = bid.name;
                                 bid_temp.querySelector(".del_from").textContent = bid.judet+", "+bid.oras+", "+bid.adresa;;
                                 bid_temp.querySelector(".sold_by").textContent = bid.bis_name;
                                 bid_temp.querySelector(".new_price").textContent = bid.new_price+" RON pentru "+bid.new_qty + " unitati";
                                

                                 if (bid.image){
                                     bid_temp.querySelector(".prod_image img").src = "/uploads/"+bid.image;
                                 }

                                 temp.querySelector(".bids").appendChild(bid_temp);

                            }
                            already_added[bid.id] = temp;
                        }
                        else
                        {
                            //normal prod 

                            //remove 
                            temp.querySelector(".prod_keyw").remove();
                            temp.querySelector(".prod_details").remove();

                            //set 
                            temp.querySelector(".prod_name").textContent = bid.original_name;
                            temp.querySelector(".del_from").textContent = bid.original_judet+", "+bid.original_oras+", "+bid.original_adresa;
                            temp.querySelector(".sold_by").textContent = bid.original_farmer;
                            temp.querySelector(".original_qty").textContent = bid.original_qty +" unitati";
                            if (bid.original_image){
                                temp.querySelector(".prod_image img").src = "/uploads/"+bid.original_image;
                            }
                            //add the bid 
                            if(bid.name!=null){
                             bid_temp = document.querySelector("#bid_container").content.cloneNode(true);
                            bid_temp.querySelector(".prod_name").textContent = bid.name;
                            bid_temp.querySelector(".del_from").textContent = bid.judet+", "+bid.oras+", "+bid.adresa;;
                            bid_temp.querySelector(".sold_by").textContent = bid.bis_name;
                            bid_temp.querySelector(".new_price").textContent = bid.new_price+" RON pentru "+bid.new_qty + " unitati";

                            if (bid.image){
                                bid_temp.querySelector(".prod_image img").src = "/uploads/"+bid.image;
                            }
                            }

                            temp.querySelector(".bids").appendChild(bid_temp);

                            already_added[bid.id] = temp;
                        }
                    }
                })

                Object.keys(already_added).map(key=>{
                    document.querySelector(".bids").appendChild(already_added[key]);

                })

                //we should add the no products found 
                Array.from(document.querySelectorAll(".final_prod_bid .bids")).forEach(elem=>{
                    if (elem.querySelectorAll("*").length==0){
                        elem.innerHTML = "<b style='margin-left: 10px'>Nu au fost gasite produse sau cereri de oferta</b>";
                    }
                })
            }

        }
    })      
 }

 function exit_final_offer()
 {
     
    document.querySelector(".product_searcher").style.transform = "scale(0)";
    document.querySelector(".product_searcher_bg").style.visibility = "hidden";
    document.querySelector(".product_searcher_bg").style.opacity = "0";
 }



 function get_costs(order_id){
     $.ajax({
         url: "/b2b_get_costs",
         type: "POST",
         contentType: "application/json",
         data: JSON.stringify({"order_id":order_id}),
         success: function(data){
             console.log(data);
            if (data && data.length!=0){
                data = data[0];
                document.querySelector(".actions").style.display = "flex";

                document.querySelector(".price_comanda").innerHTML = `<strong>Pret comanda: </strong> ${data.price_total} RON`;
                document.querySelector(".price_transport").innerHTML = `<strong>Pret transport: </strong> ${data.price_transport} RON`;
                document.querySelector(".comision_final").innerHTML = `<strong>Comision farmvio: </strong> ${data.comision} RON`;
                document.querySelector(".total_final").innerHTML = `<strong>Total de plata: </strong> ${parseInt(data.comision) + parseInt(data.price_total)+parseInt(data.price_transport)} RON`;
            }
            else{
                //hide the action_btns
                document.querySelector(".actions").style.display = "none";
            }
         }
     })
 }

 function accept_order()
 {
     //for the current order_idn
     let order_id = document.querySelector(".product_searcher").dataset?.order_id;
     if (order_id){
        //we should ajax to accept endpoint 
        $.ajax({
            url: "/accept_b2b_final_order",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({"order_id":order_id}),
            success: function (data){
                alert("accepted");
                exit_final_offer();
                Array.from(document.querySelectorAll(".order_datas")).forEach(elem=>{
                    if (elem.querySelector(".order_id").textContent.trim() == order_id.trim())
                    {
                        elem.querySelector(".order_status").textContent = "Comanda acceptata";
                        elem.querySelector("button").onclick = null;
                        elem.querySelector("button").onclick = function(){
                            get_final_offer(order_id,2);
                        }
                    }
                })
            }
        })
     }
 }

 function decline_order()
 {
     //for the current order_idn
     let order_id = document.querySelector(".product_searcher").dataset?.order_id;
     if (order_id){
        //we should ajax to accept endpoint 
        $.ajax({
            url: "/decline_b2b_final_order",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({"order_id":order_id}),
            success: function (data){
                alert("accepted");
                exit_final_offer();
                Array.from(document.querySelectorAll(".order_datas")).forEach(elem=>{
                    if (elem.querySelector(".order_id").textContent.trim() == order_id.trim())
                    {
                        elem.querySelector(".order_status").textContent = "Comanda refuzata";
                        elem.querySelector("button").onclick = null;
                        elem.querySelector("button").onclick = function(){
                            get_final_offer(order_id,3);
                        }
                    }
                })
            }
        })
     }
 }