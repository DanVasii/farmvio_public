var mysql,pool,logger;

var order_generator = require("order-id")('mysecret');

mysql = pool = null;

function init(p,m,l){
    pool = p;
    mysql = m;
    logger=  l;
}

function get_infos_for_guest(session){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                let data_resp = {};
            //create the proeduct_ids array 
                    let point_ids = [];
                    session = JSON.parse(session);

                    for (index in session)
                    {
                        point_ids.push(session[index].point_id);
                    }

                    let name_promise = get_sold_by_who(point_ids.join(","),conn);

                    let point_name_promise = get_point_name(point_ids.join(","),conn);

            //firstly, lets get the seller name 
                    Promise.allSettled([name_promise,point_name_promise]).then((response)=>{
                        console.log(response);
                            conn.release();
                            if (response[0].status == "fulfilled" && response[1]['status'] == "fulfilled"){
                            data_resp.seller_names = response[0].value;
                            data_resp.point_names = response[1].value;
                                res(data_resp);
                        }
                            else{
                                rej("mysql");
                            }
                    })
            }   
        })
    })

}

function get_sold_by_who(array,conn){
    return new Promise((res,rej)=>{
        conn.query("SELECT users.bis_name,frv_wpoints.id from users join frv_wpoints on users.id = frv_wpoints.farm_owner AND frv_wpoints.id IN ("+array+") ",(err,results,fields)=>{
            if (err){
                console.log(err);
                rej("mysql");
            }
            else{
               // console.log(results);
                res(results);
            }
        })
    })
}

function get_point_name(array,conn){
    return new Promise((res,rej)=>{
        conn.query("SELECT judet,oras,adresa,id FROM frv_wpoints WHERE id in ("+array+") ",(err,results,fields)=>{
            if (err){
                console.log(err);
                rej("mysql");
            }
            else{
                //console.log(results);
                res(results);
            }
        })
    })
}

const elems = ['judet','oras','strada','nr_st','bloc','scara','apt','etaj','interfon','cod','nume','tel'];

function validate_address(data){
        for (index in elems){
            if (!data[elems[index]] || data[elems[index]].length==0){
                return false;
            }
        }
        return true;
}


function insert_addr(data,user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                //run the query 
                conn.query("INSERT INTO frv_address (user_id,judet,oras,strada,numar,bloc,scara,apt,etaj,interfon,cod,nume,telefon,active) VALUES("+user_id+","+mysql.escape(data.judet)+","+mysql.escape(data.oras)+","+mysql.escape(data.strada)+","+data.nr_st+","+mysql.escape(data.bloc)+","+mysql.escape(data.scara)+","+mysql.escape(data.apt)+","+mysql.escape(data.etaj)+","+mysql.escape(data.interfon)+","+mysql.escape(data.cod)+","+mysql.escape(data.nume)+","+mysql.escape(data.tel)+",1)",(err,results,fields)=>{
                    
                    if (err){
                        console.log(err);
                        rej("mysql");
                    }
                    else{
                        conn.query("UPDATE frv_address set active = 0 where id != "+results.insertId+" and user_id = "+user_id+" ",(err,results,fields)=>{
                            conn.release();
                        })
                        res(results.insertId);
                    }
                })
            }
        })
    })
 
}

function create_big_order(user_id,couriers,cart,addr,try_number = 0){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{   
                console.log("INTRA ")
         
                //generate the order_id and check if it is unique                
                let order_id = order_generator.generate();

                conn.query("SELECT id from frv_orders where order_id = "+mysql.escape(order_id)+" ",(err,results,fields)=>{
                    if (err){
                        console.log(err);
                        conn.release();
                        if (try_number<3)
                                    create_big_order(user_id,couriers,cart,addr,try_number+1);
                         else
                         rej();
                    }
                    else{
                        if (results.length==0){
                            //its ok, we can insert the address
                            conn.query("INSERT INTO frv_order_addr (judet,oras,strada,numar,bloc,scara,apt,etaj,interfon,cod,nume,telefon)" +
                            "VALUES ("+mysql.escape(addr.judet)+","+mysql.escape(addr.oras)+","+mysql.escape(addr.strada)+","+addr.numar+","+mysql.escape(addr.bloc)+","+mysql.escape(addr.scara)+","+mysql.escape(addr.apt)+","+addr.etaj+","+mysql.escape(addr.interfon)+","+mysql.escape(addr.cod)+","+mysql.escape(addr.nume)+","+mysql.escape(addr.telefon)+") ",(err,results,fields)=>{
                                if (err){
                                    console.log(err);
                                    conn.release();
                                    if (try_number<3)
                                    create_big_order(user_id,couriers,cart,addr,try_number+1);
                                    else
                                    rej();
                                }
                                else{
                                    let addr_id = results.insertId;
                                    //insert the big order 
                                    conn.query("INSERT INTO frv_orders (order_id,by_user_id,address_id) VALUES("+mysql.escape(order_id)+","+user_id+","+addr_id+") ",(err,results,fields)=>{
                                        if (err){
                                            console.log(err);
                                            conn.release();
                                            if (try_number<3)
                                            create_big_order(user_id,couriers,cart,addr,try_number+1);
                                            else
                                            rej();
                                        }
                                        else{
                                            //ok, let's insert the small orders 
                                            let chunks = []; 
                                            for (index in couriers){
                                                //for every point 
                                                //check if the point is in my cart 
                                                for (index_cart in cart){
                                                    if (cart[index_cart].point_id == couriers[index].point_id)
                                                    {
                                                        //run   the function 
                                                        chunks.push(insert_small_order(conn,order_id,couriers[index].point_id,couriers[index].c_id));

                                                        break;
                                                    }
                                                }
                                            }
                                            //here we check the small orders 
                                            Promise.allSettled(chunks).then((response)=>{
                                                
                                                for (index in response){
                                                    if (response[index].status != "fulfilled")
                                                    {
                                                        rej();
                                                        //TODO
                                                        //function to delete everything 
                                                        break;
                                                    }
                                                }
                                                    let product_promises = [];
                                                //if we made it here, then the small orders got inserted, now it's time for the order content 
                                                for (index in response){
                                                    //we get the value and insert the prod
                                                    let child_order_id = response[index].value;
                                                    //now we should the point id 
                                                    let point_id = child_order_id.split("_")[1];
                                                    //foreach product on this point_id, insert 
                                                    for (index_cart in cart){
                                                        if (cart[index_cart].point_id == point_id){
                                                            product_promises.push(insert_prod_product(conn,child_order_id,cart[index_cart].product_id,point_id,cart[index_cart].qty,cart[index_cart].price));
                                                        }
                                                    }

                                                }

                                                Promise.allSettled(product_promises).then((reponse)=>{
                                                    for (index in response){
                                                        if (response[index].status != "fulfilled")
                                                        {
                                                            rej();
                                                        //TODO
                                                        //function to delete everything 
                                                            break;
                                                        }
                                                    }
                                                    res();
                                                })

                                            })


                                        }
                                    })                                                                      
                                }
                            })

                        }
                        else{
                            conn.release();
                            create_big_order(user_id,cart,addr,try_number);
                        }
                    }
                })


            }
        })
    })
}

function insert_small_order(conn,parent,point_id,courier_id,try_number = 0)
{
    return new Promise((res,rej)=>{
        let chunk_order_id = parent+ "_"+point_id;
        //insert 
        conn.query("INSERT INTO frv_order_chunk (parent_order,child_order_id,point_id,courier_id) VALUES ("+mysql.escape(parent)+","+mysql.escape(chunk_order_id)+","+point_id+","+courier_id+") ",(err,results,fields)=>{
            if (err){
                console.log(err);
                //retry 
                if (try_number<3){
                    return insert_small_order(conn,parent,point_id,courier_id,try_number+1);
                }
                else
                rej();
            }
            else{
                res(chunk_order_id);
            }
        })
})
}


function insert_prod_product(conn,child_order_id,prod_id,point_id,qty,price,try_number=0)
{
    return new Promise((res,rej)=>{
        conn.query("INSERT INTO frv_ordered_prods (child_order_id,prod_id,point_id,qty,price) VALUES ("+mysql.escape(child_order_id)+","+prod_id+","+point_id+","+qty+","+price+") ",(err,results,fields)=>{
            if (err){
                if (try_number<3){
                    return insert_prod_product(conn,child_order_id,prod_id,point_id,qty,price,try_number+1);
                }
                else{
                    rej();
                }
            }
            else{
                res();
            }
        })
    })
}


function get_farmer_orders(farmer_id){
   
  
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                //now we should parse the orders 
                conn.query("SELECT frv_order_props.comments,frv_order_props.prop_id,frv_order_chunk.child_order_id,frv_order_chunk.point_id,courier_id,status,frv_ordered_prods.prod_id,frv_ordered_prods.qty,frv_prods.name,frv_prod_images.file_name,frv_orders.by_user_id FROM frv_order_chunk join frv_orders on frv_orders.order_id = frv_order_chunk.parent_order JOIN frv_wpoints on farm_owner = "+farmer_id+" and frv_wpoints.id = point_id JOIN frv_ordered_prods on frv_ordered_prods.child_order_id = frv_order_chunk.child_order_id join frv_prods ON frv_prods.id = frv_ordered_prods.prod_id left join frv_prod_images on frv_prod_images.product_id = frv_ordered_prods.prod_id and frv_prod_images.pic_index = (SELECT pic_index from frv_prod_images where frv_prod_images.product_id = frv_ordered_prods.prod_id ORDER BY frv_prod_images.pic_index ASC LIMIT 1) LEFT JOIN frv_order_props on frv_order_props.id = (SELECT frv_order_props.id from frv_order_props where frv_order_props.order_id = frv_order_chunk.child_order_id ORDER BY frv_order_props.id DESC limit 1) ORDER BY frv_orders.date DESC",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej("mysql");
                    }
                    else{
                        res(results);
                    }
                })
            }
        })
    })
}

function is_this_my_order(user_id,order_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                conn.query("SELECT id from frv_wpoints where frv_wpoints.id = (SELECT point_id from frv_order_chunk where child_order_id = "+mysql.escape(order_id)+" ) AND frv_wpoints.farm_owner = "+user_id+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej("mysql");
                    }
                    else{
                        if (results.length==0){
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

function is_this_my_client_order(user_id,order_id)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if(err){
                rej("mysql");
            }
            else{
                console.log("test")
                conn.query("SELECT frv_orders.id FRom frv_orders where frv_orders.by_user_id = "+user_id+" and frv_orders.order_id = (SELECT frv_order_chunk.parent_order from frv_order_chunk where frv_order_chunk.child_order_id = "+mysql.escape(order_id)+" LIMIT 1) ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        console.log(err);
                        rej("mysql");
                    }
                    else{
                        console.log(results);
                        if (results.length==0){
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

function get_infos(order_id){
    return new Promise((res,rej)=>{
        //first check the data
        let errors = {}; 
        if (!order_id.trim().length!=0){
            errors['order_id'] = "Order id not valid!";
        }
       

        if (Object.keys(errors).length==0)
        {
            //continue
            pool.getConnection((err,conn)=>{
                if (err){
                    console.log("fds");
                    rej("mysql");
                }
                else{
                    //get courier id 
                    //calc the cost
                    //first we need to addresses 
                    //here,order id is child order id
                    get_addresses(order_id,conn).then((addresses)=>{
                        //now get the corier_id
                        get_courier_id(order_id,conn).then((c_id)=>{
                            conn.release();
                            console.log(c_id)
                            res({
                                "c_id":c_id,
                                "address":addresses
                            })
                        }).catch((err)=>{
                            console.log(err);
                            conn.release();
                            rej();
                        })

                    }).catch((err)=>{
                        console.log(err);
                        conn.release();
                        rej();
                    })
                }
            })
        }
        else{
            conn.release();
            console.log("fds");
            res({"err":errors});
        }
    })  
}

function get_courier_id(order_id,conn){
    return new Promise((res,rej)=>{
        conn.query("SELECT courier_id from frv_order_chunk where child_order_id = "+mysql.escape(order_id)+" ",(err,results,fields)=>{
            if (err){
                console.log(err);
                rej("mysql");
            }
            else{
                if (results.length!=0)
                res(results[0].courier_id);
                else{
                    rej();
                }
            }
        })
    })
}


function get_addresses(order_id,conn){
    return new Promise((res,rej)=>{
        //we only need point address and user_address
        conn.query("SELECT frv_wpoints.judet,frv_wpoints.adresa,frv_wpoints.oras,frv_wpoints.nr,frv_wpoints.cod from frv_wpoints where frv_wpoints.id = (SELECT frv_order_chunk.point_id from frv_order_chunk where frv_order_chunk.child_order_id = "+mysql.escape(order_id)+" LIMIT 1) UNION ALL SELECT frv_order_addr.judet,frv_order_addr.strada,frv_order_addr.oras,frv_order_addr.numar,frv_order_addr.cod from frv_order_addr where frv_order_addr.id = (SELECT frv_orders.address_id from frv_orders where frv_orders.order_id = (SELECT frv_order_chunk.parent_order from frv_order_chunk where frv_order_chunk.child_order_id = "+mysql.escape(order_id)+" LIMIT 1))",(err,results,fields)=>{
            if (err){
                console.log(err);
                rej("mysql");
            }
            else{
                console.log(results);
                if (results.length!=2){
                    rej("Something not ok");
                }
                else
                {
                    res(results);
                }
            }
        })
    })
}

function insert_private_cost(price,date_est,order_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                console.log("fds");
                conn.query("INSERT INTO frv_costs (order_id,cost,del_est) VALUES ("+mysql.escape(order_id)+","+mysql.escape(price)+","+mysql.escape(date_est)+")",(err,results,fields)=>{
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

function insert_cost(sizes,order_id,price){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                conn.query("INSERT INTO frv_costs (order_id,weight,width,height,length,cost) VALUES ("+mysql.escape(order_id)+","+sizes.weight+","+sizes.width+","+sizes.height+","+sizes.len+","+price+") ",(err,results,fields)=>{
                    
                    if (err){
                        rej("mysql");
                    }
                    else{
                        //update the status
                        conn.query("UPDATE frv_order_chunk set status = 1 where child_order_id = "+mysql.escape(order_id)+" ",(err,results,fields)=>{
                            conn.release();
                            if (err){
                                //TODO 
                                //DELETE THE PRICE EST
                                rej("mysql");

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



function get_sent_orders(user_id)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");

            }
            else{
                conn.query("Select frv_costs.cost,frv_order_chunk.status,p.order_id,frv_order_chunk.child_order_id,frv_order_addr.*,frv_ordered_prods.qty,frv_ordered_prods.price,frv_prods.name,(SELECT file_name from frv_prod_images where frv_prod_images.product_id = frv_prods.id ORDER by pic_index ASC LIMIT 1) as prod_image,frv_prod_images.file_name,frv_order_chunk.courier_id,date,users.id as user_id,users.bis_name,(SELECT slug from farmer_slugs where user_id = users.id) as farmer_slug,(SELECT image_name from user_profile_images where user_id = users.id and show_image = 1 LIMIT 1) as farmer_image from (SELECT order_id,address_id,date from frv_orders where by_user_id = "+user_id+" )  p  join frv_order_chunk on frv_order_chunk.parent_order = p.order_id  join frv_order_addr on frv_order_addr.id = p.address_id  join frv_ordered_prods on frv_ordered_prods.child_order_id = frv_order_chunk.child_order_id  join frv_prods on frv_prods.id = frv_ordered_prods.prod_id  join users on users.id = frv_prods.user_id join frv_prod_images on frv_prod_images.product_id = frv_prods.id AND frv_prod_images.pic_index = (SELECT min(pic_index) FROM frv_prod_images where frv_prod_images.product_id = frv_ordered_prods.prod_id ) left  JOIN frv_costs on frv_costs.order_id = frv_order_chunk.child_order_id",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej("mysql");
                    }
                    else{
                        res(results);
                    }
                })
            }
        })
    })
}

function update_status(order_id,status){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                conn.query("UPDATE frv_order_chunk set status = "+status+"  WHERE child_order_id = "+mysql.escape(order_id)+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej("mysql");
                    }
                    else{
                        res();
                    }
                })
            }
        })
    })
}

function get_all_user_addresses(user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");

            }
            else{
                conn.query("SELECT * from frv_address where user_id = "+user_id+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej("mysql");
                    }
                    else{
                        res(results);
                    }
                })
            }
        })
    })
}

function delete_addr(user_id,a_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                try{
                a_id = parseInt(a_id);
                conn.query("DELETE FROM frv_address where user_id = "+user_id+" AND id = "+a_id+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej("mysql");
                    }
                    else{
                        res();
                    }
                })
                }
                catch{
                    rej();
                }
            }
        })
    })
}
 
        function set_active_addr(a_id,user_id){
            return new Promise((res,rej)=>{
                pool.getConnection((err,conn)=>{
                    if (err){
                        rej("mysql");
                    }
                    else{
                        a_id = parseInt(a_id);
                        //first we update 
                        conn.query("UPDATE frv_address SET active = Case when id!= "+a_id+" then 0 when id = "+a_id+" then 1 END WHERE user_id = "+user_id+" ",(err,results,fields)=>{
                            conn.release();
                            if (err){
                                console.log(err);
                                rej("mysql");
                            }
                            else{
                                res();
                            }
                        })
                    }
                })
            })
        }
        function get_active_address(user_id){
            return new Promise((res,rej)=>{
                pool.getConnection((err,conn)=>{
                    if (err){
                        rej("mysql");
                    }
                    else{
                        conn.query("SELECT * from frv_address where user_id = "+parseInt(user_id)+" and active = 1 ORDER BY added_at DESC LIMIT 1 ",(err,results,fields)=>{
                            conn.release();
                            if (err){
                                console.log(err);
                                rej("mysql");
                            }
                            else{
                                console.log("ADRESA");
                                console.log(results);
                                res(results);
                            }
                        })
                    }
                })
            })
        }

        function pending_order(user_id)
        {
            console.log(user_id);
            return new Promise((res,rej)=>{
                pool.getConnection((err,conn)=>{
                    if (err){
                        rej("mhysql");

                    }
                    else{
                        conn.query("SELECT count(*) as pending_order from frv_order_chunk JOIN frv_wpoints on frv_order_chunk.point_id = frv_wpoints.id AND frv_wpoints.farm_owner = "+user_id+" where frv_order_chunk.status = 2 Union all select count(*) as new_orders from frv_order_chunk join frv_wpoints on frv_order_chunk.point_id = frv_wpoints.id and frv_order_chunk.status = 0 and frv_wpoints.farm_owner  = "+user_id+" union all select count(*) as done_orders from frv_order_chunk  join frv_wpoints on frv_wpoints.id = frv_order_chunk.point_id and frv_wpoints.farm_owner = "+user_id+" and (frv_order_chunk.status = 5 or frv_order_chunk.status = 6) ",(err,results,fields)=>{
                            conn.release();
                            console.log(results);
                            if (err){
                                console.log(err);
                                rej("mysql");
                            }
                            else{
                                res(results);
                            }
                        })
                
                    }
                })
            })
        }
        function get_addresses_for_courier(order_id,farmer_id){
            return new Promise((res,rej)=>{
                pool.getConnection((err,conn)=>{
                    if (err){
                        rej("mysql");
                    }
                    else{
                        //start getting th data 
                        let point = get_point_address(order_id,farmer_id,conn);
                        let user = get_user_order_addr(order_id,conn);
                        Promise.allSettled([point,user]).then((response)=>{
                            let err;
                            conn.release();
                            console.log(response);  
                            if (response[0].status != "fulfilled" || response[1].status != "fulfilled")
                            {
                                rej();
                            }
                            else{
                                //point,user
                                res([response[0].value,response[1].value]);
                            }
                        })
                    }
                })
            })
        }
        function get_point_address(order_id,farmer_id,conn){
            return new Promise((res,rej)=>{
                conn.query("SELECT judet,oras,adresa,nr,cod from frv_wpoints join frv_order_chunk on frv_wpoints.id = frv_order_chunk.point_id AND frv_order_chunk.child_order_id = "+mysql.escape(order_id)+" where farm_owner  = "+farmer_id+" ",(err,results,fields)=>{
                    if (err){
                        console.log(err);
                        rej("mysql");
                    }
                    else{
                        if (results.length!=0)
                        res(results[0]);
                        else
                        {
                            rej();
                        }
                    }
                })
            })
            
        }
        function get_user_order_addr(order_id,conn){
            return new Promise((res,rej)=>{
                conn.query("SELECT judet,oras,strada,numar,bloc,scara,apt,etaj,interfon,cod from frv_order_addr where id = (Select address_id from frv_orders where order_id = (Select parent_order from frv_order_chunk where child_order_id = "+mysql.escape(order_id)+" LIMIT 1))",(err,results,fields)=>{
                    if (err){
                        console.log(err);
                        rej("mysql");
                    }
                    else{
                        if (results.length==0){
                            rej();
                        }
                        else{
                            res(results[0]);
                        }
                    }
                })
            })
        }   
        function get_contacts(child_order_id,user_id)
        {
            return new Promise((res,rej)=>{
                pool.getConnection((err,conn)=>{
                    if (err){
                        rej("mysql");
                    }
                    else{
                        let farmer_contact = get_farmer_contact(user_id,conn);
                        let user_contact = get_user_contact(child_order_id,conn);
                        Promise.allSettled([farmer_contact,user_contact]).then((response)=>{
                            conn.release();
                            if (response[0].status!= "fulfilled" || response[1].status!="fulfilled")
                            {
                                rej();
                            }
                            else
                            {
                                res([response[0].value,response[1].value]);
                            }
                        })
                    }
                })
            })
        }
        function get_user_contact(order_id,conn){
            return new Promise((res,rej)=>{
                conn.query("SELECT nume,telefon from frv_order_addr where id = (SELECT address_id from frv_orders where order_id = (SELECT parent_order from frv_order_chunk where child_order_id = "+mysql.escape(order_id)+" LIMIT 1))",(err,results,fields)=>{
                    if (err){
                        rej("mysql");
                    }
                    else 
                    {
                        if (results.length == 0)
                        rej();
                        else{
                            res(results[0]);
                        }
                    }
                })
            })
        }
        function get_farmer_contact(user_id,conn)
        {
            return new Promise((res,rej)=>{
                conn.query("Select phone_number,bis_name FROM users where id = "+user_id+"",(err,results,fields)=>{
                    if (err){
                        rej();
                    }
                    else{
                        if (results.length!=0)
                        res(results[0])
                        else
                        rej();
                    }
                })
            })
        }

        function get_sizes(child_order_id){
            return new Promise((res,rej)=>{
                pool.getConnection((err,conn)=>{
                    if (err){
                        rej();
                    }
                    else{
                        conn.query("Select weight,width,height,length FROm frv_costs where order_id = "+mysql.escape(child_order_id)+" ",(err,results,fields)=>{
                            conn.release();
                            if (err){
                                rej("mysql");
                            }
                            else{
                                if (results.length==0){
                                    rej();
                                }
                                else{
                                    res(results[0]);
                                }
                            }
                        })
                    }
                })
            })
        }

        function get_courier_id_order(child_order_id){
            return new Promise((res,rej)=>{
                pool.getConnection((err,conn)=>{
                    if (err){
                        rej();
                    }
                    else
                    {
                        conn.query("SELECT courier_id from frv_order_chunk where child_order_id  = "+mysql.escape(child_order_id)+" ",(err,results,fields)=>{
                            conn.release();
                            if (err){
                                rej();
                            }
                            else{
                                if (results.length==0){
                                    rej();
                                }
                                else
                                {
                                    res(results[0].courier_id);
                                }
                            }
                        })
                    }
                })
            })
        }
        function insert_prop(order_id,comments,prop_id){
            return new Promise((res,rej)=>{
                pool.getConnection((err,conn)=>{
                    if (err){
                        rej("mysql");
                    }
                    else{
                        conn.query("INSERT INTO frv_order_props (order_id,comments,prop_id) VALUES ("+mysql.escape(order_id)+","+mysql.escape(comments)+","+prop_id+")",(err,results,fields)=>{
                            conn.release();
                            if (err){
                                rej("mysql");
                            }
                            else{
                                res();
                            }
                        })
                    }
                })
            })
        }

        function get_buyer_contact(order_id){
            return new Promise((res,rej)=>{
                pool.getConnection((err,conn)=>{
                    if (err){
                        rej("mysql");
                    }
                    else{
                        conn.query("SELECT frv_order_addr.nume,frv_order_addr.telefon from frv_order_addr where frv_order_addr.id = (SELECT frv_orders.address_id from frv_orders where frv_orders.order_id = (Select frv_order_chunk.parent_order from frv_order_chunk where frv_order_chunk.child_order_id = "+mysql.escape(order_id)+" LIMIT 1)) ",(err,results,fields)=>{
                            conn.release();
                            if (err){
                                rej();
                            }
                            else{
                                res(results[0]);
                            }
                        })
                    }
                })
            })
        }

        function is_eligible_for_proposal(order_id){
            //here we check if no other proposal were sent for this order_id as well as if the current_order_status equals 1
            //where status 1 is when the user can make some decisions about the order 
            return new Promise((res,rej)=>{
                pool.getConnection((err,conn)=>{
                    if (err){
                        rej();
                    }
                    else{
                       Promise.allSettled([select_number_of_proposals(order_id,conn),check_status_order(order_id,conn)]).then((results)=>{
                           for (index in results){
                               if (results[index].status!="fulfilled")
                               {
                                   //this is a problem , so we reject 
                                   rej();
                               }
                               res();
                           }
                       })
                    }
                })
            })
        }

        function select_number_of_proposals(order_id,conn,try_number = 0){
            return new Promise((res,rej)=>{
                conn.query("SELECT id from frv_order_props where order_id = "+mysql.escape(order_id)+" LIMIT 1",(err,results,fields)=>{
                    if (err){
                        if (try_number!=3){
                            return select_number_of_proposals(order_id,conn,try_number+1);
                        }
                        else{
                            rej();
                        }
                    }   
                    else{
                        if (results.length == 0){
                            //this is ok 
                            res(true);
                        }
                        else{
                            res(false);
                        }
                    }
                })
            })
        }

        function check_status_order(order_id,conn,try_number = 0){
            return new Promise((res,rej)=>{
                conn.query("SELECT id from frv_order_chunk where child_order_id = "+mysql.escape(order_id)+" AND status = 1 LIMIT 1",(err,results,fields)=>{
                    if (err){
                        if (try_number!=3){
                            return check_status_order(order_id,conn,try_number+1);
                        }
                        else{
                            rej();
                        }
                    }   
                    else{
                        if (results.length == 0){
                            //this is nok 
                            res(false);
                        }
                        else{
                            res(true);
                        }
                    }
                })
            })
        }

        function is_status(order_id,status){
            return new Promise((res,rej)=>{
                pool.getConnection((err,conn)=>{
                    if (err){
                        rej();
                    }
                    else{
                        conn.query("SELECT id from frv_order_chunk where child_order_id = "+mysql.escape(order_id)+" and status = "+status+" ",(err,results,fields)=>{
                            conn.release();
                            if (err){
                                rej();
                            }
                            else{
                                if (results.length==0){
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
    
        function update_hist(uid,hist,try_number = 0){
            return new Promise((res,rej)=>{
                pool.getConnection((err,conn)=>{
                    if (err){
                        logger.debug(err);
                        //retry     
                        if (try_number!=3){
                            update_hist(uid,hist,try_number+1);
                        }
                        else
                        rej();
                    }
                    else{
                        //first check if we have something 
                        conn.query("SELECT id from col_courier_status where Uid = "+mysql.escape(uid)+" LIMIT 1",(err,results,fields)=>{
                            if (err){
                                logger.debug(err);
                                conn.release();
                                if (try_number!=3){
                                    update_hist(uid,hist,try_number+1);
                                }
                                else
                               {
                                rej();
                            }
                            }
                            else{
                                if (results.length==0){
                                    //insert 
                                    conn.query("INSERT INTO col_courier_status (Uid,hist) VALUES ("+mysql.escape(uid)+","+mysql.escape(JSON.stringify(hist))+") ",(err,results,fields)=>{
                                            conn.release();
                                            if (err){
                                                logger.debug(err);
                                                if (try_number!=3){
                                                    update_hist(uid,hist,try_number+1);
                                                }
                                                else
                                               {
                                                rej();
                                            }   
                                            }
                                            else{
                                                res();
                                            }
                                    })
                                }
                                else{
                                    //update 
                                    conn.query("UPDATE col_courier_status SET hist = "+mysql.escape(JSON.stringify(hist))+" WHERE Uid = "+mysql.escape(uid)+" ",(err,results,fields)=>{
                                        conn.release();
                                        if (err){
                                            logger.debug(err);
                                            if (try_number!=3){
                                                update_hist(uid,hist,try_number+1);
                                            }
                                            else
                                           {
                                            rej();
                                        }   
                                        }
                                        else{
                                            res();
                                        }
                                })
                                }
                            }
                        })
                    }
                })
            })
        }

        function get_specific_order_details(farmer_id,order_id){
            return new Promise((res,rej)=>{
                pool.getConnection((err,conn)=>{
                    if (err){
                        rej();
                    }
                    else{
                        conn.query("SELECT frv_order_props.comments,frv_order_props.prop_id,frv_order_chunk.child_order_id,frv_order_chunk.point_id,courier_id,status,frv_ordered_prods.prod_id,frv_ordered_prods.qty,frv_prods.name,frv_prod_images.file_name FROM frv_order_chunk JOIN frv_wpoints on farm_owner = "+farmer_id+" and frv_wpoints.id = point_id JOIN frv_ordered_prods on frv_ordered_prods.child_order_id = frv_order_chunk.child_order_id join frv_prods ON frv_prods.id = frv_ordered_prods.prod_id left join frv_prod_images on frv_prod_images.product_id = frv_ordered_prods.prod_id and frv_prod_images.pic_index = (SELECT pic_index from frv_prod_images where frv_prod_images.product_id = frv_ordered_prods.prod_id ORDER BY frv_prod_images.pic_index ASC LIMIT 1) LEFT JOIN frv_order_props on frv_order_props.id = (SELECT frv_order_props.id from frv_order_props where frv_order_props.order_id = frv_order_chunk.child_order_id ORDER BY frv_order_props.id DESC limit 1) where frv_order_chunk.child_order_id = "+mysql.escape(order_id)+" ORDER BY frv_order_chunk.status DESC",(err,results,fields)=>{
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

        function get_specific_addr(addr_id,user_id){
            return new Promise((res,rej)=>{
                pool.getConnection((err,conn)=>{
                    if (err){
                        rej();
                    }
                    else{
                        conn.query("SELECT * from frv_address where id = "+parseInt(addr_id)+" and user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
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

        function get_raw_data(order_id){
            return new Promise((res,rej)=>{
                pool.getConnection((err,conn)=>{
                    if (err){
                        rej();
                    }
                    else{
                        conn.query("SELECT client.email as email_to,CONCAT('Telefon: ',users.phone_number) as phone_from,CONCAT('Email ',users.email) as email_from,frv_order_chunk.parent_order, frv_order_chunk.courier_id ,frv_wpoints.judet as judet_from,frv_wpoints.oras as oras_from,frv_wpoints.adresa as adresa_from, users.bis_name,frv_order_addr.judet as judet_to, frv_order_addr.oras as oras_to, CONCAT(frv_order_addr.strada,' ',frv_order_addr.numar) as strada_to, CONCAT(frv_order_addr.bloc,', ',frv_order_addr.scara,', ',frv_order_addr.apt,', ',frv_order_addr.cod) as detalii_to,frv_order_addr.nume, frv_order_addr.telefon as telefon_to, frv_orders.date,CONCAT('[',GROUP_CONCAT(json_object('name',frv_prods.name,'qty',frv_ordered_prods.qty,'price', frv_ordered_prods.price)),']') as prods,frv_costs.cost from frv_order_chunk   join frv_wpoints on frv_wpoints.id = frv_order_chunk.point_id join users on users.id = frv_wpoints.farm_owner join frv_orders on frv_orders.order_id = frv_order_chunk.parent_order join frv_order_addr on  frv_order_addr.id = frv_orders.address_id  join users client on client.id = frv_orders.by_user_id join frv_ordered_prods on frv_ordered_prods.child_order_id = "+mysql.escape(order_id)+" join frv_prods on frv_prods.id = frv_ordered_prods.prod_id left join frv_costs on frv_costs.order_id = "+mysql.escape(order_id)+" where frv_order_chunk.child_order_id = "+mysql.escape(order_id)+"",(err,results,fields)=>{
                            conn.release();
                            if (err){
                                console.log(err);
                                rej();
                            }
                            else
                            {
                                res(results);
                            }
                        })
                    }
                })
            })
        }
module.exports = {
    init,get_infos_for_guest,validate_address,insert_addr,create_big_order,get_farmer_orders,is_this_my_order,get_infos,insert_cost,get_sent_orders,is_this_my_client_order,update_status,get_all_user_addresses,delete_addr,
    set_active_addr,get_active_address,pending_order,get_addresses_for_courier,get_contacts,get_sizes,get_courier_id_order,insert_prop,get_buyer_contact,is_status,update_hist,get_specific_order_details,
    get_specific_addr,insert_private_cost,get_raw_data
}