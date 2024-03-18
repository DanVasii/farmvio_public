
$(document).ready(function(){
    get_farms("");
})

function get_farms(search){
    $.ajax({
        url: "/get_farms_user",
        type: "POST",
        data: JSON.stringify({"search":search}),
        success: function (data){
            console.log(data);
            if (data.length!=0){
                let parent = document.getElementsByClassName("content")[0];
                let frag;
                let object,farm,top_handler,left,right,span,img,buttons,button,i,warning;
                frag = document.createDocumentFragment();
                for (index in data)
                {
                    object = data[index];
                 
                    //create the farm 
                    farm = document.createElement("div");
                    farm.className = "farm col-md-12 col-lg-5";
                    //create top handler 
                    top_handler = document.createElement("div");
                    top_handler.className = "top_handler";
                    //create left 
                    left = document.createElement("div");
                    left.className = "left";
                    //create image 
                    img = document.createElement("img");
                    img.src = '/assets/images/apppictures/farmer.png';
                    left.appendChild(img);

                    //create right 
                    right = document.createElement("div");
                    right.className = "right";

                    //create name 
                    span = document.createElement("span");
                    span.textContent = object.farm_name;
                    right.appendChild(span);
                    //create addres 
                    span = document.createElement("span");
                    span.textContent = object.judet+ ", "+object.oras+", "+object.adresa;
                    right.appendChild(span);
                    //append left and right 
                    top_handler.appendChild(left);
                    top_handler.appendChild(right);
                    farm.appendChild(top_handler);
                    //add the buttons
                    buttons = document.createElement("div");
                    buttons.className = "buttons";

                    //create add button 
                    button = document.createElement("div");
                    button.className = "button";
                    //create i 
                    i  = document.createElement("i");
                    i.className = "fas fa-plus";

                    //create span 
                    span = document.createElement("span");
                    span.textContent = "Adauga punct de lucru";
                    button.dataset.id = object.id;
                    button.onclick = function(){goto_points(this)};

                    button.appendChild(i);
                    button.appendChild(span);
                    buttons.appendChild(button);
                    //create the second buttomn 
                    button = document.createElement("div");
                    button.className = "button";
                    //create i 
                    i  = document.createElement("i");
                    i.className = "fas fa-pen";

                    //create span 
                    span = document.createElement("span");
                    span.textContent = "Editeaza ferma";
                    
                    button.appendChild(i);
                    button.appendChild(span);
                    buttons.appendChild(button);
                    //if we kyc = 0
                    farm.appendChild(buttons);
                    if (object.kyc_status == 0){
                        //farm not verified 
                        warning = document.createElement("div");
                        warning.className = "warning";
                        //create i
                        i  = document.createElement("i");
                        i.className = "fas fa-exclamation-circle";

                        span = document.createElement("span");
                        span.textContent = "Ferma nu este verificata";
                        warning.appendChild(i);
                        warning.appendChild(span);
                        farm.appendChild(warning);
                    }
               
                    frag.appendChild(farm);
                }
                parent.appendChild(frag);
            }
        }
    })
}

function goto_points(e){
    let id = e.dataset.id;
    location.href = '/wpoints/'+id;
}