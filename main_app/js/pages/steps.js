

var form = $(".validation-wizard").show();

jQuery.validator.addMethod("phoneRO", function(phone_number, element) {
    phone_number = phone_number.replace(/\+40/g, "0");
    if (phone_number[0] == 0 && phone_number[1] == 0)
    phone_number = phone_number.slice(1,phone_number.length);
    return this.optional(element) || phone_number.length == 10 && 
    phone_number.match(/^07[0-9]{8}$/);
}, "Numarul nu este valid");


jQuery.validator.addMethod("email", function(email, element) {
    
    return this.optional(element) || email.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
}, "Adresa de email nu este valida");

jQuery.extend(jQuery.validator.messages, {
    required: "Completeaza acest field."
})

$(".validation-wizard").steps({
    headerTag: "h6"
    , bodyTag: "section"
    , transitionEffect: 1
    ,autoFocus: true
    , titleTemplate: '<span class="step">#index#</span> #title#'
    , labels: {
        finish: "Finalizare",
        next: "Urmatorul",
        previous: "Pasul precedent"
    }
    , onStepChanging: function (event, currentIndex, newIndex) {
        return currentIndex > newIndex || !(3 === newIndex && Number($("#age-2").val()) < 18) && (currentIndex < newIndex && (form.find(".body:eq(" + newIndex + ") label.error").remove(), form.find(".body:eq(" + newIndex + ") .error").removeClass("error")), form.validate().settings.ignore = ":disabled,:hidden", form.valid())
    }
    , onFinishing: function (event, currentIndex) {
        let ok = false;
        document.querySelectorAll("#avize  input").forEach(elem=>{
            if (elem.files.length != 0)
            ok = true;
        })

        if (!ok && document.querySelectorAll("#avize").length!=0){
          
            //show custom error
            notify.show_error("Eroare!","Te rugam sa adaugi cel putin un aviz!");
            return ok;
        }
        else{
         
            return true;
        }
        
    }
    , onFinished: function (event, currentIndex) {
        
        send_request();
    }
}), $(".validation-wizard").validate({
    ignore: "input[type=hidden]"
    , errorClass: "text-danger"
    , successClass: "text-success"
    , highlight: function (element, errorClass) {
        $(element).removeClass(errorClass)
    }
    , unhighlight: function (element, errorClass) {
        $(element).removeClass(errorClass)
    }
    , errorPlacement: function (error, element) {
        error.insertAfter(element)
    }
    , rules: {
        wemailAddress2: {
            email: true
        },
        wphoneNumber2: {
            phoneRO: true
        }
    }

})