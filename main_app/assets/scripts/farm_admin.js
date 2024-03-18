
var map,map2,marker = null,marker2 = null,geocoder,marker_follow2 = false;
var addr_timeout = null,county_timeout = null,city_timeout = null,marker_follow = false,chosen_loc_timeout=null;
var file_handler = [],counter = 0;
var farm_id = -1;
$(document).ready(function(){
    $(".carousel-inner").carousel({interval: false});
    $("input[type='checkbox']:not(#map_lock):not(#map_lock2)").on("click",function(){
        $("input[type='checkbox']").prop("checked",false);
        $(this).prop("checked",true);
    })

    $(".input_holder input").on("focus",function(){
        //hide the previous auto_complete
        $(".auto_complete").css("display","none");
        $(this).parent().find(".auto_complete").css("display","block");
        
        //move the label 
        $(this).parent().find("label").css({"top":"-15px","color":"#339AF0"});
        //set the line to active 
        $(this).parent().find(".line").css("width","100%");
    })

    $(".input_holder input").on("focusout",function(){
        
        //bring it down only if there is not text 
        if ($(this).val().trim().length==0){
            //if there are some whitespaces , then remove them 
            $(this).val('');
            $(this).parent().find(".line").css("width","0%")
            $(this).parent().find("label").css({"top":"10px","color":"black"});
    }
    })
    $("#address").on("keyup",function(){
        if (addr_timeout!=null){
            clearTimeout(addr_timeout);
        }
        addr_timeout = setTimeout(get_coords,1500);
    })

    $("#point_addr").on("keyup",function(){
        if (addr_timeout!=null){
            clearTimeout(addr_timeout);
        }
        addr_timeout = setTimeout(get_location2,1500);
    })

    $("#county").on("input",function(){
        if (county_timeout!=null){
            clearTimeout(county_timeout);
        }
        county_timeout = setTimeout(get_county("county_ac"),500);
    })

    $("#point_county").on("input",function(){
        if (county_timeout!=null){
            clearTimeout(county_timeout);
        }
        county_timeout = setTimeout(get_county("point_county_ac"),500);
    })




    $("#city").on("input",function(){
        if (city_timeout!=null){
            clearTimeout(city_timeout);
        }
        city_timeout = setTimeout(get_city("city_ac"),500);
    })

    $("#point_city").on("input",function(){
        if (city_timeout!=null){
            clearTimeout(city_timeout);
        }
        city_timeout = setTimeout(get_city("point_city_ac"),500);
    })


    $("#county_ac").on("click",".complete_item",function(){
        //set the clicked text to the input
        
        $("#county").val($(this).text());
        $("#county_ac").css("display","none");
    })


    $("#point_county_ac").on("click",".complete_item",function(){
        //set the clicked text to the input
        
        $("#point_county").val($(this).text());
        $("#point_county_ac").css("display","none");
    })


    $("#city_ac").on("click",".complete_item",function(){
        $("#city").val($(this).text());
        $("#city_ac").css("display","none");
    })


    $("#point_city_ac").on("click",".complete_item",function(){
        $("#point_city").val($(this).text());
        $("#point_city_ac").css("display","none");
    })

    $("#address").on("keyup",function(){
        if (addr_timeout!=null)
        {
            clearTimeout(addr_timeout);
        }
        addr_timeout = setTimeout(get_location,1500);
    })

    $("#map_lock").on("change",function(ev){
        //if the locker is set to on
        ev.preventDefault();
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
    //second map 
    $("#map_lock2").on("change",function(){
        //if the locker is set to on
        if ($(this).prop("checked")){
            
            marker_follow2 = true;
            //remove the prev marker 
            if (marker2!=null){
                marker2.setPosition(map2.getCenter());
          }
            else{
                marker2 = new google.maps.Marker({
                    position: map2.getCenter(),
                    map: map2
                })
            }

        }
        else{
            marker_follow2 = false;
        }
    })

    //big preview script 
    $(".uploaded_images").on("click","img",function(){
        
    })
    
    //file delete script 
    $(".uploaded_images").on("click","i",function(){
        //get the index
        //now find this index in file_handler  and remove 
        let aux_file = [];
        let delete_id = this.parentElement.dataset.index;
        file_handler.forEach(function(obj){
         //   console.log(obj);
            if (obj.id!=delete_id){
                //this is clean we can add it 
                aux_file.push(obj);
            }
        })
        file_handler = aux_file;
        //delete the preview 
        this.parentElement.remove();
      //  console.log(file_handler);
    })
    //file preview script 
    $("#file_inp").on("change",function(){
        if (this.files){
            
            let image_holder;
            let image;
            let i;
            let fileReader;
            //foreach 
            for(let index = 0;index<this.files.length;index++)
            {
                fileReader = new FileReader();
                fileReader.addEventListener("load",function(){
            
                    //now add the images 
                    image_holder = document.createElement("div");
                    image_holder.className = 'uploaded_image';
                    image_holder.dataset.index = counter;
                    image = document.createElement("img");
                    image.src = this.result;
                    i = document.createElement("i");
                    i.className = "fas fa-times-circle";
                    image_holder.appendChild(image);
                    image_holder.appendChild(i);
    
                    //now add this to the uploaded_images 
                    document.getElementsByClassName("uploaded_images")[0].appendChild(image_holder);
                    //after being added append it to the file Handler
                   // console.log(index);
                    file_handler.push({
                        id: counter++,
                        file: document.getElementById("file_inp").files[index]
                    })
                    
                })
                
                
                fileReader.readAsDataURL(this.files[index]);


            }
            
        }

    })

})

function get_location2(){
    let county = $("#point_county").val()+" ";
    let city = $("#point_city").val()+" ";
    let address = $("#point_addr").val();
    //now geocode 
    marker_follow2 = false;
        
    if ($("#map_lock2").prop("checked"))
    $("#map_lock2").prop("checked","false");

    geocoder.geocode({'address':county+city+address},function(results,status){
        if (status=="OK"){
                console.log(results);
            let pos = results[0].geometry.location;
            //we not set the marker and center the map
            if (marker2!=null){
                marker2.setPosition(pos);
            }
            else{
                marker2 = new google.maps.Marker({
                    position: pos,
                    map: map2,
                    title: "My farm"
                })
            }
                map2.setZoom(16);
                map2.setCenter(pos);
            
        }
        else{
            console.log(status);
        }
        console.log(marker2);
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

function get_coords2(){
    let addr = $("#point_addr").val();
    geocoder.geocode({'address':addr},function(results, status){
        if (status == 'OK'){
            map2.setCenter(results[0].geometry.location);
            marker2.setPosition(map2.getCenter());
        }
        else{
            console.log(status);
        }
    })
}

function initMap(){
    initMap2();
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
      })
}

function initMap2(){
    map2 = new google.maps.Map(document.getElementById("map2"), {
        zoom: 16,
        center: { lat: 40.731, lng: -73.997 },
      });

      map2.addListener("center_changed",function(){
            
        if (marker_follow2){
              //now move the marker 
              marker2.setPosition(map2.getCenter());
                
              if (chosen_loc_timeout!=null){
                    clearTimeout(chosen_loc_timeout);
              }
              chosen_loc_timeout = setTimeout(function(){
                  $("#point_addr").focus();
                  $("#point_addr").val(Number.parseFloat(marker2.getPosition().lat()).toFixed(6)+","+Number.parseFloat(marker2.getPosition().lng()).toFixed(6));
                  $("#point_addr").focusout();
                },1000);

            }
      })
}

function open_file(e){
   
    $("#file_inp").trigger("click");
}

function send(){


    let farm_data = new FormData();
    farm_data.append("farm_name",document.getElementById("farm_name").value);
    farm_data.append("county",document.getElementById("county").value);
    farm_data.append("city",document.getElementById("city").value);
    farm_data.append("address",document.getElementById("address").value);
    farm_data.append("cui",document.getElementById("cui").value);

    let farm_files =  document.getElementById("file_inp").files;

    for (let i = 0;i<farm_files.length;i++){
    farm_data.append("farmImages",document.getElementById("file_inp").files[i]);
    }
    $.ajax({
        url: '/post_farm',
        type: 'POST',
        contentType: false,
        cache: false,
        processData: false,
        data: farm_data,
        success: function (data){
            //first reset the errors
            $(".err").text('');

            //only if we do not have an isertid
            if (data.farm_id!=null){
                //remember this id 
                farm_id = data.farm_id;
                   //test move 
                   $(".carousel-inner").carousel(1);
                
            }else{
            //now we can change the text and max-height 
            Object.keys(data).forEach((key,value) => {
                console.log(key);
                $("#"+key+"_err").text(data[key]);
                $(".err").css("max-height","100px");
            });
        }


        }
    })
}

function send_pers_info(){

    //check first ch 
    $("#checkbox").click();
    //create the formdata 
    let pers_data = new FormData();
    //now we append those 2 images, as well as the farm_id 
    pers_data.append("farm_id",farm_id);
    pers_data.append("id",document.getElementById("id_inp").files[0]);
    pers_data.append("cui",document.getElementById("cui_inp").files[0]);
    //send the request 
    $.ajax({
        url: '/kyc',
        type: 'POST',
        contentType: false,
        cache: false,
        processData: false,
        data: pers_data,
        success: function (data){
            console.log(data);
          if (data!="OK"){
              //check if data.err
              if (data.err!=null){
                  alert(data.err);
              }

          }
          else{
              console.log("ok");
              //now we can go to the work points 
              //update the location as well 
              $(".loc_text").text(document.getElementById("county").value + ", "+document.getElementById("city").value+", "+document.getElementById("address").value);
              //move 
              $(".carousel-inner").carousel(2);
            
              
          }
        }
    })
}

function send_working(){
    let point_info =  new FormData();

    //create the form data and send 
    if ($("#checkbox2").is(":checked")){
    point_info.append("point_name",document.getElementById("point_name2").value);
    point_info.append("county",document.getElementById("point_county").value);
    point_info.append("city",document.getElementById("point_city").value);
    point_info.append("address",document.getElementById("point_addr").value);
    point_info.append("farm_id",JSON.stringify([farm_id]));
    }
    else{
        //send the first one 
        point_info.append("point_name",document.getElementById("point_name").value);
        point_info.append("farm_id",JSON.stringify([farm_id]));
    }
    $.ajax({
        url: '/add_point',
        type: 'POST',
        contentType: false,
        cache: false,
        processData: false,
        data: point_info,
        success: function (data){
            console.log(data);
        }
    })
}