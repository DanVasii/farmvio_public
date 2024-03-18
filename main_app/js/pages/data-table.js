//[Data Table Javascript]

//Project:	Riday - Responsive Admin Template
//Primary use:   Used only for the Data Table

$(function () {
    "use strict";

    $('#example1').DataTable();
    $('#example2').DataTable({
      'paging'      : true,
      'lengthChange': false,
      'searching'   : false,
      'ordering'    : true,
      'info'        : true,
      'autoWidth'   : false
    });
	
	
	$('#example').DataTable( {
		dom: 'Bfrtip',
		buttons: [
			'copy', 'csv', 'excel', 'pdf', 'print'
		]
	} );
	
	$('#tickets').DataTable({
	  'paging'      : true,
	  'lengthChange': true,
	  'searching'   : true,
	  'ordering'    : true,
	  'info'        : true,
	  'autoWidth'   : false,
	});
	
	$('#productorder').DataTable({
	  'paging'      : true,
	  'lengthChange': true,
	  'searching'   : true,
	  'ordering'    : true,
	  'info'        : true,
	  'autoWidth'   : false,
	});
	

	$('#complex_header').DataTable();
	
	//--------Individual column searching
	
    // Setup - add a text input to each footer cell
    $('#example5 tfoot th').each( function () {
        var title = $(this).text();
        $(this).html( '<input type="text" placeholder="Search '+title+'" />' );
    } );
 
    // DataTable
    var table = $('#example5').DataTable({
        "processing": true,
        "serverSide": true,        
        'serverMethod': 'post',
        "ajax": {
            url: "/admin_get_users",
            type: "POST",
            contentType: "application/json",          
            data: function(data)
            {
                
                return JSON.stringify(data);
            }   
        },
        "columns": [
            { "data": "id" },
            { "data": "username" },
            { "data": "phone_number" },
            { "data": "email" },
            {"data": null,
            "defaultContent": '<button type="button" class="waves-effect waves-light btn btn-info-light mb-5 edit_user">Editeaza</button>'},
            {
                "data":null,
                render: {
                    display: function(data,type,row)
                    {
                        console.log(data);
                        if (data.account_type == 1){
                        if (data.test)
                        return '<button type="button" class="waves-effect waves-light btn btn-danger-light mb-5 del_prom">Sterge promovarea</button>';

                        return '<button type="button" class="waves-effect waves-light btn btn-success-light mb-5 add_prom">Promoveaza</button>';
                        }
                        return "";
                    }
                }
            }
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
	
	
	//---------------Form inputs
	var table = $('#example6').DataTable();
 
    // $('button').click( function() {
    //     var data = table.$('input, select').serialize();
    //     alert(
    //         "The following data would have been submitted to the server: \n\n"+
    //         data.substr( 0, 120 )+'...'
    //     );
    //     return false;
    // } );
	
	
	
	
  }); // End of use strict