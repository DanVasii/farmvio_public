
var notify ;

$(document).ready(function(){
    notify = new Notify();
    parse_offers();
})

function parse_offers()
{
    $.ajax({
        url: "/get_farmer_offers",
        type: "POST",
        contentType: "application/json",
        success: function(data){
            console.log(data);
            if (data.length==0){
                let p = document.createElement("p");
                p.textContent = "Momentan nu ai nicio cerere de oferta!";
                p.style.textAlign = "center";
                p.style.fontSize = "20px";
                document.querySelector("#main_content").appendChild(p);
            }
            else{
                let already_added = {};
                let temp,frag;
                frag = document.createDocumentFragment();

                data.map((offer,index)=>{
                    if (!already_added[offer.offer_id]){
                        temp = document.querySelector("#offer_head").content.cloneNode(true);
                        //fill in the details
                        //now we add to the already 
                        
                        already_added[offer.offer_id] = temp;
                        //now we add the offer 
                        temp = document.querySelector("#offer_body").content.cloneNode(true);

                        let date = offer.sent_at.split("T");
                        
                        temp.querySelector(".date_offer").textContent = reverseString(date[0])+ "  "+date[1].split(".")[0];

                        if (parseInt(offer.status) == 0)
                        {
                            temp.querySelector(".offer_title").textContent = "Ai primit o cerere de oferta!";
                            temp.querySelector(".offer_content").innerHTML = "Iti oferim <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";

                        }
                        else if (parseInt(offer.status) == 3){
                            temp.querySelector(".offer_title").textContent = "Ai trimis o contra-oferta!";
                            temp.querySelector(".offer_content").innerHTML = "Ai cerut  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";

                        }
                        else{
                            temp.querySelector(".offer_title").textContent = get_title_for_status(parseInt(offer.status));
                            if (offer.sent_by=="-1")
                            temp.querySelector(".offer_content").innerHTML = "Iti oferim  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";
                            else
                            temp.querySelector(".offer_content").innerHTML = "Ai cerut  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";

                        }
                        console.log(only_one_status(data,offer.offer_id))

                        if (parseInt(offer.status) == 0 && buttons_needed(data,index)){
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
                        console.log(offer);
                        temp = document.querySelector("#offer_body").content.cloneNode(true);
                        let date = offer.sent_at.split("T");
                        temp.querySelector(".date_offer").textContent = reverseString(date[0])+ "  "+date[1].split(".")[0];
                        
                        if (parseInt(offer.status) == 0)
                        {
                            temp.querySelector(".offer_title").textContent = "Ai primit o cerere de oferta!";
                            temp.querySelector(".offer_content").innerHTML = "Iti oferim <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";

                        }
                        else if (parseInt(offer.status)== 3){
                            temp.querySelector(".offer_title").textContent = "Ai trimis o contra-oferta!";
                            temp.querySelector(".offer_content").innerHTML = "Ai cerut  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";

                        }
                        else{
                            temp.querySelector(".offer_title").textContent = get_title_for_status(parseInt(offer.status));
                            if (offer.sent_by=="-1")
                            temp.querySelector(".offer_content").innerHTML = "Iti oferim  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";
                            else
                            temp.querySelector(".offer_content").innerHTML = "Ai cerut  <span>"+offer.new_price+" RON"+"</span>  pentru <span>"+offer.new_qty+" unitati </span>";

                        }

                        if (parseInt(offer.status) == 0 && buttons_needed(data,index)){
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
                Object.keys(already_added).map(elem=>{
                    document.querySelector("section.content").appendChild(already_added[elem]);
                })
            }
        },
        error: function(){
            let p = document.createElement("p");
            p.textContent = "Eroare! Te rugam sa incerci mai tarziu!";
            p.style.textAlign = "center";
            p.style.fontSize = "20px";

            document.querySelector("#main_content").appendChild(p);
        }
    })
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
        case 1:
            ret = "Acceptata de catre tine! ";
            break;
            case 2:
                ret= "Acceptata de catre admin!";
            break;

        case 4: 
        ret=  " Anulata de catre tine";
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
    console.log(elem);
    $.ajax({
        url: "/accept_offer_b2b",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"offer_id":offer_id}),
        success: function (data){
            let parent = elem.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
            
            elem.parentElement.parentElement.parentElement.remove();
            //we should add the new time_point 
            let temp = document.querySelector("#offer_body").content.cloneNode(true);
            let date = new Date();
            temp.querySelector(".date_offer").textContent = ('0'+date.getDate()).slice(-2)+"-"+('0'+(date.getMonth() + 1)).slice(-2) + '-'+date.getFullYear()+"  "+('0'+date.getHours()).slice(-2)+":"+('0'+date.getMinutes()).slice(-2)+":"+('0'+date.getSeconds()).slice(-2);
            temp.querySelector(".offer_title").textContent = get_title_for_status(1);
            temp.querySelector(".offer_content").innerHTML = "Iti oferim  <span>"+parent.querySelector(".offer_content span:nth-child(1)").textContent+"</span>  pentru <span>"+parseInt(parent.querySelector(".offer_content span:nth-child(2)").textContent)+" unitati </span>";
            parent.appendChild(temp);
           notify.show_success("Succes!","Oferta a fost acceptata!");
        },error: function(){
            notify.show_error("Error!","Te rugam sa incerci mai tarziu");
        }
    })
}

function show_offer(elem,offer_id){
    elem.parentElement.parentElement.parentElement.querySelector(".show_offer_data").style.maxHeight = "200px";
    elem.textContent = "Trimite cererea de oferta";
    elem.onclick = null;
    elem.onclick = function(){
        send_offer(elem,offer_id);
    }
}

function send_offer(elem,offer_id){
    let new_price = elem.parentElement.parentElement.parentElement.querySelector(".show_offer_data .new_price").value;
    let new_qty = elem.parentElement.parentElement.parentElement.querySelector(".show_offer_data .new_qty").value;
    $.ajax({
        url: "/send_offer_farmer",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"offer_id":offer_id,"price":new_price,"qty":new_qty}),
        success: function (data){
            let parent = elem.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
            elem.parentElement.parentElement.parentElement.remove();
            //we should add the new time_point 
            let temp = document.querySelector("#offer_body").content.cloneNode(true);
            let date = new Date();
            temp.querySelector(".date_offer").textContent = ('0'+date.getDate()).slice(-2)+"-"+('0'+(date.getMonth() + 1)).slice(-2) + '-'+date.getFullYear()+"  "+('0'+date.getHours()).slice(-2)+":"+('0'+date.getMinutes()).slice(-2)+":"+('0'+date.getSeconds()).slice(-2);
            temp.querySelector(".offer_title").textContent = "Ai trimis o contra-oferta";
            temp.querySelector(".offer_content").innerHTML = "Ai cerut  <span>"+new_price+" RON </span>  pentru <span>"+new_qty+" unitati </span>";
            parent.appendChild(temp);
           notify.show_success("Succes!","Oferta a fost trimisa!");
        },error: function(){
            notify.show_error("Error!","Te rugam sa incerci mai tarziu");
        }
    })
}

function decline_offer(elem,offer_id){
    $.ajax({
        url: "/decline_offer_b2b",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"offer_id":offer_id}),
        success: function (data){
            let parent = elem.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
            elem.parentElement.parentElement.parentElement.remove();
            //we should add the new time_point 
            let temp = document.querySelector("#offer_body").content.cloneNode(true);
            let date = new Date();
            temp.querySelector(".date_offer").textContent = ('0'+date.getDate()).slice(-2)+"-"+('0'+(date.getMonth() + 1)).slice(-2) + '-'+date.getFullYear()+"  "+('0'+date.getHours()).slice(-2)+":"+('0'+date.getMinutes()).slice(-2)+":"+('0'+date.getSeconds()).slice(-2);
            temp.querySelector(".offer_title").textContent = get_title_for_status(4);
            temp.querySelector(".offer_content").innerHTML = "Iti oferim  <span>"+parent.querySelector(".offer_content span:nth-child(1)").textContent+"</span>  pentru <span>"+parseInt(parent.querySelector(".offer_content span:nth-child(2)").textContent)+" unitati </span>";
            parent.appendChild(temp);
           notify.show_success("Succes!","Oferta a fost respinsa!");
        },error: function(){
            notify.show_error("Error!","Te rugam sa incerci mai tarziu");
        }
    })
}