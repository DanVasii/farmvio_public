var current_prod_id = -1;
var timeout = null;
var parse_cart_timeout = null;
$(document).ready(function(){
   init_counters();
    $(window).on("scroll",function(){
        
        hide_cart();
})  
try{
$(".select2").select2({
    dropdownPosition: 'below'
});

$(".select2:not(.content-wrapper .select2)").on("change",function(elem){
    if ($(".select2").val().trim()!="")
    window.location.href = $(".select2").val();
    else{
        let link = window.location.href;
        window.location.href = link.split("?punct_livrare")[0];
    }
})
}
catch{
    
}

$(".select_wpoint").on("change",function(evt){
    console.log("changed");
    let wpid = this.value;
   
    update_cart_details(wpid);
    //change atc button function
    document.querySelector(".filters_container #qty").onchange = null;
    document.querySelector(".filters_container #qty").onchange = function(){
        update_cart_qty(current_prod_id,this,wpid);
    }
    document.querySelector(".filters_container .atc_button").onclick = ()=>{
        atc(current_prod_id,parseInt(wpid))
    }
})

    get_cart();
    parse_cart(true);
})

function init_counters(){
    // Input Plus & Minus Number JS
    $('.input-counter').each(function() {
   
      var spinner = jQuery(this),
      input = spinner.find('input[type="text"]'),
      btnUp = spinner.find('.plus-btn'),
      btnDown = spinner.find('.minus-btn'),
      min = input.attr('min'),
      max = input.attr('max');

      console.log(btnUp);
      
      btnUp.on('click', function() {
          var oldValue = parseFloat(input.val());
          if (oldValue >= max) {
              var newVal = oldValue;
          } else {
              var newVal = oldValue + 1;
          }
          spinner.find("input").val(newVal);
          spinner.find("input").trigger("change");
      });
      btnDown.on('click', function() {
          var oldValue = parseFloat(input.val());
          if (oldValue <= min) {
              var newVal = oldValue;
          } else {
              var newVal = oldValue - 1;
          }
          spinner.find("input").val(newVal);
          spinner.find("input").trigger("change");
      });
  });
}

function atc(prod_id = null, point_id = null,farmer_id = null,btn = null,new_btn = false){
   
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
    let qty = document.getElementById("qty")?.value || 1;
    
    $.ajax({
        url: "/atc",
        type: "POST",   
        contentType: "application/json",
        data: JSON.stringify({"prod_id": prod_id,"qty":qty,"point_id": point_id ,"farmer_id": parseInt(farmer_id)}),      
        success: function(data){
            if (data == "OK"){            
                    parse_cart();
                    if (!new_btn){
                    if (!btn)
                    btn = document.querySelector(".default-btn"); 
                    //replace this button with remove 
                    btn.innerHTML = '<i class="far fa-trash-alt"></i>Șterge din coș';
                    btn.onclick = null;
                    btn.onclick = function ()
                    {
                        remove_item(prod_id,point_id,true,farmer_id,btn);
                    }
                }
                else{
                    //start anim 
                    btn.querySelector(".animation_atc").style.zIndex  = 5;
                    btn.querySelector(".animation_atc").style.opacity = 1;
            
                    setTimeout(function(){
                        btn.querySelector(".basket_handler").classList.add("basket_handler_anim");
                        btn.querySelector(".product_fake").classList.add("product_fake_anim");	
            
                    //update atc ui
                    if (!btn.dataset.qty_menu){
                    btn.classList.add("pressed");
                    }
                    else{
                        btn.querySelector("text_elem").textContent = "Șterge din coș";
                    }
                            //change the icon 
                            btn.querySelector(".action_icon i").className = "fa-duotone fa-trash";
                            btn.querySelector(".action_icon i").id = null;
                            btn.querySelector("input").value = "1";
                            //TODO
                            btn.onclick = "";
                           
                        setTimeout(function(){
                            
                            btn.querySelector(".animation_atc").style.opacity = 0;
                            btn.querySelector(".basket_handler").classList.remove("basket_handler_anim");
                            btn.querySelector(".product_fake").classList.remove("product_fake_anim");	
                            setTimeout(function(){
                                btn.querySelector(".animation_atc").style.zIndex = -1;
                                btn.querySelector(".action_icon").onclick = function(){

                                    remove_item(prod_id,point_id,true,farmer_id,btn,true);
                                }
                            },400);
            
                        },1200);
                    },400)
                }
                    $(".select2-container--default .select2-selection--single").css("border","1px solid #aaa");
            }
            
        },error: function()
        {
            if ($(".select2").val()?.trim()=="" || $(".select_wpoint").val()?.trim()=="" || $(".select_wpoint").val()==null)
            {
                
                $(".select2-container--default .select2-selection--single").css("border","1px solid red");
                $(".select_wpoint").css("border","1px solid red");
                notify.show_error("Eroare!","Te rugăm să selectezi un punct de livrare!");
            }
            else{
                notify.show_error("Eroare!","Te rugăm să încerci mai târziu!");
            }
        }
    })
}

function get_cart(){
    $.ajax({
        url:"/cart_count",
        type: "GET",
        success: function(data){
            $(".cart-btn span").text(data.count);
        }
    })
}

function check_cart(){
    $.ajax({
        url: "/check_cart",
        type: "POST",
        success: function(data){
            console.log(data);
        }
    })
}

function parse_cart(big_cart_needed = false){
    //first remove all
    Array.from(document.getElementsByClassName("cart_item")).forEach(element => {
            element.remove();
    });
    
   
    $.ajax({
        url:"/cart_prods",
        type: "GET",
        success: function(data){
           let parent,frag;
           parent = document.getElementsByClassName("cart_content")[0];
           frag = document.createDocumentFragment();
            console.log(data);
            if (data.length!=0 && Object.keys(data).length!=0){
                $(".cart-btn span").text(data.length);
                
               //append the products in the cart container
                let cart_obj,cart_item,img,span,close;

                for (index in data){
                    cart_obj = data[index];

                    cart_item = document.createElement("div");
                    cart_item.className = "cart_item";
                    cart_item.style = "flex-wrap: wrap";
                    
                    img = document.createElement("img");
                    if (cart_obj.prod_image)
                    img.src = `/uploads/${cart_obj.prod_image}`;
                    else
                    img.src = '/assets/images/icons/no_image.png';
                    cart_item.appendChild(img);

                    span = document.createElement("span");
                    span.textContent = cart_obj.name;
                    cart_item.appendChild(span);
                    
                    let input = document.createElement("input");
                    input.type = "number";
                    input.value = cart_obj.qty;
                    let id = cart_obj.product_id;
                    console.log(cart_obj);
                    let point_id = cart_obj.point_id;

                    input.onchange = function(){
                        update_cart_qty(id,input,point_id);
                    }
                    cart_item.appendChild(input);

                    close = document.createElement("i");
                    close.className = "far fa-window-close close_cart";

                    close.onclick = function(){
                        remove_item(id,point_id);
                    }
                    cart_item.appendChild(close);

                    span = document.createElement("span");
                    span.textContent = cart_obj.price+" RON";
                    cart_item.appendChild(span);

                    let p,b,text;

                    p = document.createElement("p");
                    p.style = "flex: none;max-width: 100%; font-size: 12px";
                    b = document.createElement("b");
                    b.textContent = "Livrat din: ";
                    text = document.createTextNode(`${cart_obj.judet}, ${cart_obj.oras}, ${cart_obj.adresa}`)
                    p.appendChild(b);
                    p.appendChild(text);
                    cart_item.appendChild(p);
                    frag.appendChild(cart_item);
                }
                parent.appendChild(frag);

           }
           else{
               
            $(".cart-btn span").text("0");
            let p;
            p = document.createElement("p");
            p.textContent =  "Coșul tău este gol";
            frag.appendChild(p);
            parent.appendChild(frag);   
             
           }
           let big_cart = !!document.getElementById("all_orders");
        
           if (big_cart && big_cart_needed){                
               populate_big_cart(data);
           }
        }
    })
}



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
    if (left<0)
    left = 0;
    let top = parseInt($cart.top);
    let scroll = document.documentElement.scrollTop;

    let top_navbar = (document.querySelector(".navbar-area")?.clientHeight -34)/2 || (document.querySelector(".navbar-area-three")?.clientHeight -34)/2 || document.querySelector(".navbar")?.clientHeight - 20 || 0;

   

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
function update_cart_qty(id,elem,point_id,farmer_id = null){
    if (point_id == null){
        point_id = new URLSearchParams(window.location.search).get("punct_livrare");
    }
    //post request to the /update_qty
    $.ajax({
        url: "/update_cart_qty",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"prod_id":id,"qty":elem.value,"point_id":point_id,"farmer_id": farmer_id}),
        success: function(data){
            if (parse_cart_timeout){
                clearTimeout(parse_cart_timeout);
            }
            parse_cart_timeout = setTimeout(function(){
                parse_cart(false);
            },1000);
            
        }
    })
}

function remove_item(id = null,point_id = null,changes = true,farmer_id = null,btn = null,new_btn = false){
    console.log(id+ " "+point_id+" "+farmer_id);
    if (!id || !point_id)
    {
        id = document.querySelector("#prod_id").value;
        point_id = new URLSearchParams(window.location.search).get("punct_livrare");
        farmer_id = document.querySelector("#farmer_id").value;
    }

    $.ajax({
        url: "/remove_cart_item",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"prod_id":id,"point_id":point_id,"farmer_id":farmer_id}),
        success: function (data){
            parse_cart();
            if (!new_btn){
            if (changes){
                if (!btn)
                btn = document.querySelector(".default-btn");
            
            if ((!document.querySelector("#prod_id")  &&  btn.textContent.includes("Șterge")) || ( btn.textContent.includes("Șterge") && parseInt(document.querySelector("#prod_id")?.value) == parseInt(id) ))
            {
                //change 
                btn.innerHTML = `<i class="fas fa-cart-plus"></i> Adaugă în coș`;
                btn.onclick = null;
                btn.onclick = function()
                {
                    atc(id,point_id,farmer_id,btn);
                }
            }
        }
    }
    else{
        if (btn.dataset.qty_menu)
        btn.querySelector("text_elem").textContent = "Adaugă în coș";
        else
        {
            btn.classList.remove("pressed");
            btn.querySelector("input").value = 1;
        }
		btn.querySelector(".action_icon i").id = "basket_left";
		btn.querySelector(".action_icon i").className = "fa-duotone fa-basket-shopping-simple";
        btn.onclick = function()
        {
            atc(id,point_id,farmer_id,btn,new_btn);
        }
    }
        }
    })
}

function populate_big_cart(data){
    console.log("populate");
    //remove prev 

    Array.from(document.querySelectorAll("#all_orders div,#all_orders p")).forEach(elem=>{
        elem.remove();
    })

    if (data.length==0){
        console.log("(")
        let p  = document.createElement("p");
        p.textContent = "Nu sunt produse în coș!";
        p.style = "font-size: 20px; font-weight: bold; text-align: center"
        document.querySelector("#all_orders").appendChild(p);
    }
                //its ok
                let frag,parent;

    frag = document.createDocumentFragment();
    parent = document.getElementById("all_orders");

    //get all the point ids 
    let point_ids = [];
    for (index in data){
        if (!point_ids.includes(data[index].point_id)){
            point_ids.push(data[index].point_id);
        }
    }

    //now, foreach point id appenc the products 
    for (index in point_ids){
        let point_id = point_ids[index];
            console.log(data);
        //create the template 
        let template = document.getElementById("products_table").content.cloneNode(true);
        template.querySelector(".cart-wraps").dataset.wpid = point_id;
        template.querySelector(".from_del").textContent = `${data[index].judet}, ${data[index].oras}, ${data[index].adresa}`;
        template.querySelector(".by_del").textContent = data[index].bis_name;

        

        //foreach products that has this point id
        for (index in data ){
            let total
            if (data[index].point_id == point_id)
            {
               
                //create the row_template 
                let row_template = document.getElementById("products_row").content.cloneNode(true);
                if (data[index].prod_image)
                row_template.querySelector("img").src = "/uploads/"+data[index].prod_image;
                //updathe the data 
                row_template.querySelector("#row_prod_name").textContent = data[index].name;

                row_template.querySelector("#row_prod_price").textContent = data[index].price + " RON / unitate";

                row_template.querySelector("#row_prod_qty").value = data[index].qty;
                
                row_template.querySelector("#row_prod_total_price").textContent = (parseInt(data[index].qty) * parseInt(data[index].price)) + " RON";
                let prod_id = data[index].product_id;

                row_template.querySelector("#row_prod_qty").onchange = function(){
                    update_cart_qty(prod_id,this,point_id)
                }

                row_template.querySelector("button").onclick = function(){
                    this.parentElement.parentElement.remove();
                    remove_item(data[index].product_id,data[index].point_id,false);
                }

                template.querySelector(".prods").appendChild(row_template);
            }
        }
        frag.appendChild(template);

        
        
    }
    parent.appendChild(frag);
    parse_cost_estimate();
    init_counters();

    
}



function populate_prod_data(prod_id,farm_info = false)
{
    $.ajax({
        url: "/get_prod_data",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"prod_id":prod_id,farm_info}),
        success: function(data)
        {
           
            if (data.prod_data)
            {
                let prod_data = data.prod_data;
                current_prod_id = prod_id;
                //clear the select 
                Array.from(document.querySelectorAll(".select_wpoint option")).forEach((elem,index)=>
                    {
                        if(index!=0)
                       elem.remove();
                    })
                let parent = document.querySelector("#custom_atc");
                parent.querySelector("h3").textContent = prod_data.details.name;
                
                refresh_new_atc(parent.querySelector(".atc_button"));
                refresh_select();

                parent.querySelector(".new-price").textContent = prod_data.details.price + " RON / "+prod_data.details.unit;
                parent.querySelector("p").textContent = prod_data.details.description;
                let aux,img;

                if ($big_car)
                refresh_carousel();


                //set images 
                if (prod_data.images.length!=0)
                {
                    for (index in prod_data.images)
                    {
                        aux = document.createElement("div");
                        aux.className = "item";

                        img = document.createElement("img");
                        img.src = `/uploads/${prod_data.images[index].file_name}`;

                        aux.appendChild(img);


                        document.querySelector("#big").appendChild(aux);
                        //add as thumb to 
                        aux = document.createElement("div");
                        aux.className = "item";

                        img = document.createElement("img");
                        img.src = `/uploads/${prod_data.images[index].file_name}`;

                        aux.appendChild(img);
                        document.querySelector("#thumbs").appendChild(aux);
                    }
                    
                }
                else{
                    //just add
                    aux = document.createElement("div");
                    aux.className = "item";

                    img = document.createElement("img");
                    img.src = `/assets/images/icons/no_image.png`;

                    aux.appendChild(img);


                    document.querySelector("#big").appendChild(aux);
                    //add as thumb to 
                    aux = document.createElement("div");
                    aux.className = "item";

                    img = document.createElement("img");
                    img.src = `/assets/images/icons/no_image.png`;

                    aux.appendChild(img);
                    document.querySelector("#thumbs").appendChild(aux);            
                }
                re_init_carousel(prod_data.images.length);


                //add wpoints 
                if (prod_data.points)
                {
                    let option,select = document.querySelector(".select_wpoint");
                    for (index in prod_data.points){
                            
                        option = document.createElement("option");
                        option.value = prod_data.points[index].id;

                        option.textContent = `${prod_data.points[index].judet}, ${prod_data.points[index].oras}, ${prod_data.points[index].adresa}`;

                        select.appendChild(option);
                    }

                    if (select.dataset?.cool_select_init){
                        cool_select_replace(select,1,{width: "100%"},true);
                    }
                    else
                    cool_select(document.querySelector(".select_wpoint"),{width:"100%"});
                    
                }
                else{
                    current_prod_id = -1;
                    close_window();
                }
            }else{
                current_prod_id = -1;
                close_window();
            }
            if (data.farm_pics){
                //set the farm pics
                let farm_pics = data.farm_pics;
                //set the farm name and link 
                if (data.farm_info && data.farm_info.length!=0)
                    {
                        document.querySelector("#custom_atc .farm_details a").textContent = data.farm_info[0].bis_name;
                        document.querySelector("#custom_atc .farm_details a").href = `/profile/${data.farm_info[0].slug}`;
                    }
                //default if no cover is set
                    document.querySelector("#custom_atc .about-image img").src = `/uploads/${farm_pics[0].image_name}`;
                let slider_items_frag = document.createDocumentFragment();

                farm_pics.forEach((farm_pic)=>{
                    if (farm_pic.cover == 1)
                    {
                        document.querySelector("#custom_atc .about-image img").src = `/uploads/${farm_pic.image_name}`;
                    }
                    else{
                        let temp = document.querySelector("#about_slide").content.cloneNode(true);
                        temp.querySelector('img').src = `/uploads/${farm_pic.image_name}`;
                        temp.querySelector(".about-text h3").textContent = farm_pic.descriere;
                        slider_items_frag.appendChild(temp);
                    }
                })

                //not init or re-init the carousel 
                if (document.querySelectorAll("#farm_pres .owl-loaded").length==0)
                    {
                        //init  
                        document.querySelector(".about-slider").appendChild(slider_items_frag);
                        $('.about-slider').owlCarousel({
                            loop: true,
                            nav: true,
                            dots: false,
                            autoplayHoverPause: true,
                            autoplay: true,
                            smartSpeed: 1000,
                            items: 2,
                            margin: 30,
                            navText: [
                                "<i class='fa-solid fa-angle-left'></i>",
                                "<i class='fa-solid fa-angle-right'></i>"
                            ],
                            responsive: {
                                0: {
                                    items: 1
                                },
                                576: {
                                    items: 1
                                },
                                768: {
                                    items: 1,
                                    stagePadding: 100
                                },
                                1200: {
                                    items: 1,
                                    stagePadding: 100
                                }
                            }
                            
                        });
                    }
                    else{
                        //remove all items 
                        for (let i = 0;i<$(".about-item").length;i++)
                            {
                                $(".about-slider").trigger('remove.owl.carousel', i);
                            }
                            //re-append the images 
                            let arr = Array.from(slider_items_frag.querySelectorAll(".about-item"));
                            for (let i =0;i<arr.length;i++)
                                 $(".about-slider").trigger('add.owl.carousel',arr[i]);                           

                            //refresh  
                            $(".about-slider").trigger('refresh.owl.carousel');
                    }

            }
        },error: function()
        {
            current_prod_id = -1;
            close_custom_atc();
        }
    })
}

function refresh_carousel()
{
    $big_car.trigger('destroy.owl.carousel'); 
    $big_car.find('.owl-stage-outer').children().unwrap();
    $big_car.removeClass("owl-center owl-loaded owl-text-select-on");

    $thumb_car.trigger('destroy.owl.carousel'); 
    $thumb_car.find('.owl-stage-outer').children().unwrap();
    $thumb_car.removeClass("owl-center owl-loaded owl-text-select-on");
    console.log("f");
                    //remove all images 
                    Array.from(document.querySelectorAll("#big .item")).forEach(elem=>{
                        elem.remove();
                    })
                    Array.from(document.querySelectorAll("#thumbs .item")).forEach(elem=>{
                        elem.remove();
                    })
}


function re_init_carousel(len)
{
    
    $big_car =  bigimage
    .owlCarousel({
    items: 1,
    slideSpeed: 2000,
    nav: true,
    autoHeight: false,
    autoplay: false,
    dots: false,
    loop: true,
    responsiveRefreshRate: 200,
    navText: [
      '<i class="fa fa-arrow-left" aria-hidden="true"></i>',
      '<i class="fa fa-arrow-right" aria-hidden="true"></i>'
    ]
  })
    .on("changed.owl.carousel", syncPosition);

  $thumb_car =  thumbs
    .on("initialized.owl.carousel", function() {

    thumbs
      .find(".owl-item")
      .eq(0)
      .addClass("current");
  })
    .owlCarousel({
    items: len,
    smartSpeed: 200,
    slideSpeed: 500,
    responsiveRefreshRate: 100,
    responsive:
    {
        0: {
            items: 1
        },
        576: {
            items: 1
        },
        768: {
            items: 2
        },
        1200: {
            items: 4
        }
    }
  })
    .on("changed.owl.carousel", syncPosition2);
}


function syncPosition(el) {
    try{
    //if loop is set to false, then you have to uncomment the next line
    //var current = el.item.index;

    //to disable loop, comment this block
    var count = el.item.count - 1;
    var current = Math.round(el.item.index - el.item.count / 2 - 0.5);

    if (current < 0) {
      current = count;
    }
    if (current > count) {
      current = 0;
    }

    console.log(current);
    //to this
    thumbs
      .find(".owl-item")
      .removeClass("current")
      .eq(current)
      .addClass("current");
    var onscreen = thumbs.find(".owl-item.active").length - 1;
    var start = thumbs
    .find(".owl-item.active")
    .first()
    .index();
    var end = thumbs
    .find(".owl-item.active")
    .last()
    .index();

    console.log(start + " "+end)
    if (current > end) {
      $thumbs.data("owl.carousel").to(current, 100, true);
    }
    if (current < start) {
      $thumbs.data("owl.carousel").to(current - onscreen, 100, true);
    }
}
catch(e)
{}
  }


  function syncPosition2(el) {
    if (true) {
      var number = el.item.index;
      bigimage.data("owl.carousel").to(number, 100, true);
    }
  }


  function update_cart_details(point_id)
{   
    $.ajax({
        url: "/get_cart_details",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"prod_id": current_prod_id,"point_id": point_id}),
        success: function(data){
            //CHANGE AFTER ATC BTN IMPLEMENTATION

            let btn = document.querySelector(".filters_container .default-btn") || false;
            if (btn){
                if (data.length==0)
                {
                    //atc 
                    document.querySelector(".filters_container .input-counter input").value = 1;
                    btn.innerHTML = `<i class="fas fa-cart-plus"></i>  ${global_add}`;
                    btn.onclick = null;
                    btn.onclick = function()
                    {
                        atc(current_prod_id,point_id);
                    }
                }
                else{
                    document.querySelector(".input-counter input").value = data[0].qty || data[0].prod_qty;
                    btn.innerHTML = `<i class="far fa-trash-alt"></i> ${global_remove}`;
                    btn.onclick = null;
                    btn.onclick = function()
                    {
                        remove_item(current_prod_id,point_id);
                    }
                }
            }
            else{
                btn = document.querySelector(".filters_container .atc_button");
              
                if (data.length==0)
                {
                    document.querySelector(".filters_container .input-counter input").value = 1;
                    //atc 
                    //render the atc button
                    refresh_new_atc(btn);

                    btn.onclick = function()
                        {
                            atc(current_prod_id,point_id,null,btn,true);
                        }
                }
                else{
                    document.querySelector(".filters_container .input-counter input").value = data[0].qty || data[0].prod_qty;
                    //render remove atc_button
                    btn.querySelector("text_elem").textContent = "Șterge din coș";
                    btn.querySelector(".action_icon i").className = "fa-duotone fa-trash";
                    btn.querySelector(".action_icon i").id = "";
                    btn.onclick = null;
                    btn.onclick = function()
                    {
                        remove_item(current_prod_id,point_id,true,null,btn,true);
                    }
                }
            }
        }
    })

}


function refresh_new_atc(btn)
{
        btn.querySelector("text_elem").textContent = "Adaugă în coș";
        btn.querySelector(".action_icon i").className = "fa-duotone fa-basket-shopping-simple";
        btn.querySelector(".action_icon i").id = "basket_left";
        btn.onclick = function(){
            atc();
        };
        
}

function refresh_select()
{
    $(".select2-container--default .select2-selection--single").css("border","");
    $(".select_wpoint").css("border","");
}