
//change when live 
var forced = true, sent = false,sent_id = "";

$(function(){


    populate_cats();
    $("#cats_sel").select2({
        tags: true
    });
    

    $("#avize").on("change","input",function(elem){
        //set display none to the current add aviz 
        document.querySelectorAll(".add_aviz").forEach(elem=>elem.parentElement.style.display = "none");
        //add the preview 
        let preview = document.querySelector("#preview_img").content.cloneNode(true);
        preview.querySelector("img").src = URL.createObjectURL(elem.currentTarget.files[0]);
        preview.querySelector("button").onclick = function(){
            delete_elem(this,elem.currentTarget);
        }
        document.querySelector("#avize").appendChild(preview);

        

        let temp = document.querySelector("#add_aviz_input").content.cloneNode(true);
        document.querySelector("#avize").appendChild(temp);
    })

    $("#cui_card").on("change",function(elem){
        let parent_elem = elem.currentTarget.parentElement;
        elem = elem.currentTarget;
        console.log(parent_elem);
        //preview 
        if (elem.files.length!=0){
          parent_elem.querySelector(" p").style.display = "none";
          parent_elem.style.backgroundColor = 'white';
          parent_elem.querySelector("img").src = URL.createObjectURL(elem.files[0]);
          parent_elem.querySelector("input").disabled = true;
          parent_elem.parentElement.parentElement.querySelector(".change_pic").style.display = "block";
        }
        else{
            parent_elem.parentElement.parentElement.querySelector(".change_pic").style.display = "none";
            parent_elem.querySelector("p").style.display = "block";
            parent_elem.style.backgroundColor = 'lightgray';
            parent_elem.querySelector("img").src = "";
            parent_elem.querySelector("input").disabled = false;
        }
      })



    $("#judet").on("input",function(elem){
        
        let input = elem.currentTarget.value;
        let parent = elem.currentTarget.parentElement;

        if (input.trim()!="" && input.length>=3)
        {
            get_judet(input);
        }
        else
        {
            parent.querySelector("#judet_ac .ac_data").style.maxHeight = "0px";
        }
    })
    
    $("#judet").on("focusout",function(elem){
        //close the ac    
       elem.currentTarget.parentElement.querySelector(".ac_data").style.maxHeight = "0px";
    })
    $("#judet").on("focus",function(elem){
        
        //open the ac    
        if (elem.currentTarget.parentElement.querySelectorAll(".ac_data li").length!=0)
       elem.currentTarget.parentElement.querySelector(".ac_data").style.maxHeight = "150px";
    })
    
    $(".ac_data").on("click","li",function(elem){
        let text = elem.currentTarget.textContent;
        
        if (elem.currentTarget.className == "")
        {
            let input = elem.currentTarget.parentElement.parentElement.parentElement.querySelector("input");
            input.value = text;
            elem.currentTarget.parentElement.style.maxHeight = "0px";
    
            if (elem.currentTarget.dataset.county)
            {
                document.querySelector("#judet").value = elem.currentTarget.dataset.county;
            }
        }
        })
    
    
})
  
function get_judet(what)
{
    console.log(what);
    $.ajax({
        url: "/get_delivery_county",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"county":what.trim()}),
        success: function(data){
            console.log(data);
            let li,parent,frag;
            frag = document.createDocumentFragment();
            parent = document.querySelector("#judet_ac .ac_data");
            document.querySelector("#judet_ac .ac_data").style.maxHeight = "150px";
            Array.from(parent.querySelectorAll("li")).forEach(elem=>{
                elem.remove();
            })
            if (data.length == 0){
                //show no result
                li = document.createElement("li");
                li.className = "nf";
                li.textContent = "Fara rezultate";
                frag.appendChild(li);
            }
            else
            {
                data.map(county=>{
                    li = document.createElement("li");
                    li.textContent = county.judet;
                    frag.appendChild(li);
                })
            }
            parent.appendChild(frag);
        }
        
    })
}

function change_cui_card(){
    document.querySelector("label[for='cui_card'] input").disabled = false;
    document.querySelector("label[for='cui_card']").click();
  }


  
function populate_cats()
{
    $.ajax({
        url: "/get_cats_all",
        type: "POST",
        contentType: "application/json",
        success: function(data){
            if (data.length!=0){
                let option;
                let parent,frag;
                frag = document.createDocumentFragment();
                parent = document.querySelector("#cats_sel");
                data.map(cat=>{
                    option = document.createElement("option");
                    option.value = cat.categorie;
                    option.textContent = cat.categorie;
                    frag.appendChild(option);
                })
                parent.appendChild(frag);
            }
        }
    })
}

function delete_elem(preview,input){
    
    preview.parentElement.remove();
    input.remove();
}


function refresh_form()
{
    if (!sent)
    {
        let c = confirm("Acest formular nu a fost trimis! Daca continui, datele se vor sterge!");
        if (c)
        {
            forced = true;
            location.href = '/user_form';
        }
    }
    else{
        forced = true;
        location.href = '/user_form';
    }
}


function send_form()
{
    let sent_object = new FormData();
    //append the questions 
    let aux = [];

    Array.from(document.querySelectorAll(".carousel-item")).forEach((elem)=>{
        aux.push({
            "qid": elem.dataset.qid,
            "ans": elem.querySelector("textarea").value
        })
    })
    sent_object.append("questions", JSON.stringify(aux));
    //basic data 
    Array.from(document.querySelectorAll("#main_content input[type='text']")).forEach((elem)=>{
            sent_object.append(elem.id,elem.value);
    })
    //get the cats 
    sent_object.append("cats_sel",$("#cats_sel").val());
    
    //add the cui
    if (document.querySelector("#cui_card").files.length!=0)
    sent_object.append("cert",document.querySelector("#cui_card").files[0]);

    let inputs = document.querySelectorAll("#avize .col-auto input");
    
    inputs.forEach(elem=>{
        if (elem.files.length!=0){
            
            sent_object.append("avize[]",elem.files[0]);
        }
    })

     aux = {};
    //add details 
    let index = 0;
    document.querySelectorAll("#avize .col-auto").forEach(elem=>{
        if (elem.querySelectorAll("textarea").length!=0){
            //append
            aux[inputs[index].files[0].name] = elem.querySelector("textarea").value;
            index++;
        }
    })

    sent_object.append("details",JSON.stringify(aux));

    sent_object.append("draft",document.querySelector("#draft").value);

    $.ajax({
        url: "/agent_submit",
        type: "POST",
        contentType: false,
        cache: false,
        processData: false,
        data: sent_object,
        success: function(data){
      

            //first reset all 
            Array.from(document.querySelectorAll(".err")).forEach((elem)=>{
                elem.style.display = "none";
                elem.textContent = "";
            })
            if (!data.u_id)
            {
                if (data.main_err)
                {   
                    alert(data.main_err);
                }
                else
                data.map((err_object)=>{
                    if (err_object!="main_err"){
                    document.querySelector("#"+err_object.field+" ~ .err").style.display = "block";
                    document.querySelector("#"+err_object.field+" ~ .err").textContent = err_object.err;
                    }
                    else{
                        //show main err
                        alert("eroare mare");
                    }
                })
            }
            else{
                sent = true;
                sent_id = data.u_id;
                document.querySelector(".ss").disabled = true;
                    if (data.main_err)
                        alert(data.main_err);
                        else
                alert("Formular si mail trimis!");
            }
        }
    })
}


function save_draft()
{
    if (document.querySelector("#draft").value!="")
    {
        alert("acesta este deja un draft")
        return;
    }
    let sent_object = new FormData();
    //append the questions 
    let aux = [];

    Array.from(document.querySelectorAll(".carousel-item")).forEach((elem)=>{
        aux.push({
            "qid": elem.dataset.qid,
            "ans": elem.querySelector("textarea").value
        })
    })
    sent_object.append("questions", JSON.stringify(aux));
    //basic data 
    Array.from(document.querySelectorAll("#main_content input[type='text']")).forEach((elem)=>{
            sent_object.append(elem.id,elem.value);
    })
    //get the cats 
    sent_object.append("cats_sel",$("#cats_sel").val());
    
    //add the cui
    if (document.querySelector("#cui_card").files.length!=0)
    sent_object.append("cert",document.querySelector("#cui_card").files[0]);

    let inputs = document.querySelectorAll("#avize .col-auto input");
    inputs.forEach(elem=>{
        if (elem.files.length!=0){
            
            sent_object.append("avize[]",elem.files[0]);
        }
    })

     aux = {};
    //add details 
    let index = 0;
    document.querySelectorAll("#avize .col-auto").forEach(elem=>{
        if (elem.querySelectorAll("textarea").length!=0){
            //append
            aux[inputs[index].files[0].name] = elem.querySelector("textarea").value;
            index++;
        }
    })

    sent_object.append("details",JSON.stringify(aux));


    $.ajax({
        url: "/agent_submit_draft",
        type: "POST",
        contentType: false,
        cache: false,
        processData: false,
        data: sent_object,
        success: function(data){
          
            //first reset all 
            Array.from(document.querySelectorAll(".err")).forEach((elem)=>{
                elem.style.display = "none";
                elem.textContent = "";
            })
            if (!data.u_id)
            {
                data.map((err_object)=>{
                    if (err_object!="main_err"){
                    document.querySelector("#"+err_object.field+" ~ .err").style.display = "block";
                    document.querySelector("#"+err_object.field+" ~ .err").textContent = err_object.err;
                    }
                    else{
                        //show main err
                        alert("eroare mare");
                    }
                })
            }
            else{
                document.querySelector(".ss").disabled = true;
                sent = true;
               // sent_id = data.u_id;

                alert("Draft salvat !");
            }
        }
    })
}

function populate_questions(q)
{
   if (q && q.length!=0)
   {
       q.map((elem)=>{
           document.querySelector(".carousel-item[data-qid='"+elem.qid+"'] textarea").value = elem.ans;
       })
   }
}


function preselect_cats(cats)
{
    if (cats)
    {
        cats = cats.split(",");
        cats.map((cat)=>{
            if ($('#cats_sel').find("option[value='" + cat + "']").length) {
                $('#cats_sel').val(cat).trigger('change');
            } else { 
                // Create a DOM Option and pre-select by default
                var newOption = new Option(cat, cat, true, true);
                // Append it to the select
                $('#cats_sel').append(newOption).trigger('change');
            } 
        })
 
    }
}

function undo_save()
{
    if (sent && sent_id)
    {
        let c = confirm("Esti sigur ca adresa de email este gresita?");

        if (c){
            //unde the save
            $.ajax({
                url: "/agent_undo",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({sent_id}),
                success: function(data)
                {
                    if (!data.err)
                    {
                        sent_id = "";
                        sent = false;
                        document.querySelector(".ss").disabled = false;
                    }
                    else{
                        alert(data.err);
                    }
                }
            })
        }   
    }
    else{

    }
}   



window.onbeforeunload = function(event)
{
    if (!forced)
    return "";
};