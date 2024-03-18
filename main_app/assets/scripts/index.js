
var cat_hist = [0];
var search_timeout;
var current_prod_id = -1;
var bigimage,thumbs, $big_car,$thumb_car;
var cat_hist = [],last_scroll;
const default_radius = "20";

$(document).ready(function(){
    
    last_scroll = window.scrollY;

    bigimage = $("#big");
    thumbs = $("#thumbs");
        //cookie_consent();

    $(window).on("resize",function(){
        let elem = document.querySelector(".column.left");
        let height = window.innerHeight;
        if (window.innerWidth > 500)
        {
            elem.style.transform = "translateY(0px)";
        }
        else{
            elem.style.transform = `translateY(${height - 350}px)`;

        }
    })

    Array.from(document.querySelectorAll(".promovat")).forEach(elem=>{
  
      try{
      elem.querySelector(".prod_elem").classList.remove("invis");
      elem.querySelector(".prod_elem").classList.add("vis");


      let dots = elem.querySelectorAll(".dot");
      console.log(dots);
      dots[0].classList.remove("not_active_dot");
      dots[0].classList.add("active_dot");
      Array.from(dots).forEach((dot,index)=>{
        dot.dataset.prod_index = index;
      })
      }
      catch{
          
      }
    })

    let tp_height = document.querySelector(".trifles-nav").clientHeight;

    document.querySelector(".column.right").style.height = `calc(100vh - ${tp_height}px)`
    populate_cats(0);
    jQuery('.mean-menu').meanmenu({
        meanScreenWidth: "991"
    });

    $(window).on("scroll",function(){
        let scroll = window.scrollY;
        let height = window.innerHeight;
        if (scroll>=tp_height)
        {
            document.querySelector(".column.right").style.height = `100vh`;
        }
        else{
            document.querySelector(".column.right").style.height = `calc(100vh - ${tp_height}px)`
        }

        if (window.innerWidth<500)
        {
            let elem = document.querySelector(".column.left");
            if (scroll<200)
            {
                elem.style.transform = `translateY(${height - 350}px)`;
            }
            else{
                elem.style.transform = `translateY(200px)`;
            }
        }
   

        last_scroll = scroll;
    })
    var last_drag = 0;
    //change this to touchmvoe 

    $(".small_view_content").draggable({
        axis: 'x',
        start: function(elem){
            last_drag = parseInt(elem.target.style.left);
        },
        drag: function(elem){

            let current_left = parseInt(elem.target.style.left);            
            if (current_left>0)
            {
                elem.target.style.left = "0px";
                return false;
            }
            else{

            }
        },
        stop: function(elem){
            elem.target.style.top = "0px";
            document.querySelector(".active_clamp")?.classList?.remove();
            let total_elems = document.querySelectorAll('.small_view_content .farm_card').length - 1;
            let magic_value = 0;
            let current_left = parseInt(elem.target.style.left);
            magic_value = (last_drag>current_left) ? -150 : 250;

            let round = 400.0*Math.round((current_left+magic_value)/400.0);
            if (round>0)
            {
                round = 0;
            }
            if (round<total_elems*-400)
            {
                round = -400*total_elems;
            }

            //we should somehow get the clamped element and focus 
            //so here's the magic:
            let clamped_index = Math.abs(round)/400 + 1;
            document.querySelector(".farm_card:nth-child("+clamped_index+")").classList.add("active_clamp");
            //we should focus on the map
            map_utils.clamped_unit(document.querySelector(".farm_card:nth-child("+clamped_index+")").dataset.wpid);
           //clamp to round 
           $(elem.target).animate({
               left: round+"px"
           })
        }
    });



    var last_touch = 0;

    $(".left").on("touchstart",function(event){       
        let touch = event.touches[0].clientY;   
        last_touch = touch;
    })

    $(".left").on("touchmove",function(event){
        let elem = document.querySelector(".column.left");

        let touch = event.touches[0].clientY;   
 
        if (touch-last_touch>50)
        {
            let tY = window.innerHeight - 120;
            $(".left").css("transform",`translateY(${tY}px)`);
        }

        
    })



    $(".search_rad").on("click",function(elem){
        elem = elem.currentTarget;
            if (elem?.classList.contains("active_rad"))
            {
                //back to default 
                elem.classList.remove("active_rad");
                map_utils.update_radius(20);
                map_utils.circle(20);
                map_utils.load_farms();
            }
            else{
                document.querySelector(".active_rad")?.classList?.remove("active_rad");
                elem.classList.add("active_rad");
                
                map_utils.update_radius(elem.dataset.radius);
                map_utils.circle(elem.dataset.radius);
                map_utils.load_farms();
            }
    })

    $(".cat_hist").on("click","li:not(.sep)",function(elem){

        let target_id = elem.currentTarget.dataset.cat_id;
        
        //remove until target_id
        let i = cat_hist.length-1;
        while(i>=0 && cat_hist[i].id!=target_id)
        {
            cat_hist.pop();
            i--;
        }

        map_utils.set_cat( target_id >0 ? target_id: null);
        map_utils.load_farms();
        
        populate_cats(target_id);

        render_cat_hist();
        
    })

    $(".categories").on("click",".category_parent",function(elem){
        if (elem.currentTarget.classList.contains("active"))
        {
            document.querySelector(".category_parent.active")?.classList.remove("active");
            
            map_utils.set_cat(cat_hist.pop().id);
            map_utils.load_farms();

        }
        else{
        document.querySelector(".category_parent.active")?.classList.remove("active");
        cat_hist.push({
            name: elem.currentTarget.querySelector("span").textContent,
            id: elem.currentTarget.dataset.cat_id
        })

        map_utils.set_cat(elem.currentTarget.dataset.cat_id);
        map_utils.load_farms();
        
        elem.currentTarget.classList.add("active")
        populate_cats(elem.currentTarget.dataset.cat_id);
        }

        render_cat_hist();
    })


    $("#live_chb").on("change",function(ev){
        ev.preventDefault();
      if ($("#live_chb").prop("checked")){
          //firstly init it, maybe the user will click and no farms will load bcs drag event is not triggered
        map_utils.update_center(map.getCenter());
        //update radius  5 for test only,calculate the optimal radius 

        map_utils.update_radius(map_utils.calc_radius()); 
        map_utils.circle(map_utils.calc_radius());
        map_utils.load_farms();
      }  
    })


    $("#prod_search").on("input",function(elem){
        if (search_timeout)
        {
            clearTimeout(search_timeout);
        }
        search_timeout = setTimeout(()=>{
            map_utils.set_search(elem.currentTarget.value);
            map_utils.load_farms();
        },500);
        
    })

    $(document).click(function(el){
        //check if the clicked element is outside radius_select and hide it 
        
        if (el.target.className!="radius_select" && el.target.parentElement.className!= 'radius_select'){
            $("#radius_list").css("display","none");
            $(".radius_select").css("border","2px solid gainsboro");
        }
    })
    
    

    $("#fl_loc").on("input",function(ev){
        //send the search to the file
        populate_cities($(this).val());
        ev.preventDefault();
    })
    $("#fl_loc").on("focusout",function(ev){
        //send the search to the file
        populate_cities("");
        ev.preventDefault();
    })
    $("#fl_loc").on("focus",function(ev){
        //send the search to the file
        populate_cities($(this).val());
        ev.preventDefault();
    })


    $("#city_list").on("mousedown",".item",function(){
        let text = $(this)
        .clone()    //clone the element
        .children() //select all the children
        .remove()   //remove all the children
        .end()  //again go back to selected element
        .text();
        //now we set the city input's text 
        $("#fl_loc").val(text);
        //hide the list 
        $("#city_list").css("display","none");
        //get the coords and show em on map 
        let lat = $(this).data("lat");
        let lng = $(this).data("lon");

        map_utils.center(lat,lng);

        map_utils.circle("5")
        map_utils.load_farms();
        //we should disable the live chb 
        $("#live_chb").prop("checked",false);

    })
})

const delete_items = ()=>{
    let list = document.getElementById("city_list");
    let fc = list.firstChild;
    while (fc)
    {
        list.removeChild(fc);
        fc = list.firstChild;
    }
}
const add_items = (cities) => {
    let frag = document.createDocumentFragment(),city_item,county_short,loc_name;

    //iterate over each city 
    for (let i = 0;i<cities.length;i++)
    {
        city_item = document.createElement("div");
        city_item.className = "item";

        county_short = document.createElement("div");
        county_short.className = "county_short";
        county_short.textContent = cities[i].auto.toUpperCase();

        loc_name = document.createTextNode(cities[i].nume);

        city_item.appendChild(county_short);
        city_item.appendChild(loc_name);
        
        city_item.dataset.lat = cities[i].lat;
        city_item.dataset.lon = cities[i].lng;

        frag.appendChild(city_item);
    }
    document.getElementById("city_list").appendChild(frag.cloneNode(true))
}


const populate_cities = (city)=>{
   if (city.length>=3){
    $.ajax({
        url: "/get_city",
        type: "POST",
        dataType: "json",
        contentType: 'application/json',
        data: JSON.stringify({"user_in":city,"county":""}),
        success: function(data){
            console.log(data);
            if (data.length != 0){

                let offset_top,height;
                offset_top = document.querySelector("#fl_loc").offsetTop;
                height = document.querySelector("#fl_loc").offsetHeight;
                document.getElementById("city_list").style.top = (offset_top+height) + "px";
                document.querySelector("#city_list").style.width = document.querySelector("#fl_loc").parentElement.offsetWidth + "px";
                document.querySelector("#city_list").style.left = document.querySelector("#fl_loc").offsetLeft + "px";
                
                //start adding the cities
                document.getElementById("city_list").style.display = "block";
                //delete previous items             
                delete_items();
                //now add 
                add_items(data);
            }
            else{
                //hide the list 
                document.getElementById("city_list").style.display = "none";
            }
        }
    })
}
else{
    document.getElementById("city_list").style.display = "none";
}
}
function show_map(){
    //make .right display block
    $(".column.right").css("display","block");
    
}
function hide_map()
{
    $(".column.right").css("display","none");
}

function phone_menu_open(what,elem)
{
    //if there is no link
    if (what.startsWith("/")){
     location.href = what;   
    }
    else//if it is alredy opened than close 
    if ($("#"+what).css("display") == "none"){
    $(".phone_manager").css("display","none");
        let bot = $(".phone_bottom_menu").height();
        let left = $(elem).offset().left + $(elem).width()/2;    
        $("#"+what).css({
            "display":"block",
            "bottom": bot,
            "left":left - 85
        })
    }
    else{
        $("#"+what).css("display","none");
    }
    
}

function next_page()
{
    map_utils.next_page();
}

function prev_page(){
    map_utils.prev_page();
}



function open_filters(){
    document.querySelector("body").style.overflow = "hidden";
    // document.querySelector("#filtre").style.transform = "scale(1)";
    // $(".filters_bg").fadeIn("slow");    
    document.querySelector(".modal_background").classList.add("opened_modal");
    document.querySelector(".modal_window").classList.add("opened_modal");
}




function close_filters()
{
    // document.querySelector("#filtre").style.transform = "scale(0)";
    // $(".filters_bg").fadeOut("slow");
    document.querySelector("body").style.overflow = "auto";

    document.querySelector(".modal_background").classList.remove("opened_modal");
    document.querySelector(".modal_window").classList.remove("opened_modal");
}



function open_custom_atc(prod_id)
{
    document.querySelector("body").style.overflow = "hidden";

    document.querySelector("#custom_atc").style.transform = "scale(1)";
    document.querySelector(".modal_background").classList.add("opened_modal");
    populate_prod_data(prod_id,true);
}

function close_custom_atc()
{
    document.querySelector("body").style.overflow = "auto";

    document.querySelector("#custom_atc").style.transform = "scale(0)";
    document.querySelector(".modal_background").classList.remove("opened_modal");
}

function populate_cats(parent)
{
    $.ajax({
        url: "/parse_cats",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"parent":parent}),
        success: function(data){
            console.log(data);
            //delete the cats
            if (data.length!=0){
                //remove old cats 
                Array.from(document.querySelectorAll(".categories .category_parent")).forEach(elem=> elem.remove())
                let frag = document.createDocumentFragment(),temp;
                //append new  cats 

                //start the anim 
                document.querySelector(".categories").classList.remove('shown_categories');

                data.map(categorie=>{
                    temp = document.querySelector("#category_temp").content.cloneNode(true);
                    temp.querySelector("img").src = `/assets/images/good_icons/${categorie.categorie.toLowerCase()}.png`;
                    temp.querySelector("span:first-child").textContent = categorie.categorie;
                    temp.querySelector("span:last-child").textContent = categorie.sub_cats;
                    temp.querySelector("div").dataset.cat_id = categorie.id;
                    frag.appendChild(temp);
                })

                document.querySelector(".categories").appendChild(frag);
                setTimeout(function(){
                    document.querySelector(".categories").classList.add('shown_categories');
                },1);
                

                // data.map(categorie=>{
            //     div = document.createElement("div");
            //     div.dataset.cat_id = categorie.id;
            //     div.className = "category";
            //     if (categorie.id == current_cat_id)
            //     div.classList.add("active");
            //     div.textContent = categorie.categorie;
            //     document.querySelector("#cats_list").appendChild(div);
            // })
        }

        }
    })
}

function back_cat()
{
    cat_hist.pop();
    populate_cats(cat_hist.pop());
    if (cat_hist.length == 0)
    cat_hist.push(0);

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

function render_cat_hist()
{
    Array.from(document.querySelectorAll(".cat_hist li")).forEach(elem=>elem.remove())
    let frag = document.createDocumentFragment(),li;

    li = document.createElement("li");
    li.textContent = "Toate categoriile";
    li.dataset.cat_id = 0;
    frag.appendChild(li);

    cat_hist.map((cat,index)=>{
        //create the separator
        li = document.createElement("li");
        li.className = "sep";
        frag.appendChild(li);
        //create the category 
        li = document.createElement("li");
        li.textContent = cat.name;
        li.dataset.cat_id = cat.id;
        frag.appendChild(li);   
    })

    document.querySelector(".cat_hist").appendChild(frag);
}

function getTranslateXY(element) {
    const style = window.getComputedStyle(element)
    const matrix = new DOMMatrixReadOnly(style.transform)
    return {
        translateX: matrix.m41,
        translateY: matrix.m42
    }
}


function init_about_slider()
{
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
                items: 1
            },
            1200: {
                items: 1

            }
        }
        
    });
}

function get_promovati()
{
    $.ajax({
        url: "/get_promovati",
        type: "GET",
        contentType: "application/json",
        success: function(data){
            console.log(data);
            let {temp} = renderer.render_card_with_cat(data[0],JSON.parse(data[0].prods),true);
        document.querySelector(".promovati_cards").appendChild(temp);
        }
    })
}