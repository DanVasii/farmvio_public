var clicked_order = "",notify;
$(document).ready(function(){
    notify = new Notify();
    populate_orders();

    $("#words").on("click","td",function(){

        let elem = this;

        if (elem.classList.contains("active_word"))
        {
            elem.classList.remove("active_word");
            elem.classList.add("banned_word");
        }
        else{
            elem.classList.remove("banned_word");
            elem.classList.add("active_word"); 
        }
    })

    $("#final_bids").on("change","input[type='checkbox']",function(){
        let inputs = document.querySelectorAll("#final_bids input[type='checkbox']");
        let total = 0;
        Array.from(inputs).forEach(elem=>{
            if (elem.checked){
            let row = elem.parentElement.parentElement;
            //find the new_price 
            let new_price = row.querySelector(".new_price").textContent.split("pentru")[0];
            total+= parseInt(new_price);
            }
        })
        //update the total
        document.querySelector("#pret_comanda").value = parseInt(total);
    })
})

function populate_orders()
{
    $.ajax({
        url: "/admin_b2b_orders",
        type: "POST",
        contentType: "application/json",
        success: function(data){
            //let's populate 
            let already_coms = {};
            let temp,frag,parent,prod_temp,old_tag;
            data.map(elem=>{
                let order_id = elem.order_id;
                let cid = elem.cid;
                if (already_coms[order_id]){
                    //just add 
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

                        prod_temp.querySelector(".cauta_produs").onclick = function(){
                            open_prod_searcher(cid);
                        }

                        prod_temp.querySelector(".vezi_oferte").onclick = function(){
                            see_all_offers_for_cid(cid);
                        }
                        already_coms[order_id].querySelector(".order_content").appendChild(prod_temp);
                    }
                    else{
                        //normal 
                        prod_temp = document.querySelector("#normal_prod").content.cloneNode(true);

                        //set send offer button 
                        prod_temp.querySelector(".direct_offer").onclick = function(){
                            send_direct_offer(cid);
                        }

                        //set se offers sent 
                        prod_temp.querySelector(".see_direct_offers").onclick = function(){
                            see_all_offers_for_cid(cid);
                        }

                        prod_temp.querySelector(".row").dataset.cid = elem.cid;
                        //set image 
                        if (elem.image!="")
                        prod_temp.querySelector(".image_col img").src = "/uploads/"+elem.image;
                        
                        //set name 
                        prod_temp.querySelector(".name_col").textContent = elem.name;

                        //set qty 
                        prod_temp.querySelector(".qty_col").textContent = elem.prod_qty + " unitati ";

                        //set price 
                        prod_temp.querySelector(".price_col").textContent = elem.price + " RON/unitate";

                        //set adresa 
                        prod_temp.querySelector(".adresa_col").textContent = elem.adresa;

                        already_coms[order_id].querySelector(".order_content").appendChild(prod_temp);
                      

                    }
                }
                else{
                    //create 
                    temp = document.querySelector("#order_temp").content.cloneNode(true);
                    temp.querySelector(".order_id").textContent = order_id;
                    temp.querySelector("button").onclick = function(){
                        show_final_order(order_id);
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

                        prod_temp.querySelector("button").onclick = function(){
                            open_prod_searcher(cid);
                        }

                        temp.querySelector(".order_content").appendChild(prod_temp);
                    }
                    else{
                        //normal 
                        prod_temp = document.querySelector("#normal_prod").content.cloneNode(true);
                        prod_temp.querySelector(".row").dataset.cid = elem.cid;

                             //set send offer button 
                             prod_temp.querySelector(".direct_offer").onclick = function(){
                                send_direct_offer(cid);
                            }

                        prod_temp.querySelector(".see_direct_offers").onclick = function(){
                            see_all_offers_for_cid(cid);
                        }
                        //set image 
                        if (elem.image!="")
                        prod_temp.querySelector(".image_col img").src = "/uploads/"+elem.image;
                        
                        //set name 
                        prod_temp.querySelector(".name_col").textContent = elem.name;

                        //set qty 
                        prod_temp.querySelector(".qty_col").textContent = elem.prod_qty + " unitati ";

                        //set price 
                        prod_temp.querySelector(".price_col").textContent = elem.price + " RON/unitate";

                        //set adresa 
                        prod_temp.querySelector(".adresa_col").textContent = elem.adresa;

                        temp.querySelector(".order_content").appendChild(prod_temp);

                    }
                    already_coms[order_id] = temp;
                }
            })
            
            for (index in already_coms){
                document.querySelector("#orders").append(already_coms[index]);

            }
        }
    })
}


function open_prod_searcher(order_elem_id)
{
    document.querySelector(".product_searcher").style.transform = "scale(1)";
    document.querySelector(".product_searcher_bg").style.visibility = "visible";
    document.querySelector(".product_searcher_bg").style.opacity = "1";

    let elem = document.querySelector("*[data-cid='"+order_elem_id+"']");
    document.querySelector(".product_searcher_qty").textContent = "Cantitate: "+elem.querySelector(".qty_col").textContent;
    document.querySelector(".product_searcher_det").textContent = "Detalii: "+elem.querySelector(".details_col").textContent;
    clicked_order = order_elem_id;
    //populate words table 
    populate_words_table(order_elem_id);

}

function exit_product_searcher()
{
    document.querySelector(".product_searcher").style.transform = "scale(0)";
    document.querySelector(".product_searcher_bg").style.visibility = "hidden";
    document.querySelector(".product_searcher_bg").style.opacity = "0";
   
}


function populate_words_table(order_elem_id)
{
    $.ajax({
        url: "/get_words",
        type: 'POST',
        contentType: "application/json",
        data: JSON.stringify({"order_elem_id":order_elem_id}),
        success: function(data){
            console.log(data);
            let parent = document.querySelector(".product_searcher table");
            //first remove all the tr

            Array.from(parent.querySelectorAll("tr")).forEach(elem=>{
                elem.remove();
            })
            let tr,td,frag;
            frag = document.createDocumentFragment();
            Object.keys(data).map(word=>{
                tr = document.createElement("tr");
                td = document.createElement("td");
                td.textContent = word;
                td.className = "active_word";
                tr.appendChild(td);
                console.log(data[word]);
                //add matching words 
                data[word].map(match=>{
                    td = document.createElement("td");
                    td.textContent = match.item;
                    td.className = "active_word";

                    tr.appendChild(td);
                })
                frag.appendChild(tr);
            })

            parent.appendChild(frag);
            search_prods();
        }
    })
}


function search_prods()
{
    //first we delete current prods 
    Array.from(document.querySelectorAll("#found_prods div")).forEach(elem=>{
        elem.remove();
    })
    //get list of words 
    $.ajax({
        url: "/admin_prod_search",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"words":get_words(),"order_elem_id":clicked_order}),
        success: function(data){
            console.log(data);
            data.map(elem=>{
                let temp  = document.querySelector("#product_template").content.cloneNode(true);
                //set the images 
                if (!elem.image || elem.image.trim()=="")
                temp.querySelector(".top_content img").src = "/assets/images/icons/no_image.png";
                else{
                    temp.querySelector(".top_content img").src = "/uploads/"+elem.image;
                }
                temp.querySelector(".prod_name").textContent = elem.name;
                temp.querySelector(".distance").textContent = "Distanta: "+parseFloat(elem.distance).toFixed(2) + " Km";
                temp.querySelector("#price").textContent = elem.price+" RON / unitate";
                temp.querySelector(".offer_body").dataset.selected_point = elem.selected_point_id;
                temp.querySelector(".product_card").dataset.prod_id = elem.id;


                if (elem.sent_offers == 0){
                    temp.querySelector(".see_all_offers").textContent = "Nu ai trimis nicio oferta pentru acest produs";
                    temp.querySelector(".see_all_offers").disabled = true;
                }
                else
                temp.querySelector(".see_all_offers").textContent = "Vezi oferte trimise pentru acest produs: ("+elem.sent_offers+")";

                document.querySelector("#found_prods").appendChild(temp);

                //set the offer qty the same for all prods
                Array.from(document.querySelectorAll("#offer_qty")).forEach(elem=>{
                    elem.value = parseInt(document.querySelector(".row[data-cid='"+clicked_order+"'] .qty_col").textContent);
                })
            })
        }
    })
}

function get_words(){
    let words = [];

    let table = document.querySelector("#words");
    Array.from(table.querySelectorAll("td")).forEach(elem=>{
        if (elem.classList.contains("active_word"))
        {
            //add 
            if (elem.textContent.trim()!="")
            words.push(elem.textContent.trim());
        }
    })
    return words;
}


function create_offer(elem)
{
    //open it 
    elem.parentElement.querySelector(".offer_body").style.maxHeight = "150px";
    elem.onclick = null;
    elem.textContent = "Trimite cererea!";
    elem.onclick = function(){
        send_offer(elem);
    }
}

function send_offer(elem)
{
    //get the selected point id 
    let selected_point_id = elem.parentElement.querySelector(".offer_body").dataset.selected_point;
    //get the values 
    let price = elem.parentElement.querySelector("#offer_price").value;
    let qty = elem.parentElement.querySelector("#offer_qty").value;
    if (price.trim()!="" && qty.trim()!="" )
    {
        //send the offer $
        $.ajax({
            url: "/send_offer",
            type: "POST",
            contentType: 'application/json',
            data: JSON.stringify({"price":parseInt(price),"qty":parseInt(qty),"point_id":selected_point_id,"prod_id":elem.parentElement.dataset.prod_id,"cid":clicked_order}),
            success: function(data){
                elem.textContent = "Cererea a fost trimisa!";
                elem.disabled = true;
            },
            error: function(){
                alert("Eroare");
            }
        })
    }   
    else{
        alert("Please complete all the fields required to send the offer!");
    }
}


function see_all_offers(elem){
    //open see all offers 
    document.querySelector(".product_offers").style.transform = "scale(1)";

    $.ajax({
        url: "/get_offers_for_prod",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"order_id":clicked_order,"prod_id":elem.parentElement.dataset.prod_id}),
        success: function(data){
            console.log(data);
            Array.from(document.querySelectorAll(".offer_body_sent")).forEach(elem=>{
                elem.remove();
            })
            if (data.length==0){
                let p = document.createElement("p");
                p.textContent = "Momentan nu ai nicio cerere de oferta!";
                p.style.textAlign = "center";
                p.style.fontSize = "20px";
                document.querySelector("#main_content").appendChild(p);
            }
            else{
                let index_order = [];

                let already_added = {};
                let temp,frag;
                frag = document.createDocumentFragment();

                data.map((offer,index)=>{
                    if (!already_added[offer.offer_id]){
                        temp = document.querySelector("#offer_head").content.cloneNode(true);
                        if (offer.cid!=clicked_order){
                            temp.querySelector(".offer_body_sent").style.backgroundColor = "beige";
                        }
                        //fill in the details
                        temp.querySelector(".product_infos").innerHTML = `Produsul: <b>${offer.name} </b>, vandut de <i><u>${offer.bis_name}</u></i> `;
                        temp.querySelector(".offer_del").innerHTML = `Livrare din punctul: ${offer.judet}, ${offer.oras}, ${offer.adresa}`;
                        //now we add to the already 
                        index_order.push(offer.offer_id);
                        already_added[offer.offer_id] = temp;
                        //now we add the offer 
                        temp = document.querySelector("#offer_body").content.cloneNode(true);
                        

                        let date = offer.sent_at.split("T");
                        
                        temp.querySelector(".date_offer").textContent = reverseString(date[0])+ "  "+date[1].split(".")[0];

                        if (offer.sent_by == "-1")
                        {
                            temp.querySelector(".offer_title").textContent = "Ai trimis o cerere de oferta!";
                            temp.querySelector(".offer_content").innerHTML = "Ai cerut <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";
                        }
                        else if (parseInt(offer.status) == 3){
                            temp.querySelector(".offer_title").textContent = "Ai primit o contra-oferta!";
                            temp.querySelector(".offer_content").innerHTML = "Fermierul iti ofera  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";

                        }
                        else{
                            temp.querySelector(".offer_title").textContent = get_title_for_status(parseInt(offer.status));
                            if (offer.sent_by=="-1")
                            temp.querySelector(".offer_content").innerHTML = "Iti oferim  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";
                            else
                            temp.querySelector(".offer_content").innerHTML = "Ai cerut  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";

                        }

                        if (parseInt(offer.status) == 3 && buttons_needed(data,index)){
                            //we can add the buttons 
                            let btn_temp = document.querySelector("#action_buttons").content.cloneNode(true);
                                         //set the listeners 

                                         btn_temp.querySelector(".btn-success").onclick = function(){
                                            accept_offer(this,offer.offer_id);
                                        }
            
                                        btn_temp.querySelector(".btn-primary").onclick = function(){
                                            show_offer(this,offer.offer_id);
                                        }
            
                                        btn_temp.querySelector(".btn-danger").onclick = function(){
                                            decline_offer(this,offer.offer_id);
                                        }
                            temp.querySelector(".extra").appendChild(btn_temp);
                        }

                        already_added[offer.offer_id].querySelector(".the_request").appendChild(temp);
                    }
                    else{
                        temp = document.querySelector("#offer_body").content.cloneNode(true);
                        let date = offer.sent_at.split("T");
                        temp.querySelector(".date_offer").textContent = reverseString(date[0])+ "  "+date[1].split(".")[0];
                        
                        if (parseInt(offer.status) == 0)
                        {
                            temp.querySelector(".offer_title").textContent = "Ai trimis o cerere de oferta!";
                            temp.querySelector(".offer_content").innerHTML = "Ai cerut <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";

                        }
                        else if (parseInt(offer.status)== 3){
                            temp.querySelector(".offer_title").textContent = "Ai primit o contra-oferta!";
                            temp.querySelector(".offer_content").innerHTML = "Fermierul iti cere  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";

                        }
                        else{
                            temp.querySelector(".offer_title").textContent = get_title_for_status(parseInt(offer.status));
                            if (offer.sent_by=="-1")
                            temp.querySelector(".offer_content").innerHTML = "Fermieul iti ofera  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";
                            else
                            temp.querySelector(".offer_content").innerHTML = "Fermieul iti ofera  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";

                        }

                        if (parseInt(offer.status) == 3 && buttons_needed(data,index)){
                            //we can add the buttons 
                            let btn_temp = document.querySelector("#action_buttons").content.cloneNode(true);
                            //set the listeners 

                            btn_temp.querySelector(".btn-success").onclick = function(){
                                accept_offer(this,offer.offer_id);
                            }

                            btn_temp.querySelector(".btn-primary").onclick = function(){
                                show_offer(this,offer.offer_id);
                            }

                            btn_temp.querySelector(".btn-danger").onclick = function(){
                                decline_offer(this,offer.offer_id);
                            }

                            temp.querySelector(".extra").appendChild(btn_temp);
                        }

                        already_added[offer.offer_id].querySelector(".the_request").appendChild(temp);
                    }
                })
              
                index_order.map(index=>{
                    document.querySelector("#all_offers_sent").appendChild(already_added[index]);
                })
            }
        },error: function(){
            alert("Eroare de server!");
        }
    })

}

function close_offers()
{
    document.querySelector(".product_offers").style.transform = "scale(0)";

}

function reverseString(str){
    return str.split('-').reverse().join('-');


}

function only_one_status(data,offer_id){
    let ok  = 0;
    data.map(elem=>{
        if (elem.offer_id == offer_id)
        ok++;
    })

    return (ok==1)?true:false;
}

function get_title_for_status(status){
    let ret = "";
    switch(status){
        case 0:
        ret = "Ai trimis o oferta";
        break;
        case 1:
            ret = "Acceptata de catre Fermier! ";
            break;
            case 2:
                ret= "Acceptata de catre admin!";
            break;

        case 4: 
        ret=  " Anulata de catre fermier";
            break;

        case 5: 
        ret= "Anulata de catre admin!";
             break;

    }
    return ret;
}

function buttons_needed(data,index){
    let offer_id = data[index].offer_id;
    for (let i = index+1;i<data.length;i++){
        if (data[i].offer_id == offer_id){
            //we have some more statuses 
            return false;
        }
    }
    return true;
}


function accept_offer(elem,offer_id){
    $.ajax({
        url: "/admin_accept_offer_b2b",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"offer_id":offer_id}),
        success: function(data){
            let parent = elem.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
            let o_c = parent.querySelectorAll(".offer_content");
            console.log(parent);
            elem.parentElement.parentElement.parentElement.remove();
            //we should add the new time_point 
            let temp = document.querySelector("#offer_body").content.cloneNode(true);
            let date = new Date();
            temp.querySelector(".date_offer").textContent = ('0'+date.getDate()).slice(-2)+"-"+('0'+(date.getMonth() + 1)).slice(-2) + '-'+date.getFullYear()+"  "+('0'+date.getHours()).slice(-2)+":"+('0'+date.getMinutes()).slice(-2)+":"+('0'+date.getSeconds()).slice(-2);
            temp.querySelector(".offer_title").textContent = get_title_for_status(2);
            temp.querySelector(".offer_content").innerHTML = "Fermierul iti ofera  <span>"+o_c[o_c.length-1].querySelector("span:nth-child(1)").textContent+"</span>  pentru <span>"+parseInt(o_c[o_c.length-1].querySelector("span:nth-child(2)").textContent)+" unitati </span>";
            parent.appendChild(temp);
          // notify.show_success("Succes!","Oferta a fost acceptata!");
        },error: function(){
            alert("eroare de server");
        }
    })
}

function decline_offer(elem,offer_id){
    $.ajax({
        url: "/admin_reject_offer_b2b",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"offer_id":offer_id}),
        success: function(data){
            let parent = elem.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
            let o_c = parent.querySelectorAll(".offer_content");
            console.log(parent);
            elem.parentElement.parentElement.parentElement.remove();
            //we should add the new time_point 
            let temp = document.querySelector("#offer_body").content.cloneNode(true);
            let date = new Date();
            temp.querySelector(".date_offer").textContent = ('0'+date.getDate()).slice(-2)+"-"+('0'+(date.getMonth() + 1)).slice(-2) + '-'+date.getFullYear()+"  "+('0'+date.getHours()).slice(-2)+":"+('0'+date.getMinutes()).slice(-2)+":"+('0'+date.getSeconds()).slice(-2);
            temp.querySelector(".offer_title").textContent = get_title_for_status(5);
            temp.querySelector(".offer_content").innerHTML = "Fermierul iti ofera  <span>"+o_c[o_c.length-1].querySelector("span:nth-child(1)").textContent+"</span>  pentru <span>"+parseInt(o_c[o_c.length-1].querySelector("span:nth-child(2)").textContent)+" unitati </span>";
            parent.appendChild(temp);
          // notify.show_success("Succes!","Oferta a fost acceptata!");
        },error: function(){
            alert("eroare de server");
        }
    })
}


function show_offer(elem,offer_id){
    elem.parentElement.parentElement.parentElement.querySelector(".show_offer_data").style.maxHeight = "200px";
    elem.textContent = "Trimite cererea de oferta";
    elem.onclick = null;
    elem.onclick = function(){
        send_offer_two(elem,offer_id);
    }
}

function send_offer_two(elem,offer_id){
    let new_price = elem.parentElement.parentElement.parentElement.querySelector(".show_offer_data .new_price").value;
    let new_qty = elem.parentElement.parentElement.parentElement.querySelector(".show_offer_data .new_qty").value;

    console.log(new_price);
    console.log(new_qty);
    $.ajax({
        url: "/admin_send_new_offer_b2b",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"offer_id":offer_id,"new_price":new_price,"new_qty":new_qty}),
        success: function (data){

            let parent = elem.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
            let o_c = parent.querySelectorAll(".offer_content");
            console.log(parent);
            elem.parentElement.parentElement.parentElement.remove();
            //we should add the new time_point 
            let temp = document.querySelector("#offer_body").content.cloneNode(true);
            let date = new Date();
            temp.querySelector(".date_offer").textContent = ('0'+date.getDate()).slice(-2)+"-"+('0'+(date.getMonth() + 1)).slice(-2) + '-'+date.getFullYear()+"  "+('0'+date.getHours()).slice(-2)+":"+('0'+date.getMinutes()).slice(-2)+":"+('0'+date.getSeconds()).slice(-2);
            temp.querySelector(".offer_title").textContent = get_title_for_status(0);
            temp.querySelector(".offer_content").innerHTML = "Ai cerut <span>"+new_price+"</span>  pentru <span>"+new_qty+" unitati </span>";
            parent.appendChild(temp);

          // notify.show_success("Succes!","Oferta a fost trimisa!");

        },error: function(){
            notify.show_error("Error!","Te rugam sa incerci mai tarziu");
        }
    })
}

function add_word(){
    //we just add the new word into the table 
    let word = document.querySelector("#new_word").value;
    if (word.trim()!=""){
        let tr = document.createElement("tr");
        let td = document.createElement("td");

        td.textContent = word;
        td.className = "active_word";
        tr.appendChild(td);

        document.querySelector("#words").appendChild(tr);
    }
}


function see_all_offers_for_cid(cid){
    //open 
    document.querySelector(".offers_sent_cid").style.transform = "scale(1)";
    document.querySelector(".product_searcher_bg").style.visibility = "visible";
    document.querySelector(".product_searcher_bg").style.opacity = "1";
    console.log(cid);
    //populate 
    $.ajax({
        url: "/send_offers_cid",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"cid":cid}),
        success: function(data2){
            let data = data2;
            //we first remove
            Array.from(document.querySelectorAll(".offer_body_sent")).forEach(elem=>{
                elem.remove();
            })

            //just populate 
            let index_order = [];

            let already_added = {};
            let temp,frag;
            frag = document.createDocumentFragment();

            data.map((offer,index)=>{
                if (!already_added[offer.offer_id]){
                    temp = document.querySelector("#offer_head").content.cloneNode(true);
                    //fill in the details
                    temp.querySelector(".offer_del").textContent = "Livrare din: "+offer.judet+", "+offer.oras+", "+offer.adresa;
                    temp.querySelector(".product_infos").innerHTML = "Produs: <b>"+offer.name+"</b>, vandut de <i>"+offer.bis_name+"</i>";
                    //now we add to the already 
                    index_order.push(offer.offer_id);
                    already_added[offer.offer_id] = temp;
                    //now we add the offer 
                    temp = document.querySelector("#offer_body").content.cloneNode(true);

                    let date = offer.sent_at.split("T");
                    
                    temp.querySelector(".date_offer").textContent = reverseString(date[0])+ "  "+date[1].split(".")[0];

                    if (offer.sent_by == "-1")
                    {
                        temp.querySelector(".offer_title").textContent = "Ai trimis o cerere de oferta!";
                        temp.querySelector(".offer_content").innerHTML = "Ai cerut <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";
                    }
                    else if (parseInt(offer.status) == 3){
                        temp.querySelector(".offer_title").textContent = "Ai primit o contra-oferta!";
                        temp.querySelector(".offer_content").innerHTML = "Fermierul iti ofera  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";

                    }
                    else{
                        temp.querySelector(".offer_title").textContent = get_title_for_status(parseInt(offer.status));
                        if (offer.sent_by=="-1")
                        temp.querySelector(".offer_content").innerHTML = "Iti oferim  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";
                        else
                        temp.querySelector(".offer_content").innerHTML = "Ai cerut  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";

                    }

                    if (parseInt(offer.status) == 3 && buttons_needed(data,index)){
                        //we can add the buttons 
                        let btn_temp = document.querySelector("#action_buttons").content.cloneNode(true);
                                     //set the listeners 

                                     btn_temp.querySelector(".btn-success").onclick = function(){
                                        accept_offer(this,offer.offer_id);
                                    }
        
                                    btn_temp.querySelector(".btn-primary").onclick = function(){
                                        show_offer(this,offer.offer_id);
                                    }
        
                                    btn_temp.querySelector(".btn-danger").onclick = function(){
                                        decline_offer(this,offer.offer_id);
                                    }
                        temp.querySelector(".extra").appendChild(btn_temp);
                    }

                    already_added[offer.offer_id].querySelector(".the_request").appendChild(temp);
                }
                else{
                    temp = document.querySelector("#offer_body").content.cloneNode(true);
                    let date = offer.sent_at.split("T");
                    temp.querySelector(".date_offer").textContent = reverseString(date[0])+ "  "+date[1].split(".")[0];
                    
                    if (parseInt(offer.status) == 0)
                    {
                        temp.querySelector(".offer_title").textContent = "Ai trimis o cerere de oferta!";
                        temp.querySelector(".offer_content").innerHTML = "Ai cerut <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";

                    }
                    else if (parseInt(offer.status)== 3){
                        temp.querySelector(".offer_title").textContent = "Ai primit o contra-oferta!";
                        temp.querySelector(".offer_content").innerHTML = "Fermierul iti cere  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";

                    }
                    else{
                        temp.querySelector(".offer_title").textContent = get_title_for_status(parseInt(offer.status));
                        if (offer.sent_by=="-1")
                        temp.querySelector(".offer_content").innerHTML = "Fermieul iti ofera  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";
                        else
                        temp.querySelector(".offer_content").innerHTML = "Fermieul iti ofera  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";

                    }

                    if (parseInt(offer.status) == 3 && buttons_needed(data,index)){
                        //we can add the buttons 
                        let btn_temp = document.querySelector("#action_buttons").content.cloneNode(true);
                        //set the listeners 

                        btn_temp.querySelector(".btn-success").onclick = function(){
                            accept_offer(this,offer.offer_id);
                        }

                        btn_temp.querySelector(".btn-primary").onclick = function(){
                            show_offer(this,offer.offer_id);
                        }

                        btn_temp.querySelector(".btn-danger").onclick = function(){
                            decline_offer(this,offer.offer_id);
                        }

                        temp.querySelector(".extra").appendChild(btn_temp);
                    }

                    already_added[offer.offer_id].querySelector(".the_request").appendChild(temp);
                }
            })
          
            index_order.map(index=>{
                document.querySelector(".cid_offers").appendChild(already_added[index]);
            })

        },error:function(){
            alert("Server error");
        }
    })
}

function exit_sent_offers_cid(){
    document.querySelector(".offers_sent_cid").style.transform = "scale(0)";

    document.querySelector(".product_searcher_bg").style.visibility = "hidden";
    document.querySelector(".product_searcher_bg").style.opacity = "0";

}


function send_direct_offer(cid){
    //first we open the direc_offer
   let direct_temp = document.querySelector(".row[data-cid='"+cid+"']").querySelector('.direct_offer_inputs');
   direct_temp.style.maxHeight = "200px";
   direct_temp.querySelector("button").onclick = function(){
       upload_direct_offer(cid);
   }
}

function upload_direct_offer(cid){
    let price_input = document.querySelector(".row[data-cid='"+cid+"']").querySelector('#direct_offer_price').value;
    let qty_input = document.querySelector(".row[data-cid='"+cid+"']").querySelector('#direct_offer_qty').value;
    $.ajax({
        url: "/send_direct_offer_b2b",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"cid":cid,"price":price_input,"qty":qty_input}),
        success: function(data){
            notify.show_success("Success!","Cererea a fost trimisa!");
        },error:function(){
            notify.show_error("Error!","Server error,try again!");
        }
    })

}



function show_final_order(order_id){

    document.querySelector("#final_bids").style.transform = "scale(1)";
    document.querySelector(".product_searcher_bg").style.visibility = "visible";
    document.querySelector(".product_searcher_bg").style.opacity = "1";

    $.ajax({    
        url: "/get_final_bids",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"order_id":order_id}),
        success: function(data){
            console.log(data);
            if (data && data.length!=0)
            {
                //remove them all 
                Array.from(document.querySelectorAll(".final_prod_bid")).forEach(elem=>{
                    elem.remove();
                })
                ///set the order_id 
                document.querySelector("#final_bids").dataset.order_id = order_id;

                let frag,already_added = {},span,bid_temp;
                data.map(bid=>{
                    if (already_added[bid.id])
                    {
                        temp = already_added[bid.id];

                        console.log("already");

                         //check the prod_type 
                         if (bid.original_prod_id == -1){
                            //custom           

                                 //add the bid 
                                if (bid.name!=null && bid.new_price!=null){
                                 bid_temp = document.querySelector("#bid_container").content.cloneNode(true);
                                 bid_temp.querySelector(".prod_name").textContent = bid.name;
                                 bid_temp.querySelector(".del_from").textContent = bid.judet+", "+bid.oras+", "+bid.adresa;;
                                 bid_temp.querySelector(".sold_by").textContent = bid.bis_name;
                                 bid_temp.querySelector(".new_price").textContent = bid.new_price+" RON pentru "+bid.new_qty + " unitati";
                                 bid_temp.querySelector(".bid_parent").dataset.bid_id = bid.bid_id;

                                 if (bid.image){
                                     bid_temp.querySelector(".prod_image img").src = "/uploads/"+bid.image;
                                 }

     
                                 temp.querySelector(".bids").appendChild(bid_temp);
                         }
                        }
                        else
                        {
                            //normal prod 

                            //add the bid   
                            if (bid.name!=null && bid.new_price!=null){
                             bid_temp = document.querySelector("#bid_container").content.cloneNode(true);
                            bid_temp.querySelector(".prod_name").textContent = bid.name;
                            bid_temp.querySelector(".del_from").textContent = bid.judet+", "+bid.oras+", "+bid.adresa;;
                            bid_temp.querySelector(".sold_by").textContent = bid.bis_name;
                            bid_temp.querySelector(".new_price").textContent = bid.new_price+" RON pentru "+bid.new_qty + " unitati";
                            bid_temp.querySelector(".bid_parent").dataset.bid_id = bid.bid_id;
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
                        temp.querySelector(".final_prod_bid").dataset.cart_id = bid.id;
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
                                if (bid.name!=null && bid.new_price!=null){
                                    console.log(bid.new_price)
                                 bid_temp = document.querySelector("#bid_container").content.cloneNode(true);
                                 bid_temp.querySelector(".prod_name").textContent = bid.name;
                                 bid_temp.querySelector(".del_from").textContent = bid.judet+", "+bid.oras+", "+bid.adresa;;
                                 bid_temp.querySelector(".sold_by").textContent = bid.bis_name;
                                 bid_temp.querySelector(".new_price").textContent = bid.new_price+" RON pentru "+bid.new_qty + " unitati";
                                 if (bid.image){
                                    bid_temp.querySelector(".prod_image img").src = "/uploads/"+bid.image;
                                }

                                bid_temp.querySelector(".bid_parent").dataset.bid_id = bid.bid_id;
                                 temp.querySelector(".bids").appendChild(bid_temp);
                            }
                            else{
                                temp.querySelector(".bids").innerHTML = "<b style = 'margin-left: 15px'>Nu sunt cereri de oferta pentru acest produs</b>";
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
                            if (bid.name!=null && bid.new_price!=null){
                             bid_temp = document.querySelector("#bid_container").content.cloneNode(true);
                            bid_temp.querySelector(".prod_name").textContent = bid.name;
                            bid_temp.querySelector(".del_from").textContent = bid.judet+", "+bid.oras+", "+bid.adresa;;
                            bid_temp.querySelector(".sold_by").textContent = bid.bis_name;
                            bid_temp.querySelector(".new_price").textContent = bid.new_price+" RON pentru "+bid.new_qty + " unitati";
                            if (bid.image){
                                bid_temp.querySelector(".prod_image img").src = "/uploads/"+bid.image;
                            }

                            bid_temp.querySelector(".bid_parent").dataset.bid_id = bid.bid_id;

                            temp.querySelector(".bids").appendChild(bid_temp);
                        }
                        else{
                            temp.querySelector(".bids").innerHTML = "<b style = 'margin-left: 15px'>Nu sunt cereri de oferta pentru acest produs</b>";
                        }
                            already_added[bid.id] = temp;   
                        }
                    }
                })

                Object.keys(already_added).map(key=>{
                    document.querySelector("#final_bids .row").appendChild(already_added[key]);
                })
            }
        }
    })

}

function close_final_bids(){
    document.querySelector("#final_bids").style.transform = "scale(0)";
    document.querySelector(".product_searcher_bg").style.visibility = "hidden";
    document.querySelector(".product_searcher_bg").style.opacity = "0";
}

function send_final_bid()
{
    let pret_c = document.querySelector("#pret_comanda").value;
    let pret_t = document.querySelector("#pret_t").value;
    let comision = document.querySelector("#comision").value;

    if (pret_c.trim()!="" && pret_t.trim()!="" && comision.trim()!=""){
            //create the array now 
            let bid_array = {};

            Array.from(document.querySelectorAll("#final_bids .final_prod_bid")).forEach(elem=>{
                //get the bids
                bid_array[elem.dataset.cart_id] = [];

                Array.from(elem.querySelectorAll(".bid_parent")).forEach(elem2=>{
                    if (elem2.querySelector("input[type='checkbox']").checked)
                    bid_array[elem.dataset.cart_id].push(elem2.dataset.bid_id);
                })
            })

            $.ajax({
                url: "/send_final_b2b_offer",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({"order_id":document.querySelector("#final_bids").dataset.order_id,"bids":bid_array,"pret_comanda":pret_c,"pret_transport":pret_t,"comision":comision}),
                success: function(data){
                    console.log(data);
                }
            })
            console.log(bid_array);
    }
    else{
        alert("Please complete all the fields");
    }
}