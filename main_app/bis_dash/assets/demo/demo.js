function open_edit(){
  Array.from(document.querySelectorAll("#datas input")).forEach(elem=>{
    console.log(elem);
    elem.disabled = false;
  })
  document.querySelector("#edit_btn").innerHTML = "<i class='fas fa-check' style = 'font-size: 16px; margin-right: 5px'></i> Confirm edit "
  document.querySelector("#edit_btn").onclick = null;
  document.querySelector("#edit_btn").onclick = function(){
    close_edit();
  }
}


function close_edit()
{
    Array.from(document.querySelectorAll("#datas input")).forEach(elem=>{
      elem.disabled = true;
    })

    document.querySelector("#edit_btn").innerHTML = "<i class='fas fa-edit' style='margin-right: 5px; font-size: 16px;'> </i> Edit personal data ";
    document.querySelector("#edit_btn").onclick = null;
    
    document.querySelector("#edit_btn").onclick = function(){
      open_edit();
    }
}