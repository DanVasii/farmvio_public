
let prev_j,prev_o,prev_s;
$(document).ready(function(){
    populate_addr();

    $("#cod").on("input",function(elem){
        let value = elem.currentTarget.value;
        
        if (value.trim().length==6){
            
            let starda,city,county;
            starda = document.querySelector("#strada").value;
            city = document.querySelector("#oras").value;
            county = document.querySelector("#judet").value;

            if (starda.trim().length!=0 && city.trim().length!=0 && county.trim().length!=0)
            {
                //seatch
            }
            else{
                //reverse 
                postal_code_reverse(value); 
            }
        }
    })

    $("input").on("focusout",function(){
        let starda,city,county;
        starda = document.querySelector("#strada").value;
        city = document.querySelector("#oras").value;
        county = document.querySelector("#judet").value;

        if (starda.trim().length!=0 && city.trim().length!=0 && county.trim().length!=0)
        {
            //seatch
            if (document.querySelector("#cod").value=="" && prev_j!=county && prev_o!=city && starda!=prev_s){
            search_postal_code(county,city,starda);
                prev_j = county;
                prev_o = oras;
                prev_s = starda;
            }
        }
    })

    $("#judet").on("input",function(elem){
        
        let input = elem.currentTarget.value;
        let parent = elem.currentTarget.parentElement;
        if (input.trim()!="" && input.length>=3)
        {
            get_judet(input);
        }
        else
        {
            parent.querySelector("#judet_ac .ac_data").style.maxHeight = "0px";
        }
    })

    $("#oras").on("input",function(elem){
        
        let input = elem.currentTarget.value;
        let parent = elem.currentTarget.parentElement;
        if (input.trim()!="" && input.length>=3)
        {
            get_oras(input);
        }
        else
        {
            document.querySelector("#oras_ac .ac_data").style.maxHeight = "0px";
        }
    })

    $("#judet,#oras,#strada").on("focusout",function(elem){
        //close the ac    
       elem.currentTarget.parentElement.querySelector(".ac_data").style.maxHeight = "0px";
    })
    $("#judet,#oras,#strada").on("focus",function(elem){
        //research oras 
        if (elem.currentTarget.id == "oras")
        get_oras(elem.currentTarget.value);
        //open the ac    
        if (elem.currentTarget.parentElement.querySelectorAll(".ac_data li").length!=0)
       elem.currentTarget.parentElement.querySelector(".ac_data").style.maxHeight = "150px";
    })

    $(".ac_data").on("click","li",function(elem){
        let text = elem.currentTarget.textContent;
        if (elem.currentTarget.className == "")
        {
            let input = elem.currentTarget.parentElement.parentElement.parentElement.querySelector("input");
            input.value = text;
            elem.currentTarget.parentElement.style.maxHeight = "0px";

            if (elem.currentTarget.dataset.county)
            {
                document.querySelector("#judet").value = elem.currentTarget.dataset.county;
            }
        }
        })
})


function populate_addr()
{
    $.ajax({
        url: "/get_user_addresses",
        type: "GET",
        contentType: "application/json",
        success: function(data){
            console.log(data);
           if (data && data.length!=0){
                let frag = document.createDocumentFragment();;    
            for (index in data){
                    let delivery_obj = data[index];
                    let temp = document.getElementById("address").content.cloneNode(true);

                    temp.querySelector(".order_row").dataset.a_id = delivery_obj.id;
                    
                    //set the active or not 
                    if (delivery_obj.active==1){
                        temp.querySelector(".order_row").className += " active_del_addr";
                    }
                    
                    temp.querySelector(".contact_info").textContent = delivery_obj.nume + ", "+delivery_obj.telefon;
                    temp.querySelector(".address_line_one").textContent = delivery_obj.judet+", "+delivery_obj.oras+ ", "+delivery_obj.cod;
                    temp.querySelector(".address_line_two").textContent = delivery_obj.strada+", "+delivery_obj.numar;
                    temp.querySelector(".address_line_three").textContent = delivery_obj.bloc+", "+delivery_obj.scara+", "+delivery_obj.apt;
                    temp.querySelector(".order_row").onclick = function(){
                        set_active(delivery_obj.id,this);
                    }

                    temp.querySelector(".edit_addr").onclick = function(){
                        edit_addr(this,delivery_obj.id);
                    }
                    //set the close action 
                    temp.querySelector(".delete_address").onclick = function(){
                        open_modal(delivery_obj.id,this);
                    }

                    frag.appendChild(temp);
                }
                document.getElementById("saved").appendChild(frag);
           }
        }
    })
}

function set_active(a_id,elem)
{
    document.getElementById("add_del_addr").style.maxHeight = "40px";
    $.ajax({
        url: "/set_active_del_addr",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"a_id":a_id}),
        success: function(data){
            console.log(data);
            if (data == "OK")
            {
                
                //update it
                Array.from(document.querySelectorAll(".active_del_addr")).forEach(elem=>{
                    elem.classList.remove("active_del_addr");
                })
                elem.className+= " active_del_addr";
            }
            else{
                //show error 
                notify.show_error("Server error!","Eroare la setarea adresei, te rugam sa incerci iar.");
            }
        }
    })
}

function open_modal(id,elem)
{
    let ps = elem.parentElement.querySelectorAll("p");
    let addr = "";
    Array.from(ps).forEach(elem=>{
        addr+= `${elem.textContent}, `;
    })
   
    //set the modal data 
    document.querySelector(".modal-body").innerHTML = "Confirmare stergere adresa: <br>";
    document.querySelector(".modal-body").innerHTML += ` ${addr}`; 
    ///set the data id
    if (!isNaN(id)){
    document.querySelector("#delete_confirmation").dataset.a_id = id;
    myModal.show(); 
    }     
}

function accept_delete(){
    //get the id from modal
    let a_id = document.querySelector("#delete_confirmation").dataset.a_id;
    $.ajax({
        url:"/delete_addr",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"a_id":a_id}),
        success: function (data)
        {
            console.log(data)
            if (data.err){
                //we have an error, then show it
                if (notify){
                    notify.show_error("Eroare la stergere!","Adresa nu a putut fi stearsa, te rugam sa incerci mai tarziu!");
                    myModal.hide();

                }
            }
            else
            {
                //show the success and delete this addr
                notify.show_success("Succes!","Adresa a fost stearsa!");
                myModal.hide();
                //delete this addr
                document.querySelector(".order_row[data-a_id='"+a_id+"']").remove();
            }
        }
    })
}

function open_add_addr()
{
    //first remove all previous selected as active 
    Array.from(document.getElementsByClassName("active_del_addr")).forEach(elem=>{
        elem.classList.remove("active_del_addr");
    })
    document.getElementById("add_del_addr").className += " active_del_addr"
    document.getElementById("add_del_addr").style.maxHeight = "1000px";
    
}

function validate_address(){
    let addr_data = {};
    addr_data.judet = document.getElementById("judet").value;
    addr_data.oras = document.getElementById('oras').value;
    addr_data.tel = document.getElementById("telefon").value;
    addr_data.nume = document.getElementById("nume").value;

    addr_data.strada = document.getElementById("strada").value;
    addr_data.nr_st = document.getElementById("nr_st").value;
    addr_data.bloc = document.getElementById("bloc").value;
    addr_data.scara = document.getElementById("scara").value;
    addr_data.apt = document.getElementById("apt").value;
    addr_data.etaj = document.getElementById("etaj").value;
    addr_data.interfon = document.getElementById("interfon").value;
    addr_data.cod = document.getElementById("cod").value;

    $.ajax({
        url: "/delivery_address",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(addr_data),
        success: function(data){
            console.log(data);
           if (data == "OK")
           {
               //we shoudl redirect 
               window.location = "/checkout";
           }
           else{
               //show error 
               notify.show_error("Address error","The provided address is not valid!");
           }
        }
    })
}

function continue_to_checkout()
{
    let chosen = document.querySelectorAll(".active_del_addr");
    if (chosen.length!=0){
        if (chosen[0].getAttribute("id")=="add_del_addr")
        {
            validate_address();
        }
        else{
            //the addres already is active
            //just go to the checkout 
            window.location = "/checkout";

        }
    }
    else{
        //please choose an address 
        notify.show_error("Address","Please pick an address!");
    }
}

function get_judet(what)
{
    $.ajax({
        url: "/get_delivery_county",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"county":what.trim()}),
        success: function(data){
            console.log(data);
            let li,parent,frag;
            frag = document.createDocumentFragment();
            parent = document.querySelector("#judet_ac .ac_data");
            document.querySelector("#judet_ac .ac_data").style.maxHeight = "150px";
            Array.from(parent.querySelectorAll("li")).forEach(elem=>{
                elem.remove();
            })
            if (data.length == 0){
                //show no result
                li = document.createElement("li");
                li.className = "nf";
                li.textContent = "Fara rezultate";
                frag.appendChild(li);
            }
            else
            {
                data.map(county=>{
                    li = document.createElement("li");
                    li.textContent = county.judet;
                    frag.appendChild(li);
                })
            }
            parent.appendChild(frag);
        }
        
    })
}

function get_oras(oras){
    $.ajax({
        url: "/get_delivery_city",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"city":oras.trim(),"county":document.querySelector("#judet").value}),
        success: function(data){
            console.log(data);
            let li,parent,frag;
            frag = document.createDocumentFragment();
            parent = document.querySelector("#oras_ac .ac_data");
            document.querySelector("#oras_ac .ac_data").style.maxHeight = "150px";
            Array.from(parent.querySelectorAll("li")).forEach(elem=>{
                elem.remove();
            })
            if (data.length == 0){
                //show no result
                li = document.createElement("li");
                li.className = "nf";
                li.textContent = "Fara rezultate";
                frag.appendChild(li);
            }
            else
            {
                data.map(county=>{
                    li = document.createElement("li");
                    li.textContent = county.nume;
                    li.dataset.county = county.judet;
                    frag.appendChild(li);
                })
            }
            parent.appendChild(frag);
        }
        
    })
}

function postal_code_reverse(code){
    $.ajax({
        url: "/reverse_postal_code",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"code":code}),
        success: function (data){
            console.log(data);
            document.querySelector("#judet").value = data?.locality.county;
            document.querySelector("#oras").value = data?.locality.city;
            //add the streets 
            let frag,parent,li;
            frag = document.createDocumentFragment();
            parent = document.querySelector("#strada_ac .ac_data");

            data?.street.map(street=>{
                li = document.createElement("li");
                li.textContent = `Strada ${street}`;
                frag.appendChild(li);
            })
            parent.appendChild(frag)

        }
    })
}


function search_postal_code(county,city,street){
    $.ajax({
        url: "/postal_code",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"county":county,"city":city,"street":street}),
        success: function(data){
            console.log(data);
            if (data?.codes.length>0)
            document.querySelector("#cod").value = data?.codes[0]?.code || "";
        }
    })
}


function edit_addr(elem,addr_id){
    $.ajax({
        url: "/get_addr_info",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"addr_id":addr_id}),
        success: function(data){
            if (data.length!=0){
                console.log(data);
                data = data[0];
                let col = elem.parentElement;
                let edit = document.querySelector("#edit_addr").content.cloneNode(true);

                edit.querySelector("input[data-id='nume']").value = data.nume;
                edit.querySelector("input[data-id='telefon']").value = data.telefon;
                edit.querySelector("input[data-id='judet']").value = data.judet
                edit.querySelector("input[data-id='oras']").value = data.oras
                edit.querySelector("input[data-id='strada']").value = data.strada
                edit.querySelector("input[data-id='nr_st']").value = data.numar
                edit.querySelector("input[data-id='bloc']").value = data.bloc
                edit.querySelector("input[data-id='scara']").value = data.scara
                edit.querySelector("input[data-id='apt']").value = data.apt
                edit.querySelector("input[data-id='etaj']").value = data.etaj
                edit.querySelector("input[data-id='interfon']").value = data.interfon
                edit.querySelector("input[data-id='cod']").value = data.cod

                edit.querySelector("button").onclick = function(){
                    update_addr(addr_id,edit); 
                }
                col.parentElement.appendChild(edit);
                col.style.display = "none";

            }
        }
    })
}


function update_addr(addr_id,parent){
    $.ajax({
        url: "/update_addr",
        type: "POST",
        contentType: "application/json",

    })
}