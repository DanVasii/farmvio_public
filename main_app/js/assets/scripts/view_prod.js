$(document).ready(function(){
    parse_prods();
})
function parse_prods(){
    $.ajax({
        url: "/get_prods",
        type: "GET",
        success: function(data){
             if (data.length!=0){
                let prod_obj,temp,frag,parent,image_array;

                parent = document.getElementById("product_row");
                frag = document.createDocumentFragment();

                for (index in data){
                    prod_obj = data[index];
                    temp = document.getElementById("product_template").content.cloneNode(true);

                    //now we set the name 
                    temp.querySelector(".title:nth-child(1)").textContent = prod_obj.name;
                    temp.querySelector("#price").textContent = prod_obj.price+" RON / "+prod_obj.unit;
                    
                    if (prod_obj.images && prod_obj.images!='')
                    temp.querySelector(".top_content img").src = "/uploads/"+prod_obj.images; 
                    else
                    temp.querySelector(".top_content img").src = "/assets/images/icons/no_image.png"; 

                    temp.querySelector("#view_link").href = "/products/"+prod_obj.id;
                    let prod_id = prod_obj.id;
                    temp.querySelector("#remove_prod").onclick = function(){
                        remove_item(prod_id,this);
                
                    }
                    temp.querySelector("#stock").onclick = function(){
                        window.location = "/stocks/"+prod_id;
                    }
                    temp.querySelector("#edit_link").onclick = function(){
                        window.location = "/edit/"+prod_id;
                    }
                    frag.appendChild(temp);

                }
                parent.appendChild(frag);
             }
        }
    })
}

function remove_item(id,elem){
    $.ajax({
        url: "/remove_item",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"prod_id":id}),
        success: function(data){
            console.log(data);
            if (data == "OK")
            $(elem).parent().parent().parent().remove();
        }
    })

}