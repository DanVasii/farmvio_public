
var timeout = null,notify = null;

var star_index,remember_stars = 0;
const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
$(document).ready(function() {

    cookie_consent();
    try{    

   
    $("#svg_container").on("mouseover","*",function(elem){
        
        $("svg").append(elem.target);
    })

 
    
    parse_reviews();
}
    catch(e){
        //console.log(e);
    }
    
   
    if (location.pathname != "/index")
    notify = new Notify();
        

    $("#user_rating i ").on("mouseover",function(elem){

        star_index = $(this).parent().children('i').index(this);
        for (let i = 0;i<=star_index;i++)
            $("#user_rating i").eq(i).removeClass("far").addClass("fas")

        
    })

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


});
  



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

        // Sidebar Modal
        $(".burger-menu").on('click',  function() {
			$('.sidebar-modal').toggleClass('active');
		});
        $(".sidebar-modal-close-btn").on('click',  function() {
			$('.sidebar-modal').removeClass('active');
        });
        


        $(".home-slides").on("translate.owl.carousel", function(){
            $(".main-banner-content p").removeClass("animated fadeInUp").css("opacity", "0");
            $(".main-banner-content h1").removeClass("animated fadeInUp").css("opacity", "0");
            $(".main-banner-content .banner-btn").removeClass("animated fadeInUp").css("opacity", "0");
            $(".main-banner-content .banner-list").removeClass("animated fadeInUp").css("opacity", "0");
        });
        $(".home-slides").on("translated.owl.carousel", function(){
            $(".main-banner-content p").addClass("animated fadeInUp").css("opacity", "1");
            $(".main-banner-content h1").addClass("animated fadeInUp").css("opacity", "1");
            $(".main-banner-content .banner-btn").addClass("animated fadeInUp").css("opacity", "1");
            $(".main-banner-content .banner-list").addClass("animated fadeInUp").css("opacity", "1");
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



        // Services Slider
		$('.services-slider').owlCarousel({
			loop: true,
			nav: true,
			dots: false,
			autoplayHoverPause: true,
            autoplay: true,
            smartSpeed: 1000,
            items: 4,
            margin: 30,
            navText: [
                "<i class='flaticon-left'></i>",
                "<i class='flaticon-right'></i>"
            ],
            responsive: {
				0: {
					items: 1
				},
				576: {
					items: 2
				},
				768: {
					items: 3
				},
				1200: {
					items: 4
				}
			}
        });

       
        // Partner Slider
		$('.partner-slider').owlCarousel({
			loop: true,
			nav: true,
			dots: false,
			autoplayHoverPause: true,
            autoplay: true,
            navText: [
                "<i class='flaticon-left-1'></i>",
                "<i class='flaticon-right-1'></i>"
            ],
			responsive: {
                0: {
                    items: 2,
                },
                576: {
                    items: 3,
                },
                768: {
                    items: 4,
                },
                1200: {
                    items: 5,
                }
            }
        });

        // Client Slider
		$('.client-slider').owlCarousel({
			loop: true,
			nav: true,
			dots: false,
			autoplayHoverPause: true,
            autoplay: true,
            smartSpeed: 1000,
            margin: 20,
            navText: [
                "<i class='flaticon-left'></i>",
                "<i class='flaticon-right'></i>"
            ],
			responsive: {
                0: {
                    items: 1,
                },
                768: {
                    items: 2,
                },
                1200: {
                    items: 1,
                }
            }
        });

        // Feedback Slider
		$('.feedback-slider').owlCarousel({
			loop: true,
			nav: false,
            dots: true,
            margin: 30,
            center: true,
			autoplayHoverPause: true,
            autoplay: true,
            navText: [
                "<i class='flaticon-left-chevron'></i>",
                "<i class='flaticon-right-chevron'></i>"
            ],
			responsive: {
                0: {
                    items: 1,
                },
                768: {
                    items: 2,
                },
                1200: {
                    items: 3,
                },
                1550: {
                    items: 4,
				}
            }
        });

        try{
        // Nice Select JS
        $('select:not(.select_wpoint)').niceSelect();
        }
        catch{

        }
      
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


function search_for_the_point_name(data,searched_id){
    for (index in data){
        if (data[index].id == searched_id)
        {
            return data[index].judet+ ", "+data[index].oras+", "+data[index].adresa;
        }
    }
}

function search_for_seller_name(data,searched_id){
    for (index in data){
        if (data[index].id == searched_id)
        {
            return data[index].bis_name;
        }
    }
}






function parse_cost_estimate()
{
    $.ajax({
        url: "/cost_estimate",
        type: "POST",
        contentType: "application/json",
        success: function (data){
            if (data){
                for(index in data){
                    if (data[index].status == "fulfilled")
                    {
                        //this is ok
                        let select = document.querySelectorAll(".cart-wraps[data-wpid='"+data[index].value.wpid+"']")[0].getElementsByTagName("select")[0];
                        
                        if (data[index].value.selected){
                        //we firstly append the selected 
                        let option = document.createElement("option");
                        option.value = data[index].value.selected.service.id;
                        option.textContent = data[index].value.selected.price.total+ " - "+ data[index].value.selected.service.courierName;
                        select.appendChild(option);
                        }
                        //now for each courier 
                        for (index_courier in data[index].value.list)
                        {
                            if (index_courier>0 || (!data[index].value.selected)){
                            option = document.createElement('option');
                            option.value = data[index].value.list[index_courier].service.id;
                            option.textContent = data[index].value.list[index_courier].price.total+ " - "+data[index].value.list[index_courier].service.courierName;
                            select.appendChild(option);
                            }
                        }

                        //we can now update the totals 
                        document.querySelectorAll(".cart-wraps[data-wpid='"+data[index].value.wpid+"']")[0].getElementsByClassName("cost_produse")[0].textContent = calc_total(data[index].value.wpid) + " RON";                   
                        document.querySelectorAll(".cart-wraps[data-wpid='"+data[index].value.wpid+"']")[0].getElementsByClassName("final_total")[0].textContent = parseFloat(calc_total(data[index].value.wpid) + parseFloat(data[index].value?.selected?.price?.total || 0)).toFixed(2) + " RON";

                    }

                    }
            }
        }
    })
}

    function calc_total(wpid){
        let trs = document.querySelectorAll(".cart-wraps[data-wpid='"+wpid+"'] .prods")[0].querySelectorAll(".row");
        let total = 0;
        Array.from(trs).forEach(elem=>{
            if (elem.querySelector("#row_prod_total_price"))
            total+=parseInt(elem.querySelector("#row_prod_total_price").textContent);
        })
        return total;
    }

function change_all_couriers(elem){
    //lets change to all 
    //foreach select , select this option 
    let current_select = elem.parentElement.parentElement.parentElement.getElementsByTagName("select")[0];
    console.log(current_select);
    //get the checked option
    let current_value = current_select.options[current_select.selectedIndex].value;
    
    Array.from(document.getElementsByClassName("couriers")).forEach(select=>{
        select.value = current_value;
        change_this_courier(select);
    })
    
}

function change_this_courier(elem){
        let $parent = $(elem).parent().parent().parent().parent();
        let point = $parent.data("wpid");
       
        $.ajax({
            url: "/get_total_price_point",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({"point_id":point}),
            success: function(data){
               console.log(data);
                //here we update the prices
                if (data.total){
                    //here we update 
                    $parent.find(".cost_produse").text(data.total+" RON");
                    $parent.find(".final_total").text(parseFloat(parseFloat(data.total)+parseFloat(elem.options[elem.selectedIndex].textContent)).toFixed(2) + " RON");
                }
            }
        })
}

function send_order(){
    //we should send only the chosen transporters, because we already have everything in the cart 
    //foreach point_id get courier id 
    let data  = [];

    Array.from(document.getElementsByClassName("cart-wraps")).forEach(elem=>{
        //get the point_id 
        let point_id = elem.dataset.wpid;
        //get the selected value 
        let select = elem.getElementsByClassName("couriers")[0];
        if (select){
        let courier_id = elem.getElementsByClassName("couriers")[0].value;
        data.push({"point_id":point_id, "c_id": courier_id});
        }

    })
    
    $.ajax({
        url: "/send_order",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function(data){
            if (data == "OK")
            {
                notify.show_success("Mulțumim!","Comanda a fost înregistrată!");
                setTimeout(function(){
                    window.location.href = "/my_orders"
                },3000)
            }
            else{
                notify.show_error("Eroare","Te rugăm să încerci mai târziu!");
            }
        }
    })
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


function parse_reviews()
{
    $.ajax({
        url: "/parse_reviews",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"prod_id":document.querySelector("#prod_id").value}),
        success: function(data){
            if (data && data.length!=0){
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
        }
        else 
        {
            let p = document.createElement("p");
            p.textContent = "Nu sunt review-uri pentru acest produs!";
            document.querySelector(".review-comments").appendChild(p);

        }
        }
    })
}
function reverse(str){
    return str.split('-').reverse().join('-');
}


function open_atc(data){
    document.querySelector(".filters_container").style.transform = "scale(1)";
    $(".filters_bg").fadeIn("slow");
    //populate
    populate_big_atc(data);
}

function populate_big_atc(data)
{
    if (data.length!=0)
    {
        Array.from(document.querySelectorAll("#finish_atc .col-12")).forEach(elem=>{
            elem.remove();
        })
        let temp,frag;
        frag = document.createDocumentFragment();
        data.map(prod=>{
            temp = document.querySelector("#finish_atc_temp").content.cloneNode(true);
            let cols = temp.querySelectorAll(".col-auto");

            if (prod.prod_image)
            {
                cols[0].querySelector("img").src = "/uploads/"+prod.prod_image;
            }
            cols[1].textContent = prod.name;
            cols[2].textContent = prod.qty;
            cols[3].innerHTML = `<b>Livrat de catre: </b> ${prod.bis_name}`;
            cols[4].innerHTML = `<b>Livrat din: </b> ${prod.judet}, ${prod.oras}, ${prod.adresa}`
            cols[5].textContent = parseFloat((parseInt(prod.qty) * parseFloat(prod.price))) + " RON";
            
            frag.appendChild(temp);
        })

        document.querySelector("#finish_atc .row").appendChild(frag);
    }
    else{
        close_atc();
    }
}
function close_atc()
{
    document.querySelector(".filters_container").style.transform = "scale(0)";
    $(".filters_bg").fadeOut("slow");
}


function cookie_consent()
{
    $.ajax({
        url: "/cookie_consent",
        type: "POST",
        contentType: "application/json",
        success: function(data){
            //ok,consent 
        },error: function(){
               //init 
    let div = document.createElement("div");
    div.id = "cookie_c";
    div.style = "flex-wrap: wrap;font-size: 18px;;padding: 10px 0px;width: 100%; max-height: 300px; overflow: auto;position: fixed; bottom: 0px; left: 0px; background-color: #F4FAF4;z-index: 9999;display: flex;align-items: center; justify-content: center";
    div.textContent = "Acest site folosește \"cookies\". Navigând în continuare, vă exprimați acordul asupra folosirii acestora";
    let btn = document.createElement("button");
    btn.className = "dan";
    btn.style = "margin-left: 10px";
    btn.textContent = "Acceptă";
    btn.onclick = function(){
        accept_cookie(div);
    }

    div.appendChild(btn)
    btn = document.createElement("button");
    btn.className = "special2";
    btn.style = "margin-left: 10px";
    btn.onclick = function(){
        window.location.href = '/cookies'
    }
    btn.textContent = "Mai multe detalii";
    
    div.appendChild(btn)
    document.querySelector("body").appendChild(div);
        }

    })
 
}

function accept_cookie(elem)
{
    elem.remove();
    $.ajax({
        url: "/accept_cookie",
        type: "POST",
        contentType: "application/json",
        success: function(){

        }
    })
}

