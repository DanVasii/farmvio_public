var bigimage,thumbs, $big_car,$thumb_car,current_prod_id = -1;

bigimage = $("#big");
thumbs = $("#thumbs");


$(document).ready(function(){

    
   
    $(".select_wpoint").on("change",function(elem){
        if (elem.currentTarget.value.trim()!="")
        {
            update_cart_details(elem.currentTarget.value);
        }
        else{
            document.querySelector(".default-btn").onclick = null;
            
        }
    })

  thumbs.on("click", ".owl-item", function(e) {
      
    e.preventDefault();
    var number = $(this).index();
    bigimage.data("owl.carousel").to(number, 300, true);
  });



    // populate_prods();
    // populate_about_slider();
    // load_reviews();
    // get_working_points()

    // parse_avize();
 

})


function update_cart_details(point_id)
{   
    console.log("UPDATE")
    $.ajax({
        url: "/get_cart_details",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"prod_id": current_prod_id,"point_id": point_id}),
        success: function(data){
            let btn = document.querySelector(".default-btn");
            console.log(point_id);
            if (data.length==0)
            {
                //atc 
                document.querySelector(".input-counter input").value = 1;
                btn.innerHTML = `<i class="fas fa-cart-plus"></i> Adaugă în coș`;
                btn.onclick = null;
                btn.onclick = function()
                {
                    atc(current_prod_id,point_id);
                }
            }
            else{
                document.querySelector(".input-counter input").value = data[0].qty;
                btn.innerHTML = '<i class="far fa-trash-alt"></i>Șterge din coș';
                btn.onclick = null;
                btn.onclick = function()
                {
                    remove_item(current_prod_id,point_id);
                }
            }
        }
    })

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
      thumbs.data("owl.carousel").to(current, 100, true);
    }
    if (current < start) {
      thumbs.data("owl.carousel").to(current - onscreen, 100, true);
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



function parse_avize(){
    $.ajax({
        url: "/get_farmer_aviz",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"farmer_id": document.querySelector("#farmer_id").value}),
        success: function(data){
            console.log(data);
            console.log("AV")
            if (Object.keys(data).length!=0){
                let li,i,text;
                data.map(aviz=>{
 

                    li = document.createElement("li");

                    i = document.createElement("i");
                    i.className = "flaticon-check";

                    text = document.createTextNode(aviz.nume);

                    li.appendChild(text);  
                    li.insertBefore(i,text);

                    document.querySelector(".about-list").appendChild(li);
                })
            }
        }
    })
}
function get_working_points()
{
    $.ajax({
        url: "/load_working_points",
        type: "POST",
        contentType: "application/json",
        success: function(data){
            console.log("WP")
                console.log(data);
            if (data.length!=0){    
                let li,frag,parent,a;
                frag = document.createDocumentFragment();
                parent = document.querySelector(".del_points ul");
                data.map(point=>{
                    a = document.createElement("a");
                    a.textContent = "Show on map";
                    a.href = "http://www.google.com/maps/place/"+point.lat+","+point.lng+"";

                    li = document.createElement("li");
                    li.textContent = `${point.judet}, ${point.oras}, ${point.adresa}`;
                    
                    li.appendChild(a);
                    frag.appendChild(li);
                })
                parent.appendChild(frag);
            }
            else{
                document.querySelector(".list_wpoints").remove();
            }
        },error: function()
        {
            document.querySelector(".list_wpoints").remove();
        }
    })
}
function load_reviews()
{
    $.ajax({
        url: "/get_all_reviews",
        type: "POST",
        contentType: "application/json",
        success: function (data){
           if (data.length==0){
               //remove;
            document.querySelector(".testimonials-section").remove();
           }
           else{
               let temp,frag,parent;
               frag = document.createDocumentFragment();
               parent = document.querySelector(".testimonials-slider");
               data.map(review=>{
                temp = document.querySelector("#test").content.cloneNode(true);
                temp.querySelector("p").textContent = review.comments;

                for (let i = 5;i>=review.stars;i--){
                    temp.querySelector("li:nth-child("+i+")").classList.add("not_got");
                }

                temp.querySelector("h3").textContent = review.username;

                frag.appendChild(temp);
               })
               parent.appendChild(frag);
                // Testimonial Slider
		$('.testimonials-slider').owlCarousel({
			loop: true,
			nav: true,
			dots: false,
			autoplayHoverPause: true,
            autoplay: false,
            smartSpeed: 1000,
            items: 4,
            center: true,
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
					items: 1
				},
				768: {
					items: 2
				},
				1200: {
					items: 4
				}
			}
        });

           }
        }
    })
}


function populate_about_slider()
{
    $.ajax({
        url: "/get_farm_pics",
        type: "POST",
        contentType: "application/json",
        success: function(data){
            console.log(data);
            if (data.length == 0)
            {
                //hdie 
                document.querySelector(".about-section").remove();
            }
            else{
                let temp,frag,parent;
                frag = document.createDocumentFragment();
                parent = document.querySelector(".about-slider");
                
                data.map(slide=>{
                    temp = document.querySelector("#about_slide").content.cloneNode(true);

                    temp.querySelector("img").src = "/uploads/"+slide.image_name;

                    temp.querySelector("h3").textContent = slide.descriere;

                    frag.appendChild(temp);
                })
                parent.appendChild(frag);
                let ok = true;
                data.map(prod=>{
                    if (prod.cover == 1){
                        document.querySelector(".about-image img").src = "/uploads/"+prod.image_name;
                        ok = false;
                    }
                })
                if (ok){
                    document.querySelector(".about-image img").src = "/uploads/"+data[0].image_name;
                }
                   // About Slider
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
                "<i class='flaticon-left'></i>",
                "<i class='flaticon-right'></i>"
            ],
            responsive: {
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
					items: 2
				}
			}
            
        });
            }
        }
    })
}


function populate_prods()
{
    $.ajax({
        url: "/farmer_prods",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"farmer_id":document.querySelector("#farmer_id").value}),
        success: function(data){
            if (data.length!=0){
            let parent,frag,temp;
            frag = document.createDocumentFragment();
            parent =  document.querySelector("#shop_prods");

            data.map(prod=>{
                temp = document.querySelector("#product_template").content.cloneNode(true);
                temp.querySelector("h3 a").textContent = prod.name;
                temp.querySelector("h3 a").href = `/products/${prod.farmer_slug}/${prod.slug}`;

                temp.querySelector("img").src = prod.images ? `/uploads/${prod.images}` : "/assets/images/icons/no_image.png";

                temp.querySelector("span").textContent = `${prod.price} RON / ${prod.unit}`;
                if (prod.sel_type!=2)
                temp.querySelector(".shop-btn-one").onclick = function(){
                    open_filters(prod.id);
                }
                else{
                    temp.querySelector(".shop-btn-one").textContent = "Precomanda";
                    temp.querySelector(".shop-btn-one").onclick = function(){
                        show_pre_order_form(prod.id);
                    } 
                }
                frag.appendChild(temp);
            })
           parent.appendChild(frag);
        }
        else{
            let p = document.createElement("p");
            p.textContent = "Acest fermier nu are produse!";
            p.className = "info_nimp";
            document.querySelector("#shop_prods").appendChild(p);
        }
    }
    })
}


function open_filters(prod_id){
    document.querySelector(".filters_container").style.transform = "scale(1)";
    $(".filters_bg").fadeIn("slow");
    
    current_prod_id = prod_id;
    populate_prod_data(prod_id);
    update_cart_details(-1);
}
function close_window()
{
    current_prod_id = -1;
    document.querySelector(".filters_container").style.transform = "scale(0)";
    $(".filters_bg").fadeOut("slow");
    $(".select_wpoint")?.css("border","1px solid #ced4da");
}



parse_content();
function parse_content()
{
    $.ajax({
        url: "/profile_content",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"user_id":document.querySelector("#farmer_id")?.value}),
        success: function(data){
            if (data && !data.err){
                document.querySelector("dynamic_content").innerHTML = data;
                //call all the functions we need
                Array.from(document.querySelectorAll("function")).forEach(elem=>{
                    //call it 
                    if (window[elem.textContent])
                    window[elem.textContent]();
                       //remove_it
                    elem.remove();

                 
                })
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
            }
            else if (data.err)
            {
                document.querySelector("dynamic_content").innerHTML = `<p style="text-align: center;font-weight: bold;font-size: 20px;margin-top: 50px">Fermierul nu este activat în site.</p>`;

            }
        }
    })
    
}