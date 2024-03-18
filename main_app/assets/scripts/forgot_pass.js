
var incr = 0;
function send_mail()
{
    $.ajax({
        url: '/send_reset_mail',
        type: 'POST',
        contentType: "application/json",
        data: JSON.stringify({"email": document.querySelector("#reset_mail").value}),
        success: function(data)
        {
            if (Object.keys(data).length==0)
            {
                //next step
                hide_all_errs();
                incr++;
                next_step(incr);
            }
            else{
                Object.keys(data).map(key=>{
                    console.log(data[key]);
                    if (data[key]!="")
                    show_err(key,data[key]);
                })
           
            }
      
        }
    })
}

function check_code()
{
    $.ajax({
        url: '/check_forgot',
        type: 'POST',
        contentType: "application/json",
        data: JSON.stringify({"code": document.querySelector("#code").value}),
        success: function(data)
        {
            if (Object.keys(data).length==0)
            {
                //next step
                hide_all_errs();
                incr++;
                next_step(incr);
            }
            else{
                Object.keys(data).map(key=>{
                    console.log(data[key]);
                    if (data[key]!="")
                    show_err(key,data[key]);
                })
           
            }
      
        }
    })  
}


function change_pass()
{

    $.ajax({
        url: '/change_pass_forgot',
        type: 'POST',
        contentType: "application/json",
        data: JSON.stringify({"pass": document.querySelector("#pass").value,"rep_pass": document.querySelector("#rep_pass").value}),
        success: function(data)
        {
            if (Object.keys(data).length==0)
            {
                //next step
                hide_all_errs();
                incr++;
                next_step(incr);
            }
            else{
                Object.keys(data).map(key=>{
                    console.log(data[key]);
                    if (data[key]!="")
                    show_err(key,data[key]);
                })
           
            }
      
        }
    })  
}


function next_step(incr)
{
    document.querySelector(".slide_view").style.left = `-${100*incr}%`;
}

function show_err(id,what)
{
    let elem = document.querySelector("#"+id); 
    if (elem){
    elem.classList.remove("invis");
    elem.classList.add("vis");
    elem.textContent = what;
    }
}


function hide_err(id)
{

}

function hide_all_errs()
{
    Array.from(document.querySelectorAll(".err")).forEach((elem)=>{
        elem.classList.add("invis");
        elem.classList.remove("vis");
    })
}