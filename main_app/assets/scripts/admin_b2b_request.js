

var cats = [];
$(document).ready(function(){
    populate_reqs();

    $(".left_view").on("click",".image_holder",function(elem){
        if (!elem.currentTarget.classList.contains("active_slide"))
        {
            
            //remove the index, now set to this one 
            document.querySelector(".active_slide").classList.remove("active_slide");
            
            elem.currentTarget.classList.add("active_slide");

            //update the big img 
            let aux = elem.currentTarget.querySelector("img").cloneNode(true);
            document.querySelector(".slide img").remove();
            document.querySelector(".slide").appendChild(aux);
        }

    })

    $(".left_button i").on("click",function()
    {
        let index = $(".active_slide").index();
    
        if (index != 0){
            index--;
            let elem = document.querySelectorAll(".image_holder")[index];
        //remove the index, now set to this one 
        document.querySelector(".active_slide").classList.remove("active_slide");
        
        elem.classList.add("active_slide");

        //update the big img 
        let aux = elem.querySelector("img").cloneNode(true);
        document.querySelector(".slide img").remove();
        document.querySelector(".slide").appendChild(aux);
        }
    })

    $(".right_button i").on("click",function()
    {
     
        let index = $(".active_slide").index();
        let length = document.querySelectorAll(".image_holder").length - 1;

        console.log(index);
        console.log(length);
        if (index != length){
            index++;
            let elem = document.querySelectorAll(".image_holder")[index];
        //remove the index, now set to this one 
        document.querySelector(".active_slide").classList.remove("active_slide");
        
        elem.classList.add("active_slide");

        //update the big img 
        let aux = elem.querySelector("img").cloneNode(true);
        document.querySelector(".slide img").remove();
        document.querySelector(".slide").appendChild(aux);
        }
    })
})
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }



function populate_reqs()
{
    $.ajax({
        url: "/get_b2b_reqs",
        type: "POST",
        contentType: "application/json",
        success: function(data){
            console.log(data);
            let temp,frag,li,b,index,input,select,option;
            frag = document.createDocumentFragment();
            data.map(request=>{
                temp = document.querySelector("#farmer_req").content.cloneNode(true);

                temp.querySelector(".cert").onclick = function(){
                    open_prod_searcher(request.id);
                }  

                temp.querySelector(".update_data").onclick = function(){
                    update_data(request.id,this.parentElement);
                }
                temp.querySelector(".btn-success").onclick = function(){
                    accept_request(request.id,this.parentElement);
                }
                temp.querySelector(".btn-danger").onclick = function(){
                    decline_request(request.id,this.parentElement);
                }
                //add the id
                temp.querySelector("span").textContent = request.unique_id;
                index = 0;
                //add the lis 
                Object.keys(request).map(key=>{
                 
                    if (index>1 && index<=13)
                    {
                       
                        b = document.createElement("b");
                        //upper case first letter   
                        b.textContent = capitalizeFirstLetter(key)+": ";

                        input = document.createElement("input");
                        input.id = key;
                        input.value = request[key];


                        li = document.createElement("li");
                        li.appendChild(b);
                        li.appendChild(input);

                        temp.querySelector("ul").appendChild(li);                  
                }
                index++;
                })

                frag.appendChild(temp);
                
            })
            document.querySelector("#main_content").appendChild(frag);
         
        }
    })
}

function accept_request(req_id,parent){
    $.ajax({
        url: "/accept_b2b_req",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"req_id":req_id}),
        success: function(data){
            //remove the main 
            parent.remove();
            console.log(data);
        },error: ()=>{
            alert("eroare");
        }
    })
}

function decline_request(req_id,parent){
    $.ajax({
        url: "/decline_b2b_req",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"req_id":req_id}),
        success: function(data){
            //remove the main 
            parent.remove();
            console.log(data);
        },error: ()=>{
            alert("eroare");
        }
    })
}


function get_cert(req_id){
    $.ajax({
        url: "/get_b2b_cert",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"req_id":req_id}),
        success: function(data){
            console.log(data);
            let div,img;
            
            div = document.createElement("div");
            div.className = "image_holder";

            img = document.createElement("img");
            img.src = data;

            div.appendChild(img);
            document.querySelector(".product_searcher .left_view").appendChild(div);      

            //now we set the first slide 
            document.querySelector(".product_searcher .left_view .image_holder:first-child").classList.add("active_slide");

            //now set it 
           let first =  document.querySelector(".product_searcher .left_view .image_holder:first-child img").cloneNode(true);

           document.querySelector(".slide").appendChild(first);
            
        }
    })
}



function clear_popup()
{
    document.querySelectorAll(".image_holder").forEach(elem=>{
        elem.remove();
    })

    document.querySelector(".slide img ")?.remove();
}

function open_prod_searcher(req_id)
{
    clear_popup();
    document.querySelector(".product_searcher").style.transform = "scale(1)";
    document.querySelector(".product_searcher_bg").style.visibility = "visible";
    document.querySelector(".product_searcher_bg").style.opacity = "1";
        get_cert(req_id);    

}

function exit_product_searcher()
{
    document.querySelector(".product_searcher").style.transform = "scale(0)";
    document.querySelector(".product_searcher_bg").style.visibility = "hidden";
    document.querySelector(".product_searcher_bg").style.opacity = "0";
   
}



function update_data(req_id,parent){
    console.log(parent);
    //build the data 
    let data = {};
    data.nume = parent.querySelector("#nume").value;
    data.prenume = parent.querySelector("#prenume").value
    data.email = parent.querySelector("#email").value
    data.tel = parent.querySelector("#tel").value
    data.judet = parent.querySelector("#judet").value
    data.oras = parent.querySelector("#oras").value
    data.adresa = parent.querySelector("#adresa").value
    data.cui = parent.querySelector("#cui").value
    data.nume_firma = parent.querySelector("#nume_firma").value
    data.nr_reg = parent.querySelector("#nr_reg").value
    data.banca = parent.querySelector("#banca").value
    data.cont = parent.querySelector("#cont").value
    

    $.ajax({
        url: "/update_b2b_req",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"data": data,"req_id":req_id}),
        success: function(data){
            alert("Succes!");
        },error:()=>{
            alert("error");
        }
    })
}