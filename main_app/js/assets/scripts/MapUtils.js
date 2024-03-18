function mapUtils(Gmap)
{
    this.map = Gmap;
    this.page = 1;
    this.current_center = null;
    this.current_radius = null;
    this.wanted_area = null;
    this.farms = [];
    this.live_search = false;
    this.marker_listeners = {};
    this.info_window = null;
    this.bounds = null;
    this.load_farms_safety = false;


    //filters for the farms
    this.current_category = "";
    this.current_search = "";
}

mapUtils.prototype.update_center = function(pos){
       console.log(this.current_center);
    //we only update the center if the difference between these 2 centers is more than 250 meters 
    if (this.current_center == null)
    this.current_center = pos;
    else{
        //check the distance 
        let dist = distance( (typeof this.current_center.lat) == "function" ? this.current_center.lat() : this.current_center.lat,(typeof this.current_center.lng) == "function" ? this.current_center.lng() : this.current_center.lng,pos.lat(),pos.lng());

        if (dist > 0.25){
            this.current_center = pos;
            this.page = 1;
        }
        else{
            this.load_farms_safety = true;
        }
    }
}

mapUtils.prototype.update_radius = function(radius){
    
    this.current_radius = radius;
    if (this.current_radius>10)
    this.current_radius =10;
}
mapUtils.prototype.center = function(lat,lng) {
    let pos = {
        lat: lat,
        lng: lng
    }   
    this.current_center = pos;
    this.map.setCenter(pos);
    
}

mapUtils.prototype.circle = function(radius){
    //get the number from radius
    radius = radius.replace("KM","").trim();
    this.current_radius = radius;
    //now draw the circle 
    //using the lat and long from locPin
    if (this.wanted_area!=null)
    {
        //remove previous 
        this.wanted_area.setMap(null);
    }
    //now add the circle 
    //the radius is in meters so *1000
    this.wanted_area = new google.maps.Circle({
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35,
        map,
        center: this.current_center,
        radius: radius*1000,
      });
  
   // this.load_farms();
}
mapUtils.prototype.update_bounds = function(bnds){
    this.bounds = bnds;
    
}
mapUtils.prototype.calc_radius = function(){
    
    if (this.bounds!=null){
        //we have some bounds then calculate 
        //calculate the distance 
        let lat_dist = distance(this.bounds.getSouthWest().lat(),this.bounds.getSouthWest().lng(),
        this.bounds.getNorthEast().lat(),this.bounds.getSouthWest().lng());

        let lng_dist = distance(this.bounds.getSouthWest().lat(),this.bounds.getSouthWest().lng(),
        this.bounds.getSouthWest().lat(),this.bounds.getNorthEast().lng());
        
        //get the smallest dist 
        return min(lat_dist,lng_dist)/2;
    }
    return null;
}
mapUtils.prototype.remove_circle = function(){
    if (this.wanted_area!=null)
    {
        this.wanted_area.setMap(null);
        this.wanted_area = null;
    }
}
mapUtils.prototype.load_farms = function(){
    console.log(this.load_farms_safety);
    if (!this.load_farms_safety){
    //calculate extremities of the circle 
    console.log(this.page);
    $.ajax({
        url: '/get_farms',
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({'center':this.current_center,'radius':this.current_radius,"page":this.page-1,"cat":this.current_category,"search":""}),
        success: (data)=>{
            console.log(data);
            //update pagination
            if (data.pages){
                let nav_parent = document.getElementsByClassName("navigation_pages")[0];
                nav_parent.querySelector("span").textContent = data.pages.message;
                if (data.pages.left == "disabled"){
                    document.querySelector("#left_nav").disabled = true;
                }
                else{
                    document.querySelector("#left_nav").disabled = false;
                }
                if (data.pages.right == "disabled"){
                    document.querySelector("#right_nav").disabled = true;
                }
                else{
                    document.querySelector("#right_nav").disabled = false;
                }
            }
            if (data.farms && data.farms.length!=0){
            //es6 needed for "this" to work, because context change
            //now load em on map 
            //show the circle
            this.circle(this.current_radius+ "KM");
            this.show_farms(data.farms);
            }
            else{
                //show no results
            }
        }
    })
}
else{
    this.load_farms_safety = false;
}
}


mapUtils.prototype.remove_markers = function(data){
    let aux_farms = [],delete_farms = [];
    
    //now get the data that will need to be removed, remove_intersect between this.farms and data 
    delete_farms = data;
    //get the indexes of delete_farms from this.farms    
  
    let removed = 0,listener_index;

    for(index in delete_farms){
        //loop this.famrs and when we find matching ids,remove that index
        for (farm_index in this.farms){

            if (this.farms[farm_index].id == delete_farms[index].id){
                //found,then remove
                 //we have a listener ,first lets destroy it 
            google.maps.event.removeListener(this.marker_listeners[this.farms[farm_index].id]);
            //delete from marker_listeners
            delete this.marker_listeners[this.farms[farm_index].id];

            this.farms[farm_index].setMap(null);
            this.farms.splice(farm_index,1);

                break;
        }
        }
    

    }
}

mapUtils.prototype.set_cat = function(cat){
    this.current_category = cat;
}

mapUtils.prototype.load_points = function(data){

    //now we should get farm_owner data based on these points
    $.ajax({
        url: "/get_display_data",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"data":data,"search":"","categorie":this.current_category}),
        success:  (cat_data)=>{
            console.log(cat_data);
            //lets say there arte only categories

            let parent = document.getElementsByClassName("data_farms")[0];
            //we firstly remove all the items 
            Array.from(parent.getElementsByClassName("point")).forEach((elem)=>{
                elem.remove();
            })
            let frag = document.createDocumentFragment();
            console.log(data);
            if (cat_data.case==1){
            let object, item,card,grid,prod_img,prod_det;
            cat_data = cat_data.data;
            for (index in data)
            {
                let temp = document.getElementById("no_cat").content.cloneNode(true);
                temp.querySelector(".point").dataset.wpid = data[index].id;

                let left_cats = temp.querySelector(".left_cats");
                let img;
                for (index_cat in cat_data[data[index].id]){
                    //lets build the left_side 
                    img = document.createElement("img");
                    img.src = "/assets/images/icons/"+cat_data[data[index].id][index_cat].categorie.toLowerCase()+".png";
                    left_cats.appendChild(img);
                }

                object = data[index];
                temp.querySelector("#point_name").textContent = data[index].point_name;
                frag.appendChild(temp);
                
            }
            
            parent.appendChild(frag);
            }
    else{
        //we should update the pagination as well
        //secondtemplate
        console.log(data);
        let remove_data = [];
        let object,temp,left,slide_elem,img,p;
        cat_data = cat_data.data;

        for (index in data){
            temp = document.getElementById("with_cat").content.cloneNode(true);
            left = temp.querySelector(".left");
            //set the listeners forthe slider 
            temp.querySelector(".point").dataset.wpid = data[index].id;
            let left_arrow =  temp.querySelector(".left_arrow");
            left_arrow.onclick = function(){move_left(left_arrow)};

            let right_arrow = temp.querySelector(".right_arrow");
            right_arrow.onclick = function(){move_right(right_arrow)};
            //create the slide elems
            temp.querySelector("#point_name").textContent = data[index].point_name;

            //check if there is somethingt to show 
            if (cat_data[data[index].id].length==0){
                remove_data.push(data[index]);
              
            }
            for (index_prod in cat_data[data[index].id]){

                p = document.createElement("a");
                p.style = "display:block";
                p.textContent = cat_data[data[index].id][index_prod].name;
                let c = cat_data[data[index].id][index_prod].id;
                let point_id = data[index].id;

                p.href = "/products/"+c+"/"+point_id;
                let images = cat_data[data[index].id][index_prod].images;
                console.log(images);
                if (images && images!='')     {           
                img = document.createElement("img");
                    img.src = "/uploads/"+images;
                }
                else{
                    img = document.createElement("img");
                    img.src = "./assets/images/icons/no_image.png";
                }
                slide_elem = document.createElement("div");               

                
               if (index_prod!=0)
                slide_elem.className = "slide_element invis";
                else{
                    slide_elem.className = "slide_element vis";

                }
                slide_elem.appendChild(img);
                slide_elem.appendChild(p);   

                
                left.appendChild(slide_elem);
            
            frag.appendChild(temp);   
        }
           
        }
        console.log("remove_data");
        console.log(remove_data);
        this.remove_markers(remove_data);
        parent.appendChild(frag);
    }
}
    })
    
}


mapUtils.prototype.show_farms = function(data){
    let aux_farms = [],delete_farms = [],update_data= [];
    this.load_points(data);
    //now get the data that will need to be removed, remove_intersect between this.farms and data 
    delete_farms = remove_intersect(this.farms,data);
    console.log(delete_farms);
    //first get the new data    
    //this is the data that will need to be updated 
    update_data = remove_intersect(data,this.farms);

   // console.log(delete_farms);
    //now lets remove the delete_farms 
    let removed = 0,listener_index;

    for(index in delete_farms){
        //loop this.famrs and when we find matching ids,remove that index
        for (farm_index in this.farms){

            if (this.farms[farm_index].id == delete_farms[index].id){
                //found,then remove
                 //we have a listener ,first lets destroy it 
            google.maps.event.removeListener(this.marker_listeners[this.farms[farm_index].id]);
            //delete from marker_listeners
            delete this.marker_listeners[this.farms[farm_index].id];
            
            this.farms[farm_index].setMap(null);
            this.farms[farm_index].visible = false;
            this.farms.splice(farm_index,1);

                break ;
        }
        }
    

    }
    update_data.forEach(elem => {
        
        this.show_marker({lat:parseFloat(elem.lat),lng:parseFloat(elem.lng)},elem.point_name,elem.id);
    })  
    
}



mapUtils.prototype.show_marker = function(pos,title,id){ 
   
    let marker = new google.maps.Marker({
        position: pos,
        map: map,
        title: title,
        visible: true,
        icon: "./assets/images/icons/farm-2.png",
        id: id
      });
      
      //add the click listener 
      this.marker_listeners[id] = marker.addListener("click",()=>{
          this.marker_click(marker);
          this.load_farms_safety = true;
      });
      this.farms.push(marker);

}

mapUtils.prototype.removeLocPin = function(){
        if (this.locPin!=null){
            this.locPin.setMap(null);
        }
}



mapUtils.prototype.addLocPin = function(lat,lng){
    let marker = new google.maps.Marker({
        position: {lat:lat,lng:lng},
        map,
        icon: "http://localhost:5000/assets/images/icons/farm-2.png",
        title: "Testing the new coords",
        customID: 'location'
    })
    //append the marker 
    this.locPin = marker;
 
}

mapUtils.prototype.marker_click = function(marker){
    //show the info window with this info 
    //because we have chnaged the context by using this function as listener , we now need to call 
    //map utils function from the global instance of it (map_utils, declared in index.html after map loading)    
    //'this' is now the clicked marker not the mapUtils instance 
    map_utils.pan_to_point(marker.id);
    map_utils.show_info_window(marker);

    
}

mapUtils.prototype.pan_to_point = function(searched_id){
    
    document.querySelector(".active_point")?.classList.remove("active_point");

    Array.from(document.querySelectorAll(".point")).forEach(elem=>{
        if (elem.dataset.wpid == searched_id){
            //pan to this 
            //calculate the top 
            let top_menu_height = document.querySelector(".header").clientHeight;
            let point_height = document.querySelector(".point").clientHeight / 2;
            elem.classList.add("active_point");
            window.scrollTo({top: elem.offsetTop - top_menu_height - point_height, behavior: 'smooth'});

        }
    })

}

mapUtils.prototype.show_info_window = function(marker){
    if (this.info_window!=null)
    {
        //delete previous 
        this.info_window.setMap(null);
    }
    this.info_window = new google.maps.InfoWindow({
        content: "Farm name is "+marker.title
      });
      this.info_window.open(this.map,marker);
      
}

mapUtils.prototype.next_page = function(){

    this.load_farms_safety = false;
    this.page = parseInt(this.page) + 1;
    this.load_farms();
}

mapUtils.prototype.prev_page = function(){
    console.log("preved");
    this.load_farms_safety = false;
    this.page = parseInt(this.page) - 1;
    this.load_farms();
}