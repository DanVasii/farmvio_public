var mouse_over = false;
var city_timeout = null,county_timeout = null,chosen_loc_timeout=null,addr_timeout = null,work_timeout = null;
var map,marker = null,geocoder,marker_follow = false;
var notify;
$(document).ready(function(){

    notify = new Notify();
    $("#address").on("keyup",function(){
        if (addr_timeout!=null)
        {
            clearTimeout(addr_timeout);
        }
        addr_timeout = setTimeout(get_location,1500);
    })

    $("#city").on("input",function(){
        if (city_timeout!=null){
            clearTimeout(city_timeout);
        }
        city_timeout = setTimeout(get_city("city_ac"),500);
    })
    $("#city_ac").on("click",".complete_item",function(){
        $("#city").val($(this).text());
        $("#city_ac").css("display","none");
    })
    $("#county").on("input",function(){
        if (county_timeout!=null){
            clearTimeout(county_timeout);
        }
        county_timeout = setTimeout(get_county("county_ac"),500);
    })

    $("#county_ac").on("click",".complete_item",function(){
        //set the clicked text to the input
        
        $("#county").val($(this).text());
        $("#county_ac").css("display","none");
    })

    $(".auto_complete").on("mouseover",function(){
        mouse_over = true;
    })

    $(".auto_complete").on("mouseout",function(){
        mouse_over = false;
    })

    $(".input_holder input").on("focus",function(){
        //hide the previous auto_complete
        $(".auto_complete:not(#workp_ac)").css("display","none");
        
        $(this).parent().parent().find(".auto_complete").css("display","block");
        //move the label 
        $(this).parent().find("label").css({"top":"-15px","color":"#339AF0"});
        //set the line to active 
        $(this).parent().parent().find(".line").css("width","100%");
    })

    $(".input_holder input").on("focusout",function(){
  
        //check if mouse is over the details 
        if (!mouse_over && $(this).attr("id")!="workp")
        $(this).parent().parent().find(".auto_complete").css("display","none");

        //bring it down only if there is not text 
        if ($(this).val().trim().length==0){
            //if there are some whitespaces , then remove them 
            $(this).val('');
            $(this).parent().find(".line").css("width","0%")
            $(this).parent().find("label").css({"top":"10px","color":"black"});
    }
    })

    $("#map_lock").on("change",function(){
        //if the locker is set to on
        if ($(this).prop("checked")){
            
            marker_follow = true;
            //remove the prev marker 
            if (marker!=null){
                marker.setPosition(map.getCenter());
          }
            else{
                marker = new google.maps.Marker({
                    position: map.getCenter(),
                    map: map
                })
            }

        }
        else{
            marker_follow = false;
        }
    })
})



function get_coords(){
    let addr = $("#address").val();
    geocoder.geocode({'address':addr},function(results, status){
        if (status == 'OK'){
            map.setCenter(results[0].geometry.location);
        }
        else{
            console.log(status);
        }
    })
}

function get_city(who){
    let input_id = who.replace("_ac","");
    let county_id;
    if (input_id.startsWith("point"))
    {
        county_id = "point_county";
    }
    else{
        county_id = "county"
    }
    $.ajax({
        url: "/get_city",
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({"user_in":$("#"+input_id+"").val(),"county":$("#"+county_id+"").val()}),
        success: function(data){
            console.log(data);
            //first remove the previous 
            $("#"+who+" .complete_item").remove();
            let parent = document.getElementById(who);
            let item;
            //now add 
            if (data!=null && data.length>0){
                for (let i=0;i<data.length;i++){
                 item = document.createElement("div");
                 item.className = "complete_item";
                 item.textContent = data[i].nume;
                 parent.appendChild(item);
                }
            }
            else{
                item = document.createElement("div");
                item.className = "complete_item";
                item.textContent = "No results found";
                parent.appendChild(item);
            }
        }    
    })
}
function get_county(who){

    //get input from who 
    let input_id = who.replace("_ac","");
    $.ajax({
        url: "/get_county",
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({'search':$("#"+input_id+"").val()}),
        success: function(data){
     
            //remove the data inside
            let parent = document.getElementById(who);
            $("#"+who+" .complete_item").remove();
            //now populate 
            let item;
            if (data!=null && data.length>0){
                
                for (let i = 0;i<data.length;i++){
                    item = document.createElement("div");
                    item.className = "complete_item";
                    item.textContent = data[i].judet;
                    parent.appendChild(item);
                }
            }
            else if (data.length==0 || data.length == undefined){
                item = document.createElement("div");
                item.className = "complete_item";
                item.textContent = "No results found";
                parent.appendChild(item);
            }
        }
    })
}
function get_location(){
    let county = $("#county").val()+" ";
    let city = $("#city").val()+" ";
    let address = $("#address").val();
    //now geocode 
    marker_follow = false;
    if ($("#map_lock").prop("checked"))
    $("#map_lock").prop("checked","false");
    geocoder.geocode({'address':county+city+address},function(results,status){
        if (status=="OK"){
                console.log(results);
            let pos = results[0].geometry.location;
            //we not set the marker and center the map
            if (marker!=null){
                marker.setPosition(pos);
            }
            else{
                marker = new google.maps.Marker({
                    position: pos,
                    map,
                    title: "My farm"
                })
            }
                map.setZoom(16);
                map.setCenter(pos);
            
        }
        else{
            console.log(status);
        }
    })
}
function initMap(){
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 16,
        center: { lat: 40.731, lng: -73.997 },
      });

      map.addListener("center_changed",function(){
            console.log(marker_follow);  
        if (marker_follow){
              //now move the marker 
              marker.setPosition(map.getCenter());
                
              if (chosen_loc_timeout!=null){
                    clearTimeout(chosen_loc_timeout);
              }
              chosen_loc_timeout = setTimeout(function(){
                  $("#address").focus();
                  $("#address").val(Number.parseFloat(marker.getPosition().lat()).toFixed(6)+","+Number.parseFloat(marker.getPosition().lng()).toFixed(6));
                  $("#address").focusout();
                },1000);

            }
            else{
                
            }
      })
}
function send_point(){
    let point_info =  new FormData();

    point_info.append("point_name",document.getElementById("name").value);
    point_info.append("county",document.getElementById("county").value);
    point_info.append("city",document.getElementById("city").value);
    point_info.append("address",document.getElementById("address").value);
    point_info.append("nr",document.getElementById("nr").value);
    point_info.append("cod",document.getElementById("cod").value);

    

    $.ajax({
        url: '/add_point',
        type: 'POST',
        contentType: false,
        cache: false,
        processData: false,
        data: point_info,
        success: function (data){
            console.log(data);
            Array.from(document.querySelectorAll(".custom_error")).forEach(elem=>{
                elem.style.maxHeight = "0px";
            })
            if (data == "OK"){
                notify.show_success("Success!","Point added");
            }
            else{
                for (let key in data){
                    console.log(key);
                    if (key=='g_address')
                    {
                        key = "address";
                    }
                    let err = document.querySelector("#"+key.trim()+"_error");
                    err.style.maxHeight = "160px";
                    err.textContent = data[key];
                }
                notify.show_error("Error","Please solve the errors");
            }
        }
    })
}
