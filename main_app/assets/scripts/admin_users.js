
var sel_user = -1;
$(document).ready(function(){
    $("table").on("click",".edit_user",function(elem){
        let tr = elem.currentTarget.parentElement.parentElement;
        let user_id = tr.querySelector("td:first-child").textContent;
        
        open_prod_searcher(user_id);
    })

    $("table").on("click",".add_prom",function(elem){
        let tr = elem.currentTarget.parentElement.parentElement;
        let user_id = tr.querySelector("td:first-child").textContent;
            
        add_prom(user_id,this.parentElement);
    })


    $("table").on("click",".del_prom",function(elem){
        let tr = elem.currentTarget.parentElement.parentElement;
        let user_id = tr.querySelector("td:first-child").textContent;
        
        remove_prom(user_id,this.parentElement);
    })

    $(".product_searcher button").on("click",function(){
            change_data2()
    })
})

function change_data2(){
    let data = {};
    document.querySelectorAll(".product_searcher ul li input").forEach(elem=>{
        data[elem.id] = elem.value;

    })

    $.ajax({
        url: "/admin_change_user_data",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"user_id":sel_user,"infos":data}),
        success: function(data){
            console.log(data);
        }
    })
}
function clear()
{
    document.querySelectorAll(".product_searcher ul li").forEach(element => {
            element.remove();
    }); 
}
function open_prod_searcher(user_id)
{
   clear();
    document.querySelector(".product_searcher").style.transform = "scale(1)";
    document.querySelector(".product_searcher_bg").style.visibility = "visible";
    document.querySelector(".product_searcher_bg").style.opacity = "1";
    sel_user = user_id;
    get_infos(user_id);
}

function exit_product_searcher()
{
    sel_user = -1;
    
    document.querySelector(".product_searcher").style.transform = "scale(0)";
    document.querySelector(".product_searcher_bg").style.visibility = "hidden";
    document.querySelector(".product_searcher_bg").style.opacity = "0";
   
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }


function get_infos(user_id){
    $.ajax({
        url: "/admin_get_user_infos",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"user_id":user_id}),
        success: function(data){
            console.log(data);
            if (data){
                document.querySelector(".product_searcher h3").innerHTML = `Detalii despre <i>${data.real_name}</i>`;

                switch(data.infos[0].account_type){
                    case 0:
                        document.querySelector(".product_searcher h2").textContent = "Cont utilizator";
                        break;
                    case 1:
                        document.querySelector(".product_searcher h2").textContent = "Cont fermier";
                        break;
                    case 2:
                        document.querySelector(".product_searcher h2").textContent = "Cont b2b";
                        break;
                }
            }
            //set schimba_date function 
            
            let li,div,div2,after,text,input;
            Object.keys(data.infos[0]).map(key=>{
                if (key!="account_type" && key!="email_ver" && key!="phone_ver")
                {
                    let words = key.split("_");
                    //add 
                    li = document.createElement("li");

                    div = document.createElement("div");
                    div.className = "input-group mb-2";

                    div2 = document.createElement("div");
                    div2.className = "input-group-text";
                    text = document.createTextNode(capitalizeFirstLetter(words[0])+ " "+(words[1] || ""));
                    div2.appendChild(text);

                    div.appendChild(div2);



                    input = document.createElement("input");
                    input.className = "form-control";
                    input.type = "text";
                    input.value = data.infos[0][key];
                    input.id = key;
                    div.appendChild(input);

                    if (key == "email")
                    {
                        //add email_ver
                        after = document.createElement("div");
                        after.className = (parseInt(data.infos[0].email_ver) == 0) ? "input-group-text bg-danger" : "input-group-text bg-success";

                        after.innerHTML = (parseInt(data.infos[0].email_ver) == 0) ? "Neverificat " : "Verificat";
                        div.appendChild(after);
                    }
                   else if (key == "phone_number")
                    {
                        //add email_ver
                        after = document.createElement("div");
                        after.className = (parseInt(data.infos[0].phone_ver) == 0) ? "input-group-text bg-danger" : "input-group-text bg-success";

                        after.innerHTML = (parseInt(data.infos[0].phone_ver) == 0) ? "Neverificat " : "Verificat";
                        div.appendChild(after);
                    }

                    li.appendChild(div);

                    document.querySelector(".product_searcher ul").appendChild(li);
                }
            })
        }
    })
}


function add_prom(user_id,parent)
{
    $.ajax({
        url: "/admin_prom",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"user_id":user_id}),
        success: function ()
        {
            //update now 

            //remoeve current 
            parent.querySelector("button").remove();
            //create the brn 
            let button  = document.createElement("button");
            button.type = "button";
            button.className = "waves-effect waves-light btn btn-danger-light mb-5 del_prom";
            button.textContent = "Sterge promovarea";
            parent.appendChild(button);
        },error: function()
        {
            alert("Eroare!");
        }
    })
}


function remove_prom(user_id,parent)
{
    $.ajax({
        url: "/admin_del_prom",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"user_id":user_id}),
        success: function ()
        {
            //update now 

            //remoeve current 
            parent.querySelector("button").remove();
            //create the brn 
            let button  = document.createElement("button");
            button.type = "button";
            button.className = "waves-effect waves-light btn btn-success-light mb-5 add_prom";
            button.textContent = "Promoveaza";
            parent.appendChild(button);

        },error: function()
        {
            alert("Eroare!");
        }
    })
}