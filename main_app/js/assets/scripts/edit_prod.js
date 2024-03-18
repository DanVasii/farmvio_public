
var checked = [],names = [];
var count = 0;
$(document).ready(function(){
    
    $( ".upload_area" ).sortable();
    $( ".upload_area" ).disableSelection();
    $( ".upload_area" ).sortable("disable");

    $.when(populate_workp(),populate_cats()).done(function(a1,a2){
      //bots needed data requests are done, now we can parse the data       
      get_prod_data();
    })

    populate_images();


    $(".wpoints").on("change","input",function(){
        if ($(this).prop("checked"))
        {
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
        console.log(checked);
        update_chosen();


    })

    //file upload listener 
    $("#file_upload").on("change",function(){
        let formData = new FormData();
        formData.append("prod_id",get_prod_id());
        formData.append("prodImages",document.getElementById("file_upload").files[0]);

        //we have something new, then upload as we speak :)
        $.ajax({
            url: "/upload_prod_image",
            type: "POST",
            contentType: false,
            cache: false,
            processData: false,
            data: formData,
            success: function(data){
               //refresh 
               populate_images();
            }
        })
    })
})

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
    upload_order();
    $(".upload_area").sortable("disable");
    $("#order").text("Reorder images");
}
}

function upload_order(){
    let ordered_ids = [];
    //get the order 
    Array.from(document.getElementsByClassName("prod_img")).forEach(elem=>{
        ordered_ids.push(elem.dataset.cid);
    })
    console.log(JSON.stringify({"data":ordered_ids}));   

    $.ajax({
        url: "/update_image_order",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"data":ordered_ids,"prod_id":get_prod_id()}),
        success: function(data){
            console.log(data);
        }
    })
}

function get_prod_id(){
    let path = location.pathname;
    return path.split("/")[2];
}


function get_prod_data(){
    $.ajax({
        url: "/get_data_for_prod",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"prod_id":get_prod_id()}),
        success: function(data){
            if (typeof data == "object"){
                console.log(data);
                document.getElementById("prod_name").value = data.name;
                document.getElementById("desc").value = data.description;
                document.getElementById("price").value = data.price;

                $("#unit_sel option[value='"+data.unit+"']").attr("selected","selected");

                let cat_name = $("#cat_sel option[data-sid='"+data.cat+"']").attr("value");

                $("#cat_sel option[data-sid='"+data.cat+"']").attr('selected', 'selected');

                $("#select2-cat_sel-container").attr("title",cat_name);
                $("#select2-cat_sel-container").text(cat_name);
                //now,foreach point check it 
                let points = JSON.parse(data.points);
                for (index in points){
                    $("#"+points[index]).attr("checked",true);
                    checked.push(points[index]);
                    names.push($("#"+points[index]).parent().find(".point_name").text());
                }
                //we should get the stock too 
                
                update_chosen();
                get_stocks();
            }
        }
    })

}

function get_stocks(){
    //get request 
    $.ajax({
        url: "/get_stocks",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"prod_id":get_prod_id()}),
        success: function (data){
            if (data.length!=0){
                for(index in data){
                    if (data[index].stock_qty==-1)
                    document.querySelector("#point_"+data[index].point_id).checked = true;
                    else{
                        document.querySelector("#f_point_"+data[index].point_id).checked = true;
                        //now update the input 
                        console.log($(".point_stock[data-wpid='"+data[index].point_id+"']"));
                        $(".point_stock[data-wpid='"+data[index].point_id+"']").eq(0).find("input[type='number']").val(data[index].stock_qty);
                    }
                }
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
            label.textContent = "Unlimited/Unknown";

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
            option.textContent = "Kilogram";
            select.appendChild(option);

            option = document.createElement("option");
            option.value = "litri";
            option.textContent = "Litru";
            select.appendChild(option);



            label.appendChild(select);

            div.appendChild(input);
            div.appendChild(label);

            frag.appendChild(div);
        }
    }
    parent.appendChild(frag);

}


function remove_index(id){
    names.splice(id,1);
    $("#"+checked[id]).prop("checked",false);
    checked.splice(id,1);
    update_chosen();
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
            }
        }
    })
}

function populate_images(){
    //first delete the previous ones 
    Array.from(document.getElementsByClassName("prod_img")).forEach(elem=>{
        elem.remove();
    })
    $.ajax({
        url: "/get_all_images",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"prod_id":get_prod_id()}),
        success: function(data){
            console.log(data);
            if (data.length!=0){
                let parent,frag,div,images,i;

                parent = document.getElementsByClassName("upload_area")[0];
                frag = document.createDocumentFragment();

                for (index in data){
                    //create the div 
                    div = document.createElement("div");
                    div.className = "prod_img ui-sortable-handle";
                    let id = data[index].id;
                    div.dataset.cid = id;

                    i = document.createElement("i");
                    i.className = "fas fa-close";
                    i.onclick = function(){
                        remove_image(id);
                    }
                    div.appendChild(i);

                    images = document.createElement("img");
                    images.src = "/uploads/"+data[index].file_name;

                    div.appendChild(images);

                    frag.appendChild(div);
                }
                parent.appendChild(frag);
            }
        }
    })
}

function remove_image(img_id){
    $.ajax({
        url: "/remove_image",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"img_id":img_id,"prod_id":get_prod_id()}),
        success: function(data){
            console.log(data);
            
        }
    })
}

function update_data(){
    let final_data = {};
    let stock_data = {};
    Array.from(document.getElementsByClassName("point_stock")).forEach(elem=>{
        let wpid = elem.dataset.wpid;
        //check which input is checked
        let first_opt = elem.querySelector("#point_"+wpid);
        let second_opt = elem.querySelector("#f_point_"+wpid);

        if (first_opt.checked){
            stock_data[wpid] = -1;
        }
        else{

            stock_data[wpid] = elem.querySelector("input[type='number']").value ? elem.querySelector("input[type='number']").value : 0;
        }

    })
   
    final_data.stocks = stock_data;

    final_data.prod_name = document.getElementById("prod_name").value;
    final_data.desc = document.getElementById("desc").value;
    final_data.prod_id = get_prod_id();
    final_data.price = document.getElementById("price").value;
    final_data.unit = document.getElementById("unit_sel").value;
    
    final_data.wpoints = checked;

    final_data.cat = $("#cat_sel option:selected").attr("value");

    console.log(final_data.cat);

    $.ajax({
        url: "/update_prod_data",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(final_data),
        success: function (data){
            console.log(data);
        }
    })
}