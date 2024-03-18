$(document).ready(function(){

    //on filter click
    $(".button-filters").click(function(){
        map_utils.set_cat($(this).text() == "No category" ? "" : $(this).text() );
        //force map to reload
        map_utils.load_farms();
    })

    $(window).on("resize",function(){
        if (window.innerWidth>600){
            show_map();
        }else{
            hide_map();
        }
    })
    $("#live_chb").on("change",function(ev){
        ev.preventDefault();
      if ($("#live_chb").prop("checked")){
          //firstly init it, maybe the user will click and no farms will load bcs drag event is not triggered
        map_utils.update_center(map.getCenter());
        //update radius  5 for test only,calculate the optimal radius 

        map_utils.update_radius(map_utils.calc_radius() || 5); 
        
        map_utils.load_farms();
      }  
    })

    $(document).click(function(el){
        //check if the clicked element is outside radius_select and hide it 
        
        if (el.target.className!="radius_select" && el.target.parentElement.className!= 'radius_select'){
            $("#radius_list").css("display","none");
            $(".radius_select").css("border","2px solid gainsboro");
        }
    })
    
    $(".radius_select").click(function(){
        //show the list 
        $("#radius_list").css("display","block");
        //make the radius select active 
        $(".radius_select").css("border","2px solid #4dabf7");
    })
    $("#radius_list .item").click(function(){
        //now we get the content and set it to the input 
        $("#active").text($(this).text());
        //now that we have a radius, we can re-draw the circle 
        map_utils.circle($("#active").text());
        map_utils.load_farms();

    })

    $("#city_input").on("input",function(ev){
        
        //send the search to the file
        
        populate_cities($(this).val());
        ev.preventDefault();
    })
    $("#city_list").on("click",".item",function(){
        //now we set the city input's text 
        $("#city_input").val($(this).text());
        //hide the list 
        $("#city_list").css("display","none");
        //get the coords and show em on map 
        let lat = $(this).data("lat");
        let lng = $(this).data("lon");

        map_utils.center(lat,lng);

        map_utils.circle($("#active").text())
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
    let frag = document.createDocumentFragment(),city_item;

    //iterate over each city 
    for (let i = 0;i<cities.length;i++)
    {
        city_item = document.createElement("div");
        city_item.className = "item";
        city_item.textContent = cities[i].nume+ " ("+cities[i].judet+")";
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
    $(".right").css("display","block");
    
}
function hide_map()
{
    $(".right").css("display","none");
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