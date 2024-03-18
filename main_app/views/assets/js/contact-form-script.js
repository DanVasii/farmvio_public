/*==============================================================*/
// Zash Contact Form  JS



/*==============================================================*/
var notify;

(function ($) {
    notify = new Notify();
    "use strict"; // Start of use strict
    $("#contactForm").validator().on("submit", function (event) {
        if (event.isDefaultPrevented()) {
            // handle the invalid form...
            formError();
            submitMSG(false, "Te rugăm să completezi formularul corect!");
        } else {
            // everything looks good!
            event.preventDefault();
            submitForm();
        }
    });

    $("#askForm").validator().on("submit", function (event) {
        if (event.isDefaultPrevented()) {
            // handle the invalid form...
            askError();
            submitMSG(false, "Te rugăm să completezi formularul corect!");
        } else {
            // everything looks good!
            event.preventDefault();
            askForm();
        }
    });

    function askForm()
    {
        var name = $("#name").val();
        var email = $("#email").val();
        var phone = $("#phone_number").val();
        var msg_subject = $("#msg_subject").val();
        var message = $("#message").val();

        $.ajax({
            type: "POST",
            url: "/ask_q",
            contentType: "application/json",
            data: JSON.stringify({"name": name, "email": email, "msg_subject": msg_subject, "message": message,"phone_number": phone}),
            success : function(text){
                Array.from(document.querySelectorAll(".list-unstyled")).forEach(elem=>{
                    elem.remove();
                })
                submitMSG(false,"");

                if (Object.keys(text).length==0){
                    notify.show_success("Succes!","Întrebarea a fost trimisă!");
                    document.querySelector("button.optional-btn[type='submit']").disabled = true;
                    askSuccess();
                } else {
                    Object.keys(text).map((key)=>{
                        let val = text[key];

                        if (key!="msgSubmit")
                        {
                            //show 
                            document.querySelector("#"+key).parentElement.querySelector(".with-errors").innerHTML = `<ul class="list-unstyled"><li>${val}</li></ul>`;
                        }
                    })
                    askError();
                    submitMSG(false,text.msgSubmit);
                }
            },error: function(){
                notify.show_error("Eroare!","Te rugăm să încerci mai târziu!");
            }
        });


    }



    function submitForm(){
        // Initiate Variables With Form Content
        var name = $("#name").val();
        var email = $("#email").val();
        var phone = $("#phone_number").val();
        var msg_subject = $("#msg_subject").val();
        var message = $("#message").val();


        $.ajax({
            type: "POST",
            url: "/send_contact",
            contentType: "application/json",
            data: JSON.stringify({"name": name, "email": email, "msg_subject": msg_subject, "message": message,"phone_number": phone}),
            success : function(text){
                Array.from(document.querySelectorAll(".list-unstyled")).forEach(elem=>{
                    elem.remove();
                })
                submitMSG(false,"");

                if (Object.keys(text).length==0){
                    notify.show_success("Succes!","Întrebarea a fost trimisă!");
                    document.querySelector("button.default-btn[type='submit']").disabled = true;
                    formSuccess();
                } else {
                    Object.keys(text).map((key)=>{
                        let val = text[key];

                        if (key!="msgSubmit")
                        {
                            //show 
                            document.querySelector("#"+key).parentElement.querySelector(".with-errors").innerHTML = `<ul class="list-unstyled"><li>${val}</li></ul>`;
                        }
                    })
                    formError();
                    submitMSG(false,text.msgSubmit);
                }
            },error: function(){
                notify.show_error("Eroare!","Te rugăm să încerci mai târziu!");
            }
        });
    }

    function formSuccess(){
        //$("#contactForm")[0].reset();
        submitMSG(true, "Cerere trimisă!")
    }

    function askSuccess(){
        //$("#askForm")[0].reset();
        submitMSG(true, "întrebarea a fost trimisă!")
    }

    function formError(){
        $("#contactForm").removeClass().addClass('shake animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
            $(this).removeClass();
        });
    }

    function askError(){
        $("#askForm").removeClass().addClass('shake animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
            $(this).removeClass();
        });
    }

    function submitMSG(valid, msg){
        if(valid){
            var msgClasses = "h4 text-center tada animated text-success";
        } else {
            var msgClasses = "h4 text-center text-danger";
        }
        $("#msgSubmit").removeClass().addClass(msgClasses).text(msg);
    }
}(jQuery)); // End of use strict