var cover_timeout = null,notify;
$(document).ready(function(){
    notify = new Notify();
    get_desc();
    get_progress();

    let url = window.location.href;
    let tab = url.split("#");
    //goto tab[1]
    
    document.querySelector("a[href='#"+tab[1]+"']")?.click();
    parse_farm_pics();

    $("#file_inp").on("change",function(){
        send_upload();
    })

    $("#colors").on("change",function(){
        //get the value and set it as bg color to label 
        $("label[for='colors']").css("background-color",document.getElementById("colors").value);
        send_upload(false);
    })


    $("#farm_image").on("change",function(){
        send_farm_pic();
    })

    $("#progress_handler").on("click",".show_more",function(){
        console.log(this.dataset.type)
        if (this.dataset.type === undefined || this.dataset.type == "0")
        {
            //show more
            this.querySelector("span").textContent = "Arată mai puțin";
            this.querySelector("i").style.transform = "rotate(180deg)";
            this.dataset.type = "1";

            this.parentElement.querySelector(".long_desc").style.maxHeight = "100px";
        }
        else{
            //show less
            this.querySelector("span").textContent = "Arată mai mult";
            this.querySelector("i").style.transform = "rotate(0deg)";
            this.dataset.type = "0";

            this.parentElement.querySelector(".long_desc").style.maxHeight = "0px";
        }
    })
    
})


function get_progress()
{
    $.ajax({
        url: "/get_progress",
        type: "POST",
        contentType: "application/json",
        success: function(data){
           

            let temp,frag;
            frag = document.createDocumentFragment();
                console.log(data);
           if (Object.keys(data).length != 0)
           {
               let total = 4;
                if (data.req == null || data.req != 3)
                {
                    //hide 
                    document.querySelector("#warning_docs").style.display = "none";
                }

                    
               if (data.phone_ver != null)
                {
                    temp = document.querySelector("#progress_item").content.cloneNode(true);
                    if (data.phone_ver==0)
                    {
                        temp.querySelector("button").textContent = "Verifică";
                        //goto verfy 
                        temp.querySelector("button").onclick = function(){
                            go_to("/personal_data");
                        }
                        temp.querySelector("span:nth-child(1)").textContent = "Verifică numărul de telefon";
                        temp.querySelector(".long_desc").textContent = "Te rugăm să verifici numărul de telefon!";
                        total--;
                    }
                    else{
                        temp.querySelector("button").disabled = true;
                        temp.querySelector("button").textContent = "Verificat";
                        temp.querySelector("span:nth-child(1)").textContent = "Verifică numărul de telefon";
                        temp.querySelector(".long_desc").textContent = "Mulțumim pentru verificarea numărului de telefon!";
                    }
                    
                    frag.appendChild(temp);
                }

                if (data.email_ver != null)
                {
                    temp = document.querySelector("#progress_item").content.cloneNode(true);
                    if (data.email_ver==0)
                    {
                        temp.querySelector("button").textContent = "Verifică";
                        //goto verfy 
                        temp.querySelector("button").onclick = function(){
                            go_to("/personal_data");
                        }

                        temp.querySelector("span:nth-child(1)").textContent = "Verifică adresa de email";
                        temp.querySelector(".long_desc").textContent = "Te rugăm să verifici adresa de email!";
                        total--;
                    }
                    else{
                        temp.querySelector("button").disabled = true;
                        temp.querySelector("button").textContent = "Verificat";
                        temp.querySelector("span:nth-child(1)").textContent = "Verifică adresa de email";
                        temp.querySelector(".long_desc").textContent = "Mulțumim pentru verificarea adresei de email!";
                    }
                    
                    frag.appendChild(temp);
                }

                if (data.farm_pic != null)
                {
                    temp = document.querySelector("#progress_item").content.cloneNode(true);
                    if (data.farm_pic==0)
                    {
                        temp.querySelector("button").textContent = "Adaugă";
                        //goto verfy 
                        temp.querySelector("button").onclick = function(){
                            go_to("#farm_pics");
                        }
                        temp.querySelector("span:nth-child(1)").textContent = "Adaugă poze cu ferma ta";
                        temp.querySelector(".long_desc").textContent = "Te rugăm să încarci poze cu ferma ta!";
                        total--;
                    }
                    else{
                        temp.querySelector("button").disabled = true;
                        temp.querySelector("button").textContent = "Adăugat";
                        temp.querySelector("span:nth-child(1)").textContent = "Adaugă poze cu ferma ta";
                        temp.querySelector(".long_desc").textContent = "Mulțumim pentru încărcarea pozelor cu ferma ta!";
                    }
                    
                    frag.appendChild(temp);
                }

                if (data.frv_desc != null)
                {
                    temp = document.querySelector("#progress_item").content.cloneNode(true);
                    if (data.frv_desc==0)
                    {
                        temp.querySelector("button").textContent = "Adaugă";
                        //goto verfy 
                        temp.querySelector("button").onclick = function(){
                            go_to("#settings");
                        }
                        temp.querySelector("span:nth-child(1)").textContent = "Adaugă o descriere fermei";
                        temp.querySelector(".long_desc").textContent = "Este important ca lumea să te cunoască. Te rugăm să completezi descrierea fermei!";
                        total--;
                    }
                    else{
                        temp.querySelector("button").disabled = true;
                        temp.querySelector("button").textContent = "Adăugat";
                        temp.querySelector("span:nth-child(1)").textContent = "Adaugă o descriere fermei";
                        temp.querySelector(".long_desc").textContent = "Mulțumim pentru completarea descrierii fermei!";
                    }
                    
                    frag.appendChild(temp);
                }
                let progress = document.querySelector("#progress_handler .progress-bar");
                progress.style = "width: "+(total*25)+"%";
                progress.querySelector("span").textContent = total*25+"%";
                if (total==4)
                    {

                        progress.classList.remove("progress-bar-primary");
                        progress.classList.add("progress-bar-success");
                    }
                document.querySelector("#progress_handler").appendChild(frag);
           }
        }
    })
}

function go_to(link)
{
    if (!link.startsWith("#"))
    window.location.href = link;
    else{
        document.querySelector("a[href='"+link+"']")?.click();
    }
}

function get_desc(){
    $.ajax({
        url: "/get_farm_desc",
        type: "POST",
        contentType: "application/json",
        success: function(data)
        {
            if (data.descriere)
            {
                document.querySelector("#settings textarea").value = data.descriere;
            }
        },error: function(){
            //disable 
            document.querySelector("#settings textarea").disabled = true;
            document.querySelector("#settings textarea").value = "Eroare de server";

        }
    })
}

 function update_cover(image_id,elem){
    $.ajax({
        url: "/update_cover",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"image_name": image_id}),
        success: function(){

            //re-enable the prev disabled button
            let prev = document.querySelector("#farm_pics_tray .set_cov:disabled");
            prev.disabled = false;
            prev.textContent = "Seteaza principala!";

            //disable the button and set as Pincipala 
            let btn = elem.querySelector(".set_cov");
            btn.disabled = true;
            btn.textContent = "Poză principală";

        },error: function(){
            notify.show_error("Eroare!","Te rugăm să încerci mai târziu!");
        }
    })
}




function parse_farm_pics()
{
    $.ajax({
        url: "/get_farm_pics_l",
        type: "POST",
        contentType: "application/json",
        success: function(data){
            //delete previous 
            Array.from(document.querySelectorAll(".img-col")).forEach(elem=>{
                elem.remove();
            })
            if (data.length==0)
            {
                //show no images 
                let p = document.createElement("p");
                p.className = "warning";
                p.textContent = "Nu ai nicio poză!";
                document.querySelector("#farm_pics").appendChild(p)

            }
            else{
                
                data.map(image=>{
                    let template;
                    template = document.querySelector("#uploaded_tray").content.cloneNode(true);

                    if (image.cover == 1){
                        template.querySelector(".set_cov").disabled = true;
                        template.querySelector(".set_cov").textContent = "Poză principală";
                           
                    }
                    
                    template.querySelector("img").src = "/uploads/"+image.image_name;

                    template.querySelector("textarea").textContent = image.descriere;
                    let div = template.querySelector(".img-col");
                    div.dataset.image_id = image.id;
                    
                    template.querySelector(".del_cov").onclick = function()
                    {
                        delete_farm_pic(image.id,div);
                    }

                    template.querySelector(".set_cov").onclick = function()
                    {
                        update_cover(image.id,div);
                    }


                    template.querySelector(".edit_cov").onclick = function()
                    {
                        prepare_cover_update(div,image.id);
                    }

                    document.querySelector("#farm_pics_tray").appendChild(template);

                })
            }
        }
    })
}

function prepare_cover_update(div,image_id)
{
    //prepare

    div.querySelector(".edit_cov").innerHTML = "<i class='fas fa-check' style='margin-right: 5px'></i>Finalizează editarea!";

    div.querySelector("textarea").disabled = false;

    div.querySelector(".edit_cov").onclick = null;

    div.querySelector(".edit_cov").onclick = function()
    {
        finish_cover_desc(div,image_id);
    }
}

function finish_cover_desc(div,image_id)
{
    $.ajax({
        url: "/update_farm_pic_desc",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"image_id":image_id,"desc":div.querySelector("textarea").value}),
        success: function(data){
            if (data.err)
            {
                div.querySelector("label").textContent = data.err;
            }
            else{
                div.querySelector("label").textContent = "";
                div.querySelector("textarea").disabled = true;
                div.querySelector(".edit_cov").onclick = null;
                div.querySelector(".edit_cov").onclick = function()
                {
                    prepare_cover_update(div,image_id);

                }
                div.querySelector(".edit_cov").innerHTML = `<i class="fas fa-edit" style = 'margin-left: 5px'></i> Editeză descrierea`;
            }
        },error: function()
        {
            notify.show_error("Eroare!","Te rugăm să încerci mai târziu!");
        }
    })
}

function delete_farm_pic(image_id,elem)
{
    $.ajax({
        url: "/delete_farm_pic",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"image_id":image_id}),
        success: function(){
            //remove 
            elem.remove();
            
        },error: function(){
            //eroare
        }
    })
}

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


function update_show(id){
    $.ajax({
        url: "/update_images",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"for":$(".image_tray").data("for"),"img_id":id}),
        success: function(data){         
            populate_image_tray($(".image_tray").data("for"));
        },
        error: function(){
            notify.show_error("Eroare!","Te rugăm să încerci mai târziu!")
        }
    })
}

function populate_image_tray(what){
      //first we remove all the images from .image_tray
      Array.from(document.querySelectorAll(".image_tray_element")).forEach((elem)=>{
        elem.remove();
    })
    //remove the colros too
    Array.from(document.querySelectorAll(".active_image")).forEach((elem)=>{
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
           
           
            for (index in data){
               //load em 
                //only if the name is an image 
                if (!data[index].image_name.startsWith("#")){
                img =  document.querySelector("#image_tray_temp").content.cloneNode(true);
                img.querySelector("img").src = "./profile_uploads/"+data[index].image_name;
                    let id = data[index].id;
                img.querySelector(".del_img").onclick = function(){
                    delete_farmer_profile_pic(id,what);
                }
                img.querySelector(".set_img").onclick = function(){
                    update_show(id);
                }
                if (data[index].show_image==1)
                {
                    //update the background to 
                    if (!what.includes("bg"))
                    $("#"+what).attr("src","./profile_uploads/"+data[index].image_name);
                    else{
                        console.log("STergem");
                        //remove bg color 
                        $("#"+what).css("background-color","white");
                        $("#"+what+"2").css("background-color","white");

                        $("#"+what).css("background-image","url('./profile_uploads/"+data[index].image_name+"')");
                        $("#"+what+"2").css("background-image","url('./profile_uploads/"+data[index].image_name+"')");

                    }
                    img.querySelector("div").classList.add("active_image");
                }
                parent.appendChild(img);
                }
                else{
                    img =  document.querySelector("#color_tray_temp").content.cloneNode(true);
                    img.querySelector(".colored_part").style.backgroundColor = data[index].image_name;

                    let id = data[index].id;

                    img.querySelector(".del_img").onclick = function(){
                        delete_farmer_profile_pic(id,what);
                    }
                    img.querySelector(".set_img").onclick = function(){
                        update_show(id);
                    }

                    if (data[index].show_image==1){
                    img.querySelector(".image_tray_element").classList.add("active_image");

                    $("#"+what).css("background-image","none");
                    $("#"+what+"2").css("background-image","none");

                    $("#"+what).css("background-color",data[index].image_name);
                    $("#"+what+"2").css("background-color",data[index].image_name);
                    }

                    img.className += " active_image";
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
    //add the template 
    if (image){
    let upload_temp = document.querySelector("#uploading_image").content.cloneNode(true);
    upload_temp.querySelector("img").src = URL.createObjectURL(document.getElementById("file_inp").files[0]);

    //prepend
    document.querySelector(".image_tray").insertBefore(upload_temp,document.querySelector(".image_tray .image_tray_element"));
    }

    $.ajax({
     
        url: "/add_user_image",
        type: "POST",
        contentType: false,
        cache: false,
        processData: false,
        data: data_form,
        success: function(data){
            
            populate_image_tray($(".image_tray").data("for"));
            closee();
        },
        xhrFields: {
            onprogress: function(progress) {
                
                var percentage = Math.floor((progress.total / progress.loaded) * 100);

                if (image)
                {
                    document.querySelector(".image_tray .image_tray_element .progress-bar").style.width = percentage + "%";
                    document.querySelector(".image_tray .image_tray_element .progress-bar .sr-only").textContent = percentage+ "%";
                }
                
                //update 
               
            }
        }
    })
}
function closee(){
    console.log("test");
    $(".black_panel").css("display","none");
    
}


function send_farm_pic(){
    //get the current 
    let form_data = new FormData();
    form_data.append("image",document.querySelector("#farm_image").files[0]);

    $.ajax({
        url: "/upload_farm_pic",
        type: "POST",
        contentType: false,
        cache: false,
        processData: false,
        data: form_data,
        success: function(data){
            console.log(data);
            if (data.filename){
                //append 
                let temp = document.querySelector("#uploaded").content.cloneNode(true);
                temp.querySelector("img").src = "/previews/"+data.filename;
                console.log(temp);

                document.querySelector(".images").appendChild(temp);
            }
            else{
                alert("Upload error!");
            }
        }    
    })
}


function finish_upload()
{
    let data  = [];
    Array.from(document.querySelectorAll(".uploaded")).forEach(elem=>[
        data.push({"filename":elem.querySelector("img").src,"desc":elem.querySelector("textarea").value})
    ])

    $.ajax({
        url: "/finish_upload_farm_pic",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"content":data}),
        success: function(data){
       
            if (data.err){
            notify.show_error("Eroare!",data.err);
            //refresh and close 

            Array.from(document.querySelectorAll(".uploaded textarea")).forEach(elem=>{
                
                if (elem.value.trim() == "")
                {
                    elem.style.border = "1px solid red";
                }
                else{
                    elem.style.border = "1px solid #ced4da";
                }
            })
        }
        else{
            if (data.redirect)
            {
                parse_farm_pics();
                //remove uploaded
                Array.from(document.querySelectorAll(".uploaded")).forEach(elem=>{
                    elem.remove();
                    //close the pop-up
                    $.magnificPopup.instance.close();
                    //show message 
                    notify.show_success("Succes!","Pozele au fost încărcate!")
                })
                document.querySelector("a[href='#settings']")?.click();
            }
            else{
            parse_farm_pics();
            //remove uploaded
            Array.from(document.querySelectorAll(".uploaded")).forEach(elem=>{
                elem.remove();
                //close the pop-up
                $.magnificPopup.instance.close();
                //show message 
                notify.show_success("Succes!","Pozele au fost încărcate!")
            })
        }
        }
        }
    })
}

function upload_desc()
{
    $.ajax({
        url: "/update_farmer_desc",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"desc":document.querySelector("#settings textarea").value}),
        success: function(data){
            if (data.final_step)
            {
                $("#modal-success").modal("toggle");
            }
            else
            notify.show_success("Succes!","Descrierea a fost actualizată!")
        }
        ,error: function(){
            notify.show_error("Eroare!","Ceva nu a mers bine, te rugăm să încerci mai târziu!");
        }
    })
}


function delete_farmer_profile_pic(id,what)
{
    $.ajax({
        url: "/delete_farmer_profile_pic",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"img_id":id,"what":what}),
        success: function()
        {
            populate_image_tray(what);
        },error: function(){
            notify.show_error("Eroare!","Te rugăm să încerci mai târziu!");
        }
    })
}