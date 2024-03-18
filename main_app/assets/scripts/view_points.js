
var notify;
$(document).ready(function(){
    get_farms("");
    notify = new Notify();
})

function get_farms(search){
    $.ajax({
        url: "/get_workp",
        type: "POST",
        success: function (data){
            console.log(data);
            if (data.length!=0){
                let parent = document.getElementsByClassName("content")[0];
                let frag;
                let temp
                frag = document.createDocumentFragment();
                for (index in data)
                {
                   let object = data[index];

                    temp = document.querySelector("#wpoint").content.cloneNode(true);

                    temp.querySelector("b").textContent = object.point_name;

                    temp.querySelector("p").textContent = object.judet+ ", "+object.oras+", "+object.adresa; 
                    temp.querySelector(".ad_p").dataset.id = object.id

                    temp.querySelector(".ad_p").onclick = function(){
                         goto_points(this);
                    }

                    let wp = temp.querySelector(".wp");
                    temp.querySelector(".del_w").onclick = function()
                    {
                        console.log(temp.querySelector(".wp"));
                        delete_point(object.id,wp);
                    }

                    temp.querySelector(".ed_w").onclick = function()
                    {
                        goto_edit_points(object.id);
                    }

                    temp.querySelector(".se_p").onclick = function()
                    {
                       goto_prods(object.id); 
                    }
                    
                    
                    frag.appendChild(temp);
                }
                parent.appendChild(frag);
            }
        }
    })
}

function goto_points(e){
    let id = e.dataset.id;
    location.href = '/add_prod/'+id;
}

function goto_edit_points(id)
{
    location.href = '/edit_point/'+id;
}

function delete_point(point_id,container)
{
    $.ajax({
        url: "/delete_point",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"point_id":point_id}),
        success: function(data)
        {
            console.log(container);
            container.remove();
            notify.show_success("Succes!","Punctul a fost șters!");
        },error: function()
        {
            notify.show_error("Eroare!","Te rugăm să încerci mai târziu!");
        }
    })

}


function goto_prods(point_id)
{
    location.href = '/view_point_prods/'+point_id;
}