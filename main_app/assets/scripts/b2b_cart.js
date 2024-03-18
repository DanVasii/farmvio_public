
$(document).ready(function() {
    $(window).on("scroll",function(){
        
        hide_cart();
})  
    parse_cart_count();
    parse_order();

})
function hide_cart(){
    $(".cart_container").css({
        "opacity":0,
        "visibility":"hidden"
})
}

function show_cart()
{
    let window_width = window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth;
        let $cart;
    //get the top and left 
    //check if phone_elem is visible 
    let phone_elem = document.querySelector(".cart-btn.phone")
    if(window.getComputedStyle(phone_elem, null).display.trim() == "none")
     $cart = $(".cart-btn").eq(1).offset();
    else{
    $cart =  $(".cart-btn.phone").offset();
    }


    let left = parseInt($cart.left) - 245;
    let top = parseInt($cart.top);
    let scroll = document.documentElement.scrollTop;

    let top_navbar = (document.querySelector(".navbar-area")?.clientHeight -34)/2 || (document.querySelector(".navbar-area-three")?.clientHeight -34)/2 || document.querySelector(".navbar").clientHeight-20 || 0;

   

   // scroll = scroll>200 ? scroll : 0;
    
    $(".cart_container").css("left",left+"px");
    $(".cart_container").css({
        "opacity":1,
        "visibility":"visible"
})
    $(".cart_container").css("top",(top+34+top_navbar + 5)+"px");
    if(timeout){
        clearTimeout(timeout);
        timeout = setTimeout(function(){
            check_hover();
        },2000);
    }
    else{
        timeout = setTimeout(function(){
            check_hover();
        },2000);
    }
     
}

function check_hover(){
    console.log("checked");
    if ($(".cart_container:hover, .cart-btn:hover").length!=0){
        timeout = setTimeout(function(){
            check_hover();
        },2000);
    }
    else{
        clearTimeout(timeout);
        hide_cart();
    }
}


function parse_order()
{
    $.ajax({
        url: "/b2b_parse_cart",
        type: "POST",
        contentType: "application/json",
        success: function (data, textStatus, xhr){
            console.log(xhr.status);
            
            console.log(data);
            Array.from(document.querySelectorAll(".b2b_item")).forEach(elem=>{
                elem.remove();
            })
            if (xhr.status == 200){
                document.querySelectorAll(".cart-btn span").forEach(elem=>{
                    elem.textContent = data.length;
                })
                if (data.length!=0){
                    //let's show the contents from the cart 
                        let parent = document.querySelector(".cart_content");
                    data.map(elem=>{
                        if (elem.point_id!=""){
                        let temp = document.querySelector("#cart_temp").content.cloneNode(true);

                        temp.querySelector(".b2b_item").dataset.cid = elem.cid;

                        temp.querySelector(".name").textContent = elem.name;
                        if (elem.image)
                        {
                            //change the image
                            temp.querySelector("img").src = "/uploads/"+elem.image;
                        }
                        temp.querySelector(".sold_by").appendChild(document.createTextNode(elem.bis_name));
                        temp.querySelector(".del_from").appendChild(document.createTextNode(elem.oras+', '+elem.adresa))
                        //here we set the value 
                        temp.querySelector("input").value = elem.prod_qty;
                        parent?.appendChild(temp);
                    }
                    else{
                        let temp = document.querySelector("#cart_temp_special").content.cloneNode(true);
                        temp.querySelector(".b2b_item").dataset.cid = elem.cid;
                        //set qty 
                        temp.querySelector("input").value = elem.prod_qty;
                        //just add the tags 
                        let tags = elem.prod_keyw.split(",");
                        let tag;
                        for (index in tags){
                            if(tags[index].trim()!="")
                            {
                                tag = document.createElement("span");
                                tag.className = "old_tag";
                                tag.textContent = tags[index].trim();
                                temp.querySelector(".old_tags").appendChild(tag);
                            }
                        }
                        parent?.appendChild(temp);

                    }
                    })
                    let big_pop = !!document.querySelector("#all_orders");
                    if (big_pop){
                        populate_big_order(data);
                    }
                }
                else{
                  
                    //show no contents 
                    let  p = document.createElement("p");
                    p.style.textAlign = "center";
                    p.textContent = "You order is empty!";
                    document.querySelector(".cart_content").appendChild(p);
                    document.querySelector("#all_orders")?.appendChild(p);
                }
            }
            else if(xhr.status==500) {
                    //show no contents 
                    let  p = document.createElement("p");
                    p.style.textAlign = "center";
                    p.textContent = "Server error! Try again later";
                    document.querySelector(".cart_content").appendChild(p);
                    document.querySelector("#all_orders")?.appendChild(p);
            }
        }
    })
}

function populate_big_order(data){
    let points = {},frag,temp,prod_temp;
    frag = document.createDocumentFragment();
    console.log(data);
    data.map(elem=>{
        if (elem.point_id!="" && points[elem.point_id] )
        {
            temp = points[elem.point_id];
            prod_temp = document.querySelector("#products_row").content.cloneNode(true);
            if (elem.image)
            prod_temp.querySelector("td:first-child img").src = "/uploads/"+elem.image;

            prod_temp.querySelector('#row_prod_name').textContent = elem.name;
            prod_temp.querySelector("#row_prod_qty").value = elem.prod_qty;

            temp.querySelector("#cart_prods").appendChild(prod_temp);
        }
        else if(elem.point_id!=""){
            //create the temp 
            temp = document.querySelector("#products_table").content.cloneNode(true);
            temp.querySelector(".sold_by").textContent = elem.bis_name;
            temp.querySelector(".del_from").textContent = elem.oras+", "+elem.adresa;

            //add the current product 
            prod_temp = document.querySelector("#products_row").content.cloneNode(true);
            if (elem.image)
            prod_temp.querySelector("td:first-child img").src = "/uploads/"+elem.image;

            prod_temp.querySelector('#row_prod_name').textContent = elem.name;
            prod_temp.querySelector("#row_prod_qty").value = elem.prod_qty;

            temp.querySelector("#cart_prods").appendChild(prod_temp);
            points[elem.point_id] = temp;

        }
        else{
            //just add 
            let temp = document.querySelector("#custom_prod_cart")?.content.cloneNode(true);  
            temp.querySelector("textarea").value = elem.prod_details;
            temp.querySelector('.custom_prod_order').dataset.cid = elem.id;
            let keyw = elem.prod_keyw.split(",");   
            let span;
              
            
            //add to parent
            document.querySelector("#all_orders").appendChild(temp);
            let count = $(".prod_order_tags").length;  

            $(".prod_order_tags").eq(count-1).tagsinput({preventPost: true,trimValue: true,allowDuplicates: false,maxTags: 6,confirmKeys: [13,32,44,59]});

            document.querySelector(".custom_prod_order:last-child .bootstrap-tagsinput").style.display = "none";

            for (index in keyw){
                if (keyw[index].trim()!="")
                {
                    span = document.createElement("span");
                    span.className = "old_tag";
                    span.textContent = keyw[index].trim();
                    $(".prod_order_tags").eq(count-1).tagsinput('add',keyw[index].trim());
                    document.querySelector(".custom_prod_order:last-child .old_tags").appendChild(span);
                }
            }
        }
    });
    //now we just append 
    for (index in points){
        frag.appendChild(points[index]);

    }
    document.querySelector("#all_orders").appendChild(frag);
}

function atc(prod_id = null, point_id = null,farmer_id = null){
             //get the prod_id 
    if (!prod_id)
    prod_id = document.querySelector("#prod_id")?.value;
    
    if (!point_id)
    point_id = new URLSearchParams(window.location.search).get("punct_livrare");

    if (!farmer_id)
    {
        farmer_id = document.querySelector("#farmer_id")?.value;
    }
    //get the qty 
    let qty = document.getElementById("qty").value;
    console.log(farmer_id);
    console.log(prod_id+ " "+point_id)
    $.ajax({
        url: "/b2b_ato",
        type: "POST",   
        contentType: "application/json",
        data: JSON.stringify({"prod_id": prod_id,"qty":qty,"point_id": point_id ,"farmer_id": parseInt(farmer_id)}),      
        success: function(data){
            console.log(data);
            if (data == "OK"){            
                    parse_order(true);
                    console.log(prod_id,point_id);
                    //replace this button with remove 
                    document.querySelector(".default-btn").innerHTML = '<i class="far fa-trash-alt"></i>Șterge din comandă';
                    document.querySelector(".default-btn").onclick = null;
                    document.querySelector(".default-btn").onclick = function ()
                    {
                        remove_item(prod_id,point_id);
                    }
                    $(".select2-container--default .select2-selection--single").css("border","1px solid #aaa");
                    $(".select_wpoint")?.css("border","1px solid #ced4da");
            }
            
        },error: function()
        {
           
            if ($(".select2").val()?.trim()=="" || $(".select_wpoint").val()?.trim()=="")
            {
                $(".select2-container--default .select2-selection--single").css("border","1px solid red");
                $(".select_wpoint").css("border","1px solid red");
            }
            else{
                notify.show_error("Eroare!","Te rugăm să încerci mai târziu!");
            }
        }
    })
}

function ato_custom(elem)
{
    elem = elem.parentElement;
    $.ajax({
        url: "/b2b_ato",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"keyw":get_keyw(elem),"details":elem.querySelector("textarea").value,"qty":elem.querySelector(".qty").value}),
        success: function(data,textStatus,xhr){
            
        if (xhr.status == 200){
            elem.querySelector(".custom_err").style.display = "none";
            //we should just update the cart_content and cart_number
            if (data.a == "u")
            {
                //here we just update the qty 
                document.querySelector("#qty").value = parseInt(document.querySelector("#qty").value) + 1;
            }
            else{
                //here we append to the cart body 
                parse_order();
                parse_cart_count();
            }
        }
        },
        error: function(){
            //in this particular case , errot thrown only if tags are empty 
            elem.querySelector(".custom_err").style.display = "block";
        }
    })
}

function get_keyw(elem){
    let concat = "";
   Array.from(elem.querySelectorAll(".tag")).forEach(tag=>{
    concat+=tag.textContent+" ";
   })
   console.log(concat);
   return concat;
}

function parse_cart_count(){
    $.ajax({
        url: "/b2b_cart_count",
        type: "GET",
        contentType: "application/json",
        success: function(data){
            if (data && data.cart_count){
           
                document.querySelectorAll(".cart-btn span").forEach(elem=>{
                    elem.textContent = data.cart_count;
                })
            }
        }
    })
}

function add_item()
{
    let temp = document.querySelector("#custom_prod")?.content.cloneNode(true);
   
    //now just add 
    document.querySelector("#all_orders")?.appendChild(temp || null);
    $(".prod_order_tags").tagsinput({preventPost: true,trimValue: true,allowDuplicates: false,maxTags: 6,confirmKeys: [13,32,44,59]});
}

function delete_custom(elem){
    let cid = elem.parentElement.dataset.cid;
    console.log(cid);
    $.ajax({
        url: "/b2b_delete_custom",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"cid": cid}),
        success: function(){
            elem.parentElement.remove();
        },error: function(){
            notify.show_error("Eroare!","Te rugăm să încerci mai târziu!");
        }
    })
}

function modify(elem){
    //make textarea working 
    elem = elem.parentElement;
    elem.querySelector("textarea").disabled = false;
    elem.querySelector(".old_tags").style.display = "none";
    elem.querySelector(".bootstrap-tagsinput").style.display = "block";



    //change action btn 
    elem.querySelector("button").onclick = null;
    elem.querySelector("button").onclick = function(){
        confirm_mod(elem);
    };
    elem.querySelector("button").textContent = "Confirma modificari";
    
}


function confirm_mod(elem){
    console.log(elem.dataset.cid);
    //ajax request 
    $.ajax({
        url: "/modify_custom_prod",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"cid":elem.dataset.cid,"keyw":get_keyw(elem),"details":elem.querySelector("textarea").value}),
        success: function(data){
            console.log(data);
            //update the old tags 
            if (data.keyw){
                Array.from(elem.querySelectorAll(".old_tag")).forEach(elem2=>{
                    elem2.remove();
                })
                elem.querySelector("button").onclick = null;

                elem.querySelector("button").onclick = function(){
                    modify(elem.querySelector("button"))
                }

                elem.querySelector("button").textContent = "Modifica";
                elem.querySelector(".bootstrap-tagsinput").style.display = "none";
                elem.querySelector(".old_tags").style.display = "block";

                elem.querySelector("textarea").disabled = true;
                let span;

                for (index in data.keyw){
                    if (data.keyw[index].trim()!=""){
                    span = document.createElement("span");
                    span.className = "old_tag";
                    span.textContent = data.keyw[index].trim();
                    elem.querySelector(".old_tags").appendChild(span);
                    }
                }
            }
        },
        error: function(){
            notify.show_error("Error!","Failed to modify the product");
        }
    })
}

function send_order()
{
    $.ajax({
        url: "/b2b_order",
        type: "POST",
        contentType: "application/json",
        success: function(data,textStatus,xhr){
                 notify.show_success("Success!","Your order has been sent!");
        },
        error: function(){
            notify.show_error("Error!","Please try again later");
        }
    })
}

function remove_item(id = null,point_id = null,changes = true,big_cart = true){
    let farmer_id = null;
    console.log(point_id)
    if (!id || !point_id || parseInt(point_id)!=point_id)
    {
        id = document.querySelector("#prod_id").value;
        point_id = new URLSearchParams(window.location.search).get("punct_livrare");
        farmer_id = document.querySelector("#farmer_id").value;
    }

    $.ajax({
        url: "/b2b_delete_from_cart",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"prod_id":id,"point_id":point_id,"farmer_id":farmer_id}),
        success: function (data){
            parse_order(false,big_cart);

            if (changes){

            let btn = document.querySelector(".default-btn");
            
            if ((btn.textContent.includes("Șterge") && !document.querySelector("#prod_id")) || ( btn.textContent.includes("Șterge") && parseInt(document.querySelector("#prod_id").value) == parseInt(id)))
            {
                //change 
                btn.innerHTML = `<i class="fas fa-cart-plus"></i> Adaugă la comandă`;
                btn.onclick = null;
                btn.onclick = function ()
                {
                    atc(id,point_id);
                }
            }
        }
        }
    })
}

function update_qty(cid = null,qty = 1){
    $.ajax({
        url: "/b2b_update_qty",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"cid":cid,"prod_id":get_prod_id(),"point_id": get_point_id(),"qty":cid == null ? document.querySelector("#qty").value : qty}),
        success: function(data){
            console.log(data);
        }

    })
}
