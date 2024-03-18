var myModal = new bootstrap.Modal(document.getElementById("delete_modal"), {});
var notify = null;
$(document).ready(function(){
    populate_addr();
    notify = new Notify();
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
    document.getElementById("add_del_addr").style.maxHeight = "300px";
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