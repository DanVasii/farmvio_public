
const { response } = require('express');
const { JsonWebTokenError } = require('jsonwebtoken');
const { stringify } = require('querystring');

var request = require('request');
const { parse } = require('url');

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
                conn.query("INSERT INTO frv_wpoints (point_name,lat,lng,farm_owner,judet,oras,adresa,nr,cod,farm_id,keywords)  VALUES ("+mysql.escape(point_name)+","+mysql.escape(lat)+","+mysql.escape(lng)+","+mysql.escape(farm_owner)+","+mysql.escape(judet)+","+mysql.escape(oras)+","+mysql.escape(adresa)+","+mysql.escape(nr)+","+mysql.escape(cod)+","+mysql.escape(farm_id)+","+mysql.escape(k)+")",(error,results,fields)=>{
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
    else
    {
        return false;
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
                                console.log(join_start);
                            }
                            if (!join_start.includes("and"))
                            {
                                join_start = "";
                            }

                            console.log(join_start)

                          console.log(page + "aoc");

                            //we have a connection run the query 
                            con.query("SELECT Distinct  lat,lng,point_name,farm_owner,frv_wpoints.id, (6371 * acos (cos ( radians("+mysql.escape(center.lat)+") ) * cos( radians( lat ) ) * cos( radians( lng ) - radians("+mysql.escape(center.lng)+") )+ sin ( radians("+mysql.escape(center.lat)+") )* sin( radians( lat ) ))) AS distance FROM frv_wpoints   "+join_start+"   HAVING distance < "+mysql.escape(radius)+" ORDER BY distance  LIMIT "+(25*page)+",25  ",(err,data,fields)=>{
                                con.release();
                                if (err)
                                {
                                    console.log(err);
                                    rej("err");
                                }
                                else{
                                    console.log(data);
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
                let join_start = " join frv_prods on JSON_CONTAINS(frv_prods.points,CAST(frv_wpoints.id as CHAR(50)),'$')";
            
                if (categorie)
                {

                    join_start += " and frv_prods.cat = (SELECT id from frm_cats where frm_cats.categorie = "+mysql.escape(categorie)+")";
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
                conn.query("INSERT INTO frv_prods (user_id,points,name,description,price,unit,cat,unit_weight,product_name_real) VALUES ("+user_id+","+mysql.escape(JSON.stringify(received_data.wpoints))+","+mysql.escape(received_data.prod_title)+","+mysql.escape(received_data.desc)+","+mysql.escape(received_data.price)+","+mysql.escape(received_data.unit)+","+received_data.categorie+","+received_data.unit_weight+","+mysql.escape(received_data.prod_name)+")",(error,results,fields)=>{
                    if (error){
                        conn.release();
                        console.log(error);
                        rej("mysql");
                    }
                    else{
                        console.log("ok');");
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
                                        let img_name = files[index].substr(1,files[index].length);
                                        fs.renameSync("./previews/"+img_name,"./uploads/"+img_name);
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
                                        conn.release();
                                        res();
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
        con.query("SELECT categorie from frm_cats where id in (SELECT DISTINCT (cat) from frv_prods where user_id = "+farm_owner+" AND JSON_CONTAINS(points,"+mysql.escape(point_id.toString())+",'$')) ",(err,results,fields)=>{
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
 
        con.query("SELECT name,(SELECT file_name from frv_prod_images where frv_prod_images.product_id = frv_prods.id ORDER BY frv_prod_images.pic_index LIMIT 1) as images,id from frv_prods where user_id = "+farm_owner+"  "+cat+" AND JSON_CONTAINS(points,"+mysql.escape(point_id.toString())+",'$') ",(error,results,fields)=>{
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
                conn.query("SELECT *,(SELECT file_name from frv_prod_images where frv_prod_images.product_id = frv_prods.id LIMIT 1) as images  from frv_prods where user_id = "+user_id+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
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
                if (data.prod_name && data.prod_name.trim().length!=0){
                    sql += " name = "+mysql.escape(data.prod_name)+",";
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
            err[required_point_fields_arr[index]] = "Please complete this field";
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
                conn.query("UPDATE frv_farm_pics set cover = IF(image_name = "+mysql.escape(image_name)+",1,0) where user_id = "+parseInt(user_id)+" ",(err,results,fields)=>{
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
                conn.query("SELECT frv_ratings.stars,frv_ratings.title,frv_ratings.comments,users.username FROM frv_ratings join frv_prods on frv_prods.id = frv_ratings.prod_id and frv_prods.user_id = "+farmer_id+" join users on users.id = frv_ratings.user_id LIMIT 10 ",(err,results,fields)=>{
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
module.exports = {
    init,get_farms,validate_elems,valid_cui,insert_farm,kyc_needed_farm,check_addr,insert_point,get_workp,is_farm_ok,insert_point_as_farm,search_workp,validate_prod_data,insert_prod,
    get_user_farms,get_cats_all,get_sold_cats,get_sold_prods,get_all_sold_prods,remove_item,is_this_my_prod,get_all_prods_images,remove_image,get_prod_id_data,get_farm_desc,update_farmer_desc,
    upload_files_for_prod,update_order,update_prod_data,get_stocks,required_point_fields,get_pagination_info,get_all_offers,get_farm_pics,insert_farm_pics,update_cover,get_tesimonials,parse_cats
}