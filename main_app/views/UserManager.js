//object name of inputs that will be passed to the /register request
//these 2 arrays must follow the exact same order

const { readlink } = require("fs");


//if first input is name, then it's function shopuld be first in register_valid
const insert_needed_params = [
    "name",
    "pass",
    "real_name",
    "pass_repeat",
    "phone_number",
    "email"

];
const register_validation = [
    "name_valid",
    "pass_valid",
    "real_name_valid",
    "pass_repeat_valid",
    "phone_valid",
    "email_valid"
];
var pool = null,mysqlU = null,process = null,aes=null,crypto = null,phone_regexp;
phone_regexp = new RegExp("^\\+?4?0{1,2}[0-9]{9}$");
//validators 

function init(con,mys,proc,encr,cr){
    pool = con;
    mysqlU = mys;
    process = proc;
    aes = encr;
    crypto = cr;
}


async function name_valid(name){
    //first check if name is not empty or null
    if (name!=null && name.trim()!="")
    {
    //for name validation we check if name is not empty
    //username must be unique
    let c =  await unique_user(name).then((res)=>{
        return null;
     }).catch((err)=>{
         return err;
     });

    return c;
    }
    else 
    return "Username must nbe filled"
}

  async function unique_user(name)
{
   return await  new Promise((resolve,reject)=>{
       pool.getConnection((err,conn)=>{
            if (err){
                reject("Server error!");
                return ;
            }      
       conn.query("SELECT id from users WHERE username = "+mysqlU.escape(name)+"",(err,data,fields)=>{
        conn.release();
           if (err)
        {
            reject("Server error");

        }
        //now check the unique
        else {
            if (data.length==0){
                resolve();
            }
            else 
            reject("Username not unique!");
        }
    })
       })
   })
}




async function pass_valid(pass)
{
    if (pass==null || pass.trim()=="")
    {
        return "Password field not completed";
    }
}

async function real_name_valid(real_name){
    if (real_name==null || real_name.trim()=="")
    {
        
        return "Real name must be filled!";
    }
}

async function pass_repeat_valid(pass,pass_verif){
    //first check if pass_verif contains oemthing 
    if (pass_verif==null || pass_verif.trim()==""){
        
        return "Passwords do not match!";
    }
    else{
        if (pass.trim()!=pass_verif.trim()){
            return "Passwords do not match!";
        }
    }
}

async function phone_valid(phone){
    if (phone==null || phone.trim()==""){
        return "Phone number is empty";
    }

    else{
        //check the phone number structure 
        if (!phone_regexp.test(phone)){
            //non-valid phone 
            return "Phone number is wrong";
        }
        else{
            //remove the prefix and chekc unqiue
            if (!await unqiue_phone(phone))
            {
                return "Phone number is associated with an account";
            } 
        }
    }
}

function serialize_phone(phone){
    try{

        return "0"+phone.replace(/^\+?4?0{0,2}/g,'');
    }
    catch(e)
    {
        console.log(e);
        return phone;
    }
}

async function unqiue_phone(phone){
    try{
        phone = serialize_phone(phone);
        return await new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err)
                rej(false);
                conn.query("SELECT id FROM users where phone_number = "+mysqlU.escape(phone)+" ",function(err,results,fields){
                    if (err)
                    {
                        rej(false);

                    }
                    if (results.length==0){
                        res(true);
                    }   
                    else{
                        res(false);
                    }
                })
            })
        }).then((res)=>{
            return res;
        }).catch((err)=>{
            //Server error
            return err;
        })
    }
    catch(e)
    {
        //server error
        //return as error
        return false;
    }
}

async function email_valid(email)
{
    console.log("email is "+email)
    if (email==null || email.trim()=="")
    return "Email is empty";
    else{
        //reg exp
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        return "Email is not valid";
        else{
            //check unique 
            if (!await email_unique(email)){
                return "Email address not unique";
            }   
        }
    }
}

async function email_unique(email)
{
    try{    
        return await new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err)
                {
                    rej(false);
                    return ;
                }
                else{
                    conn.query("SELECT id FROM users where email = "+mysqlU.escape(email)+" ",function(err,results,fields){
                        if (err)
                        {
                            //server error
                            rej(false);
                            //return ;
                        }
                        else{
                            if (results.length==0){
                                res(true);
                            }
                            else{
                                res(false);
                            }
                        }
                    })
                }
            })
        }).then((res)=>{
            return res;
        }).catch((err)=>
        {
                //server error
                return err;
        })
    }
    catch(e)
    {
        //server error

        return false;
    }
}
    function change_pass(new_creds,user_id){
        return new Promise(  (res,rej)=>{
            //first check if we have some data to work on 
            if (new_creds.new_pass.trim()!="" && new_creds.rep_new_pass.trim()!=""){
            //we have some data 
            //check if passwords match 
            if (new_creds.new_pass.trim() == new_creds.rep_new_pass.trim())
            {
                //its ok we can update them to the database
                pool.getConnection((err,conn)=>{
                    if (err){
                        rej("");

                    }
                    else{
                        //make the query
                    let pass =  crypto.createHmac("sha256",process.env.HASH_PASS).update(new_creds.new_pass.trim()).digest("hex"); 
                    console.log(pass);    
                    conn.query("UPDATE users set pass = "+mysqlU.escape(pass)+" where id = "+user_id+" ",(err,results,fields)=>{
                            conn.release();
                            if (err){
                                rej("");
                            }
                            else{
                                if (results.affectedRows==0){
                                    
                                    res({"nok":""})
                                    
                                }else{
                                    
                                    res({"ok":""});
                                }
                            }
                        })
                    }
                })
            }
            else{
                //not ok 
                res({"err":"Passwords do not match!"});
            }
            }
            else{
                res({"err":"Please fill the inputs!"})
            }
        })
    } 
    async function get_id(name){
        return await new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej("server");
                    return ;
                }      
                conn.query("SELECT id from users where username = "+mysqlU.escape(name)+"",function(err,results,fields){
                    conn.release();

                    if (err){
                        rej("server");
                    
                    }
                    else{
                        if (results.length!=0){
                            res(results[0].id);
                        }
                        else{
                            rej("");
                        }
                    }
                })
            })
        }).then((id)=>{
            return id;
        }).catch((err)=>{
            return err;
        })
    }
async function get_real_name(id){
    try{
        //remove the salt 
        return await new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err)
                {
                    console.log(err);
                    rej("server");
                    return ;
                }
                conn.query("SELECT real_name,iv_key from users where id = "+id+"",function(err,results,fields){
                    conn.release();
                    if (err){
                        console.log(err);
                        rej("server");
                    }
                    
                    else{
                        console.log(results);
                        if (results.length==0){
                            //this should be a problem 
                           res("undefined");
                            console.log(")");
                        }
                        else{
                            console.log("fds"); 
                            let real_name = results[0].real_name;
                            res(aes.decrypt(real_name,crypto,process,results[0].iv_key));
                        }
                        
                    }
                })
            })
            
        }).then((res)=>{
            return res;
        }).catch((err)=>{
            console.log(err);
            return err;
        })
    }
    catch(e){
        return "";
    }    
}

async function has_auth(name){
    //check if user has auth on 
    try{
    return await new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("");
                return ;
            } 
        conn.query("SELECT gauth from users where username = "+mysqlU.escape(name)+" LIMIT 1",function (err,results,field){
            conn.release();
            if (err)
            {
                console.log(err);
                rej("");
            }
            else{
                if (results.length!=0){
                    //this means we may have auth enabled 
                    console.log(results[0]);
                    res(results[0].gauth);
                }
                else 
                res(0);
            }
        })
        })
    }).then((res_code)=>{
        return res_code;
    }).catch((err)=>{
        return "";
    })
}
catch(e){
    return "";
}
}

async function change_auth(name){
    try{
            //remove the salt 
            name = name.substring(4,name.length);
        return await new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err)
                {
                    rej("");
                    return ;
                }
                conn.query("UPDATE users SET gauth = IF(gauth=1, 0, 1) where username = "+mysqlU.escape(name)+"",function(err,results,fields){
                    conn.release();
                    if (err){
                        console.log(err);
                        rej("");
                    }
                    else 
                    {
                        res("");
                    }
            })
            })
            
        }).then((res)=>{
            return {"status":"ok"};
        })
          
    }
    catch(e)
    {
        return {"status":"nok"};
    }
}

async function generate_auth_code(name,otp,query_sring){
    try{
        //remove salt 
        name = name.substring(4,name.length);
        //update an auth key for the user name 
        return await new Promise((res,rej)=>{
            //generate secret key 
            let secret = otp.generateSecret({
                name: process.env.TWO_FA_NAME + " " + query_sring.escape("("+name+")")
            });
            
            pool.getConnection((err,conn)=>{
                if (err){
                    rej("");
                    return ;
                }
                
            conn.query("UPDATE users SET auth_key = "+mysqlU.escape(secret.base32)+" WHERE username = "+mysqlU.escape(name)+" ",function(err,results,fields){
                conn.release();
                if (err){
                   // console.log(err);
                    rej("");
                }
                else{
                    if (results.affectedRows==0){
                        //then there is a problem 
                        res("");

                    }
                    else{
                        //respond with the link
                        res(secret.otpauth_url);
                    }
                }
            })
            })

        }).then((res)=>{
           //console.log(res);
            return res;
        }).catch((err)=>{
            return err;
        })
    }
    catch(e)
    {
        console.log(e);
        return "";
    }
}

async function get_auth_token(name){
    try{
        //we now get the token 
        return await new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
               if (err)
               {
                   rej("");
                   return ;
               }
               conn.query("SELECT auth_key From users where username = "+mysqlU.escape(name)+" ",function(err,results,fields){
                conn.release();
                if (err){
                    console.log(err);
                    rej("");
                }
                else 
                {
                    if (results.length==0){
                        //the is no auth key , this should be an error from server 
                        res("");
                    }
                    else{
                        res(results[0].auth_key);
                    }
                }
            }) 
            })

        }).then((res)=>{
            return res;
        }).catch((err)=>{
            throw (err);
        })
    }
    catch(er){
        console.log(er);
        throw (er);
    }
}

async function get_auth(name){
    try{
        //remove salt
        name = name.substring(4,name.length);
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err)
                {
                    rej("");
                    return ;
                }
                conn.query("SELECT gauth FROM users where username = "+mysqlU.escape(name)+"",function(err,results,fields){
                    conn.release();
                    if (err){
                            rej("");
                    }
                    else{
                        if (results.length==0){
                            res("");
                        }
                        else{
                            if (results[0].gauth==1){
                                res("checked");
                            }
                            else{
                                res("");
                            }
                        }
                    }
                })
            })
            
        }).then((res)=>{
            return res;
        }).catch((err)=>{
            return err;
        })
    }
    catch(e){
        return "";
    }

}

async function generate_iv(){
    //generate the iv 
    let iv = crypto.randomBytes(16).toString("hex");
    //now check if unique 
    return await new Promise((resolve,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err)
            {
                rej("server");
                return ;
            }
            conn.query("SELECT id from users where iv_key = "+mysqlU.escape(iv)+"",function(err,res,fields){
                conn.release();
                if (err || res == null){
                    rej("server");
                }else{
    
                if (res.length==0)
                resolve(iv);
                else{
                    rej('iv');
                }
                }
            })
    
        })
            }).then((iv)=>{
        return iv;
    }).catch(async (err)=>{
        if (err === "server")
        {
            //if server error then quit 
            return err;
        }
        else
        {
            //this means iv is not unqiue ,recall
                  return await generate_iv();
        }
    })
}


//login 
async function login_user(userData){
    try{
        console.log(userData);
                //first hash the pass
    userData['pass'] = await crypto.createHmac("sha256",process.env.HASH_PASS).update(userData['pass']).digest("hex");         
    console.log(userData);
    //now check if creds match with our db
    return await new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err)
          {  rej(0);
            return ;
          }  
        conn.query("SELECT id,account_type,username from users where username = "+mysqlU.escape(userData.name)+" and pass = "+mysqlU.escape(userData.pass)+"",function (err,results,fields){
            console.log(res.length);
            conn.release();
            if (err){
                console.log(err);
                rej(0);
            }
            res(results);
        })
        })    
    })
}
    catch(e){
        return "Server error";
    }
}

async function insert_user(userData,password,otp){
    let err = {};
    if (userData!=null &&  password!=null && password.trim()!=""  && otp!=null){
        //conn = con;
        //mysqlU = mysql;

        //loop through all the insert needed params 
        await new Promise(async (res,rej)=>{
            let needed_elem,c;

            for (index in insert_needed_params){
                needed_elem = insert_needed_params[index];
                if (userData[needed_elem]!=null){
                  {
                      try{
                      if (needed_elem.trim() == "pass_repeat")
                      {
                    c = await eval(register_validation[index])(userData['pass'], userData[needed_elem]);
                      }else
                       c = await eval(register_validation[index])(userData[needed_elem]);
                    
                       if (c!== undefined && c!=null)
                    err[needed_elem] = c;
                  }
                  catch(e)
                  {
                      console.log(e);
                      err['general'] = "Server error!";
                  }
                    }         
                }
                
                else{
                    err[needed_elem] = needed_elem+' is not defined! May be a server error!';
                    }   
            
                }
                console.log(err);
                res();
                
        }).catch((error)=>{
            console.log(error);
        })

            
    }
    else{
        err['general'] = "Server error!Try again later";
    }

    if (Object.keys(err).length==0)
    {
        //proceed inserting user
        //first generate the hashed password 
       userData['pass'] = await crypto.createHmac("sha256",password).update(userData['pass'])
     .digest("hex");

     //now we should create the base 32 code for the google auth
     
     //now encrypt the real_name 
     //generate IV 
     let iv = await generate_iv();
     if  (iv!="server"){
         //if no server error
        //if the iv is ok, proceed encrypting the real_name 
        console.log(iv);
        userData['real_name'] = aes.encrypt(userData['real_name'],crypto,process,iv);
        //now we have all set , register 
            if (await user_to_db(userData,iv) == "ok"){
                //then its ok
            }
            else 
            {
                err['general'] = "Server error! Try again later";
            }
        }
     else 
     {
         //we just set the err
         err['general'] = "Server error! try again later";
     }
     
     
       }
       return err;
}

async function user_to_db(userData,iv){
    //sync 
    //we make a promise and wait for the user to be inserted in our database 
    return await new Promise((resolve,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err)
            {
                rej("Server error!");
                return ;
            }
            
        conn.query("INSERT into users (username,pass,real_name,iv_key,phone_number,email) VALUES ("+mysqlU.escape(userData['name'])+","+mysqlU.escape(userData['pass'])+","+mysqlU.escape(userData['real_name'])+","+mysqlU.escape(iv)+","+mysqlU.escape(serialize_phone(userData.phone_number))+","+mysqlU.escape(userData.email)+")",function(err,res,fields){
            conn.release();
            if (err){
                rej("Server error");
            }
            else 
            {
                resolve();
            }
        })
        })
    }).then(()=>{
        return "ok";
    }).catch((err)=>{
        return err;
    })

}

function check_mail(mail)
{

}

function get_images(table,user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                //run the query 
                if (table.trim() == "user_profile_images" || table.trim() == "user_top_images" || table.trim() == "user_bg_images"){
                conn.query("SELECT * FROM "+table.trim()+" where user_id = "+user_id+" ",(error,results,fields)=>{
                    conn.release();
                    if (error){
                        console.log(error);
                        rej("mysql");
                    }
                    else{
                        //return the results 
                        res(results);
                    }
                })
                }
                else{
                    res({"err":"Illegal!"});
                }
            }
        })
    })
}
function add_image(image_name,table,user_id){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("mysql");
            }
            else{
                //firstly get the image array from user 
                if (table.trim() == "user_profile_images" || table.trim() == "user_top_images" || table.trim() == "user_bg_images")
                conn.query("SELECT * FROM "+table.trim()+" where user_id = "+user_id+" ",(error,results,fields)=>{
                    if (error){
                        conn.release();
                        rej("mysql");
                    }
                    else{
                        if (results.length==0){
                            let aux = [];
                            aux.push({"name":image_name,"date": Date.now(),"show":1});
                            //insert 
                            conn.query("INSERT INTO "+table.trim()+" (user_id,images) VALUES("+user_id+",'"+JSON.stringify(aux)+"')",(error2,res2,fields2)=>{
                                conn.release();
                                if (error2){
                                    console.log(error2);
                                    rej("mysql");
                                }
                                else{
                                    res();
                                }
                            })
                        }
                        else{
                            console.log("update");
                            let aux = JSON.parse(results[0].images);
                            //get max smallest timestamp 
                            let new_aux = [];
                            if (aux.length==5){
                            let min = aux[0].date;

                            for(index in aux){
                                if (aux[index].date<min){
                                    min = aux[index].date;
                                }

                            }
                           
                            //now we have the min
                            for (index in aux){
                                if (aux[index].date!=min){
                                    aux[index].show = 0;
                                    new_aux.push(aux[index]);
                                    
                                }
                            } 
                            new_aux.push({"name":image_name,"date":Date.now(),"show":1});

                        }
                            else{
                                new_aux = aux;
                                for (index in new_aux){
                                    new_aux[index].show = 0;
                                }
                                new_aux.push({"name":image_name,"date":Date.now(),"show":1});
                            }
                            //update 
                            console.log(new_aux);
                            conn.query("UPDATE "+table+" set images = "+mysqlU.escape(JSON.stringify(new_aux))+" where user_id = "+user_id+" ",(error3,res3,f3)=>{
                                conn.release();
                                if (error3){
                                    rej("mysql");
                                }
                                res();
                            })
                        }
                    }
                })
            }
        })
    })
}

    async function get_small_profile(user_id){
        return await new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    res("/assets/images/apppictures/DanIon.jpg");

                }
                else{
                    conn.query("SELECT images from user_profile_images where user_id = "+user_id+" ",(error,results,fields)=>{
                        conn.release();
                        if (error){
                            res("/assets/images/apppictures/DanIon.jpg");

                        }
                        else{
                           // console.log(results);
                            if (results.length!=0){
                                let data = JSON.parse(results[0].images);
                                for (index in data){
                                    if (data[index].show == 1)
                                    res("./profile_uploads/"+data[index].name);
                                }
                                res("/assets/images/apppictures/DanIon.jpg");


                            }
                            else{
                                res("/assets/images/apppictures/DanIon.jpg");
                            }
                        }
                    })
                }
            })
        }).then((response)=>{
            return response;
        }).catch((err)=>{
            return "/assets/images/apppictures/DanIon.jpg";
        })
    }

    async function get_top_profile(user_id){
        return await new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    res("/assets/images/apppictures/profilebannerimg7.jpg");

                }
                else{
                    conn.query("SELECT images from user_top_images where user_id = "+user_id+" ",(error,results,fields)=>{
                        conn.release();
                        if (error){
                            res("/assets/images/apppictures/profilebannerimg7.jpg");

                        }
                        else{
                           // console.log(results);
                            if (results.length!=0){
                                let data = JSON.parse(results[0].images);
                                for (index in data){
                                    if (data[index].show == 1)
                                    res(data[index].name);
                                }
                                res("/assets/images/apppictures/profilebannerimg7.jpg");

                            }
                            else{
                                res("/assets/images/apppictures/profilebannerimg7.jpg");
                            }
                        }
                    })
                }
            })
        }).then((response)=>{
            return response;
        }).catch((err)=>{
            return "/assets/images/apppictures/profilebannerimg7.jpg";
        })
    }


    async function get_bg_profile(user_id){
        return await new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    res("background-color: #9BB7D2");
                    rej("mysql");
                }
                else{
                    conn.query("SELECT images from user_bg_images where user_id = "+user_id+" ",(error,results,fields)=>{
                        conn.release();
                        if (error){
                            res("background-color: #9BB7D2");
                            
                        }
                        else{
                            if (results.length!=0){
                                let data = JSON.parse(results[0].images);
                                for (index in data){
                                    if (data[index].show == 1){
                                    if (data[index].name.startsWith("#")){
                                        res("background-color: "+data[index].name);
                                    }
                                    else
                                        res("background-image: url('./profile_uploads/"+data[index].name+"')");
                                    }
                                }
                                res("background-color: #9BB7D2");
                            }
                            else{
                                res("background-color: #9BB7D2");
                            }
                        }
                    })
                }
            })
        }).then((response)=>{
            return response;
        }).catch((err)=>{
            return "background-color: #9BB7D4";
        })
    }

    function update_show(table,user_id,image_name){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej("mysql");
                }
                else{
                    if (table.trim() == "user_profile_images" || table.trim() == "user_top_images" || table.trim() == "user_bg_images")
{
                    conn.query("SELECT images from "+table.trim()+" where user_id = "+user_id+" ",(error,results,fields)=>{
                        //do not release yet 
                        if (error){
                            conn.release();
                            rej("mysql");
                        }
                        else{
                            if (results.length!=0){
                                let aux = JSON.parse(results[0].images);
                                //now update aux 
                                for (index in aux){
                                    console.log(image_name.trim()+ " "+aux[index].name);
                                    if (aux[index].name == image_name.trim()){
                                        //update the show 
                                        aux[index].show = 1;
                                    }
                                    else{
                                        aux[index].show = 0;
                                    }
                                }
                                console.log(aux);
                                conn.query("UPDATE "+table.trim()+" SET images = "+mysqlU.escape(JSON.stringify(aux))+" where user_id = "+user_id+" ",(err2,res2,f2)=>{
                                    conn.release();
                                    if (err2){
                                        console.log(err2);
                                        rej("mysql");
                                    }
                                    else{
                                        res("");
                                    }
                                })
                            }
                            else
                            {
                                conn.release();
                                res("");
                            }
                        }
                    })
}
else{
    rej("Illegael")
}
                }
            })
        })
    }

    function add_ver(number,user_id,code){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej("mysql");
                }
                else{
                    //firstly we delete if exists another phone waiting validation for this user_id 
                    conn.query("DELETE FROM phone_codes where user_id = "+user_id+" ",(error,results,fields)=>{
                        if (error){
                            conn.release();
                            rej("mysql")
                        }
                        else{
                            //insert 
                            conn.query("INSERT INTO phone_codes (user_id,phone_number,code) VALUES ("+user_id+","+mysqlU.escape(number)+","+code+")",(err2,res2,f2)=>{
                                conn.release();
                                if (err2){
                                    console.log(err2);
                                    rej("mysql");
                                }
                                else{
                                    res("");
                                }
                            })
                        }
                    })
                }
            })
        })
    }

    function add_ver_mail(number,user_id,code){
       
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej("mysql");
                }
                else{
                    //firstly we delete if exists another phone waiting validation for this user_id 
                    conn.query("DELETE FROM email_codes where user_id = "+parseInt(user_id)+" ",(error,results,fields)=>{
                        if (error){
                           
                            conn.release();
                            rej("mysql")
                        }
                        else{
                            //insert 
                            conn.query("INSERT INTO email_codes (user_id,phone_number,code) VALUES ("+user_id+","+mysqlU.escape(number)+","+code+")",(err2,res2,f2)=>{
                                conn.release();
                                if (err2){
                                
                                    rej("mysql");
                                }
                                else{
                                    console.log("RES");
                                    res();
                                }
                            })
                        }
                    })
                }
            })
        })
    }


    function verify_mail_code(user_id,code){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej("mysql");
                }
                else{
                    console.log(code);
                    conn.query("UPDATE users join email_codes on email_codes.code = "+mysqlU.escape(code)+" and email_codes.user_id = "+parseInt(user_id)+" SET users.email = email_codes.phone_number, email_ver = 1 where users.id = "+parseInt(user_id)+" ",(err,results,fields)=>{
                        if (err){
                            console.log(err);
                            conn.release();
                            rej("mysql");
                        }
                        else{
                            if (results.affectedRows==0){
                                conn.release();
                                res({"err":"Codul este greșit!"});
                            }
                            else{
                                //delete then result 
                                conn.query("DELETE from email_codes where user_id = "+user_id+"",(eroare,results2,fierw)=>{
                                    conn.release();
                                    if (eroare){
                                        conn.release();
                                            rej("mysq;");
                                    }else{
                                        res("");
                                    }
                                })
                            }
                        }
                    })
                }
            })
        })
    }
    function verify_phone_code(user_id,code){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej("mysql");
                }
                else{
                    conn.query("UPDATE users join phone_codes on phone_codes.code = "+mysqlU.escape(code)+" and phone_codes.user_id = "+parseInt(user_id)+" set users.phone_number = phone_codes.phone_number, users.phone_ver = 1  where users.id =  "+parseInt(user_id)+" ",(err,results,fields)=>{
                        if (err){
                            console.log(err);
                            conn.release();
                            rej("mysql");
                        }
                        else{
                            if (results.affectedRows==0){
                                conn.release();
                                res({"err":"Cod greșit!"});
                            }
                            else{
                                //delete then result 
                                conn.query("DELETE from phone_codes where user_id = "+user_id+"",(eroare,results2,fierw)=>{
                                    conn.release();
                                    if (eroare){
                                        conn.release();
                                            rej("mysq;");
                                    }else{
                                        res("");
                                    }
                                })
                            }
                        }
                    })
                }
            })
        })
    }

    async function get_account_type(user_id,try_number = 0)
    {
        return await new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{

                }
            })
        })
    }


    async function get_user_data(user_id){
        return await new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();

                }
                else{
                    conn.query("SELECT username,phone_number,email,phone_ver,email_ver,bis_name from users where id = "+user_id+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            if (results.length==0)
                            rej();
                            else
                            res(results[0])
                        }
                    })
                }
            })
        }).then((name)=>{
            return name;
        }).catch((err)=>{
            return "";
        })
    }


    function update_client_data(data,user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    let phone_check,email_check,username_check,real_name_check;
                    phone_check = update_client_phone_number(data.phone.trim(),user_id,conn);
                    email_check = update_client_email(data.email.trim(),user_id,conn);
                    username_check = update_client_username(data.username.trim(),user_id,conn);
                    real_name_check = update_real_name(data.real_name.trim(),user_id,conn);
                    
                    let errors = {};

                    Promise.allSettled([phone_check,email_check,username_check,real_name_check]).then((results)=>{
                        results.map(result=>{
                            if (result.status!="fulfilled")
                            {
                                errors[result.reason.field] = result.reason.reason;
                            }
                        })
                        console.log(errors);
                        if (Object.keys(errors).length==0){
                            
                            let phone_ver,email_ver;
                            //update 'em
                            if (!results[0].value)
                            {
                                //set phone_ver = 1
                                phone_ver = 1;

                            } 
                            else{
                                //set phone_ver = 0
                                phone_ver = 0
                            }
                            if (!results[1].value)
                            {
                                //set email_ver = 1
                                email_ver = 1;

                            } 
                            else{
                                //set email_ver = 0
                                email_ver = 0
                            }

                            //now update 
                            conn.query("UPDATE users set username = "+mysqlU.escape(data.username.trim())+", real_name = "+mysqlU.escape(results[3].value)+", phone_number = "+mysqlU.escape(data.phone.trim())+", email = "+mysqlU.escape(data.email.trim())+",phone_ver = "+phone_ver+", email_ver = "+email_ver+" where id = "+user_id+" ",(err,results,fields)=>{
                                conn.release();
                                if (err){
                                    console.log(err);
                                    rej({"general":"Server error!"});
                                }
                                else{
                                    res();
                                }
                            })

                        }
                        else{
                            conn.release();
                            rej(errors);
                        }
                    })
                }
            })
        })
    }
    function update_client_phone_number(phone,user_id,conn){
        return new Promise((res,rej)=>{
            conn.query("SELECT id from users where phone_number = "+mysqlU.escape(phone.trim())+" ",(err,results,fields)=>{
                if (err){
                    rej({"field":"phone","reason":"Eroare de server"});
                }
                else{
                    if (results.length==0){
                        //it's ok 
                        //we can update 
                        res(true);
                    }
                    else{
                        //if it's the logged user_id then res(rfalse)
                        if (results[0].id == user_id){
                            res(false);
                        }
                        else{
                            rej({"field":"phone","reason":"Numarul este deja folosit!"});
                        }
                    }
                }
            })
        })
    }
    function update_client_email(email,user_id,conn){
        return new Promise((res,rej)=>{
            conn.query("SELECT id from users where email = "+mysqlU.escape(email.trim())+" ",(err,results,fields)=>{
                if (err){
                    rej({"field":"email","reason":"Eroare de server"});
                }
                else{
                    if (results.length==0)
                    {
                        res(true);
                    }
                    else{
                        if (results[0].id == user_id)
                        res(false);
                        else{
                            rej({"field":"email","reason":"Adresa de email este deja folosita"});
                        }
                    }
                }
            })
        })
    }
    function update_client_username(username,user_id,conn){
        return new Promise((res,rej)=>{
            conn.query("SELECT id from users where username = "+mysqlU.escape(username.trim())+" ",(err,results,fields)=>{
                if (err){
                    rej({"field":"username","reason":"Eroare de server"});
                }
                else{
                    if (results.length==0){
                        res();
                    }
                    else{
                            if (results[0].id == user_id){
                                res();
                            }
                            else{
                                rej({"field":"username","reason":"Username este deja folosit"});
                            }
                        
                    }
                }
            })
        })
    }

    function update_real_name(real_name,user_id,conn){
        return new Promise((res,rej)=>{
           //get the iv_key 
           conn.query("SELECT iv_key from users where id = "+user_id+" ",(err,results,fields)=>{
               if (err){
                   rej({"field":"real_name","reason":"Eroare de server"});
               }
               else{
                   //encrypt the real name 
                   if (results.length==0){
                       rej({"field":"real_name","reason":"Eroare de server"});
                   }
                   else{
                       res(aes.encrypt(real_name,crypto,process,results[0].iv_key.trim()).trim());
                   }
               }
           })
        })
    }

    function get_username(user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT username From users where id = "+user_id+" ",(err,results,fields)=>{
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


    function get_farmer_pics(farmer_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT images from user_bg_images where user_id = "+parseInt(farmer_id)+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                        }
                        else{
                            if (results.length!=0)
                            {
                                let images = JSON.parse(results[0].images);
                                images.map(image=>{
                                    if (image.show == 1){
                                        if (!image.name.includes("\\."))
                                        {
                                            res(`linear-gradient(${image.name},${image.name})`);
                                        }
                                        else{
                                        res(`url('${image.name}')`);
                                        }
                                        return;
                                    }
                                })
                            }
                            else{
                                res("linear-gradient(#000000,#000000)");
                            }
                        }
                    })
                }
            })
        })
    }

    function get_farmer_names(farmer_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT bis_name from users where id = "+parseInt(farmer_id)+" ",(err,result,fields)=>{
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

    function get_profile_img(farmer_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                
            if (err){
                rej();
            }
            else{
                conn.query("SELECT images from user_profile_images where user_id = "+parseInt(farmer_id)+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        console.log(err);
                        rej();
                    }
                    else{
                        console.log(results);
                        if (results.length==0){
                            res("/assets/images/apppictures/3.jpg")
                        }
                        else
                        {
                            let images = JSON.parse(results[0].images);
                            let ok = false;

                            images.map(image=>{
                                if (image.show == 1){
                                    console.log(image.name);
                                    res(image.name);
                                    ok = true;
                                    return ;
                                }
                            })
                            
                            if (!ok){
                                res("/assets/images/apppictures/3.jpg")
                            }
                        } 
                    }
                })
            }
        })
        })
    }

    function get_real_name_promise(id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err)
                {
                        rej("server");
                }else
                conn.query("SELECT real_name,iv_key from users where id = "+id+"",function(err,results,fields){
                    conn.release();
                    if (err){
                        rej("server");
                    }
                    
                    else{
                        console.log(results);
                        if (results.length==0){
                            //this should be a problem 
                           rej("undefined");
                        }
                        else{
                            let real_name = results[0].real_name;
                            res(aes.decrypt(real_name,crypto,process,results[0].iv_key));
                        }
                        
                    }
                })
            })
        })
    }


    function get_user_contact_info(user_id){
        return new Promise((res,rej)=>{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT phone_number,email,phone_ver,email_ver from users where id = "+parseInt(user_id)+" ",(err,results,fields)=>{
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
    insert_user,login_user,get_real_name,
    get_auth,change_auth,generate_auth_code,has_auth,get_auth_token,init,get_id,change_pass,check_mail,get_images,add_image,get_small_profile,get_top_profile,get_bg_profile,update_show,
    add_ver,add_ver_mail,verify_mail_code,verify_phone_code,get_user_data,update_client_data,get_username,get_farmer_pics,get_farmer_names,get_profile_img,get_real_name_promise,get_user_contact_info
}