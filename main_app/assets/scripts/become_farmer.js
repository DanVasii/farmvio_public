var notify;
$(document).ready(function(){

    notify = new Notify();
    populate_cats();
    pre_fill();
    $("#cats_sel").select2();


    $(".avize_part").on("change",".add_aviz input",function(elem){
        //set display none to the current add aviz 
        document.querySelectorAll(".add_aviz").forEach(elem=>elem.parentElement.style.display = "none");
        //add the preview 
        let preview = document.querySelector("#preview_img").content.cloneNode(true);
        preview.querySelector("img").src = URL.createObjectURL(elem.currentTarget.files[0]);
        preview.querySelector("button").onclick = function(){
            delete_elem(this,elem.currentTarget);
        }
        document.querySelector(".avize_part .row").appendChild(preview);

        

        let temp = document.querySelector("#add_aviz_input").content.cloneNode(true);
        document.querySelector(".avize_part .row").appendChild(temp);
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

    $("#oras").on("input",function(elem){
            
      let input = elem.currentTarget.value;
      let parent = elem.currentTarget.parentElement;
      if (input.trim()!="" && input.length>=3)
      {
          get_oras(input);
      }
      else
      {
          document.querySelector("#oras_ac .ac_data").style.maxHeight = "0px";
      }
    })

    $("#judet,#oras").on("focusout",function(elem){
      //close the ac    
     elem.currentTarget.parentElement.querySelector(".ac_data").style.maxHeight = "0px";
  })
  $("#judet,#oras").on("focus",function(elem){
      //research oras 
      if (elem.currentTarget.id == "oras")
      get_oras(elem.currentTarget.value);
      //open the ac    
      if (elem.currentTarget.parentElement.querySelectorAll(".ac_data li").length!=0)
     elem.currentTarget.parentElement.querySelector(".ac_data").style.maxHeight = "150px";
  })

  $(".ac_data").on("click","li",function(elem){
      let text = elem.currentTarget.textContent;
      console.log(elem.currentTarget)
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
})

function get_judet(what)
{
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


function get_oras(oras){
  $.ajax({
      url: "/get_delivery_city",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({"city":oras.trim(),"county":document.querySelector("#judet").value}),
      success: function(data){
          console.log(data);
          let li,parent,frag;
          frag = document.createDocumentFragment();
          parent = document.querySelector("#oras_ac .ac_data");
          document.querySelector("#oras_ac .ac_data").style.maxHeight = "150px";
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
                  li.textContent = county.nume;
                  li.dataset.county = county.judet;
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

function send_request()
{

    //build the form data 
    let data = new FormData();
    //get the first page 
    let aux = {};
    aux.nume = document.querySelector("#wfirstName2").value;
    aux.prenume = document.querySelector("#wlastName2").value
    aux.email = document.querySelector("#wemailAddress2").value
    aux.tel = document.querySelector("#wphoneNumber2").value
    aux.judet = document.querySelector("#judet").value
    aux.oras = document.querySelector("#oras").value
    aux.adresa = document.querySelector("#adresa").value

    data.append("0",JSON.stringify(aux));
    
    //append the third step 

    aux = {};
    aux.cui = document.querySelector("#cui_cert").value;
    aux.firma = document.querySelector("#nume_firma").value;
    aux.cats = $("#cats_sel").val();

    data.append("2",JSON.stringify(aux));


    //append the cert 
    data.append("cert",document.querySelector("#cui_card").files[0]);

    //append avize 
    let inputs = document.querySelectorAll(".col-auto input");
    inputs.forEach(elem=>{
        if (elem.files.length!=0){
            
            data.append("avize[]",elem.files[0]);
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

    data.append("details",JSON.stringify(aux));

    $.ajax({
        url: "/upload_farmer_form",
        type: "POST",
        contentType: false,
        cache: false,
        processData: false,
        data: data,
        success: function(data){
            if (data?.general)
            {
                notify.show_error("Eroare!",data.general);
            }
            else{
            notify.show_success("Felicitari!","Cererea a fost trimisa! Vei fi redirecționat către panoul de administrare!");
            setTimeout(function(){
                window.location.href = '/dashboard';
            },2500);
        }
        },error: function()
        {
            notify.show_error("Eroare!","Ceva nu a mers bine !");
        }
    })
    return true;
}


function procees_to_form(force = false)
{
    if (!force){
    let cui = document.querySelector("#cui_search").value;
  
    $.ajax({
        url: "/cui_search",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"cui": cui.trim()}),
        success: function(data)
        {
            if (data.err)
            {
                document.querySelector(".cover .err").style.display = "block";
                //show error somewhere 
                document.querySelector(".cover .err").textContent = data.err;

            }
            else{
                document.querySelector(".cover .err").textContent = "";
                //goto next 
                document.querySelector(".cover").classList.add("slide_to_left");
                if (data.length!=0){
                    data = data[0];
                //populate 
                document.querySelector("#judet").value = data?.judet;
                document.querySelector("#oras").value = data?.localitate;
                document.querySelector("#adresa").value = data?.adresa;
                }
            }
        }
    })
}
else{
    document.querySelector(".cover .err").textContent = "";
    //goto next 
    document.querySelector(".cover").classList.add("slide_to_left");
}

}

function pre_fill()
{
    $.ajax({
        url: "/get_user_data",
        type: "POST",
        contentType: "application/json",
        success: function (data)
        {
            if (data.real_name && data.real_name.trim()!="")
            {
                let first_name = data.real_name.trim().split(" ")[0];

                let second_name = data.real_name.replace(first_name.trim(),"").trim();

               

                document.querySelector("#wfirstName2").value = first_name;

                document.querySelector("#wlastName2").value = second_name;

            }
            if (data.contact_data.length!=0)
            {
                document.querySelector("#wemailAddress2").value = data.contact_data[0].email;

                document.querySelector("#wphoneNumber2").value = data.contact_data[0].phone_number;
            }
        }
    })
}