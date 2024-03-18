const express = require("express");
const mustache = require('mustache-express');
const otp = require("speakeasy");
const mysql = require("mysql");
const app = express();
const path = require("path");
const crypto = require("crypto");
const jwt = require('jsonwebtoken');
const  cookieParser = require('cookie-parser');
const csrf = require("csurf")();
const cors = require("cors");
const query_string = require("querystring");
const helmet = require("helmet");
const session = require("express-session");
const mailer = require('nodemailer');
const mail_checker = require("deep-email-validator");
const formidable = require("formidable");
const multer = require("multer");
const fs = require("fs");
const basicAuth = require("express-basic-auth");
const uuid = require('uuid');
const axios = require("axios");
const sharp = require("sharp");
const url = require("url");
//custom libs
const aes = require("./Aes");
const userManager = require("./UserManager");
const search = require("./searches");
const farmManager = require("./FarmManager");
const shopManager = require("./shopManager");
const orderManager = require("./orderManager");
const coleteManager = require("./coleteManager");
const workerHandler = require("./pool_controller.js");
const b2bManager = require("./b2b_manager");
const product_searcher = require("./product_searcher");
const admin_manager = require("./admin_manager");




const { response } = require("express");
const { TaskQueueRealTimeStatisticsContext } = require("twilio/lib/rest/taskrouter/v1/workspace/taskQueue/taskQueueRealTimeStatistics");
const { Console } = require("console");





const kyc_key  = crypto.createHash("sha256").update(String("test")).digest("base64").slice(0,32);
console.log(kyc_key);
//file encryption functions 
const encrypt_file = (buffer)=>{
    let iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv("aes-256-ctr",kyc_key,iv);
    let result = Buffer.concat([iv,cipher.update(buffer),cipher.final()]);
    return result;
}

const decrypt_file = (enc_buffer)=>{
    let iv = enc_buffer.slice(0,16);
    enc_buffer = enc_buffer.slice(16,enc_buffer.length);
    //create decipher 
    let dec = crypto.createDecipheriv("aes-256-ctr",kyc_key,iv);
    let result = Buffer.concat([dec.update(enc_buffer),dec.final()]);
    return result;
}

const saveFile = (buffer,where)=>{
    fs.writeFileSync(where,buffer);
}



require("dotenv").config({
    path: "./process.env"
});

const phone_client = require("twilio")(process.env.TWILIO_SID,process.env.TWILIO_TOKEN);


const no_csrf = ["/finish_upload_farm_pic","/upload_farm_pic","/get_farm_pics","/farmer_prods","/update_addr","/get_addr_info","/postal_code","/reverse_postal_code","/get_delivery_city","/get_delivery_county","/edit_review","/parse_reviews","/send_review","/get_username","/chat_upload","/b2b_update_qty","/b2b_delete_from_cart","/accept_b2b_final_order","/decline_b2b_final_order","/b2b_get_costs","/get_final_offer_client","/send_final_b2b_offer","/get_final_bids","/change_personal_data","/send_direct_offer_b2b","/send_offers_cid","/admin_accept_offer_b2b","/admin_reject_offer_b2b","/admin_send_new_offer_b2b","/get_offers_for_prod","/decline_offer_b2b","/send_offer_farmer","/accept_offer_b2b","/get_farmer_offers","/send_offer","/admin_prod_search","/get_words","/admin_b2b_orders","/b2b_order","/modify_custom_prod","/b2b_ato","/b2b_parse_cart","/b2b_check_order","/refresh_order","/change_status","/decline_order","/decline_offer","/accept_offer","/get_client_contact","/courier_stats","/send_proposal","/order_courier","/order_stats","/colete_money","/set_active_del_addr","/delete_addr","/accept_order","/my_orders","/send_delivery_cost","/orders","/send_order","/get_total_price_point","/cost_estimate","/delivery_address","/get_all_cart_infos","/remove_preview_prod_image","/upload_preview_prod_image","/get_stocks","/update_prod_data","/get_data_for_prod","/update_image_order","/upload_prod_image","/remove_image","/get_all_images","/remove_item","/remove_cart_item","/update_cart_qty","/check_cart","/atc","/get_display_data","/get_cats_all","/change_phone","/verify_phone","/verify_mail","/update_images","/get_city","/get_farms","/get_county","/post_farm","/kyc","/add_point","/add_points","/get_workp","/search_workp","/add_prod","/get_farms_user","/get_images","/add_user_image"];



const custom_csrf = function (req,res,next){
    next();
}

//image upload init 
var kyc_upload = multer({
    storage: multer.memoryStorage()
})

var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {

        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
    }
});
var chat_storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {

        cb(null, './chat_uploads')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
    }
});


var chat_upload = multer({
    storage: chat_storage,
    fileFilter: function (req,file,callback){
        var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {        
            req.file_error = "Only images";
            return callback(null,false);
        }
        callback(null,true);
    }
})

var upload = multer({ //multer settings
    storage: storage,
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
            console.log("error image");
            req.file_error = "Only images";
            return callback(null,false);
        }
        callback(null,true);
    } 
});



var storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './profile_uploads')      //you tell where to upload the files,
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + '.png')
    }
  })
  
  var upload2 = multer({
      storage: storage2,
      fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        console.log(ext);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
            console.log("error image");
            return callback(null,false);
        }

        callback(null,true);
    } 
    
  });
  
  var preview_storage =  multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './previews')      //you tell where to upload the files,
    },
    filename: function (req, file, cb) {
      cb(null, req.user_data.id+'-'+file.fieldname + '-' + uuid.v4() + '.png')
    }
  })

  var preview_upload = multer({
    storage: preview_storage,
    fileFilter: function (req, file, callback) {
      var ext = path.extname(file.originalname);
      console.log(ext);
      if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
          console.log("error image");
          return callback(null,false);
      }

      callback(null,true);
  } 
  
});

  

//smtp server init
var transporter = mailer.createTransport({
    host: 'farmvio.com',
    port: 465,
    auth:{
        user: 'no-reply@farmvio.com',
        pass: 'K6.tb^74l+y]'
    }
})

//mysql connection
var con = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME

})

//init threads 
workerHandler.init({maxWorkers: 4});
var workerPool = workerHandler.get();
 //we should now init the user manager 
userManager.init(con,mysql,process,aes,crypto);
//init farm manager 
farmManager.init(con,mysql);
//init shop mamager 
shopManager.init(con,mysql);
//init order Manager 
orderManager.init(con,mysql);
//init colete manager 
coleteManager.init(con,mysql,axios);
//init b2b manager 
b2bManager.init(con,mysql);
//init product searcher 
product_searcher.init(con,mysql);
//init admin manager 
admin_manager.init(con,mysql);
//init searchers 
search.init(con,mysql);

//set .html files to mustache template
app.engine('html', mustache());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views'); // template dirs

app.use(express.static(__dirname));
//json decoder 
app.use(express.json());

app.use(cookieParser());
//set csrf protection 
app.use(session({
    secret: "farmVio",
    saveUninitialized: true,
    resave: false
}))

app.use(custom_csrf);

const history = function(req,res,next){
    if (req.method == "GET" && !req.xhr){
    let toCheck = ['login',"cart_prods","cart_count","get_user_addresses","couriers",".js",".css","assets"];
    let result = toCheck.some(o => req.url.includes(o));
    
    if (!result)
    {
        req.session.last_page = req.url;
       // console.log("setat "+req.url);
    }
    else{
        //console.log("nesetat "+req.url);

    }
}
//console.log(res.statusCode);
    next();
}
app.use(history);
//same origin policy 
//change the origin with your port / host 
//only for demo
//change when live 
app.use(cors({
    origin: "http://localhost:5000",
    optionsSuccessStatus: 200
}))
//work in progress
//app.use(helmet());

app.get("/",(req,res)=>{
    console.log(req.path);
    res.render("index-3.html",{"prom":[]});
})

//index 
app.get("/index",verifyToken,(req,res)=>{
    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        res.render("index-3.html",{
            "login": err ? true : false
        });
    })
    
})

app.get("/marketplace",verifyToken,(req,res)=>{

    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        admin_manager.get_promovati().then((response)=>{
            res.render("index-m.html",{
                "prom": response,
                "login": err ? true : false
            });
        }).catch((err)=>{
            res.render("index-m.html",{
                "prom": [],
                "login": err ? true : false
            });
        })
    })


    
})
app.get("/b2b",verifyToken,(req,res)=>{
    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        
        res.render("b2b.html",{
            "login": err ? true : false
        });
    })
    
})
app.get("/contact",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        res.render("contact.html",{
            "login": err ? true : false
        });    
    })
    
})
app.get("/privacy",verifyToken,(req,res)=>{
    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        res.render("privacy.html",{
            "login": err ? true : false
        });
    })
    
})
app.get("/story",verifyToken,(req,res)=>{

    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        res.render("story.html",{
            "login": err ? true : false
        });
    })
    
})

app.get("/cookies",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        res.render("cookies.html",{
            "login": err ? true : false
        });
    })
    
})
//search county api
app.post("/get_county", async (req,res)=>{
    if (req.body.search){
        console.log(req.body.search.trim())
        res.send(await search.search_county(con,mysql.escape(req.body.search.trim()+"%")));
    }
    else{
        res.send({});
    }
})
//search city api
app.post("/get_delivery_county",(req,res)=>{

    if (req.body.county){
        search.get_county(req.body.county).then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.send({});
        })
    }
    else
    {
        res.send({});
    }
})

app.post("/get_delivery_city",(req,res)=>{
    console.log(req.body);
    if (req.body.city && req.body.county!=null){
        console.log("here");
        search.get_city(req.body.county,req.body.city).then((response)=>{
            console.log(response);
            res.send(response);
        }).catch((err)=>{
            res.send({});
        })
    }
    else
    {
        res.send({});
    }
})

app.post("/reverse_postal_code",better_verify,(req,res)=>{
    if (req.body.code){
        let code = req.body.code;
        code = parseInt(code).toString();
        coleteManager.request_admin_token().then((token)=>{
            coleteManager.reverse_postal_code(code,token).then((response)=>{
                res.send(response);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(500);
    }
})

app.post("/postal_code",better_verify,(req,res)=>{
    if (req.body.county && req.body.city && req.body.street){
       
        coleteManager.request_admin_token().then((token)=>{
            coleteManager.search_postal_code(req.body.county,req.body.city,req.body.street,token).then((response)=>{
                res.send(response);
            }).catch((err)=>{
                res.send({});
            })
        }).catch((err)=>{
            res.send({});
        })
    }
    else{
        res.send({});
    }
})

app.post("/get_addr_info",better_verify,(req,res)=>{
    let user_data = req.user_data;

    if (req.body.addr_id){
        orderManager.get_specific_addr(req.body.addr_id,user_data.id).then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.send({});
        })
    }
    else{
        res.send({});
    }
})

app.post("/update_addr",better_verify,(req,res)=>{
    
})

app.post("/get_city",async (req,res)=>{

    if (req.body.user_in){
        console.log(req.body);
        res.send(await search.search_city(con,mysql.escape(req.body.user_in+"%"),mysql.escape(req.body.county)));
        
    }
    else{
        res.sendStatus(404);
    }
})
//get farms api 
app.post("/get_farms",(req,res)=>{
    console.log(req.body);
if (req.body.center!=null && req.body.radius!=null){
        //run the query 
        if (req.body.page){
            if (parseInt(req.body.page))
            {
                req.body.page = parseInt(req.body.page);
            }
            else{
                req.body.page = 0;
            }
        }
        else{
            req.body.page = 0;
        }
        console.log(req.body.page);
        farmManager.get_pagination_info(req.body.center,req.body.radius,req.body.page,req.body.cat,req.body.search).then((pages)=>{

            let sent_response = {};
            sent_response.pages = pages;

            if (parseInt(req.body.page)>pages.max_page){
           
                req.body.page = pages.max_page;

              
            }   
            console.log(req.body.page);
            farmManager.get_farms(req.body.center,req.body.radius,req.body.page,req.body.cat,req.body.search).then((resp)=>{  

                sent_response.farms = resp;     
                
                res.send(sent_response);
        }).catch((err)=>{

            console.log("ferme");
            res.sendStatus(500);

        })
    
    }).catch((err)=>{
        console.log("Pqaginare")
        res.sendStatus(500);    
    });
}   
else
res.sendStatus(404);
})

//get display data 
app.post("/get_display_data",async (req,res)=>{
        console.log("REQUEST")
    //we\\ll have 2 cases 
    if ((req.body.categorie==null || req.body.categorie == 0) && (req.body.search==null || req.body.search.trim()=="")){
        //we dont have any filter, then we can only 
        res.send({"data":await farmManager.get_sold_cats(req.body.data),"case":1});
    }  else{
    farmManager.get_sold_prods(req.body).then((response)=>{
       // console.log(response);
        res.send({"data":response,"case":2});
    }).catch((err)=>{
        res.sendStatus(500);
    })
}
})



//product page 

app.get("/products/:farmer_slug/:product_slug",verifyToken,(req,res)=>{

    let farmer_slug = req.params.farmer_slug;
    let product_slug = req.params.product_slug;
    userManager.slug_to_user_id(farmer_slug).then((user_id)=>{
        

        shopManager.get_product_id_from_slug(product_slug,user_id).then((product_id)=>{
      
            let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        //we need the rating for both of em 
    
        if (err || data.acc_type!=2){
            //user eligible
        


            let rating_promise,prod_data_promise,farmer_name,rating_data,wpoints,cart_qty;

            rating_promise = shopManager.is_user_eligible_for_rating(data?.id || -1,product_slug);
            prod_data_promise = shopManager.get_prod_data(product_id);
            farmer_name = shopManager.get_farmer(product_id);
            rating_data = shopManager.get_product_rating(product_id);
            
            let path_name = url.parse(req.url,true).pathname;
            let punct_livrare_slug = url.parse(req.url,true).query?.punct_livrare;

            cart_qty = shopManager.get_cart_qty(product_id,data?.id,punct_livrare_slug,user_id);
            wpoints = farmManager.get_work_point_for_prod(product_id,path_name,punct_livrare_slug);

            

            Promise.allSettled([rating_promise,prod_data_promise,farmer_name,rating_data,wpoints,cart_qty]).then( async (results)=>{
                console.log(results);
                if (results[1].status!="fulfilled" || results[2].status!="fulfilled")
                {
                    res.sendStatus(500);
                }
                else{

                    res.render("products.html",{
                        prod_name: results[1].value.name,
                        price: results[1].value.price+" RON",
                        unit: results[1].value.unit,
                        desc: results[1].value.description,
                        image: await shopManager.get_prod_images(product_id),
                        rating_eligible: (results[0].status == "fulfilled" && results[0].value!=0) ? true : false,
                        rating: results[3].value.stars,
                        rating_count: results[3].value.count,
                        farmer_name: results[2].value,
                        wpoints: results[4]?.value,
                        prod_id: product_id,
                        farmer_id: user_id,
                        cart_qty: results[5]?.value || 0,
                        "login": err ? true : false
                        
                    });
                }
            })


        }
        else
        {
            let prod_id = req.params.id;
            let work_id = req.params.work_id;
            //we can now render the procuts page 

            let rating_promise,prod_data_promise,rating_data;

            rating_promise = b2bManager.is_user_eligible_for_rating(data.id || -1,prod_id);

            prod_data_promise = shopManager.get_prod_data(prod_id,work_id);

            rating_data = shopManager.get_product_rating(prod_id);

            Promise.allSettled([rating_promise,prod_data_promise,rating_data]).then( async (results)=>{
                if (results[1].status!="fulfilled")
                {
                    res.sendStatus(500);
                }
                else{
                    res.render("b2b_product.html",{
                        prod_name: results[1].value.name,
                        price: results[1].value.price+" RON",
                        unit: results[1].value.unit,
                        desc: results[1].value.description,
                        image: await shopManager.get_prod_images(prod_id),
                        cart_qty: await b2bManager.get_cart_qty(data.id,prod_id,work_id),
                        rating: results[2].value.stars,
                        rating_count: results[2].value.count,
                        rating_eligible: (results[0].status == "fulfilled" && results[0].value!=0) ? true : false,
                        "login": false

                    });
                }
            })      
            
        }
    })
   

        }).catch((err)=>{
            res.status(404).render("error-404.html");    
        })

    }).catch((err)=>{
        res.status(404).render("error-404.html");
    })
    
        
})

app.post("/send_review",better_verify,(req,res)=>{
    //get referer 
    let request_from = req.headers.referer;

    let parts = request_from.split("/");
    let prod_index;
    if (( prod_index = parts.indexOf("products"))!=-1)
    {
        let prod_id = parts[prod_index+1];

        let data = req.body;
        let erros = {};
        console.log(data);
        //check the data
        if (!data.stars || data.stars <= 0)
            erros["rating_err"] = "Te rugam sa selectezi o nota";
            
        if (!data.title || data.title.trim()=="")
            erros['title_err'] = "Te rugam sa pui un titlu";
    
            if (!data.content || data.content.trim()=="")
            erros['comm_err'] = "Te rugam sa scrii un comentariu";
    
            if (Object.keys(erros).length==0){
        shopManager.insert_review(data.title,data.content,data.stars,req.user_data.id,prod_id).then((response)=>{
            res.sendStatus(200);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
        else
        res.send(erros);
    }
    else{
        res.sendStatus(403);
    }


})

    app.post("/edit_review",better_verify,(req,res)=>{
        let data = req.body;
        let user_data = req.user_data;
        
        if (!data.review_id){
            res.sendStatus(404);
        }
        else{
            let errors = {};

            if (!data.title || data.title.trim()==""){
                errors["edit_title"] = "Titlul nu poate fi gol!";
            }
            if (!data.content || data.content.trim()==""){
                errors["edit_content"] = "Comentariul nu poate fi gol!";
            }

            console.log(errors);
            if (Object.keys(errors).length==0){
                //update
                shopManager.update_review(data.review_id,user_data.id,data.title,data.content).then((resp)=>{
                    res.sendStatus(200);
                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }
            else{
                res.send(errors);
            }
            
        }
    })

app.post("/parse_reviews",verifyToken,(req,res)=>{

    jwt.verify(req.token,"secret",(err,data)=>{
        
        if (req.body.prod_id)
        {
            shopManager.get_reviews(req.body.prod_id,data?.id || -1).then((reviews)=>{
                res.send(reviews);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        
    }
    else{
        res.sendStatus(500);
    }
    })
  
})

//offer requests 
app.get("/offer_requests",better_verify,(req,res)=>{
    let user_data = req.user_data;
    farmManager.id_to_farmer_slug(user_data.id).then((slug)=>{
        res.render("offer_requests.html",{
            "slug": slug
        }).catch((err)=>{
            res.render("offer_requests.html",{
                "slug": "not-found"
            });
        })
    })
    
})


app.post("/get_farmer_offers",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type==1){
        //get all the offers 
        farmManager.get_all_offers(user_data.id).then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(403);
    }
})

app.post("/accept_offer_b2b",better_verify,(req,res)=>{
    let user_data = req.user_data;

    console.log(req.body);
    if (user_data.acc_type == 1 && req.body.offer_id){
        b2bManager.is_this_my_offer(user_data.id,req.body.offer_id).then((response)=>{
            if (response){
                //accept the offer 
                b2bManager.update_offer_status(req.body.offer_id,1).then((response)=>{
                    res.sendStatus(200);
                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }
            else{
                res.sendStatus(403);
            }
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(403);
    }})

app.post("/decline_offer_b2b",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type == 1 && req.body.offer_id){
        b2bManager.is_this_my_offer(user_data.id,req.body.offer_id).then((response)=>{
            if (response){
                //decline the offer 
                b2bManager.update_offer_status(req.body.offer_id,4).then((response)=>{
                    res.sendStatus(200);
                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }
            else{
                res.sendStatus(403);
            }
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(403);
    }
})


app.post("/send_offer_farmer",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type == 1 && req.body.offer_id && req.body.price && req.body.qty){
        b2bManager.is_this_my_offer(user_data.id,req.body.offer_id).then((response)=>{
            if (response){
                b2bManager.send_farmer_offer(req.body.price,req.body.qty,req.body.offer_id).then((response)=>{
                    res.sendStatus(200);
                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }
            else{
                res.sendStatus(403);
            }
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(403);
    }
})


//edit product page 

app.get("/edit/:id",verifyToken,(req,res)=>{
    let token = req.token;
    let prod_id = req.params.id;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(403);
        }
        else{
            //check if this is this user's product 
            farmManager.is_this_my_prod(prod_id,data.id).then((response)=>{

                if (response){
                    
                    farmManager.id_to_farmer_slug(data.id).then((slug)=>{
                        res.render("edit_prod.html",{
                            "slug": slug
                        });
                    }).catch((err)=>{
                        res.render("edit_prod.html",{
                            "slug": "not-found"
                        });
                    })
                
                }
                else{
                    res.sendStatus(404);
                }
            })
        }
    })
})

//B2b CART 

app.get("/b2b_cart_count",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type == 2){
        b2bManager.parse_cart_count(user_data.id).then((response)=>{
            res.send({"cart_count":response})
        }).catch((err)=>{
            res.send({"cart_count":0});
        })
    }
    else{
        res.send({"cart_count":0})
    }
})

app.post("/b2b_parse_cart",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type == 2)
        {
            //get bis_name for every point 
            b2bManager.parse_cart(user_data.id).then((cart_content)=>{
                res.send(cart_content);
            }).catch((err)=>{
                res.sendStatus(500);
            })
            
        }
    else{
        res.sendStatus(403);
    }
})

app.post("/b2b_ato",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type == 2)
    {
        b2bManager.ato(user_data.id,req.body).then((response)=>{
            res.send({"a":response});
        }).catch((err)=>{
            console.log(err);
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(403);
    }
})

app.post("/b2b_delete_from_cart",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type == 2)
    {
        b2bManager.delete_item(req.body.prod_id,req.body.point_id,user_data.id).then((response)=>{
            res.sendStatus(200);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(403);
    }
})

app.post("/b2b_update_qty",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type == 2){
        if (req.body.cid && req.body.qty){
            b2bManager.update_cart_qty_cid(user_data.id,req.body.cid,req.body.qty).then((response)=>{
                res.sendStatus(200);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
        else if (req.body.prod_id && req.body.point_id && req.body.qty){
            b2bManager.update_cart_qty_prod(user_data.id,req.body.prod_id,req.body.point_id,req.body.qty).then((response)=>{
                res.sendStatus(200);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
        else{
            res.sendStatus(403);
        }
    }
    else{
        res.sendStatus(403);
    }
})

app.post("/modify_custom_prod",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type == 2){
        b2bManager.modify_order(user_data.id,req.body).then((response)=>{
            res.send({"keyw":response})
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(403);
    }
})

//CLIENT CART 
//get cart_prods_count
app.get("/cart_count",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret", async (err,data)=>{
        if (err){
            if (req.session.cart){
                let cart = JSON.parse(req.session.cart);
                res.send({"count":cart.length});
            }
            else
            res.send({"count":0});
        }
        else{
            if (req.session.cart){
                //return the count from session
                let cart = JSON.parse(req.session.cart);
                res.send({"count":cart.length});
            }else{
            let cart_count = await shopManager.get_carts(data.id);
            if(cart_count!="mysql"){
                if (cart_count>9){
                    res.send({"count":"+9"})
                }
                else{
                    console.log("sent here")
                    res.send({"count":cart_count})
                }
            }
            else{
                console.log("sent here")
                res.send({"count":0})
            }
        }
        }
    })
})
app.get("/cart_prods",verifyToken,(req,res)=>{
        
    //delete req.session.cart;
    //this means cart cookie is not set, we can now set it 
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            //not logged, get em from session 
            if (req.session.cart){
                //get them
                res.send(JSON.parse(req.session.cart));
            }else{
                res.send({});
            }
        }
        else{
            
            //now we can just parse all the products the user has in cart 
            shopManager.get_cart_prods(data.id).then((results)=>{
                
                res.send(results);

            })
            .catch((err)=>{
                console.log(err);
                res.sendStatus(500);
            })
        
        }
    })

})
app.post("/remove_cart_item",verifyToken,(req,res)=>{
   
    if (req.body.prod_id && req.body.point_id){
        //get the point_id 
            if (req.body.farmer_id)
            {
                //get from slug 
                farmManager.slug_to_point_id(req.body.point_id,req.body.farmer_id).then((point_id)=>{

                    let token = req.token;
                    //even if the user is not auth, the session must be updated
                    if (req.session.cart){
                        console.log(req.session.cart);
                        //get the sesssion 
                        let aux = [];
                        let cart = JSON.parse(req.session.cart);
                
                        for (index in cart){
                            if (cart[index].product_id != req.body.prod_id || cart[index].point_id != point_id){
                                aux.push(cart[index]);
                            }
                
                        }
                        //refresh the session 
                        req.session.cart = JSON.stringify(aux);
                    }
                
                    //check if auth 
                    jwt.verify(token,"secret",(err,data)=>{
                        if (err){
                            res.sendStatus(200);
                        }
                        else
                        {
                            //we not update the db 
                            shopManager.remove_cart(req.body.prod_id,data.id,point_id).then((response)=>{
                                res.sendStatus(200);
                
                            }).catch((err)=>{
                                res.sendStatus(500);
                            })
                        }
                    })
                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }
            else{
                
    let token = req.token;
    //even if the user is not auth, the session must be updated
    if (req.session.cart){
        console.log(req.session.cart);
        //get the sesssion 
        let aux = [];
        let cart = JSON.parse(req.session.cart);

        for (index in cart){
            if (cart[index].product_id != req.body.prod_id || cart[index].point_id != req.body.point_id){
                aux.push(cart[index]);
            }

        }
        //refresh the session 
        req.session.cart = JSON.stringify(aux);
    }

    //check if auth 
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(200);
        }
        else
        {
            //we not update the db 
            shopManager.remove_cart(req.body.prod_id,data.id,req.body.point_id).then((response)=>{
                res.sendStatus(200);

            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
    })
            }

    }
    else{
        res.sendStatus(500);
    }
})


app.post("/update_cart_qty",verifyToken,(req,res)=>{
    let token = req.token;
    console.log(req.body);
    if (!req.body.prod_id || !req.body.qty || !req.body.point_id){
        //then we can respond wit an error
        res.sendStatus(404);
        console.log("sent:")
    }
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            //only update the session 
            if (req.session.cart){
                //iterate over all prods 
                let cart = JSON.parse(req.session.cart);
                for (index in cart){
                    if (cart[index].product_id == req.body.prod_id && cart[index].point_id == req.body.point_id){
                        cart[index].qty = req.body.qty;
                        //update and exit 
                        req.session.cart = JSON.stringify(cart);
                        res.sendStatus(200);
                        return ;

                    }
                }
            }
            else
            {
                //this is an error
                res.sendStatus(500);
            }
        }
        else
        {
            //update the session and the database 
            shopManager.update_cart_qty(data.id,req.body.prod_id,req.body.qty,req.body.point_id).then((response)=>{
                //update the session to
                if (req.session.cart){
                    //iterate over all prods 
                    let cart = JSON.parse(req.session.cart);
                    for (index in cart){
                        if (cart[index].product_id == req.body.prod_id && cart[index].point_id == req.body.point_id){
                            cart[index].qty = req.body.qty;
                            //update and exit 
                            req.session.cart = JSON.stringify(cart);
                            break;
                        }
                    }
                }                
                res.sendStatus(200);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
    })
})

app.post("/check_cart",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
          //  console.log("not logged");
            //the user is not logged in so we cant check the cart 
            res.sendStatus(200);
        }
        else{
            //we get the data from mysql and compare it to the session 
            shopManager.get_cart_prods(data.id).then((response)=>{
                    console.log(response);
                if (req.session.cart){
                 //   console.log(req.session.cart);
                    if (req.session.cart == JSON.stringify(response)){
                       // console.log("all ok");
                        
                    }
                    else{
                      //  console.log("update")
                        req.session.cart = JSON.stringify(response);
                    }
                }
                else{
                    
                    req.session.cart = JSON.stringify(response);
                    
                }
                res.sendStatus(200);
            }).catch((err)=>{
                console.log(err);
                res.sendStatus(500);
            })
        }
    })
})
//add to cart 
app.post("/atc",verifyToken,(req,res)=>{
    let token = req.token;
    console.log(req.body);
   
        if ((req.body.prod_id && req.body.point_id && req.body.farmer_id) || parseInt(req.body.point_id) == req.body.point_id){
            console.log("NUMAR")
            farmManager.slug_to_point_id(req.body.point_id,req.body.farmer_id).then((point_id)=>{
                console.log(point_id);
                jwt.verify(token,"secret",(err,data)=>{

                    if (err){
                        
                        //no auth, then check the session
                        shopManager.get_atc_info(req.body.prod_id).then((response)=>{                 
                                //append to the session 
                                //check if this id is already in the session
                                let cart;
                                if (req.session.cart)
                                cart = JSON.parse(req.session.cart);
                                else{
                                    cart = [];
                                }
                                
                                for (index in cart){
                                    if (cart[index].product_id == req.body.prod_id && cart[index].point_id == req.body.point_id){
                                        //we found it, now update 
                                        cart[index].qty = parseInt(cart[index].qty) + parseInt(req.body.qty);
                                        //we can update the price 
                                        cart[index].name = response[0].name;
                                        cart[index].price = response[0].price;
                                        cart[index].point_id = req.body.point_id;
                                        //change the session now 
                                        req.session.cart = JSON.stringify(cart);
                                        res.sendStatus(200);
                                        return ;
                                    }
                                }
                                //now we should append only
                                cart[cart.length] = {"product_id":req.body.prod_id,"qty":req.body.qty,"name":response[0].name,"price":response[0].price,"point_id": point_id};
                                //update the session 
                                req.session.cart = JSON.stringify(cart);
                                res.sendStatus(200);
                        }).catch((err)=>{
                            console.log(err);
                            res.sendStatus(500);
                        })
                    }
                    else{
                        //add to the session
            
                        //add to db to
                        shopManager.add_to_cart(req.body.prod_id,req.body.qty,data.id,point_id).then((result)=>{
                            //respond with name and price 
                            shopManager.get_atc_info(req.body.prod_id).then((response)=>{
                                let found = false;
                                let cart = req.session.cart ?  JSON.parse(req.session.cart) : [];
                                for (index in cart){
                                    if (cart[index].product_id == req.body.prod_id && cart[index].point_id == point_id){
                                        //we found it, now update 
                                        cart[index].qty = parseInt(cart[index].qty) + parseInt(req.body.qty);
                                        //we can update the price 
                                        cart[index].name = response[0].name;
                                        cart[index].price = response[0].price;
                                        cart[index].point_id = point_id;
                                        //change the session now 
                                        req.session.cart = JSON.stringify(cart);
                                        res.sendStatus(200);
                                        return ;
                                    }
                                }
                              
                                //now we should append only
                                cart[cart.length] = {"product_id":req.body.prod_id,"qty":req.body.qty,"name":response[0].name,"price":response[0].price,"point_id":point_id};
                                //update the session 
                                req.session.cart = JSON.stringify(cart);
                                res.sendStatus(200);
            
            
                            }).catch((err)=>{
                                console.log(err);
                                res.sendStatus(500);
                            })
                        }).catch((err)=>{
                            console.log(err);
                            res.sendStatus(500);
                        })
                    }
                })
            
            }).catch((err)=>{
                res.sendStatus(500);
            })

        }
        else{
            res.sendStatus(500);
        }
    
})
//end index

//FARMER_SIDE ORDER

app.get("/orders",better_verify,(req,res)=>{
    let user_data = req.user_data;

    farmManager.id_to_farmer_slug(user_data.id).then((slug)=>{
        res.render("dashboard_orders.html",{
            "slug": slug
        })
    }).catch((err)=>{
        res.render("dashboard_orders.html",{
            "slug": "not-found"
        })
    })
    
})

app.post("/orders",better_verify,(req,res)=>{
    let user_data = req.user_data;
    
    orderManager.get_farmer_orders(user_data.id).then((response)=>{
        res.send(response);
    }).catch((err)=>{
        res.sendStatus(500);
    })
})

app.post("/refresh_order",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (req.body.order_id){
        //first check if this is user's order
        //check it using the acc_type 
        //TODO
        //For test send it anyways 
        orderManager.get_specific_order_details(user_data.id,req.body.order_id).then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.send({"err":"server"});
        })
    }
    else{
        res.send({"err":"user"});
    }
})

app.post("/get_client_contact",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (req.body.order_id){
    //first check if the user has access clearance to this 
        orderManager.is_this_my_order(user_data.id,req.body.order_id).then((response)=>{
            if (response){
                //now we can get the user's info 
                orderManager.get_buyer_contact(req.body.order_id).then((contact_info)=>{
                    res.send(contact_info);
                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }
            else{   
                res.sendStatus(403);
            }
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(403);
    }
})

app.post("/courier_stats",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (req.body.order_id){
        orderManager.is_this_my_order(user_data.id,req.body.order_id).then((response)=>{
            if (response){
                    //TODO   
            }
            else{
                res.sendStatus(403);
            }
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
})

app.post("/colete_money",better_verify,(req,res)=>{
    let user_data = req.user_data;
    coleteManager.request_admin_token().then((response)=>{
        coleteManager.get_money().then((reponse)=>{
            
            res.send({"price":reponse});
        }).catch((err)=>{
            res.send({"price":0})
        })
    }).catch((err)=>{
        res.send({"price":0});
    })
})

app.post("/order_stats",better_verify,(req,res)=>{
    let user_data = req.user_data;
    orderManager.pending_order(user_data.id).then((reponse)=>{
        res.send(reponse);
    }).catch((err)=>{
        res.send([{"pending_order":0},{"pending_order":0},{"pending_order":0}])
    })
})

app.post("/order_courier",better_verify,(req,res)=>{
    let user_data = req.user_data;
    orderManager.get_addresses_for_courier(req.body.order_id,user_data.id).then((addresses_response)=>{
        //now we can get the contacts 
        orderManager.get_contacts(req.body.order_id,user_data.id).then((contact_response)=>{
            //get the sizes 
            orderManager.get_sizes(req.body.order_id).then((sizes_response)=>{
                //get courier id 
                orderManager.get_courier_id_order(req.body.order_id).then((courier_id_response)=>{
                    //now we can call the courier 
                    //TOOD change to request_client_token
                    coleteManager.request_client_token(user_data.id).then((token_response)=>{
                        
                        coleteManager.order_courier(addresses_response[0],addresses_response[1],sizes_response,contact_response[0],contact_response[1],courier_id_response,req.body.order_id,token_response).then((final_response)=>{
                            //update the status to
                            
                            orderManager.update_status(req.body.order_id,4);
                            res.sendStatus(200);
                        }).catch((err)=>{
                            res.sendStatus(500);
                        })
                    }).catch((err)=>{
                        //here we shoudl send err
                        
                        res.send(err);
                    })
                    
                }).catch((err)=>{
                    console.log("err");
                    res.sendStatus(500);
                })

            }).catch((err)=>{
                console.log("SIZES");
                res.sendStatus(500);
            })
        }).catch((err)=>{
            console.log("CONTACTE")
            res.sendStatus(500);
        })
    }).catch((err)=>{
        console.log("ADRESE");
        res.sendStatus(500);
    })
})


app.post("/change_status",(req,res)=>{
    //we first get the Uid 
    let uid = req.body.summary.uniqueId;
    let history = req.body.history;
    orderManager.update_hist(uid,history);
    res.sendStatus(200);
})

app.get("/couriers",better_verify,(req,res)=>{
    coleteManager.request_admin_token().then((token)=>{
        //let's get couriers 
        console.log(token);
        coleteManager.get_all_couriers(token).then((reponse)=>{
          // console.log(reponse[0].token);
            res.send(reponse);
        }).catch((err)=>{
            console.log("Eroare");
            console.log(err);
            res.sendStatus(500);
        })
    }).catch((err)=>{
        console.log("error");
        res.sendStatus(500);
    })
})

app.post("/send_delivery_cost",better_verify,(req,res)=>{
    let user_data = req.user_data;
    //now check if we have the body 
    if (req.body.order_id && req.body.sizes && req.body.order_id.trim()!="")
    {
        orderManager.is_this_my_order(user_data.id,req.body.order_id).then((response)=>{
            if (response){
                //now insert 
                coleteManager.request_admin_token().then((token)=>{
                    
                    orderManager.get_infos(req.body.order_id).then((addr)=>{
                        console.log(addr);
                        coleteManager.calculate_cost(addr.address[0],addr.address[1],req.body.sizes,addr.c_id).then((reponse)=>{
                                console.log("COST GOT")
                            let price = reponse.data.selected.price.total;
                            //now we can finally insert the cost 
                            orderManager.insert_cost(req.body.sizes,req.body.order_id,price).then((reponse)=>{
                                res.sendStatus(200);
                            })
                            .catch((err)=>{
                                console.log(err)
                                res.sendStatus(500);
                            })

                        }).catch((err)=>{
                           // console.log(err.response.data.errors);
                           console.log(err.response.data)

                            res.sendStatus(500);
                        })

    
                    }).catch((err)=>{
                        console.log(err)

                        res.sendStatus(500);
                    })


                }).catch((err)=>{
                    res.sendStatus(500);
                })
        
            }
            else
            {
                res.sendStatus(403);
            }
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.send({"err":"Te rugăm să completezi toate datele!"})
    }
})

app.post("/accept_offer",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (req.body.order_id){
    //first check if this user is the farmer for this order 
        orderManager.is_this_my_order(user_data.id,req.body.order_id).then((response)=>{
            if (response){
                //now we can accept the offe r
                    //just change the status to 5 
                    //first check if a proposal is already set for this 
                    orderManager.is_status(req.body.order_id,3).then((status_response)=>{
                        if (status_response){
                            orderManager.update_status(req.body.order_id,5).then((response)=>{
                                    res.sendStatus(200);
                            }).catch((err)=>{
                                res.sendStatus(500);
                            })
                        }
                        else{
                            res.sendStatus({"err":"There is no offer for this order"});
                        }
                    }).catch((err)=>{
                        res.sendStatus(500);
                    })
                  
            }
            else{
                res.sendStatus(403);
            }
        }).catch((err)=>{
            res.sendStatus(500);
        })    
    }
    else{
        res.sendStatus(403);
    }
})

app.post("/decline_offer",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (req.body.order_id){
    //first check if this user is the farmer for this order 
        orderManager.is_this_my_order(user_data.id,req.body.order_id).then((response)=>{
            if (response){
                //now we can accept the offe r
                    //just change the status to 5 
                    //first check if a proposal is already set for this 
                    orderManager.is_status(req.body.order_id,3).then((status_response)=>{
                        if (status_response){
                            orderManager.update_status(req.body.order_id,7).then((response)=>{
                                res.sendStatus(200);
                            }).catch((err)=>{
                                res.sendStatus(500);
                            })
                        }
                        else{
                            res.sendStatus({"err":"There is no offer for this order"});
                        }
                    }).catch((err)=>{
                        res.sendStatus(500);
                    })
                  
            }
            else{
                res.sendStatus(403);
            }
        }).catch((err)=>{
            res.sendStatus(500);
        })    
    }
    else{
        res.sendStatus(403);
    }
})

//Category page 

app.get("/categorie/:slug",verifyToken,(req,res)=>{

    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
            
    let slug = req.params.slug;

    shopManager.get_categorie(slug).then((response)=>{
        let childs,prods;
        childs = shopManager.get_direct_childs(response.id);
        prods = shopManager.get_prods_for_cat(response.id);

        Promise.allSettled([childs,prods]).then((responses)=>{
            childs = responses[0].status== "fulfilled" ? responses[0].value : "";
            prods = responses[0].status== "fulfilled" ? responses[1].value : "";

            res.render("categorie.html",{
                "category_name": response.categorie,
                "cat_id": response.id,
                "sub_cats": childs,
                "prods": prods,
                "login": err ? true : false
            });

        });
    });
   
})
})


//ORDER
//client side order
app.get("/my_orders",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type==0)
    res.render("user_my_orders.html");
    else if (user_data.acc_type==2)
    res.render("b2b_my_orders.html");
    else{
        res.sendStatus(403);
    }
})

app.post("/my_orders",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type!=2){
    orderManager.get_sent_orders(user_data.id).then((response)=>{
        res.send(response);
    }).catch((err)=>{
        res.sendStatus(500);
    })
}
        else{
            console.log("b2b");
            b2bManager.parse_client_orders(user_data.id).then((response)=>{
                res.send(response);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
})

app.post("/send_proposal",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (req.body.order_id)
    {   
        if (req.body.proposal<=-2 && req.body.proposal>=-4)
        {
            //check the comments
            if (req.body.proposal!=-2)
            {
                if (req.body.comments.length<50){
                    res.send({"err":"Please give some details!"});
                    return ;
                }
            }
        }
        else
        {
            res.send({"err":"Please select a method!"})
            return ;
        }
        orderManager.is_this_my_client_order(user_data.id,req.body.order_id).then((reponse)=>{
        if (reponse){
            //here we insert the proposal
            orderManager.insert_prop(req.body.order_id,req.body.comments,req.body.proposal).then(()=>{
                //now update the status of the order  
                orderManager.update_status(req.body.order_id,3).then((response)=>{
                    res.sendStatus(200);
                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
        else
        {
            res.sendStatus(403);
        }
    }).catch((err)=>{
        res.sendStatus(500);
    })}
    else
    {

    }
})

app.post("/accept_order",better_verify,(req,res)=>{

    let user_data = req.user_data;

    if (req.body.order_id && req.body.order_id.trim().length!=0){

        orderManager.is_this_my_client_order(user_data.id,req.body.order_id).then((reponse)=>{

            console.log(reponse);

            if (reponse){
                orderManager.update_status(req.body.order_id,2).then((reponse)=>{
                    res.sendStatus(200);
                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }
            else{
                res.sendStatus(403);
            }
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(403);
    }
})

app.post("/decline_order",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (req.body.order_id){
        orderManager.is_this_my_client_order(user_data.id,req.body.order_id).then((response)=>{
            if (response){
                //update the status to 8
                orderManager.update_status(req.body.order_id,8).then((reponse)=>{
                    res.sendStatus(200);
                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }   
            else{
                res.sendStatus(403);
            }
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
})

app.get("/order",better_verify,(req,res)=>{
    let data = req.user_data;
    if (data.acc_type==2){
        res.render("b2b_order.html")
    }
    else
    res.render("order.html");
})

app.get("/delivery_info",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            //redirect to login or create account 
            res.redirect("/login");
        }
        else{
            res.render("delivery.html");
        }
    })
})

app.post("/delete_addr",better_verify,(req,res)=>{

    let user_data = req.user_data;

    if (req.body.a_id && !isNaN(req.body.a_id))
    {
        orderManager.delete_addr(user_data.id,req.body.a_id).then((reponse)=>{
            res.sendStatus(200);
        }).catch((err)=>{
            res.send({"err":"Server error! Please try again later!"});
        })
    }
    else{
        res.send({"err":"Not valid data!"});
    }
})

app.post("/set_active_del_addr",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (req.body.a_id && !isNaN(req.body.a_id))
    {
        orderManager.set_active_addr(req.body.a_id,user_data.id).then((reponse)=>{
            res.sendStatus(200);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(500);
    }
})

app.get("/get_user_addresses",better_verify,(req,res)=>{
    let user_data = req.user_data;
    orderManager.get_all_user_addresses(user_data.id).then((response)=>{
        res.send(response);
    }).catch((err)=>{
        res.sendStatus(500);
    })
})

app.post("/delivery_address",better_verify,(req,res)=>{
    let data = req.user_data;

    //now we check the body 
    if (orderManager.validate_address(req.body)){
        //ok
        //run the colete-online validation 
        coleteManager.request_admin_token().then((token)=>{
            console.log(token);
            coleteManager.validate_address(req.body).then((reponse)=>{
                if (reponse){

                    orderManager.insert_addr(req.body,data.id).then((reponse)=>{
                        req.session.select_addr = JSON.stringify(req.body);
                            
                        
                         res.sendStatus(200);
                     }).catch((err)=>{
                         
                         res.sendStatus(500);
                     })

                }
                else{
                    res.send({"err":"Codul poștal nu este valid!"});
                }
            }).catch((err)=>{
                res.send({"err":"Codul poștal nu este valid!"});
            })

        }).catch((err)=>{
            console.log(err);
            res.sendStatus(500);
        })
 
    }
    else{
        res.send({"err":"Please complete all the required fields!"});
    }
})

app.get("/checkout",better_verify,(req,res)=>{
    let data = req.user_data;

      //parse the address from database 
      orderManager.get_active_address(data.id).then((addr)=>{

        console.log("AM GASIT")
        console.log(addr)
          if (addr.length!=0){
              addr = addr[0];
                
            if (data.acc_type!=2)
            res.render("checkout.html",{
                "street": addr.strada.trim(),
                "nr_st":addr.numar,
                "cod": addr.cod.trim(),
                "bloc": addr.bloc,
                "apt": addr.apt,
                "inter":addr.interfon,
                "etaj":addr.etaj,
                "nume":addr.nume.trim(),
                "tel":addr.telefon.trim()
            })
            else{
                res.render("b2b_checkout.html",{
                    "street": addr.strada.trim(),
                    "nr_st":addr.numar,
                    "cod": addr.cod.trim(),
                    "bloc": addr.bloc.trim(),
                    "apt": addr.apt.trim(),
                    "inter":addr.interfon.trim(),
                    "etaj":addr.etaj.trim(),
                    "nume":addr.nume.trim(),
                    "tel":addr.telefon.trim()
                })
            }
          }
          else{
              res.redirect("/delivery_info")
          }
      }).catch((err)=>{
          console.log(err);
          res.sendStatus(500);
      })

   
})


app.get("/test_me",(req,res)=>{
    coleteManager.request_admin_token().then((token)=>{
        console.log("rezolvat")
        res.sendStatus(200);
    }).catch((err)=>{
        console.log(err + " err");
        res.sendStatus(200);
    })
})
//cost estimates

//for delivery 
app.post("/cost_estimate",better_verify,(req,res)=>{
    
    let user_data = req.user_data;
    //parse the cart from the db 
    shopManager.get_cart_prods(user_data.id).then((cart_content)=>{
        coleteManager.request_admin_token().then((reponse)=>{         

            coleteManager.get_point_address(JSON.stringify(cart_content)).then((points)=>{
                 //get the weights to
                
                 coleteManager.get_weights(JSON.stringify(cart_content)).then((weights)=>{  
                                 
                        //parse the address, then try again 
                        orderManager.get_active_address(user_data.id).then((addr)=>{
                            if (addr.length!=0){
                                addr = addr[0];
                            
                                coleteManager.get_cost_estimates(JSON.stringify(addr),points,weights,JSON.stringify(cart_content),reponse).then((r)=>{                    
                                    //send it back 
                                    res.send({"msg":r});
                                }).catch((err)=>{
                                   res.sendStatus(500);
                                })
                            }
                            else{
                               res.sendStatus(500); 
                            }

                        }).catch((err)=>{
                            res.sendStatus(500);
                        })
                    
     
                 }).catch((err)=>{
                     res.sendStatus(500);
                 })     
     
     
     
            }).catch((err)=>{    
                res.sendStatus(500);
            })
        }).catch((err)=>{    
            res.sendStatus(500);
        })
    }).catch((err)=>{
        res.sendStatus(500);
    })
 
})

//get price for point total
app.post("/get_total_price_point",better_verify,(req,res)=>{
    let cart_content = req.session.cart;
    cart_content = JSON.parse(cart_content);

    let total = 0;
    console.log(req.body.point_id);
    for (index in cart_content){
        if (cart_content[index].point_id == req.body.point_id)
        {
            total += parseFloat(cart_content[index].price) * parseInt(cart_content[index].qty);
        }
    }
    res.send({"total":total})
})

//send the order 
app.post("/send_order",better_verify,(req,res)=>{
    let data = req.user_data;
    if (req.body){
        //first we check the cart
        if (req.session.cart && req.session.cart.length!=0 && req.session.delivery){
            //this should be valid
            
            //we have cart, in this case we can proceed processing the order 
                orderManager.create_big_order(data.id,req.body,JSON.parse(req.session.cart),JSON.parse(req.session.delivery)).then((reponse)=>{                   
                    res.sendStatus(200);
                }).catch((err)=>{
                    res.sendStatus(500);
                })
        }
        else
        {
            //get the cart and addr 
            shopManager.get_cart_prods(data.id).then((cart_content)=>{
             
                orderManager.get_active_address(data.id).then((addr)=>{
                    if (addr.length!=0)
                    {
                        addr = addr[0];
                     
                        //we have cart, in this case we can proceed processing the order 
                        orderManager.create_big_order(data.id,req.body,cart_content,addr).then((reponse)=>{                   
                            res.sendStatus(200);
                        }).catch((err)=>{
                            res.sendStatus(500);
                        })
                    }
                    else{
                        res.sendStatus(500);
                    }
                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
    }
    else{
        res.sendStatus(500);
    }
})

app.post("/b2b_order",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type==2){
        b2bManager.insert_order(user_data.id).then((result)=>{
            res.sendStatus(200);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(403);
    }
})

//get all the order infos for user 
app.post("/get_all_cart_infos",(req,res)=>{
    let token = req.token;

          //for both guest and logged in users, the session was checked, so we can just parse the data from it

            if (req.session.cart){
                //we have the session
                orderManager.get_infos_for_guest(req.session.cart).then((response)=>{
                 //   console.log(response);
                    res.send(response);
                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }
            else{
                res.sendStatus(500);
            }
       
})

//END ORDER 



//profile
//dashboard profile
app.get("/dashboard",verifyToken,(req,res)=>{
    let token = req.token;

    jwt.verify(token,"secret", async (err,data)=>{
        if (err){
            res.sendStatus(403);
        }
        else{
            if (data.acc_type == 1){
                farmManager.id_to_farmer_slug(data.id).then( async (slug)=>{
                    res.render("extra_profile.html",{
                        "user_name": await userManager.get_real_name(data.id),
                        "bg-image": await userManager.get_bg_profile(data.id),
                        "small_profile": await userManager.get_small_profile(data.id),
                        "slug": slug
                    })
                }).catch(async(err)=>{
                    res.render("extra_profile.html",{
                        "user_name": await userManager.get_real_name(data.id),
                        "bg-image": await userManager.get_bg_profile(data.id),
                        "small_profile": await userManager.get_small_profile(data.id),
                        "slug": "not-found"
                    })
                })

        }
        else if (data.acc_type==0){
            //user 
            let user_data = await userManager.get_user_data(data.id);
          
            res.render("user_dashboard.html",{
                real_name: await userManager.get_real_name(data.id),
                user_name: user_data?.username,
                phone: user_data?.phone_number,
                email: user_data?.email,
                phone_ver: user_data.phone_ver,
                email_ver: user_data.email_ver
            });
        }
        else {
            let user_data = await userManager.get_user_data(data.id);
            console.log(data);
                res.render("bis_dash.html",{
                    real_name: await userManager.get_real_name(data.id),
                    user_name: user_data?.username,
                    phone: user_data?.phone_number,
                    email: user_data?.email,
                    phone_ver: user_data.phone_ver,
                    email_ver: user_data.email_ver,
                    bis_name: user_data.bis_name
                });
            }
        }
    })

})
//USER dashboard functions 
//edit personal data 
app.post("/change_personal_data",better_verify,(req,res)=>{
    let data = req.body;
    let user_data = req.user_data;
  
        //check the needed data 
        if (data?.real_name.trim()!="" && data?.username.trim()!="" && data?.phone.trim()!="" && data?.email.trim()!="")
        {
            //all ok 
            //let's update
            userManager.update_client_data(data,user_data.id).then((response)=>{
                res.sendStatus(200);
            }).catch((err)=>{
                res.send(err);
            })
        }
        else{
            res.send({"general":"Please complete all the fields"});
        }
    
})


//get profile mages 
app.post("/get_images",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(500);
        }
        else{
            if (req.body.for!=null){
                userManager.get_images(req.body.for,data.id).then((response)=>{
                    res.send(response);
                }).catch((error)=>{
                    res.sendStatus(500);
                })
            }
            else{
                res.sendStatus(500);
            }
        }
    })
})

app.post("/get_farm_pics_l",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type!=1){
        res.sendStatus(403);
    }
    else{
        farmManager.get_farm_pics(user_data.id).then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.send({});
        })
    }
})

app.post("/upload_farm_pic",[better_verify,preview_upload.single("image")],(req,res)=>{
    console.log(req.file);
    if (req.file && req.file.filename){
        res.send({"filename":req.file.filename})
    }
    else{
        res.send({});
    }
})

app.post("/delete_farm_pic",better_verify,(req,res)=>{
    let user_data = req.user_data;  

    if (user_data.acc_type == 1)
    {
        if (req.body.image_id)
        {
            farmManager.delete_farm_pic(req.body.image_id,user_data.id).then((response)=>{
                res.sendStatus(200);
            }).catch(()=>{
                res.sendStatus(500);
            })
        }
        else{
            res.sendStatus(500);
        }
    }
    else{
        res.sendStatus(403);
    }
})

app.post("/update_farmer_desc",better_verify,(req,res)=>{
    let user_data = req.user_data;

    if (req.body.desc)
    {
        farmManager.had_desc(user_data.id).then((count)=>{
            farmManager.update_farmer_desc(req.body.desc,user_data.id).then((response)=>{
                if (count.length==0 || count[0].total == 0)
                res.send({"final_step":true})
                else
                res.sendStatus(200);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }).catch((err)=>{
            res.sendStatus(500);
        })

    }
    else{
        res.sendStatus(500);
    }
})

app.post("/finish_upload_farm_pic",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type == 1){
        if (req.body.content){
            let content = req.body.content;
            let ok = true;
            content.map(image=>{
                if (image.desc.trim() == ""){
                    ok  =false;
                    return ;
                }   
            })

            if (ok){
                //move 
                content.map(image=>{
                   let parts = image.filename.split("/");
                    fs.rename("previews/"+parts[parts.length-1],"uploads/"+parts[parts.length-1],function(err){
                        
                    });
                })
                farmManager.farm_image_count(user_data.id).then((count)=>{
                                //insert in db 
                        farmManager.insert_farm_pics(content,user_data.id).then((response)=>{
                            if (count.length==0 || count[0].total == 0)
                            res.send({"redirect": true})
                            else{
                                res.send({})
                            }
                        }).catch((err)=>{
                            res.send({"err":"Te rugăm să încerci mai târziu!"});
                        })
                }).catch((err)=>{
                        //insert in db 
                    farmManager.insert_farm_pics(content,user_data.id).then((response)=>{
                        res.send({});
                    }).catch((err)=>{
                        res.send({"err":"Te rugăm să încerci mai târziu!"});
                })
                })
             
                
            }
            else{
                res.send({"err":" Fiecare imagine trebuie să conțină o descriere!"})
            }
        }
        else{
            res.send({"err":"Te rugăm să încarci imagini!"});
        }
    }
    else{
        res.sendStatus(403);
    }
})

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : hex;
  }

  
app.post("/update_images",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(403);
        }
        else{
                if (req.body.for && req.body.img_id){
                        userManager.update_show(req.body.for,data.id,req.body.img_id).then((response)=>{
                            res.sendStatus(200);
                        }).catch((err)=>{
                            res.sendStatus(500);
                        })
                }
                else{
                    res.sendStatus(500);
                }
        }
    })
})

//upload image for profile  
app.post("/add_user_image",[verifyToken,upload2.single("test")],(req,res)=>{    
    console.log(req.file);
    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(403);
        }
        else{
            //we should append the image 
            if (req.file!=null){
            userManager.add_image(req.file.filename,req.body.for,data.id).then((response)=>{
                console.log(response);
                res.sendStatus(200);
            }).catch((err)=>{
                console.log(err);
                res.sendStatus(500);
            })
        }
        else{
            userManager.add_image(req.body.color,req.body.for,data.id).then((response)=>{
                console.log(response);
                res.sendStatus(200);
            }).catch((err)=>{
                console.log(err);
                res.sendStatus(500);
            })  
        }
        }
    })
})

app.post("/delete_farmer_profile_pic",better_verify,(req,res)=>{
    let user_data = req.user_data;

    if (user_data.acc_type == 1)
    {
        if (req.body.what && req.body.img_id)
        {
            userManager.delete_farmer_profile_pic(req.body.what,req.body.img_id,user_data.id).then((response)=>{
                res.sendStatus(200);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
    }
    else{
        res.sendStatus(403);
    }
})





app.get("/profile/:slug",verifyToken,(req,res)=>{

    userManager.slug_to_user_id(req.params.slug).then((user_id)=>
    {
        
        jwt.verify(req.token,"secret",function(err,data){
            console.log(req.params.wanted);
            let pics,farmer_names,profile_image,desc,is_admin,user_id;
            
            pics = userManager.get_farmer_pics(req.params.slug);
            farmer_names = userManager.get_farmer_names(req.params.slug);
            profile_image = userManager.get_profile_img(req.params.slug);
            desc = farmManager.get_farm_desc_slug(req.params.slug);
            is_admin = farmManager.is_this_farmer_admin(data?.id,req.params.slug);
            user_id = userManager.slug_to_user_id(req.params.slug);
            
            Promise.allSettled([pics,farmer_names,profile_image,desc,is_admin,user_id]).then((responses)=>{
                    console.log(responses[1]);
                if (responses[0].status!="fulfilled")
                {
                    pics = "linear-gradient(#FFFFFF,#FFFFFF)";
                }
                else{
                    pics = responses[0].value;
                }
        
                if (responses[2].status!="fulfilled")
                {
                    profile_image = "/assets/images/apppictures/3.jpg";
                }
                else{
                    if (!responses[2].value.includes("assets"))
                    profile_image = "/profile_uploads/"+responses[2].value;
                    else
                    {
                        profile_image = responses[2].value;
                    }
                }
    
                if (responses[3].status!="fulfilled")
                {
                    desc = "Default ";
                }
                else{
                    if (responses[3].value.length==0)
                    desc = "Default ";
                    else
                    desc = responses[3].value[0].descriere;
                }
        
                if (responses[1].status!="fulfilled" || responses[5].status!="fulfilled"){
                    res.sendStatus(500);
                }
                else{
                    res.render("profile_farmer.html",{
                        "bg": pics,
                        "bis_name": responses[1]?.value[0]?.bis_name,
                        "profile_image":profile_image,
                        "desc": desc,
                        "admin": responses[4].value,
                        "farmer_id": responses[5].value,
                        "login": err ? true : false
                    });
                }
            })  
        })
       
    }).catch((err)=>{
        //maybe the slug is from the firme 
        userManager.slug_to_firma_id(req.params.slug).then((response)=>{
            res.render("profile_farmer.html",{
                "bis_name": response,
                "profile_image": '/assets/images/apppictures/3.jpg'
            });
        }).catch((err)=>{
            res.status(404).render('error-404.html');
        })
    })
    
})


app.post("/get_prod_data",(req,res)=>{
    
    if (req.body.prod_id)
    {
        farmManager.get_prod_data(parseInt(req.body.prod_id)).then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(500);
    }

})

app.post("/get_cart_details",verifyToken,(req,res)=>{
    console.log(req.body);
    if (req.body.prod_id && req.body.point_id){
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            //check sesscion 

        }
        else
        {
            userManager.cart_contains(req.body.prod_id,req.body.point_id,data.id).then((response)=>{
                res.send(response);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
    })
}
else{
    res.sendStatus(500);
}

})

app.post("/farmer_prods",(req,res)=>{
    let from = req.headers?.referer;

    if (from){
        let parts = from.split("/");
        let farmer_id = parts[parts.length-1];  
        //get the prods 
        farmManager.get_all_sold_prods_slug(farmer_id).then((response)=>{
            
            res.send(response);
        }).catch((err)=>{
            res.send({});
        })
        console.log(farmer_id);
    }
    else{
        res.send({});
    }
})

app.post("/get_farm_desc",better_verify,(req,res)=>{
    let user_data = req.user_data;
    farmManager.get_farm_desc(user_data.id).then((response)=>{
        if (response.length == 0)
        {
            //send default 
            res.send({"descriere":"Descriere default"})
        }
        else{
            res.send({"descriere":response[0].descriere});
        }
    }).catch((err)=>{
        res.sendStatus(500);
    })
})

app.post("/get_farm_pics",(req,res)=>{
    let header = req.headers?.referer;

    if (header){
        let parts = header.split("/");
        let farmer_id = parts[parts.length-1];
        console.log(farmer_id);
        farmManager.get_farm_pics_slug  (farmer_id).then((response)=>{
            res.send(response);
            
        }).catch((err)=>{
            res.send({});
        })
    }
    else{
        res.sendStatus(403);
    }
})


app.post("/update_cover",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (req.body.image_name){

        farmManager.update_cover(req.body.image_name,user_data.id).then(()=>{
            res.sendStatus(200);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(500);
    }
})

app.post("/update_farm_pic_desc",better_verify,(req,res)=>{
    let user_data = req.user_data;

    if (user_data.acc_type == 1 || user_data.acc_type == 5){
        if (req.body.image_id){
        if (req.body.desc.trim()!="")
        {
            farmManager.update_cover_desc(req.body.image_id,req.body.desc,user_data.id).then(()=>{
                res.sendStatus(200);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
        else{
            console.log("camp");
            res.send({"err":"Câmpul trebuie completat!"})
        }
    }
    else{
        res.sendStatus(500);
    }
    }
    else{
        res.sendStatus(403);
    }
})

app.post("/get_all_reviews",(req,res)=>{
    let header = req.headers?.referer;

    if (header){    
        let parts = header.split("/");
        let farmer_id = parts[parts.length-1];


        farmManager.get_tesimonials(farmer_id).then((response)=>{
            console.log(response);
            res.send(response);
        }).catch((err)=>{
            res.send({});
        })
    }
    else{
        console.log("SEEENT")
        res.sendStatus(500);
    }
})

app.post("/load_working_points",(req,res)=>{
    let header = req.headers?.referer;

    if (header){    
        let parts = header.split("/");
        let farmer_id = parts[parts.length-1];
        
        userManager.slug_to_user_id(farmer_id).then((user_id)=>{
            farmManager.get_workp(user_id).then((response)=>{
                res.send(response);
            }).catch((err)=>{
                res.send({});
            })
        }).catch(()=>{
            res.sendStatus(500);
        })
        
    }
    else{
        res.sendStatus(500);
    }
})

app.post("/get_farmer_aviz",(req,res)=>{
    let header = req.headers?.referer;

    if (req.body.farmer_id){    
       
     
        admin_manager.get_avize(req.body.farmer_id).then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.send({});
        })
    }
    else{
        res.sendStatus(500);
    }
})
//profile settings 
app.get("/settings",verifyToken,(req,res)=>{

    let token = req.token;
    jwt.verify(token,"secret",async (err,data)=>{
        if (err){
            res.sendStatus(403);
        }
        else{
            //user is ok we can render the page
            res.render("settings.html",{"csrf_token":req.csrfToken,
        "g_auth": await userManager.get_auth(aes.decrypt(data.name,crypto,process))
    });
        }
    })
})

app.get("/personal_data",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(403);
        }
        else{
            userManager.get_user_contact_info(data.id).then((response)=>{

                farmManager.id_to_farmer_slug(data.id).then((slug)=>{
                    res.render("personal_data.html",{
                        "csrf_token":req.csrfToken,
                        "phone": response[0]?.phone_number,
                        "email":response[0]?.email,
                        "phone_ver": response[0]?.phone_ver,
                        "email_ver": response[0]?.email_ver,
                        "slug": slug
                    });
                }).catch((err)=>{
                    res.render("personal_data.html",{
                        "csrf_token":req.csrfToken,
                        "phone": response[0]?.phone_number,
                        "email":response[0]?.email,
                        "phone_ver": response[0]?.phone_ver,
                        "email_ver": response[0]?.email_ver,
                        "slug": "not-found"
                    });
                })

       
            }).catch((err)=>{
                res.sendStatus(500);
            })
         
        }
    })
});

app.get("/security_settings",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",async (err,data)=>{
        if (err){
            res.sendStatus(403);
        }
        else{
            if (data.acc_type==1){
                farmManager.id_to_farmer_slug(data.id).then( async (slug)=>{
                    res.render("security_settings.html",{"csrf_token":req.csrfToken,
                    "g_auth": await userManager.get_auth(aes.decrypt(data.name,crypto,process)),
                "slug":slug})
                }).catch(async (err)=>{
                    res.render("security_settings.html",{"csrf_token":req.csrfToken,
                    "g_auth": await userManager.get_auth(aes.decrypt(data.name,crypto,process)),"slug":"not-found"})
                })

            }
            else if (data.acc_type==0){               
            res.render("user_security_settings.html",{"csrf_token":req.csrfToken,
            "g_auth": await userManager.get_auth(aes.decrypt(data.name,crypto,process))})
            }
            else{
                res.render("b2b_security_settings.html",{"csrf_token":req.csrfToken,
                "g_auth": await userManager.get_auth(aes.decrypt(data.name,crypto,process))})
            }
        }
    })
})
//end profile

app.get("/view_farms",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(403);
        }
        else{
            farmManager.id_to_farmer_slug(data.id).then((slug)=>{
                res.render("view_farms_dashboard.html",{
                    "slug": slug
                });
            }).catch((err)=>{
                res.render("view_farms_dashboard.html",{
                    "slug": "not-found"
                });
            })
            
        }
    })
})
//change email
app.post("/change_mail",verifyToken,(req,res)=>{
    //in order to change the email,user must be verified
    let token = req.token;
    jwt.verify(token,"secret", async function(err,data){
        if (err){
            console.log(err);
            res.sendStatus(404);
        }
        else{
           
                req.body.new_mail = req.body.new_mail.trim();
            if (req.body.new_mail){
            //the user is ok, now we can try to send the email
                //proceed validation 
                let validation = await mail_checker.validate({email: req.body.new_mail,sender: 'no-reply@farmvio.com'
                ,validateRegex: true,
                    validateMx: true,
                    validateTypo: true,
                    validateDisposable: true,
                validateSMTP: false});

                if (validation.valid){ 
                    //generate the code 
                    let code = Math.floor(100000 + Math.random() * 900000);
                    //create the code 
            let mailOpts = {
                from: 'no-reply@farmvio.com',
                to: req.body.new_mail,
                subject: "Verificare email",
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                <title></title>
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <style type="text/css">
                    /* FONTS */
                    @import url('https://fonts.googleapis.com/css?family=Poppins:100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i');
                
                    /* CLIENT-SPECIFIC STYLES */
                    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                    img { -ms-interpolation-mode: bicubic; }
                
                    /* RESET STYLES */
                    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
                    table { border-collapse: collapse !important; }
                    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
                
                    /* iOS BLUE LINKS */
                    a[x-apple-data-detectors] {
                        color: inherit !important;
                        text-decoration: none !important;
                        font-size: inherit !important;
                        font-family: inherit !important;
                        font-weight: inherit !important;
                        line-height: inherit !important;
                    }
                
                    /* MOBILE STYLES */
                    @media screen and (max-width:600px){
                        h1 {
                            font-size: 32px !important;
                            line-height: 32px !important;
                        }
                    }
                
                    /* ANDROID CENTER FIX */
                    div[style*="margin: 16px 0;"] { margin: 0 !important; }
                </style>
                </head>
                <body style="background-color: #f3f5f7; margin: 0 !important; padding: 0 !important;">
                
                <!-- HIDDEN PREHEADER TEXT -->
                <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Poppins', sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
                    We're thrilled to have you here! Get ready to dive into your new account.
                </div>
                
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <!-- LOGO -->
                    <tr>
                        <td align="center">
                            <!--[if (gte mso 9)|(IE)]>
                            <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                            <tr>
                            <td align="center" valign="top" width="600">
                            <![endif]-->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                                <tr>
                                    <td align="center" valign="top" style="padding: 40px 10px 10px 10px;">
                                        <a href="#" target="_blank" style="text-decoration: none;">
                                            <span style="display: block; font-family: 'Poppins', sans-serif; color: #3e8ef7; font-size: 36px;" border="0"><b>Riday Admin</b> admin</span>
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <!--[if (gte mso 9)|(IE)]>
                            </td>
                            </tr>
                            </table>
                            <![endif]-->
                        </td>
                    </tr>
                    <!-- HERO -->
                    <tr>
                        <td align="center" style="padding: 0px 10px 0px 10px;">
                            <!--[if (gte mso 9)|(IE)]>
                            <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                            <tr>
                            <td align="center" valign="top" width="600">
                            <![endif]-->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                                <tr>
                                    <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Poppins', sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 2px; line-height: 48px;">
                                      <h1 style="font-size: 36px; font-weight: 600; margin: 0;">Salut, ${data.username}</h1>
                                    </td>
                                </tr>
                            </table>
                            <!--[if (gte mso 9)|(IE)]>
                            </td>
                            </tr>
                            </table>
                            <![endif]-->
                        </td>
                    </tr>
                    <!-- COPY BLOCK -->
                    <tr>
                        <td align="center" style="padding: 0px 10px 0px 10px;">
                            <!--[if (gte mso 9)|(IE)]>
                            <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                            <tr>
                            <td align="center" valign="top" width="600">
                            <![endif]-->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                              <!-- COPY -->
                              <tr>
                                <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 20px 30px; color: #666666; font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 400; line-height: 25px;">
                                  <p style="margin: 0;">We're excited to have you get started. First, you need to confirm your account. Just press the button below.</p>
                                </td>
                              </tr>
                              <!-- BULLETPROOF BUTTON -->
                              <tr>
                                <td bgcolor="#ffffff" align="left">
                                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td bgcolor="#ffffff" align="center" style="padding: 20px 30px 30px 30px;">
                                        <table border="0" cellspacing="0" cellpadding="0">
                                          <tr>
                                              <td align="center" style="border-radius: 3px;" bgcolor="#17b3a3"><span  style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; color: #ffffff; text-decoration: none; padding: 12px 50px; border-radius: 2px; border: 1px solid #17b3a3; display: inline-block;">${code}</span></td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <!-- COPY -->
                              <tr>
                                <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 0px 30px; color: #666666; font-family: &apos;Lato&apos;, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 25px;">
                                  <p style="margin: 0;">If that doesn't work, copy and paste the following link in your browser:</p>
                                </td>
                              </tr>
                              <!-- COPY -->
                                <tr>
                                  <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 20px 30px; color: #666666; font-family: &apos;Lato&apos;, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 400; line-height: 25px;">
                                    <p style="margin: 0;"><a href="http://thetheme.io" target="_blank" style="color: #17b3a3;">XXX.XXXXXXX.XXX/XXXXXXXXXXXXX</a></p>
                                  </td>
                                </tr>
                              <!-- COPY -->
                              <tr>
                                <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 20px 30px; color: #666666; font-family: &apos;Lato&apos;, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 25px;">
                                  <p style="margin: 0;">If you have any questions, just reply to this email—we're always happy to help out.</p>
                                </td>
                              </tr>
                              <!-- COPY -->
                              <tr>
                                <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 0px 0px; color: #666666; font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 400; line-height: 25px;">
                                  <p style="margin: 0;">Cheers,<br>Team</p>
                                </td>
                              </tr>
                            </table>
                            <!--[if (gte mso 9)|(IE)]>
                            </td>
                            </tr>
                            </table>
                            <![endif]-->
                        </td>
                    </tr>
            
                </table>
                
                </body>
                </html>
                `
            }
            transporter.sendMail(mailOpts,function(error,info){
                if (error){
                    console.log(info);
                    res.send({"err":"Te rugăm să încerci mai târziu!"})
                }
                else{
                    //email was,sent we can inbsert the cod e
                    userManager.add_ver_mail(req.body.new_mail,data.id,code).then(()=>{
                        res.sendStatus(200);
                    }).catch((err)=>{
                       
                        res.sendStatus(500);
                    });

      
                }
            })
        }
        else{
            res.send({"err":"Adresa de email nu este validă!"})
        }
        }
        
        else{
            res.send({"err":"Introdu o adresa!"})
        }
        }
    })
    
    
})


app.post("/send_email_verify",better_verify,(req,res)=>{
    let user_data = req.user_data;
    //just send the code to the current email 
    userManager.get_user_contact_info(user_data.id).then((response)=>{
        console.log(response);
        if (response.length!=0 && response[0].email.trim()!="")
        {
            response[0].email = response[0].email.trim();
            //send the email 
            let validation =  mail_checker.validate({email: response[0].email,sender: 'no-reply@farmvio.com'
            ,validateRegex: true,
                validateMx: true,
                validateTypo: true,
                validateDisposable: true,
            validateSMTP: false});

            Promise.allSettled([validation]).then((resp)=>{
           
                if (resp[0].status=="fulfilled" && resp[0].value.valid){ 
                    //generate the code 
                    let code = Math.floor(100000 + Math.random() * 900000);
                    //create the code 
            let mailOpts = {
                from: 'no-reply@farmvio.com',
                to: response[0].email,
                subject: "Testing the new addr",
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                <title></title>
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <style type="text/css">
                    /* FONTS */
                    @import url('https://fonts.googleapis.com/css?family=Poppins:100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i');
                
                    /* CLIENT-SPECIFIC STYLES */
                    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                    img { -ms-interpolation-mode: bicubic; }
                
                    /* RESET STYLES */
                    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
                    table { border-collapse: collapse !important; }
                    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
                
                    /* iOS BLUE LINKS */
                    a[x-apple-data-detectors] {
                        color: inherit !important;
                        text-decoration: none !important;
                        font-size: inherit !important;
                        font-family: inherit !important;
                        font-weight: inherit !important;
                        line-height: inherit !important;
                    }
                
                    /* MOBILE STYLES */
                    @media screen and (max-width:600px){
                        h1 {
                            font-size: 32px !important;
                            line-height: 32px !important;
                        }
                    }
                
                    /* ANDROID CENTER FIX */
                    div[style*="margin: 16px 0;"] { margin: 0 !important; }
                </style>
                </head>
                <body style="background-color: #f3f5f7; margin: 0 !important; padding: 0 !important;">
                
                <!-- HIDDEN PREHEADER TEXT -->
                <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Poppins', sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
                    We're thrilled to have you here! Get ready to dive into your new account.
                </div>
                
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <!-- LOGO -->
                    <tr>
                        <td align="center">
                            <!--[if (gte mso 9)|(IE)]>
                            <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                            <tr>
                            <td align="center" valign="top" width="600">
                            <![endif]-->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                                <tr>
                                    <td align="center" valign="top" style="padding: 40px 10px 10px 10px;">
                                        <a href="#" target="_blank" style="text-decoration: none;">
                                            <span style="display: block; font-family: 'Poppins', sans-serif; color: #3e8ef7; font-size: 36px;" border="0"><b>Riday Admin</b> admin</span>
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <!--[if (gte mso 9)|(IE)]>
                            </td>
                            </tr>
                            </table>
                            <![endif]-->
                        </td>
                    </tr>
                    <!-- HERO -->
                    <tr>
                        <td align="center" style="padding: 0px 10px 0px 10px;">
                            <!--[if (gte mso 9)|(IE)]>
                            <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                            <tr>
                            <td align="center" valign="top" width="600">
                            <![endif]-->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                                <tr>
                                    <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Poppins', sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 2px; line-height: 48px;">
                                      <h1 style="font-size: 36px; font-weight: 600; margin: 0;">Salut, ${user_data.username}</h1>
                                    </td>
                                </tr>
                            </table>
                            <!--[if (gte mso 9)|(IE)]>
                            </td>
                            </tr>
                            </table>
                            <![endif]-->
                        </td>
                    </tr>
                    <!-- COPY BLOCK -->
                    <tr>
                        <td align="center" style="padding: 0px 10px 0px 10px;">
                            <!--[if (gte mso 9)|(IE)]>
                            <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                            <tr>
                            <td align="center" valign="top" width="600">
                            <![endif]-->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                              <!-- COPY -->
                              <tr>
                                <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 20px 30px; color: #666666; font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 400; line-height: 25px;">
                                  <p style="margin: 0;">We're excited to have you get started. First, you need to confirm your account. Just press the button below.</p>
                                </td>
                              </tr>
                              <!-- BULLETPROOF BUTTON -->
                              <tr>
                                <td bgcolor="#ffffff" align="left">
                                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td bgcolor="#ffffff" align="center" style="padding: 20px 30px 30px 30px;">
                                        <table border="0" cellspacing="0" cellpadding="0">
                                          <tr>
                                              <td align="center" style="border-radius: 3px;" bgcolor="#17b3a3"><span  style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; color: #ffffff; text-decoration: none; padding: 12px 50px; border-radius: 2px; border: 1px solid #17b3a3; display: inline-block;">${code}</span></td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <!-- COPY -->
                              <tr>
                                <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 0px 30px; color: #666666; font-family: &apos;Lato&apos;, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 25px;">
                                  <p style="margin: 0;">If that doesn't work, copy and paste the following link in your browser:</p>
                                </td>
                              </tr>
                              <!-- COPY -->
                                <tr>
                                  <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 20px 30px; color: #666666; font-family: &apos;Lato&apos;, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 400; line-height: 25px;">
                                    <p style="margin: 0;"><a href="http://thetheme.io" target="_blank" style="color: #17b3a3;">XXX.XXXXXXX.XXX/XXXXXXXXXXXXX</a></p>
                                  </td>
                                </tr>
                              <!-- COPY -->
                              <tr>
                                <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 20px 30px; color: #666666; font-family: &apos;Lato&apos;, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 25px;">
                                  <p style="margin: 0;">If you have any questions, just reply to this email—we're always happy to help out.</p>
                                </td>
                              </tr>
                              <!-- COPY -->
                              <tr>
                                <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 0px 0px; color: #666666; font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 400; line-height: 25px;">
                                  <p style="margin: 0;">Cheers,<br>Team</p>
                                </td>
                              </tr>
                            </table>
                            <!--[if (gte mso 9)|(IE)]>
                            </td>
                            </tr>
                            </table>
                            <![endif]-->
                        </td>
                    </tr>
            
                </table>
                
                </body>
                </html>
                `
            }
            
    
            transporter.sendMail(mailOpts,function(error,info){
                if (error){
                  
                    res.send({"err":"Te rugăm să încerci mai târziu!"})
                }
                else{
                   
                    //email was,sent we can inbsert the cod e
                    userManager.add_ver_mail(response[0].email,user_data.id,code).then(()=>{
                    
                        res.send({"email":response[0].email})
                    }).catch((err)=>{
                       
                        res.sendStatus(500);
                    });
    
                 
                }
            })
        }
        else{
    
           
            res.send({"err":"Adresa de email nu este validă!"})
        }  
            })
      
        }
        else{
            res.send({"err": "Nu există o adresă de email!"})
        }
    }).catch((err)=>{
        res.send({"err":"Te rugăm să încerci mai târziu!"})
    })
})




app.post("/verify_mail",verifyToken,(req,res)=>{
    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(403);
        }
        else{
            userManager.verify_mail_code(data.id,req.body.code).then((response)=>{
                res.send(response);
            })
            .catch((err)=>{
               
                res.sendStatus(500);
            })
        }
    })

})
app.post("/change_pass",verifyToken,(req,res)=>{
    //verify if user is logged in 
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        console.log(data);
        if (err){
            console.log(err);
            res.sendStatus(403);
            
        }
        else{
            userManager.change_pass(req.body,data.id).then((msg)=>{
                res.send(msg);
            }).catch((err)=>{
                res.sendStatus(500);
            });
            //user is ok we can now change the pass
            console.log(req.body);
            
        }
    })
})

app.post("/change_phone",verifyToken,(req,res)=>{
    console.log("HCHCHCH");
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(403);
        }
        else{
                
                    if (req.body.new_phone){
                        let code = Math.floor(100000 + Math.random() * 900000);


                        //send through smsadvert 
                        let body = {};
                        body.phone = req.body.new_phone.trim();
                        body.shortTextMessage = "Your code is "+code;
                        axios.post("https://www.smsadvert.ro/api/sms/",
                        body,{
                            headers:
                            {
                                "Content-Type": "application/json",
                                "Authorization":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MTU1NmZmMTRiN2MxYzAwMDRjYWY0NmYifQ.wbOZEFZMpikAddf63sWBhppdP-uhk3GeJkRAMp4y6O8"

                            }
                        }).then((response)=>{
                            
                            console.log(response);
                                userManager.add_ver(req.body.new_phone.trim(),data.id,code).then((response)=>{
                                res.sendStatus(200);
                            }).catch((err)=>{
                             res.sendStatus(500);
                           })
                        }).catch((err)=>{
                            res.sendStatus(500);
                        })


    }
    else{
        res.sendStatus(500);
    }
                
        }
    })
})


app.post("/send_verify_phone",better_verify,(req,res)=>{
    let user_data = req.user_data;
    //get the phone number 
    userManager.get_user_contact_info(user_data.id).then((response)=>{
        console.log(response);
        if (response.length!=0 && response[0].phone_number.trim()!="")
        {
            //generate and send code 
            let code = Math.floor(100000 + Math.random() * 900000);


            //send through smsadvert 
            let body = {};
            body.phone = response[0].phone_number.trim();
            body.shortTextMessage = "Codul tău etse "+code;
            axios.post("https://www.smsadvert.ro/api/sms/",
            body,{
                headers:
                {
                    "Content-Type": "application/json",
                    "Authorization":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MTU1NmZmMTRiN2MxYzAwMDRjYWY0NmYifQ.wbOZEFZMpikAddf63sWBhppdP-uhk3GeJkRAMp4y6O8"

                }
            }).then((r)=>{
                    userManager.add_ver(response[0].phone_number.trim(),user_data.id,code).then(()=>{
                    res.send({"phone": response[0].phone_number})
                }).catch((err)=>{
                    console.log("aici");
                 res.sendStatus(500);
               })
            }).catch((err)=>{
                console.log(err);
                console.log("aici2");
                res.sendStatus(500);
            })
        }
        else{
            res.send({"err":"Nu există un număr de telefon pentru acest cont!"})
        }

    }).catch((err)=>{
        console.log(err);
        console.log("aici3");
        res.sendStatus(500);
    })
})

app.post("/verify_phone",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(403);
        }else{
            if (req.body.code){
            userManager.verify_phone_code(data.id,req.body.code.trim()).then((response)=>{
               
                res.send(response);
            }).catch((err)=>{
                res.send({"err":"Cod greșit!"});
            })
            }
            else{
                res.send({"err":"Cod greșit!"});
            }
        }
    })
})
//farm admin 
app.get("/farm_admin",verifyToken,(req,res)=>{

    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(403);
            
        }
        else{
            res.render("add_farm.html")
        }
    })
})


app.post("/post_farm",[verifyToken,upload.array('farmImages')],(req,res)=>{
    let token = req.token;
    console.log(req.files);
    let images_array = {};
    for(let file in req.files){
        //here we should upload the images to the database
    }

    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(403);
        }
        else{
          //  console.log(req.body);
            
            farmManager.validate_elems(req).then((response)=>{
               // console.log(response);
               if (response.server!=null){
               //insert_farm
               farmManager.insert_farm(req.body.farm_name,response.server.lat,response.server.lng,data.id,req.body.cui,req.body.county,req.body.city,req.body.address)
               .then((insert_response)=>{
                   console.log(insert_response);
                   response.farm_id = insert_response;
                   res.send(response);
               }).catch((err)=>{
                   res.sendStatus(500);
               })   
            }
                else
                res.send(response.client);

            }).catch((why)=>{
                res.sendStatus(500);
                console.log(why);
            })
            
            //verify received data 
        }
    })
})

//test only
app.get("/kyc",(req,res)=>{

    let data =  fs.readFileSync('./avize_pics/3873-660948-2688--0.frv');

    //encode decrypted buffer 
    data = decrypt_file(data);
    console.log(data);
    //console.log(data);
    res.setHeader( "Content-Type", "image/gif")
    res.setHeader( "Content-Length", data.length,)
    res.setHeader( "Cache-Control", "no-cache, no-store, must-revalidate")
    res.setHeader( "Content-Type", "image/jpg")
      res.send(data); 

})


app.get("/test",(req,res)=>{
    
    let workerPool = workerHandler.get();
   
    workerPool.find_matching_words("castrawetzi").then((results)=>{
        console.log(results);
        //we have the list 
        product_searcher.get_best_match_price(results).then((results)=>{
            res.send(results);
        })
    }).catch((err)=>{
        res.sendStatus(500);
    })
})

//kyc
app.post("/kyc",[verifyToken,
    kyc_upload.any()
],(req,res)=>{  
    let token = req.token;
   jwt.verify(token,"secret",(err,data)=>{

       if (err){
           res.sendStatus(404);
       }
       else{
           //we can verify now id data received is ok 
           //first check if the farm is for this owner 
           farmManager.kyc_needed_farm(req.body.farm_id,data.id).then((response)=>{
               if (response==1)
               {
                if (req.files.length==2){
                    //this seems ok, now we can upload them, 
                    //we get and upload each photo
                    for (let file in req.files){
                        file = req.files[file];
                        if (file.fieldname=="id" || file.fieldname=="cui")
                        {
                            //encrypt and upload
                            saveFile(file.buffer,"./kyc/"+new Date().getTime()+".jpg");

                        }
                    }
                    res.sendStatus(200);
                 }
                 else{
                    
                     res.send({"err":"upload both files please"});   
                 }
               }
               else{
                    res.sendStatus(404);
               }
           }).catch((why)=>{
              res.sendStatus(500);
           })
       }

   })



})

app.post("/update_point",[verifyToken,upload.none()],(req,res)=>{
    let token  = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(500);
        }
        else{
            //we should validate all data first
            let required_errors = farmManager.required_point_fields(req.body);
            if(Object.keys(required_errors).length==0)
        {
            //now try to check the address
            con.getConnection((err,conn)=>{
                if (err){
                    res.sendStatus(500);
                }
                else{
                    coleteManager.request_admin_token().then((reponse)=>{
                        let city_promise = search.city_ok(req.body.city.trim(),req.body.county.trim(),conn,mysql);
                        let county_promise = search.county_ok(req.body.county.trim(),conn,mysql);
                        let google_address_promise = farmManager.check_addr(req.body.county+", "+req.body.city+", "+req.body.address+", "+req.body.nr);
    
                        let colete_data = {};
                        colete_data.oras = req.body.city.trim();
                        colete_data.judet = req.body.county.trim();
                        colete_data.strada = req.body.address.trim();
                        colete_data.nr_st = req.body.nr.trim();
                        colete_data.cod = req.body.cod.trim();
                        
                        let colete_address_promise = coleteManager.validate_address(colete_data);
                        
                        Promise.allSettled([city_promise,county_promise,google_address_promise,colete_address_promise]).then((results)=>{
                            let errors = {};
                            console.log(results);
                            //this is the city 
                            if (results[0].status != "fulfilled")
                            {
                                errors.city = "Orașul nu este valid";
                            }
                            else
                            {
                                if (results[0].value == 0){
                                    errors.city = "Orașul nu este valid";
                                }
                            }
                            //county 
                            if (results[1].status != "fulfilled")
                            {
                                errors.county = "Județul nu este valid";
                            }
                            else
                            {
                                if (results[1].value == 0){
                                    errors.county = "Județul nu este valid";
                                }
                            }
    
                            //google address
                            if (results[2].status!="fulfilled"){
                                errors.g_address = "Adresa nu este validă";
                            }
                            else{
                                if (results[2].value == "zero")
                                {
                                    errors.g_address = "Adresa nu este validă";
                                }
                            }
    
                            //colete address
                            if (results[3].status!="fulfilled")
                            {
                                errors.cod = "Codul poștal nu este valid";
                            }
                            else
                            {
                                if(!results[3].value)
                                {
                                    errors.cod = "Codul poștal nu este valid";
                                    
                                }
                            }
                            console.log(Object.keys(errors).length);
                            if (Object.keys(errors).length!=0)
                                res.send(errors);
                                else{
                                    //insert 
                                      farmManager.update_point(req.body.id,req.body.point_name,results[2].value.lat,results[2].value.lng,data.id,req.body.county,req.body.city,req.body.address,0,req.body.nr,req.body.cod).then((response)=>{
                                          res.sendStatus(200);
                                      }).catch((err)=>{
                                          res.sendStatus(500);
                                      })
                                }
                        })
                        
                    }).catch((err)=>{
                        res.sendStatus(500);
                    })
                              }
            })   
        }
            else
            {
                console.log("aici");
                res.send(required_errors);
            }        
    }

    })
})

app.post("/add_point",[verifyToken,upload.none()],(req,res)=>{
    let token  = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(500);
        }
        else{
            //we should validate all data first
            let required_errors = farmManager.required_point_fields(req.body);
            if(Object.keys(required_errors).length==0)
        {
            //now try to check the address
            con.getConnection((err,conn)=>{
                if (err){
                    res.sendStatus(500);
                }
                else{
                    coleteManager.request_admin_token().then((reponse)=>{
                        let city_promise = search.city_ok(req.body.city,req.body.county,conn,mysql);
                        let county_promise = search.county_ok(req.body.county,conn,mysql);
                        let google_address_promise = farmManager.check_addr(req.body.county+", "+req.body.city+", "+req.body.address+", "+req.body.nr);
    
                        let colete_data = {};
                        colete_data.oras = req.body.city;
                        colete_data.judet = req.body.county;
                        colete_data.strada = req.body.address;
                        colete_data.nr_st = req.body.nr;
                        colete_data.cod = req.body.cod;
                        
                        let colete_address_promise = coleteManager.validate_address(colete_data);
                        
                        Promise.allSettled([city_promise,county_promise,google_address_promise,colete_address_promise]).then((results)=>{
                            let errors = {};
                            console.log(results);
                            //this is the city 
                            if (results[0].status != "fulfilled")
                            {
                                errors.city = "Orașul nu este valid!";
                            }
                            else
                            {
                                if (results[0].value == 0){
                                    errors.city = "Orașul nu este valid!";
                                }
                            }
                            //county 
                            if (results[1].status != "fulfilled")
                            {
                                errors.county = "Județul nu este valid!";
                            }
                            else
                            {
                                if (results[1].value == 0){
                                    errors.county = "Județul nu este valid!";
                                }
                            }
    
                            //google address
                            if (results[2].status!="fulfilled"){
                                errors.g_address = "Adresa nu este validă!";
                            }
                            else{
                                if (results[2].value == "zero")
                                {
                                    errors.g_address = "Adresa nu este validă!";
                                }
                            }
    
                            //colete address
                            if (results[3].status!="fulfilled")
                            {
                                errors.cod = "Codul poștal nu este valid!";
                            }
                            else
                            {
                                if(!results[3].value)
                                {
                                    errors.cod = "Codul poștal nu este valid!";
                                    
                                }
                            }
                            console.log(Object.keys(errors).length);
                            if (Object.keys(errors).length!=0)
                                res.send(errors);
                                else{
                                    //insert 
                                      farmManager.insert_point(req.body.point_name,results[2].value.lat,results[2].value.lng,data.id,req.body.county,req.body.city,req.body.address,0,req.body.nr,req.body.cod).then((response)=>{
                                          //check if redirect to add prod 
                                          farmManager.get_prod_count_for_user(data.id).then((response)=>{
                                            if (response.length==0 || response[0].total==0)
                                            res.send({"redirect":"true"});
                                            else
                                            res.send({})
                                          }).catch((err)=>{
                                              res.send({})
                                          })
                                      }).catch((err)=>{
                                          res.sendStatus(500);
                                      })
                                }
                        })
                        
                    }).catch((err)=>{
                        res.sendStatus(500);
                    })
                              }
            })   
        }
            else
            {
                console.log("aici");
                res.send(required_errors);
            }        
    }

    })
})

app.post("/delete_point",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (req.body.point_id){
    farmManager.is_this_my_point_id(req.body.point_id,user_data.id).then((response)=>{
            //delete
            farmManager.delete_point(req.body.point_id).then((response)=>{
                res.sendStatus(200);
            }).catch((err)=>{
                res.sendStatus(500);
            })
    }).catch((err)=>{
        res.sendStatus(500);
    })

    }
    else{
        res.sendStatus(500);
    }
})

//add product 
app.get("/get_prods",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(403);
        }
        else{
            farmManager.get_all_sold_prods(data.id).then((response)=>{
                res.send(response);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
    })
})
app.get("/view_prods",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
            if (err){
                res.sendStatus(403);

            }
            else{
                res.render("view_prod.html");
            }
    })
})
app.get("/add_prod",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(404);
        }
        else{
            farmManager.get_point_count_for_user(data.id).then((response)=>{
                farmManager.id_to_farmer_slug(data.id).then((slug)=>{
                    //its ok
                     res.render("add_prod.html",{
                         "slug": slug,
                         "points": (response.length==0 || response[0].total==0) ? false : true
                     });
                 }).catch((err)=>{
                     res.render("add_prod.html",{
                         "slug": "not-found"
                     });
                 })
            }).catch((err)=>{
                farmManager.id_to_farmer_slug(data.id).then((slug)=>{
                    //its ok
                     res.render("add_prod.html",{
                         "slug": slug
                     });
                 }).catch((err)=>{
                     res.render("add_prod.html",{
                         "slug": "not-found"
                     });
                 })
            })

        }
    })
})
//removes the prod
app.post("/remove_item",verifyToken,(req,res)=>{
    let token = req.token;

    if (req.body.prod_id){
        jwt.verify(token,"secret",(err,data)=>{
            if (err){
                res.sendStatus(403);
            }
            else{
                farmManager.remove_item(req.body.prod_id,data.id).then((results)=>{
                    res.sendStatus(200);
                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }
        })
    }
    else{
        res.sendStatus(403);
    }
})



//manages the stock of the prod 
app.get("/stocks/:id",better_verify,(req,res)=>{
    let user_data = req.user_data;
    farmManager.id_to_farmer_slug(user_data.id).then((slug)=>{
        res.render("stocks.html",{
            "slug":slug
        });
    }).catch((err)=>{
        res.render("stocks.html",{
            "slug": "not-found"
        })
    })
    
})


app.post("/parse_cats",(req,res)=>{
    console.log(req.body.parent);
    if (parseInt(req.body.parent)>=0)
    {
        farmManager.parse_cats(req.body.parent).then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        console.log("Nu e ema ")
        res.sendStatus(500);
    }
})

app.post("/get_cats_all",(req,res)=>{
  
            farmManager.get_cats_all().then((response)=>{
                
                res.send(response);
            }).catch((err)=>{
                res.sendStatus(500);
            })       
        
})


app.get("/add_prod/:id(\\d+)",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(404);
        }
        else{
            farmManager.id_to_farmer_slug(data.id).then((slug)=>{
                //its ok
                 res.render("add_prod.html",{
                     "slug": slug
                 });
             }).catch((err)=>{
                res.render("add_prod.html",{
                    "slug": "not-found"
                });
             })
        }
    })
})



//remove product image 
app.post("/remove_image",verifyToken,(req,res)=>{
    let token = req.token;
    if (req.body.prod_id && req.body.img_id)
    {
        jwt.verify(token,"secret",(err,data)=>{
            if (err){
                res.sendStatus(403);
            }
            else{
                farmManager.is_this_my_prod(req.body.prod_id,data.id).then((reponse)=>{
                    if (reponse){
                        //remove 
                        console.log("remove");
                        farmManager.remove_image(req.body.prod_id,req.body.img_id).then((reponse)=>{
                            res.sendStatus(200);
                        }).catch((err)=>{
                            res.sendStatus(500);
                        })
                    }   
                    else{
                        res.sendStatus(403);
                    }
                }).catch((err)=>{
                    console.log(err);
                    res.sendStatus(500);
                })
            }
        })
    }
    else{
        res.sendStatus(403);
    }
})
//get ALL product images 
app.post("/get_all_images",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(404);
        }
        else{
            //parse the images 
            if (req.body.prod_id){
            farmManager.is_this_my_prod(req.body.prod_id,data.id).then((reponse)=>{
                if (reponse)
                {
                    //this is ok
                    farmManager.get_all_prods_images(data.id,req.body.prod_id).then((response)=>{
                        res.send(response);
                    }).catch((err)=>{
                        res.sendStatus(500);
                    })
                }
                else{
                    res.sendStatus(403);
                }
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
            else{
                res.sendStatus(500);
            }
        }
    })
})

app.post("/add_prod",better_verify,(req,res)=>{
               let data = req.user_data;
            console.log(req.body);

            farmManager.validate_prod_data(req.body,data.id).then((response)=>{
                    console.log(response);

                if (Object.keys(response.err).length==0){
                    //ok insert
                    req.body.wpoints = response.resp_data.good_points;
                    req.body.categorie = response.resp_data.cat_id;

                    farmManager.insert_prod(req.body,data.id,req.body.image_order,fs).then((response)=>{
                        farmManager.get_prod_count_for_user(data.id).then((response)=>{
                            console.log(response);
                            if (response.length==0 || response[0].total == 1 || response[0].total == 0)
                            {
                                res.send({"redirect":true});
                            }
                            else{
                                res.sendStatus(200);
                            }
                        }).catch((err)=>{
                            res.sendStatus(200);
                        })
                        
                    }).catch((err)=>{      
                        if (err == "images")        
                        res.send({"main_err":"Eroare la uploadarea imaginii!"});
                        else if (err ==  "stocks")
                        res.send({"main_err":"Eroare la uploadarea stocurilor!"});
                        res.sendStatus(500);
                    })
                   
                }
                else{
                    res.send(response.err);
                }
            }).catch((err)=>{
                //server error
                console.log(err);
                res.sendStatus(500);
            })       
   
})

app.post("/get_user_data",better_verify,(req,res)=>{
    let user_data = req.user_data;

    Promise.allSettled([userManager.get_real_name_promise(user_data.id), userManager.get_user_contact_info(user_data.id)]).then((response)=>{
        res.send({
            "real_name": response[0].value ? response[0].value : "",
            "contact_data": response[1].value ? response[1].value : ""
        })
    })
})

app.post('/cui_search',better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type == 0)
    {   
        if (req.body.cui && farmManager.valid_cui(req.body.cui.trim())){
            farmManager.get_cui_data(req.body.cui).then((response)=>{
                res.send(response);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }   
        else{
            res.send({"err":"Te rugăm să introduci un CUI valid!"});
        }
    }
    else{
        res.sendStatus(403);
    }
})

app.post("/upload_farmer_form",[better_verify,kyc_upload.fields([
    {
        name: "id_card",
        maxCount: 1
    },
    {
        name: "cert",
        maxCount: 1
    },
    {
        name: "avize[]",
        maxCount: 10
    }
    
])],(req,res)=>{
    let user_data = req.user_data;

    //firstly we check if this user currently has any requests pending 
    admin_manager.is_req_farmer_spam(user_data.id).then((response)=>{
        if (response)
        {
            //
            res.send({"general":"Deja ai trimis o cerere!"});
        }
        else{
            admin_manager.get_unique_request_id().then((request_id)=>{
                console.log(request_id);
                //insert the files 
                let files_promises = [];
                let desc = {};
                if (req.files.id_card){
                    
                    files_promises.push(aes.saveFile(aes.encrypt_file(req.files['id_card'][0].buffer),"./ids/"+request_id+".frv"))
                }
                if (req.files.cert){
                    files_promises.push(aes.saveFile(aes.encrypt_file(req.files['cert'][0].buffer),"./certs/"+request_id+".frv"))
                }
                console.log(req.files);
                if (req.files["avize[]"])
                {
                    console.log("Fisiere");
                    let d = JSON.parse(req.body["details"]);
                    req.files["avize[]"].map((file,index)=>{
                        console.log(file);
                        desc[`${request_id}--${index}`] = d[file.originalname];
                        files_promises.push(aes.saveFile(aes.encrypt_file(file.buffer),"./avize_pics/"+request_id+"--"+index+".frv"))
        
                    })
                }
        
                console.log(desc);
                Promise.allSettled(files_promises).then((response)=>{
                    console.log(response);
                    let ok = true;
                    response.map(resp=>{
                        if (resp.status!="fulfilled")
                        ok = false;
                    })
        
                    if (ok){
                        //insert to db 
                        //insert the details
                        admin_manager.insert_avize_details(desc).then(()=>{
                            //now let's insert into the db 
                            admin_manager.insert_farmer_request_data(req.body,request_id,user_data.id).then(()=>{
                                
                                //reset the jwt with new data , then refresh the page 
                                let token = jwt.sign({"id":user_data.id,"acc_type": 1,"username": user_data.username},"secret");
                                //add jwt to cookie
                                //sexpires in 30 mins
                                res.cookie("auth",token,{maxAge: 1000*60*300});
                                res.sendStatus(200);
                            }).catch((err)=>{
                                res.sendStatus(500);
                            })
                        }).catch((err)=>{
                            res.sendStatus(500);
                        })
                    }
        
                    else{
        
                        res.sendStatus(500);
                    }
                })
        
            }).catch((err)=>{
                console.log(err);
                console.log("Eroare mare ");
                res.sendStatus(500);
            })
        }
    }).catch((err)=>{
        res.sendStatus(500);
    })
  
})

app.post("/upload_b2b_form",[better_verify,kyc_upload.fields([ 
    {
        name: "cert",
        maxCount: 1
    }
    
])],(req,res)=>{

    let user_data = req.user_data;


    admin_manager.is_b2b_farmer_spam(user_data.id).then((response)=>{
        if (response)
        {
            res.send({"general":"Deja ai trimis o cerere!"})
        }
        else{
  
            admin_manager.get_unique_request_id().then((request_id)=>{
                console.log(request_id);
                //insert the files 
                let files_promises = [];
                let desc = {};
              
                if (req.files.cert){
                    files_promises.push(aes.saveFile(aes.encrypt_file(req.files['cert'][0].buffer),"./certs/"+request_id+".frv"))
                }
        
        
                Promise.allSettled(files_promises).then((response)=>{
                    console.log(response);
                    let ok = true;
                    response.map(resp=>{
                        if (resp.status!="fulfilled")
                        ok = false;
                    })
        
                    if (ok){
                     
                            admin_manager.insert_b2b_request_data(req.body,request_id,user_data.id).then(()=>{
                            
                                res.sendStatus(200);
                            }).catch((err)=>{
                                res.sendStatus(500);
                            })
                     
                    }
        
                    else{
        
                        res.sendStatus(500);
                    }
                })
        
            }).catch((err)=>{
                console.log(err);
                console.log("Eroare mare ");
                res.sendStatus(500);
            })
        }
    }).catch((err)=>{
        res.sendStatus(500);
    })
  
})



app.post("/upload_preview_prod_image",[better_verify,preview_upload.array("prodImages")],(req,res)=>{
    let data = req.user_data;
    //now that the files are uploaded, we can send the path 
    let paths = [];
    console.log(req.files);
    for (index in req.files){
        paths.push(req.files[index].filename);
    }
    res.send(paths);
})
app.post("/remove_preview_prod_image",better_verify,(req,res)=>{
    let data = req.user_data;
    //check if the images is one of the user's 
   console.log(req.body.path);
   if (req.body.path){
        if (req.body.path.startsWith(data.id+"-"))
        {
            //its ok,remove 
            fs.unlinkSync("./previews/"+req.body.path);
            res.sendStatus(200);
        }
        else{
            res.sendStatus(403);
        }
   }
   else{
       res.sendStatus(500);
   }
})
app.post("/get_stocks",better_verify,(req,res)=>{
    let data  = req.user_data;

    //is this my prod 
    //TODO  
    console.log(req.body);
    farmManager.get_stocks(req.body.prod_id).then((response)=>{
        res.send(response);
    }).catch((err)=>{
        console.log(err);
        res.sendStatus(500);
    })

})

app.post("/update_prod_data",better_verify,(req,res)=>{
    let data = req.user_data;
    //is this my prod 
    //TODO
    //now we get the stocks only for test 
    console.log(req.body.wpoints);
    farmManager.update_prod_data(req.body,data.id).then((result)=>{
        res.sendStatus(200);
    }).catch((err)=>{
        console.log(err);
        res.sendStatus(500);
    })
})

app.post("/get_data_for_prod",better_verify,(req,res)=>{
    //is this my prod
    //TODO
    let data  = req.user_data;
    if (req.body.prod_id){
    farmManager.get_prod_id_data(data.id,req.body.prod_id).then((results)=>{
        res.send(results);
    }).catch((status)=>{
        res.sendStatus(status);
    })
    }
    else
    res.sendStatus(404);
})

app.post("/upload_prod_image",[better_verify,upload.array("prodImages")],(req,res)=>{
    //we have the data, now lets upload the files
    let data = req.user_data; 
    if (req.body.prod_id){
        farmManager.is_this_my_prod(req.body.prod_id,data.id).then((reponse)=>{

            farmManager.upload_files_for_prod(req.body.prod_id,req.files).then((reponse)=>{
                res.sendStatus(200);
            }).catch((err)=>{
                res.sendStatus(500);
            })

        }).catch((err)=>{
            console.log(err);
            res.sendStatus(403);
        })
    }
    else
    {
        res.sendStatus(500);
    }
})
app.post("/update_image_order",better_verify,(req,res)=>{
    let data = req.user_data;

    if (req.body.data && req.body.prod_id){
        farmManager.update_order(req.body.prod_id,req.body.data).then((results)=>{
            
            res.sendStatus(200);
        }).catch((err)=>{
            console.log(err);
            res.sendStatus(404);
        })
    }   
    else{
        res.sendStatus(500);
    }
})
//get workpoints 
app.post("/get_workp",verifyToken,(req,res)=>{
    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(404);
        }
        else{
            farmManager.get_workp(data.id).then((response)=>{
                //send the resp
                res.send(response);
            }).catch((why)=>{
                res.send({"err":"Server"})
            })
        }
    })
})
//search workp
app.post("/search_workp",verifyToken,(req,res)=>{
    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(404);

        }
        else{
            //search 
            farmManager.search_workp(req.body.user_in,data.id).then((points_result)=>{
                res.send(points_result);
            }).catch((err)=>{
                console.log(err);
                res.sendStatus(500);
            })
        }
    })
})
//end add prod
//end farm admin

//Working points page

app.get("/wpoints",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(403);
        }
        else{
            farmManager.id_to_farmer_slug(data.id).then((slug)=>{
                res.render("add_point.html",{
                    "slug":slug
                });
            }).catch((err)=>{
                res.render("add_point.html",{
                    "slug":"not-found" 
                });    
            })
        }
    })
})


app.get("/edit_point/:id(\\d+)",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type == 1)
    {
        farmManager.is_this_my_point_id(req.params.id,user_data.id).then((response)=>{
            farmManager.get_point_data(req.params.id).then((response)=>{
                if (response.length!=0)
                {
                    res.render("edit_point.html",{
                        "point_name": response[0].point_name.trim(),
                        "oras": response[0].oras.trim(),
                        "judet": response[0].judet.trim(),
                        "lat": response[0].lat.trim(),
                        "lng": response[0].lng.trim(),
                        "adresa": response[0].adresa.trim(),
                        "nr": response[0].nr.trim(),
                        "cod": response[0].cod.trim(),
                        "id": response[0].id
                    });
                }
                else
                {
                    res.sendStatus(500);
                }
            }).catch((Err)=>{
                console.log(Err);
                res.sendStatus(500);
            })
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(500);
    }
})

app.get("/view_points",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if(err){
            res.sendStatus(403);
        }
        else{
            farmManager.id_to_farmer_slug(data.id).then((slug)=>{
                res.render("view_wpoints.html",{
                    "slug": slug
                });
            }).catch((err)=>{
                res.render("view_wpoints.html",{
                    "slug": "not-found"
                });
            })
            
        }
    })
})

app.get("/view_point_prods/:id",better_verify,(req,res)=>{
    if (req.params.id)
    {
        
        let user_data = req.user_data;
        //check if this is my prod 
        if (user_data.acc_type == 1)
        {
                farmManager.is_this_my_point_id(req.params.id,user_data.id).then(()=>{
                       // console.log("this is")
                    farmManager.id_to_farmer_slug(user_data.id).then((response)=>{
                        res.render("prods_point.html",{
                            "slug": slug,
                            "point_id": req.params.id
                        });
                    }).catch((err)=>{
                        res.render("prods_point.html",{
                            "slug": "not-found",
                            "point_id": req.params.id
                        });
                    })
                    

                }).catch((err)=>{
                    console.log(err);
                    res.sendStatus(403);
                })
        }
        else{
            res.sendStatus(500);
        }
    }
    else{
        res.sendStatus(500);
    }
})

app.post("/get_prods_point",better_verify,(req,res)=>{
    let user_data = req.user_data;

    if (user_data.acc_type==1 && req.body.point_id)
    {
        farmManager.is_this_my_point_id(req.body.point_id,user_data.id).then(()=>{

            //get the prods 
            farmManager.get_all_point_prods(req.body.point_id,user_data.id).then((response)=>{
                res.send(response);
            }).catch((err)=>{
                res.sendStatus(500);
            })

        }).catch((err)=>{
            res.sendStatus(403);
        })
    }
    else{
        res.sendStatus(500);
    }
})
//end working points 




//register PART 
app.get("/register",verifyToken,(req,res)=>
{
    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        res.render("register_good.html",{"csrf_token":req.csrfToken,"login":err ? true : false})
    })
    
})


app.post("/register",(req,res)=>{
    
    userManager.insert_user(req.body,process.env.HASH_PASS,otp).then((resp)=>{
        
        if (resp?.id)
        {
            console.log(resp);
            //login the user 
            let token = jwt.sign({"id": resp.id,"acc_type":0,"username": req.body.name.trim()},"secret");
            //add jwt to cookie
            //sexpires in 30 mins
            res.cookie("auth",token,{maxAge: 1000*60*300});

            res.send({"status":"ok"});
        }
        else
        res.send({"status":"nok","errors":resp});
}).catch((err)=>{
    console.log(err);
    res.sendStatus(404);
})    

})
    
app.get("/login", (req,res)=>
{
    res.render("login_good.html",{"csrf_token":req.csrfToken});
})

app.get("/admin_login",(req,res)=>{
    res.render("admin_login.html",{"csrf_token":req.csrfToken});
})
    
app.post("/login_admin",(req,res)=>{
    if (req.body.name && req.body.pass)
    {   
       // console.log(crypto.createHmac("sha256",process.env.HASH_PASS).update(req.body.pass).digest("hex"));
        admin_manager.login_admin(req.body.name, crypto.createHmac("sha256",process.env.HASH_PASS).update(req.body.pass).digest("hex") ).then((user_id)=>{
            let token = jwt.sign({"id":user_id,"admin":1},"secret_admin");
            //add jwt to cookie
            //sexpires in 30 mins
            res.cookie("auth_admin",token,{maxAge: 1000*60*30});
            console.log("lo")
            res.send({});

        }).catch((err)=>{
            console.log("aici")
            res.send({"err":"Datele introduse sunt incorecte!"});
        })
    }
    else{
        console.log("aivci")
        res.sendStatus(500);
    }
})
app.post("/login",(req,res)=>{

    userManager.login_user(req.body).then( async (result)=>{
        if (result.length==1)
        {
            let has_auth = await userManager.has_auth(req.body.name);
        
            if (has_auth === ""){
                //server error
                res.send({"err":"Eroare de server! Te rugăm să încerci mai târziu!"})
            }
            else if (has_auth==0){
                //we can set the jwt 
                            //set jwt 
            let id = result[0].id;
            let acc_type = result[0].account_type;
            let username = result[0].username;
            //encrypt the data contained by this jwt
            let token = jwt.sign({"name":aes.encrypt(process.env.JWT_SALT+req.body.name,crypto,process),"id":id,"acc_type":acc_type,"username":username},"secret");
            //add jwt to cookie
            //sexpires in 30 mins
            res.cookie("auth",token,{maxAge: 1000*60*300});
            //do redirects
            if (acc_type == 0 || acc_type == 2)
            {
                res.send({"status":"ok","link":"/dashboard"});
            }    
            else if(acc_type == 1){
                res.send({"status":"ok","link": "/dashboard"});
            }               
            }
            else 
            {
                //user has auth enabled, check for totp code 
                if (req.body.code!=null && req.body.code.trim()!=""){
                    //verify 
                    try{
                    if(otp.totp.verify({
                        secret: await userManager.get_auth_token(req.body.name),
                        encoding: "base32",
                        token: req.body.code,
                    }))
                    {
                        
                        //verify is ok,we can set the jwt
                         console.log(req.body.name);
                        //set jwt 
                    //encrypt the data contained by this jwt
                    
                    let id = result[0].id;
                    let acc_type = result[0].account_type;
                    let username = result[0].username;
                    let token = jwt.sign({"name":aes.encrypt(process.env.JWT_SALT+req.body.name,crypto,process),"id":id,"acc_type":acc_type,"username":username},"secret");
                    //add jwt to cookie
                    //sexpires in 30 mins
                    res.cookie("auth",token,{maxAge: 1000*60*300});
                    //send the redirect 
                        if (acc_type == 0 || acc_type == 2)
                        {
                            res.send({"status":"ok","link": "/dashboard"});
                        }    
                        else if(acc_type == 1){
                            res.send({"status":"ok","link": "/dashboard"});
                        }
                    }
                    else{
                        //wrong code 
                        res.send({"err":"wc"});
                    }
                }
                catch(e)
                {
                    console.log(e);
                    res.send({"err":"Eroare de server! Te rugăm să încerci mai târziu!"});
                }
                }
                else{
                    res.send({"err":"2fa"});
                }
            }

        }
        else{
            console.log("bnasol");
            res.send({"err":"Datele introduse sunt incorecte!"});
        }
     }).catch((err)=>{
         console.log(err);
         res.send({"err":err})
     })
})

app.get("/logout",(req,res)=>{
    //we clear the cookie
    req.session.destroy();

        res.clearCookie("auth");
        res.sendStatus(200);
        res.redirect("/index");
   
})



//ONLY FOR TESTING,DELETE WHEN LIVE 
app.get("/secret",verifyToken,(req,res)=>{
    let token = req.token;
    //now we validate the jwt 
    jwt.verify(token,"secret",async function(err,data){
        if (err){
            res.sendStatus(403);
        }
        else{

            res.render("profile.html",{"real_name":await userManager.get_real_name(data.id),
        "g_auth": await userManager.get_auth(aes.decrypt(data.name,crypto,process)),
        "csrf_token": req.csrfToken
        })
        }
    })
})

app.post("/change_auth",verifyToken,(req,res)=>{
    let token = req.token;
    let code = req.body.code;
    let auth_token = req.body.token;
    jwt.verify(token,"secret", async function(err,data){
        if (err){
            res.sendStatus(403);

        }
        else{
            if (await userManager.get_auth(aes.decrypt(data.name,crypto,process))=="checked"){
                //this means that the user has google auth active, then deactivate 
               
                res.send(await userManager.change_auth(aes.decrypt(data.name,crypto,process)));
                
            }
            else{
                if (code!=null && auth_token!=null && code.trim()!=""){
                    //we have a code, check if is ok and then change the auth
                    console.log(auth_token);
                    console.log(code); 
                    
                    console.log(data.id);   
                    if (otp.totp.verify({
                        secret: auth_token.trim(),
                        encoding: 'base32',
                        token: code.trim(),
                    })){
                        //change the auth 
                        await userManager.change_auth(aes.decrypt(data.name,crypto,process))
                        res.send({"code":"ok"})
                    }
                    else
                    {
                        res.send({'code':'nok'})
                    }
                    
                }
                else
                {
                    //response with otp link
                    
                    res.send({"status":"pending","link":await userManager.generate_auth_code(aes.decrypt(data.name,crypto,process),otp,query_string)})
                }
                
            }
        }
    })
})
//chat helpers
app.post("/chat_upload",[better_verify,chat_upload.single('chat_image')],(req,res,next)=>{
        if (req.file_error){
            res.send({"error":"Only images are supported!"})
        }
        else{
            //compress 
            sharp("chat_uploads/"+req.file.filename)
            .flatten({ background: { r: 255, g: 255, b: 255 } }) 
            .png({ quality: 10 }).
                jpeg({quality: 10})
                .toFile(
                   "chat_uploads/compressed-"+req.file.filename
                ).then((response)=>{
                    res.send({"filename":"compressed-"+req.file.filename});
                    fs.unlink("chat_uploads/"+req.file.filename,(err)=>{
                        
                    })
                }).catch((err)=>{
                    res.send({"filename":req.file.filename});

                })
        }
})
app.post("/get_username",better_verify,(req,res)=>{
    if (req.body.user_id){
        userManager.get_username(req.body.user_id).then((response)=>{
            if (response.length!=0)
            res.send({"username":response[0].username});
            else
            res.sendStatus(500);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else
    res.sendStatus(500);
})
//end chat 

//become farmer 

app.get("/become_farmer",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type == 0){
        res.render("become_farmer.html");
    }
    else{
        res.sendStatus(403);
    }
})

app.get("/become_b2b",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type == 0){
        res.render("become_b2b.html");
    }
    else{
        res.sendStatus(403);
    } 
})
    //design test
    app.get("/design",(req,res)=>{
        res.render("design.html");
    })


    //admin part 
    app.get("/b2b_requests",admin_verify,(req,res)=>{
        res.render("b2b_requests.html");
    })

    app.post("/get_b2b_reqs",admin_verify,(req,res)=>{
        admin_manager.get_b_reqs().then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    })

    app.post("/update_b2b_req",admin_verify,(req,res)=>{
        admin_manager.update_b2b_req_data(req.body.data,req.body.req_id).then((response)=>{
            res.sendStatus(200);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    })

    app.post("/get_b2b_cert",admin_verify,(req,res)=>{
        if (req.body.req_id){
            admin_manager.get_un_id_b2b(req.body.req_id).then((response)=>{

                let data =  fs.readFileSync('./certs/'+response+'.frv');
               
                data = decrypt_file(data);
                
                //console.log(data.toString("base64"));
                  res.send("data:image/png;base64, "+data.toString("base64")); 

            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
        else{
            res.sendStatus(500);
        }
    })

    app.post("/accept_b2b_req",admin_verify,(req,res)=>{
        admin_manager.accept_b2b_req(req.body.req_id).then(()=>{
            res.sendStatus(200);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    })
    app.post("/decline_b2b_req",admin_verify,(req,res)=>{
        admin_manager.decline_b2b_req(req.body.req_id).then(()=>{
            res.sendStatus(200);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    })

    app.get("/farmer_requests",admin_verify,(req,res)=>{
        res.render("admin_f_requests.html")
    })

    app.post("/get_reqs",admin_verify,(req,res)=>{
        admin_manager.get_f_reqs().then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    })

    app.post("/get_buletin",admin_verify,(req,res)=>{
        if (req.body.req_id){
            admin_manager.get_un_id(req.body.req_id).then((response)=>{

                let data =  fs.readFileSync('./ids/'+response+'.frv');

                data = decrypt_file(data);
                
                //console.log(data.toString("base64"));
                  res.send("data:image/png;base64, "+data.toString("base64")); 

            }).catch((err)=>{
                res.sendStatus(500);
            })
        }

    })

    app.post("/get_cert",admin_verify,(req,res)=>{
        if (req.body.req_id){
            admin_manager.get_un_id(req.body.req_id).then((response)=>{

                let data =  fs.readFileSync('./certs/'+response+'.frv');
               
                data = decrypt_file(data);
                
                //console.log(data.toString("base64"));
                  res.send("data:image/png;base64, "+data.toString("base64")); 

            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
        else{
            res.sendStatus(500);
        }
    })

    app.post('/get_avize',admin_verify,(req,res)=>{
        if (req.body.req_id){
            admin_manager.get_un_id(req.body.req_id).then((response)=>{
              
                admin_manager.get_all_avize(response).then((response)=>{
                    let response_data =[];  
                        
                    response.map(resp=>{
                        let file_read = fs.readFileSync('./avize_pics/'+resp.file_name+".frv");

                        let dec = decrypt_file(file_read);
                      
                        response_data.push({
                            file: "data:image/jpg;base64, "+dec.toString("base64"),
                            det: resp.det
                        })
                        
                    })
                    res.send(response_data);
                }).catch((err)=>{
                    res.sendStatus(500);
                })

            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
        else{
            res.sendStatus(500);
        }
    })

    app.post("/update_farmer_req",admin_verify,(req,res)=>{
        admin_manager.update_farmer_req_data(req.body.data,req.body.req_id).then((response)=>{
            res.sendStatus(200);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    })

    app.post("/accept_req",admin_verify,(req,res)=>{
        admin_manager.accept_req(req.body.req_id).then(()=>{
            admin_manager.get_name_from_req(req.body.req_id).then((user_data)=>{
                console.log(user_data);
//send mail 
let mailOpts = {
    from: 'no-reply@farmvio.com',
    to: user_data.email,
    subject: "Testing the new addr",
    html: `
    <!DOCTYPE html>
    <html>
    <head>
    <title></title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <style type="text/css">
        /* FONTS */
        @import url('https://fonts.googleapis.com/css?family=Poppins:100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i');
    
        /* CLIENT-SPECIFIC STYLES */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; }
    
        /* RESET STYLES */
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    
        /* iOS BLUE LINKS */
        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }
    
        /* MOBILE STYLES */
        @media screen and (max-width:600px){
            h1 {
                font-size: 32px !important;
                line-height: 32px !important;
            }
        }
    
        /* ANDROID CENTER FIX */
        div[style*="margin: 16px 0;"] { margin: 0 !important; }
    </style>
    </head>
    <body style="background-color: #f3f5f7; margin: 0 !important; padding: 0 !important;">
    
    <!-- HIDDEN PREHEADER TEXT -->
    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Poppins', sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        We're thrilled to have you here! Get ready to dive into your new account.
    </div>
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <!-- LOGO -->
        <tr>
            <td align="center">
                <!--[if (gte mso 9)|(IE)]>
                <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                <tr>
                <td align="center" valign="top" width="600">
                <![endif]-->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" valign="top" style="padding: 40px 10px 10px 10px;">
                            <a href="#" target="_blank" style="text-decoration: none;">
                                <span style="display: block; font-family: 'Poppins', sans-serif; color: #3e8ef7; font-size: 36px;" border="0"><b>Riday Admin</b> admin</span>
                            </a>
                        </td>
                    </tr>
                </table>
                <!--[if (gte mso 9)|(IE)]>
                </td>
                </tr>
                </table>
                <![endif]-->
            </td>
        </tr>
        <!-- HERO -->
        <tr>
            <td align="center" style="padding: 0px 10px 0px 10px;">
                <!--[if (gte mso 9)|(IE)]>
                <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                <tr>
                <td align="center" valign="top" width="600">
                <![endif]-->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Poppins', sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 2px; line-height: 48px;">
                          <h1 style="font-size: 36px; font-weight: 600; margin: 0;">Salut, ${user_data.nume}  ${user_data.prenume}</h1>
                        </td>
                    </tr>
                </table>
                <!--[if (gte mso 9)|(IE)]>
                </td>
                </tr>
                </table>
                <![endif]-->
            </td>
        </tr>
        <!-- COPY BLOCK -->
        <tr>
            <td align="center" style="padding: 0px 10px 0px 10px;">
                <!--[if (gte mso 9)|(IE)]>
                <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                <tr>
                <td align="center" valign="top" width="600">
                <![endif]-->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                  <!-- COPY -->
                  <tr>
                    <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 20px 30px; color: #666666; font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 400; line-height: 25px;">
                      <p style="margin: 0;">Felicitari ! Esti fermier</p>
                    </td>
                  </tr>
                  <!-- BULLETPROOF BUTTON -->
                  <tr>
                    <td bgcolor="#ffffff" align="left">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td bgcolor="#ffffff" align="center" style="padding: 20px 30px 30px 30px;">
                            <table border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                  <td align="center" style="border-radius: 3px;" bgcolor="#17b3a3"><span  style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; color: #ffffff; text-decoration: none; padding: 12px 50px; border-radius: 2px; border: 1px solid #17b3a3; display: inline-block;"></span></td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- COPY -->
                  <tr>
                    <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 0px 30px; color: #666666; font-family: &apos;Lato&apos;, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 25px;">
                      <p style="margin: 0;">If that doesn't work, copy and paste the following link in your browser:</p>
                    </td>
                  </tr>
                  <!-- COPY -->
                    <tr>
                      <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 20px 30px; color: #666666; font-family: &apos;Lato&apos;, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 400; line-height: 25px;">
                        <p style="margin: 0;"><a href="http://thetheme.io" target="_blank" style="color: #17b3a3;">XXX.XXXXXXX.XXX/XXXXXXXXXXXXX</a></p>
                      </td>
                    </tr>
                  <!-- COPY -->
                  <tr>
                    <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 20px 30px; color: #666666; font-family: &apos;Lato&apos;, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 25px;">
                      <p style="margin: 0;">If you have any questions, just reply to this email—we're always happy to help out.</p>
                    </td>
                  </tr>
                  <!-- COPY -->
                  <tr>
                    <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 0px 0px; color: #666666; font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 400; line-height: 25px;">
                      <p style="margin: 0;">Cheers,<br>Team</p>
                    </td>
                  </tr>
                </table>
                <!--[if (gte mso 9)|(IE)]>
                </td>
                </tr>
                </table>
                <![endif]-->
            </td>
        </tr>

    </table>
    
    </body>
    </html>
    `
}
let body = {};
body.phone = user_data.tel;
body.shortTextMessage = "Felicitari! Esti fermier ";

                    axios.post("https://www.smsadvert.ro/api/sms/",
                    body,{
                        headers:
                        {
                            "Content-Type": "application/json",
                            "Authorization":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MTU1NmZmMTRiN2MxYzAwMDRjYWY0NmYifQ.wbOZEFZMpikAddf63sWBhppdP-uhk3GeJkRAMp4y6O8"

                        }
                    }).catch((err)=>{
                        console.log(err);
                    })
            transporter.sendMail(mailOpts,function(error,info){
                if (error){
                
                    res.send({"err":"Mailul nu s-a putut trimite!"})
                }
                else{
                    console.log("trimis");
                    res.sendStatus(200);
                }
                
            })
            }).catch((err)=>{
                console.log(err);
                res.send({"err":"Mailul nu s-a putut trimite!"})
            })
            
        }).catch((err)=>{
            res.sendStatus(500);
        })
    })

    app.post("/decline_req",admin_verify,(req,res)=>{
        admin_manager.decline_req(req.body.req_id).then(()=>{
            res.sendStatus(200);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    })

    app.get("/admin_b2b_orders",admin_verify,(req,res)=>{
        res.render("admin_b2b_orders.html");
    })
    
    app.post("/admin_b2b_orders",admin_verify,(req,res)=>{

        admin_manager.get_b2b_orders().then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    })

    app.post("/get_words",admin_verify,(req,res)=>{
        let workerPool = workerHandler.get();
        //get the matching words 
        admin_manager.get_key_words(req.body.order_elem_id).then((words)=>{
            words = words[0].prod_keyw.split(",");
            let words_matches = {};
            let word_promises = [];
            words.map(word=>{
                if (word.trim()!=""){
                    word_promises.push(workerPool.find_matching_words(word));
                }   
            })

            Promise.allSettled(word_promises).then((results)=>{
                for (index in results){
                    words_matches[words[index]] = results[index].value;
                }
                res.send(words_matches);
            })

        }).catch((err)=>{   
            console.log(err);
            res.sendStatus(500);
        })
    })  

    app.post("/admin_prod_search",admin_verify,(req,res)=>{
        
        admin_manager.get_prods(req.body.words).then((results)=>{
            if (results.length!=0){
            admin_manager.order_by_distance(req.body.order_elem_id,results).then((response)=>{
                res.send(response);
            }).catch((err)=>{
                console.log(err);
            })
        }
        else{
            res.send({});
        }
        }).catch((err)=>{
            res.sendStatus(500);
        })
    })


    app.post("/send_offer",admin_verify,(req,res)=>{
        admin_manager.send_offer(req.body).then((response)=>{
            res.sendStatus(200);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    })

    app.post("/get_offers_for_prod",admin_verify,(req,res)=>{
        if (req.body.order_id && req.body.prod_id){
            admin_manager.get_prod_offers(req.body).then((response)=>{
                res.send(response);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
    })

    app.post("/admin_accept_offer_b2b",admin_verify,(req,res)=>{
        admin_manager.update_status(req.body.offer_id,2).then((response)=>{
            res.sendStatus(200);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    })

    app.post("/admin_reject_offer_b2b",admin_verify,(req,res)=>{
        admin_manager.update_status(req.body.offer_id,5).then((response)=>{
            res.sendStatus(200);
        }).catch((err)=>{
            res.sendStatus(500);
        }) 
    })

    app.post("/admin_send_new_offer_b2b",admin_verify,(req,res)=>{
        admin_manager.insert_counter_offer(req.body.offer_id,req.body.new_price,req.body.new_qty).then((response)=>{
            res.sendStatus(200);

        }).catch((err)=>{
            res.sendStatus(500);
        })
    })

    app.post("/send_offers_cid",admin_verify,(req,res)=>{
        admin_manager.get_offers_for_cid(req.body.cid).then((response)=>{
            console.log(response);
            res.send(response);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    })

    app.post("/send_direct_offer_b2b",admin_verify,(req,res)=>{
        admin_manager.send_direct_offer(req.body).then((response)=>{
            res.sendStatus(200);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    })

    app.post("/get_final_bids",(req,res)=>{
        if (req.body.order_id){
            b2bManager.get_final_bids(req.body.order_id).then((response)=>{
                res.send(response);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
        else
        res.sendStatus(500);
    })

    app.post("/send_final_b2b_offer",(req,res)=>{

        b2bManager.insert_last_bid(req.body.order_id,req.body.bids,req.body.pret_comanda,req.body.pret_transport,req.body.comision).then((response)=>{
            b2bManager.update_order_status(req.body.order_id,1).then(()=>{
                res.sendStatus(200);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }).catch((err)=>{
            res.sendStatus(500);
        })

    })

    app.post("/get_final_offer_client",better_verify,(req,res)=>{
        let user_data = req.user_data;

        if (req.body.order_id){
            b2bManager.is_this_my_order(user_data.id,req.body.order_id).then((response)=>{
                if (response){
                    b2bManager.parse_final_offers(req.body.order_id).then((response)=>{
                        res.send(response);
                    }).catch((err)=>{
                        res.sendStatus(500);
                    })
                }
                else
                {
                    res.sendStatus(403);
                }
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
        else{
            res.sendStatus(403);
        }
    })


    app.post("/b2b_get_costs",better_verify,(req,res)=>{
        let user_data = req.user_data;
        if (user_data.acc_type == 2 && req.body.order_id){
            b2bManager.is_this_my_order(user_data.id,req.body.order_id).then((response)=>{
                if (response){
                    b2bManager.get_costs(req.body.order_id).then((results)=>{
                        res.send(results);
                    }).catch((err)=>{
                        res.sendStatus(500);
                    })
                }
                else{
                    res.sendStatus(403);
                }
            }).catch((err)=>{
                res.sendStatus(403);
            })
        }
        else{
            res.sendStatus(403);
        }   
    })

    app.post("/accept_b2b_final_order",better_verify,(req,res)=>{
        let user_data = req.user_data;
        if (user_data.acc_type == 2 && req.body.order_id){
            b2bManager.is_this_my_order(user_data.id,req.body.order_id).then((response)=>{
                if (response){
                    b2bManager.update_order_status(req.body.order_id,2).then(()=>{
                        res.sendStatus(200);
                    }).catch((err)=>{
                        res.sendStatus(500);
                    })
                }
                else{
                    res.sendStatus(403);
                }
            }).catch((err)=>{
                res.sendStatus(403);
            })
        }
        else{
            res.sendStatus(403);
        }
    })

    app.post("/decline_b2b_final_order",better_verify,(req,res)=>{
        let user_data = req.user_data;
        if (user_data.acc_type == 2 && req.body.order_id){
            b2bManager.is_this_my_order(user_data.id,req.body.order_id).then((response)=>{
                if (response){
                    b2bManager.update_order_status(req.body.order_id,3).then(()=>{
                        res.sendStatus(200);
                    }).catch((err)=>{
                        res.sendStatus(500);
                    })
                }
                else{
                    res.sendStatus(403);
                }
            }).catch((err)=>{
                res.sendStatus(403);
            })
        }
        else{
            res.sendStatus(403);
        }
    })
    
    app.get("/avize",admin_verify,(req,res)=>{
        res.render("avize.html");
    })

    app.post("/get_farmers",admin_verify,(req,res)=>{
        admin_manager.get_farmers().then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.send({});
        })
    })

    app.post("/admin_get_avize",admin_verify,(req,res)=>{
        admin_manager.get_avize(req.body.farmer_id).then((results)=>{
            res.send(results);
        }).catch((err)=>{
            res.send({});
        })
    })

    app.post("/add_aviz",admin_verify,(req,res)=>{
        admin_manager.add_aviz(req.body.farmer_id,req.body.nume).then((id)=>{
            console.log(id);
            res.send({"id":id});
        }).catch((err)=>{
            res.sendStatus(500);
        })
    })

    app.post("/remove_aviz",admin_verify,(req,res)=>{
        admin_manager.remove_aviz(req.body.a_id).then(()=>{
            res.sendStatus(200);
        }).catch(()=>{
            res.sendStatus(500);
        })
    })

    app.get("/admin_users",admin_verify,(req,res)=>{
        res.render("admin_users.html");
    })

    app.post("/admin_get_users",admin_verify,(req,res)=>{

        //build where clauses 
        console.log(req.body);
        admin_manager.get_users(req.body.start,req.body.length,req.body.columns).then((response)=>{
                console.log(response.total);
            res.send({
                "draw":req.body.draw,
            "iTotalDisplayRecords": response.total,
            "iTotalRecords": response.results.length,"data":response.results});

        }).catch((err)=>{
            res.sendStatus(500);
        })
       
    })

    app.post("/admin_get_user_infos",admin_verify,(req,res)=>{
        if (req.body.user_id){
            let user_id = req.body.user_id;
            let all_user_info = admin_manager.get_user_infos(user_id);
            let real_name = userManager.get_real_name_promise(user_id);

            Promise.allSettled([all_user_info,real_name]).then((response)=>{
                if (response[0].status!= "fulfilled" || response[1].status!="fulfilled")
                {
                    res.sendStatus(500);
                }
                else{
                    res.send({"infos":response[0].value,"real_name":response[1].value})
                }
            })

        }   
        else{
            res.sendStatus(500);
        }
    })

    app.post("/admin_change_user_data",admin_verify,(req,res)=>{
        if (req.body.user_id && req.body.infos){
            //ok
            //check the data
            admin_manager.change_user_data_checker(req.body.infos,req.body.user_id).then((response)=>{
                res.sendStatus(200);
            }).catch((Err)=>{
                res.send(Err);
            })
        }
        else{
            res.sendStatus(500);
        }
    })

    app.get("/admin_cats",admin_verify,(req,res)=>{
        res.render("admin_cats.html");
    })

    
    app.post("/get_adjacent",admin_verify,(req,res)=>{
        admin_manager.get_adjacent().then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    })
    app.post("/insert_cat",admin_verify,(req,res)=>{

        if (req.body.parent >=0 && req.body.cat)
        {   
            admin_manager.insert_cat(req.body.cat,req.body.parent).then((id)=>{
                res.send({"id":id});
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }else{
            res.sendStatus(500);
        }
    })

    app.post("/delete_cat",admin_verify,(req,res)=>{
        if (req.body.cat_id)
        {
            admin_manager.delete_cat(req.body.cat_id).then(()=>{
                res.sendStatus(200);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
        else{
            res.sendStatus(500);
        }
    })

    app.post("/admin_prom",admin_verify,(req,res)=>{
        if (req.body.user_id)
        {
            admin_manager.insert_prom(req.body.user_id).then((response)=>{
                res.sendStatus(200);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
        else{
            res.sendStatus(500);
        }
    })

    app.post("/admin_del_prom",admin_verify,(req,res)=>{
        if (req.body.user_id)
        {
            admin_manager.delete_prom(req.body.user_id).then((response)=>{
                res.sendStatus(200);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
        else{
            res.sendStatus(500);
        } 
    })

    app.post("/cookie_consent",(req,res)=>{
        if (req.cookies['consent'])
        {   
            res.sendStatus(200);
        }   
        else{
            res.sendStatus(500);
        }
    })

    app.post("/accept_cookie",(req,res)=>{
        res.cookie("consent","yes",{maxAge: 1000*60*999999});
        res.sendStatus(200);
    })
    //404 PAGE MUST BE THE LAST ROUTE 
    app.get('*', function(req, res){
        res.status(404).render('error-404.html');
      });
    

function verifyToken(req,res,next){
    let cookie = req.cookies['auth'];
    
    if (typeof cookie!=="undefined"){
        req.token = cookie;
        //test for now 
        
    }

    next();

}

function better_verify(req,res,next){
    let cookie = req.cookies['auth'];
    
    if (typeof cookie!=="undefined"){
        req.token = cookie;
         jwt.verify(req.token,"secret",(err,data)=>{
             if (err){
                 res.sendStatus(403);
             }
             else{
                 req.user_data = data;
                 next();
             }
         })
    }
    else{
        res.sendStatus(403);
    }
}

function admin_verify(req,res,next)
{
    let cookie = req.cookies['auth_admin'];
    
    if (typeof cookie!=="undefined"){
        req.token = cookie;
         jwt.verify(req.token,"secret_admin",(err,data)=>{
             if (err){
                 res.sendStatus(403);
             }
             else{
                 req.user_data = data;
                 next();
             }
         })
    }
    else{
        res.sendStatus(403);
    }
}




app.listen(5000,()=>
{
    console.log("Listening on port 5000")
})