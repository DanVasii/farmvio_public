
const { response } = require('express');
const { JsonWebTokenError } = require('jsonwebtoken');
const { stringify } = require('querystring');

var request = require('request');
const { parse } = require('url');
var order_generator = require("order-id")('mysecret');

const fs = require("fs");
const { assert } = require('console');

var mysql,pool;
mysql = pool = null;

function init(p,m){
    pool = p;
    mysql = m;
}

function check_addr(addr){
    
    return new Promise((res,rej)=>{
        if (addr!=null){
        var propertiesObject = { address:addr, key:'AIzaSyAsulFOxSCM7O7uc72Sxff6xSuztTkUXhA' };
        
        request({url:"https://maps.googleapis.com/maps/api/geocode/json", qs:propertiesObject}, function(err, response, body) {
          if(err) {
              console.log(err);
              rej("google");
          }
          else
          {
              body  = JSON.parse(body);

              if (body.status == "OK"){
                  res(body.results[0].geometry.location);
              }
              else if(body.status == "ZERO_RESULTS"){
                  console.log("ZERO");
                  res("zero");
              }
              else
              {

                  rej("not_found");
              }
          }
          
        });
    }
    else{
        rej();
    }
        
    })
    
}



function kyc_needed_farm(farm_id,user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                //we have a connection, lets query 
                
                conn.query("SELECT id FROM farms WHERE id = "+farm_id+" AND farm_owner = "+user_id+" AND kyc_status = 0 ",(error,results,fields)=>{
                    conn.release();    
                    if (error){
                        console.log(error);
                            rej("mysql");
                        }
                        else{
                            //we can now show the data 
                            //for ok , the length must be 1
                            console.log(results.length);
                            res(results.length);
                        }
                })
            }
        })
    })
}


function insert_farm(farm_name,lat,lng,farm_owner,cui,judet,oras,adresa){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej("mysql");

                }
                else{
                    //run the query 
                    //sanitize all data 
                    conn.query("INSERT INTO farms (farm_name,lat,lng,farm_owner,cui,judet,oras,adresa)  VALUES ("+mysql.escape(farm_name)+","+mysql.escape(lat)+","+mysql.escape(lng)+","+mysql.escape(farm_owner)+","+mysql.escape(cui)+","+mysql.escape(judet)+","+mysql.escape(oras)+","+mysql.escape(adresa)+")",(error,results,fields)=>{
                        conn.release();
                        if (error)
                        {
                            console.log(error);
                            rej("mysql");
                        }
                        else{
                            res(results.insertId);
                        }
                    })
                }
            })
        })
}

function insert_point(point_name,lat,lng,farm_owner,judet,oras,adresa,farm_id,nr,cod){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");

            }
            else{
                //run the query 
                //sanitize all data 
                //create the keywords 
                let k = point_name+" "+judet+" "+oras+" "+adresa;
                slug = judet.trim().toLowerCase()+"-"+oras.trim().toLowerCase()+"-"+adresa.trim().toLowerCase();
                conn.query("INSERT INTO frv_wpoints (point_name,lat,lng,farm_owner,judet,oras,adresa,nr,cod,keywords,slug)  VALUES ("+mysql.escape(point_name)+","+mysql.escape(lat)+","+mysql.escape(lng)+","+mysql.escape(farm_owner)+","+mysql.escape(judet)+","+mysql.escape(oras)+","+mysql.escape(adresa)+","+mysql.escape(nr)+","+mysql.escape(cod)+","+mysql.escape(k)+","+mysql.escape(slug)+")",(error,results,fields)=>{
                    conn.release();
                    if (error)
                    {
                        console.log(error);
                        rej("mysql");
                    }
                    else{
                        res(results.insertId);
                    }
                })
            }
        })
    })
}

function update_point(point_id,point_name,lat,lng,farm_owner,judet,oras,adresa,farm_id,nr,cod){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");

            }
            else{
                //run the query 
                //sanitize all data 
                //create the keywords 
                let k = point_name.trim()+" "+judet.trim()+" "+oras.trim()+" "+adresa.trim();
                slug = judet.trim().toLowerCase()+"-"+oras.trim().toLowerCase()+"-"+adresa.trim().toLowerCase();
                conn.query("UPDATE frv_wpoints set point_name = "+mysql.escape(point_name)+",lat = "+mysql.escape(lat)+",lng = "+mysql.escape(lng)+",judet = "+mysql.escape(judet)+",oras =  "+mysql.escape(oras)+", adresa = "+mysql.escape(adresa)+",nr = "+mysql.escape(nr)+",cod = "+mysql.escape(cod)+",keywords = "+mysql.escape(k)+",slug = "+mysql.escape(slug)+" where id = "+parseInt(point_id)+" and farm_owner = "+parseInt(farm_owner)+" ",(error,results,fields)=>{
                    conn.release();
                    if (error)
                    {
                        console.log(error);
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

function insert_point_as_farm(point_name,farm_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                conn.query("INSERT INTO frv_wpoints (point_name,farm_id,farm_owner,lat,lng,judet,oras,adresa,keywords) SELECT "+mysql.escape(point_name)+","+mysql.escape('['+farm_id+']')+",farms.farm_owner,farms.lat,farms.lng,farms.judet,farms.oras,farms.adresa,CONCAT("+mysql.escape(point_name)+",' ',farms.judet,' ',farms.oras,' ',farms.adresa) FROM farms where id = "+farm_id+" ",(error,results,fields)=>{
                    conn.release();
                    if (error){
                        console.log(error);
                        rej("mysql");
                    }
                    else
                    res();
                })
            }
        })
    })
}

function valid_cui(cui){
    try{
    //strip spaces 
    cui = cui.trim().toUpperCase();
    //first strip the RO
    if (cui.indexOf("RO") === 0){
        cui = cui.replace("RO",'');
    }
    if (cui.toString().length>10 || cui.toString().length<2){
        //not valid 
        return false;
    }
    let control = 753217532;
    let cif_control = parseInt(cui%10);
    cui = parseInt(cui/10);

    let t = 0;

     while (cui>0){
         t+=(parseInt(cui%10))*(parseInt(control%10));
         cui = parseInt(cui/10);
         control = parseInt(control/10);
     }

     let c2 = parseInt((t*10)%11);

     if (c2==10){
         c2 = 0;
     }
     return cif_control === c2;
    }
    catch(e){
        return false;
    }
    
}

function farm_name_unique(new_name){
    return new Promise((res,rej)=>{
        
        pool.getConnection((err,conn)=>{
            if (err){
                console.log(err);
                rej("mysql_error");

            }
            else{
                conn.query("SELECT * from farms where farm_name = "+mysql.escape(new_name.trim())+"",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        console.log(err);
                        rej("error");
                    }
                    else{
                        //check the length 
                        res(results.length);
                    }
                })
            }
        })
    });
}



 function check_county(county){
    //check if county is inside the database
    return new Promise((res,rej)=>{
            pool.getConnection((error,conn)=>{
                if (error){
                    rej("mysql");
                }
                else{
                    conn.query("SELECT * from localitati where judet = "+mysql.escape(county.trim())+" LIMIT 1 ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej("mysql");

                        }
                        else{
                            res(results.length);
                        }
                    })
                }
            });
    })
 }

 function check_city(county,city){
     return new Promise((res,rej)=>{
         //now check the city 
         pool.getConnection((err,conn)=>
         {
             if (err){
                 console.log(err);
                 rej("mysql");

             }
             else{
                 //we have the connection, go on 
                 conn.query("SELECT * from localitati where judet = "+mysql.escape(county.trim())+" AND nume = "+mysql.escape(city.trim())+" LIMiT 1",(err,results,fields)=>{
                    conn.release(); 
                    if (err){
                        console.log(err);
                         rej("mysql");
                     }
                     else{
                         res(results.length);
                     }
                 })

             }
         });
     })
 }

  function validate_elems(params){
    return new Promise((res,rej)=>{
        //first check the name 
        farm_name_unique(params.body.farm_name).then((farm_name_response)=>{
            //if it is ok, then check the addr 
            check_county(params.body.county).then((county_response)=>{

                //now check the city 
                check_city(params.body.county,params.body.city).then((city_response)=>{
                    
                    //now lets check the final address
                    check_addr(params.body.county+","+params.body.city+","+params.body.address).then((addr_response)=>{

                        //we can now build the whole array and we can return it 
                        let response = {};
                        let final_resp = {};
                        if (params.body.farm_name.trim().length==0)
                        response.farm_name = "Please enter a name";
                        else
                        if (farm_name_response!=0){
                            //there is an error then 
                            response.farm_name = "Name is already taken";
                        }
                        if (county_response == 0){
                            //error
                            response.county = "Please enter a valid county";
                        }

                        if (city_response == 0){
                            response.city = "Please enter a valid city";
                        }
                        
                        if (addr_response == "zero"){
                            response.address = "Please enter a valid address or enter the coordinates";
                        }
                        if (!valid_cui(params.body.cui))
                        {
                            response.cui = "Please enter a valid CUI";
                        }

                        if (Object.keys(response).length==0)
                        {
                            //eveything is ok 
                            
                        final_resp.server = addr_response;
                        }
                        final_resp.client = response;
                       // console.log(final_resp);
                        res(final_resp);
                    }).catch((why)=>{
                        rej(why);
                    })
                    
                }).catch((why)=>{
                    rej(why);
                })

            }).catch((why)=>{
                rej(why);
            })

        }).catch((why)=>{
            rej(why);
        })
    })   
}

function get_farms(center,radius,page,categorie,search){
        try{
                return new Promise((res,rej)=>{
                    pool.getConnection((err,con)=>{
                        if (err)
                        {
                            rej("err");
                        }
                        else{
                            let join_start = "join frv_prods on JSON_CONTAINS(frv_prods.points,CAST(frv_wpoints.id as CHAR(50)),'$')";
                        
                            if (categorie)
                            {

                                join_start += " and (frv_prods.cat IN (select child from (select * from frv_cat_tree order by parent, child) s, (select @pv := '"+parseInt(categorie)+"') initialisation where find_in_set(parent, @pv) > 0 and @pv := concat(@pv, ',', child)) OR frv_prods.cat = "+parseInt(categorie)+" ) ";
                            }
                            if (search && search.trim().length!=0){
                                let search_words = search.trim().split(" ");

                                search_words.map(word=>{
                                    if (word.trim()!="")
                                    join_start += ` and frv_prods.name LIKE ${mysql.escape('%'+word+'%')} `;
                                })
                              //  console.log(join_start);
                            }
                            if (!join_start.includes("and"))
                            {
                                join_start = "";
                            }

                            console.log(join_start)

                        //  console.log(page + "aoc");

                            //we have a connection run the query
                 
                            con.query("SELECT Distinct     CONCAT('[',(SELECT GROUP_CONCAT(json_object('cat',categorie)) from frm_cats where id in (SELECT DISTINCT (cat) from frv_prods where user_id = frv_wpoints.farm_owner AND JSON_CONTAINS(points,CAST(frv_wpoints.id as CHAR(50)) ,'$'))),']') as sold_cats,frv_srls.nume as nume_firma, frv_srls.slug as slug_firma, user_profile_images.image_name,farmer_slugs.slug as user_slug,frv_descrieri.descriere,users.bis_name,lat,lng,point_name,farm_owner,frv_wpoints.slug,frv_wpoints.id, (6371 * acos (cos ( radians("+mysql.escape(center.lat)+") ) * cos( radians( lat ) ) * cos( radians( lng ) - radians("+mysql.escape(center.lng)+") )+ sin ( radians("+mysql.escape(center.lat)+") )* sin( radians( lat ) ))) AS distance FROM frv_wpoints   "+join_start+" LEFT JOIN user_profile_images on user_profile_images.user_id = frv_wpoints.farm_owner and user_profile_images.show_image = 1 left join users on users.id = frv_wpoints.farm_owner LEFT join farmer_slugs on farmer_slugs.user_id = frv_wpoints.farm_owner LEFT join frv_descrieri on frv_descrieri.user_id = frv_wpoints.farm_owner LEFT JOIN frv_srls on frv_srls.id = frv_wpoints.firma_id HAVING distance < "+mysql.escape(radius)+" ORDER BY distance  LIMIT "+(25*page)+",25  ",(err,data,fields)=>{
                                con.release();
                                if (err)
                                {
                                    console.log(err);
                                    rej("err");
                                }
                                else{
                                   // console.log(data);
                                    res(data);
                                }
                            })
                        }
                    });
                })
        }
        catch(e)
        {
            console.log(e);
             return "err";
        }
}

function get_pagination_info(center,radius,page,categorie,search){
    return new Promise((res,rej)=>{
        pool.getConnection((err,con)=>{
            if (err)
            {
                rej("err");
            }
            else{

                console.log("PAGINATION");
                console.log(categorie);
           
                let join_start = " join frv_prods on JSON_CONTAINS(frv_prods.points,CAST(frv_wpoints.id as CHAR(50)),'$')";
            
                if (categorie)
                {


                   
                    join_start += " and (frv_prods.cat IN (select child from (select * from frv_cat_tree order by parent, child) s, (select @pv := '"+parseInt(categorie)+"') initialisation where find_in_set(parent, @pv) > 0 and @pv := concat(@pv, ',', child)) OR cat = "+parseInt(categorie)+")";
                }
                if (search && search.trim()!=""){
                    let search_words = search.trim().split(" ");

                                search_words.map(word=>{
                                    if (word.trim()!="")
                                    join_start += ` and frv_prods.name LIKE ${mysql.escape('%'+word+'%')} `;
                                })
                }
                if (!join_start.includes("and"))
                {
                    join_start = "";
                }
                console.log(join_start);
                //we have a connection run the query 
                con.query("SELECT COUNT(distinct frv_wpoints.id) as total FROM frv_wpoints   "+join_start+"  where (6371 * acos (cos ( radians("+mysql.escape(center.lat)+") ) * cos( radians( lat ) ) * cos( radians( lng ) - radians("+mysql.escape(center.lng)+") )+ sin ( radians("+mysql.escape(center.lat)+") )* sin( radians( lat ) )))  < "+mysql.escape(radius)+" ",(err,data,fields)=>{
                    con.release();
                    if (err)
                    {
                        console.log(err);
                        rej("err");
                    }
                    else{
                        let response = {};
                        response.count = data[0].total;
                        if (parseInt(page) == 0 ){
                            response.left = "disabled";
                        }
                        
                            if (( (parseInt(page) + 1) * 25) > response.count)
                            {
                                response.right = "disabled";
                            }
                            
                            
                        response.message = "Sunt afișate "+(parseInt(page)*25)+ " - "+Math.min(((parseInt(page)+1) * 25),response.count)+" din "+response.count;

                        response.max_page = parseInt((parseInt(response.count)/25))  + (response.count%25==0 ? 0 : 1 );
                        res(response);
                    }
                })
            }
        });
    })
}

function get_work_point_for_prod(product_id,path_name, current_slug = "")
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT judet,oras,adresa,CONCAT("+mysql.escape(path_name)+",'?punct_livrare=',slug) as link, IF(slug="+mysql.escape(current_slug)+",1, 0) as active from frv_wpoints where JSON_CONTAINS((SELECT points from frv_prods where id = "+parseInt(product_id)+"),CAST(frv_wpoints.id as CHAR(50)),'$')",(err,results,fields)=>{
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

function get_workp(user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                conn.query("SELECT id,point_name,judet,oras,adresa,lat,lng FROM frv_wpoints WHERE farm_owner = "+user_id+" ",(error,results,fields)=>{
                        conn.release();
                        if (error){
                            rej("mysql");
                        }
                        else{
                            //return the ressults 
                            res(results);
                        }
                })
            }
        })
    })
}

function slug_to_point_id(slug,farmer_id)
{
    return new Promise((res,rej)=>{
        if (typeof slug === "string" && parseInt(slug) == slug.trim())
        res(parseInt(slug));
        else
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT id from frv_wpoints where slug = "+mysql.escape(slug)+" and farm_owner = "+parseInt(farmer_id)+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej();
                    }
                    else{
                        if (results.length==0){
                            if (parseInt(slug) == slug)
                            {
                                res(slug);
                            }
                            else{
                                rej();
                            }
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


function search_workp(user_input,user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                
                rej("mysql");
            }
            else{
                //run the query 
                conn.query("SELECT * from frv_wpoints where farm_owner = "+user_id+" AND keywords LIKE "+mysql.escape('%'+user_input+'%')+" ",(error,results,fields)=>{
                    conn.release();
                    if (error){
                        console.log(error);
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

function is_farm_ok(farm_id,user_id){
    //farm_id is an array
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                console.log(err);
                rej("mysql");
            }
            else{
                conn.query("SELECT id FRom farms where farm_owner = "+user_id+"",(error,results,fields)=>{
                    conn.release();
                    if (error){
                        console.log(error);
                        rej("mysql");
                    }
                    else{
                        //now we check if every id from farm_id is in the list 
                        let ok;
                        for (index in farm_id){
                             ok = false;
                            for (index_ferma in results){
                                if (results[index_ferma].id == farm_id[index])
                                    {
                                        //found it, now go no 
                                        ok = true;
                                        break;
                                    }
                            }    

                            if (!ok){
                                res(0);
                            }

                        }
                        res(1);
                    }
                })
            }
        })
    })
}

const available_units = ["kg","l","b"];

 function validate_prod_data(data,user_id){
     return new Promise((res,rej)=>{
         //lets validate em one by one
         //check the name 
         let errors = {};
         
         if (!(data.prod_title && data.prod_title.trim().length!=0))
         {
             //the name is not  ok
             errors['prod_title'] = "Please enter a valid title";

        }
         if (!(data.prod_name && data.prod_name.trim().length!=0))
         {
             //the name is not  ok
             errors['prod_name'] = "Please enter a valid name";

        }
        //check the desc 
        if (!(data.desc && data.desc.trim().length!=0))
        {
            errors['desc'] = "Please enter a valid description";
        }
        //check the price 
        if (!(data.price && !isNaN(data.price)))
        {
            errors['price'] = "please enter a valid price";
        }
        //check the unit 
        if (!(data.unit && available_units.includes(data.unit))){
            errors['unit'] = "Please enter a valid unit";
        }
        //check if we have some images inside the order
        if (!(data.image_order && data.image_order.length!=0)){
            errors['image_order'] = "Please upload images";
        }

        if ((!data.start_month || !data.end_month) || (data.start_month<0 || data.end_month>11))
        {
            errors['months'] = "Te rugăm să selectezi o perioadă validă!";
        }

        if (!data.neperisabil && !data.perisabil)
        {
            errors['perisabil'] = "Te rugăm să alegi!";
        }

        if (!data.trans_type || data.trans_type<1 || data.trans_type>4 || (data.perisabil && (data.trans_type>3 || data.trans_type<1)))
        {
            errors['trans_type'] = "Te rugăm să alegi!";
        }

    //if the unit is b
    if (data.unit && data.unit=='b'){
        //we check id the unit weight is present 
        if (!data.unit_weight || data.unit_weight<1){
            errors['unit_weight'] = "Please set the unit weight!";
        }
    }
        pool.getConnection((err,conn)=>{
            if (err){
                errors['server'] = "mysql";
                res(errors);
            }
            else{
                let promises = [];
                //we have a connection 
                //check the points 
                if (data.wpoints.length!=0)
                promises.push(wpoints_valid(data.wpoints,user_id,conn));
                else{
                    errors['wpoints'] = "Please select some points";
                }
                //check the category
                if (!(data.categorie && data.categorie.trim().length!=0)){
                    errors['categorie'] = "Please select a category";
                }
                else{
                    promises.push(categorie_valid(data.categorie,conn));
                }
            
            Promise.allSettled(promises).then((reponse)=>{
                conn.release();
                console.log(reponse);
                    //index 0 is the points 
                    let resp_data = {};
                    if (reponse[0].status!='fulfilled')
                    {
                        errors['wpoints'] = "Server error";
                    }
                    else{
                        if (reponse[0].value.length!=0)
                        resp_data.good_points = reponse[0].value;
                        else{
                            errors['wpoints'] = "Please select valid points!";
                        }
                    }
                    if (reponse.length>1){
                    //check the category 
                    if ( reponse[1].status!='fulfilled')
                    {
                        errors['category'] = "Server error";
                    }
                    else{
                        if (reponse[1].value.length!=0)
                        resp_data.cat_id = reponse[1].value[0].id;
                        else{
                            errors['category'] = "Category not valid";
                        }
                    }
                }
                    res({"err":errors,resp_data});

            })
        }
        })
         
     })
 }

function insert_prod(received_data,user_id,files,fs){
    //now we can insert 
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                console.log(err);
                rej("mysql");

            }
            else{
                let slug = received_data.prod_title.trim().toLowerCase();
                let perisabil = received_data.perisabil ? 1 : 0;
                conn.query("INSERT INTO frv_prods (user_id,points,name,description,price,unit,cat,unit_weight,product_name_real,slug,start_month,end_month,perisabil,trans,sel_type,price_per_kg) VALUES ("+user_id+","+mysql.escape(JSON.stringify(received_data.wpoints))+","+mysql.escape(received_data.prod_title)+","+mysql.escape(received_data.desc)+","+mysql.escape(received_data.price)+","+mysql.escape(received_data.unit)+","+received_data.categorie+","+received_data.unit_weight+","+mysql.escape(received_data.prod_name)+","+mysql.escape(slug)+","+parseInt(received_data.start_month)+","+parseInt(received_data.end_month)+","+perisabil+","+parseInt(received_data.trans_type ||4)+","+parseInt(received_data.sel_type || 1)+","+parseInt(received_data.price_per_kg)+")",(error,results,fields)=>{
                    if (error){
                        conn.release();
                        console.log(error);
                        rej("mysql");
                    }
                    else{
                        
                        let file_query = "";
                        let id = results.insertId;
                        //we should get the max index in our current db 
                        conn.query("SELECT max(pic_index) as pic_i from frv_prod_images where product_id = "+id+" ",(err,results,fields)=>{
                            if (err){
                                conn.release();
                                //go on
                                rej("mysql");
                            }
                            else{
                                let start_index;
                                //here we build the query and do the image to db
                                if (results.length!=0)
                                {
                                    start_index = results[0]["pic_i"]!=null ? results[0]["pic_i"] : 0;
                                }
                                else{
                                    start_index = 0;
                                }
                                
                        for (index in files){
                            
                            file_query += " ("+id+","+mysql.escape(files[index].substr(1,files[index].length))+", "+start_index+"),";
                            start_index++;
                            //TODO
                            

                        }
                        
                        file_query = file_query.substr(0,file_query.length-1);        
                    
                        if (files.length!=0){
                            conn.query("INSERT INTO frv_prod_images (product_id,file_name,pic_index) VALUES "+file_query+" ",(err,results,fields)=>{
                               
                                if (err){
                                    
                                    //here we delete 
                                    conn.query("DELETE FROM frv_prods where id = "+id+" ",(err,results,fields)=>{
                                        conn.release();
                                        console.log(err);
                                        rej("images");
                                    });
                                }
                                else{
                                    //move from preview to /uploads
                                    for (index in files){
                                        try{
                                        let img_name = files[index].substr(1,files[index].length);
                                        fs.renameSync("./previews/"+img_name,"./uploads/"+img_name);
                                        }
                                        catch
                                        {

                                        }
                                    }
                                    //now insert the stocks 
                                    let stock_query = "";

                                    for (index in received_data.wpoints){
                                        let point_id = received_data.wpoints[index];
                                        let stock = parseInt(received_data.stocks[point_id]);

                                        stock_query += "("+stock+","+point_id+","+id+"),";
                                    }
                                    stock_query = stock_query.substr(0,stock_query.length-1);
                                    console.log(stock_query);
                                    conn.query("INSERT INTO frv_stocks (stock_qty,point_id,product_id) VALUES "+stock_query+" ",(err,results,fields)=>{
                                        if (err){
                                            conn.query("DELETE FROM frv_prods where id = "+id+" ",(err,results,fields)=>{
                                                conn.release();
                                                console.log(err);
                                                rej("stocks");
                                        })
                                    }
                                    else{
                                        console.log(received_data);
                                        //insert reservation if needed
                                        if (received_data.reservation && received_data.proforma)
                                        {
                                            received_data.proforma = received_data.proforma.split("_")[1];
                                            console.log("fsd");
                                            //first check if proforma_id is user's
                                            is_this_user_proforma(user_id,received_data.proforma).then(()=>{
                                                console.log("da");
                                                conn.query("INSERT INTO reservation_info (prod_id,start_date,end_date,need_pay,id_proforma) VALUES ("+parseInt(id)+","+mysql.escape(received_data.reservation_data.start_date)+","+mysql.escape(received_data.reservation_data.end_date)+","+parseInt(received_data.need_pay)+","+parseInt(received_data.proforma)+") ",(err,results,fields)=>{
                                                if (err){
                                                    conn.release();
                                                    rej();
                                                }
                                                else{
                                                    //insert dates,conds and cases 
                                                    //dates 
                                                    let dates_sql = "INSERT INTO reservation_dates (prod_id,date) VALUES ";
                                                    let res_dates = received_data.reservation_data.del_dates;
                                                    res_dates.map((value)=>{
                                                        dates_sql+= `(${id},${mysql.escape(value)}),`; 
                                                    })
                                                    dates_sql = dates_sql.substring(0,dates_sql.length-1);
                                                    
                                                    //conds 
                                                    let conds_sql = "INSERT INTO reservation_conds (prod_id,type,judete,days_val,time_val) VALUES ";

                                                    let cond_dates = received_data.reservation_data.del_conds;

                                                    cond_dates.map((cond)=>{
                                                        if (cond.type==1)
                                                        conds_sql+= `(${id},${parseInt(cond.type)},${mysql.escape(JSON.stringify(cond.cond_data))},'',''),`;
                                                        else if (cond.type==2)
                                                        {
                                                            conds_sql+= `(${id},${parseInt(cond.type)},'',${parseInt(cond.days_value)},${mysql.escape(cond.time_value)}),`;

                                                        }
                                                    })
                                                    conds_sql = conds_sql.substring(0,conds_sql.length-1);

                                                    //prices cases 
                                                    let prices_cases_sql = "INSERT INTO reservation_prices (prod_id,price,type,judete) VALUES ";

                                                    let price_cases = received_data.reservation_data.price_cases;

                                                    price_cases.map((case_o)=>{
                                                        if (case_o.type==1)
                                                        {   
                                                            prices_cases_sql += `(${id},${parseInt(case_o.price)},1,${mysql.escape(JSON.stringify(case_o.values))}),`;
                                                        }
                                                    })
                                                    prices_cases_sql = prices_cases_sql.substring(0,prices_cases_sql.length-1);
                                                    conn.query(dates_sql,(err,results,fields)=>{
                                                        if (err){
                                                            console.log(err);
                                                            conn.release();
                                                            rej();
                                                        }
                                                        else{
                                                            conn.query(conds_sql,(err,results,fields)=>{
                                                                if (err){
                                                                    console.log(err);
                                                                    conn.release();
                                                                    rej();
                                                                }
                                                                else{
                                                                    conn.query(prices_cases_sql,(err,results,fields)=>{
                                                                        if (err){
                                                                            console.log(err);
                                                                            conn.release();
                                                                            rej();
                                                                        }
                                                                        else{
                                                                            res();
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    });
                                                    
                                                }
                                            })
                                        }).catch((err)=>{
                                            rej();
                                        })
                                            
                                        }
                                        else{
                                            conn.release();
                                            res();
                                        }
                                    }
                                    })
                                }
                                
                            })
                        }
                        else{
                            conn.release();
                            res();
                        }

                    }
                })
                        
                    }
                })
                               
            }
        })
    })
}

function is_this_user_proforma(user_id,proforma_id)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT id from frv_proforma where id = "+parseInt(proforma_id)+" and user_id = "+user_id+"",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        console.log(err);
                        rej();
                    }
                    else{
                        if (results.length!=0)
                        res();
                        else rej();
                    }
                })
            }
        })
    })
}
function upload_files_for_prod(prod_id,files){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");

            }
            else{
                    //we should get the max index in our current db 
                    conn.query("SELECT max(pic_index) as pic_i from frv_prod_images where product_id = "+prod_id+" ",(err,results,fields)=>{
                        if (err){
                            conn.release();
                            //go on
                            rej("mysql");
                        }
                        else{
                            let start_index,file_query = "";
                            //here we build the query and do the image to db
                            if (results.length!=0)
                            {
                                start_index = results[0]["pic_i"]!=null ? results[0]["pic_i"] : 0;
                            }
                            else{
                                start_index = 0;
                            }
                            
                    for (index in files){
                        start_index++;
                        console.log(file_query);
                        file_query += " SELECT "+prod_id+","+mysql.escape(files[index].filename)+", "+start_index+" UNION";

                    }
                    console.log(file_query);
                    file_query = file_query.substr(0,file_query.length-5);        

                    if (files.length!=0){
                        conn.query("INSERT INTO frv_prod_images (product_id,file_name,pic_index) "+file_query+" ",(err,results,fields)=>{
                            conn.release();
                            if (err){
                                console.log(err);
                                rej("mysql");
                            }
                            else
                            {
                                res();
                            }
                        })
                    }
                    else{
                        conn.release();
                        res();
                    }

                    }
                    })
            }
        })
    })
}


function get_user_farms(sc,user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                //run the quer
                if (sc == null){
                    sc = "";
                } 
                conn.query("SELECT * from farms where farm_owner = "+user_id+" AND farm_name LIKE "+mysql.escape('%'+sc.trim()+'%')+" ",(error,results,fields)=>{
                    conn.release();
                    if (error){
                        console.log(error);
                        rej("mysql");
                    }else{
                        res(results);
                    }
                })
            }
        })
    })
}

function get_cats_all(){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                console.log(err);
                rej("mysql");
            }
            else{
                
                conn.query("SELECT id,categorie from frm_cats ",(error,results,fields)=>{
                    conn.release();
                    if (error){
                        console.log(error);
                        rej("mysql");
                    }
                    else{
                       // console.log(results);
                        res(results);
                    }
                })
            }
        })
    })
}
async function get_cats(point_id,farm_owner,con){
    return new Promise((res,rej)=>{
        con.query("SELECT categorie from frm_cats where id in (SELECT DISTINCT (cat) from frv_prods where user_id = "+farm_owner+" AND JSON_CONTAINS(points,"+mysql.escape(point_id.toString())+" ,'$')) ",(err,results,fields)=>{
            if (err){
                console.log(err);
                rej("mysql");
            }
            else{
                //console.log(results);
                res(results);
            }
        })
    }).then((response)=>{
        return response;
    }).catch((err)=>{
        return err;
    })
}
async function get_sold_cats(data){
    //data contsins the points that are displayed opn the map
    return await new Promise((res,rej)=>{
        pool.getConnection(async (err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                
                //run the query for each data id
                let object;
                let data2 = {};
                for (index in data){
                    object = data[index];
            
                    data2[object.id] = await get_cats(object.id,object.farm_owner,conn);
                    //run the query 
                }
                conn.release();
                
                res(data2);
            }
         
        })
    }).then((response)=>{
        return response;
    }).catch((err)=>{
        return err;
    })
}

async function get_prods_for_point(point_id,farm_owner,con,search,categorie){
    return await new Promise((res,rej)=>{
        let cat = "";
        console.log(categorie);
        if (categorie!=null && categorie.trim()!=""){
        if (search==null || search.trim()==""){
            //we have no search, 
            cat = " AND cat IN (select child from (select * from frv_cat_tree order by parent, child) s, (select @pv := '"+parseInt(categorie)+"') initialisation where find_in_set(parent, @pv) > 0 and @pv := concat(@pv, ',', child)) OR cat = "+parseInt(categorie)+" ";
        }
        else{
            //we have search and cat 
            cat = " AND (cat IN (select child from (select * from frv_cat_tree order by parent, child) s, (select @pv := '"+parseInt(categorie)+"') initialisation where find_in_set(parent, @pv) > 0 and @pv := concat(@pv, ',', child)) OR cat = "+parseInt(categorie)+") AND name LIKE "+mysql.escape('%'+search+'%')+" ";
        }
    }
    else{
        let search_words = search.split(" ");

     search_words.map(word=>{
        if (word.trim()!="")
        cat += ` and name LIKE ${mysql.escape('%'+word+'%')} `;
    })
        
    }   
 
        con.query("SELECT name,slug,sel_type,(Select slug as user_slug from farmer_slugs where farmer_slugs.user_id = "+parseInt(farm_owner)+" ) as user_slug,(SELECT file_name from frv_prod_images where frv_prod_images.product_id = frv_prods.id ORDER BY frv_prod_images.pic_index LIMIT 1) as images,id from frv_prods where user_id = "+farm_owner+"  "+cat+" AND JSON_CONTAINS(points,"+mysql.escape(point_id.toString())+",'$') ",(error,results,fields)=>{
            if(error){
                console.log(error);
                rej("mysql");
            }
            else{
              
                res(results);
            }
        })
    }).then((response)=>{
        return response;
    }).catch((err)=>{
        return err;
    })
}

async function get_sold_prods(data)
{
    return await new Promise((res,rej)=>{
        pool.getConnection(async (err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                let object;
                let returned_data = {};
                let obj_data = data.data;
                for (index in obj_data){
                    let object = obj_data[index];
                   // console.log(object.id);
                    returned_data[object.id] = await get_prods_for_point(object.id,object.farm_owner,conn,data.search,data.categorie);
                }
                res(returned_data);
                conn.release();
            }
        })
    }).then((response)=>{
        return response;
    }).catch((err)=>{
        return err;
    })
}


function get_all_sold_prods(user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                conn.query("SELECT frv_prods.*,(SELECT file_name from frv_prod_images where frv_prod_images.product_id = frv_prods.id LIMIT 1) as images,(SELECT SUM(stars)/COUNT(stars) from frv_ratings where prod_id = frv_prods.id ) as rating,farmer_slugs.slug as farmer_slug  from frv_prods join farmer_slugs on farmer_slugs.user_id = frv_prods.user_id where frv_prods.user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        console.log(err);
                        rej("mysql");
                    }
                    else{
                        //console.log(results);
                        res(results);
                    }

                })
            }
        })
    })
}

function get_all_sold_prods_slug(user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                conn.query("SELECT *,(SELECT slug from farmer_slugs where user_id = "+parseInt(user_id)+" LIMIT 1 ) as farmer_slug,(SELECT file_name from frv_prod_images where frv_prod_images.product_id = frv_prods.id LIMIT 1) as images  from frv_prods where user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        console.log(err);
                        rej("mysql");
                    }
                    else{
                        //console.log(results);
                        res(results);
                    }

                })
            }
        })
    })
}

function get_prod_data(prod_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                let details,images, wpoints;

                details = get_prod_details(prod_id,conn);
                images = get_all_prod_images(prod_id,conn);
                wpoints = get_all_prod_points(prod_id,conn);

                Promise.allSettled([details,images,wpoints]).then((response)=>{
                    let final_data = {};
                    
                    if (response[0].status=="fulfilled")
                    {
                        final_data.details = response[0].value;
                    }

                    if (response[1].status == "fulfilled")
                    final_data.images = response[1].value;

                    if (response[2].status == "fulfilled")
                    final_data.points = response[2].value;

                    if (final_data.details && final_data.images && final_data.points)
                    {
                        res(final_data);
                    }
                    else{
                        rej();
                    }

                })
            }
        })
    })
}
function get_prod_details(prod_id,conn){
    return new Promise((res,rej)=>{
        conn.query("Select * from frv_prods where id = "+prod_id+" ",(err,results,fields)=>{
            if (err){
                rej();
            }
            else{
                if (results.length!=0)
                res(results[0]);
                else
                rej();
            }
        })
    })
}
function get_all_prod_images(prod_id,conn)
{
    return new Promise((res,rej)=>{
        conn.query("SELECT file_name from frv_prod_images WHERE product_id = "+prod_id+" order by pic_index asc ",(err,results,fields)=>{
            if (err){
                console.log(err);
                rej();
                
            }
            else{
                res(results);
            }
        })
    })
}

function get_all_prod_points(prod_id,conn)
{
    return new Promise((res,rej)=>{
        conn.query("Select frv_wpoints.* from frv_wpoints join frv_prods on frv_prods.id = "+prod_id+" and JSON_CONTAINS(frv_prods.points, CAST(frv_wpoints.id as char(50)),'$')",(err,results,fields)=>{
            if (err){
                console.log(err);
                rej();
            }
            else{
                
                res(results);
            }
        })
    })
}

function remove_item(prod_id,user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                conn.query("DELETE FROM frv_prods where user_id = "+user_id+" AND id = "+prod_id+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej("mysql");
                    }
                    else{
                        //delete pictures too 
                        //first select pic names 
                        res();
                    }
                })
            }
        })
    })
}

function is_this_my_point_id(point_id,user_id)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else
            {
                conn.query("SELECT id from frv_wpoints where id = "+parseInt(point_id)+" and farm_owner = "+parseInt(user_id)+" ",(err,results,fields)=>{
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
                            res();
                        }
                    }
                })
            }
        })
    })
}
function is_this_my_prod(prod_id,user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                conn.query("SELECT ID from frv_prods where id = "+prod_id+" AND user_id = "+user_id+" LIMIT 1",(err,results,fields)=>{
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

function get_all_prods_images(user_id,prod_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                conn.query("SELECT id,file_name from frv_prod_images where product_id = "+prod_id+" ORDER BY pic_index ASC",(err,results,fields)=>{
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


function remove_image(prod_id,img_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                console.log(err);
                rej("mysql");
            }
            else{
                console.log(img_id+" "+prod_id)
                conn.query("DELETE FROM frv_prod_images where id = "+img_id+" AND product_id = "+prod_id+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        console.log(err);
                        rej("mysql");
                    }
                    else
                    res();
                })
            }   
        })
    })
}


function update_order(prod_id,order_array,try_number = 0){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej('mysql');
            }
            else{
                let i,promises = [];
                //run the queries 
                for (i=0;i<order_array.length;i++){
                    //update the db 
                    promises.push(update_index(i,prod_id,order_array[i],conn));
                    
                }
                //now check 
                Promise.allSettled(promises).then((results)=>{
                    let aux = [];
                    for (index in results){
                        if (results[index].status!="fulfilled")
                        {
                            //something wrong 
                            aux.push(order_array[results[index].reason]);
                        }
                    }
                    if (try_number<=2 && aux.length!=0){
                        //redo it 
                        

                        update_order(prod_id,aux,try_number+1);
                    }
                    else{
                        console.log("all ok " + try_number);
                        conn.release();
                        res();
                    }
                })
            }
        })
    })
}

function update_index(index,prod_id,image_id,conn)
{
    return new Promise((res,rej)=>{
        conn.query("UPDATE frv_prod_images set pic_index = "+index+" WHERE product_id = "+prod_id+" AND id = "+image_id+" ",(err,results,fields)=>{
            if (err){
                console.log(err);
                rej(index);
            }
            else{
                res();
            }
        })
    })
}

function get_prod_id_data(user_id,prod_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                //query the connection 
                conn.query("SELECT * FROM frv_prods where id = "+prod_id+" AND user_id = "+user_id+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej(500);
                    }
                    else{
                        if (results.length!=0){
                            res(results[0]);
                        }
                        else{
                            rej(403);
                        }
                    }
                })
            }
        })
    })
}


function update_prod_data(data,user_id,try_number = 0){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                //firstly check the wpoints, because if they are not valid, no need to check others 
            wpoints_valid(data.wpoints,user_id,conn).then((reponse)=>{

                data.wpoints = reponse;

                let sql = "UPDATE frv_prods SET ";
                sql+= " points = "+mysql.escape(JSON.stringify(data.wpoints))+",";
                //check if the new name has the ok      
                if (data.prod_title && data.prod_title.trim().length!=0){
                    sql += " name = "+mysql.escape(data.prod_title)+",";
                }         
                if(data.prod_name && data.prod_name.trim().length!=0)
                {
                    sql+= " product_name_real = "+mysql.escape(data.prod_name)+",";
                }

                //check if desc is ok 
                if (data.desc && data.desc.trim().length!=0){
                    sql += " description = "+mysql.escape(data.desc)+",";
                } 
                if (data.price && data.price.trim().length!=0){
                    sql+= " price = "+data.price+",";
                }
                if (data.unit && data.unit.trim().length!=0){
                    sql+= " unit = "+mysql.escape(data.unit)+",";
                }
                sql+= " slug = "+mysql.escape(data.prod_title.trim().toLowerCase())+",";
                //check if the category is correct
                conn.query("SELECT id from frm_cats where categorie = "+mysql.escape(data.cat)+" ",(err,results,fields)=>{
                    if (err){
                        conn.release();
                        console.log(err);
                        rej("mysql");
                    }
                    else{
                       // console.log(results);
                        if (results.length==0){
                            //something wrong, return as an error 
                            conn.release();
                            rej("Please choose a valid category");
                        }
                        else{
                            //we have the cat id
                            let cat_id = results[0].id;
    
                            sql += "cat = "+cat_id+",";
    
                            //for now this is it
    
                            sql = sql.substr(0,sql.length-1);
                            //now we just run the update query 
                            conn.query(sql+" WHERE id = "+data.prod_id+" ",(err,results,fields)=>{
                                if (err){
                                    console.log(err);
                                    rej("mysql");
                                }
                                else{
                                    //now we can focus on the stock 
                                    update_stocks(data.wpoints,data.stocks,data.prod_id,conn).then((reponse)=>{
                                       // console.log(data.wpoints.join(','))
                                        conn.query("DELETE FROM frv_stocks WHERE product_id = "+data.prod_id+" and point_id NOT IN ("+data.wpoints.join(",")+")",(err,results,fields)=>{
                                            conn.release();
                                            res();
                                        })
                                    }).catch((err)=>{
                                        conn.release();
                                        rej("mysql");
                                    })

                                }
                            })
                        }
                    }
                })
            }).catch((err)=>{
                //bye 
                rej("Wpoints not valid ");
            })
           


            }
        })
    })
}

function update_stocks(good_points,stocks,prod_id,conn,try_number = 0){
    return new Promise((res,rej)=>{
        let promises = [];

        for (index in good_points){
            let point_id = good_points[index];
            let qty = stocks[point_id] ? stocks[point_id] : null;

            if (qty!=null){
                //WE CAN UPDATE 
                console.log(point_id);
                promises.push(update_point_stock(point_id,qty,prod_id,conn));
            }
            else{
                console.log("ups");
            }
        }
        let aux = {};
        Promise.allSettled(promises).then((results)=>{
            for (index in results){
                if (results[index].status!="fulfilled")
                {
                    aux[results[index].reason] = stocks[results[index].reason];
                }
            }
        if (aux.length!=0){
            res();
        }
        else{
            //redo
            update_stocks(good_points,aux,prod_id,try_number + 1);
        }
        })
    })
}

function update_point_stock(point_id,stock,prod_id,conn){
    return new Promise((res,rej)=>{
        conn.query("UPDATE frv_stocks set stock_qty = "+stock+" WHERE product_id = "+prod_id+" AND point_id = "+point_id+" ",(err,results,fields)=>{
            if (err){
                console.log(err);
                rej(point_id);
            }
            else
            {
                res();
            }
        })
    })
}

function categorie_valid(categorie,conn){
    return new Promise((res,rej)=>{
        conn.query("SELECT id FROM frm_cats where categorie = "+mysql.escape(categorie)+" ",(err,results,fields)=>{
            if (err){
                rej("cat");
            }
            else{
                res(results);
            }
        })
    })
}

function wpoints_valid(wpoints,user_id,conn){
    return new Promise((res,rej)=>{
        
        conn.query("SELECT id FROM frv_wpoints where farm_owner = "+user_id+" ",(err,results,fields)=>{
            if (err){
                console.log(err);
                rej("mysql");
            }
            else{
                console.log(results[0]);
                
                let points_array = [];
                
                for(index in results){
                    points_array.push(results[index].id);
                }

                let aux = [];
                for (index in wpoints){
                    if (points_array.includes(wpoints[index]))
                    {
                        //push to array 
                        aux.push(wpoints[index]);
                    }
                }
                res(aux);
            }

        })
    })
}

function get_stocks(prod_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                conn.query("SELECT stock_qty,point_id FROM frv_stocks where product_id = "+prod_id+" ",(err,results,fields)=>{
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

const required_point_fields_arr = ["point_name","county","city","address","nr","cod"];
function required_point_fields(data)
{
    let err = {};
    for (index in required_point_fields_arr)
    {
        if (!data[required_point_fields_arr[index]] || data[required_point_fields_arr[index]].trim().length==0)
        {
            err[required_point_fields_arr[index]] = "Completează acest câmp";
        }   
    }
    return err;
}


function get_all_offers(user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT * FROM b2b_offers JOIN b2b_statuses on b2b_statuses.offer_id = b2b_offers.id where farmer_id = "+user_id+" ",(err,results,fields)=>{
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


function get_farm_pics(user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT * FROM frv_farm_pics where user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
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

function get_farm_pics_slug(slug){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT * FROM frv_farm_pics where user_id = (SELECT user_id from farmer_slugs where slug = "+mysql.escape(slug)+" LIMIT 1 ) ",(err,results,fields)=>{
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


function insert_farm_pics(content,user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                let query = "INSERT INTO frv_farm_pics (user_id,image_name,descriere,cover)  VALUES ";

                content.map(image=>{
                    let parts = image.filename.split("/");
                    query+= `(${parseInt(user_id)},${mysql.escape(parts[parts.length-1])},${mysql.escape(image.desc)},0),`;
                })
                query = query.slice(0,-1);
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
                conn.query("")
            }
        })
    })
}

function update_cover(image_name,user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("UPDATE frv_farm_pics set cover = IF(frv_farm_pics.id = "+parseInt(image_name)+",1,0) where user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
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


function update_cover_desc(image_id,desc,user_id)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err)
            {
                rej();
            }
            else{
                conn.query("UPDATE frv_farm_pics SET descriere = "+mysql.escape(desc)+" where id = "+parseInt(image_id)+" and user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
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


function get_tesimonials(farmer_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT frv_ratings.stars,frv_ratings.title,frv_ratings.comments,users.username FROM frv_ratings join frv_prods on frv_prods.id = frv_ratings.prod_id and frv_prods.user_id = (SELECT user_id from farmer_slugs where slug = "+mysql.escape(farmer_id)+" LIMIT 1 ) join users on users.id = frv_ratings.user_id LIMIT 10 ",(err,results,fields)=>{
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

function get_farm_desc_slug(slug)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT descriere from frv_descrieri where user_id = (SELECT user_id from farmer_slugs where slug = "+mysql.escape(slug)+" LIMIT 1) ",(err,results,fields)=>{
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



function get_farm_desc(user_id)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT descriere from frv_descrieri where user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
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
    function update_farmer_desc(desc,user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    //check if exists 
                    conn.query("SELECT id from frv_descrieri where user_id = "+parseInt(user_id)+" LIMIT 1",(err,results,fields)=>{
                        if (err){
                            conn.release();
                            rej();
                        }
                        else{
                            if (results.length==0){
                                //insert
                                conn.query("INSERT INTO frv_descrieri (descriere,user_id) VALUES ("+mysql.escape(desc)+","+parseInt(user_id)+")",(err,results,fields)=>{
                                    conn.release();
                                    if (err){
                                        rej();
                                    }
                                    else{
                                        res();
                                    }
                                })
                            }
                            else{
                                //update 

                                conn.query("UPDATE frv_descrieri set descriere  = "+mysql.escape(desc)+" where user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
                                    conn.release();
                                    if (err){
                                        rej();
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

    function parse_cats(parent)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT * from frm_cats where frm_cats.id in (select child from frv_cat_tree where parent = "+parseInt(parent)+" )",(err,results,fields)=>{
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



    function delete_farm_pic(image_id,user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    //select image_name
                    conn.query("Select image_name from frv_farm_pics where id = "+parseInt(image_id)+" and user_id = "+parseInt(user_id)+" LIMIT 1",(err,results,fields)=>{
                        if (err){
                            conn.release();
                            rej();
                        }
                        else{
                            if (results.length==0){
                                //no image, then error 
                                conn.release();
                                rej();
                            }
                            else{
                                //remove the file 
                                fs.unlink("./uploads/"+results[0].image_name,function(err){
                                    if(err){
                                        console.log(err);
                                    }
                                })

                                //no delete from db 
                                conn.query("DELETE from frv_farm_pics where id = "+parseInt(image_id)+" and user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
                                    conn.release();
                                    if (err){
                                        rej();
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



    function get_cui_data(cui)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    if (cui.indexOf("RO") === 0){
                        cui = cui.replace("RO",'');
                    }
                    conn.query("SELECT nume_firma,adresa,judet,localitate from frv_firme where cui = "+mysql.escape(cui.trim())+" LIMIT 1",(err,results,fields)=>{
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


    function is_this_farmer_admin(user_id,slug)
    {
         return new Promise((res,rej)=>{
             pool.getConnection((err,conn)=>{
                 conn.query("SELECT user_id from farmer_slugs where slug = "+mysql.escape(slug)+" LIMIT 1",(err,results,fields)=>{
                     conn.release();
                     if (err){
                         res(false);
                     }
                     else{
                         if (results.length==0)
                         {
                             res(false);
                         }
                         else{
                             if (results[0].user_id == user_id)
                             {
                                res(true);
                             }
                             else{
                                 res(false);
                             }
                         }
                     }
                 })
             })
         })
    }

    function id_to_farmer_slug(user_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT slug from farmer_slugs where user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            if (results.length==0)
                            rej();
                            else
                            res(results[0].slug);
                        }
                    })
                }
            })
        })
    }

    function delete_point(point_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    //first delete the wpoint 
                    conn.query("DELETE FROM frv_wpoints where id = "+parseInt(point_id)+" ",(err,results,fields)=>{
                        if (err){
                            conn.release();
                            rej();
                        }
                        else{
                            //delete the point from prods 
                            conn.query("UPDATE frv_prods SET points = JSON_REMOVE(points, replace(json_search(points, 'one', "+parseInt(point_id)+"), '\"', '')) WHERE json_search(points, 'one' ,"+parseInt(point_id)+") IS NOT NULL",(err,results,fields)=>{
                                conn.release();
                                res();
                            })
                        }
                    })
                }
            })
        })
    }
    function get_point_data(point_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT id,point_name,lat,lng,farm_owner,judet,oras,adresa,nr,cod from frv_wpoints where id = "+parseInt(point_id)+" ",(err,results,fields)=>{
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

    function get_all_point_prods(point_id,user_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT *,(SELECT file_name from frv_prod_images where product_id = frv_prods.id ORDER BY pic_index ASC LIMIT 1) as images  FROM frv_prods  where json_contains(points,(CAST "+parseInt(point_id)+" to char(50)),'$') and user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
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

    function get_prod_count_for_user(user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT COUNT(id) as total from frv_prods where user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
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

    function get_point_count_for_user(user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT COUNT(id) as total from frv_wpoints where farm_owner = "+parseInt(user_id)+" ",(err,results,fields)=>{
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

    function farm_image_count(user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT COUNT(id) as total from frv_farm_pics where user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
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
    function had_desc(user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT COUNT(id) as total from frv_descrieri where user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
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

    function get_template_details(user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT descriere as user_data from frv_descrieri where user_id = "+parseInt(user_id)+"  UNION ALL select bis_name from users where id = "+parseInt(user_id)+"  ",(err,results,fields)=>{
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

    function get_farmer_profile_content(user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT content from farmer_page_content where user_id = "+parseInt(user_id)+" LIMIT 1",(err,results,fields)=>{
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            if (results.length==0){
                                res();
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


    function get_reservation_dates(prod_id,judet,loc,adresa)
    {   
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT * from reservation_dates where reservation_dates.prod_id = "+parseInt(prod_id)+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            //we have the dates 
                            conn.query(" select * from  reservation_conds where reservation_conds.prod_id = "+parseInt(prod_id)+"",(err,conds,fields)=>{
                                if (err){
                                    console.log(err);
                                    rej();
                                }
                                else{
                                    let date = new Date();
                                    //get judet index
                                   
                                    get_judet_index(judet).then((judet_index)=>{
                                        
                                        let dates = [];
                                        results.map((del_date)=>{
                                        //now let's find the elligible dates 
                                        let score= 0;

                                            conds.map((cond)=>{
                                                if (cond.type==1){
                                                    //compare the indexes 
                                                    let judete_array = JSON.parse(cond.judete);
                                                 
                                                    if (judete_array.indexOf(judet_index.toString())!=-1)
                                                    {
                                                        //ok
                                                        score++;
                                                       
                                                    }
                                                    else dates.push({"err": "Fermierul nu livreaza in judetul tau!"})
                                                }
                                                else if (cond.type==2)
                                                {
                                                    let date_parts = del_date.date.split("/");
                                                    let flipped_date = date_parts[2]+"-"+date_parts[1]+"-"+date_parts[0];
                                                    
                                                    let current_date =  new Date();
                                                    let target_date = new Date(flipped_date+"T"+cond.time_val);

                                                    let diff = target_date - current_date;
                                                    console.log(diff/1000/60/60/24);
                                                    console.log(del_date.date)
                                                    if (diff > parseInt(cond.days_val)*24*60*60*1000 && diff>0)
                                                    {
                                                        score++;
                                                    }

                                                
                                                }
                                            })

                                            if (score == conds.length)
                                            {
                                                dates.push({"id":del_date.id,"date":del_date.date,"disabled": false,"curr":new Date()});
                                            }
                                            else{
                                                dates.push({"id": del_date.id,"date":del_date.date,"disabled": true});

                                            }
                                        })
                                
                                        res(dates);

                                    }).catch((err)=>{
                                        console.log(err);
                                        rej();
                                    })
                              
                                }
                            })
                           
                        }
                    })
                }
            })
        })
    }


    function get_reservation_price(prod_id,judet)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT price,type,judete from reservation_prices where prod_id = "+parseInt(prod_id)+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            //first get the price 
                            //get the judet index 
                            get_judet_index(judet).then((judet_index)=>{
                                if (results.length!=0)
                                {
                                    let price = 0;
                                    results.map((price_case)=>{
                                        if (price_case.type==1)
                                        {
                                            let judete_array = JSON.parse(price_case.judete);
                                            if (judete_array.indexOf(judet_index.toString())!=-1)
                                            price = price_case.price;

                                        }
                                    })
                                    
                                    res(price);
                                }
                                else{
                                    rej();
                                }
                            }).catch((err)=>{
                                rej();
                            })  
                        }
                    })
                }
            })
        })
    }
    function get_judet_index(judet){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT id from judete where name = "+mysql.escape(judet)+" ",(err,results,fields)=>{
                            conn.release();
                        if (err){
                            console.log(err);
                            rej();
                        }
                        else{
                            if (results.length!=0)
                            res(results[0].id);
                            else{
                                rej();
                            }
                        }
                    })
                }
            })
        })
    }
   
    function insert_reservation(data,user_id,price)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    let code = order_generator.generate();
                    conn.query("INSERT INTO reservations (user_id,prod_id,judet,loc,adresa,data,qty,id_res,price,trans_price) VALUES ("+user_id+","+parseInt(data.prod_id)+","+mysql.escape(data.judet)+","+mysql.escape(data.loc)+","+mysql.escape(data.adresa)+","+parseInt(data.selected_date)+","+parseInt(data.qty)+","+mysql.escape(code)+",(SELECT price from frv_prods where frv_prods.id = "+parseInt(data.prod_id)+" LIMIT 1),"+parseInt(price)+")",(err,results,fields)=>{
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

    function get_rezervari(user_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT reservation_info.need_pay,users.real_name,users.iv_key,reservations.*,frv_prods.name,frv_prods.unit,reservation_dates.date,(SELECT file_name from frv_prod_images where frv_prod_images.product_id = reservations.prod_id ORDER by pic_index ASC LIMIT 1) as image FROM `reservations` join users on users.id = reservations.user_id join frv_prods on frv_prods.id = reservations.prod_id join reservation_dates on reservation_dates.id = reservations.data join reservation_info on reservation_info.prod_id = frv_prods.id where reservations.prod_id IN (SELECT frv_prods.id from frv_prods where frv_prods.user_id = "+parseInt(user_id)+")",(err,results,fields)=>{
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

    function is_this_my_reservation(user_id,res_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT id from reservations where id_res = "+mysql.escape(res_id)+" AND (user_id = "+parseInt(user_id)+" OR (Select frv_prods.id from frv_prods where frv_prods.user_id = "+parseInt(user_id)+" LIMIT 1))",(err,results,fields)=>{
                        conn.release();
                        if (err)
                        rej();
                        else{
                            if (results.length==0)
                            rej()
                            else 
                            res()
                        }
                    })
                }
            })
        })
    }

    function chnage_res_status(order_id,status)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("UPDATE reservations set status = "+parseInt(status)+" where id_res = "+mysql.escape(order_id)+" ",(err,results,fields)=>{
                        conn.release();
                        if (err)
                        rej();
                        else 
                        res();
                    })
                }
            })
        })
    }

    function insert_proforma(data,user_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err)
                rej();
                else 
                {
                    conn.query("INSERT INTO frv_proforma (user_id,judet,oras,adresa,cui,cont_bancar,nume_firma) VALUES("+user_id+","+mysql.escape(data.judet)+","+mysql.escape(data.oras)+","+mysql.escape(data.adresa)+","+mysql.escape(data.cui)+","+mysql.escape(data.cont)+","+mysql.escape(data.firma)+")",(err,results,fields)=>{
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

    function get_proforme(user_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err)
                rej();
                else{
                    conn.query("SELECT * FROM frv_proforma where user_id = "+user_id+" ",(err,results,fields)=>{
                        conn.release();
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

    function get_specific_res_data(res_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT users.real_name,users.iv_key,frv_proforma.nume_firma,frv_proforma.id,frv_proforma.judet as from_judet, frv_proforma.oras as from_oras, frv_proforma.adresa as from_adresa,frv_proforma.cont_bancar,frv_prods.name,frv_prods.price_per_kg,reservation_info.need_pay,reservations.*,reservation_dates.date from reservations join users on users.id = reservations.user_id join reservation_info on reservation_info.prod_id = reservations.prod_id join frv_proforma on frv_proforma.id = reservation_info.id_proforma join reservation_dates on reservation_dates.id = reservations.data join frv_prods on frv_prods.id = reservations.prod_id where reservations.id_res = "+mysql.escape(res_id)+" ",(err,results,fields)=>{
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
    
    
    
    function is_profile_complete(user_id)
    {
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("Select (Select status from req_farmers where sent_by = "+mysql.escape(user_id)+" UNION  Select status from req_farmers where req_farmers.unique_id = (Select unique_id from cc_forms where farmer_id = "+mysql.escape(user_id)+") LIMIT 1) as req, ( Select phone_ver from users where id = "+mysql.escape(user_id)+") as phone_ver , (Select email_ver from users where id = "+mysql.escape(user_id)+") as email_ver,(SELECT Count(id) from frv_farm_pics where user_id = "+mysql.escape(user_id)+" )  as farm_pic, (select Count(id) from frv_descrieri where user_id ="+mysql.escape(user_id)+") as frv_desc",(err,results,fields)=>{
                        conn.release();
                        if (err)
                            rej();
                        else{
                            if (results.length==0)
                                rej()
                            else
                            res(results[0]);
                        }
                    })
                }
            })
        })
    }
module.exports = {
    init,get_farms,validate_elems,valid_cui,insert_farm,kyc_needed_farm,check_addr,insert_point,get_workp,is_farm_ok,insert_point_as_farm,search_workp,validate_prod_data,insert_prod,
    get_user_farms,get_cats_all,get_sold_cats,get_sold_prods,get_all_sold_prods,remove_item,is_this_my_prod,get_all_prods_images,remove_image,get_prod_id_data,get_farm_desc,update_farmer_desc,
    upload_files_for_prod,update_order,update_prod_data,get_stocks,required_point_fields,get_pagination_info,get_all_offers,get_farm_pics,insert_farm_pics,update_cover,get_tesimonials,parse_cats,
    delete_farm_pic,get_cui_data,update_cover_desc,get_farm_desc_slug,is_this_farmer_admin,get_farm_pics_slug,
    get_all_sold_prods_slug,get_work_point_for_prod,slug_to_point_id,id_to_farmer_slug,get_prod_data,is_this_my_point_id,delete_point,get_point_data,
    update_point,get_all_point_prods,get_prod_count_for_user,get_point_count_for_user,farm_image_count,had_desc,get_farmer_profile_content,get_template_details,get_reservation_dates,
    get_reservation_price,insert_reservation,get_rezervari,is_this_my_reservation,chnage_res_status,insert_proforma,get_proforme,get_specific_res_data,is_profile_complete
}