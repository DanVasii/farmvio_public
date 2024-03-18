class Renderer{
    with_cat_temp  = `
    <div class = 'card'>
      <div class = 'left_col'>

        <div class = 'slide_arrow left_arrow'>
          <i class="fa-regular fa-arrow-left"></i>
        </div>
              <div class = 'prod_elem_tray'>

      </div>
  
      <div class = 'slide_arrow right_arrow'>
          <i class="fa-regular fa-arrow-right"></i>
        </div>
   
                <div class = 'dot_holder'>
  
                <div class = 'dots'>

                </div>
  
            </div>
      </div>
      <div class = 'right_col'>
        <div class = 'top_infos'>
  
          <img src = 'pics/pic2.jpg'/>
            <div class = 'extra_infos'>
            <a></a>
              <span></span>
  
              <div class = 'cats_sold'>
             
              </div>
            </div>
        </div>
        <p class = 'farmer_desc'>
        </p>
      </div>
    </div>`;
    card_temp = `   <div class = 'farm_card' >
    <img class = 'farmer_img' src = '/assets/images/icons/no_image.png'>
    <span></span>
    <div class = 'cats_sold'>

    </div>
  </div>`;
  ad_but = `<div class = 'ad_button'><i class = 'fa-solid fa-wheat' style = 'color:#386A38'></i><span>Promovat</span></div>`;

    render_card_with_cat(point_data,point_prods,prom = false,firma_pic = null)
    {
        let temp,left,slide_elem,img,p,card_temp;
        //create the card temp -- for mobile phones  
        card_temp = document.createRange().createContextualFragment(this.card_temp);
        card_temp.querySelector("span").textContent = point_data.bis_name || point_data.nume_firma;
        //create the temp for desktop and main view
        temp = document.createRange().createContextualFragment(this.with_cat_temp);
        left = temp.querySelector(".prod_elem_tray");
        
        //set the prom 
        if (prom)
        {
            temp.querySelector(".right_col").appendChild(document.createRange().createContextualFragment(this.ad_but));
        }
        //set the data params
        temp.querySelector(".card").dataset.wpid = point_data.id;
        card_temp.querySelector("div").dataset.wpid = point_data.id;
        //check for farmer_image 
        if (point_data.image_name)
        {
            card_temp.querySelector("img").src = `profile_uploads/${point_data.image_name}`;
            temp.querySelector(".top_infos img").src = `profile_uploads/${point_data.image_name}`;
        }
        if (point_data.nume_firma)
        {
            card_temp.querySelector("img").src = `./views/assets/img/${firma_pic}.jpg`;
            temp.querySelector(".top_infos img").src = `./views/assets/img/${firma_pic}.jpg`;
        }

        //listeners for the slider 
        let left_arrow =  temp.querySelector(".left_arrow");
            left_arrow.onclick = function(){move_left(left_arrow)};
        let right_arrow = temp.querySelector(".right_arrow");
            right_arrow.onclick = function(){move_right(right_arrow)};

        //right col first because it's easier 
        temp.querySelector(".farmer_desc").textContent = point_data.descriere;
        temp.querySelector(".extra_infos a").textContent = point_data.bis_name ||point_data.nume_firma;
        temp.querySelector(".extra_infos a").href = `/profile/${(point_data.user_slug || point_data.slug_firma)}`;
        temp.querySelector(".extra_infos span").textContent = `${point_data.judet || ""}, ${point_data.oras || ""}`;

        //populate sold_cats 
        if (point_data.sold_cats != null)
        {
            try{
                let sold_cats = JSON.parse(point_data.sold_cats);
                sold_cats.map(sold_cat=>{
                    let img = document.createElement("img");
                    img.loading = "lazy";
                    img.src = `/assets/images/good_icons/${sold_cat.cat.toLowerCase()}.png`;

                    card_temp.querySelector(".cats_sold").appendChild(img.cloneNode(true));                   
                    temp.querySelector('.cats_sold').appendChild(img);
                })
            }
            catch
            {
              
            }
        }
        //populate prods now 
        if (point_prods.length!=0){
           
            left.appendChild(this.slide_elems(point_data,point_prods,prom));

        //add dots 
        for (let i = 0;i<point_prods.length;i++)
        {
            let dot = document.createElement("div");
            dot.className = "dot not_active_dot";
            dot.dataset.prod_index = i;
            temp.querySelector(".dots").appendChild(dot);
        }
        temp.querySelector(".dot").classList.remove('not_active_dot');
        temp.querySelector(".dot").classList.add("active_dot");
    }
    else{
        let p = document.createElement("p");
        p.textContent = "Fermierul nu are produse";
        p.style = "font-size: 18px;color: black";
        left.style = "display: flex; align-items: center; justify-content: center";
        left_arrow.remove();
        right_arrow.remove();
        left.appendChild(p);
    }

    return  {temp,card_temp};
    }

    slide_elems(point_data,point_prods,prom){
        let p,img,frag = document.createDocumentFragment(),slide_elem;
                for (let index_prod in point_prods){
                        
                    p = document.createElement("a");
                    p.style = "display:block";
                    p.textContent = point_prods[index_prod].name;
            
                    let farmer_slug = point_prods[index_prod].user_slug;
                    let product_slug = point_prods[index_prod].slug;

                    let farm_owner = point_data.farm_owner;
                    let point_slug = point_data.slug;
                    let prod_id = point_prods[index_prod].id || point_prods[index_prod].prod_id;

                    p.href = "/products/"+farmer_slug+"/"+product_slug+`?punct_livrare=${point_data.slug}`;
                    let images = point_prods[index_prod].images || point_prods[index_prod].prod_image;
                
                    if (images && images!='') {           
                    img = document.createElement("img");
                        img.loading = "lazy";    
                    img.src = "/uploads/"+images;
                    }
                    else{
                        img = document.createElement("img");
                        img.src = "./assets/images/icons/no_image.png";
                    }

                    slide_elem = document.createElement("div");               

                    
                if (index_prod!=0)
                    slide_elem.className = "prod_elem invis";
                    else{
                        slide_elem.className = "prod_elem vis";
                    }

                    slide_elem.dataset.prod_id = prod_id;

                    let atc_btn = document.querySelector("#atc_bu").content.cloneNode(true).querySelector("button");
                    
                    if (point_prods[index_prod].in_cart_qty==null){
                            if (point_prods[index_prod].sel_type!=2){
                                if (!prom)
                                {
                                    atc_btn.onclick = function()
                                    {
                                        atc(prod_id,point_slug,farm_owner,atc_btn,true);
                                    }
                                }
                                else{
                                    atc_btn.onclick = function(){
                                        open_custom_atc(prod_id);
                                    }
                                }
                        }
                        else{
                            // let textNode = document.createTextNode("Precomandă");
                            // atc_btn.appendChild(textNode);
                            // atc_btn.onclick = function()
                            // {
                            //     show_pre_order_form(prod_id);
                            // }
                        }
            }
            else{
                atc_btn.classList.add("pressed");
                atc_btn.querySelector(".action_icon i").className = "fa-duotone fa-trash";
                atc_btn.querySelector(".action_icon i").id = "";

                atc_btn.querySelector(".action_icon").onclick = function(){
                    remove_item(prod_id,point_slug,true,farm_owner,atc_btn,true)
                }
                atc_btn.querySelector("input").value = point_prods[index_prod].in_cart_qty;
            }

                    slide_elem.appendChild(img);
                    slide_elem.appendChild(p);   

                    slide_elem.appendChild(atc_btn);
                    frag.appendChild(slide_elem);
                
            }
            return frag;
    }


}