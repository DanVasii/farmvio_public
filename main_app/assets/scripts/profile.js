var qr_code = null;
var token = "";
$("document").ready(function(){

    
    $("#fa").on("change",function(){
        //post request to /change_auth
        send();
})
})


const send = () =>
{
    let csrf = document.getElementById("csrf").value;
    csrf = csrf.substring(0,csrf.length-1);
    $.ajax({
        url: "/change_auth",
        type: "POST",
        dataType: "json",
        headers:{
            "X-CSRF-Token": csrf
        },
        data: JSON.stringify({"code":document.getElementById("code").value,"token":token}),
        contentType: "application/json",
        success: function (data){
            console.log(data);
            if (data.status == "pending"){
                //show code input 
                $("#code_handler").css("display","block");
                token = data.link.split("secret=")[1];
                //load te qr 
                if(qr_code==null)
                {
                    //init 
                    qr_code = new QRCode("qrcode", {
                        text: data.link,
                        width: 256,
                        height: 256,
                        colorDark : "#000000",
                        colorLight : "#ffffff",
                        correctLevel : QRCode.CorrectLevel.H
                    });
                    
                }
                else{
                    qr_code.clear();
                    qr_code.makeCode(data.link);
                }
                
            }
        },
        error: function (err){
            alert("Server error! Try again later !");
        }
    })

}