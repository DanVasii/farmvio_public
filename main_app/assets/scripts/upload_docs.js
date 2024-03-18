var modal_bg = null, modal = null;
var down = false;
var homeX = 0,homeY = 0;
$(function(){
    modal_bg = document.querySelector(".modal_background");
    modal = document.querySelector(".custom_modal");

    $("#avize_holder").on("change","input",function(){

        if (this.files.length!=0)
        {
            //check the type 
            if (!this.files[0].type.includes("image") && !this.files[0].type.includes("pdf"))
            {
                //alert here 
                //custom alert, something nice 
                $.toast({
                    heading: 'Accest tip de fișier nu este acceptat!',
                    text: 'Te rugăm să încarci alt tip de document!',
                    position: 'top-right',
                    loaderBg: '#ff6849',
                    icon: 'warning',
                    hideAfter: 3500,
                    stack: 6
                });
        
                return ;
            }
            //add the preview
            let temp = document.querySelector("#aviz_preview").content.cloneNode(true);
            let parent_tmep = temp.querySelector("div");

            if (this.files[0].type.includes("image")){
            temp.querySelector("img").src = URL.createObjectURL(this.files[0]);

            temp.querySelector("img").style.maxWidth = "95%";
            }
            temp.querySelector(".btn-danger-light").onclick = ()=>{
                remove_aviz(parent_tmep,this.parentElement.parentElement);
            }
            temp.querySelector(".btn-primary-light").onclick = ()=>{
                make_aviz_bigger(URL.createObjectURL(this.files[0]),this.files[0].type);
            }

            temp.querySelector("span").textContent = this.files[0].name;
            document.querySelector("#avize_holder").appendChild(temp);
            this.parentElement.parentElement.style.display = "none";
            //prepend the plus 

            document.querySelector("#avize_holder").prepend(document.querySelector("#add_aviz_temp").content.cloneNode(true));
        }
    })

    $("#cert_file").on("change",function(){
        //preview 
            if (this.files.length != 0)
            {
                
                document.querySelector(".white_back object").data = URL.createObjectURL(this.files[0]);
                document.querySelector(".white_back object").type = this.files[0].type;
                document.querySelector(".white_back").style.display = "block";
            }
    })

    // $(".custom_modal").on("mousedown","object",function(event)
    // {
    //     down = true;
    //     homeX = event.pageX;
    //     homeY = event.pageY;
    // })

    // $(".custom_modal").on("mousemove","object",function(event)
    // {   
        
    //     if (down)
    //     {
    //         //get x and y 
    //         let x = parseInt(this.style.left || 0);
    //         let y  = parseInt(this.style.top || 0);
            


    //         this.style.left = x + (homeX - event.pageX) + "px";
    //         this.style.top = y + (homeY - event.pageY) + "px";

    //         homeX = event.pageX;
    //         homeY = event.pageY;
            
    //     }
    // })

    // $(".custom_modal").on("mouseup","object",function(event)
    // {
    //     down = false;
    // })
  
    parse_docs();
})

function parse_docs()
{
    parse_docs_length().then(()=>{
        parse_cert();
        parse_avize();
    }).catch((err)=>{
        console.log(err);
    })
    // $.ajax({
    //     url: "/get_my_docs",
    //     type: "POST",
    //     contentType: "application/json",
    //     success: function(data)
    //     {
    //         console.log(data);
    //     }
    // })
}

function parse_docs_length()
{
    return new Promise((res,rej)=>{
        $.ajax({
            url: "/get_docs_length",
            type: "POST",
            contentType: "application/json",
            success: function(data)
            {
                
                if (data.avize)
                {
                    for (let i = 1;i<=data.avize;i++)
                    {
                        let temp = document.querySelector("#skeleton_aviz").content.cloneNode(true);
                        document.querySelector("#avize_holder").appendChild(temp);
                    }
                }
                //set data.avize skeletons 
                res();
            }
        })
    })
  
}

function parse_cert()
{
    $.ajax({
        url: "/get_docs_cert",
        type: "POST",
        contentType: "application/json",
        success: function(data)
        {
            if (data.type && data.data)
            {
                if (data.type == "i")
                {
                    document.querySelector(".white_back object").data = "data:image/png;base64, "+data.data;
                    document.querySelector(".white_back object").type = "image/png";
                    document.querySelector(".white_back").style.display = "block";
                }
            }
        }
    })
}

function parse_avize()
{
    $.ajax({
        url: "/get_docs_avize",
        type: "POST",
        contentType: "application/json",
        success: function(data)
        {
           Array.from(document.querySelectorAll(".skeleton_container")).forEach((elem)=>{
               elem.remove();
           })
            if (data.length!=0)
            {
                data.map((aviz)=>{

                    let temp = document.querySelector("#aviz_preview").content.cloneNode(true);
                    let parent_tmep = temp.querySelector("div");
        

                    if (aviz.type == "i"){
                    temp.querySelector("img").src = "data:image/png;base64, "+aviz.data;
                    temp.querySelector("img").style.maxWidth = "95%";
                    }

                    temp.querySelector(".btn-danger-light").onclick = ()=>{
                        remove_aviz(parent_tmep,null);
                    }

                    temp.querySelector(".btn-primary-light").onclick = ()=>{
                        make_aviz_bigger(aviz.type == "i" ? "data:image/png;base64, "+aviz.data :"data:application/pdf;base64, "+aviz.data, aviz.type == "i" ? "image/png" : "application/pdf");
                    }
        
                   // temp.querySelector("span").textContent = this.files[0].name;
                    document.querySelector("#avize_holder").appendChild(temp);

                    document.querySelector("#avize_holder").appendChild(temp);
                })
            }
        }
    })
}

function remove_uploaded_pic()
{
    document.querySelector(".white_back object").data = "";
    document.querySelector(".white_back object").type = "";
    document.querySelector(".white_back").style.display = "none";
}


function make_it_bigger()
{
    try{
        let object =  document.querySelector(".white_back object");
        if (!object || !object.data)
           throw new Error("Not found");
        set_modal_pic(object);
        open_modal();
    }
    catch(e)
    {
        console.log(e);
    }

}


function close_bigger()
{
    try{
        close_modal();
    }   
    catch(e)
    {

    }
}

function open_modal()
{
    try{
        modal_bg.classList.remove("closed_backround");
        //open the backround 
        modal_bg.classList.add("opened_background");   

        modal.style.transform = "scale(1)";
    }
    catch(e)
    {
        console.log(e);
    }

}

function set_modal_pic(object)
{
    try{
        
        let new_obj = document.querySelector(".custom_modal object");

        if (new_obj)
        {
            new_obj.remove();
        }

        new_obj = object.cloneNode();

        document.querySelector(".custom_modal").appendChild(new_obj);
    }
    catch(e)
    {
      
    }
}


function close_modal()
{
    try{
        modal_bg.classList.remove("opened_background");
        //open the backround 
        modal_bg.classList.add("closed_backround");   
    
        modal.style.transform = "scale(0)";
    }
    catch(e)
    {

    }
}


function remove_aviz(elem,aviz)
{
    try{
        elem.remove();
        aviz.remove();
    }
    catch(e){

    }
}


function make_aviz_bigger(blob,type)
{
    try{
        let object = document.createElement("object");
        object.data = blob;
        object.type = type;
        set_modal_pic(object);
        setTimeout(()=>{
            open_modal();
        },1)
    }
    catch(e)
    {

    }
}


function send_form()
{
    //get the data 
    let data = new FormData();


    $.ajax({

    })
}