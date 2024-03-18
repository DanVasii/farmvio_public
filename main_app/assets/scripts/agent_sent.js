$(function(){

    var table = $('#example5').DataTable({
        "processing": true,
        "serverSide": true,        
        'serverMethod': 'post',
        "ajax": {
            url: "/agent_get_sent",
            type: "POST",
            contentType: "application/json",          
            data: function(data)
            {
                console.log(data);
                return JSON.stringify(data);
            }   
        },
        "columns": [
            {
                "data":null,
                render: {
                    display: function(data,type,row)
                    {
                        return `<button type="button" class="waves-effect waves-light btn btn-info-light mb-5 " onclick = "resend_mail('${data.unique_id}')">Retrimite email</button>
                        <button type="button" class="waves-effect waves-light btn btn-danger-light mb-5 " onclick = "undo_form('${data.unique_id}')">Am gresit email</button>
                        `;
                    }
                }
            },
                     {
                "data":null,
                render: {
                    display: function(data,type,row)
                    {
                        console.log(data);
                        if (data.status == 1){                     
                        return '<i class="fas fa-circle" style = "color: green"></i>';
                        }
                        else if (data.status==0)
                        {
                            return '<i class="fas fa-circle" style = "color: gold"></i>';
                        }
                        return "";
                    }
                }
            },
            { "data": "unique_id" },
            { "data": "username" },
            { "data": "nume" },
            { "data": "email" },
            { "data": "tel" },
            { "data": "judet" },
            { "data": "oras" },
            { "data": "adresa" },
            { "data": "cui" },
            { "data": "nume_firma" },
            { "data": "sent_by" }

            // {"data": null,
            // "defaultContent": '<button type="button" class="waves-effect waves-light btn btn-info-light mb-5 edit_user">Editeaza</button>'},
            // {
            //     "data":null,
            //     render: {
            //         display: function(data,type,row)
            //         {
            //             console.log(data);
            //             if (data.account_type == 1){
            //             if (data.test)
            //             return '<button type="button" class="waves-effect waves-light btn btn-danger-light mb-5 del_prom">Sterge promovarea</button>';
    
            //             return '<button type="button" class="waves-effect waves-light btn btn-success-light mb-5 add_prom">Promoveaza</button>';
            //             }
            //             return "";
            //         }
            //     }
            // }
        ]
    });
    
    // Apply the search
    table.columns().every( function () {
        var that = this;
    
        $( 'input', this.footer() ).on( 'keyup change', function () {
            if ( that.search() !== this.value ) {
                that
                    .search( this.value )
                    .draw();
            }
        } );
    } );



})

function resend_mail(id)
{

    //confirm action 
    $.ajax({
        url: "/resend_mail_agent",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({id}),
        success: function(data)
        {
            if (data.err)
            {
                alert(data.err);
            }
            else{

            }
        }
    })
}

function undo_form(id)
{
    let c = confirm("Esti sigur ca adresa de email este gresita?");

    if (c){
        //unde the save
        $.ajax({
            url: "/agent_undo",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({"sent_id":id}),
            success: function(data)
            {
                if (!data.err)
                {
                  window.location.href = "/user_form?draft="+id;
                }
                else{
                    alert(data.err);
                }
            }
        })
    }   
}

function delete_req(id)
{
    console.log("remove "+id);
}