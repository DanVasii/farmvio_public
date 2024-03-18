
function mapUtils(Gmap,render)
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
    this.profile_pictures = ["pic1","pic2","pic3","pic4","pic5"];
    this.anim_needed = [];
    //filters for the farms
    this.current_category = "";
    this.current_search = "";
    this.renderer = render;
}

mapUtils.prototype.random_index = function (min,max){
    return Math.floor(Math.random() * (max - min + 1) + min)
}

mapUtils.prototype.update_center = function(pos){
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
    if (this.current_radius>50)
    this.current_radius = 50;
    else
    this.current_radius = radius;
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
    radius = parseFloat(radius);
    this.current_radius = radius;
    if (this.current_radius<=0.35)
    this.current_radius = 0.35;
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
        strokeColor: "black",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#E3DEFE",
        fillOpacity: .6,
        map,
        center: this.current_center,
        radius: radius*1000,
      });
      
     // this.map.fitBounds(this.wanted_area.getBounds(),2);
   // this.load_farms();
}

mapUtils.prototype.update_bounds = function(bnds){
    this.bounds = bnds;
}
mapUtils.prototype.calc_radius = function(){
    
    if (this.bounds!=null){
       // console.log("%c"+this.bounds,"color: blue");
        //we have some bounds then calculate 
        //calculate the distance 
        let lat_dist = distance(this.bounds.getSouthWest().lat(),this.bounds.getSouthWest().lng(),
        this.bounds.getNorthEast().lat(),this.bounds.getSouthWest().lng());

        let lng_dist = distance(this.bounds.getSouthWest().lat(),this.bounds.getSouthWest().lng(),
        this.bounds.getSouthWest().lat(),this.bounds.getNorthEast().lng());
        
        //get the smallest dist 
        console.log("Calculated");
        return min(lat_dist,lng_dist)/2;
    }
    return 20;
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
        data: JSON.stringify({'center':this.current_center,'radius':this.current_radius,"page":this.page-1,"cat":this.current_category,"search":this.current_search}),
        success: (data)=>{
            document.querySelector(".data_farms p")?.remove();
          
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
            this.circle(this.current_radius);
            this.show_farms(data.farms);
            }
            else{
                
                //show no results
                let p  = document.createElement("p");
                p.textContent = "Nu am găsit rezultate!";
                p.style = "text-align: center;"
                document.querySelector(".data_farms").appendChild(p);
                document.querySelectorAll(".point").forEach(elem=>{elem.remove();})

                this.circle(this.current_radius);

                //delete all 
                for (farm_index in this.farms){

                    google.maps.event.removeListener(this.marker_listeners[this.farms[farm_index].id]);
                    //delete from marker_listeners
                    delete this.marker_listeners[this.farms[farm_index].id];
        
                    this.farms[farm_index].remove();
                    delete this.farms[farm_index];
        
            }
        }
    },error: ()=>
    {
        this.circle(this.current_radius);
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

            this.farms[farm_index].remove();
            delete this.farms[farm_index];

                break;
        }
        }
    

    }
}

mapUtils.prototype.set_cat = function(cat){
    this.current_category = cat;
}

mapUtils.prototype.set_search = function(search)
{
    this.current_search = search;
}

mapUtils.prototype.load_points = function(data){

    //now we should get farm_owner data based on these points
    $.ajax({
        url: "/get_display_data",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"data":data,"search":this.current_search,"categorie":this.current_category}),
        success:  (cat_data)=>{
            //lets say there arte only categories
            let parent = document.getElementsByClassName("data_farms")[0];
            //we firstly remove all the items 
            Array.from(parent.getElementsByClassName("card")).forEach((elem)=>{
                elem.remove();
            })
            Array.from(document.querySelectorAll(".farm_card")).forEach((elem)=>{
                elem.remove();
            })
            let frag = document.createDocumentFragment();
            let card_frag = document.createDocumentFragment();
            
    
        let remove_data = [];
        cat_data = cat_data.data;
        
        for (index in data)
        {
            let {temp,card_temp} = this.renderer.render_card_with_cat(data[index],cat_data[data[index].id],false,this.profile_pictures[this.random_index(0,4)]);

            frag.appendChild(temp);
            card_frag.appendChild(card_temp);
        }

        this.remove_markers(remove_data);
        document.querySelector(".small_view_content").appendChild(card_frag);
        parent.appendChild(frag);
    }

    })
    
}


mapUtils.prototype.show_farms = function(data){
    let aux_farms = [],delete_farms = [],update_data= [];
    this.load_points(data);
    //now get the data that will need to be removed, remove_intersect between this.farms and data 
    delete_farms = remove_intersect(this.farms,data);
    
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
            
            this.farms[farm_index].remove();
            delete this.farms[farm_index];

                break ;
        }
        }
    

    }
    update_data.forEach(elem => {
        if (!elem.nume_firma)
        this.show_marker({lat:parseFloat(elem.lat),lng:parseFloat(elem.lng)},elem.bis_name,elem.id);
        else{
            this.show_red_marker({lat:parseFloat(elem.lat),lng:parseFloat(elem.lng)},elem.nume_firma,elem.id);

        }
    })  
    this.anim_handler();
    
}


mapUtils.prototype.anim_handler = function(){
    this.anim_needed.forEach((marker)=>{
       
        window.requestAnimationFrame((timestamp)=>{
            this.anim(marker,timestamp);
        })  
    })
    this.anim_needed = [];
}


mapUtils.prototype.anim = function(elem,timestamp = 0,start  = undefined,prevTime = 0){
    if (start === undefined )
    {
        start = timestamp;
    }    
    let elapsed = timestamp - start,count = 0;
    if (prevTime!=timestamp)
    {
         count = Math.min(0.0025 * elapsed, 1);
        elem.setOpacity(count);
        
    }
    if(count!=1 && elapsed<400)
    {
        prevTime = timestamp;
        window.requestAnimationFrame((timestamp)=>{
            this.anim(elem,timestamp,start,prevTime);
        })
    }
}

mapUtils.prototype.show_marker = function(pos,title,id){ 
   
    let marker = (function(){
        class HTMLMapMarker extends google.maps.OverlayView {
            constructor() {
              super();
              this.latlng = pos;
              this.id = id;
              this.html = "<div class = 'map_marker green'><i class='fa-duotone fa-farm'></i></div>";
              this.title = title;
              this.setMap(map_utils.map);
             
            }
            getName(){
                return this.title;
            }

            setOpacity(opacity){
                if (this.div)
                this.div.style.opacity = opacity;
            }
            
            createDiv() {
              this.div = document.createElement("div");
              this.div.style.position = "absolute";
              if (this.html) {
                this.div.innerHTML = this.html;
              }

              map_utils.marker_listeners[this.id] =  this.div.addEventListener("click", event => {
                map_utils.marker_click(marker);
                map_utils.load_farms_safety = true;
              });
           
            }
            getId()
            {
                return this.id;
            }

            setActive(){
                this.div.classList.add("active_map_marker");
            }

            removeActive()
            {
                this.div.classList.remove("active_map_marker");
            }

            appendDivToOverlay() {
              const panes = this.getPanes();
              panes.overlayImage.appendChild(this.div);
            }
        
            positionDiv() {
              const point = this.getProjection().fromLatLngToDivPixel(this.latlng);
              let offset = 25;
      
              if (point) {
                this.div.style.left = `${point.x - offset}px`;
                this.div.style.top = `${point.y - offset}px`;
              }
            }
        
            draw() {
              if (!this.div) {
                this.createDiv();
                this.appendDivToOverlay();
              }
              this.positionDiv();
            }
        
            remove() {
              if (this.div) {
                this.div.remove();
              }
            }
        
            getPosition() {
              return this.latlng;
            }
        
            getDraggable() {
              return false;
            }
          }
        
          return new HTMLMapMarker();       
    })();

       this.anim_needed.push(marker);
      this.farms.push(marker);

}

mapUtils.prototype.show_red_marker = function(pos,title,id){ 
   
   
    let marker = (function(){
        class HTMLMapMarker extends google.maps.OverlayView {
            constructor() {
              super();
              this.latlng = pos;
              this.id = id;
              this.html = "<div class = 'map_marker red'><i class='fa-duotone fa-farm'></i></div>";
              this.title = title;
              this.setMap(map_utils.map);
             
            }
            getName(){
                return this.title;
            }

            setOpacity(opacity){
                if (this.div)
                this.div.style.opacity = opacity;
            }
            
            createDiv() {
              this.div = document.createElement("div");
              this.div.style.position = "absolute";
              if (this.html) {
                this.div.innerHTML = this.html;
              }

              map_utils.marker_listeners[this.id] =  this.div.addEventListener("click", event => {
                map_utils.marker_click(marker);
                map_utils.load_farms_safety = true;
              });
           
            }
            setActive(){
                this.div.classList.add("active_map_marker");
            }

            removeActive()
            {
                this.div.classList.remove("active_map_marker");
            }

            getId()
            {
                return this.id;
            }
            appendDivToOverlay() {
              const panes = this.getPanes();
              panes.overlayImage.appendChild(this.div);
            }
        
            positionDiv() {
              const point = this.getProjection().fromLatLngToDivPixel(this.latlng);
              let offset = 25;
      
              if (point) {
                this.div.style.left = `${point.x - offset}px`;
                this.div.style.top = `${point.y - offset}px`;
              }
            }
        
            draw() {
              if (!this.div) {
                this.createDiv();
                this.appendDivToOverlay();
              }
              this.positionDiv();
            }
        
            remove() {
              if (this.div) {
                this.div.remove();
              }
            }
        
            getPosition() {
              return this.latlng;
            }
        
            getDraggable() {
              return false;
            }
          }
        
          return new HTMLMapMarker();       
    })();

      this.anim_needed.push(marker);
      this.farms.push(marker);

}

mapUtils.prototype.clamped_unit = function(wpid){
    this.farms.forEach((marker)=>{
        if (marker.getId() == wpid)
        {
            this.marker_click(marker);
        }
    })
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

    //remove the previous 
    document.querySelector(".active_map_marker")?.classList?.remove("active_map_marker");
    marker.setActive();
    map_utils.scrollTo_farm(marker.getId());
    //TODO:: change pan_to_point
    if (window.innerWidth>500)
    map_utils.pan_to_point(marker.getId());
    map_utils.show_info_window(marker);
}

mapUtils.prototype.scrollTo_farm = function(farm_id)
{
    if (window.innerWidth < 500)
    {
        let left = document.querySelector(".farm_card[data-wpid='"+farm_id+"']").offsetLeft - 10;
        $(".small_view_content").animate({
            left: -left + "px"
        },"smooth")
    }
}

mapUtils.prototype.pan_to_point = function(searched_id){
    
    document.querySelector(".active_point")?.classList.remove("active_point");

    Array.from(document.querySelectorAll(".card")).forEach(elem=>{
        //console.log(elem);
        if (elem.dataset.wpid == searched_id){
            //pan to this 
            //calculate the top 
            let top_menu_height = document.querySelector(".navbar-area-three").clientHeight;
            let point_height = document.querySelector(".card").clientHeight / 2;
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
        content: "Ferma "+marker.getName(),
        position: marker.getPosition(),
        pixelOffset:  { height: -25, width: -10}
      });
      this.info_window.open(this.map);
      
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