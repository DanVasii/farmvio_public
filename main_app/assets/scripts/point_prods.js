

function get_prods(point_id)
{
    $.ajax({
        url: "/get_prods_point",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"point_id":point_id}),
        success: function(data)
        {
            //console.log(data);
            if (data.length!=0){
                let prod_obj,temp,frag,parent,image_array;

                parent = document.getElementById("product_row");
                frag = document.createDocumentFragment();
                console.log(data);
                for (index in data){
                    prod_obj = data[index];
                    temp = document.getElementById("product_template").content.cloneNode(true);

                    //now we set the name 
                    temp.querySelector(".title:nth-child(1)").textContent = prod_obj.name;
                    temp.querySelector("#price").textContent = prod_obj.price+" RON / "+prod_obj.unit;
                    
                    if (prod_obj.images && prod_obj.images!='')
                    temp.querySelector(".top_content img").src = "/uploads/"+prod_obj.images; 
                    else
                    temp.querySelector(".top_content img").src = "/assets/images/icons/no_image.png"; 

                    let rating_border,rating_star;
                    //do the rating 
                    if(prod_obj.rating!=null){
                        let total_stars = 5;
                    for (let i = 1;i<=prod_obj.rating;i++)
                    {
                        //these are full stars 
                        rating_border = document.createElement("div");
                        rating_border.className = "rating_border";

                        rating_star = document.createElement("rating_star");
                        rating_star.className = "rating_star";
                        rating_star.style = "background-color: gold";

                        rating_border.appendChild(rating_star);

                        temp.querySelector("#read-only-stars").appendChild(rating_border);

                    }
                    
                    let fractionary = prod_obj.rating - parseInt(prod_obj.rating);
                    rating_border = document.createElement("div");
                    rating_border.className = "rating_border";

                    rating_star = document.createElement("rating_star");
                    rating_star.className = "rating_star";
                    rating_star.style = `background-image: linear-gradient(to right, gold ${fractionary*100}%, white ${100 - (fractionary*100)}%)`;

                    rating_border.appendChild(rating_star);

                    temp.querySelector("#read-only-stars").appendChild(rating_border);

                    for (let i = 1;i<=5-Math.ceil(prod_obj.rating);i++)
                    {
                        rating_border = document.createElement("div");
                        rating_border.className = "rating_border";

                        rating_star = document.createElement("rating_star");
                        rating_star.className = "rating_star";
                        rating_star.style = "background-color: white";

                        rating_border.appendChild(rating_star);

                        temp.querySelector("#read-only-stars").appendChild(rating_border);
                    }


                }else{
                    for (let i =1;i<=5;i++){
                    //all white 
                                      rating_border = document.createElement("div");
                                      rating_border.className = "rating_border";
              
                                      rating_star = document.createElement("rating_star");
                                      rating_star.className = "rating_star";
                                      rating_star.style = "background-color: white";
              
                                      rating_border.appendChild(rating_star);
              
                                      temp.querySelector("#read-only-stars").appendChild(rating_border);
                    }
                }

                    temp.querySelector("#view_link").href = "/products/"+prod_obj.farmer_slug+"/"+prod_obj.slug;
                    let prod_id = prod_obj.id;
                    temp.querySelector("#remove_prod").onclick = function(){
                        remove_item(prod_id,this);
                
                    }
                    temp.querySelector("#stock").onclick = function(){
                        window.location = "/stocks/"+prod_id;
                    }
                    temp.querySelector("#edit_link").onclick = function(){
                        window.location = "/edit/"+prod_id;
                    }
                    frag.appendChild(temp);

                }
                parent.appendChild(frag);
             }
             else{
                 let p = document.createElement("p");
                 p.textContent = "Nu sunt produse de afișat!";
                 p.style = "font-size: 22px;font-weight: bold;text-align:center"
                document.getElementById("product_row").appendChild(p);
             }
        }

    })
}

function remove_item(id,elem){
    $.ajax({
        url: "/remove_item",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"prod_id":id}),
        success: function(data){
            console.log(data);
            if (data == "OK")
            $(elem).parent().parent().parent().remove();
        }
    })

}