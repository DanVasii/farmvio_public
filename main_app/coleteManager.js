
var mysql,pool,admin_token = null,admin_request_time = 0,axios,logger;
mysql = pool = null;
const { base64encode, base64decode } = require('nodejs-base64');
const token_body = new URLSearchParams();
token_body.append('grant_type', 'client_credentials');

function init(p,m,a,l){
    pool = p;
    mysql = m;
    axios = a;
    logger = l;
}

function request_admin_token(anyways = false){  
   
    return new Promise((res,rej)=>{
        console.log(Date.now() - admin_request_time);
        if(admin_token && !anyways){
            console.log(Date.now() - admin_request_time)
            //we have the admin token , let's check the request time 
            if (Date.now() - admin_request_time <= 1000*60*115)
            {
                //the token is ok, we can use it
                console.log("gotten from server var "+admin_request_time);
                res(admin_token);
            }
            else{
                //we better parse a new one 
                 request_admin_token(true).then((token)=>{
                    res(token);
                }).catch((err)=>{
                    rej("mysql");
                })
            }
        }
        else{
            //maybe the server just crashed and we have the oken in our db
            //check this 
            pool.getConnection((err,conn)=>{
                if (err){
                    rej("mysql");
                }
                else{
                    conn.query("SELECT request_time,token from dlv_tokens where user_id = -1 AND request_time >= DATE_SUB(NOW(),INTERVAL 115 MINUTE)",(err,results,fields)=>{
                        
                        if (err){
                            conn.release();
                            console.log(err);
                            rej("mysql");
                        }
                       
                        else if (results.length==0){
                           
                            Promise.allSettled([parse_admin_token()]).then((response)=>{
                             
                                let token = response[0].value.data.access_token;
                                conn.query("INSERT INTO dlv_tokens (user_id,token) VALUES (-1,"+mysql.escape(token)+") ",(err,results,firelds)=>{
                                    conn.release();
                                    if (err){
                                        rej("mysql");
                                    }
                                    else{
                                        admin_request_time = Date.now();
                                        admin_token = token;
                                        res(token);

                                    }
                                })
                            })
                            
                        }
                        else{
                            console.log("gotten from db")
                            admin_request_time = new Date(results[results.length - 1].request_time).getTime();
                            admin_token =  results[ results.length - 1].token;
                            res(results[ results.length - 1].token);
                        }
                    })
                }
            })
        }
    })
        
    
}

function parse_admin_token(){

    
        let admin_key = base64encode(process.env.COLETE_CLIENT_ID+":"+process.env.COLETE_SECRET)

       return axios.post('https://auth.colete-online.ro/token', 
            token_body
        ,{headers:{
            'Content-Type': 'application/x-www-form-urlencoded',
            "Authorization":"Basic "+admin_key
          }})
   

    
}

function parse_client_token(client_id,client_secret){
    return new Promise((res,rej)=>{
        let admin_key = base64encode(client_id.trim()+":"+client_secret.trim())

        axios.post('https://auth.colete-online.ro/token', 
            token_body
        ,{headers:{
            'Content-Type': 'application/x-www-form-urlencoded',
            "Authorization":"Basic "+admin_key
          }})
          .then(function (response) {
           // console.log(response);
            let token = response.data.access_token;
            res(token);
            
          }).catch((err)=>{
              rej(err);
          })
    })
}

function request_client_token(user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT token from dlv_tokens where user_id = "+user_id+" AND request_time >= DATE_SUB(NOW(),INTERVAL 2 HOUR) ",(err,results,fields)=>{
                        if (err){
                            console.log(err);
                            conn.release();
                            rej();
                        }
                        else{
                            if (results.length != 0){
                                res(results[0].token);
                            }
                            else{
                                //parse the token 
                                conn.query("SELECT client_id,client_secret from dlv_credentials where user_id = "+user_id+" ",(err,results,fields)=>{
                                    if (err){
                                        console.log(err);

                                        conn.release();
                                        rej();
                                    }
                                    else{
                                        if (results.length!=0){
                                            //we have something
                                            //we can parse the token 
                                            parse_client_token(results[0].client_id.trim(),results[0].client_secret.trim()).then((token)=>{
                                                    //insert this token 
                                                    conn.query("INSERT INTO dlv_tokens (user_id,token) VALUES  ("+user_id+","+mysql.escape(token)+") ",(err,results,fields)=>{
                                                        conn.release();
                                                        res(token);
                                                    })
                                            }).catch((err)=>{
                                                conn.release();
                                                rej({"err":"Te rugăm să încerci mai târziu!"});
                                            })
                                        }
                                        else{
                                            conn.release();
                                            rej({"err":"Nu ai setate datele pentru colete-online!"});
                                        }
                                    }
                                })
                            }
                        }
                    })
                }
            })
        })
}


//function to get the cost for some point ids

function get_point_address(cart_content){
    return new Promise((res,rej)=>{
    //build the point_ids array 
    cart_content = JSON.parse(cart_content);
    let point_ids = [];
    for (index in cart_content){
        if (!point_ids.includes(cart_content[index].point_id))
        point_ids.push(cart_content[index].point_id);
    }

    pool.getConnection((err,conn)=>{
        if (err){
            rej("mysql");
        }
        else{
            conn.query("SELECT id,judet,oras,adresa,nr,cod FROM frv_wpoints where id IN ("+point_ids.join(',')+") ",(err,results,fields)=>{
                conn.release();
                if (err){
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
 
function get_weights(cart_content){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                cart_content = JSON.parse(cart_content);
                //build the prod_ids 
                let prod_ids = [];
                for (index in cart_content)
                {
                    prod_ids.push(cart_content[index].product_id);

                }

                //query 
                conn.query("SELECT id,unit_weight FROM frv_prods where id IN ("+prod_ids.join(',')+") ",(err,results,fields)=>{
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

function get_weight_for(product_id,weights){
    for (index2 in weights){
        if (weights[index2].id == product_id){
            return weights[index2].unit_weight;
        }
    }
    return 1;
}
function get_cost_estimates(user_address,points_address,weights,cart_content,token){
    return new Promise((res,rej)=>{
   //foreach point 
    //try to parse the user_address
    try{
      
        
        user_address = JSON.parse(user_address);
        cart_content = JSON.parse(cart_content);
       
    }
    catch{
        rej("json");
    }
   
   if (points_address.length!=0){
    let points_promises = [];    
    
    for (index in points_address){
        
          //sum the weights
          let total_weight = 0; 
          let send = true;
          let min_trans = 9;
            let point_id = points_address[index].id;
            
            console.log(index);

        for (index_cart in cart_content){
            if (cart_content[index_cart].point_id == points_address[index].id )
            {
                total_weight = total_weight + (parseInt(cart_content[index_cart].qty) * parseInt(get_weight_for(cart_content[index_cart].product_id,weights)));
                if (cart_content[index_cart].perisabil == 1)
                {
                    send = false;
                    if(cart_content[index_cart].trans < min_trans)
                        min_trans = cart_content[index_cart].trans;
                }
            }
            
        }
        console.log(index);
            if (send)
          points_promises.push(get_point_user_price(user_address,points_address[index],token,total_weight,point_id));
          else{
              console.log(min_trans);
              points_promises.push(fake_promise(min_trans,point_id))
          }
        }



        Promise.allSettled(points_promises).then((reponse)=>{
      
            res(reponse);
        })
    }
    else{
        //not good 
        rej("mysql");
    }
    })
 
}

function fake_promise(trans_type,wpid)
{
    return new Promise((res,rej)=>{
        
        switch(trans_type)
        {
            case 1:
                 res({"wpid": wpid,"list":[{"service":{"id":101,"courierName":"Ridicare personala"},"price":{"total":"0 RON"}} ]  })
            break;
            case 2:
                 res({"wpid": wpid,"list":[{"service":{"id":102,"courierName":"Transport realizat fermier"},"price":{"total":"0 RON"}} ]  })
            break;
            case 3:
                res({"wpid": wpid,"list":[{"service":{"id":101,"courierName":"Ridicare personala"},"price":{"total":"0 RON"}},{"service":{"id":102,"courierName":"Transport realizat fermier"},"price":{"total":"0 RON"}} ]  })
            break;
        }
    })
}

function get_point_user_price(user_address,point_address,token,weight,point_id)
{
    //for one single point 
    return new Promise((res,rej)=>{
        let body = {};
        body.sender = {};
        body.sender.contact = {};
        body.validationStrategy = "priceMinimal";
        body.sender.contact.name = "test test";
        body.sender.contact.phone = "+40727382665"
        body.sender.contact.email = "test@yahoo.com";
        body.sender.address = {};
        //sender addr
        body.sender.address.countryCode = "RO";
        body.sender.address.postalCode = point_address.cod.trim();
        body.sender.address.city = point_address.oras.trim();
        body.sender.address.county = point_address.judet.trim();
        body.sender.address.street = point_address.adresa.replace("Strada ",'').trim();
        body.sender.address.number = (point_address.nr.toString() || "1");
        body.sender.validationStrategy = "minimal";
        body.recipient = {};
        body.recipient.contact = {};
        //recipient contaxt 
        body.recipient.contact.name = "tes2t tes2t";
        body.recipient.contact.phone = "+40727585645"
        body.recipient.contact.email = "test@yahoo.com";

        body.recipient.address = {};
        //recipient  addr 
        body.recipient.address.countryCode = "RO";
        body.recipient.address.postalCode = user_address.cod.trim();
        body.recipient.address.city = user_address.oras.trim();
        body.recipient.address.county = user_address.judet.trim();
        body.recipient.address.street = user_address.strada.trim();
        body.recipient.address.number = (user_address?.numar.toString() || "1");
        body.recipient.validationStrategy = "minimal";
        body.packages = {};
        //package 
        body.packages.type = 2;
        body.packages.content = "test";
      
        body.packages.list = [{
            "weight": weight,
            "width": 15,
            "height": 17,
            "length": 19
        }];
        //service 
        body.service = {};
        body.service.selectionType = "bestPrice";
        body.service.serviceIds = [1,2,3,4,5,6,7,8,9,10,11,12,13,14];
            body.service.extraOptions = [];


        axios.post('https://api.colete-online.ro/v1/order/price', 
              body
            ,{headers:{
                'Content-Type': 'application/json',
                "Accept": 'application/json',
                "Authorization":"Bearer "+admin_token
            }})
            .then(function (response) {
            // console.log(response);
                response.data.wpid = point_id;
                    res(response.data );
            }).catch((err)=>{
                console.log(err.response.data);
                rej(err.response.data);
            })
    })

}

function get_all_couriers(token)
{
    return new Promise((res,rej)=>{
            axios.get('https://api.colete-online.ro/v1/service/list'
        ,{headers:{
            "Accept": 'application/json',
            "Authorization":"Bearer "+token
        }})
        .then(function (response) {
           // console.log(response.data);
                res(response.data);
        }).catch((err)=>{
            rej(err);
        })
    })
}

function calculate_cost(addr_one,addr_two,sizes,courier_id){
    return new Promise((res,rej)=>{
        
        let body = {};
        body.sender = {};
        body.sender.contact = {};

        body.sender.contact.name = "test test";
        body.sender.contact.phone = "+40727385665"
        body.sender.contact.email = "vasiidanemanuel@yahoo.com";
        body.sender.address = {};
        //sender addr
        body.sender.address.countryCode = "RO";
        console.log(addr_one);
        body.sender.address.postalCode = addr_one.cod.trim();
        body.sender.address.city = addr_one.oras.trim();
        body.sender.address.county = addr_one.judet.trim();
        body.sender.address.street = addr_one.adresa.replace("Strada ",'').trim();
        body.sender.address.number = (addr_one.nr.toString() || "1");
        body.sender.validationStrategy = "minimal";

        body.recipient = {};
        body.recipient.contact = {};
        //recipient contaxt 
        body.recipient.contact.name = "tes2t tes2t";
        body.recipient.contact.phone = "+40727385645"
        body.recipient.contact.email = "vasiidanemanuel2@yahoo.com";

        body.recipient.address = {};
        //recipient  addr 
        body.recipient.address.countryCode = "RO";
        body.recipient.address.postalCode = addr_two.cod.trim();
        body.recipient.address.city = addr_two.oras.trim();
        body.recipient.address.county = addr_two.judet.trim();
        body.recipient.address.street = addr_two.adresa.trim();
        body.recipient.address.number = (addr_two.nr.toString() || "1");

        body.recipient.validationStrategy = "minimal";

        body.packages = {};
        //package 
        body.packages.type = 2;
        body.packages.content = "test";
      
        body.packages.list = [{
            "weight": sizes.weight,
            "width": sizes.width,
            "height": sizes.height,
            "length": sizes.len
        }];
        //service 
        body.service = {};
        body.service.selectionType = "directId";
        body.service.serviceIds = [courier_id];
            body.service.extraOptions = [];

        axios.post('https://api.colete-online.ro/v1/order/price', 
              body
            ,{headers:{
                'Content-Type': 'application/json',
                "Accept": 'application/json',
                "Authorization":"Bearer "+admin_token.trim()
            }})
            .then(function (response) {
            // console.log(response);
                    res(response);
            }).catch((err)=>{
                console.log(err);
                rej(err);
            })
    })
}

function sanitize_street(street){
    let regex = /^(Strada|Str\.|Str)/gmi;

    return street.replace(regex,'').trim();
}

function validate_address(data){
    return new Promise((res,rej)=>{

        //first we strip the Strada,Str.,Str
        let regex = /^(Strada|Str\.|Str)/gmi;

        data.strada = data.strada.replace(regex,'');


        data.nr_st = parseInt(data.nr_st);
        //now to the request to colete 
    
        let url = "https://api.colete-online.ro/v1/search/validate-postal-code/RO/"+encodeURIComponent(data.oras.trim())+"/"+encodeURIComponent(data.judet.trim())+"/"+encodeURIComponent(data.strada.trim())+"/"+encodeURIComponent(data.cod.trim())+"";
        //run the query 
        console.log(url);
        axios.get(url,{headers:{
            "Accept": 'application/json',
            "Authorization":"Bearer "+admin_token
        },params:{
            "validateStreet":0
        }
    }
    ).then((response)=>{
            console.log(response.data.location);
            res(response.data.location);
        }).catch((err)=>{
            console.log(err.response.data);
            rej();
        })
    })
}
    function get_money(token = null){
        if (token==null)
        token = admin_token;
        return new Promise((res,rej)=>{
            axios.get("https://api.colete-online.ro/v1/user/balance",{headers:{
                "Accept": 'application/json',
                "Authorization":"Bearer "+token
            }}).then((response)=>{
                res(response.data.amount);
            }).catch((err)=>{
                rej();
            })
        })
    }



    function order_courier(points_address,user_address,sizes,point_contact,user_contact,courier_id,order_id,token){
        return new Promise((res,rej)=>{
            //we just send the order now 
            let body = {};
           
            body.sender = {};
            body.sender.contact = {};
    
            body.sender.contact.name = point_contact.bis_name.trim();
            body.sender.contact.phone = point_contact.phone_number.trim();
            body.sender.address = {};
            //sender addr
            body.sender.address.countryCode = "RO";
            body.sender.address.postalCode = points_address.cod.trim();
            body.sender.address.city = points_address.oras.trim();
            body.sender.address.county = points_address.judet.trim();
            body.sender.address.street = points_address.adresa.replace("Strada ",'').trim();
            body.sender.address.number = (points_address.nr.toString() || "1");
            body.sender.validationStrategy = "minimal";

            body.recipient = {};
            body.recipient.contact = {};
            //recipient contaxt 
            body.recipient.contact.name = user_contact.nume;
            body.recipient.contact.phone = user_contact.telefon;
    
            body.recipient.address = {};
            //recipient  addr 
           // console.log(user_address);
            body.recipient.address.countryCode = "RO";
            body.recipient.address.postalCode = user_address.cod.trim();
            body.recipient.address.city = user_address.oras.trim();
            body.recipient.address.county = user_address.judet.trim();
            body.recipient.address.street = user_address.strada.trim();
            body.recipient.address.number = (user_address.numar.toString() || "1");
            body.recipient.validationStrategy = "minimal";
            body.packages = {};
            //package 
            body.packages.type = 2;
            body.packages.content = "test";
          
            body.packages.list = [{
                "weight": sizes.weight,
                "width": sizes.width,
                "height": sizes.height,
                "length": sizes.length
            }];
            //console.log(courier_id);
            //service 
            body.service = {};
            body.service.selectionType = "directId";
            body.service.serviceIds = [courier_id];
            body.extraOptions = [];
            body.extraOptions.push({"id":1,"url":"https://www.farmvio.com/change_status"})
            logger.debug(body);
            axios.post('https://api.colete-online.ro/v1/order', 
              body
            ,{headers:{
                'Content-Type': 'application/json',
                "Accept": 'application/json',
                "Authorization":"Bearer "+token.trim()
            }})
            .then( (response)=>{
             console.log(response.data);
                //insert the order 
                insert_order_courier(courier_id,response.data.service.price.total,response.data.awb,response.data.uniqueId,response.data.estimatedPickUpDate,order_id);
            res(response);
            }).catch((err)=>{
                console.log("eroareE");
                logger.debug(err.response.data);
                rej(err.response.data);
            })
        })
    }
    function insert_order_courier(courier_id,price,awb,Uid,estimate_pickUp,order_id,try_number = 0)
    {
        console.log("INSERTING")
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    if (try_number!=5)
                    insert_order_courier(courier_id,price,awb,Uid,estimate_pickUp,order_id,try_number+1);
                    else
                    rej();
                }
                else{
                    console.log(estimate_pickUp);
                    conn.query("INSERT INTO frv_courier_orders (courier_id,price,awb,Uid,estimate_pickUp,order_id) VALUES("+courier_id+","+price+","+mysql.escape(awb)+","+mysql.escape(Uid)+","+mysql.escape(estimate_pickUp)+","+mysql.escape(order_id)+")",(err,results,fields)=>{
                        conn.release();
                        console.log("FD")
                        if (err){
                            console.log(err);
                           // console.log(err);
                            if (try_number!=5)
                            insert_order_courier(courier_id,price,awb,Uid,estimate_pickUp,order_id,try_number+1);
                            else
                            rej();

                        }
                        else
                        res();
                    })
                }
            })
        })
    }


    function reverse_postal_code(code,token){
        return new Promise((res,rej)=>{
            axios.get("https://api.colete-online.ro/v1/search/postal-code-reverse/RO/"+code.trim()+"?format=object",{headers:{
                "Accept": 'application/json',
                "Authorization":"Bearer "+token
            }}).then((response)=>{
                res(response.data);
            }).catch((err)=>{
                rej();
            })
        })
    }

    function search_postal_code(county,city,street,token){
        return new Promise((res,rej)=>{
            axios.get("https://api.colete-online.ro/v1/search/postal-code/RO/"+encodeURIComponent(city.trim())+"/"+encodeURIComponent(county.trim())+"/"+encodeURIComponent(sanitize_street(street))+"",{headers:{
                "Accept": 'application/json',
                "Authorization":"Bearer "+token
            }}).then((response)=>{
                res(response.data);
            }).catch((err)=>{
                rej();
            })
        })
    }

    function search_city(county,needle,token)
    {
        console.log("cautam oras");
        return new Promise((res,rej)=>{
            axios.get("https://api.colete-online.ro/v1/staging/search/city/RO/"+encodeURIComponent(county.trim())+"/"+encodeURIComponent(needle.trim())+"/"+"?limit=6&group=1",{headers:{
                "Accept": 'application/json',
                "Authorization":"Bearer "+token
            }}).then((response)=>{
               // console.log(response);
                res(response.data.list);
            }).catch((err)=>{
                console.log(err);
                rej();
            })
        })
    }
module.exports = {
    init,request_admin_token,get_point_address,get_cost_estimates,get_weights,get_all_couriers,calculate_cost,validate_address,get_money,order_courier,request_client_token,reverse_postal_code,
    search_postal_code,search_city
}