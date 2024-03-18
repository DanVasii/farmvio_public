
var mysql,pool;

mysql = pool = null;

function init(p,m){
    pool = p;
    mysql = m;
}



async function search_county(pool,county_name){
    return await new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej("server");
                
            }
            else{
                conn.query("SELECT judet FROM localitati WHERE judet LIKE "+county_name+" GROUP BY judet LIMIT 5",(err,result,field)=>{
                    conn.release();
                    if (err){
                        rej("server");

                    }
                    else{
                        res(JSON.stringify(result));
                    }
                } )
            }
        })
    }).then((data)=>{
        return data;
    }).catch((err)=>{
        return "server";
    })
}

async function search_city(pool,city_name,county){
    //returns json
    return await new Promise((res,rej)=>{
        //get the conn
        pool.getConnection((err,conn)=>{
            if (err){
                rej("Server error!");
                return ;
            }
            else{
                //we have a connection run the query 
                console.log(county);
                let c_part;
                if (county.trim()!="''"){
                     c_part = " and judet = "+county+" ";
                    console.log("yes");
                }
                else{
                     c_part = "";
                }

                conn.query("SELECT * FROM localitati WHERE nume LIKE "+city_name+" "+c_part+" ORDER BY populatie DESC LIMIT 5",(err,result,fields)=>{
                    conn.release();
                    if (err){
                        console.log(err);
                        rej("Server error!");

                    }

                    else  if (result.length!=0){
                        
                        res(JSON.stringify(result));
                        
                    }
                    else{
                        res(JSON.stringify(result));
                    }
                })
            }
        })
    }).then((response)=>{
        return response;
    }).catch((error)=>{
        return error;
    })
}


function county_ok(county,conn,mysql,try_number = 0){
    return new Promise((res,rej)=>{
        console.log(county);
        conn.query("SELECT id FROM localitati where judet = "+mysql.escape(county)+" LIMIT 1",(err,results,fields)=>{
            if (err){
                console.log(err);
                //we have an error, then try this one more time 
                if (try_number!=3){
                    return county_ok(county,conn,mysql,try_number+1);
                }
                else
                rej();
            }
            
            else{
                res(results.length);
            }
        })
    })
}

function city_ok(city,county,conn,mysql,try_number){
    return new Promise((res,rej)=>{
        conn.query("SELECT id FROM localitati where judet = "+mysql.escape(county)+" AND nume = "+mysql.escape(city)+" LIMIT 1",(err,results,fields)=>{
            if (err){
                //we have an error, then try this one more time 
                if (try_number!=3){
                    return city_ok(city,county,conn,mysql,try_number+1);
                
                }
                else
                rej();
            }
                else{
                    res(results.length);
                }
            
        })
    })
}


function search_county_promise(judet){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT * from judete where name LIKE "+mysql.escape('%'+judet.trim()+'%')+" LIMIT 6",(err,results,fields)=>{
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

function get_county(county){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT judet from localitati where judet like "+mysql.escape(county.trim()+'%')+" GROUP BY judet limit 5 ",(err,results,fields)=>{
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

function get_city(county,city){
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                console.log(err);
                rej();
            }
            else{
                console.log(county+ " "+city)
                conn.query("SELECT nume,judet from localitati where nume like "+mysql.escape('%'+city.trim()+'%')+" "+((county.trim()!="") ? " and judet LIKE "+mysql.escape(county.trim()+'%')+" " : "") +" order by LENGTH(judet) ASC, populatie DESC limit 10  ",(err,results,fields)=>{
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


function get_all_judete()
{
    return new Promise((res,rej)=>{
        pool.getConnection((err,conn)=>{
            if (err){
                rej();
            }
            else{
                conn.query("SELECT @count := @count+1 as id,name as text from judete cross join (select @count := 0) r",(err,results,fields)=>{
                    conn.release();
                    if (err)
                    rej();
                    else
                    res(results);
                })
            }
        })
    })
}

module.exports = {
    init,search_city,search_county,county_ok,city_ok,get_county,get_city,search_county_promise,get_all_judete
}