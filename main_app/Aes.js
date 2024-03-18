
const crypto = require("crypto");
const kyc_key  = crypto.createHash("sha256").update(String("test")).digest("base64").substr(0,32);
const fs = require("fs");

function encrypt(text,crypto,process,iv = null) {
    //use the same
    if (iv==null)
    iv = process.env.JWT_IV;
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.AES_PASS,'hex'),Buffer.from(iv,"hex"));
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString("hex");
   }
   
   function decrypt(text,crypto,process,iv=null) {
    if (iv==null)
    {
        iv = process.env.JWT_IV;
    }
    let encryptedText = Buffer.from(text, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.AES_PASS,"hex"), Buffer.from(iv,"hex"));
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
   }


   function encrypt_file(buffer,buffer_type){
       console.log(buffer_type)
    let iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv("aes-256-ctr",kyc_key,iv);
    let result = Buffer.concat([iv,buffer_type,cipher.update(buffer),cipher.final()]);
    return result;
   }

   function saveFile(buffer,where)
   {
       return new Promise((res,rej)=>{
        fs.writeFile(where,buffer,function(err){
            if (err){
                rej(err);
            }
            else{
                res();
            }
        });
       })
   }

   function generate_iv()
   {
       return crypto.randomBytes(16).toString("hex");
   }

   function hash_pass(user_pass,hash_pass)
   {
    return  crypto.createHmac("sha256",hash_pass).update(user_pass.trim()).digest("hex");
   }
   module.exports = {
       encrypt,decrypt,encrypt_file,saveFile,generate_iv,hash_pass
   }