var mysql,pool;
mysql = pool = null;

function init(p,m){
    pool = p;
    mysql = m;
}


function get_prod_data(prod_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                conn.query("SELECT name,price,unit,description,sel_type,IF(price_per_kg!=0,price_per_kg, false) as price_per_kg from frv_prods where id = "+mysql.escape(prod_id)+"  LIMIT 1 ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        console.log(err);
                        rej("mysql");
                    }
                    else{
                        if (results.length!=0){
                            res(results[0]);
                        }
                        else{
                            rej("Not valid");
                        }
                    }
                })
            }
        })
    })
}

function validate_atc_data(prod_id,user_id,point_id)
{
    console.log(prod_id);
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT sel_type from frv_prods where id = "+parseInt(prod_id)+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        console.log(err);
                        rej();
                    }
                    else{
                        console.log(results);
                        if (results.length==0)
                        rej();
                        else{
                            if (results[0].sel_type!=2){
                                res();
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

function add_to_cart_visitor(prod_id,qty,user_id,point_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                //firstly check if this already exists in our table 
                conn.query("SELECT id from frv_cookie_cart where user_uid = "+mysql.escape(user_id)+" AND product_id = "+parseInt(prod_id)+" AND point_id = "+parseInt(point_id)+" ",(err,results,fields)=>{
                    if (err){
                        rej("mysql");

                    }
                    else{
                        if (results.length==0){
                            //insert 
                            conn.query("INSERT INTO frv_cookie_cart (user_uid,product_id,qty,point_id) VALUES("+mysql.escape(user_id)+","+parseInt(prod_id)+","+parseInt(qty)+","+parseInt(point_id)+")",(err,results,fields)=>{
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
                        else{
                            //update
                            conn.query("UPDATE frv_cookie_cart set qty = qty+"+parseInt(qty)+" where user_uid = "+mysql.escape(user_id)+" and product_id  = "+parseInt(prod_id)+" and point_id = "+parseInt(point_id)+" ",(err,results,fields)=>{
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
                    }
                })
                
            }
        })
    })
}

function add_to_cart(prod_id,qty,user_id,point_id){
    console.log("ADAUGAm")
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                //firstly check if this already exists in our table 
                conn.query("SELECT id from frv_cart where user_id = "+parseInt(user_id)+" AND product_id = "+parseInt(prod_id)+" AND point_id = "+parseInt(point_id)+" ",(err,results,fields)=>{
                    if (err){
                        conn.release();
                        console.log(err);
                        rej("mysql");

                    }
                    else{
                        if (results.length==0){
                            //insert 
                            conn.query("INSERT INTO frv_cart (user_id,product_id,qty,point_id) VALUES("+parseInt(user_id)+","+parseInt(prod_id)+","+parseInt(qty)+","+parseInt(point_id)+")",(err,results,fields)=>{
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
                        else{
                            //update
                            conn.query("UPDATE frv_cart set qty = qty+"+parseInt(qty)+" where user_id = "+parseInt(user_id)+" and product_id  = "+parseInt(prod_id)+" and point_id = "+parseInt(point_id)+" ",(err,results,fields)=>{
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
                    }
                })
                
            }
        })
    })
}
function get_carts(user_id){
    return  new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                conn.query("SELECT COUNT(id) as cart_count from frv_cart where user_id = "+user_id+" LIMIT 10",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej("mysql");
                    }
                    else{
                        console.log(results);
                        if(results.length==0)
                        res(0);
                        else
                        res(results[0].cart_count);
                    }
                })
            }
        })
    })
}

function get_carts_visitor(user_id)
{
    return  new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                conn.query("SELECT COUNT(id) as cart_count from frv_cookie_cart where user_uid = "+mysql.escape(user_id)+" LIMIT 10",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej("mysql");
                    }
                    else{
                        if(results.length==0)
                        res(0);
                        else
                        res(results[0].cart_count);
                    }
                })
            }
        })
    })
}

function get_cart_prods(user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }else{
                conn.query("SELECT product_id,cart.qty,prods.name,prods.perisabil,prods.trans,prods.price,point_id,frv_wpoints.judet,frv_wpoints.oras,frv_wpoints.adresa,(SELECT file_name from frv_prod_images where frv_prod_images.product_id = cart.product_id ORDER BY pic_index asc LIMIT 1) as prod_image,users.bis_name  FROM frv_cart as cart  join frv_prods as prods on  cart.product_id = prods.id join users on users.id = prods.user_id join frv_wpoints on cart.point_id = frv_wpoints.id Where  cart.user_id = "+parseInt(user_id)+"  ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        console.log(err);
                        rej("mysql");

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

function get_cart_prods_visitor(user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }else{
                conn.query("SELECT product_id,cart.qty,prods.name,prods.perisabil,prods.trans,prods.price,point_id,frv_wpoints.judet,frv_wpoints.oras,frv_wpoints.adresa,(SELECT file_name from frv_prod_images where frv_prod_images.product_id = cart.product_id ORDER BY pic_index asc LIMIT 1) as prod_image,users.bis_name  FROM frv_cookie_cart as cart  join frv_prods as prods on  cart.product_id = prods.id join users on users.id = prods.user_id join frv_wpoints on cart.point_id = frv_wpoints.id Where  cart.user_uid = "+mysql.escape(user_id)+"  ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        console.log(err);
                        rej("mysql");

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

function get_total_cart_point(user_id,point_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT SUM((SELECT price from frv_prods where frv_prods.id = frv_cart.product_id) ) as total from frv_cart where point_id = "+parseInt(point_id)+" and user_id = "+parseInt(user_id)+"",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej();
                    }
                    else{
                        if (results.length == 0){
                            res(0);
                        }else{
                            res(results[0].total);
                        }
                    }
                })
            }
        })
    })
}

function get_atc_info(prod_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                conn.query("SELECT price,name from frv_prods where id = "+prod_id+"",(err,results,fields)=>{
                    conn.release();
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

function update_cart_qty(user_id,prod_id,qty,point_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err)
            {
                rej("mysql");
            }
            else{
                conn.query("UPDATE frv_cart SET qty = "+parseInt(qty)+" where user_id = "+parseInt(user_id)+" and product_id = "+parseInt(prod_id)+" AND point_id = "+parseInt(point_id)+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej("mysql");
                    }
                    else{
                        console.log(results.affectedRows)
                        res();
                    }
                })
            }
        })
    })
}

function update_cart_qty_visitor(user_id,prod_id,qty,point_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err)
            {
                rej("mysql");
            }
            else{
                conn.query("UPDATE frv_cookie_cart SET qty = "+qty+" where user_uid = "+mysql.escape(user_id)+" and product_id = "+prod_id+" AND point_id = "+point_id+" ",(err,results,fields)=>{
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

function remove_cart(prod_id,user_id,point_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else
            {
                conn.query("DELETE FROM frv_cart where user_id = "+user_id+" AND product_id = "+prod_id+" AND point_id = "+point_id+" ",(err,results,fields)=>{
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

function remove_cart_visitor(prod_id,user_id,point_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else
            {
                conn.query("DELETE FROM frv_cookie_cart where user_uid = "+mysql.escape(user_id)+" AND product_id = "+prod_id+" AND point_id = "+point_id+" ",(err,results,fields)=>{
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

async function get_prod_images(prod_id){
    return await new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else
            {
                conn.query("SELECT file_name from frv_prod_images where product_id =  "+prod_id+" ORDER BY pic_index ASC ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        //
                        rej("mysql");
                    }
                    else{
                        //work with data 
                        if (results.length!=0){
                            let aux = [];
                            for (index in results){
                                aux.push("/uploads/"+results[index].file_name);
                            }
                            res(aux);
                        }
                        else{
                            res(["/assets/images/icons/no_image.png"]);
                        }
                    }
                })
            }
        })
    }).then((results)=>{
        return results;
    }).catch((err)=>{
        res(["/assets/images/icons/no_image.png"]);
    })
}

    function is_user_eligible_for_rating(user_id,prod_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT frv_ordered_prods.id from frv_ordered_prods join frv_order_chunk on frv_order_chunk.child_order_id = frv_ordered_prods.child_order_id and (frv_order_chunk.status = 5 or frv_order_chunk.status = 6) join frv_orders on frv_orders.order_id = frv_order_chunk.parent_order and frv_orders.by_user_id = "+user_id+" where frv_ordered_prods.prod_id = "+prod_id+" LIMIT 1",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej()
                        }
                        else{
                            res(results.length);
                        }
                    })
                }
            })
        })
    }
    


    function get_product_rating(prod_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT (sum(stars)/count(id)) as rating,count(id) as count from frv_ratings where prod_id = "+prod_id+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            let stars = "",i;
                            if (results.length==0){
                                //full 5 empty stars 
                                for (i=1;i<=5;i++){
                                    stars+="<i class='far fa-star'></i>";
                                }
                                res({"stars":stars,"count": 0});
                            }
                            else{
                                let count_down = 5;
                                for (i=1;i<=parseInt(results[0].rating);i++){
                                    stars+="<i class='fas fa-star'></i>";
                                    count_down--;
                                }
                                if (results[0].rating - parseInt(results[0].rating) > 0)
                                {
                                    count_down -- ;
                                    stars+="<i class='fas fa-star-half-alt'></i>";
                                }

                                for (i=1;i<=count_down;i++){
                                    stars+="<i class='far fa-star'></i>";
                                }
                                //TODO
                                res({"stars":stars,"count":results[0].count});
                            }
                        }
                    })
                }
            })
        })
    }

    function insert_review(title,content,stars,user_id,prod_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("INSERT INTO frv_ratings (stars,user_id,prod_id,comments,title) VALUES ("+stars+","+user_id+","+prod_id+","+mysql.escape(content)+","+mysql.escape(title)+")",(err,results,fields)=>{
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


    function get_reviews(prod_id,user_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT frv_ratings.id,IF(users.id = "+user_id+",'Tu',users.username) as username,IF(users.id = "+user_id+",1,0) as edit ,frv_ratings.stars, frv_ratings.comments, frv_ratings.title, frv_ratings.created_at from frv_ratings join users on users.id = frv_ratings.user_id where frv_ratings.prod_id = "+prod_id+" ",(err,results,fields)=>{
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

    function update_review(review_id,user_id,title,content){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("UPDATE frv_ratings set title = "+mysql.escape(title)+", comments = "+mysql.escape(content)+" where user_id = "+user_id+" and id = "+review_id+"  ",(err,result,fields)=>{
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

    function get_farmer(prod_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT users.bis_name From users JOIN frv_prods on frv_prods.id = "+parseInt(prod_id)+" and frv_prods.user_id = users.id ",(err,results,fields)=>{
                        conn.release();
                        if (err)
                       {
                           console.log(err);
                            rej();
                    }
                        else{
                            if (results.length==0)
                            rej();
                            else
                            res(results[0].bis_name)
                        }
                    })
                }
            })
        })
    }

    function get_product_id_from_slug(product_slug,farmer_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();

                }
                else{
                    conn.query("SELECT id from frv_prods where slug = "+mysql.escape(product_slug)+" and user_id = "+parseInt(farmer_id)+"  ",(err,results,fields)=>{
                        conn.release();
                        if (err)
                        {
                            rej();
                        }
                        else{
                            if(results.length == 0)
                            rej();
                            else{
                                res(results[0].id);
                            }
                        }
                    })
                }
            })
        })
    }


    function get_cart_qty(prod_id,user_id,point_id,farmer_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT qty from frv_cart where user_id = "+parseInt(user_id)+"  and product_id = "+parseInt(prod_id)+" and point_id = (SELECT id from frv_wpoints where slug = "+mysql.escape(point_id)+" and farm_owner = "+parseInt(farmer_id)+" LIMIT 1) ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            if (results.length==0)
                            rej();
                            else{
                                res(results[0].qty);
                            }
                        }
                    })
                }
            })
        })
    }


    function get_categorie(slug)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT id,categorie from frm_cats where slug = "+mysql.escape(slug)+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            if (results.length!=0)
                            {
                                res(results[0]);
                            }
                            else{
                                rej();
                            }
                        }
                    })
                }
            })
        })
    }

 
    function get_direct_childs(cat_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err)
                {
                    rej();

                }
                else{
                    conn.query("SELECT frm_cats.categorie,frm_cats.slug from frv_cat_tree  join frm_cats on frm_cats.id = child  where parent = "+parseInt(cat_id)+" LIMIT 5",(err,results,fields)=>{
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
    function get_prods_for_cat(cat_id,page = 1)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    page--;
                    conn.query("SELECT frv_prods.*, farmer_slugs.slug as user_slug,(SELECT file_name from frv_prod_images where product_id = frv_prods.id order by pic_index ASC limit 1) as image,users.bis_name, user_profile_images.image_name from frv_prods join users on frv_prods.user_id = users.id  join user_profile_images on user_profile_images.user_id = users.id and user_profile_images.show_image = 1 join farmer_slugs on frv_prods.user_id = farmer_slugs.user_id  where cat in (cat IN (select child from (select * from frv_cat_tree order by parent, child) s, (select @pv := '"+parseInt(cat_id)+"') initialisation where find_in_set(parent, @pv) > 0 and @pv := concat(@pv, ',', child)) OR cat = "+parseInt(cat_id)+") LIMIT "+parseInt(page*25)+",25",(err,results,fields)=>{
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

    function switch_cart(user_id,cart_uid){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("INSERT INTO frv_cart (user_id,product_id,qty,added_at,point_id) SELECT "+parseInt(user_id)+",frv_cookie_cart.product_id,frv_cookie_cart.qty,frv_cookie_cart.added_at,frv_cookie_cart.point_id FROm frv_cookie_cart where frv_cookie_cart.id not in  (SELECT frv_cookie_cart.id from frv_cookie_cart join frv_cart on frv_cart.product_id = frv_cookie_cart.product_id and frv_cart.point_id = frv_cookie_cart.point_id and frv_cart.user_id = 14 where frv_cookie_cart.user_uid = "+mysql.escape(cart_uid)+") and frv_cookie_cart.user_uid = "+mysql.escape(cart_uid)+" ",(err,results,fields)=>{
                        conn.release();
                        res();
                    })
                }
            })
        })
    }

    function get_prod_price(prod_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT price from frv_prods where id = "+parseInt(prod_id)+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            if (results.length!=0)
                            res(results[0].price);
                            else{
                                rej();
                            }
                        }
                    })
                }
            })
        })
    }

    function guest_cart_contains(prod_id,point_id,uid)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT qty  from frv_cookie_cart where product_id = "+mysql.escape(prod_id)+" and point_id = "+mysql.escape(point_id)+" and user_uid = "+mysql.escape(uid)+" ",(err,results,fields)=>{
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
module.exports = {
init,get_prod_data,add_to_cart,get_carts,get_cart_prods,get_atc_info,update_cart_qty,remove_cart,get_prod_images,is_user_eligible_for_rating,get_product_rating,insert_review,get_reviews,update_review,
get_farmer,get_product_id_from_slug,get_cart_qty,get_categorie,get_direct_childs,get_prods_for_cat,add_to_cart_visitor,remove_cart_visitor,update_cart_qty_visitor,get_cart_prods_visitor,get_total_cart_point,
get_carts_visitor,switch_cart,get_prod_price,validate_atc_data,guest_cart_contains
}