var notify;
$(document).ready(function(){

    notify = new Notify();

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


function change_cui_card(){
    document.querySelector("label[for='cui_card'] input").disabled = false;
    document.querySelector("label[for='cui_card']").click();
  }

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
    aux.cui = document.querySelector("#cui").value;
    aux.firma = document.querySelector("#nume_firma").value;
    aux.nr_reg = document.querySelector("#nr_reg").value;
    aux.banca = document.querySelector("#banca").value;
    aux.cont = document.querySelector("#cont").value;
    data.append("2",JSON.stringify(aux));

    console.log(document.querySelector("#cui_card").files[0]);
    //append the cert 
    data.append("cert",document.querySelector("#cui_card").files[0]);


    console.log(data);
 
   

    $.ajax({
        url: "/upload_b2b_form",
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
            else
            notify.show_success("Felicitari!","Cererea a fost trimisa!");
        },error: function()
        {
            notify.show_error("Eroare!","Ceva nu a mers bine !");
        }
    })
    return true;
}