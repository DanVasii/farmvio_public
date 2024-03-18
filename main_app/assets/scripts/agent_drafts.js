$(function(){

    var table = $('#example5').DataTable({
        "processing": true,
        "serverSide": true,        
        'serverMethod': 'post',
        "ajax": {
            url: "/agent_get_draft",
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
                        return `<button type="button" class="waves-effect waves-light btn btn-info-light mb-5 " onclick = "edit('${data.unique_id}')">Editează</button>`;
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


function edit(id)
{
    location.href = '/user_form?draft='+id;
}

