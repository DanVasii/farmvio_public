const express = require("express");
const mustache = require('mustache-express');
const static_mustache = require("mustache");
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
const log4js = require('log4js');


log4js.configure({
    appenders: { everything: { type: 'file', filename: 'logs.log' } },
    categories: { default: { appenders: ['everything'], level: 'ALL' } }
  });
  
  const logger = log4js.getLogger();

//custom libs
const aes = require("./Aes");
const templates = require("./statics");
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
const mail_sender = require("./emailSender");
const agent_manager = require("./agent_manager");


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
    let type = enc_buffer.slice(16,17);
    console.log("TYPE"+ type)

    enc_buffer = enc_buffer.slice(17,enc_buffer.length);
    //create decipher 
    let dec = crypto.createDecipheriv("aes-256-ctr",kyc_key,iv);
    let result = Buffer.concat([dec.update(enc_buffer),dec.final()]);
    return {"r":result,"type":type};
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

var test_storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {

        cb(null, './test_upload')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
    }
});

var test_upload = multer({
    storage: multer.memoryStorage()
})


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

mail_sender.init(transporter);

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
coleteManager.init(con,mysql,axios,logger);
//init b2b manager 
b2bManager.init(con,mysql);
//init product searcher 
product_searcher.init(con,mysql);
//init admin manager 
admin_manager.init(con,mysql);
//init searchers 
search.init(con,mysql);
//init agent manager 
agent_manager.init(con,mysql);
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
    res.redirect("/index");
})

//index 
app.get("/index",verifyToken,(req,res)=>{
    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        res.render("index-3.html",{
            "login": err ? true : false,
            "b2b": (!err && data.acc_type == 2) ? true : false
        });
    })
    
})

app.get("/marketplace",verifyToken,(req,res)=>{

    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{

            res.render("index-m.html",{
                "prom": response,
                "login": err ? true : false,
                "b2b": (!err && data.acc_type == 2) ? true : false
            })       
    })

})

app.get("/get_promovati",(req,res)=>{
    admin_manager.get_promovati().then((response)=>{
        res.send(response);
    }).catch((err)=>{
        res.send({});
    })
})

app.get("/b2b",verifyToken,(req,res)=>{
    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        
        res.render("b2b.html",{
            "login": err ? true : false,
            "b2b": (!err && data.acc_type == 2) ? true : false
        });
    })
    
})
app.get("/contact",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        res.render("contact.html",{
            "login": err ? true : false,
            "b2b": (!err && data.acc_type == 2) ? true : false
        });    
    })
    
})

app.post("/send_contact",(req,res)=>{
    if (req.body)
    {
        //check 
        let errs = admin_manager.check_contact_request(req.body);

        if (Object.keys(errs).length==0){
            //insert
            admin_manager.is_there_contact_form(req.body).then((response)=>{
                if (response==0)
                {
                    admin_manager.insert_contact(req.body).then(()=>{
                        res.send({});
                    }).catch((err)=>{
                        res.sendStatus(500);
                    })
                }
                else{
                    res.send({"msgSubmit":"Ai trimis deja o cerere de contact. Te rugăm să aștepți răspunsul!"});
                }
            }).catch((err)=>{
                res.send({"msgSubmit":"Ai trimis deja o cerere de contact. Te rugăm să aștepți răspunsul!"});

            })
      
        }
        else{
            res.send(errs);
        }
        
    }
    else{
        res.send({"msgSubmit":"Te rugăm să completezi formularul corect!"});
    }
})
app.get("/privacy",verifyToken,(req,res)=>{
    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        res.render("privacy.html",{
            "login": err ? true : false,
            "b2b": (!err && data.acc_type == 2) ? true : false
        });
    })
    
})
app.get("/story",verifyToken,(req,res)=>{

    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        res.render("story.html",{
            "login": err ? true : false,
            "b2b": (!err && data.acc_type == 2) ? true : false
        });
    })
    
})

app.get("/cookies",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        res.render("cookies.html",{
            "login": err ? true : false,
            "b2b": (!err && data.acc_type == 2) ? true : false
        });
    })
    
})

app.get("/fermier-farmvio",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        res.render("faq.html",{
            "login": err ? true : false,
            "b2b": (!err && data.acc_type == 2) ? true : false
        });
    })
    
})

app.post("/ask_q",(req,res)=>{
    if (req.body)
    {
        //check 
        let errs = admin_manager.check_contact_request(req.body);

        if (Object.keys(errs).length==0){
            //insert
            admin_manager.is_there_q_form(req.body).then((response)=>{
                if (response==0)
                {
                    admin_manager.insert_q(req.body).then(()=>{
                        res.send({});
                    }).catch((err)=>{
                        res.sendStatus(500);
                    })
                }
                else{
                    res.send({"msgSubmit":"Ai trimis deja o întrebare. Te rugăm să aștepți răspunsul!"});
                }
            }).catch((err)=>{
                res.send({"msgSubmit":"Ai trimis deja o întrebare. Te rugăm să aștepți răspunsul!"});

            })
        }
        else{
            res.send(errs);
        }
        
    }
    else{
        res.send({"msgSubmit":"Te rugăm să completezi formularul corect!"});
    } 
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

app.post("/search_county",(req,res)=>{
    if (req.body.search)
    {
        search.search_county_promise(req.body.search).then((results)=>{
            res.send(results);
        }).catch((err)=>{
            //error_log
            res.send({});
        })
    }   
    else{
        res.send({});
    }
})

app.post("/search_city",(req,res)=>{
    if (req.body.county && req.body.city){
        coleteManager.request_admin_token().then((token)=>{
            console.log(token);
            coleteManager.search_city(req.body.county,req.body.city,token).then((response)=>{
                res.send(response);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        if (!req.body.county || req.body.county.trim()=="")
        res.send({"err":"Te rugăm să selectezi județul!"});
        else
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


app.get("/test_marker",(req,res)=>{
    res.render("marker_test.html");
})

//get farms api 
app.post("/get_farms",(req,res)=>{

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
        farmManager.get_pagination_info(req.body.center,req.body.radius,req.body.page,req.body.cat,req.body.search).then((pages)=>{

            let sent_response = {};
            sent_response.pages = pages;

            if (parseInt(req.body.page)>pages.max_page){
           
                req.body.page = pages.max_page;

              
            }   
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
app.post("/get_display_data",verifyToken,async (req,res)=>{
    
    let token = req.token;
    let uid = "";
    let type = "frv_cookie_cart";
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            //check for cart_uid
            if (req["cookies"].cart_uid){
                uid = req["cookies"].cart_uid;
            }
        }
        else{
            if (data.acc_type == 2)
            type = "b2b_cart";
            else
            type = "frv_cart";
            uid = data.id;
        }
    })
   // console.log(uid);
    farmManager.get_sold_prods(req.body,type,uid).then((response)=>{
     
        res.send({"data":response});
    }).catch((err)=>{
        res.sendStatus(500);
    })

})

app.get("/modal_test",(req,res)=>{
    res.render("modal_test.html");
})


//product page 

app.get("/products/:farmer_slug/:product_slug",verifyToken,(req,res)=>{

    let farmer_slug = req.params.farmer_slug;
    let product_slug = req.params.product_slug;
    userManager.slug_to_user_id(farmer_slug).then((user_id)=>{
        

        shopManager.get_product_id_from_slug(product_slug,user_id).then((product_id)=>{
      
            let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{  

            let rating_promise,prod_data_promise,farmer_name,rating_data,wpoints,cart_qty;

            rating_promise = shopManager.is_user_eligible_for_rating(data?.id || -1,product_slug);
            prod_data_promise = shopManager.get_prod_data(product_id);
            farmer_name = shopManager.get_farmer(product_id);
            rating_data = shopManager.get_product_rating(product_id);
            
            let path_name = url.parse(req.url,true).pathname;
            let punct_livrare_slug = url.parse(req.url,true).query?.punct_livrare;
            wpoints = farmManager.get_work_point_for_prod(product_id,path_name,punct_livrare_slug);

            if (data?.acc_type != 2)
            cart_qty = shopManager.get_cart_qty(product_id,data?.id,punct_livrare_slug,user_id);
            else
            cart_qty = b2bManager.get_cart_qty(data.id,product_id,punct_livrare_slug);

            

            Promise.allSettled([rating_promise,prod_data_promise,farmer_name,rating_data,wpoints,cart_qty]).then( async (results)=>{
                console.log(results);
                if (results[1].status!="fulfilled" || results[2].status!="fulfilled")
                {
                    res.sendStatus(500);
                }
                else{

                    if (err || data?.acc_type!=2)
                    res.render("products.html",{
                        prod_name: results[1].value.name,
                        price: results[1].value.price+" RON",
                        unit: results[1].value.unit,
                        desc: results[1].value.description,
                        only_res: results[1].value.sel_type==2? true: false,
                        price_per_kg: results[1].value.price_per_kg,
                        image: await shopManager.get_prod_images(product_id),
                        rating_eligible: (results[0].status == "fulfilled" && results[0].value!=0) ? true : false,
                        rating: results[3].value.stars,
                        rating_count: results[3].value.count,
                        farmer_name: results[2].value,
                        wpoints: results[4]?.value,
                        prod_id: product_id,
                        farmer_id: user_id,
                        cart_qty: results[5]?.value || 0,
                        "login": err ? true : false,
                        farmer_slug,
                        product_slug
                        
                    });
                    else
                    res.render("b2b_product.html",{
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

   
    })
   

        }).catch((err)=>{
            console.log(err);
            res.status(404).render("error-404.html");    
        })

    }).catch((err)=>{
        console.log(err);
        res.status(404).render("error-404.html");
    })
    
        
})

app.post("/get_reservation_dates",better_verify,(req,res)=>{
    
    if (req.body.prod_id && req.body.judet && req.body.loc && req.body.adresa)
    {
        farmManager.get_reservation_dates(req.body.prod_id,req.body.judet,req.body.loc,req.body.adresa).then((results)=>{
            res.send(results);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(500);
    }
})

app.post("/get_reservation_price",better_verify,(req,res)=>{
    if (req.body.prod_id && req.body.judet )
    {
       farmManager.get_reservation_price(req.body.prod_id,req.body.judet).then((response)=>{
           res.send({"price": response});
       }).catch((err)=>{
           res.sendStatus(500);
       })
    }
    else{
        res.sendStatus(500);
    }
})

app.post("/get_prod_price",(req,res)=>{
    if (req.body.prod_id)
    {
        shopManager.get_prod_price(req.body.prod_id).then((response)=>{
            res.send({"price":response});
        }).catch((err)=>{
            res.send({"price":0})
        })
    }
    else{
        res.sendStatus(500);
    }
})

app.post("/send_reservation",verifyToken,(req,res)=>{

    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.sendStatus(403);
        }
        else{
            let body = req.body;
            if (body.judet && body.loc && body.adresa && body.selected_date && body.qty && body.prod_id)
            {
                farmManager.get_reservation_price(req.body.prod_id,req.body.judet).then((price)=>{
                                    //insert
                    farmManager.insert_reservation(body,data.id,price).then(()=>{
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

app.post("/user_logged",verifyToken,(req,res)=>{
    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        
        if (err){
            res.send({"ok":false});
        }
        else{
            res.send({"ok":true});
        }        
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
        })
        }).catch((err)=>{
            res.render("offer_requests.html",{
                "slug": "not-found"
            });
    })
    
});

app.get("/date_proforma",better_verify,(req,res)=>{
    let user_data = req.user_data;

    if (user_data.acc_type==1)
    {
        res.render("proforma.html");
    }
    else{
        res.sendStatus(403);
    }
})


app.post("/send_date_proforma",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type==1)
    {
        if (req.body.judet && req.body.oras && req.body.adresa && req.body.cui && req.body.firma && req.body.cont)
        {
            console.log(req.body);
            farmManager.insert_proforma(req.body,user_data.id).then(()=>{
                res.sendStatus(200);
            }).catch((err)=>{
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

app.post("/get_proforme",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type==1)
    {
        farmManager.get_proforme(user_data.id).then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(403);
    }
})
app.get("/cereri_rezervare",better_verify,(req,res)=>{
    let user_data = req.user_data;

    if (user_data.acc_type==1)
        {
            farmManager.id_to_farmer_slug(user_data.id).then((slug)=>{
                res.render("farm_res.html",{
                    "slug": slug
                })
                }).catch((err)=>{
                    res.render("farm_res.html",{
                        "slug": "not-found"
                    });
            })
            
        }   
        else{
            res.sendStatus(403);
        }
})

app.post("/get_cereri_rezervare",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type == 1)
    {
        farmManager.get_rezervari(user_data.id).then((response)=>{
            response.map((resp)=>{
                resp.order_user_name = aes.decrypt(resp.real_name,crypto,process,resp.iv_key);
                resp.iv_key = null;
                resp.real_name = null;
            })
            res.send(response);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(403);
    }
})

app.get("/my_reservations",better_verify,(req,res)=>{
    let user_data = req.user_data;

    if (user_data.acc_type==0)
    {
        res.render("user_res.html")
    }
    else{
        res.sendStatus(403);
    }
})

app.post("/get_my_res",better_verify,(req,res)=>{
    let user_data = req.user_data;

    if (user_data.acc_type == 0)
    {
        userManager.get_my_res(user_data.id).then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.sendStatus(403);
    }
})

app.post("/get_res_data",better_verify,(req,res)=>{
    let user_data = req.user_data;
    console.log(req.body);
    if (user_data.acc_type==0)
    {
        if (req.body.res_id)
        {
            farmManager.is_this_my_reservation(user_data.id,req.body.res_id).then(()=>{
                farmManager.get_specific_res_data(req.body.res_id).then((data)=>{
                    if (data.length!=0)
                    {
             
                            data[0].client_name = aes.decrypt(data[0].real_name,crypto,process,data[0].iv_key);
                            data[0].real_name = null;
                            data[0].iv_key = null;
                            res.send(data);
                    
                    }
                    else{
                        res.sendStatus(500);
                    }
                }).catch((Err)=>{
                    res.sendStatus(500);
                })
            }).catch((err)=>{
                res.sendStatus(403);
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

app.post("/change_res_status",better_verify,(req,res)=>{
    let user_data = req.user_data;

    if (req.body.order_id && req.body.status)
    {
        farmManager.is_this_my_reservation(user_data.id,req.body.order_id).then(()=>{
            farmManager.chnage_res_status(req.body.order_id,req.body.status).then(()=>{
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

    if (user_data.acc_type==2){
        if ((req.body.prod_id && req.body.point_id && req.body.farmer_id) || parseInt(req.body.point_id) == req.body.point_id){
     
            farmManager.slug_to_point_id(req.body.point_id,req.body.farmer_id).then((point_id)=>{    
                let body = {};
                body.prod_id = req.body.prod_id;
                body.point_id = point_id;
                body.qty = req.body.qty || 1;          
                 
                //add to cart
                b2bManager.ato(user_data.id,body).then((response)=>{
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
        else{
            if (req.body.keyw && req.body.details)
            {
                let body = {};
                body.qty = req.body.qty || 1;
                body.keyw = req.body.keyw.trim();
                body.details = req.body.details;
                b2bManager.ato(user_data.id,body).then((response)=>{
                    res.sendStatus(200);
                }).catch((err)=>{
                    console.log(err);
                    res.sendStatus(500);
                })
            }
            else{
                res.sendStatus(500);
            }
        }
    }
    else{
        res.sendStatus(403);
    }

})
app.post("/b2b_delete_custom",better_verify,(req,res)=>{
    let user_data = req.user_data;
    console.log(req.body);
    if (user_data.acc_type == 2 && req.body.cid){
        b2bManager.delete_custom_item(req.body.cid,user_data.id).then(()=>{
            res.sendStatus(200);
        }).catch((err)=>{
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
        
    if (req.body.prod_id && req.body.point_id){
        //get the point_id 
            if (req.body.farmer_id && req.body.point_id != parseInt(req.body.point_id))
            {
                //get from slug 
                farmManager.slug_to_point_id(req.body.point_id,req.body.farmer_id).then((point_id)=>{                   
          
                    b2bManager.delete_item(req.body.prod_id,point_id,user_data.id).then(()=>{
                        res.sendStatus(200);
                    }).catch((err)=>{
                        res.sendStatus(500);
                    })

                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }
            else{
                b2bManager.delete_item(req.body.prod_id,req.body.point_id,user_data.id).then(()=>{
                    res.sendStatus(200);
                }).catch((err)=>{
                    res.sendStatus(500);
                })
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
            if (req.cookies['cart_uid']){
            shopManager.get_carts_visitor(req.cookies['cart_uid']).then((response)=>{
                if (response>=10){
                    res.send({"count":"9+"});
                }
                else{
                    res.send({"count":response});
                }
            }).catch((err)=>{
                res.send({"count":0});
            })
        }else{
            res.send({"count":0});
        }
        }
        else{
            shopManager.get_carts(data.id).then((response)=>{
                if (response>=10){
                    res.send({"count":"9+"});
                }
                else{
                    res.send({"count":response});
                }
            }).catch((err)=>{
                res.send({"count":0});
            })
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
           if(req.cookies['cart_uid'])
           {
            shopManager.get_cart_prods_visitor(req.cookies['cart_uid']).then((response)=>{
                res.send(response);
            }).catch((err)=>{
                res.sendStatus(500);
            })
           }
           else{
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
            if (req.body.farmer_id && req.body.point_id != parseInt(req.body.point_id))
            {
                //get from slug 
                farmManager.slug_to_point_id(req.body.point_id,req.body.farmer_id).then((point_id)=>{

                    let token = req.token;
                    //check if auth 
                    jwt.verify(token,"secret",(err,data)=>{
                        if (err){
                            if (req.cookies['cart_uid'])
                            {
                                shopManager.remove_cart_visitor(req.body.prod_id,req.cookies['cart_uid'],point_id).then((response)=>{
                                    res.sendStatus(200);
                                }).catch((err)=>{
                                    res.sendStatus(500);
                                })
                            }
                            else{
                                res.sendStatus(500);
                            }
                        }
                        else
                        {
                            //delete as logged
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

    //check if auth 
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            if (req.cookies['cart_uid'])
            {
                shopManager.remove_cart_visitor(req.body.prod_id,req.cookies['cart_uid'],req.body.point_id).then((response)=>{
                    res.sendStatus(200);
                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }
            else{
                res.sendStatus(500);
            }
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
    }else
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            if (req.cookies['cart_uid'])
            {
                if (parseInt(req.body.point_id) == req.body.point_id){
                shopManager.update_cart_qty_visitor(req.cookies['cart_uid'],req.body.prod_id,req.body.qty,req.body.point_id).then((response)=>{
                    res.sendStatus(200);
                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }
            else if (req.body.farmer_id){
                farmManager.slug_to_point_id(req.body.point_id,req.body.farmer_id).then((point_id)=>{
                    shopManager.update_cart_qty_visitor(req.cookies['cart_uid'],req.body.prod_id,req.body.qty,point_id).then((response)=>{
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
            else{
                res.sendStatus(500);
            }
        }
        else
        {
            if (parseInt(req.body.point_id) == req.body.point_id){
            //update the session and the database 
            console.log("parseint");
            shopManager.update_cart_qty(data.id,req.body.prod_id,req.body.qty,req.body.point_id).then((response)=>{
                  
                res.sendStatus(200);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
        else if (req.body.farmer_id){
            farmManager.slug_to_point_id(req.body.point_id,req.body.farmer_id).then((point_id)=>{
                shopManager.update_cart_qty(data.id,req.body.prod_id,req.body.qty,point_id).then((response)=>{
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


//add to cart 
app.post("/atc",verifyToken,(req,res)=>{
    let token = req.token;
   
        if ((req.body.prod_id && req.body.point_id && req.body.farmer_id) || parseInt(req.body.point_id) == req.body.point_id){
        
            farmManager.slug_to_point_id(req.body.point_id,req.body.farmer_id).then((point_id)=>{
                
                jwt.verify(token,"secret",(err,data)=>{

                    if (err){
                        let cart_id = "";
                        //no auth,check for cookie 
                        if (req.cookies['cart_uid'])
                        {
                            cart_id = req.cookies['cart_uid'];
                        }
                        else{
                            cart_id = uuid.v4();
                            res.cookie("cart_uid",cart_id,{maxAge: 1000*60*60*24*365, httpOnly: true, secure: true})
                        }

                        shopManager.add_to_cart_visitor(req.body.prod_id,req.body.qty,cart_id,point_id).then((response)=>{
                            res.sendStatus(200);
                        }).catch((err)=>{
                            res.sendStatus(500);
                        })
                        
                    }
                    else{
                        
                        if (data.acc_type!=2){
                        //add to db to
                        shopManager.validate_atc_data(req.body.prod_id,data.id,req.body.point_id).then(()=>{
                            console.log("VALIDA")
                            shopManager.add_to_cart(req.body.prod_id,req.body.qty,data.id,point_id).then((result)=>{
                                //respond with name and price 
                                res.sendStatus(200);
                            }).catch((err)=>{
                                console.log(err);
                                res.sendStatus(500);
                            })
                        }).catch((err)=>{
                            res.sendStatus(500);
                        })
                  
                    }
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
    coleteManager.request_client_token(user_data.id).then((response)=>{
 
        coleteManager.get_money(response).then((reponse)=>{
            
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
    logger.debug("sess")
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
                            console.log("send")
                            res.sendStatus(200);
                        }).catch((err)=>{
                            console.log("err");
                            res.send({"err":err});
                        })
                    }).catch((err)=>{
                        //here we shoudl send err
                        console.log("token")
                        res.send(err);
                    })
                    
                }).catch((err)=>{
                    console.log("err");
                    res.send({"err":"courier_id"});
                })

            }).catch((err)=>{
                console.log("SIZES");
                res.send({"err":"sizes"});
            })
        }).catch((err)=>{
            console.log("CONTACTE")
            res.send({"err":"contacte"});
        })
    }).catch((err)=>{
        console.log("ADRESE");
        res.send({"err":"adrese"});
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
    console.log(req.body);
    if (req.body.type!=null && req.body.type == 0){
        
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
                                console.log("aici")
                                res.sendStatus(500);
                            })

                        }).catch((err)=>{
                           // console.log(err.response.data.errors);
                           //console.log(err.response.data)

                            res.sendStatus(500);
                        })

    
                    }).catch((err)=>{
                        console.log("erroare")

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
}
else {
    console.log(req.body)
    if (req.body.order_id && req.body.sizes.cost && req.body.sizes.est_date){
        orderManager.is_this_my_order(user_data.id,req.body.order_id).then((response)=>{
            if (response){
                
                orderManager.insert_private_cost(req.body.sizes.cost,req.body.sizes.est_date,req.body.order_id).then(()=>{

                    orderManager.update_status(req.body.order_id,1).then(()=>{
                        res.send({});
                    }).catch((err)=>{
                        res.sendStatus(500);
                    })
                    
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
        console.log("err")
        res.send({"private_err":"Te rugăm să completezi toate datele!"})
    }
}
})

app.post("/accept_order_farm",better_verify,(req,res)=>{
    let user_data = req.user_data;
    if (req.body.order_id){
        orderManager.is_this_my_order(user_data.id,req.body.order_id).then((response)=>{
            if (response){
                orderManager.update_status(req.body.order_id,9).then(()=>{
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
        res.sendStatus(500);
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
                            res.sendStatus({"err":"Nu este nicio propunere"});
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
        console.log(response);
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

app.post('/get_small_order_pdf',better_verify,(req,res)=>{
    let user_data = req.user_data;

    if (req.body.order_id){
    orderManager.is_this_my_client_order(user_data.id,req.body.order_id).then((response)=>{
        if (response){
            orderManager.get_raw_data(req.body.order_id).then((response)=>{
                res.send(response);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
        else{
            res.sendStatus(500);
        }
    })
    }
    else{
        res.sendStatus(500);
    }
});

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

app.get("/order",verifyToken,(req,res)=>{
    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            res.render("order.html");
        }
        else{
            if (data.acc_type == 2){
                res.render("b2b_order.html",{"b2b": true})
            }
            else{
                res.render("order.html",{"b2b": false});

            }
        }
    })

})

app.get("/delivery_info",verifyToken,(req,res)=>{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            //redirect to login or create account 
            res.redirect("/login");
        }
        else{
            if (data.acc_type!=2){
            shopManager.get_carts(data.id).then((response)=>{
                console.log(response);
                if (response!=0)
                res.render("delivery.html");
                else{
                    res.redirect("/marketplace");
                }
            }).catch((err)=>{
                res.redirect("/marketplace")
            })
        }
        else{
            b2bManager.parse_cart_count(data.id).then((response)=>{
                if (response!=0)
                res.render("delivery.html");
                else{
                    res.redirect("/marketplace");
                }
            }).catch((err)=>{
                res.redirect("/marketplace")
            })
        }
           
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


          if (addr.length!=0){
              addr = addr[0];

              Promise.allSettled([shopManager.get_carts(data.id),b2bManager.parse_cart_count(data.id)]).then((results)=>{
                
                if ((results[0].status == "fulfilled" && results[0].value!=0) || (results[1].status == "fulfilled" && results[1].value!=0)){
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
                        console.log("aici");
                        res.render("b2b_checkout.html",{
                            "street": addr.strada.trim(),
                            "nr_st":addr.numar,
                            "cod": addr.cod.trim(),
                            "bloc": addr.bloc.trim(),
                            "apt": addr.apt.trim(),
                            "inter":addr.interfon.trim(),
                            "etaj":addr.etaj.toString().trim(),
                            "nume":addr.nume.trim(),
                            "tel":addr.telefon.trim()
                        })
                    }
                }
                else{
                    
                    res.redirect("/marketplace");
                }
              })
                
      
            

          }
          else{
              res.redirect("/delivery_info")
          }
      }).catch((err)=>{
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
                                    console.log("RWSPOE")
                                    console.log(r);
                                   res.send(r);
                                }).catch((err)=>{
                                    console.log("adrese")
                                   res.sendStatus(500);
                                })
                            }
                            else{
                                console.log("adrese")
                               res.sendStatus(500); 
                            }

                        }).catch((err)=>{
                            console.log("adrese")
                            res.sendStatus(500);
                        })
                    
     
                 }).catch((err)=>{
                    console.log("adrese")
                     res.sendStatus(500);
                 })     
     
     
     
            }).catch((err)=>{    
                console.log("adrese")
                res.sendStatus(500);
            })
        }).catch((err)=>{    
            console.log("adrese")
            res.sendStatus(500);
        })
    }).catch((err)=>{
        console.log("adrese")
        res.sendStatus(500);
    })
 
})

//get price for point total
app.post("/get_total_price_point",better_verify,(req,res)=>{
    let user_data = req.user_data;

    if (req.body.point_id)
    {
        shopManager.get_total_cart_point(user_data.id, req.body.point_id).then((response)=>{
            res.send({"total": response})
        }).catch((err)=>{
            res.send({"total": -1})
        })
    }
    else
    res.send({"total": -1})
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



//END ORDER 

app.get("/register-validation",(req,res)=>{
    let query = req.query;


    if (query.sc && query.sic)
    {

        agent_manager.check_id_and_code(query.sic, query.sc).then(()=>{

            res.render("register-validation.html",{
                "sc": query.sc,
                "sic": query.sic
            });
        }).catch((status)=>{
            res.status(status).render(`error-${status}.html`);
        })
        
    }
    else{
        res.status(404).render('error-404.html');
    }
    
})

app.post("/parse_register_data",(req,res)=>{
    let body = req.body;

    if (body.sc && body.sic && body.conf)
    {
        agent_manager.check_authenticity(body.sc,body.sic,body.conf).then((response)=>{
            let cookie_body = {
               "s":"sst3dpvep", "sc": body.sc,"sic": body.sic,"im": body.conf, "ts":Date.now()
            }
            //set the secure cookie that lasts for 15 minutes  
            res.cookie("SAft",aes.encrypt(JSON.stringify(cookie_body),crypto,process),{maxAge: 1000*60*150,secure: true});

            res.send(response);
        }).catch((err)=>{
            console.log(err);
            res.send({"conf_mail_err":"Adresa de email nu corespunde acestei înregistrări sau cererea a fost deja procesata!"})

        })
    }   
    else{
        res.send({"conf_mail_err":"Te rugăm să completezi adresa de email!"})
    }
})

app.post("/validate_register_data",(req,res)=>{
    try{
    //first of all we need to check the cookie and the body 
    let secure_cookie = req.cookies["SAft"];
    let body = req.body;

    console.log(body);

    if (secure_cookie && body.sc && body.sic)
    {
        let secure_cookie_body = JSON.parse(aes.decrypt(secure_cookie,crypto,process));

        let time_diff = Date.now() - secure_cookie?.ts;
        if (time_diff/1000/60 > 15 || body.sc.trim()!=secure_cookie_body.sc.trim() || body.sic.trim()!=secure_cookie_body.sic.trim())
        {
            //not valid
            res.sendStatus(403);
        }
        else{
            //ok, the data 

            agent_manager.validate_data(body,false).then((response)=>{
                if (Object.keys(response).length==0)
                {
                    //update the data 
                    agent_manager.update_data(body,body.sc,body.sic).then(()=>{
                        res.send({});
                    }).catch((err)=>{
                        res.send({"main_err":"Eroare de server! "})
                    })
                }
                else{
                    let i;
                    for (i=0;i<response.length;i++)
                    {
                        if (response[i].err.includes("Dan"))
                        {
                            response[i].err = "Eroare de server!";
                        }
                    }
                    res.send(response);
                }
            }).catch((err)=>{
                console.log(err);
                res.sendStatus(500);
            })  

        }
    }
    else{
        res.sendStatus(403);
    }
}
catch(e){
    console.log(e);
    res.sendStatus(500);
}
})

app.post("/assign_account",(req,res)=>{
    try{
    let body = req.body;
    let secure_cookie = req.cookies['SAft'];
    let secure_cookie_body = JSON.parse(aes.decrypt(secure_cookie,crypto,process));

    if (body.pass && body.rep_pass)
    {
        if(body.pass == body.rep_pass)
        {

            //all ok
            //first insert the user 
            agent_manager.insert_farmer_account(secure_cookie_body.sc,secure_cookie_body.sic,body.pass,aes,crypto,process,fs).then(()=>{
                res.send({});
            }).catch((err)=>{
                res.send({"err":"Te rugăm să încerci mai târziu sau să reîncarci pagina!"})
            })
        }
        else{
            res.send({"err":"Parolele nu sunt la fel!"})
        }
    }
    else{
        res.send({"err":"Te rugăm să completezi câmpurile!"})
    }
    
}
    catch(e)
    {
    console.log(e);
    res.sendStatus(500);
        //continue for now 
        //LOG errors when live
    }
})


//profile
//dashboard profile
app.get("/dashboard",verifyToken,(req,res)=>{
    let token = req.token;

    jwt.verify(token,"secret", async (err,data)=>{
        if (err){
            res.redirect("/login");
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
                res.send(response);
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
            let pics,farmer_names,profile_image,is_admin,user_id;
            
            pics = userManager.get_farmer_pics(req.params.slug);
            farmer_names = userManager.get_farmer_names(req.params.slug);
            profile_image = userManager.get_profile_img(req.params.slug);
            is_admin = farmManager.is_this_farmer_admin(data?.id,req.params.slug);
            user_id = userManager.slug_to_user_id(req.params.slug);
            
            Promise.allSettled([pics,farmer_names,profile_image,is_admin,user_id]).then((responses)=>{
                    console.log(responses[1]);
                if (responses[0].status!="fulfilled")
                {
                    pics = "linear-gradient(none,none)";
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
   
        
                if (responses[1].status!="fulfilled" || responses[4].status!="fulfilled"){
                    res.sendStatus(500);
                }
                else{
                    if (err || data.acc_type!=2){
                    res.render("profile_farmer.html",{
                        "bg": pics,
                        "bis_name": responses[1]?.value[0]?.bis_name,
                        "profile_image":profile_image,
                        "admin": responses[3].value,
                        "farmer_id": responses[4].value,
                        "login": err ? true : false,
                        "b2b": false
                    });
                }
                else{
                    res.render("profile_farmer.html",{
                        "bg": pics,
                        "bis_name": responses[1]?.value[0]?.bis_name,
                        "profile_image":profile_image,
                        "admin": responses[3].value,
                        "farmer_id": responses[4].value,
                        "login": err ? true : false,
                        "b2b": true
                    });
                }
                }
            })  
        })
       
    }).catch((err)=>{
        //maybe the slug is from the firme 
        userManager.slug_to_firma_id(req.params.slug).then((response)=>{
            res.render("profile_farmer.html",{
                "bis_name": response.nume,
                "cui": response.cui,
                "profile_image": '/assets/images/apppictures/3.jpg'
            });
        }).catch((err)=>{
            res.status(404).render('error-404.html');
        })
    })
    
})

app.post("/profile_content",verifyToken,(req,res)=>{
    console.log(req.body);
    if (req.body.user_id){
    
    let token = req.token;

    jwt.verify(token,"secret",(err,data)=>{
        let admin = true;
        if (err){
            admin = false;
        }
        farmManager.get_template_details(req.body.user_id).then((user_data)=>{
            if (user_data.length<2)
            {
                //not ok 
                
                res.sendStatus(500);
            }
            else{
                //here we get the content 
                farmManager.get_farmer_profile_content(req.body.user_id).then((content)=>{
                    if (content == null)
                    {
                        res.send(static_mustache.render(templates.farmer_profile_default,{"admin":admin,"desc": (user_data[0].user_data || ""),"bis_name":(user_data[1].user_data || "")}));
                    }
                    else{
                        res.send(static_mustache.render(content,{"admin":admin,"desc": (user_data[0].user_data || ""),"bis_name":(user_data[1].user_data || "")}));

                    }
                }).catch((content_err)=>{
                    console.log(content_err)
                    res.sendStatus(500);
                })
            }
        }).catch((err)=>{
            res.send({"sdf":"fsd"});
        })
    })

}
else{
    res.send(templates.not_activated_farmer);

}

})  


app.post("/get_prod_data",(req,res)=>{
    
    if (req.body.prod_id)
    {
        let prod_id = req.body.prod_id;
        let response = {};

            farmManager.get_prod_data(parseInt(prod_id)).then((prod_data)=>{
                response.prod_data = prod_data;
                if (req.body.farm_info)
                {
                   Promise.allSettled([farmManager.get_farm_pics_by_prod_id(prod_id),farmManager.get_farm_nameAndslug_by_prodId(prod_id)]).then((results)=>{
                       if (results[0].status=="fulfilled")
                            response.farm_pics = results[0].value;
                        if (results[1].status=="fulfilled")
                            response.farm_info = results[1].value;
                        
                        res.send(response);
                   })
                }   
                else{
                    res.send(response);
                }
            }).catch((err)=>{
                res.sendStatus(500);
            })
       
    }
    else{
        res.sendStatus(500);
    }

})

app.post("/get_cart_details",verifyToken,(req,res)=>{

    if (req.body.prod_id && req.body.point_id){
        let {prod_id,point_id} = req.body;
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        if (err){
            //check visitor
            let uid = req.cookies['cart_uid'];
            if (uid)
            {
                //check uid
                shopManager.guest_cart_contains(prod_id,point_id,uid).then((response)=>{
                    res.send(response);
                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }
            else
            {
                res.send({});
            }
        }
        else
        {
            if (data.acc_type != 2){
            userManager.cart_contains(req.body.prod_id,req.body.point_id,data.id).then((response)=>{
                res.send(response);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
        else{
            b2bManager.cart_contains(req.body.prod_id,req.body.point_id,data.id).then((response)=>{
                res.send(response);
            }).catch((err)=>{
                res.sendStatus(500);
            })
        }
        }
    })
}
else{
    res.sendStatus(500);
}

})

app.post("/farmer_prods",(req,res)=>{
    
    console.log(req.body.farmer_id);
    if (req.body.farmer_id){
        farmManager.get_all_sold_prods_slug(req.body.farmer_id).then((response)=>{
            
            res.send(response);
        }).catch((err)=>{
            res.send({});
        })
    }
    else{
        res.send({});
    }
    
})

app.get("/upload_docs",better_verify,(req,res)=>{
    res.render("upload_docs.html");
})

app.post("/get_docs_length",better_verify,(req,res)=>{
    let user_data = req.user_data;
    farmManager.get_request_unique_id(user_data.id).then((request_id)=>{
        let count = {};
   
      admin_manager.get_all_avize(request_id).then((response)=>{
          count.avize = response.length;
          res.send(count);
      }).catch((err)=>{
          count.avize = 0;
          res.send(count);
      })

    }).catch((err)=>{
        res.send({});
    })
  
})

app.post("/get_docs_cert",better_verify,(req,res)=>{
    let user_data = req.user_data;
    farmManager.get_request_unique_id(user_data.id).then((request_id)=>{
        console.log(request_id);
        if (fs.existsSync("./certs/"+request_id+".frv"))
        {
            console.log("yes")
            let data =  fs.readFileSync('./certs/'+request_id+'.frv');
               
            data = decrypt_file(data);

            res.send({"type":data.type.toString(),"data":data.r.toString("base64")}); 
        }
        else{
            console.log("No exist");
            res.send({});
        }
    }).catch((err)=>{
        console.log(err);
        res.send({});
    })
})

app.post("/get_docs_avize",better_verify,(req,res)=>{
    let user_data = req.user_data;
    farmManager.get_request_unique_id(user_data.id).then((request_id)=>{
        admin_manager.get_all_avize(request_id).then((response)=>{

          
            //get only the avize we have desc 
            let avize_promises = [];
            let avize_response = [];    
            
            response.map((aviz)=>{
                avize_promises.push(aviz_to_data(aviz));
            })

            Promise.allSettled(avize_promises).then((results)=>{
                results.map((result)=>{
                    if (result.status != "rejected")
                    {
                        //push 
                        avize_response.push({
                            "type": result.value.data.type.toString(),
                            "det": result.value.det,
                            "data": result.value.data.r.toString("base64")
                        })
                    }
                })
                res.send(avize_response);
            })

        }).catch((err)=>{
            res.send([]);
        })
    }).catch((err)=>{
        res.send([]);
    })
})

function aviz_to_data(aviz)
{
    return new Promise((res,rej)=>{
        let {file_name,det} = aviz;
        fs.readFile("./avize_pics/"+file_name+".frv",function(err,data){
            if (err){
         
                rej();
            }
            else{
                data = decrypt_file(data);

                res({"data":data,det});
            }
        })
    })
}

// app.post("/get_my_docs",better_verify,(req,res)=>{
//      let user_data = req.user_data;
//      farmManager.get_unique_request_id(user_data.id).then((request_id)=>{

//      }).catch((err)=>{
//          res.send({});
//      })
//     res.send({});
// })

app.post("/upload_docs",[better_verify,
kyc_upload.fields([
    {
        name: "cert",
        maxCount: 1
    },
    {
        name: "avize[]",
        maxCount: 10
    }
])
],(req,res)=>{
    let user_data = req.user_data;
    if (user_data.acc_type == 1)
    {
        farmManager.get_request_status(user_data.id).then((response)=>{
            if (response.status==3)
            {   
                //upload here 
                    
            }
            else
            {
                res.sendStatus(403);
            }
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else
    {
        res.sendStatus(403);
    }
})

app.post("/get_progress",better_verify,(req,res)=>{
    let user_data = req.user_data;

    farmManager.is_profile_complete(user_data.id).then((response)=>{
        res.send(response);
    }).catch((err)=>{
        res.send({});
    })
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

app.get("/send_sms",(req,res)=>{
    let body = {};
    body.phone = "0754289444";
    body.shortTextMessage = "Mesaj test";
    axios.post("https://www.smsadvert.ro/api/sms/",
    body,{
        headers:
        {
            "Content-Type": "application/json",
            "Authorization":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MTU1NmZmMTRiN2MxYzAwMDRjYWY0NmYifQ.wbOZEFZMpikAddf63sWBhppdP-uhk3GeJkRAMp4y6O8"

        }
    }).then((response)=>{

        res.sendStatus(200);        
    }).catch((err)=>{
        res.sendStatus(500);
    })

})

app.post("/change_phone",verifyToken,(req,res)=>{

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
                        body.shortTextMessage = "Codul tău este "+code;
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

app.get("/farmer_test",(req,res)=>{
    res.render("test.html");
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
// app.get("/kyc",(req,res)=>{

//     let data =  fs.readFileSync('./avize_pics/3873-660948-2688--0.frv');

//     //encode decrypted buffer 
//     data = decrypt_file(data);
//     console.log(data);
//     //console.log(data);
//     res.setHeader( "Content-Type", "image/gif")
//     res.setHeader( "Content-Length", data.length,)
//     res.setHeader( "Cache-Control", "no-cache, no-store, must-revalidate")
//     res.setHeader( "Content-Type", "image/jpg")
//       res.send(data); 

// })

app.get("/test",(req,res)=>{
    res.render("test.html");
})

app.post("/test_upload",test_upload.any(),(req,res)=>{
    
    let enc_buffer = aes.encrypt_file(req.files[0].buffer);

    fs.writeFile('./test_upload/test.frm', enc_buffer, function (err) {
        if (err) return console.log(err);
        console.log('Hello World > helloworld.txt');
      });
})

// app.get("/view",(req,res)=>{
//     fs.readFile('./test_upload/test.frm', function (err,data) {
//         if (err) {
//           return console.log(err);
//         }
//         data = decrypt_file(data).toString("base64");
//         res.render("test.html",{"data":data});
//       });
      
// })

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

app.post("/get_all_judete",better_verify,(req,res)=>{
    let user_data = req.user_data;

    if (user_data.acc_type==1)
    {
        search.get_all_judete().then((data)=>{
            res.send(data);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
        res.send({});
    }
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
                         "slug": slug,
                         "points": true
                     });
                 }).catch((err)=>{
                     res.render("add_prod.html",{
                         "slug": "not-found",
                         "points": true
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
                if (data.acc_type!=2){
                farmManager.remove_item(req.body.prod_id,data.id).then((results)=>{
                    res.sendStatus(200);
                }).catch((err)=>{
                    res.sendStatus(500);
                })
            }
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
    
    if (parseInt(req.body.parent)>=0)
    {
        farmManager.parse_cats(req.body.parent).then((response)=>{
            res.send(response);
        }).catch((err)=>{
            res.sendStatus(500);
        })
    }
    else{
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
            farmManager.is_this_my_point_id(req.params.id,data.id).then((response)=>{
                farmManager.id_to_farmer_slug(data.id).then((slug)=>{
                    //its ok
                     res.render("add_prod.html",{
                         "slug": slug,
                         "points": true
                     });
                 }).catch((err)=>{
                    res.render("add_prod.html",{
                        "slug": "not-found",
                        "points": true
                    });
                 })
            }).catch((err)=>{
                res.redirect("/wpoints");
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
                        //now add to dic 
                        let worker_pool =  workerHandler.get();
                        let list = req.body.prod_title+ " "+req.body.prod_name;
                        worker_pool.add_words(list);
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
                
                //insert the files 
                let files_promises = [];
                let desc = {};
             
                if (req.files.cert){
                    let utf8Encode = new TextEncoder();

                    if (req.files['cert'][0].mimetype.includes("image"))
                    files_promises.push(aes.saveFile(aes.encrypt_file(req.files['cert'][0].buffer,utf8Encode.encode("i")),"./certs/"+request_id+".frv"))
                    else{
                        console.log("DOCUMENT")
                        let utf8Encode = new TextEncoder();

                        files_promises.push(aes.saveFile(aes.encrypt_file(req.files['cert'][0].buffer,utf8Encode.encode("d")),"./certs/"+request_id+".frv"))

                    }
                }
                
                if (req.files["avize[]"])
                {
                    console.log("Fisiere");
                    let d = JSON.parse(req.body["details"]);
                    req.files["avize[]"].map((file,index)=>{
                        console.log(file);
                        desc[`${request_id}--${index}`] = d[file.originalname];
                        if (file.mimetype.includes("image")){
                        let utf8Encode = new TextEncoder();
                        files_promises.push(aes.saveFile(aes.encrypt_file(file.buffer,utf8Encode.encode("i")),"./avize_pics/"+request_id+"--"+index+".frv"))
                        }
                        else{
                            let utf8Encode = new TextEncoder();
                            files_promises.push(aes.saveFile(aes.encrypt_file(file.buffer,utf8Encode.encode("d")),"./avize_pics/"+request_id+"--"+index+".frv"))
      
                        }
        
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
        res.render("register_good.html",{"csrf_token":req.csrfToken,"login":err ? true : false,"b2b": (!err && data.acc_type == 2) ? true : false})
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

            //dump the cart 
            if (req.cookies['cart_uid'])
            {
                shopManager.switch_cart(resp.id,req.cookies['cart_uid']);
            }

            res.send({"status":"ok"});
        }
        else
        res.send({"status":"nok","errors":resp});
}).catch((err)=>{
    console.log(err);
    res.sendStatus(404);
})    

})
    
app.get("/login", verifyToken,(req,res)=>
{
    let token = req.token;
    jwt.verify(token,"secret",(err,data)=>{
        res.render("login_good.html",{"csrf_token":req.csrfToken,"login":err ? true : false,"b2b": (!err && data.acc_type == 2) ? true : false});

    })
})

app.get("/forgot",verifyToken,(req,res)=>{
    let token = req.token;
    let from_link = false;
    if (req.query.length!=0 && req.query.pv_key)
    {
        let key = Buffer.from(req.query.pv_key,'base64').toString("utf8");
        let received_object = JSON.parse(aes.decrypt(key,crypto,process,process.env.FORGOT_PASS_IV));
        
        //check the code 
        userManager.check_forgot(received_object.code.code).then((response)=>{
          
            if (received_object.user_id == response.user_id)
            {
                
                //ok
                from_link = true;
                req.session.forgot_user_id = response.user_id;
                jwt.verify(token,"secret", function(err,data){
                    res.render("forgot_pass.html",{
                        "login": err ? true : false,
                        "b2b": (!err && data.acc_type == 2) ? true : false,
                        "from_link": from_link
                    });
                })
            }
            else{
                res.session.forgot_user_id = -1;
                jwt.verify(token,"secret", function(err,data){
                    res.render("forgot_pass.html",{
                        "login": err ? true : false,
                        "b2b": (!err && data.acc_type == 2) ? true : false,
                        "from_link": from_link
                    });
                })
            }
        }).catch((err)=>{
            req.session.forgot_user_id = -1;
            jwt.verify(token,"secret", function(err,data){
                res.render("forgot_pass.html",{
                    "login": err ? true : false,
                    "b2b": (!err && data.acc_type == 2) ? true : false,
                    "from_link": from_link
                });
            })
        })
       
        
    }
    else{
    req.session.forgot_user_id = -1;
    
    jwt.verify(token,"secret", function(err,data){
        res.render("forgot_pass.html",{
            "login": err ? true : false,
            "b2b": (!err && data.acc_type == 2) ? true : false,
            "from_link": from_link
        });
    })
}
})

app.post("/send_reset_mail",(req,res)=>{
    let body = req.body;
    if (body.email)
    {
        body.email = body.email.trim();
        userManager.does_email_exist(body.email).then((user_data)=>{
            //generate the code 
            userManager.generate_forgot_code(body.email,user_data.id).then((code)=>{
                let link_body = {};

                link_body.code = code;
                link_body.timestamp = Date.now();
                link_body.secret = "Farmvio_secret_forgot";          
                link_body.user_id = user_data.id;

                let enc_link = aes.encrypt(JSON.stringify(link_body),crypto,process,process.env.FORGOT_PASS_IV);
                    //CHANGE WHEN LIVE 
                let final_link = "www.farmvio.com/forgot?pv_key="+Buffer.from(enc_link).toString("base64");

                
            //send the email
            let mail_opts = {
                from: "no-reply@farmvio.com",
                to: body.email,
                subject: "Schimbare parolă",
                html: static_mustache.render(templates.forgot_pass_email,{"username":user_data.username,"code": code.code,"links": final_link})
            }

            transporter.sendMail(mail_opts,function(error,info){
                if (error)
                {
                    
                    userManager.remove_forgot(code.id);
                    res.send({"reset_mail_err":"Emailul nu a putut fi trimis!"});
                }
                else{
                    
                    res.send({});
                }
            })
       

            }).catch(()=>{
                //console.log(e);
                res.send({"reset_mail_err":"Eroare la generarea unui cod! Te rugăm să încerci mai târziu!"});
            })
                    
          
        }).catch((err)=>{
            res.send({"reset_mail_err":err})
        })
    }
    else{
        res.send({"reset_mail_err":"Te rugăm să introduci o adresă de email!"})
    }
})

app.post("/check_forgot",(req,res)=>{
    let body = req.body;

    if (body.code && body.code.trim().length==6)
    {   
        body.code = body.code.trim();
        //check if this code was sent 
        userManager.check_forgot(body.code).then((response)=>{
            req.session.forgot_user_id = response.user_id;
            //set the user_id in session
            res.send({});
        }).catch((err)=>{
            res.send({"code_err":err.err})

        })
    }
    else{
        res.send({"code_err":"Te rugăm să introduci un cod valid!"})
    }
})

app.post("/change_pass_forgot",(req,res)=>{
    let body = req.body;
    if (body.pass && body.rep_pass)
    {
        if (body.pass.trim() == body.rep_pass.trim())
        {
            if (req.session.forgot_user_id != -1)
            {
                //everything ok,change
                let new_creds = {};
                new_creds.new_pass = body.pass.trim();
                new_creds.rep_new_pass = body.rep_pass.trim();
                userManager.change_pass(new_creds,req.session.forgot_user_id).then((response)=>{
                   // console.log(response);
                    if (response.ok)
                    {
                        
                        //we can now delete 
                        userManager.remove_forgot_user_id(req.session.forgot_user_id);
                        req.session.forgot_user_id = -1;

                        res.send({});
                    }
                    else{
                        res.send({"pass_err":"Eroare de server! Te rugăm să încerci mai târziu!"})
                    }
                }).catch((err)=>{       
                   // console.log(err);
                    res.send({"pass_err":"Eroare de server! Te rugăm să încerci mai târziu!"})

                })
            }
            else{
                res.send({"pass_err":"A apărut o eroare! Te rugăm să folosești link-ul din email!"})

            }
        }
        else{
            res.send({"pass_err":"Parolele nu corespund!"})
        }
    }
    else{
        res.send({"pass_err":"Te rugăm să completezi toate câmpurile!"})
    }
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
                if (req.cookies['cart_uid'])
                {
                    shopManager.switch_cart(id,req.cookies['cart_uid']);
                }
                res.send({"status":"ok","link":"/dashboard"});
            }    
            else if(acc_type == 1){
                if (req.cookies['cart_uid'])
                {
                    shopManager.switch_cart(id,req.cookies['cart_uid']);
                }
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
                            if (req.cookies['cart_uid'])
                            {
                                shopManager.switch_cart(id,req.cookies['cart_uid']);
                            }
                            res.send({"status":"ok","link": "/dashboard"});
                        }    
                        else if(acc_type == 1){
                            if (req.cookies['cart_uid'])
                            {
                                shopManager.switch_cart(id,req.cookies['cart_uid']);
                            }
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
    if (req.cookies['auth']){
        res.clearCookie("auth");
        res.cookie()
    
    }
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
                console.log(data);
                //console.log(data.toString("base64"));
                if (data.type == "d")
                res.send("data:application/pdf;base64, "+data.r.toString("base64")); 
                else
                  res.send("data:image/png;base64, "+data.r.toString("base64")); 

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
                        if (dec.type =="d")
                        response_data.push({
                            file: "data:application/pdf;base64, "+dec.r.toString("base64"),
                            det: resp.det
                        })
                        else
                        response_data.push({
                            file: "data:image/png;base64, "+dec.r.toString("base64"),
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
    // app.get("/fsd",(req,res)=>{
    //     res.render("change_pass.html");
    // })
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

    
    app.get("/agent_login",(req,res)=>{
        res.render("agent_login.html");
    })


    app.get("/create_admin_acc",(req,res)=>{
        console.log(req.query);
        res.send(crypto.createHmac("sha256",process.env.HASH_PASS).update(req.query.pass.trim()).digest("hex"));
    })

    app.post("/agent_login",(req,res)=>{
        let body = req.body;

        if (body.name && body.pass)
        {
           
            agent_manager.login(body.name,crypto.createHmac("sha256",process.env.HASH_PASS).update(req.body.pass).digest("hex")).then((user_id)=>{

                console.log(user_id);
                
                let token = jwt.sign({"id":user_id,"random":"F-wRD:tTm+q~7>E\'pu:T4}HWRVJC8JJ"},"secret_agent");
                //set the cookies 
                    res.cookie("agent_auth",token,{maxAge: 1000*60*60*12});
                    res.send({});

            }).catch((err)=>{
                
                res.send({"err":"Datele introduse sunt incorecte!"});

            })
        }
        else
        {   
            res.send({"err":"Datele introduse sunt incorecte!"});

        }
    })

    app.get("/user_form",(req,res)=>{
        let query = req.query;
        if (query.draft)
        {
            
            //get the data 
            agent_manager.get_full_data(query.draft).then((response)=>{
                response.draft = query.draft;
                if (fs.existsSync("./drafts/certs/"+response.unique_id+".frv"))
                   {
                       let data = fs.readFileSync("./drafts/certs/"+response.unique_id+".frv");
                      let d = decrypt_file(data);
                      //console.log(d);
                        if (d.type == 'd')
                        response.cert_file = "data:application/pdf;base64, "+d.r.toString("base64");
                        else
                        response.cert_file = "data:image/png;base64, "+d.r.toString("base64");
                        
                    }

                    res.render("agent_user_form.html",response);                
            
            }).catch((err)=>{
                res.render("agent_user_form.html");
            })
        }
        else
        res.render("agent_user_form.html");
    })

    app.post("/agent_submit",[kyc_upload.fields([
        {
            name: "cert",
            maxCount: 1
        },
        {
            name: "avize[]",
            maxCount: 10
        }
    ])],(req,res)=>{

        let files_promises = [];
        let files = req.files;
        let desc = {};

        agent_manager.is_id_unique(req.body.draft).then(()=>{
                    //let's validate 
                    
                    agent_manager.validate_data(req.body,true).then((response)=>{
                        //after validate, if its ok we can insert 
                        if (Object.keys(response).length==0)
                            {
                                //insert 
                                agent_manager.get_unique_request_id().then((u_id)=>{    
                                    let draft = req.body.draft.trim();

                                    if (draft && draft.trim()!="")
                                        u_id = draft;

                                    if(files.cert)
                                    {
                                        if(draft)
                                        {
                                            //remove the draft 
                                            try{
                                                if (fs.existsSync("./drafts/certs"+draft+".frv"))
                                                fs.unlinkSync("./drafts/certs/"+draft+".frv");
                                            }
                                            catch(e)
                                            {

                                            }
                                        }
                                    //upload the cert 
                                    let utf8Encode = new TextEncoder();
                            
                                    if (files['cert'][0].mimetype.includes("image"))
                                    files_promises.push(aes.saveFile(aes.encrypt_file(files['cert'][0].buffer,utf8Encode.encode("i")),"./certs/"+u_id+".frv"))
                                    else{
                                        
                                        let utf8Encode = new TextEncoder();
                            
                                        files_promises.push(aes.saveFile(aes.encrypt_file(files['cert'][0].buffer,utf8Encode.encode("d")),"./certs/"+u_id+".frv"))
                            
                                    }
                                    }
                                    else
                                    {
                              
                                        if (draft)
                                        {
                                            //move if exists 
                                            if (fs.existsSync("./drafts/certs/"+draft+".frv"))
                                            {
                                             
                                                //move
                                                fs.rename("./drafts/certs/"+draft+".frv", "./certs/"+draft+".frv", function (err) {
                                                    if (err) 
                                                    console.log(err);
                                                })
                                            }
                                        }
                                    }
                                    if (files["avize[]"])
                                    {

                                        
                                        
                                        let d = JSON.parse(req.body["details"]);

                                        files["avize[]"].map((file,index)=>{
                                            
                                            desc[`${u_id}--${index}`] = d[file.originalname];
                                            if (file.mimetype.includes("image")){
                                            let utf8Encode = new TextEncoder();
                                            files_promises.push(aes.saveFile(aes.encrypt_file(file.buffer,utf8Encode.encode("i")),"./avize_pics/"+u_id+"--"+index+".frv"))
                                            }
                                            else{
                                                let utf8Encode = new TextEncoder();
                                                files_promises.push(aes.saveFile(aes.encrypt_file(file.buffer,utf8Encode.encode("d")),"./avize_pics/"+u_id+"--"+index+".frv"))
                        
                                            }
                            
                                        })

                                        
                                    }

                                    Promise.allSettled(files_promises).then((responses)=>{
                                        let ok = true;

                                        responses.map((resp)=>{
                                            if (resp.status!="fulfilled")
                                            ok = false;
                                        })

                                        if (ok)
                                        {
                                            console.log(desc)
                                            if (Object.keys(desc).length!=0)
                                            agent_manager.insert_avize_details(desc).catch((err)=>{
                                                //do nothing
                                            });
                                        }
                                    })

                                    let code = crypto.randomBytes(32).toString("hex");
                                        agent_manager.insert_form_in_db(req.body,u_id,code).then(()=>{
                                            //now we should send an email
                                               //if draft,remove draft 
                                               if (draft)
                                               agent_manager.remove_draft(draft);

             
                                                    let final_link = `www.farmvio.com/register-validation?sc=${code}&sic=${u_id}`;
                                                    let mail_opts = {
                                                        from: "no-reply@farmvio.com",
                                                        to: req.body.mail.trim(),
                                                        subject: "Mail verificare cont",
                                                        html: static_mustache.render(templates.agent_form_email,{"name":req.body.real_name.trim(),"links": final_link})
                                                    }
                                        
                                                    transporter.sendMail(mail_opts,function(error,info){
                                                        if (error)
                                                        {
                                                            res.send({"main_err":"Emailul nu a putut fi trimis, dar formularul este pe server. Inceraca sa retrimiti emailul","u_id":u_id});
                                                        }
                                                        else{
                                                            res.send({"u_id":u_id});
                                                        }
                                                    })
                                           
                                           

                                        }).catch((err)=>{
                                            console.log(err);
                                            res.send({"main_err":"Te rugam sa reincerci!"})
                                        })
                                    //push to db
                                }).catch((err)=>{
                                    console.log(err);
                                    res.send({"main_err":"Te rugam sa reincerci!"});
                                })
                            }
                            else
                        res.send(response);
                    }).catch((err)=>{
                        console.log(err);
                        res.send({"main_err":"Super nasol"})
                    })
        }).catch((err)=>{
            res.send({"main_err":"Exista deja o cerere cu acest id! Apasa formular nou!!"});
        })
      
        
    })

    var mails_list = [
    "smoke_petrut@yahoo.com"];

    app.get("/email_sender",(req,res)=>{

        send_mail(0);
        res.sendStatus(200);
       
     
 
    })


    function send_mail(index)
    {
        console.log("Trimit catre "+mails_list[index]);
        if (index==mails_list.length)
        return ;
        let mail_opts = {
            from: "office@farmvio.com",
            to: mails_list[index].trim(),
            subject: "Farmvio - Newsletter",
            html: static_mustache.render(templates.news,{})
        }

        transporter.sendMail(mail_opts,function(error,info){
            if (error)
            {
                console.log(error);
                
            }
            else{
                console.log("Mail trimis catre !"+mails_list[index])
            }
            setTimeout(()=>{

                send_mail(index+1);
            },1000*60)
        })
    }


    app.post('/agent_undo',(req,res)=>{
        let body = req.body;

        if (body.sent_id)
        {
            //move to draft 
            agent_manager.move_to_draft(body.sent_id.trim()).then(()=>{
                agent_manager.remove_form(body.sent_id.trim()).then(()=>{
                 
                    res.send({});
                }).catch(()=>{
                    res.send({"err":"Eroare! Nu se poate sterge, suna-l pe Dan!"})
    
                })
            }).catch((err)=>{
                res.send({"err":"Eroare! Nu se poate muta in draft, suna-l pe Dan!"})

            })
           
        }
        else
        {
            res.send({"err":"Eroare! Nu ai trimis acest formular!"})
        }
    })

    app.post("/agent_submit_draft",[kyc_upload.fields([
        {
            name: "cert",
            maxCount: 1
        },
        {
            name: "avize[]",
            maxCount: 10
        }
    ])],(req,res)=>{

        let files_promises = [];
        let files = req.files;
        let desc = {};
        //no need to validate 
                        //insert 
                        agent_manager.get_unique_request_id().then((u_id)=>{                      

                            if(files.cert)
                            {
                               //upload the cert 
                               let utf8Encode = new TextEncoder();
                    
                               if (files['cert'][0].mimetype.includes("image"))
                               files_promises.push(aes.saveFile(aes.encrypt_file(files['cert'][0].buffer,utf8Encode.encode("i")),"./drafts/certs/"+u_id+".frv"))
                               else{
                                   console.log("DOCUMENT")
                                   let utf8Encode = new TextEncoder();
                    
                                   files_promises.push(aes.saveFile(aes.encrypt_file(files['cert'][0].buffer,utf8Encode.encode("d")),"./drafts/certs/"+u_id+".frv"))
                    
                               }
                            }
                            if (files["avize[]"])
                            {
                                
                                let d = JSON.parse(req.body["details"]);

                                files["avize[]"].map((file,index)=>{
                                    
                                    desc[`${u_id}--${index}`] = d[file.originalname];
                                    if (file.mimetype.includes("image")){
                                    let utf8Encode = new TextEncoder();
                                    files_promises.push(aes.saveFile(aes.encrypt_file(file.buffer,utf8Encode.encode("i")),"./drafts/avize_pics/"+u_id+"--"+index+".frv"))
                                    }
                                    else{
                                        let utf8Encode = new TextEncoder();
                                        files_promises.push(aes.saveFile(aes.encrypt_file(file.buffer,utf8Encode.encode("d")),"./drafts/avize_pics/"+u_id+"--"+index+".frv"))
                  
                                    }
                    
                                })

                                
                            }

                            Promise.allSettled(files_promises).then((responses)=>{
                                let ok = true;



                                responses.map((resp)=>{
                                    if (resp.status!="fulfilled")
                                        console.log(resp.reason)
                                })

                            })

                                agent_manager.insert_draft_in_db(req.body,u_id).then(()=>{
                                    //now we should send an email
                                    res.send({"u_id":u_id});
                                }).catch((err)=>{
                                   
                                    res.send({"main_err":"Te rugam sa reincerci!"})
                                })
                            //push to db
                        }).catch((err)=>{
                            console.log(err);
                            res.send({"main_err":"Te rugam sa reincerci!"});
                        })
           
        
    })



    app.get("/agent_sent",(req,res)=>{
        res.render("agent_sent.html");
    })

    app.post("/agent_get_sent",(req,res)=>{
   //build where clauses 
                agent_manager.get_sent(req.body.start,req.body.length,req.body.columns).then((response)=>{
                    console.log(response.total);
                res.send({
                    "draw":req.body.draw,
                "iTotalDisplayRecords": response.total,
                "iTotalRecords": response.results.length,"data":response.results});

                }).catch((err)=>{
                res.sendStatus(500);
                })
    })

    app.post("/resend_mail_agent",(req,res)=>{
        let body = req.body;

        if (body.id)
        {
            //get mail_info 
            agent_manager.get_mail_info(body.id).then((response)=>{

             
                let final_link = `www.farmvio.com/register-validation?sc=${response.u_code}&sic=${response.unique_id}`;
                let mail_opts = {
                    from: "no-reply@farmvio.com",
                    to: response.email,
                    subject: "Mail verificare cont",
                    html: static_mustache.render(templates.agent_form_email,{"name":response.nume,"links": final_link})
                }
    
                transporter.sendMail(mail_opts,function(error,info){
                    if (error)
                    {
                        res.send({"err":"Emailul nu a putut fi trimis! Cod 003"});
                    }
                    else{
                        
                        res.send({});
                    }
                })
            }).catch((err)=>{
                res.send({"err":"Eroare! Cod 002"});
            })
           
        }
        else{
            res.send({"err":"Eroare! Cod: 001"});
        }
    })



    app.get("/agent_drafts",(req,res)=>{
            res.render("agent_drafts.html");
    })

    app.post("/agent_get_draft",(req,res)=>{
        //build where clauses 
                     agent_manager.get_drafts(req.body.start,req.body.length,req.body.columns).then((response)=>{
                        
                     res.send({
                         "draw":req.body.draw,
                     "iTotalDisplayRecords": response.total,
                     "iTotalRecords": response.results.length,"data":response.results});
     
                     }).catch((err)=>{
                     res.sendStatus(500);
                     })
         })

         app.get("/edit_agent_form/:id",(req,res)=>{
            res.render("edit_agent_form.html");
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
        res.redirect("/login");
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


function agent_verify(req,res,next)
{
    let cookie = req.cookies['agent_auth'];
    
    if (typeof cookie!=="undefined"){
        req.token = cookie;
         jwt.verify(req.token,"secret_agent",(err,data)=>{
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