const { response } = require("express");
const { check_addr } = require("./FarmManager");

var order_generator = require("order-id")('mysecret');

var mysql,pool;

mysql = pool = null;

function init(p,m){
    pool = p;
    mysql = m;
}


function parse_cart(user_id)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT  b2b_cart.id as cid,b2b_cart.prod_keyw,prod_details,b2b_cart.point_id,b2b_cart.id,b2b_cart.prod_qty,(SELECT file_name from frv_prod_images where frv_prod_images.product_id = b2b_cart.prod_id ORDER BY pic_index ASC LIMIT 1) as image,frv_wpoints.oras,frv_wpoints.adresa,users.bis_name,frv_prods.name from b2b_cart,frv_wpoints,users,frv_prods  where b2b_cart.user_id = "+user_id+" and  frv_prods.id = b2b_cart.prod_id and  frv_wpoints.id = b2b_cart.point_id and users.id = frv_wpoints.farm_owner union all select b2b_cart.id,b2b_cart.prod_keyw,b2b_cart.prod_details ,'',b2b_cart.id,b2b_cart.prod_qty,'','','','',''  from b2b_cart where b2b_cart.prod_id = -1 and b2b_cart.user_id = "+user_id+" ",(err,results,fields)=>{
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




function ato(user_id,data)
{
    return new Promise((res,rej)=>{
        let prod_id = data?.prod_id || null;
        let point_id = data?.point_id || null;
        let keyw = data?.keyw || null;
        let details = data?.details || " ";
        let qty = data?.qty || null;

        console.log(keyw);
        console.log(details);
        console.log(qty);
        if ( (prod_id && point_id && qty)  || (keyw && details && qty) )
        {
            pool.getConnection((err,conn)=>{
                if (err){
                    console.log(err);

                    rej();
                }
                else{
                    //decide what approach we are using 
                    if (prod_id){
                        //check if this already exists 
                        conn.query("SELECT id from b2b_cart where user_id = "+user_id+" and prod_id = "+prod_id+" and point_id = "+point_id+" ",(err,results,fields)=>{
                            if (err){
                                console.log(err);

                                conn.release();
                                rej();
                            }
                            else{
                                if (results.length == 0){
                                    //insert 
                                    conn.query("INSERT INTO b2b_cart (user_id,prod_id,prod_qty,point_id) VALUES ("+user_id+","+prod_id+","+qty+","+point_id+") ",(err,results,fields)=>{
                                        conn.release();
                                        if (err){
                                            console.log(err);

                                            rej();
                                        }
                                        else{
                                            res("i");
                                        }
                                    })
                                }
                                else{
                                    //update 
                                    conn.query("UPDATE b2b_cart SET prod_qty = prod_qty+1 WHERE user_id = "+user_id+" AND prod_id = "+prod_id+" AND point_id = "+point_id+" ",(err,results,fields)=>{
                                        conn.release();
                                        if (err){
                                            console.log(err);

                                            rej();
                                        }
                                        else{
                                            res("u");
                                        }
                                    })
                                }
                            }
                        })
                    
                    }
                    else{
                        keyw = keyw.split(/[\s,\n;\.]+/);
                        //we insert no matter what 
                        conn.query("INSERT INTO b2b_cart (user_id,prod_qty,prod_keyw,prod_details) VALUES ("+user_id+","+qty+","+mysql.escape(keyw.join(','))+","+mysql.escape(details)+") ",(err,results,fields)=>{
                            conn.release();
                            if (err){
                                console.log(err);
                                rej();

                            }
                            else{
                                res("i");
                            }
                        })

                    }
                }
            })
        }
        else{
            rej({"err":"Please complete all the fields"});
        }
    })
    
}

    function delete_custom_item(cid,user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("DELETE FROM b2b_cart where id = "+parseInt(cid)+" and user_id = "+parseInt(user_id)+" and prod_id = -1 ",(err,results,fields)=>{
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

    function delete_item(prod_id,point_id,user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("DELETE FROM b2b_cart where user_id = "+user_id+" and prod_id = "+prod_id+" and point_id = "+point_id+" ",(err,results,fields)=>{
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
        })
    } 

    function update_cart_qty_cid(user_id,cid,qty){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("UPDATE b2b_cart set prod_qty = "+qty+" where user_id = "+user_id+" and id ="+cid+" ",(err,results,fields)=>{
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

    function update_cart_qty_prod(user_id,prod_id,point_id,qty){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("UPDATE b2b_cart set prod_qty = "+qty+" where prod_id = "+prod_id+" and point_id = "+point_id+" ",(err,results,fields)=>{
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

 function get_cart_qty(user_id,prod_id,point_id)
{
    return  new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej(null);
            }
            else{
                conn.query("SELECT prod_qty from b2b_cart where prod_id = "+parseInt(prod_id)+" and point_id = (SELECT id from frv_wpoints where slug = "+mysql.escape(point_id)+" LIMIT 1) and user_id = "+user_id+"",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej(null);
                    }
                    else{
                        if (results.length == 0 ){
                            res(null);
                        }
                        else{
                            res(results[0].prod_qty);
                        }
                    }
                })
            }
        })
    })
}

function get_bis_names(user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("select DISTINCT users.bis_name,frv_wpoints.id from users join b2b_cart on b2b_cart.user_id = "+user_id+" join frv_wpoints on frv_wpoints.id = b2b_cart.point_id where users.id = frv_wpoints.farm_owner ",(err,results,fields)=>{
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


function parse_cart_count(user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT COUNT(id) as total from b2b_cart where user_id =  "+user_id+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej();
                    }
                    else{
                        if (results.length !=0)
                        res(results[0].total)
                        else{
                            res(0);
                        }
                    }
                })
            }
        })
    })
}

function modify_order(user_id,data){
    console.log(data);
    return new Promise((res,rej)=>{
        if (data.cid && data.keyw && data.details!=null && data.keyw.trim().length!=0)
        {
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    let keyw = data.keyw.split(/[\s,\n;\.]+/);

                    conn.query("UPDATE b2b_cart SET prod_keyw = "+mysql.escape(keyw.join(','))+", prod_details = "+mysql.escape(data.details)+" where user_id = "+user_id+" and id = "+data.cid+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            res(keyw);
                        }
                    })
                }
            })
        }
        else
        {
            console.log(data)
            rej();
        }
    })
}


function get_cart_cost(user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT price,b2b_cart.prod_qty as qty from frv_prods join b2b_cart on b2b_cart.prod_id = frv_prods.id and b2b_cart.user_id = "+user_id+" ",(err,results,fields)=>{
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

    function get_special_orders(user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT prod_keyw from b2b_cart where user_id = "+user_id+" ",(err,results,fields)=>{
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

    function insert_order(user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
            //first we crate the big order 
            let order_id = order_generator.generate();
            //insert the address 
            conn.query("INSERT INTO frv_order_addr (judet,oras,strada,numar,bloc,scara,apt,etaj,interfon,cod,nume,telefon) SELECT judet,oras,strada,numar,bloc,scara,apt,etaj,interfon,cod,nume,telefon from frv_address where user_id = "+user_id+" AND active = 1 ",(err,results,fields)=>{
            if (err){
                conn.release();
                rej();
            }
            else
            {
                if (results.insertId){
                    let addr_id = results.insertId;
                    //we should find the coordinates of this address 
                    
                    conn.query("SELECT judet,oras,strada,numar from frv_order_addr where id = "+results.insertId+" ",(err,results,fields)=>{
                            let coordinates_addr = "";    
                        if (results.length!=0){
                            coordinates_addr = results[0].judet+", "+results[0].oras+", Strada "+results[0].strada+" numar "+results[0].numar;
                            }
                            else{
                                coordinates_addr = null;
                            }
                            console.log(coordinates_addr);
                            let coordinates_promise = check_addr(coordinates_addr);
                            Promise.allSettled([coordinates_promise]).then((response)=>{
                              
                                let lat,lng
                                if (response[0].status!="fulfilled")
                                {
                                    lat = 0.0;
                                    lng = 0.0;
                                }
                                else if (response[0].value!="zero"){
                                    lat = response[0].value.lat;
                                    lng = response[0].value.lng;
                                    
                                }
                                else{
                                    lat = 0.0;
                                    lng = 0.0;
                                }
                            //we have the order_id, we just insert 
                            conn.query("INSERT INTO b2b_orders (user_id,order_id,order_status,address_id,lat,lng) VALUES("+user_id+","+mysql.escape(order_id)+",0,"+addr_id+","+mysql.escape(lat)+","+mysql.escape(lng)+") ",(err,results,fields)=>{
                                if (err){
                                    console.log(err);
                                    conn.release();
                                    rej();
                                }
                                else{
                                    //insert the products 
                                    conn.query("INSERT INTO b2b_order_prods (prod_id,prod_qty,point_id,prod_keyw,prod_details,order_id)  SELECT prod_id,prod_qty,point_id,prod_keyw,prod_details,"+mysql.escape(order_id)+" from b2b_cart where user_id = "+user_id+" ",(err,results,fields)=>{
                                        if (err){
                                            console.log(err);
                                            //delete the order 
                                            conn.query("DELETE FROM b2b_orders where order_id = "+mysql.escape(order_id)+" ",(err,results,fields)=>{
                                                conn.release();
                                            })
                                            rej();
                                        }
                                        else{
                                            conn.release();
                                            res();
                                        }
                                    })
                                }
                            })
                                
                            })
                    })
           
            }
        }
        })
        

        }
            })
        })
    }

    function is_this_my_offer(user_id,offer_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT id from b2b_offers where farmer_id = "+user_id+" and id = "+offer_id+" AND sent_by = -1 LIMIT 1 ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            if (results.length==0)
                            res(false);
                            else
                            res(true);
                        }
                    })
                }
            })
        })
    }

    function update_offer_status(offer_id,status){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("INSERT INTO b2b_statuses (offer_id,status,new_price,new_qty) SELECT "+offer_id+","+status+",new_price,new_qty from b2b_statuses where offer_id = "+offer_id+" ORDER BY sent_at DESC LIMIT 1 ",(err,results,fields)=>{
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

    function send_farmer_offer(price,qty,offer_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("INSERT INTO b2b_statuses (offer_id,status,new_price,new_qty) VALUES ("+offer_id+",3,"+price+","+qty+")",(err,results,fields)=>{
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

    function parse_client_orders(user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT (Select count(b2b_final_order.id) from b2b_final_order where b2b_orders.order_id = b2b_final_order.order_id LIMIT 1) as final,b2b_orders.order_id,CONVERT_TZ(b2b_orders.order_time,'+00:00','+03:00') as order_time,b2b_orders.order_status,frv_order_addr.*,b2b_order_prods.prod_qty,b2b_order_prods.prod_keyw,b2b_order_prods.prod_details,frv_wpoints.oras,frv_wpoints.adresa,frv_wpoints.judet,frv_prods.name,(SELECT frv_prod_images.file_name from frv_prod_images where frv_prod_images.product_id = b2b_order_prods.prod_id ORDER BY pic_index asc limit 1) as image from b2b_orders join b2b_order_prods on b2b_order_prods.order_id = b2b_orders.order_id left join frv_prods on frv_prods.id = b2b_order_prods.prod_id left join frv_wpoints on frv_wpoints.id = b2b_order_prods.point_id  join frv_order_addr on frv_order_addr.id = b2b_orders.address_id   where b2b_orders.user_id = "+user_id+"",(err,results,fields)=>{
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


    function get_final_bids(order_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("Select b2b_offers.id as bid_id,b2b_order_prods.prod_qty as original_qty,b2b_order_prods.id,b2b_order_prods.prod_id as original_prod_id, b2b_order_prods.point_id as original_point_id,b2b_order_prods.prod_keyw,b2b_order_prods.prod_details,  original_point.judet as original_judet,original_point.oras as original_oras,original_point.adresa as original_adresa, b2b_offers.prod_id,b2b_statuses.new_price,b2b_statuses.new_qty,frv_wpoints.judet,frv_wpoints.oras,frv_wpoints.adresa,original_prod.name as original_name,frv_prods.name,(SELECT file_name from frv_prod_images where frv_prod_images.product_id = b2b_order_prods.prod_id ORDER BY pic_index asc LIMIT 1) as original_image,(SELECT file_name from frv_prod_images where frv_prod_images.product_id = b2b_offers.prod_id ORDER BY pic_index asc LIMIT 1) as image from b2b_order_prods  left join frv_wpoints as original_point on b2b_order_prods.point_id = original_point.id left join b2b_offers on b2b_offers.cid = b2b_order_prods.id left join b2b_statuses on b2b_statuses.offer_id = b2b_offers.id and (b2b_statuses.status = 1 or b2b_statuses.status = 2) left join frv_wpoints on frv_wpoints.id = b2b_offers.point_id left join frv_prods as original_prod on original_prod.id = b2b_order_prods.prod_id left join frv_prods on frv_prods.id = b2b_offers.prod_id where b2b_order_prods.order_id = "+mysql.escape(order_id)+" ",(err,results,fields)=>{
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

    function insert_last_bid(order_id,bids,comanda,transport,comision){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    //build the inserts
                    let query = "INSERT INTO b2b_final_order (order_id,order_prod_id,offer_id) VALUES ";
                    console.log(bids);
                    Object.keys(bids).map(order_prod_id=>{
                        //now fore each order_prod_id
                        bids[order_prod_id].map(bid=>{
                            query+= " ("+mysql.escape(order_id)+","+order_prod_id+","+bid+"),";
                        })
                    })
                    query = query.slice(0,-1);

                    conn.query(query,(err,results,fields)=>{
                  
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            //now just insert the costs 
                            conn.query("INSERT INTO b2b_order_costs (order_id,price_total,price_transport,comision) VALUES ("+mysql.escape(order_id)+","+comanda+","+transport+","+comision+") ",(err,results,fields)=>{
                                if (err){
                                    //delete the prev 
                                    conn.query("DELETE FROM b2b_final_order where order_id = "+mysql.escape(order_id)+" ",(err,results,fields)=>{
                                        conn.release();
                                        rej();
                                    })
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

    function is_this_my_order(user_id,order_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT id from b2b_orders where order_id = "+mysql.escape(order_id)+" and user_id = "+user_id+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            if (results.length==0)
                            res(false);
                            else 
                            res(true);
                        }
                    })
                }
            })
        })
    }


    function parse_final_offers(order_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("Select b2b_order_prods.prod_qty as original_qty,b2b_order_prods.id,b2b_order_prods.prod_id as original_prod_id, b2b_order_prods.point_id as original_point_id,b2b_order_prods.prod_keyw,b2b_order_prods.prod_details,  b2b_final_order.offer_id,original_point.judet as original_judet,original_point.oras as original_oras,original_point.adresa as original_adresa, b2b_offers.prod_id,b2b_statuses.new_price,b2b_statuses.new_qty,frv_wpoints.judet,frv_wpoints.oras,frv_wpoints.adresa,original_prod.name as original_name,frv_prods.name,(SELECT file_name from frv_prod_images where frv_prod_images.product_id = b2b_order_prods.prod_id ORDER BY pic_index asc LIMIT 1) as original_image,(SELECT file_name from frv_prod_images where frv_prod_images.product_id = b2b_offers.prod_id ORDER BY pic_index asc LIMIT 1) as image from b2b_order_prods left join b2b_final_order on b2b_final_order.order_prod_id = b2b_order_prods.id left join frv_wpoints as original_point on b2b_order_prods.point_id = original_point.id left join b2b_offers on b2b_offers.id = b2b_final_order.offer_id left join b2b_statuses on b2b_statuses.offer_id = b2b_offers.id and (b2b_statuses.status = 1 or b2b_statuses.status = 2) left join frv_wpoints on frv_wpoints.id = b2b_offers.point_id left join frv_prods as original_prod on original_prod.id = b2b_order_prods.prod_id left join frv_prods on frv_prods.id = b2b_offers.prod_id where b2b_order_prods.order_id = "+mysql.escape(order_id)+"  ",(err,results,fields)=>{
                        conn.release()
                        if (err)
                        rej();
                        else{
                            res(results);
                        }
                    })
                }
            })
        })
    }

    function get_costs(order_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT price_total,price_transport,comision from b2b_order_costs where order_id = "+mysql.escape(order_id)+" ",(err,results,fields)=>{
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

    function update_order_status(order_id,status){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("UPDATE b2b_orders SET order_status = "+status+" where order_id = "+mysql.escape(order_id)+" ",(err,results,fields)=>{
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

    function is_user_eligible_for_rating(user_id,prod_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("Select b2b_orders.id from b2b_orders join b2b_final_order on b2b_final_order.order_id = b2b_orders.order_id join b2b_offers on b2b_offers.id = b2b_final_order.offer_id  and b2b_offers.prod_id = "+prod_id+" where b2b_orders.user_id = "+user_id+" LIMIT 1",(err,results,fields)=>{
                       conn.release();
                      
                       if (err)
                       rej();
                       else
                       res(results.length);
                    })
                }
            })
        })
    }

    function cart_contains(prod_id,point_id,user_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT prod_qty from b2b_cart where prod_id = "+parseInt(prod_id)+" and point_id = "+parseInt(point_id)+" and user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
                        conn.release();
                        if (err)
                        {
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

module.exports = {
    init,parse_cart_count,parse_cart,ato,get_cart_qty,get_bis_names,parse_cart_count,modify_order,get_cart_cost,get_special_orders,insert_order,is_this_my_offer,update_offer_status,send_farmer_offer,
    parse_client_orders,get_final_bids,insert_last_bid,is_this_my_order,parse_final_offers,get_costs,update_order_status,delete_item,update_cart_qty_cid,update_cart_qty_prod,is_user_eligible_for_rating,
    delete_custom_item,cart_contains
}