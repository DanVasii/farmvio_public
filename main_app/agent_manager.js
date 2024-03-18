const e = require("express");

var mysql,pool;
mysql = pool = null;

var id_generator = require("order-id")('agent_forms');
var no_verification_needed = ["questions","details","draft"];

function init(p,m){
    pool = p;
    mysql = m;
}


function login(user,pass)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){

                console.log(err);
                rej();
            }
            else
            {
                conn.query("SELECT id from agents where user = "+mysql.escape(user)+" and pass = "+mysql.escape(pass.trim())+" LIMIT 1",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej();
                    }
                    else{
                        console.log(results);
                        if (results.length==1)
                        {
                            res(results[0].id);
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
                conn.query("SELECT cc_forms.id as c_id from cc_forms where cc_forms.unique_id = "+mysql.escape(req_id)+" UNION all select id from req_farmers where req_farmers.unique_id= "+mysql.escape(req_id)+" ",(err,results,fields)=>{
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

function username_validate(username){
    return new Promise((res,rej)=>{
        let field = "username";
        //username must be unqiue 
        if (username.trim()!="")
        {
            //check if unqiue 
            pool.getConnection((err,conn)=>{
                if (err){
                    rej({"err":"Eroare server! Server aglomerat, reincearca!",field})
                }
                else{
                    conn.query("SELECT id from users where username = "+mysql.escape(username)+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej({"err":"Eroare de server! Suna-l pe Dan!",field})
                        }
                        else{
                            if (results.length==0)
                            res();
                            else{
                                rej({"err":"Numele de utilizator nu este unic!",field});
                            }
                        }
                    })
                }
            })
        }
        else{
            rej({"err":"Numele de utilizator nu este completat!",field})
        }
    })
}

function real_name_validate(real_name)
{
    return new Promise((res,rej)=>{
        let field = "real_name";
        //only check if ok
        if (real_name.trim()!="")
        {
            res();
        }
        else{
            rej({"err":"Numele si prenumele nu este completat!",field})
        }
    })
}

function phone_number_validate(phone)
{
    return new Promise((res,rej)=>{
        //unqiue and compl
        let field = "phone_number";
        if (phone.trim()!="")
        {
            //check if unqiue 
            pool.getConnection((err,conn)=>{
                if (err){
                    rej({"err":"Eroare server! Server aglomerat, reincearca!",field})
                }
                else{
                    conn.query("SELECT id from users where phone_number = "+mysql.escape(phone)+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej({"err":"Eroare de server! Suna-l pe Dan!",field})
                        }
                        else{
                            if (results.length==0)
                            res();
                            else{
                                rej({"err":"Numarul de telefon nu este unic!",field});
                            }
                        }
                    })
                }
            })
        }
        else{
            rej({"err":"Numarul de telefon nu este completat!",field})
        }
    })
}

function mail_validate(mail)
{
    return new Promise((res,rej)=>{
        let field = "mail";
        if (mail.trim()!="")
        {
                   //check if unqiue 
                   pool.getConnection((err,conn)=>{
                    if (err){
                        rej({"err":"Eroare server! Server aglomerat, reincearca!",field})
                    }
                    else{
                        conn.query("SELECT id from users where email = "+mysql.escape(mail)+" ",(err,results,fields)=>{
                            conn.release();
                            if (err){
                                rej({"err":"Eroare de server! Suna-l pe Dan!!!",field})
                            }
                            else{
                                if (results.length==0)
                                res();
                                else{
                                    rej({"err":"Emailul nu este unic!",field});
                                }
                            }
                        })
                    }
                })
        }
        else{
            rej({"err":"Email-ul nu este completat!",field});
        }
    })
}

function judet_validate(judet){
    return new Promise((res,rej)=>{
        let field = "judet";
        if (judet.trim()!="")
        {
            res();
        }
        else{
            rej({"err":"Judetul nu este completat!",field});
        }
    })
}

function oras_validate(oras)
{
    return new Promise((res,rej)=>{
        let field = "oras";
        if (oras.trim()!="")
        {
            res();
        }
        else{
            rej({"err":"Orasul nu este completat!",field});
        }
    })
}

function addr_validate(addr){

    return new Promise((res,rej)=>{
    let field = "addr";
        if (addr.trim()!="")
        {
            res();
        }
        else{
            rej({"err":"Adresa nu este completata!",field});
        }
    })
}

function cui_validate(cui)
{
    return new Promise((res,rej)=>{
        let field = "cui";
        if (cui.trim()!="")
        {
            pool.getConnection((err,conn)=>{
                if (err)
                {
                    rej({"err":"Eroare server! Server aglomerat, reincearca!",field})
                }
                else{
                    conn.query("SELECT id from req_farmers where cui = "+mysql.escape(cui)+" and status!=2 ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej({"err":"Eroare de server! Suna-l pe Dan!!",field});
                        }
                        else{
                            if (results.length==0)
                            {
                                res();
                            }
                            else{
                                rej({"err":"Deja exista o cerere cu acest cui! Utilizatorul nu este unic sau firma lui este deja inscrisa de altcineva! Suna-l pe Dan !",field});
                            }
                        }
                    })
                }
            })
        }
        else{
            rej({"err":"Acest câmp trebuie completat!",field});
        }
    })
}

function nume_firma_validate(nume_firma)
{
    return new Promise((res,rej)=>{
        let field = "nume_firma";
        if (nume_firma.trim()!="")
        {
            pool.getConnection((err,conn)=>{
                if (err){
                    rej({"err":"Eroare server! Server aglomerat, reincearca!",field})
                }
                else{
                    conn.query("SELECT id from req_farmers where nume_firma = "+mysql.escape(nume_firma)+" and status!=2 ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej({"err":"Eroare de server! Suna-l pe Dan!!",field});
                        }
                        else{
                            if (results.length==0)
                            {
                                res();
                            }
                            else{
                                rej({"err":"Deja exista o cerere cu acest nume de firma! Utilizatorul nu este unic sau firma lui este deja inscrisa de altcineva! Suna-l pe Dan SAU propune-i sa mai adauage la numele firmei orasul din care este firma: de ex: Magazinul de rosii Braaila SRL/PFA etc !",field});
                            }
                        }
                    })
                }
            })
        }
        else{
            rej({"err":"Numele firmei nu este completat!",field});
        }
    })
}

function cats_sel_validate(cats)
{
    return new Promise((res,rej)=>{
        let field = 'cats_sel';
        if (cats.trim()!="")
        {   
            res();
        }
        else 
        {
            rej({"err":"Categoriile  trebuie completate!",field})
        }
    })
}

function validate_data(data,agent)
{   
    return new Promise((res,rej)=>{
        let validation_promises = [];
        Object.keys(data).map((key)=>{
            if(no_verification_needed.indexOf(key)==-1)
            {
                //veirifcation needed
            try{
                if (key == "cui")
                {
                    if (!agent)
                    {
                        validation_promises.push(eval(key+"_validate")(data[key]));
                    }
                }
                else
                validation_promises.push(eval(key+"_validate")(data[key]));
            }
            catch
            {

            }

            }
        })

        let errors = [];
        Promise.allSettled(validation_promises).then((response)=>{
          response.map((resp)=>{
              if (resp.status!="fulfilled")
              {
                errors.push(resp.reason);
              }
          })
          res(errors);
        })
    })
}


function insert_form_in_db(data,id,code)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("INSERT INTO cc_forms (unique_id,username,nume,email,tel,judet,oras,adresa,cui,nume_firma,sold_cats,sent_by,questions,u_code) VALUES ("+mysql.escape(id)+","+mysql.escape(data.username)+","+mysql.escape(data.real_name)+","+mysql.escape(data.mail)+","+mysql.escape(data.phone_number)+","+mysql.escape(data.judet)+","+mysql.escape(data.oras)+","+mysql.escape(data.addr)+","+mysql.escape(data.cui)+","+mysql.escape(data.nume_firma)+","+mysql.escape(data.cats_sel)+",1,"+mysql.escape(data.questions)+","+mysql.escape(code)+") ",(err,results,fields)=>{
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

function insert_draft_in_db(data,id)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("INSERT INTO cc_forms_drafts (unique_id,username,nume,email,tel,judet,oras,adresa,cui,nume_firma,sold_cats,sent_by,questions) VALUES ("+mysql.escape(id)+","+mysql.escape(data.username)+","+mysql.escape(data.real_name)+","+mysql.escape(data.mail)+","+mysql.escape(data.phone_number)+","+mysql.escape(data.judet)+","+mysql.escape(data.oras)+","+mysql.escape(data.addr)+","+mysql.escape(data.cui)+","+mysql.escape(data.nume_firma)+","+mysql.escape(data.cats_sel)+",1,"+mysql.escape(data.questions)+") ",(err,results,fields)=>{
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

function insert_avize_details(details)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                //build the quesy 
                let query = "INSERT INTO avize_details (file_name,det) VALUES ";

                Object.keys(details).map((file_name)=>{
                    query+= `("${file_name}","${details[file_name]}"),`;
                })

                //remove the last comma 
                query = query.substring(0,query.length-1);

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

function check_id_and_code(id,code)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err)
            {
                rej();
            }
            else{
                conn.query("SELECT id from cc_forms where unique_id = "+mysql.escape(id)+" and u_code = "+mysql.escape(code)+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej(500);
                    }
                    else{
                        if (results.length==0)
                        rej(404);
                        else{
                            res();
                        }
                    }
                })
            }
        })
    })
}

function check_authenticity(sc,sic,email)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT username,nume,email,tel,judet,oras,adresa,cui,nume_firma from cc_forms where unique_id = "+mysql.escape(sic)+" and u_code = "+mysql.escape(sc)+" and email = "+mysql.escape(email)+" and status = 0 ",(err,results,fields)=>{
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


function update_data(data,sc,sic)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err)
            {
                rej();
            }
            else{
                let trans = {
                    "phone_number": "tel",
                    "real_name": "nume",
                    "mail":"email",
                    "addr":"adresa"
                }
                //build the query 
                let query = "UPDATE cc_forms SET ";
                Object.keys(data).map((key)=>{
                    if (key!="sc" && key!="sic"){
                        //go on 
                        query += `${ trans[key] ? trans[key] : key } = ${mysql.escape(data[key])},`;
                    }
                })
                query = query.substring(0,query.length-1);
                query += " WHERE u_code = "+mysql.escape(sc)+" and unique_id = "+mysql.escape(sic)+" ";
                console.log(query);
                conn.query(query,(err,results,fields)=>{
                    conn.release();
                    if (err)
                        {
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

function insert_farmer_account(sc,sic,pass,aes,crypto,process,fs){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err)
            {
                rej();
            }
            else{
                //get the infos 
                conn.query("SELECT * from cc_forms where u_code = "+mysql.escape(sc)+" and unique_id = "+mysql.escape(sic)+" and status = 0 ",(err,results,fields)=>{
                    if (err)
                    {
                        conn.release();
                        rej();
                    }
                    else{
                        if (results.length!=0)
                        {
                            let status = 3;
                            //check if he has the certs and avize 
                            if (fs.existsSync("./certs/"+sic.trim()+".frv") && fs.existsSync("./avize_pics/"+sic.trim()+"--0.frv"))
                                status = 1;

                            //hash the pass
                            pass = aes.hash_pass(pass,process.env.HASH_PASS);
                            //encrypt the name
                            let iv = aes.generate_iv();
                            let real_name = aes.encrypt(results[0].nume,crypto,process,iv);
                           let req_farmers_sold_cats = JSON.stringify(results[0].sold_cats.split(","));
                           let nume_firma = results[0].nume_firma;
                           let cui = results[0].cui;
                            //insert into req_farmers 

                            conn.query("INSERT INTO req_farmers (unique_id,nume,prenume,email,tel,judet,oras,adresa,cui,nume_firma,sold_cats,status,sent_at,sent_by) VALUES("+mysql.escape(results[0].unique_id)+","+mysql.escape(results[0].nume)+",'',"+mysql.escape(results[0].email)+","+mysql.escape(results[0].tel)+","+mysql.escape(results[0].judet)+","+mysql.escape(results[0].oras)+","+mysql.escape(results[0].adresa)+","+mysql.escape(results[0].cui)+","+mysql.escape(results[0].nume_firma)+","+mysql.escape(req_farmers_sold_cats)+","+mysql.escape(status)+","+mysql.escape(results[0].sent_at)+",'-1') ",(err,r,fields)=>{
                                if (err){
                                    conn.release();
                                    rej();
                                }
                                else{
                                    conn.query("INSERT INTO users (username,pass,real_name,iv_key,phone_number,email,bis_name,account_type) VALUES("+mysql.escape(results[0].username)+","+mysql.escape(pass)+","+mysql.escape(real_name)+","+mysql.escape(iv)+","+mysql.escape(results[0].tel)+","+mysql.escape(results[0].email)+","+mysql.escape(results[0].nume_firma)+",'1')",(err,results,fields)=>{
                                        if (err){
                                            conn.release();
                                            rej();
                                        }
                                        else{
                                            //insert the slug 
                                            conn.query("INSERT INTO farmer_slugs (slug,user_id) VALUES (CONCAT(LOWER(REPLACE("+mysql.escape(nume_firma)+",' ','-')),'-',REPLACE("+mysql.escape(cui)+",'RO','')),"+results.insertId+")  ",(err,r2,f)=>{
                                                if (err){
                                                    conn.release();
                                                    rej(err);
                                                }
                                                else{
                                                                //update the status 
                                                    conn.query("UPDATE cc_forms set status = 1,farmer_id = "+mysql.escape(results.insertId)+" WHERE u_code = "+mysql.escape(sc)+" and unique_id = "+mysql.escape(sic)+" ",(err,r,f)=>{
                                                        if (err)
                                                        {
                                                            //remove 
                                                            conn.query("DELETE from users where id = "+mysql.escape(results.insertId)+" ",()=>{
                                                            
                                                                conn.release();
                                                                //LOG THIS 
                                                                rej();
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
                                    })
                                }
                            })

                    

                        }
                        else{
                            conn.release();
                            rej();
                        }
                    }
                })
            }
        })
    })
}


function get_sent(start,limit,conds){
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

                conn.query("SELECT status,unique_id,username,nume,email,tel,judet,oras,adresa,cui,nume_firma,(SELECT user from agents where id = cc_forms.sent_by) as sent_by from cc_forms  "+where+" ORDER BY sent_at DESC LIMIT "+start+","+limit+"  ",(err,results,fields)=>{
                    
                    if (err){
                        console.log(err);
                        conn.release();
                        rej();
                    }
                    else{
                        conn.query("SELECT COUNT(id) as total from cc_forms ",(err,results2,fields)=>{
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

function get_drafts(start,limit,conds){
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

                conn.query("SELECT unique_id,username,nume,email,tel,judet,oras,adresa,cui,nume_firma,(SELECT user from agents where id = cc_forms_drafts.sent_by) as sent_by from cc_forms_drafts  "+where+" LIMIT "+start+","+limit+" ",(err,results,fields)=>{
                    
                    if (err){
                        console.log(err);
                        conn.release();
                        rej();
                    }
                    else{
                        conn.query("SELECT COUNT(id) as total from cc_forms ",(err,results2,fields)=>{
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


function get_mail_info(id)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT email,nume,unique_id,u_code from cc_forms where unique_id = "+mysql.escape(id.trim())+" and status = 0 ",(err,results,fields)=>{
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
                            res(results[0]);
                        }
                    }
                })
            }
        })
    })
}

function get_full_data(id)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT * from cc_forms_drafts where unique_id = "+mysql.escape(id.trim())+" ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        rej();
                    }
                    else{
                        if (results.length==0)
                        rej();
                        else{
                            res(results[0]);
                        }
                    }
                })
            }
        })
    })
}

function is_id_unique(draft)
{
    return new Promise((res,rej)=>{
        if (draft.trim()=="")
        res();
        else{
            pool.getConnection((err,conn)=>{
                if (err){
                    rej();
                }
                else{
                    conn.query("SELECT id from cc_forms where unique_id="+mysql.escape(draft.trim())+" ",(err,results,fields)=>{
                        conn.release();
                        if (err)
                        rej();
                        else{
                            if (results.length==0)
                            res();
                            else
                            rej();
                        }
                    })
                }
            })
        }
    })
}

function remove_draft(draft)
{
    return new Promise((res,rej)=>{
        if (draft.trim()=="")
        res();
        else{
            pool.getConnection((err,conn)=>{
                if (err)
                rej();
                else{
                    conn.query("DELETE FROM cc_forms_drafts where unique_id = "+mysql.escape(draft.trim())+" ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            //log
                        }
                        res();
                    })
                }
            })
        }
    })
}

function move_to_draft(id)
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("INSERT INTO cc_forms_drafts (unique_id,username,nume,email,tel,judet,oras,adresa,cui,nume_firma,sold_cats,sent_by,questions) (SELECT unique_id,username,nume,email,tel,judet,oras,adresa,cui,nume_firma,sold_cats,sent_by,questions from cc_forms where unique_id = "+mysql.escape(id)+" and status = 0) ",(err,results,fields)=>{
                    conn.release();
                    if (err){
                        console.log(err);
                        rej();
                    }
                    else{
                        if (results.insertId == 0)
                        rej();
                        else
                        res();
                    }
                })
            }
        })
    })
}

function remove_form(id)
{
    return new Promise((res,rej)=>{    
            pool.getConnection((err,conn)=>{
                if (err)
                rej();
                else{
                    conn.query("DELETE FROM cc_forms where unique_id = "+mysql.escape(id.trim())+" and status = 0 ",(err,results,fields)=>{
                        conn.release();
                        if (err){
                            rej();
                            //log
                        }
                        res();
                    })
                }
            })
        
    })
}
module.exports = {
    init,login,get_unique_request_id,validate_data,insert_form_in_db,insert_avize_details,check_id_and_code,check_authenticity,update_data,insert_farmer_account,insert_draft_in_db,get_sent,
    get_mail_info,get_drafts,get_full_data,is_id_unique,remove_draft,remove_form,move_to_draft
}