
var notify;
$(document).ready(function()
{
    notify = new Notify();
    get_proforme();
})

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
                    document.querySelector("#forms_done").appendChild(temp);
                })

                
            }
            else{
                
            }

        }
    })
}
function send_data()
{
    let data = {};
    data.judet = document.querySelector("#judet").value;
    data.oras = document.querySelector("#oras").value;
    data.adresa = document.querySelector("#adresa").value;
    data.cui = document.querySelector("#cui").value;
    data.firma = document.querySelector("#firma").value;
    data.cont = document.querySelector("#cont").value;

    $.ajax({
        url: "/send_date_proforma",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function(data)
        {
            notify.show_success("Succes!","Datele au fost adaugate!");
        }
    })


}