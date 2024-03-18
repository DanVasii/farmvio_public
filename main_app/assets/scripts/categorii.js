
var bigimage,thumbs, $big_car,$thumb_car,current_prod_id = -1;


$(document).ready(function()
{
    bigimage = $("#big");
    thumbs = $("#thumbs");

    $(".select_wpoint").on("change",function(elem){
        if (elem.currentTarget.value.trim()!="")
        {
            update_cart_details(elem.currentTarget.value);
        }
        else{
            document.querySelector(".default-btn").onclick = null;
            
        }
    })
})


function open_filters(prod_id){
    
    document.querySelector(".filters_container").style.transform = "scale(1)";
    $(".filters_bg").fadeIn("slow");
    current_prod_id = prod_id;
    populate_prod_data(prod_id);
}
function close_window()
{
    current_prod_id = -1;
    document.querySelector(".filters_container").style.transform = "scale(0)";
    $(".filters_bg").fadeOut("slow");
    $(".select_wpoint")?.css("border","1px solid #ced4da");
}


function populate_prod_data(prod_id)
{
    $.ajax({
        url: "/get_prod_data",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"prod_id":prod_id}),
        success: function(data)
        {
            console.log(data);
            if (data)
            {
                //clear the select 
                Array.from(document.querySelectorAll(".select_wpoint option")).forEach((elem,index)=>
                    {
                        if(index!=0)
                       elem.remove();
                    })
                let parent = document.querySelector(".filters_container");
                parent.querySelector("h3").textContent = data.details.name;
                
                parent.querySelector(".new-price").textContent = data.details.price + " RON / "+data.details.unit;
                parent.querySelector("p").textContent = data.details.description;
                let aux,img;

                if ($big_car)
                refresh_carousel();


                //set images 
                if (data.images.length!=0)
                {
                    for (index in data.images)
                    {
                        aux = document.createElement("div");
                        aux.className = "item";

                        img = document.createElement("img");
                        img.src = `/uploads/${data.images[index].file_name}`;

                        aux.appendChild(img);


                        document.querySelector("#big").appendChild(aux);
                        //add as thumb to 
                        aux = document.createElement("div");
                        aux.className = "item";

                        img = document.createElement("img");
                        img.src = `/uploads/${data.images[index].file_name}`;

                        aux.appendChild(img);
                        document.querySelector("#thumbs").appendChild(aux);
                    }
                    
                }
                else{
                    //just add
                    aux = document.createElement("div");
                    aux.className = "item";

                    img = document.createElement("img");
                    img.src = `/assets/images/icons/no_image.png`;

                    aux.appendChild(img);


                    document.querySelector("#big").appendChild(aux);
                    //add as thumb to 
                    aux = document.createElement("div");
                    aux.className = "item";

                    img = document.createElement("img");
                    img.src = `/assets/images/icons/no_image.png`;

                    aux.appendChild(img);
                    document.querySelector("#thumbs").appendChild(aux);            
                }
                re_init_carousel(data.images.length);


                //add wpoints 
                if (data.points)
                {
                    let option;
                    for (index in data.points){
                            
                        option = document.createElement("option");
                        option.value = data.points[index].id;

                        option.textContent = `${data.points[index].judet}, ${data.points[index].oras}, ${data.points[index].adresa}`;

                        document.querySelector(".select_wpoint").appendChild(option);
                    }
                    
                }
                else{
                    close_window();
                }
            }else{
                close_window();
            }
        },error: function()
        {
            close_window();
        }
    })
}


function refresh_carousel()
{
    $big_car.trigger('destroy.owl.carousel'); 
    $big_car.find('.owl-stage-outer').children().unwrap();
    $big_car.removeClass("owl-center owl-loaded owl-text-select-on");

    $thumb_car.trigger('destroy.owl.carousel'); 
    $thumb_car.find('.owl-stage-outer').children().unwrap();
    $thumb_car.removeClass("owl-center owl-loaded owl-text-select-on");
    console.log("f");
                    //remove all images 
                    Array.from(document.querySelectorAll("#big .item")).forEach(elem=>{
                        elem.remove();
                    })
                    Array.from(document.querySelectorAll("#thumbs .item")).forEach(elem=>{
                        elem.remove();
                    })
}


function re_init_carousel(len)
{
    
    $big_car =  bigimage
    .owlCarousel({
    items: 1,
    slideSpeed: 2000,
    nav: true,
    autoHeight: false,
    autoplay: false,
    dots: false,
    loop: true,
    responsiveRefreshRate: 200,
    navText: [
      '<i class="fa fa-arrow-left" aria-hidden="true"></i>',
      '<i class="fa fa-arrow-right" aria-hidden="true"></i>'
    ]
  })
    .on("changed.owl.carousel", syncPosition);

  $thumb_car =  thumbs
    .on("initialized.owl.carousel", function() {

    thumbs
      .find(".owl-item")
      .eq(0)
      .addClass("current");
  })
    .owlCarousel({
    items: len,
    smartSpeed: 200,
    slideSpeed: 500,
    responsiveRefreshRate: 100,
    responsive:
    {
        0: {
            items: 1
        },
        576: {
            items: 1
        },
        768: {
            items: 2
        },
        1200: {
            items: 4
        }
    }
  })
    .on("changed.owl.carousel", syncPosition2);
}



function syncPosition(el) {
    try{
    //if loop is set to false, then you have to uncomment the next line
    //var current = el.item.index;

    //to disable loop, comment this block
    var count = el.item.count - 1;
    var current = Math.round(el.item.index - el.item.count / 2 - 0.5);

    if (current < 0) {
      current = count;
    }
    if (current > count) {
      current = 0;
    }

    console.log(current);
    //to this
    thumbs
      .find(".owl-item")
      .removeClass("current")
      .eq(current)
      .addClass("current");
    var onscreen = thumbs.find(".owl-item.active").length - 1;
    var start = thumbs
    .find(".owl-item.active")
    .first()
    .index();
    var end = thumbs
    .find(".owl-item.active")
    .last()
    .index();

    console.log(start + " "+end)
    if (current > end) {
      thumbs.data("owl.carousel").to(current, 100, true);
    }
    if (current < start) {
      thumbs.data("owl.carousel").to(current - onscreen, 100, true);
    }
}
catch(e)
{}
  }


  function syncPosition2(el) {
    if (true) {
      var number = el.item.index;
      bigimage.data("owl.carousel").to(number, 100, true);
    }
  }


  function update_cart_details(point_id)
{   
    $.ajax({
        url: "/get_cart_details",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"prod_id": current_prod_id,"point_id": point_id}),
        success: function(data){
            let btn = document.querySelector(".default-btn");
            console.log(point_id);
            if (data.length==0)
            {
                //atc 
                document.querySelector(".input-counter input").value = 1;
                btn.innerHTML = `<i class="fas fa-cart-plus"></i> Adaugă în coș`;
                btn.onclick = null;
                btn.onclick = function()
                {
                    atc(current_prod_id,point_id);
                }
            }
            else{
                document.querySelector(".input-counter input").value = data[0].qty;
                btn.innerHTML = '<i class="far fa-trash-alt"></i>Șterge din coș';
                btn.onclick = null;
                btn.onclick = function()
                {
                    remove_item(current_prod_id,point_id);
                }
            }
        }
    })

}