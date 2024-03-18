var selected_client = -1,page = 0,i=0,socket,selected_client_username = "";
$(document).ready(function(){

    $("#message").on('keyup', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            send_msg()
        }
    });

    document.querySelector(".chat_container").onclick = function(){
        open_chat();
    }

    $("#image_chat_input").on("change",function(){
        let temp = document.querySelector("#chat_message_image").content.cloneNode(true);                            
        temp.querySelector(".message_wraper").classList.add("sent");
        temp.querySelector(".message_received").className = "message_sent image";                            
               let img = temp.querySelector("img");
               img.src = URL.createObjectURL(document.querySelector("#image_chat_input").files[0]);
        document.querySelector(".middle_conv").appendChild(temp);
        setTimeout(function(){
            document.querySelector(".middle_conv").scrollTop = document.querySelector(".middle_conv").scrollHeight; 
        },30)
        upload(temp);
    })

    $(".chat_body").on("mouseenter","div.conversation",function(elem){                   
    
    let span = elem.currentTarget.querySelector(".last_message");

    let time = (span.scrollWidth - span.clientWidth) * 10;
    if (time>=10000)
    time = 10000;   
    $(span).stop();
    $(span).animate({
        scrollLeft: span.scrollWidth - span.clientWidth
    },time,"linear")


    
})



$(".chat_body").on("mouseleave","div.conversation",function(elem){          
   
 let span = elem.currentTarget.querySelector(".last_message");
 $(span).stop();
 $(span).animate({
        scrollLeft: 0
    },200,"linear")
})

             socket = io("localhost:3000",{withCredentials: true});
            socket.emit("request_chats");

            
  

   
   socket.on("response_chats",(messages)=>{
       console.log(messages);
      if (messages.length!=0)
       Object.keys(messages).map(msg=>{
           if (messages[msg]!=null && messages[msg].receiver_username){

               let temp = document.querySelector("#chat_conv").content.cloneNode(true);
               temp.querySelector(".user_from").textContent = messages[msg].receiver_username;

               if (messages[msg].type == 0)
               temp.querySelector(".last_message").textContent = messages[msg].content;
               else
               temp.querySelector(".last_message").textContent = "Image";

                temp.querySelector(".conversation").dataset.uid = messages[msg].receiver_id;

               temp.querySelector(".conversation").onclick = function(){
                   choose_receiver(messages[msg].receiver_id,messages[msg].receiver_username);
               }
               console.log(msg);
               document.querySelector(".chat_conv").appendChild(temp);
       }
       })
   })
   
   socket.on("received_msg",({msg,from})=>{
       
       if (parseInt(from.split("-")[0])  == parseInt(selected_client) ){
           //just append to the conv 
           let temp = document.querySelector("#chat_message").content.cloneNode(true);
           temp.querySelector(".message_content").textContent = msg;    
   
       document.querySelector(".middle_conv").appendChild(temp);
       document.querySelector(".middle_conv").scrollTop = document.querySelector(".middle_conv").scrollHeight;
       //change chat_head
       let ok=false;
       Array.from(document.querySelectorAll(".conversation")).forEach(elem=>{
           if (parseInt(elem.dataset.uid) == parseInt(from))
           {
               elem.querySelector(".last_message").textContent = msg;
               ok = true;
           }
       })
       //send seen 
       socket.emit("seen_server",from);
       }
       else{
           //just change the head 
                 //change chat_head
       let ok=false;
       Array.from(document.querySelectorAll(".conversation")).forEach(elem=>{
           if (parseInt(elem.dataset.uid) == parseInt(from))
           {
               elem.querySelector(".last_message").innerHTML = `<b>${msg}</b>`;
               ok = true;
           }
       })
       }
   })
   
   socket.on("parsed_messages",({messages,sender_id,last_activity})=>{
       console.log(messages);
       let p;
      //first delete prev 
      Array.from(document.querySelectorAll(".message_wraper")).forEach(elem=>{
          elem.remove();
      })
      let temp ;
       messages.map(message=>{
   
            temp = document.querySelector("#chat_message").content.cloneNode(true);
         

           if (message.type==0)
           {
            if (message?.sender_id == sender_id || message.username == sender_id)
           {
               temp.querySelector(".message_wraper").classList.add("sent");
               temp.querySelector(".message_received").className = "message_sent";
           }
           temp.querySelector(".message_content").textContent = message.msg || message.content;
           //set seen 
           if(last_activity > message.timestamp)
           {
               temp.querySelector(".sns").innerHTML = "Seen <i class='fas fa-check-double'></i>"; 
           }
           document.querySelector(".middle_conv").appendChild(temp);
        }
           else if (message.type == 1){

               let temp = document.querySelector("#chat_message_image").content.cloneNode(true);
                     if (message?.sender_id == sender_id || message.username == sender_id)
                            {
                                temp.querySelector(".message_wraper").classList.add("sent");
                                temp.querySelector(".message_received").className = "message_sent image";
                            }
               let img = temp.querySelector("img");
               img.src = "chat_uploads/"+(message.msg || message.content);
                    //set seen 
                    if(last_activity > message.timestamp)
                    {
                        temp.querySelector(".sns").innerHTML = "Seen <i class='fas fa-check-double'></i>"; 
                    }
               document.querySelector(".middle_conv").appendChild(temp);
   
           }
   
       })
       setTimeout(function(){
        document.querySelector(".middle_conv").scrollTop = document.querySelector(".middle_conv").scrollHeight + 500;

       },10)

   })
   
   socket.on("seen",receiver_id=>{
       console.log("seen by "+receiver_id);
       if (parseInt(selected_client) == parseInt(receiver_id)){
           //update all to seen 
           Array.from(document.querySelectorAll(".sns")).forEach(elem=>{
               elem.innerHTML = "Seen <i class='fas fa-check-double'></i>";
           })
   
       }
   })
   
   socket.on("received_image",({msg,from})=>{
       if (parseInt(from) ==parseInt(selected_client)){
           //just append 
           let temp = document.querySelector("#chat_message_image").content.cloneNode(true);
        
           let img = temp.querySelector("img");
           img.src = "chat_uploads/"+msg;
       document.querySelector(".middle_conv").appendChild(temp);

       //change chat_head
       let ok=false;
       Array.from(document.querySelectorAll(".conversation")).forEach(elem=>{
           if (parseInt(elem.dataset.uid) == parseInt(from))
           {
               elem.querySelector(".last_message").textContent = "Image";
               ok = true;
           }
       })
       setTimeout(function(){
        document.querySelector(".middle_conv").scrollTop = document.querySelector(".middle_conv").scrollHeight;
       },20)
       //send seen 
       socket.emit("seen_server",from);
           //and send seen 
   
       }
       else{
           //add to conv head 
       Array.from(document.querySelectorAll(".conversation")).forEach(elem=>{
           if (parseInt(elem.dataset.uid) == parseInt(from))
           {
               elem.querySelector(".last_message").innerHTML = `<b>Image</b>`;
           }
       })
       }
   })
})

function open_chat(){
    //open chat 
        document.querySelector(".fa-comment-alt").style.display = "none";
        document.querySelector(".body_content").style.width = "600px";
        document.querySelector(".chat_container").classList.add("active_chat");
        document.querySelector(".chat_body").style.width = "300px";
        document.querySelector(".chat_body").style.height = "100%";    
   
        document.querySelector(".conv_body").style.width = "300px";
        document.querySelector(".conv_body").style.height = "100%";
   
        //remove listent  
        document.querySelector(".chat_container").onclick = null;
   
    
   }
   
function choose_receiver(receiver_id,username){
    console.log("receiver "+receiver_id )
    selected_client = parseInt(receiver_id);
    
    socket.emit("parse_messages",{receiver_id: parseInt(receiver_id),page});
    open_conv(username);
 }
function send_msg(){
    let msg = document.querySelector("#message").value;

    if (msg.trim()!=""){
        if (selected_client!=-1)
        {
            
            //append to the body 
            let temp = document.querySelector("#chat_message").content.cloneNode(true);
            temp.querySelector(".message_content").textContent = msg;    

            temp.querySelector(".message_wraper").classList.add("sent");
            temp.querySelector(".message_received").className = "message_sent";

            document.querySelector(".middle_conv").appendChild(temp);
            document.querySelector(".middle_conv").scrollTop = document.querySelector(".middle_conv").scrollHeight;

            //update the conv head to
            let ok=false;
            Array.from(document.querySelectorAll(".conversation")).forEach(elem=>{
                if (parseInt(elem.dataset.uid) == selected_client)
                {
                    elem.querySelector(".last_message").textContent = msg;
                    ok = true;
                }
            })
            if (!ok && selected_client_username!=""){
                //wee need to add the conversation head 
                let temp = document.querySelector("#chat_conv").content.cloneNode(true);
                temp.querySelector(".user_from").textContent = selected_client_username;
                temp.querySelector(".last_message").textContent = msg;
                 temp.querySelector(".conversation").dataset.uid = selected_client;
 
                temp.querySelector(".conversation").onclick = function(){
                    choose_receiver(selected_client,selected_client_username);
                }
                document.querySelector(".chat_conv").appendChild(temp);
            }
            //reset message
            document.querySelector("#message").value = "";
            socket.emit("send_message",{"msg":msg,"receiver":selected_client});  
          }
}
}
function upload(temp){
    console.log("upload");
    let formData = new FormData();

    formData.append("file",document.querySelector("#file").files[0]);

    $.ajax({
        url: '/chat_upload',
        type: "POST",
        cache: false,
        contentType: false,
        processData: false,
        data: formData,
        success: function(response){
            temp.remove();
            document.querySelector(".middle_conv").appendChild(temp);
            setTimeout(function(){
                document.querySelector(".middle_conv").scrollTop = document.querySelector(".middle_conv").scrollHeight; 
            },30)
            socket.emit("image_upload",{image_name: response.filename,receiver: selected_client})
        }
    })
}
function close_chat(){
   
    document.querySelector(".fa-comment-alt").style.display = "block";
   document.querySelector(".chat_container").classList.remove("active_chat");
   document.querySelector(".body_content").style.width = "0px";
   document.querySelector(".chat_body").style.width = "0px";
   document.querySelector(".chat_body").style.height = "0px";

   document.querySelector(".conv_body").style.width = "0px";
   document.querySelector(".conv_body").style.height = "0px";

   setTimeout(function(){
              //add listener 
   document.querySelector(".chat_container").onclick = function(){
           open_chat();
    }
   },500)             
}

function open_conv(username)
{
        document.querySelector(".body_content").style.left = "-300px";
        document.querySelector(".username").textContent = username;
        //reset last message to normal 
        try{
   let span =  document.querySelector(".conversation[data-uid='"+selected_client+"-id']").querySelector(".last_message");
   span.textContent = span.textContent;
        }catch(err)
        {

        }
}

function back_to_chat()
{
    selected_client = -1;
document.querySelector(".body_content").style.left = "0px";

}

function upload(){
    let file = document.querySelector("#image_chat_input").files;
    if (file.length!=0){
        let formData = new FormData();

        formData.append("chat_image",file[0]);

        $.ajax({
            url: "/chat_upload",
            type: "POST",
            processData: false,
            contentType: false,
            cache: false,
            data: formData,
            success: function(data){
                console.log(data);
                if (data.error){
                    alert(data.error);
                }
                else{
                    //we append the image to the chat 
                    socket.emit("image_upload",{image_name: data.filename,receiver: selected_client})

                }
            }
        })
    }
}


function send_new_user(user_id){
    //get the username 
    $.ajax({
        url: "/get_username",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"user_id":user_id}),
        success: function (data){
            console.log(user_id);
            selected_client = user_id;
            selected_client_username = data.username;
            open_chat();
            choose_receiver(selected_client,selected_client_username);
            
        }
    })
    
}