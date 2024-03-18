var sel_farmer = -1;
$(document).ready(function(){
    populate_farmers();
})


function populate_farmers(){
    $.ajax({
        url: "/get_farmers",
        type: "POST",
        contentType: "application/json",
        success: function (data){
            let frag,temp,parent;
            frag = document.createDocumentFragment();
            parent = document.querySelector("tbody");
            console.log(data);
            data.map(farmer=>{
                temp = document.querySelector("#fermier").content.cloneNode(true);

                temp.querySelector("td:nth-child(1)").textContent = farmer.id;
                temp.querySelector("td:nth-child(2)").textContent = farmer.username;
                temp.querySelector("td:nth-child(3)").onclick = function(){
                    populate_avize(farmer.id);
                };

                frag.appendChild(temp);

            })
            parent.appendChild(frag);
        }
    })
}

function populate_avize(farmer_id){
        $.ajax({
            url: "/admin_get_avize",
            type: "POST",
            data: JSON.stringify({"farmer_id":farmer_id}),
            contentType: "application/json",
            success: function(data){
                console.log(data);
                sel_farmer = farmer_id;
                if (data.length==0){
                    let h3 = document.createElement("h3");
                    h3.textContent = "Nu sunt avize";
                    document.querySelector(".avize").appendChild(h3);
                }
                else{
                    data.map(a=>{
                        
                    let li;
                    li = document.createElement("li");
                    li.textContent = a.nume;
                    let i = document.createElement("i");
                    i.className = "fas fa-trash";
                        i.onclick = function(){
                            remove_aviz(a.id,li);
                        }
                    li.appendChild(i);
                    document.querySelector(".avize").appendChild(li);
                    })
                }
                open_prod_searcher();
            }
        })
}
function remove_aviz(id,elem){
    $.ajax({
        url: "/remove_aviz",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"a_id":id}),
        success: function(){
            elem.remove();
        }
    })
}
function add_aviz()
{
    let value = document.querySelector("#titlu_aviz").value;
    if (value.trim()!=""){
    $.ajax({
        url: "/add_aviz",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"farmer_id":sel_farmer,"nume":value}),
        success: function (id)
        {
            let parent = document.querySelector(".avize");
            parent.querySelector("h3")?.remove();
            let li;
  
            li = document.createElement("li");
            li.textContent = value;

            let i = document.createElement("i");
            i.className = "fas fa-trash";
                i.onclick = function(){
                    remove_aviz(id.id,li);
                }

                li.appendChild(i);
            parent.appendChild(li);
        }

    })
}
else{
    alert("Completeaza avizul!");
}
}

function open_prod_searcher(order_elem_id)
{
    document.querySelector(".product_searcher").style.transform = "scale(1)";
    document.querySelector(".product_searcher_bg").style.visibility = "visible";
    document.querySelector(".product_searcher_bg").style.opacity = "1";

    let elem = document.querySelector("*[data-cid='"+order_elem_id+"']");
    document.querySelector(".product_searcher_qty").textContent = "Cantitate: "+elem.querySelector(".qty_col").textContent;
    document.querySelector(".product_searcher_det").textContent = "Detalii: "+elem.querySelector(".details_col").textContent;
   

}

function exit_product_searcher()
{
    sel_farmer = -1;
    document.querySelector(".product_searcher").style.transform = "scale(0)";
    document.querySelector(".product_searcher_bg").style.visibility = "hidden";
    document.querySelector(".product_searcher_bg").style.opacity = "0";
   
}
