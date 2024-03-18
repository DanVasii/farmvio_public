
var timeout = null,notify = null;
var star_index,remember_stars = 0;
const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

$(document).ready(function() {
    parse_cart_count();
    parse_order();
    parse_reviews();
    load_svg();  

    $("#user_rating i ").on("mouseover",function(elem){

        star_index = $(this).parent().children('i').index(this);
        for (let i = 0;i<=star_index;i++)
            $("#user_rating i").eq(i).removeClass("far").addClass("fas")

        
    })

    
    try{
    $(".select2").on("change",function(elem){
        if ($(".select2").val().trim()!="")
        window.location.href = $(".select2").val();
    })
    $(".select2").select2({
        dropdownPosition: 'below'
    });
}
catch{

}

    $("#user_rating i ").on("click",function(elem){

        star_index = $(this).parent().children('i').index(this);
        remember_stars = star_index+1;
    })


    $("#user_rating i").on("mouseout",function(elem){    

        star_index = $(this).parent().children('i').index(this);
        for (let i = 0;i<=4;i++)
        $("#user_rating i").eq(i).removeClass("fas").addClass("far")

    })


    $("#user_rating").on("mouseout",function(elem){
        if (!elem.relatedTarget.className.includes("fa-star"))
        for (let i = 1;i<=remember_stars;i++)
        $("#user_rating i").eq(i - 1).removeClass("far").addClass("fas")
    })



    $("#svg_container").on("mouseover","*",function(elem){
        
        $("svg").append(elem.target);
    })

    $(".cart_content").on("change","input[type='number']",function(elem){
        let cid = elem.target.parentElement.dataset.cid;
        let value = elem.target.value;

        update_qty(cid,value);
    })

    if (location.pathname != "/index")
    notify = new Notify();

  
  });
  

  function load_svg()
  {
      $.ajax({
          url: "/views/drawing-3.svg",
          type: "GET",
          success: function(data){
              document.getElementById("svg_container")?.appendChild(data.documentElement);
          }
      })
  }


(function($){
	"use strict";
	jQuery(document).on('ready', function () {

        // Header Sticky
		$(window).on('scroll',function() {
            if ($(this).scrollTop() > 120){  
                $('.navbar-area').addClass("is-sticky");
            }
            else{
                $('.navbar-area').removeClass("is-sticky");
            }
        });

        // Header Sticky
		$(window).on('scroll',function() {
            if ($(this).scrollTop() > 120){  
                $('.navbar-area-three').addClass("is-sticky");
            }
            else{
                $('.navbar-area-three').removeClass("is-sticky");
            }
        });
        
        // Mean Menu
		jQuery('.mean-menu').meanmenu({
			meanScreenWidth: "991"
        });

        // Button Hover JS
        $(function() {
            $('.default-btn')
            .on('mouseenter', function(e) {
                var parentOffset = $(this).offset(),
                relX = e.pageX - parentOffset.left,
                relY = e.pageY - parentOffset.top;
                $(this).find('span').css({top:relY, left:relX})
            })
            .on('mouseout', function(e) {
                var parentOffset = $(this).offset(),
                relX = e.pageX - parentOffset.left,
                relY = e.pageY - parentOffset.top;
                $(this).find('span').css({top:relY, left:relX})
            });
        });



		
        // Odometer JS
         $('.odometer').appear(function(e) {
			var odo = $(".odometer");
			odo.each(function() {
				var countNumber = $(this).attr("data-count");
				$(this).html(countNumber);
			});
        });
        
        // Tabs
        (function ($) {
            $('.tab ul.tabs').addClass('active').find('> li:eq(0)').addClass('current');
            $('.tab ul.tabs li a').on('click', function (g) {
                var tab = $(this).closest('.tab'), 
                index = $(this).closest('li').index();
                tab.find('ul.tabs > li').removeClass('current');
                $(this).closest('li').addClass('current');
                tab.find('.tab_content').find('div.tabs_item').not('div.tabs_item:eq(' + index + ')').slideUp();
                tab.find('.tab_content').find('div.tabs_item:eq(' + index + ')').slideDown();
                g.preventDefault();
            });
        })(jQuery);




        // Popup Image
        $('a[data-imagelightbox="popup-btn"]')
        .imageLightbox({
            activity: true,
            overlay: true,
            button: true,
            arrows: true
        });

        // FAQ Accordion
        $(function() {
            $('.accordion').find('.accordion-title').on('click', function(){
                // Adds Active Class
                $(this).toggleClass('active');
                // Expand or Collapse This Panel
                $(this).next().slideToggle('fast');
                // Hide The Other Panels
                $('.accordion-content').not($(this).next()).slideUp('fast');
                // Removes Active Class From Other Titles
                $('.accordion-title').not($(this)).removeClass('active');		
            });
        });

        // Subscribe form
		$(".newsletter-form").validator().on("submit", function (event) {
			if (event.isDefaultPrevented()) {
			// handle the invalid form...
				formErrorSub();
				submitMSGSub(false, "Please enter your email correctly.");
			} else {
				// everything looks good!
				event.preventDefault();
			}
		});
		function callbackFunction (resp) {
			if (resp.result === "success") {
				formSuccessSub();
			}
			else {
				formErrorSub();
			}
		}
		function formSuccessSub(){
			$(".newsletter-form")[0].reset();
			submitMSGSub(true, "Thank you for subscribing!");
			setTimeout(function() {
				$("#validator-newsletter").addClass('hide');
			}, 4000)
		}
		function formErrorSub(){
			$(".newsletter-form").addClass("animated shake");
			setTimeout(function() {
				$(".newsletter-form").removeClass("animated shake");
			}, 1000)
		}
		function submitMSGSub(valid, msg){
			if(valid){
				var msgClasses = "validation-success";
			} else {
				var msgClasses = "validation-danger";
			}
			$("#validator-newsletter").removeClass().addClass(msgClasses).text(msg);
        }

        // AJAX MailChimp
		$(".newsletter-form").ajaxChimp({
			url: "https://envytheme.us20.list-manage.com/subscribe/post?u=60e1ffe2e8a68ce1204cd39a5&amp;id=42d6d188d9", // Your url MailChimp
			callback: callbackFunction
        });

        // Nice Select JS
        $('select:not(.select_wpoint)').niceSelect();

        // Input Plus & Minus Number JS
        $('.input-counter').each(function() {
            var spinner = jQuery(this),
            input = spinner.find('input[type="text"]'),
            btnUp = spinner.find('.plus-btn'),
            btnDown = spinner.find('.minus-btn'),
            min = input.attr('min'),
            max = input.attr('max');
            
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

        // Go to Top
        $(function(){
            // Scroll Event
            $(window).on('scroll', function(){
                var scrolled = $(window).scrollTop();
                if (scrolled > 600) $('.go-top').addClass('active');
                if (scrolled < 600) $('.go-top').removeClass('active');
            });  
            // Click Event
            $('.go-top').on('click', function() {
                $("html, body").animate({ scrollTop: "0" },  500);
            });
		});
		
   		// Preloader
		jQuery(window).on('load', function() {
			$('.preloader').fadeOut();
        });
        
    });
    
}(jQuery));




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

    let top_navbar = (document.querySelector(".navbar-area")?.clientHeight -34)/2 || (document.querySelector(".navbar-area-three")?.clientHeight -34)/2 || 0;

   

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

function submit_review()
{
    let title = document.querySelector("#review-title").value;
    let content = document.querySelector("#review-body").value;

    let stars = remember_stars;

    $.ajax({
        url: "/send_review",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({title,content,stars}),
        success: function(data){
           
            //remove prev errors 
            document.querySelectorAll(".review-form .invalid-feedback").forEach(elem=>{
                elem.style.display = "none";
            })
           if (data!="OK")
           {
                Object.keys(data).map(error=>{
                    document.querySelector("."+error).style.display = "block";
                    document.querySelector("."+error).textContent = data[error];
                })
           }
           else{
               notify.show_success("Succes!","Review-ul a fost trimis!")
               //disable the button 
               document.querySelector(".review-form form button").disabled = true;
               //we should prepend 
           }
        }
    })
}

function parse_reviews()
{
    $.ajax({
        url: "/parse_reviews",
        type: "POST",
        contentType: "application/json",
        success: function(data){
            //we should populate 
            let i,star,temp,frag,star_done;
            frag = document.createDocumentFragment();
            data.map(rating=>{
                star_done = 5;
                temp = document.querySelector("#review").content.cloneNode(true);
                //populate stars 

                for (i=1;i<=parseInt(rating.stars);i++){
                    star = document.createElement("i");
                    star.className = "fas fa-star";
                    temp.querySelector(".rating").appendChild(star);
                    star_done--;
                }
                if(rating.stars - parseInt(rating.stars)>0){
                    star = document.createElement("i");
                    star.className = "fas fa-star-half-alt";
                    temp.querySelector(".rating").appendChild(star);
                    star_done--;
                }
                for (i=1;i<=star_done;i++){
                    star = document.createElement("i");
                    star.className = "far fa-star";
                    temp.querySelector(".rating").appendChild(star);
                }

                //append the title 
                temp.querySelector("h3").textContent = rating.title;

                //add username 
                if (rating.edit == 1){
                temp.querySelector(".user_by").innerHTML = `<b>${rating.username}</b>`;
                    temp.querySelector(".edit_review").onclick = function(){
                        edit_review(this);
                    }
                    temp.querySelector(".finish_edit").onclick = function(){
                        finish_edit_review(this,rating.id);
                    }

            }
                else{
                    temp.querySelector(".user_by").textContent = `${rating.username}`;
                    temp.querySelector(".edit_review").remove();
                    temp.querySelector(".finish_edit").remove();
                }
                //add date 
                let normal_date = rating.created_at.split("T");
                normal_date = reverse(normal_date[0]);
                let dates = normal_date.split("-");
                temp.querySelector(".date_review").textContent = dates[0] + " "+ monthNames[parseInt(dates[1]) - 1] + " " + dates[2];


                //add the review 
                temp.querySelector("p").textContent = rating.comments;

                frag.appendChild(temp);

            })

            document.querySelector(".review-comments").appendChild(frag);
            console.log(data);
        }
    })
}

function reverse(str){
    return str.split('-').reverse().join('-');
}

function edit_review(elem){
    let parent = elem.parentElement;
    //let's prepare for edit 
    //show button 
    parent.querySelector(".finish_edit").style.padding = ".375rem .75rem";
    parent.querySelector(".finish_edit").style.maxHeight = "100px";

    let invalid ;
    //prepare title 
    let title = parent.querySelector("h3");
    let title_input;

    title_input = document.createElement("input");
    title_input.className = "review_title_edit form-control";
    title_input.value = title.textContent;
    title.textContent = "";
    title.appendChild(title_input);

    //add the invalid feedbacl
    invalid = document.createElement("div");
    invalid.className = "invalid-feedback edit_title";
    title.appendChild(invalid);
    //prepare content 

    let content = parent.querySelector("p");
    let content_input;

    content_input  = document.createElement("textarea");
    content_input.className = "form-control review_content_edit";
    content_input.value = content.textContent;
    
    content.textContent = "";

    content.appendChild(content_input);
        //add the invalid feedbacl
        invalid = document.createElement("div");
        invalid.className = "invalid-feedback edit_content";
    content.appendChild(invalid);

}

function finish_edit_review(review,review_id){
    review = review.parentElement;
    //call the ajax 
    $.ajax({
        url: "/edit_review",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({review_id,"title":review.querySelector(".review_title_edit").value,"content": review.querySelector(".review_content_edit").value}),
        success: function (data){

            if (data == "OK"){
                //let's remvoe the inputs 

                //title
                review.querySelector("h3").textContent = review.querySelector("h3 input").value;              

                //content 
                review.querySelector("p").textContent = review.querySelector("p textarea").value;
                //now we can remove the finsih 
                review.querySelector(".finish_edit").style.padding = "0px";
                review.querySelector(".finish_edit").style.maxHeight = "0px";
                notify.show_success("Succes!","Review modificat!");
            }
            else{
                Object.keys(data).map(err=>{
                    review.querySelector(".invalid-feedback."+err).textContent = data[err];
                    review.querySelector(".invalid-feedback."+err).style.display = "block";
                })
            }

        },error: function(){
            notify.show_error("Eroare!","Te rugam sa incerci mai tarziu!");
        }
    })
}