
var file_handler = [],counter = 0;
var checked = [],names = [];
var work_timeout = null;
var notify;
var chosen_points = [];


$(document).ready(function(){

    notify = new Notify();
    get_proforme();
    $("input[name='sell_group']").on("change",function(){
        if ((this.id == "sel_2" && this.checked) || (this.id == "sel_3" && this.checked))
        {
            //show 
            document.querySelector("#reservation_form").style.display = "block";
        }
        else{
            //hide 
            document.querySelector("#reservation_form").style.display = "none";
        }
    })

    $("input[name='group4']").on("change",function(){
        if (this.id == "radio_12" && this.checked)
        {
            //hide 
            document.querySelector("#del_types").style.display = "none";
        }
        else{
            //show 
            document.querySelector("#del_types").style.display = "flex";
        }
    })

    $( ".upload_area" ).sortable();
    $( ".upload_area" ).disableSelection();
    $( ".upload_area" ).sortable("disable");
        //first init the chosen_poitns 
        let id = location.pathname.split("/");

        if(id.length!=0){
       
            if (!isNaN(id[2])){
                checked.push(parseInt(id[2]));
            }
        }

        populate_cats();
        populate_workp();

        
        $("#unit_sel").on("change",function(){
            if (document.getElementById("unit_sel").value == 'b')
            {
                //show the unit wirght 
                document.getElementById("unit_weight").style = "display: flex";
            }
            else{
                document.getElementById("unit_weight").style = "display: none";
            }
        })
        $(".wpoints").on("change","input",function(){
            if ($(this).prop("checked") )
            {
                if (!checked.includes(parseInt($(this).attr("id"))))
                checked.push(parseInt($(this).attr("id")));
                names.push($(this).parent().find(".point_name").text());
            }
            else{
                //remove the id 
                let i,id = $(this).attr("id");
                for (i=0;i<checked.length;i++){
                    if (checked[i] == id)
                    {
                       checked.splice(i,1);
                       names.splice(i,1);
                        break;
                    }
                }
            }
            update_chosen();
        })

  //file delete script 
  $(".uploaded_images").on("click","i",function(){
    //get the index
    //now find this index in file_handler  and remove 
    let aux_file = [];
    let delete_id = this.parentElement.dataset.index;
    file_handler.forEach(function(obj){
     //   console.log(obj);
        if (obj.id!=delete_id){
            //this is clean we can add it 
            aux_file.push(obj);
        }
    })
    file_handler = aux_file;
    //delete the preview 
    this.parentElement.remove();
  //  console.log(file_handler);
})

//file preview script 
$("#file_upload").on("change",function(){
    if (this.files){  
        //make the request 
        //create the form data 
        let formData = new FormData();

        let files = document.getElementById("file_upload").files;
        for (index in files){
            formData.append("prodImages",files[index]);
        }

        $.ajax({
            url: "/upload_preview_prod_image",
            type: "POST",
            contentType: false,
            cache: false,
            processData: false,
            data: formData,
            success: function(data){
                if (data.length!=0){
                    //now we can reset the input element 
                    document.getElementById("file_upload").value = "";
                    for (index in data){
                        let image_holder,image,i;
                            //now add the images 
                            image_holder = document.createElement("div");
                            image_holder.className = 'prod_img';
                            image_holder.dataset.index = counter;
                            image = document.createElement("img");
                            image.src = "/previews/"+data[index];

                            let path = data[index];

                            i = document.createElement("i");
                            i.className = "fas fa-times-circle";

                            i.onclick = function(){
                                remove_preview_image(path);
                            }
                            image_holder.appendChild(image);
                            image_holder.appendChild(i);

                            //now add this to the uploaded_images 
                            document.getElementsByClassName("upload_area")[0].appendChild(image_holder);
                    }
                }
            }

        })
  
    }  
})

    //search workp
            $("#search_wpoint").on("input",function(){
                console.log("ok")
                //send the search after 500ms
                if (work_timeout!=null){
                    clearTimeout(work_timeout);
                }
                    work_timeout = setTimeout(function(){
                        search_work($("#search_wpoint").val());
                    },500);
                
            })


})


function remove_preview_image(path){
    $.ajax({
        url: "/remove_preview_prod_image",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"path":path}),
        success: function(data){
            if (data=="OK"){
                //remove the image from the preview 
               Array.from(document.querySelectorAll(".upload_area img")).forEach(elem=>{
                   console.log(elem.src);
                   if (elem.src.includes("/previews/"+path))
                   {
                       elem.parentElement.remove();
                   }
               })
            }
        }
    })
}


function update_chosen(){

    //now we should update the chose points div 
    let parent = document.getElementById("chosen_tags");
    let frag = document.createDocumentFragment();

    Array.from(document.getElementsByClassName("chosen_tag")).forEach(elem=>{
        elem.remove();
    })
    let div,i;
    for (index in names){
        div = document.createElement("div");
        div.className = "chosen_tag bg-gradient-primary";
        div.textContent = names[index];
        div.dataset.wpid = checked[index];

        i = document.createElement("i");
        i.className = "fas fa-close";
        let id = index;
        i.onclick = function(){
            remove_index(id);
        }
        div.appendChild(i);
        frag.appendChild(div);
    }
    parent.appendChild(frag);
    update_stock();
}



function search_work(what){ 
    
    $.ajax({
        url: "/search_workp",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"user_in":what}),
        success: function(data){
            console.log(data);
           
            if (data.length!=0){
            
                //remove prev 
                Array.from(document.getElementsByClassName("wpoint")).forEach(function(elem){
                    elem.remove();
                })

                let parent,frag,wpoint,input,label,span,p;
                parent = document.getElementsByClassName("wpoints")[0];
                frag = document.createDocumentFragment();
                let dataobj;
                for (index in data)
                {
                    dataobj = data[index];

                    //create the main 
                    wpoint = document.createElement("div");
                    wpoint.className = "wpoint";

                    //create the input 
                    //check if this was checked 
                    input = document.createElement("input");
                    input.type = "checkbox";
                    input.className = "filled-in chk-col-success";
                    input.id = dataobj.id;
                    if (checked.includes(dataobj.id))
                    input.checked = true;

                    
                    wpoint.appendChild(input);

                    //create te label 
                    label = document.createElement("label");
                    label.setAttribute("for",dataobj.id);

                    //create the span 
                    span = document.createElement("span");
                    span.textContent = dataobj.point_name;
                    span.className = "point_name";

                    //create the address p
                    p = document.createElement("p");
                    p.textContent = dataobj.judet+", "+dataobj.oras+", "+dataobj.adresa;
                    label.appendChild(span);
                    label.appendChild(p);

                    wpoint.appendChild(label);

                    frag.appendChild(wpoint);
                }
                parent.appendChild(frag);
            }
            else{
                //no results 
                Array.from(document.getElementsByClassName("point")).forEach(function(elem){
                    elem.remove();
                })
                let p = document.createElement("p");
                p.className = "point";
                p.textContent = "No results for your search!";
                document.getElementById("workp_ac").appendChild(p);
            }
        } 
    })
}


function populate_workp(){
    return $.ajax({
        url: "/get_workp",
        type: "POST",
        contentType: "application/json",
        success: function (data){
            //remove all anyways 
            console.log(data);
            Array.from(document.getElementsByClassName("wpoint")).forEach(elem=>{
                elem.remove();
            })
            if (data.length!=0){
                //start showing the data 
                let parent,frag,wpoint,input,label,span,p;
                parent = document.getElementsByClassName("wpoints")[0];
                frag = document.createDocumentFragment();
                let dataobj;
                for (index in data)
                {
                    dataobj = data[index];

                    //create the main 
                    wpoint = document.createElement("div");
                    wpoint.className = "wpoint";

                    //create the input 
                    input = document.createElement("input");
                    input.type = "checkbox";
                    input.className = "filled-in chk-col-success";
                    input.id = dataobj.id;
                   
                    
                    wpoint.appendChild(input);

                    //create te label 
                    label = document.createElement("label");
                    label.setAttribute("for",dataobj.id);

                    //create the span 
                    span = document.createElement("span");
                    span.textContent = dataobj.point_name;
                    span.className = "point_name";

                    //create the address p
                    p = document.createElement("p");
                    p.textContent = dataobj.judet+", "+dataobj.oras+", "+dataobj.adresa;
                    label.appendChild(span);
                    label.appendChild(p);

                    wpoint.appendChild(label);

                    frag.appendChild(wpoint);
                }
                parent.appendChild(frag);

                //now we can check 
                if (checked.length!=0)
                document.querySelector("input[id='"+checked[0]+"']").click()
            }
        }
    })
}


function populate_cats(){
    return $.ajax({
        url:"/get_cats_all",
        type: "POST",
        contentType: "application/json",
        success: function(data){
            console.log(data);
            if (data.length!=0){
                let parent = document.getElementById("cat_sel");
                let option;
                for (index in data ){
                    option = document.createElement("option");
                    option.value = data[index].categorie;
                    option.dataset.sid = data[index].id;
                    option.textContent = data[index].categorie;
                    parent.appendChild(option);
                }
                $("£cat_sel").select2();
            }
        }
    })
}
function remove_index(id){
    names.splice(id,1);
    $("#"+checked[id]).prop("checked",false);
    checked.splice(id,1);
    update_chosen();
}
function toggle(){
    //unfocus 
    $("#order").blur();
    var disabled = $(".upload_area").sortable( "option", "disabled" );
    if (disabled){
    $(".upload_area").sortable("enable");
    $("#order").text("Save this order");
}
else{
    //now we can upload the current order 
    $(".upload_area").sortable("disable");
    $("#order").text("Reorder images");
}
}

function get_trans_type()
{
    let inputs = document.querySelectorAll("input[name='group5']"),i;

    for (i=0;i<inputs.length;i++){
        if (inputs[i].checked)
        {
            return inputs[i].dataset.type;
        }
    }
    return 4;
}

function get_reservation()
{
    //document.querySelector("#sel_3").checked ||
    return  document.querySelector("#sel_2").checked;
}
function get_sel_type()
{
    // if (document.querySelector("#sel_3").checked)
    // return 3;
    if (document.querySelector("#sel_2").checked)
    return 2;
    else 
    return 1;
}
function send_prod(){
    //prepare the data 
    let data = {};
    let months = document.querySelectorAll(".month_picker");
    
    data.start_month = (months[0].dataset.month_id > months[1].dataset.month_id) ? months[1].dataset.month_id :months[0].dataset.month_id ;
    data.end_month = (months[0].dataset.month_id < months[1].dataset.month_id) ? months[1].dataset.month_id :months[0].dataset  .month_id ;

    data.prod_name = document.getElementById("prod_name").value;
    data.prod_title = document.getElementById("prod_title").value;
    data.desc = document.getElementsByTagName("textarea")[0].value;

    data.wpoints = checked;
    data.categorie = document.getElementById("cat_sel").value;

    data.price_per_kg = document.querySelector("#price_per_kg").value;

    data.neperisabil =  document.querySelector("#radio_12").checked;
    data.perisabil = document.querySelector("#radio_13").checked;

    //trans type 
    data.sel_type = get_sel_type();
    data.reservation = get_reservation();
    if (data.reservation)
    {
        //get reservation detauls 
        data.reservation_data = {};
        //get start data 
        data.reservation_data.start_date = $("#calendar_start").datepicker("getFormattedDate");
        //get end date 
        data.reservation_data.end_date = $("#calendar_end").datepicker("getFormattedDate");

        data.reservation_data.del_dates= [];
        //now get delivery dates 
        Array.from(document.querySelectorAll(".when_data")).forEach((elem,index)=>{
          data.reservation_data.del_dates.push($(".calendar_area").eq(index).datepicker("getFormattedDate"));
        })
        

        //now get conditions for delivery 

        data.reservation_data.del_conds = [];

        Array.from(document.querySelectorAll(".del_cond ")).forEach((elem)=>{
            if (elem.dataset.type == 1)
            {
                //add type 1 
                let cond_data = $(elem.querySelector(".select_judete")).val();

                data.reservation_data.del_conds.push({
                    "type": 1,
                    "cond_data": cond_data
                });
            }
            else if (elem.dataset.type==2)
            {
                data.reservation_data.del_conds.push({
                    "type": 2,
                    "days_value": elem.querySelector("input[type='number']").value,
                    "time_value": $(elem.querySelector(".timepicker")).val()
                });
            }
        })

    //now get price_conds 
    data.reservation_data.price_cases = [];

    Array.from(document.querySelectorAll(".price_case")).forEach((elem)=>{
        data.reservation_data.price_cases.push({
            type: 1,
            price: elem.querySelector("input[type='number']").value,
            values: $(elem.querySelector(".select_judete_price")).val()
        });
    })
    data.proforma = document.querySelector("input[name='proforma_selected']:checked")?.id;
    data.need_pay = document.querySelector("#need_pay").checked ? 1 : 0;
    }

 

    data.trans_type = get_trans_type();

    data.price = document.getElementById("price").value;
    data.unit = document.getElementById('unit_sel').value;
    //add the images order 
    let order_aux = [];
    Array.from(document.querySelectorAll(".prod_img img")).forEach(elem=>{
        //get the file_name
        order_aux.push(elem.src.split("previews")[1]); 
    })

    data.image_order = order_aux;

    let stock_data = {};
    //build the stocks 
    Array.from(document.querySelectorAll(".point_stock")).forEach(elem=>{
        let wpid = elem.dataset.wpid;
        //check which input is checked
        let first_opt = elem.querySelector("#point_"+wpid);

        if (first_opt.checked){
            stock_data[wpid] = -1;
        }
        else{

            stock_data[wpid] = elem.querySelector("input[type='number']").value ? elem.querySelector("input[type='number']").value : 0;
        }
    })



    data.stocks = stock_data;
    data.unit_weight = document.getElementById("unit_weight_input").value;
    console.log(data);
    //now send 
    $.ajax({
        url: "/add_prod",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function(data){
            console.log(data);
            //first we delete all errors 
            Array.from(document.querySelectorAll(".custom_error")).forEach(elem=>{
                elem.style.maxHeight = "0px";
            })
            if (data == "OK" || data.redirect)
            {
                if (data.redirect)
                {
                    window.location.href = '/dashboard#farm_pics';
                }
                else{
                Array.from(document.querySelectorAll(".content .row")).forEach(elem=>{
                    elem.remove();
                })
                document.querySelector(".cover").style.display = "flex";
                document.querySelector("#ins_data").disabled = true;
            }
            }
            else{
                if (data.main_err)
                {
                    notify.show_error("Server error!",data.main_err)
                }
                //now we show all the errors
                
                for(key in data){
                    document.querySelector("#"+key+"_error").innerText = data[key];
                    document.querySelector("#"+key+"_error").style.maxHeight = "160px";
                }
            }
        }
    })
}




function update_stock(){
    //remove previous elems
    let aux = [];
    Array.from(document.getElementsByClassName("point_stock")).forEach(elem=>{
        if (!checked.includes(elem.dataset.wpid)){
            //its nok
            elem.remove();
        }
        else{
            //it has this, then add to aux
            aux.push(elem.dataset.wpid);
        }

    })
    let div,parent,frag,p,input,label,numeric,select,option;
    parent = document.getElementById("stocks");
    frag = document.createDocumentFragment();
    //add new ones 
    for (index in checked){
        if (!aux.includes(checked[index]))
        {
            //add
            div = document.createElement("div");
            div.className = "point_stock bg-primary-light pt-3 pb-3 mt-3";        
            div.dataset.wpid = checked[index];

            p = document.createElement("p");
            p.textContent = names[index];
            div.appendChild(p);
            
            input = document.createElement("input");
            input.name = "stock_opt_"+checked[index];
            input.type = "radio";
            input.className = "radio-col-success";
            input.id = "point_"+checked[index];
            input.checked = true;
            //create the label 
            label = document.createElement("label");
            label.setAttribute("for","point_"+checked[index]);
            label.textContent = "Nelimitat/Nu știu";

            div.appendChild(input);
            div.appendChild(label);
            div.appendChild(document.createElement("br"));

            input = document.createElement("input");
            input.name = "stock_opt_"+checked[index];
            input.type = "radio";
            input.className = "radio-col-success";
            input.id = "f_point_"+checked[index];

            //create the label 
            label = document.createElement("label");
            label.setAttribute("for","f_point_"+checked[index]);
            numeric = document.createElement("input");
            numeric.type = "number";
            label.appendChild(numeric);

            //append the select unit 
            select = document.createElement("select");
            select.className = "form-select";
            select.style = "display: inline;width: auto"
            option = document.createElement("option");
            option.value = "KG";
            option.textContent = "Kilograme";
            select.appendChild(option);

            option = document.createElement("option");
            option.value = "litri";
            option.textContent = "Litri";
            select.appendChild(option);

            option = document.createElement("option");
            option.value = "b";
            option.textContent = "Bucăți";
            select.appendChild(option);

            label.appendChild(select);

            div.appendChild(input);
            div.appendChild(label);

            frag.appendChild(div);
        }
    }
    parent.appendChild(frag);

}


function add_delivery_date()
{
    let temp = document.querySelector("#cal_when").content.cloneNode(true);
    

    document.querySelector("#reservation_delivery_dates").appendChild(temp);
    $(".calendar_area").datepicker({"language":"ro"});
}

function add_int_data()
{
    let temp = document.querySelector("#int_when").content.cloneNode(true);
    
    document.querySelector("#reservation_delivery_dates").appendChild(temp);
}

function get_judete()
{
    $.ajax({
        url: "/get_all_judete",
        type: "POST",
        contentType: "application/json",
        success: function (data)
        {
            if (data.length!=0)
            {
                let temp = document.querySelector("#del_cond").content.cloneNode(true);             
                document.querySelector("#conds").appendChild(temp);

                $(".select_judete").select2({
                    data: data,
                    tags: false,
                    maximumInputLength: 25,
                    placeholder: "Select or type keywords",
                    
                });
            }
        }
    })
}

function get_judete_price()
{
    $.ajax({
        url: "/get_all_judete",
        type: "POST",
        contentType: "application/json",
        success: function (data)
        {
            if (data.length!=0)
            {
                let temp = document.querySelector("#del_price_case").content.cloneNode(true);   
                let sel2 = temp.querySelector(".select_judete_price");          
                document.querySelector("#price_conds").appendChild(temp);

                $(sel2).select2({
                    data: data,
                    tags: false,
                    maximumInputLength: 25,
                    placeholder: "Select or type keywords",
                    
                });
            }
        }
    })
}


function add_cond(type)
{
    switch(type)
    {
        case 1:
            get_judete();
        break;
        case 2: 
            let temp = document.querySelector("#del_cond_date").content.cloneNode(true);
            document.querySelector("#conds").appendChild(temp);
            $(".timepicker").timepicker({
            
              template: "dropdown",
              showMeridian: false,
              icons: {
                  up: 'fas fa-chevron-up',
                  down: "fas fa-chevron-up"
              }
            });
        break;
    }
}

function add_price_cond(type)
{
    switch(type){
        case 1:
            get_judete_price();
        break;
    }
}


function get_proforme()
{
    $.ajax({
        url: "/get_proforme",
        type: "POST",
        contentType: "application/json",
        success: function(data)
        {
            if (data.length!=0)
            {
                data.map((prof)=>{
                    let temp = document.querySelector("#proforma_temp").content.cloneNode(true);
                    let spans = temp.querySelectorAll("span");

                    spans[0].textContent = prof.judet;
                    spans[1].textContent = prof.oras;
                    spans[2].textContent = prof.adresa;
                    spans[3].textContent = prof.nume_firma;
                    spans[4].textContent = prof.cui;
                    spans[5].textContent = prof.cont_bancar;

                    temp.querySelector("input").id = "proforma_"+prof.id;

                    Array.from(temp.querySelectorAll("label")).forEach((elem)=>{
                        elem.setAttribute("for","proforma_"+prof.id);
                        console.log(elem);
                    })
                    document.querySelector("#proforma_data").appendChild(temp);
                })

                
            }
            else{
                
            }

        }
    })
}