var mysql,pool;
mysql = pool = null;

var id_generator = require("order-id")('farmers');

var phone_regexp = new RegExp("^\\+?4?0{1,2}[0-9]{9}$");
var email_valid =  /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function init(p,m){
    pool = p;
    mysql = m;
}

function get_b2b_orders(){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("Select b2b_order_prods.id as cid,b2b_order_prods.prod_keyw,b2b_order_prods.prod_details,b2b_orders.order_id,b2b_orders.order_status,b2b_orders.order_time,b2b_order_prods.prod_qty,frv_prods.price,frv_prods.name,frv_wpoints.adresa,users.bis_name,(SELECT file_name from frv_prod_images where frv_prod_images.product_id = b2b_order_prods.prod_id ORDER BY pic_index ASC LIMIT 1) as image  from  b2b_orders,b2b_order_prods,frv_prods,frv_wpoints,users  where b2b_order_prods.order_id = b2b_orders.order_id and frv_prods.id = b2b_order_prods.prod_id and  frv_wpoints.id = b2b_order_prods.point_id and users.id = frv_wpoints.farm_owner Union all select b2b_order_prods.id as cid ,b2b_order_prods.prod_keyw,b2b_order_prods.prod_details,b2b_orders.order_id,b2b_orders.order_status,b2b_orders.order_time,b2b_order_prods.prod_qty,'','','','','' as image from b2b_orders,b2b_order_prods WHERE b2b_order_prods.order_id = b2b_orders.order_id and b2b_order_prods.point_id=-1",(err,results,fields)=>{
                    conn.release();
                    if (err)
                    {
                        rej();
                    }
                    else{
                        res(results);
                    }
                })
            }
        })  
    })
}

function get_key_words(order_elem_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT prod_keyw from b2b_order_prods where id  = "+order_elem_id+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        console.log(err);
                        rej();
                    }
                    else{
                        res(results);
                    }
                })
            }
        })
    })
}

    function get_prods(words){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT id,name,description,price,points,(SELECT file_name from frv_prod_images where frv_prod_images.product_id = frv_prods.id ORDER BY pic_index ASC LIMIT 1) as image,(SELECT count(id) from b2b_offers where prod_id = frv_prods.id) as sent_offers from frv_prods where Match(name,description) against ("+mysql.escape(words.join(','))+" in natural language mode)  ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            
                            res(results);
                        }
                    })
                }
            })
        })
    }

    function order_by_distance(order_id,prods){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    let user_lat,user_lng;
                   //we now must get the user coords 
                   conn.query("SELECT lat,lng from b2b_orders where order_id = (SELECT order_id from b2b_order_prods where id = "+order_id+" LIMIT 1)",(err,results,fields)=>{
                       
                       if (err){
                           rej();
                           conn.release();
                        }else{
                            user_lat = results[0].lat;
                            user_lng = results[0].lng;

                           //now we need to get all the points coordinates;
                            //first create a big array with all of them 
                            let points = [];

                            prods.map(prod=>{
                                prod.points = JSON.parse(prod.points);
                                prod.points.map(point_id=>{
                                    if (!points.includes(point_id))
                                    points.push(point_id);
                                })
                            })
                            console.log(points);
                            //query 
                            conn.query("SELECT lat,lng,id from frv_wpoints where id IN("+points.join(',')+")",(err,results,fields)=>{
                                conn.release();
                                if (err){
                                    console.log(err);
                                    rej();
                                }
                                else{
                                    //now for each point we calculate the distance 
                                    //console.log(results);
                                    results.map(point=>{
                                        point.distance = distance(user_lat,user_lng,point.lat,point.lng);
                                    })

                                    //order the array by the distance
                                    results.sort((a,b)=>parseFloat(a.distance) - parseFloat(b.distance));
                                    //we now should order the prods and add the nearest distance 
                                    let already_prod = [];
                                    let ordered_prods = [];
                                    let prod_points;
                                    console.log(results);

                                    results.map(point=>{
                                        //get the prods which contain this point 
                                        prods.map(prod=>{
                                            if (!already_prod.includes(prod.id)){
                                               
                                                prod_points = prod.points;

                                            if (prod_points.includes(point.id)){
                                                //add to already contain 
                                                already_prod.push(prod.id);
                                                //set the distance 
                                                prod.distance = point.distance;
                                                prod.selected_point_id = point.id;
                                                //add to final 
                                                ordered_prods.push(prod);
                                            }
                                        }

                                        })
                                    })
                                    res(ordered_prods);

                                }
                            })
                        }
                   }) 
                }
            })
        })
    }

    function distance(lat1, lon1, lat2, lon2) 
    {
      var R = 6371; // km
      var dLat = toRad(lat2-lat1);
      var dLon = toRad(lon2-lon1);
      var lat1 = toRad(lat1);
      var lat2 = toRad(lat2);

      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c;
      return d;
    }

    // Converts numeric degrees to radians
    function toRad(Value) 
    {
        return Value * Math.PI / 180;
    }

    function send_offer(data)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("INSERT INTO b2b_offers (farmer_id,point_id,prod_id,order_id,cid) VALUES ((Select farm_owner from frv_wpoints where id = "+data.point_id+"),"+data.point_id+","+data.prod_id+",(Select order_id from b2b_order_prods where id = "+data.cid+"),"+data.cid+") ",(err,results,fields)=>{
                      
                        if (err){
                            console.log(err);
                            conn.release();
                            rej();
                        }
                        else{
                            //insert the status 
                            conn.query("INSERT INTO b2b_statuses (offer_id,status,new_price,new_qty) VALUES  ("+results.insertId+",0,"+data.price+","+data.qty+") ",(err,results,fields)=>{
                                conn.release();
                                if (err){
                                    console.log(err);
                                        rej();
                            }
                                else
                                res();
                            })
                        }
                    })
                }
            })
        })
    }

    function get_prod_offers(data){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    console.log(data);
                    conn.query("SELECT b2b_offers.cid,b2b_statuses.*,frv_prods.name,frv_wpoints.judet,frv_wpoints.oras,frv_wpoints.adresa,users.bis_name from b2b_offers  JOIN b2b_statuses on b2b_statuses.offer_id = b2b_offers.id join frv_wpoints on frv_wpoints.id = b2b_offers.point_id join users on users.id = frv_wpoints.farm_owner join frv_prods on b2b_offers.prod_id = frv_prods.id where prod_id = "+data.prod_id+" order by (b2b_offers.cid = "+data.order_id+" ) DESC  ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            console.log(results);
                            res(results);
                        }
                    })
                }
            })
        })
    }

    function update_status(offer_id,status){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("INSERT INTO b2b_statuses (offer_id,status,new_price,new_qty) SELECT "+offer_id+","+status+",new_price,new_qty from b2b_statuses where offer_id = "+offer_id+" ORDER BY sent_at DESC LIMIT 1",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            res();
                        }
                    })
                }
            })
        })
    }

    function insert_counter_offer(offer_id,new_price,new_qty)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else
                {
                    conn.query("INSERT INTO b2b_statuses (offer_id,status,new_price,new_qty) VALUES ("+offer_id+",0,"+new_price+","+new_qty+")",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            res();
                        }
                    })
                }
            })
        })
    }

    function get_offers_for_cid(cid)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT b2b_statuses.offer_id,b2b_statuses.new_price,b2b_statuses.new_qty,b2b_statuses.sent_at,b2b_offers.sent_by,b2b_statuses.status,b2b_offers.cid,frv_prods.name,frv_wpoints.oras,frv_wpoints.judet,frv_wpoints.adresa,users.bis_name from b2b_offers inner JOIN b2b_statuses on b2b_statuses.offer_id = b2b_offers.id  inner JOIN users on users.id = b2b_offers.farmer_id join frv_wpoints on frv_wpoints.id = b2b_offers.point_id  JOIN frv_prods on frv_prods.id = b2b_offers.prod_id where b2b_offers.cid = "+cid+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            console.log(results);
                            res(results);
                        }
                    })
                }
            })
        })
    }


    function send_direct_offer(data){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    let cid = data.cid;
                    conn.query("INSERT INTO b2b_offers (farmer_id,point_id,prod_id,order_id,cid) VALUES ((Select user_id from frv_prods where frv_prods.id = (Select prod_id from b2b_order_prods where id = "+cid+")),(Select point_id from b2b_order_prods where id = "+cid+"),(SELECT prod_id from b2b_order_prods where id = "+cid+"),(SELECT order_id from b2b_order_prods where id = "+cid+"),"+cid+")",(err,results,fields)=>{
                        if (err){
                            console.log(err);
                            conn.release();
                            rej();
                        }
                        else{
                            let insertId = results.insertId;
                            //imsert the status
                            conn.query("INSERT INTO b2b_statuses (offer_id,status,new_price,new_qty) VALUES ((SELECT id from b2b_offers where cid = "+cid+"  ),0,"+data.price+","+data.qty+")",(err,results,fields)=>{
                                conn.release();
                                if (err){
                                    console.log(err);
                                    rej();
                                }
                                else
                                res();
                            })
                        }
                    })
                }
            })
        })
    }

    function get_farmers()
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT id,username from users where account_type = 1",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            res(results);
                        }
                    })
                }
            })
        })
    }

    function get_avize(farmer_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT * FROM frv_avize where user_id = "+farmer_id+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            res(results);
                        }
                    })
                }
            })
        })
    }

    function add_aviz(farmer_id,nume){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("INSERT INTO frv_avize (nume,user_id) VALUES("+mysql.escape(nume)+","+parseInt(farmer_id)+")",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            res(results.insertId);
                        }
                    })
                }
            })
        })
    }

    function remove_aviz(a_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("DELETE FROM frv_avize where id = "+a_id+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            res();
                        }
                    })
                }
            })
        })
    }


    function get_unique_request_id(try_number = 5){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                //generate the id 
                let req_id = id_generator.generate();
                if (err){
                    if (try_number<5){
                        get_unique_request_id(try_number+1);
                    }
                    else{
                        rej();
                    }
                }
                else{
                    conn.query("SELECT id from req_farmers where unique_id = "+mysql.escape(req_id)+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            if (try_number<5){
                                get_unique_request_id(try_number+1);
                            }
                            else{
                                rej();
                            }
                        }
                        else{
                            if (results.length == 0){
                                res(req_id);
                            }
                            else{
                                if (try_number<5){
                                    get_unique_request_id(try_number+1);
                                }
                                else{
                                    rej();
                                }
                            }
                        }
                    })
                }
            })
        })
    }

    function insert_avize_details(details){

        return new Promise((res,rej)=>{
            console.log(details);
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    let query = "INSERT INTO avize_details (file_name,det) VALUES "
                    Object.keys(details).map(detail=>{
                        query+= `(${mysql.escape(detail)},${mysql.escape(details[detail])}),`;
                    })
                    query = query.slice(0,-1);
                    console.log(query);
                    conn.query(query,(err,results,fields)=>{
                        conn.release();
                        if (err)
                        rej();
                        else
                        res()
                    })
                }
            })
        })
    }

    function insert_farmer_request_data(data,id,user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    data[0] = JSON.parse(data[0]);
                   
                    data[2] = JSON.parse(data[2]);
                    console.log(data[2]);
                    //insert 
                    conn.query("INSERT INTO req_farmers (unique_id,nume,prenume,email,tel,judet,oras,adresa,cui,nume_firma,sold_cats,sent_by) VALUES("+mysql.escape(id)+","+mysql.escape(data[0].nume)+","+mysql.escape(data[0].prenume)+","+mysql.escape(data[0].email)+","+mysql.escape(data[0].tel)+","+mysql.escape(data[0].judet)+","+mysql.escape(data[0].oras)+","+mysql.escape(data[0].adresa)+","+mysql.escape(data[2].cui)+","+mysql.escape(data[2].firma)+","+mysql.escape(data[2].cats.length==0 ? '' : JSON.stringify(data[2].cats))+","+parseInt(user_id)+")",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            res();
                        }
                    })
                }
            })
        })
    }

    function insert_b2b_request_data(data,id,user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    data[0] = JSON.parse(data[0]);
                   
                    data[2] = JSON.parse(data[2]);
                    console.log(data[2]);
                    //insert 
                    conn.query("INSERT INTO req_b2b (unique_id,nume,prenume,email,tel,judet,oras,adresa,cui,nume_firma,nr_reg,banca,cont,sent_by) VALUES("+mysql.escape(id)+","+mysql.escape(data[0].nume)+","+mysql.escape(data[0].prenume)+","+mysql.escape(data[0].email)+","+mysql.escape(data[0].tel)+","+mysql.escape(data[0].judet)+","+mysql.escape(data[0].oras)+","+mysql.escape(data[0].adresa)+","+mysql.escape(data[2].cui)+","+mysql.escape(data[2].firma)+","+mysql.escape(data[2].nr_reg)+","+mysql.escape(data[2].banca)+","+mysql.escape(data[2].cont)+","+parseInt(user_id)+")",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            res();
                        }
                    })
                }
            })
        })
    }

    function get_f_reqs(){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT * FROM req_farmers where status = 0",(err,result,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            res(result);
                        }
                    })
                }
            })
        })
    }

    function get_b_reqs(){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT * FROM req_b2b where status = 0",(err,result,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            res(result);
                        }
                    })
                }
            })
        })
    }

    function get_un_id(req_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT unique_id from req_farmers where id = "+parseInt(req_id)+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            if (results.length!=0)
                            res(results[0].unique_id);
                            else 
                            rej();
                        }
                    })
                }
            })
        })
    }

    function get_un_id_b2b(req_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT unique_id from req_b2b where id = "+parseInt(req_id)+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            if (results.length!=0)
                            res(results[0].unique_id);
                            else 
                            rej();
                        }
                    })
                }
            })
        })
    }

    function get_all_avize(req_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    console.log(mysql.escape(req_id+'--'+'%'));
                    conn.query("SELECT file_name,det from avize_details where file_name LIKE "+mysql.escape(req_id+'--'+'%')+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            if (results.length!=0)
                            res(results);
                            else 
                            rej();
                        }
                    })
                }
            })
        })
    }

    function update_farmer_req_data(data,req_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    let query = "UPDATE req_farmers set ";

                    Object.keys(data).map(key=>{
                        if (key!="sold_cats")
                        query+= `${key} = "${data[key]}",`;
                        else{
                            query+= `${key} = '${JSON.stringify(data[key])}',`;
                        }
                    })

                    query = query.slice(0,-1);
                    query+=" WHere id = "+mysql.escape(req_id)+" ";
                    console.log(query);
                    conn.query(query,(err,results,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            res();
                        }
                    })
                }
            })
        })
    }

    function update_b2b_req_data(data,req_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    let query = "UPDATE req_b2b set ";

                    Object.keys(data).map(key=>{
                        query+= `${key} = "${data[key]}",`;
                      
                    })

                    query = query.slice(0,-1);
                    query+=" WHere id = "+mysql.escape(req_id)+" ";
                    console.log(query);
                    conn.query(query,(err,results,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            res();
                        }
                    })
                }
            })
        })
    }


    function accept_req(req_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else
                {
                    conn.query("UPDATE req_farmers set status = 1 where id = "+req_id+" ",(err,results,fields)=>{
                        if(err){
                            conn.release();
                            rej();
                        }
                        else{
                            conn.query("UPDATE users set account_type = 1, bis_name = (SELECT nume_firma from req_farmers where req_farmers.id = "+parseInt(req_id)+" )  where users.id = (Select sent_by from req_farmers where req_farmers.id = "+parseInt(req_id)+") ",(err,results,fields)=>{
                                
                                //we need to insert the slug here 
                                conn.query("INSERT INTO farmer_slugs (slug,user_id)  SELECT CONCAT(LOWER(REPLACE(nume_firma,' ','-')),'-',REPLACE(cui,'RO','')) as slug,sent_by from req_farmers where id = "+parseInt(req_id)+"  ",(err,results,fields)=>{
                                    conn.release();
                                    if (err){
                                        rej();
                                    }
                                    else
                                    {
                                        res();
                                    }
                                })
                            })
                        }
                    })
                }
            })
        })
    }

    function decline_req(req_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else
                {
                    conn.query("UPDATE req_farmers set status = 2 where id = "+req_id+" ",(err,results,fields)=>{
                        conn.release();
                        if(err){
                            
                            rej();
                        }
                        else{
                           res();
                        }
                    })
                }
            })
        }) 
    }
    function accept_b2b_req(req_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else
                {
                    conn.query("UPDATE req_b2b set status = 1 where id = "+req_id+" ",(err,results,fields)=>{
                        if(err){
                            conn.release();
                            rej();
                        }
                        else{
                            conn.query("UPDATE users set account_type = 2 where id = (Select sent_by from req_b2b where id = "+req_id+") ",(err,results,fields)=>{
                                conn.release();
                                if (err){
                                    rej();
                                }
                                else
                                res();
                            })
                        }
                    })
                }
            })
        })
    }

    function decline_b2b_req(req_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else
                {
                    conn.query("UPDATE req_b2b set status = 2 where id = "+req_id+" ",(err,results,fields)=>{
                        conn.release();
                        if(err){
                            
                            rej();
                        }
                        else{
                           res();
                        }
                    })
                }
            })
        }) 
    }
    function get_users(start,limit,conds){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();

                }
                else{
                    let where = "";
                    conds.map(column=>{
                        if (column.data!=null && column.search.value.trim()!=""){
                            //we have a search 
                            where += `WHERE ${column.data} LIKE "%${column.search.value}%" AND `;
                        }

                    })
                    if (where.length>0)
                    where = where.slice(0,-4);

                    conn.query("SELECT users.id,username,phone_number,email,'',frv_promovati.id as test,users.account_type from users LEFT join frv_promovati on frv_promovati.user_id = users.id "+where+" LIMIT "+start+","+limit+" ",(err,results,fields)=>{
                        
                        if (err){
                            console.log(err);
                            conn.release();
                            rej();
                        }
                        else{
                            conn.query("SELECT COUNT(id) as total from users ",(err,results2,fields)=>{
                                conn.release();
                                if (err){
                                    rej();
                                }
                                else{
                                    res({"results":results,"total":results2[0].total});
                                }
                            })
                          
                        }
                    })
                }
            })
        })
    }

    function get_user_infos(user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT username,phone_number,email,phone_ver,email_ver,bis_name,account_type From users where id = "+parseInt(user_id)+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            res(results);
                        }
                    })
                }
            })
        })
    }

    function change_user_data_checker(data,user_id){
        //check the phone number 
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    let phone = update_client_phone_number(data?.phone_number,conn,user_id);
                    let email = update_client_email(data?.email,conn,user_id);
                    let username = update_client_username(data?.username,conn,user_id);

                    Promise.allSettled([phone,email,username]).then((response)=>{
                        let errors = [];
                        response.map(resp=>{
                            if (resp.status!="fulfilled")
                            {
                                errors.push(resp.reason);
                            }

                        })
                        console.log(errors);

                        if (errors.length==0){
                            //update 
                          conn.query("UPDATE users set phone_ver = IF(phone_number = "+mysql.escape(data.phone_number)+",phone_ver,1),email_ver = IF(email = "+mysql.escape(data.email)+",email_ver,1), username = "+mysql.escape(data.username)+", phone_number = "+mysql.escape(data.phone_number)+",email = "+mysql.escape(data.email)+",bis_name = "+mysql.escape(data.bis_name)+" WHERE id = "+parseInt(user_id)+" ",(err,results,fields)=>{
                              conn.release();
                              if (err){
                                  rej();
                              }
                              else{
                                  res();
                              }
                          })
                        }
                        else
                        {
                            rej(errors);
                        }
                    })
                }
            })
        })

    }

    function update_client_phone_number(phone,conn,user_id){
        return new Promise((res,rej)=>{
            conn.query("SELECT id from users where phone_number = "+mysql.escape(phone.trim())+" AND id!= "+parseInt(user_id)+" ",(err,results,fields)=>{
                if (err){
                    rej({"field":"phone_number","reason":"Eroare de server"});
                }
                else{
                    if (results.length==0){
                        //it's ok 
                        //we can update 
                        res(true);
                    }
                    else{
                            rej({"field":"phone_number","reason":"Numarul este deja folosit! (de catre "+results[0].id+")"});
                        
                    }
                }
            })
        })
    }
    function update_client_email(email,conn,user_id){
        return new Promise((res,rej)=>{
            conn.query("SELECT id from users where email = "+mysql.escape(email.trim())+" AND id!= "+parseInt(user_id)+" ",(err,results,fields)=>{
                if (err){
                    rej({"field":"email","reason":"Eroare de server"});
                }
                else{
                    if (results.length==0)
                    {
                        res(true);
                    }
                    else{                      
                     rej({"field":"email","reason":"Adresa de email este deja folosita!  (de catre "+results[0].id+")"});                        
                    }
                }
            })
        })
    }
    function update_client_username(username,conn,user_id){
        return new Promise((res,rej)=>{
            conn.query("SELECT id from users where username = "+mysql.escape(username.trim())+" AND id!= "+parseInt(user_id)+" ",(err,results,fields)=>{
                if (err){
                    rej({"field":"username","reason":"Eroare de server"});
                }
                else{
                    if (results.length==0){
                        res();
                    }
                    else{
                        rej({"field":"username","reason":"Username este deja folosit!  (de catre "+results[0].id+")"});                                                   
                    }
                }
            })
        })
    }

    function get_adjacent(){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();

                }
                else{
                    conn.query("SELECT * FROM frv_cat_tree",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            res(results);
                        }
                    })
                }
            })
        })
    }

    function insert_cat(cat,parent_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    //insert the cat first 
                    let slug = cat.toLowerCase().trim().replace(" ","-");
                    conn.query("INSERT INTO frm_cats (categorie,slug) VALUES ("+mysql.escape(cat)+","+mysql.escape(slug)+")",(err,results,fields)=>{
                        if (err){
                            console.log(err);
                            conn.release();
                            rej();
                        }
                        else{
                            let cat_id = results.insertId
                            //insert into tree 
                            conn.query("INSERT INTO frv_cat_tree VALUES("+parseInt(parent_id)+","+parseInt(cat_id)+")",(err,results,fields)=>{
                                if (err){
                                    console.log(err);
                                    //delete
                                    conn.query("DELETE FROM frm_cats where id = "+parseInt(cat_id)+" ",(err,results,fields)=>{
                                        conn.release();
                                        rej();
                                    })
                                }
                                else{
                                    conn.release();
                                    res(cat_id);
                                }
                            })
                        }
                    })
                }
            })
        })
    }

    function delete_cat(cat_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    //first delete all the cats that are bound to this 
                    conn.query("Delete from frm_cats where frm_cats.id in (select child from (select * from frv_cat_tree order by parent, child) s, (select @pv := '"+parseInt(cat_id)+"') initialisation where find_in_set(parent, @pv) > 0 and @pv := concat(@pv, ',', child)) or frm_cats.id = "+parseInt(cat_id)+" ",(err,results,fields)=>{
                        if (err){
                            conn.release();
                            rej();
                        }
                        else{
                            conn.query("DELETE FROM frv_cat_tree where parent = "+parseInt(cat_id)+" OR child = "+parseInt(cat_id)+" ",(err,results,fields)=>{
                                conn.release();
                                if (err){
                                    rej();
                                }
                                else{
                                    res();
                                }
                            })
                        }
                    }) 

                }
            })
        })
    }



    function is_req_farmer_spam(user_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT id from req_farmers where sent_by = "+parseInt(user_id)+" and status = 0 LIMIT 1",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            if (results.length==0)
                            {
                                res(false);
                            }
                            else{
                                res(true);
                            }
                        }
                    })
                }
            })
        })
    }

    function is_b2b_farmer_spam(user_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT id from req_b2b where sent_by = "+parseInt(user_id)+" and status = 0 LIMIT 1",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            if (results.length==0)
                            {
                                res(false);
                            }
                            else{
                                res(true);
                            }
                        }
                    })
                }
            })
        })
    }

    function insert_prom(user_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();

                }
                else{
                    conn.query("INSERT IGNORE INTO frv_promovati (user_id) VALUES ("+parseInt(user_id)+")",(err,results,fields)=>{
                            conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            res();
                        }
                    })

                }
            })
        })
    }

    function delete_prom(user_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();

                }
                else{
                    conn.query("DELETE from frv_promovati where user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
                            conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            res();
                        }
                    })

                }
            })
        })
    }

    function get_promovati()
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT users.bis_name, farmer_slugs.slug, user_profile_images.image_name as image_name,CONCAT(UPPER(SUBSTRING(frv_descrieri.descriere,1,1)),LOWER(SUBSTRING(frv_descrieri.descriere,2))) as descc,(SELECT CONCAT('[',GROUP_CONCAT(json_object('name',name,'prod_id',frv_prods.id,'pre_order',IF(frv_prods.sel_type=2,true,false),'slug',slug,'user_slug',(SELECT slug from farmer_slugs where user_id = frv_promovati.user_id),'prod_image',(SELECT file_name from frv_prod_images where product_id = frv_prods.id order by pic_index ASC LIMIT 1) )),']') from frv_prods where frv_prods.user_id = frv_promovati.user_id LIMIT 1) as prods from frv_promovati join users on users.id = frv_promovati.user_id  left join frv_descrieri on frv_descrieri.user_id = frv_promovati.user_id join farmer_slugs on farmer_slugs.user_id = frv_promovati.user_id LEFT join user_profile_images on user_profile_images.user_id = frv_promovati.user_id and user_profile_images.show_image = 1 LIMIT 5",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            console.log(err);
                            rej();
                        }
                        else{
                            for (index in results)
                            {
                                results[index].prods = JSON.parse(results[index].prods);
                            }
                            res(results);
                        }
                    })
                }
            })
        })
    }

    function login_admin(user,pass)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT id from admins where name = "+mysql.escape(user)+" and pass = "+mysql.escape(pass)+" LIMIT 1",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            if (results.length==0)
                                {
                                    rej();
                                }
                                else{
                                    res(results[0].id);
                                }
                        }
                    })
                }
            })
        })
    }

    function get_name_from_req(req_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT nume,prenume,email,tel from req_farmers where id = "+parseInt(req_id)+" LIMIT 1",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            if (results.length!=0)
                            res(results[0]);
                            else{
                                rej();
                            }
                        }
                    })
                }
            })
        })
    }


    function check_contact_request(data)
    {
        let errs = {};
        console.log(data);
        Object.keys(data).map((key)=>{
           // console.log(key);
            let val = data[key];

            if (val.trim()!="")
            {
                if (key.trim() == "phone_number")
                {
                    //check 
                    if (!phone_regexp.test(val))
                    errs[key] = "Telefonul nu este valid!";
                }
                else if (key.trim() == "email")
                {
                  //  console.log(val);
                    //check\
                    if (!email_valid.test(val))
                        errs[key] = "Adresa de email nu este validă!";
                }
            }
            else{
                errs[key] = "Câmpul nu este completat";
            }
        })

        return errs;
    }

    function is_there_contact_form(data)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT id from adm_contact where (email = "+mysql.escape(data.email.trim())+" or tel = "+mysql.escape(data.phone_number.trim())+") and status = 0 ",(err,result,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            res(result.length);
                        }
                    })
                }
            })
        })
    }
    function insert_contact(data){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    //insert 
                    conn.query("INSERT INTO adm_contact (nume,email,tel,sub,msg) VALUES("+mysql.escape(data.name.trim())+","+mysql.escape(data.email.trim())+","+mysql.escape(data.phone_number.trim())+","+mysql.escape(data.msg_subject.trim())+","+mysql.escape(data.message.trim())+") ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            res();
                        }
                    })
                }
            })
        })
    }


    function is_there_q_form(data)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT id from adm_questions where (email = "+mysql.escape(data.email.trim())+" or tel = "+mysql.escape(data.phone_number.trim())+") and status = 0 ",(err,result,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            res(result.length);
                        }
                    })
                }
            })
        })
    }
    function insert_q(data){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    //insert 
                    conn.query("INSERT INTO adm_questions (nume,email,tel,sub,msg) VALUES("+mysql.escape(data.name.trim())+","+mysql.escape(data.email.trim())+","+mysql.escape(data.phone_number.trim())+","+mysql.escape(data.msg_subject.trim())+","+mysql.escape(data.message.trim())+") ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            res();
                        }
                    })
                }
            })
        })
    }

module.exports = {
    init,get_b2b_orders,get_key_words,get_prods,order_by_distance,send_offer,get_prod_offers,update_status,insert_counter_offer,get_offers_for_cid,send_direct_offer,get_farmers,get_avize,add_aviz,remove_aviz,get_unique_request_id,
    insert_farmer_request_data,insert_avize_details,get_f_reqs,get_un_id,get_all_avize,update_farmer_req_data,accept_req,decline_req,get_users,get_user_infos,change_user_data_checker,insert_b2b_request_data,
    get_b_reqs,update_b2b_req_data,get_un_id_b2b,accept_b2b_req,decline_b2b_req,get_adjacent,insert_cat,delete_cat,is_req_farmer_spam,is_b2b_farmer_spam,insert_prom,delete_prom,get_promovati,
    login_admin,get_name_from_req,check_contact_request,insert_contact,is_there_contact_form,insert_q,is_there_q_form
}