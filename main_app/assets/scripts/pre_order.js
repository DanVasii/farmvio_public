
 var county_timeout,city_timeout,prod_price = 0;
init();

 $("#county").on("input",function(){
    if (county_timeout!=null){
        clearTimeout(county_timeout);
    }
    county_timeout = setTimeout(get_county("county_ac"),500);
})

$("#county_ac").on("click",".complete_item",function(){
    //set the clicked text to the input
    
    $("#county").val($(this).clone().children().remove().end().text());
    $("#county_ac").css({"opacity":"0","max-height":"0px"});
})
$("#county").on("focus",function(){
    if ($(this).val().trim()!="")
        get_county("county_ac");
})

$("#county").on("focusout",function(){
    $("#county_ac").css({"opacity":"0","max-height":"0px"});

})

$("#city").on("input",function(){
    if (city_timeout!=null){
        clearTimeout(city_timeout);
    }

    city_timeout = setTimeout(get_city("city_ac"),500);
})

$("#city_ac").on("click",".complete_item",function(){
    $("#city").val($(this).text());
    $("#city_ac").css({"opacity":"0","max-height":"0px"});
})


$("#city").on("focus",function(){
    if ($(this).val().trim()!="")
    get_city("city_ac");
})

$("#city").on("focusout",function(){
    
    $("#city_ac").css({"opacity":"0","max-height":"0px"});
})


function get_county(who){

    //get input from who 
    let input_id = who.replace("_ac","");
    $.ajax({
        url: "/search_county",
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({'search':$("#"+input_id+"").val()}),
        success: function(data){
     
            //remove the data inside
            let parent = document.getElementById(who);
            $("#"+who+" .complete_item").remove();
            //now populate 
            let item,sc;
            if (data!=null && data.length>0){
                let ac = document.querySelector("#county_ac");
                ac.style.opacity = 1;
                ac.style.maxHeight = "200px";
                for (let i = 0;i<data.length;i++){
                    item = document.createElement("div");
                    item.className = "complete_item";
                    
                    //append the short_code 
                    sc = document.createElement("span");
                    sc.className = "short_code bg-info";
                    sc.textContent = data[i].code.trim();
                    item.appendChild(sc);
                    item.appendChild(document.createTextNode(data[i].name))
                    parent.appendChild(item);
                }
            }
            else if (data.length==0 || data.length == undefined){
                item = document.createElement("div");
                item.className = "complete_item";
                item.textContent = "Nu au fost găsite rezultate";
                parent.appendChild(item);
            }
        }
    })
}

function get_city(who){
    let input_id = who.replace("_ac","");
    let county_id;
    if (input_id.startsWith("point"))
    {
        county_id = "point_county";
    }
    else{
        county_id = "county"
    }
    $.ajax({
        url: "/search_city",
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({"city":$("#"+input_id+"").val(),"county":$("#"+county_id+"").val()}),
        success: function(data){
            console.log(data);
            //first remove the previous 
            $("#"+who+" .complete_item").remove();
            let parent = document.getElementById(who);
            let item;
            //now add 
            if (data!=null && data.length>0){
                let ac = document.querySelector("#city_ac");
                ac.style.opacity = 1;
                ac.style.maxHeight = "200px";

                for (let i=0;i<data.length;i++){
                    if (data[i].upLocality)
                    {
                        //treat as group
                        for (let j=0;j<=data[i].list.length;j++)
                        {
                            item = document.createElement("div");
                            item.className = "complete_item";
                            item.textContent = data[i].list[j].localityName;
                            parent.appendChild(item);
                        }
                    }
                    else{
                 item = document.createElement("div");
                 item.className = "complete_item";
                 item.textContent = data[i].localityName;
                 parent.appendChild(item);
                    }


                }

            }
            else{
                item = document.createElement("div");
                item.className = "complete_item";
                item.textContent = "Nu au fost găsite rezultate";
                parent.appendChild(item);
            }
        }    
    })
}
    function init()
    {
        if (document.querySelectorAll(".pre_order_handler").length==0){
        let div = document.createElement("div");
        div.className = "pre_order_handler";
        div.innerHTML = `
        
        <div class='row  ms-1' style="max-width: calc(100% - 0.25rem);">
        <div class = 'col-12' style='text-align: end'>
        <i class="fas fa-times close" onclick = "hide_pre_order_form()"></i>
        </div>
            <h3 class='mt-5'>Adresa de livrare</h3>
            <div class="col-lg-6 col-md-12">
                <div class="input-group">
                    <div class="input-group-prepend">
                      <span class="input-group-text" id="basic-addon1">Județ / Sector</span>
                    </div>
                    <input type="text" class="form-control" id="county">
    
                  </div>
            
                  <div class="auto_complete" id="county_ac" style="opacity: 0; max-height: 0px;"></div>
                    <div class="custom_error" id="county_error"></div>
                </div>

                <div class="col-lg-6 col-md-12">
                    <div class="input-group">
                        <div class="input-group-prepend">
                          <span class="input-group-text" id="basic-addon1">Oraș</span>
                        </div>
                        <input type="text" class="form-control" id="city">
        
                      </div>
                
                      <div class="auto_complete" id="city_ac" style="opacity: 0; max-height: 0px;"></div>
                        <div class="custom_error" id="city_error"></div>
                    </div>
                    <div class = 'col-12'>
                        <input type = 'text' style='width: 100%;font-size: 16px; padding-top: 3px;padding-bottom: 3px;' id = 'extra_del' placeholder="Strada, numar, bloc..."/>
                    </div>
                    <div class = 'col-auto'>
                    <button class = 'special2 mt-3' onclick="get_reservation_dates()">Valideaza adresa</button>
                </div>
                    <h3 class='mt-3'>Detalii de livrare</h3>
                    <div class="col-12">
                        <div class="warning-msg">
                            <i class="fa fa-warning" aria-hidden="true"></i>
                            Selecteaza data cand vrei ca produsul sa ajunga la tine.
                        </div>
                        <!-- here goes the dates  -->
                        <select id = 'del_dates'>
                            <option>Te rugam sa validezi adresa</option>
                        </select>
                        <p class = 'err' id = 'dates_err'>

                        </p>
                        </div>
                        <div class = 'col-12 hidden_valid mt-3'>
                            Cantitate: 
                            <div class="input-counter">
                                <span class="minus-btn">
                                    <i class="fas fa-minus" aria-hidden="true"></i>
                                </span>

                                <input type="text" min="1" value="1" id="qty_res" onchange="update_price_res()">
                                <span class="plus-btn">
                                    <i class="fas fa-plus" aria-hidden="true"></i>
                                </span>
                            </div>
                        </div>
                        <div class ='col-12 hidden_valid mt-3'>
                            Pretul de transport este de: <span id = 'pre_order_trans_price'></span>
                        </div>  
                        <div class ='col-12 hidden_valid'>
                            Pretul produsului este de: <span id = 'pre_order_prod_price'></span>
                        </div>  
                        <div class = 'col-12 mt-3' style='text-align: center'>
                            <button class = 'special2' id='res_send' onclick="send_reservation()">Trimite rezervarea </button>
                        </div>
            </div>
   
        `;
        document.querySelector("body").appendChild(div);

        try{    
            $("#del_dates").niceSelect();
        }   
        catch{

        }
        }
    }
    
    function is_user_logged()
    {
        return new Promise((res,rej)=>{
            $.ajax({
                url: "/user_logged",
                type: "POST",
                contentType: "application/json",
                success: function (data)
                {
                    console.log(data);
                    if (data && data.ok)
                    {
                        res();
                    }
                    else{
                        rej();
                    }
                }
            })
        })

    }

    function hide_pre_order_form()
    {
        document.querySelector(".filters_bg").style.display = 'none';
        document.querySelector(".pre_order_handler").style.display = "none";
    }
    function show_pre_order_form(prod_id=null)
    {
        is_user_logged().then(()=>{
            if (prod_id!=null)
            document.querySelector(".pre_order_handler .special2").onclick = function()
            {
                get_reservation_dates(prod_id);
            } 
            document.querySelector("#res_send").onclick = function(){
                send_reservation(prod_id);
            }
    
            document.querySelector(".filters_bg").style.display = 'block';
            document.querySelector(".pre_order_handler").style.display = "block";
        }).catch(()=>{
            notify.show_error("Eroare!","Trebuie să fii logat pentru a trimite pre-comenzi!")
        })
    
    }


    function refresh_reservation()
    {
        Array.from(document.querySelectorAll(".pre_order_handler .hidden_valid")).forEach((elem)=>{
            elem.style.display = "none";
        })

        Array.from(document.querySelectorAll(".pre_order_handler input")).forEach((elem)=>{
            if (elem.type!="numeric")
            elem.value = "";
            else 
            elem.value = 1;
        })

        Array.from(document.querySelectorAll("#del_dates option")).forEach((elem)=>{
            elem.remove();
        })
        let option = document.createElement("option");
        option.textContent = "Te rugam sa validezi adresa";

        document.querySelector("#del_dates").appendChild(option);
        $("#del_dates").niceSelect("update")
    }


 function get_reservation_dates(prod_id = null)
 {
     if (prod_id==null)
            prod_id = document.querySelector("#prod_id").value;
     $.ajax({
         url: "/get_reservation_dates",
         type: "POST",
         contentType: "application/json",
         data: JSON.stringify({"prod_id": prod_id,"judet":document.querySelector("#county").value,"loc":document.querySelector("#city").value,"adresa": document.querySelector("#extra_del").value}),
         success: function(data){
             console.log(data);
            if (data.length!=0)
            {
               
                document.querySelector("#dates_err").textContent = "";
                document.querySelector("#dates_err").style.maxHeight = "0px";
                Array.from(document.querySelectorAll("#del_dates option")).forEach((elem)=>{
                    elem.remove();
                })
                data.map((date)=>{
                    if (date.err)
                    {
                        document.querySelector("#dates_err").textContent = date.err;
                        document.querySelector("#dates_err").style.maxHeight = "100px";
                    }
                    else{
                        //add the date 
                        let option = document.createElement("option");
                        option.textContent = date.date;
                        option.value = date.id;
                        if (date.disabled)
                        option.disabled = true;
                        document.querySelector("#del_dates").appendChild(option);
                    }
                })
                if (document.querySelector("#dates_err").textContent.trim()=="")
                get_reservation_price(prod_id);
                $("#del_dates").niceSelect("update")

            }
            else{
                //show error 
            }
         }
     })
 }

function get_reservation_price(prod_id=null)
{
    if (prod_id==null)
        prod_id = document.querySelector("#prod_id").value;
    get_prod_price(prod_id)
    $.ajax({
        url: "/get_reservation_price",
        type: "POST",
        contentType:"application/json",
        data: JSON.stringify({"prod_id": prod_id,"judet":document.querySelector("#county").value}),
        success: function(data)
        {
            if (data.price)
            {
                Array.from(document.querySelectorAll(".hidden_valid")).forEach(elem=>{elem.style.display = "initial"});
                document.querySelector("#pre_order_trans_price").textContent = data.price+ " RON";
            }
        }
    })
}

function get_prod_price(prod_id = null)
{
    if (prod_id==null)
    prod_id = document.querySelector("#prod_id").value;
    $.ajax({
        url: "/get_prod_price",
        type: "POST",
        contentType:"application/json",
        data: JSON.stringify({"prod_id": prod_id}),
        success: function(data)
        {
            if (data.price)
            {
                prod_price = data.price;
                document.querySelector("#pre_order_prod_price").textContent = parseInt(prod_price) + " RON";

            }
        }
    })
}

function update_price_res()
{
    let qty = document.querySelector("#qty_res").value || 1;

    document.querySelector("#pre_order_prod_price").textContent = parseInt(qty)*parseInt(prod_price) + " RON";
}

function send_reservation(prod_id = null)
{
    if (prod_id==null)
    prod_id = document.querySelector("#prod_id").value;
    let data = {};
    data.judet = document.querySelector("#county").value;
    data.loc = document.querySelector("#city").value;
    data.adresa = document.querySelector("#extra_del").value;

    data.prod_id = prod_id;

    data.selected_date = $("#del_dates").val();
    data.qty = document.querySelector("#qty_res").value || 1;

    $.ajax({
        url: "/send_reservation",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function(data, textStatus, xhr){
            console.log(xhr.status);
            notify.show_success("Succes!","Pre-comanda a fost trimisa!");
            refresh_reservation();
            hide_pre_order_form();
            setTimeout(function(){
                window.location.href = '/my_reservations';
            },3000);
        },error: function()
        {
            notify.show_error("Eroare!","Pre-comanda nu a fost trimisa!");

        }
    })
}