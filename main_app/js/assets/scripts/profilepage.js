$(document).ready(function(){
    
    $(".image_tray").on("click","img, .color_show",function(){
        //update show to 1
        let send;
        let tag = $(this).prop("tagName");
        if (tag == "DIV")
        send = $(this).css("background-color");
        else
        send = $(this).attr("src");
       
        //we should send this
        update_show(send);
    })

    $("#file_inp").on("change",function(){
        send_upload();
    })

    $("#colors").on("change",function(){
        //get the value and set it as bg color to label 
        $("label[for='colors']").css("background-color",document.getElementById("colors").value);
        send_upload(false);
    })
})

function edit(what){
    if (what!='user_bg_images')
    {
        //hide 
        $(".add_color").css("display","none");
    }
    else{
        //show 
        $(".add_color").css("display","flex");
    }
    //show 
    $(".black_panel").css("display","block");

    //set data attr 
    $(".image_tray").data("for",what);
    //show the data 
    populate_image_tray(what);
}


function update_show(name){
    $.ajax({
        url: "/update_images",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"for":$(".image_tray").data("for"),"image_name":name}),
        success: function(data){
            console.log(data);
            if (data == "OK")
            populate_image_tray($(".image_tray").data("for"));
        }
    })
}

function populate_image_tray(what){
      //first we remove all the images from .image_tray
      Array.from(document.getElementsByClassName("image_tray")[0].getElementsByTagName("img")).forEach((elem)=>{
        elem.remove();
    })
    //remove the colros too
    Array.from(document.getElementsByClassName("image_tray")[0].getElementsByClassName("color_show")).forEach((elem)=>{
        elem.remove();
    })
    $.ajax({
        url: "/get_images",
        type: 'POST',
        contentType: "application/json",
        data: JSON.stringify({"for":what}),
        success: function(data){
            if (data.length!=0){
            console.log(data);
           let img;
           let parent = document.getElementsByClassName("image_tray")[0];
           data = JSON.parse(data[0].images);
           
            for (index in data){
               //load em 
                //only if the name is an image 
                if (!data[data.length -  index-1].name.startsWith("#")){
                img = document.createElement("img");
                img.src = "./profile_uploads/"+data[data.length -  index-1].name;
                if (data[data.length -  index-1].show==1)
                {
                    //update the background to 
                    if (!what.includes("bg"))
                    $("#"+what).attr("src","./profile_uploads/"+data[data.length -  index-1].name);
                    else{
                        //remove bg color 
                        $("#"+what).css("background-color","none");
                        $("#"+what+"2").css("background-color","none");

                        $("#"+what).css("background-image","url('./profile_uploads/"+data[data.length -  index-1].name+"')");
                        $("#"+what+"2").css("background-image","url('./profile_uploads/"+data[data.length -  index-1].name+"')");

                    }
                    img.className = "active_image";
                }
                parent.appendChild(img);
                }
                else{
                    img = document.createElement("div");
                    img.style.backgroundColor = data[data.length -  index-1].name;
                    if (data[data.length -  index-1].show==1){
                    img.className += "active_color";

                    $("#"+what).css("background-image","none");
                    $("#"+what+"2").css("background-image","none");

                    $("#"+what).css("background-color",data[data.length -  index-1].name);
                    $("#"+what+"2").css("background-color",data[data.length -  index-1].name);
                    }

                    img.className += " color_show";
                    parent.appendChild(img);
                }
           }
        }
        }
    })
}

function send_upload(image = true){
    //create a form data 
    let data_form = new FormData();
    data_form.append("for", $(".image_tray").data("for"));
    if (image)
    data_form.append("test",document.getElementById("file_inp").files[0]);
    else{
        data_form.append("color",document.getElementById("colors").value);
    }
    console.log(document.getElementById("file_inp").files[0]);
    //send the data 
    $.ajax({
        url: "/add_user_image",
        type: "POST",
        contentType: false,
        cache: false,
        processData: false,
        data: data_form,
        success: function(data){
            populate_image_tray($(".image_tray").data("for"));
        }
    })
}
function closee(){
    console.log("test");
    $(".black_panel").css("display","none");
    
}