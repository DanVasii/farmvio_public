var incr = 0;
var labels = {
    "username":"Nume utilizator",
    "tel":"Număr de telefon",
    "cui":"CUI",
    "nume_firma":"Nume firma"
}

var diff_ids = {
    "tel": "phone_number",
    "email":"mail",
    "nume":"real_name"
}
$(function(){

})

function parse_data()
{
    let sc = document.querySelector("#sc").value;
    let sic = document.querySelector("#sic").value;
    let conf_email = document.querySelector("#conf_mail").value;

    $.ajax({
        url: "/parse_register_data",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"sc":sc,"sic":sic,"conf":conf_email}),
        success: function(data){
            document.querySelector("#conf_mail_err").classList.remove("vis");
            document.querySelector("#conf_mail_err").classList.add("invis");

            if (data.conf_mail_err)
            {
                document.querySelector("#conf_mail_err").textContent = data.conf_mail_err;
                document.querySelector("#conf_mail_err").classList.remove("invis");
                document.querySelector("#conf_mail_err").classList.add("vis");
            }
            else{
                //next
                incr++;
                next_step(incr);
                let frag = document.createDocumentFragment(),temp;
                //populate 
                Object.keys(data).map((key)=>{
                    if (data[key]!=null){
                    temp = document.querySelector("#field_row").content.cloneNode(true);

                    temp.querySelector("input").value = data[key];
                    temp.querySelector("input").id = key;
                    temp.querySelector("label").for = key;
                    temp.querySelector("label").textContent = create_label(key);

                    temp.querySelector("p").id = (diff_ids[key] ? diff_ids[key] : key) +"_error";
                    frag.appendChild(temp);
                    }
                })

                document.querySelector("#data_row").appendChild(frag);
            
            }

        }
    })
}


function create_label(key)
{
    if (labels[key])
    {
        return labels[key];
    }
    else{
        return key.substring(0,1).toUpperCase() + key.substring(1,key.length);
    }
}



function set_pass()
{
    let send_data = {};

    send_data.sc = document.querySelector("#sc").value;
    send_data.sic = document.querySelector("#sic").value;

    send_data["nume_firma"] = document.querySelector("#nume_firma").value;
    send_data["cui"] = document.querySelector("#cui").value;
    send_data["addr"] = document.querySelector("#adresa").value;
    send_data["oras"] = document.querySelector("#oras").value;
    send_data["judet"] = document.querySelector("#judet").value;
    send_data["mail"] = document.querySelector("#email").value;
    send_data["phone_number"] = document.querySelector("#tel").value;
    send_data["real_name"] = document.querySelector("#nume").value;
    send_data["username"] = document.querySelector("#username").value;

    //refresh the errors 
    Array.from(document.querySelectorAll(".login-form[data-index='1'] .err")).forEach((p)=>{
        p.classList.remove('vis');
        p.classList.add('invis');
    })

    $.ajax({
            url: "/validate_register_data",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(send_data),
            success: function(data)
            {
                console.log(data);
                console.log(data.length);
               if (Object.keys(data).length==0)
               {
                   //ok
                   incr++;
                   next_step(incr);
               }
               else{
                   data.map((item)=>{
                       console.log(item);
                       let p = document.querySelector("#"+item.field+"_error");
                       if (p){
                       p.classList.remove("invis");
                       p.classList.add("vis");
                       p.textContent = item.err;
                       }
                   })

                   if (data.main_err)
                   {
                        //chaneg to notify 
                        alert(data.main_err);
                   }
               }
            }
        })    
}

function send_pass()
{
    let pass = document.querySelector("#pass").value;
    let rep_pass = document.querySelector("#rep_pass").value;

    document.querySelector("#pass_err").classList.remove("vis");
    document.querySelector("#pass_err").classList.add("invis");
            
    $.ajax({
        url: "/assign_account",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({pass,rep_pass}),
        success: function(data)
        {
            if (Object.keys(data).length==0)
            {
                incr++;
                next_step(incr);
                //redirect 
                setTimeout(()=>{
                    location.href = '/login';
                },6000);
            }
            else{
                document.querySelector("#pass_err").classList.remove("invis");
                document.querySelector("#pass_err").classList.add("vis");

                document.querySelector("#pass_err").textContent = data.err;

            }
        }
    })

}



function next_step(incr)
{
    //make the prev invis
    let prev_slide = document.querySelector(".login-form[data-index='"+((incr-1) || 0)+"']");
    //set the height 
    prev_slide.style.height = prev_slide.offsetHeight+'px';
    setTimeout(()=>{
        
        prev_slide ? prev_slide.style.height = `0px` : '';
        document.querySelector(".slide_view").style.left = `-${100*incr}%`;
        fit_to_view();
    },0)
}

function show_pass(id,parent)
{
    console.log(this);
    let input = document.querySelector("#"+id);
    if (input)
    {
        if ( input.type == "text")
            {
                input.type = 'password';
                parent.querySelector("i").className = "fas fa-eye-slash";
                
            }
            else{
                input.type = "text";
                parent.querySelector("i").className = "fas fa-eye";
            }
    }
    
}

function fit_to_view()
{
    let offTop = document.querySelector(".main_slider").offsetTop;
    window.scrollTo(0,offTop-150);
    
}

