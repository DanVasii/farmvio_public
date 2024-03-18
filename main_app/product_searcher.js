var mysql,pool;

var maxCon = 2;

mysql = pool = null;

function init(p,m){
    pool = p;
    mysql = m;
}

function get_best_match_price(list_words, retry = 0){
    //query this out 
    return new Promise((res,rej)=>{
        if (maxCon<1){ 
            rej(retry);
        }
        else{
            //first prepare the data 
            let words = "";
            for (index in list_words){
                words+= list_words[index].item.trim() + " ";
            }
            pool.getConnection((err,conn)=>{
                if (err){
                    rej(retry);
                }
                else{
                    maxCon--;
                    conn.query("SELECT id,name,description,price,Match(name,description) AGAinst("+mysql.escape(words)+" in natural language mode ) as score  from frv_prods where Match(name,description) AGAinst("+mysql.escape(words)+" in natural language mode ) ORDER By score DESC LIMIT 1 ",(err,result,fields)=>{
                        if (err){
                            //you do not have what to do here, no reason to retry
                            rej(5);
                        }
                        else{
                            conn.release();
                            maxCon++;
                            res(result);
                        }
                    })
                }
            })
        }
    })
}

module.exports = {
    init,get_best_match_price
}
