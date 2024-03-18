const workerPool = require("workerpool");
const fs = require("fs");
const fuse = require('fuse.js');

const search_options = {
    includeScore: true,
    threshold: 0.35
};

var init_done = false;
var files = [];
var fuse_instances = [];


const WORDS_LIMIT = 10000;

function init()
{
    try{
    //open all the dictionary json files 
   let  files_dir = fs.readdirSync('./dic');
    if (files_dir.length!=0){
        let index = 0;
    files_dir.forEach(function(file) {
        var contents = fs.readFileSync('./dic/' + file, 'utf8');
        files[index] = JSON.parse(contents);
        fuse_instances[index] = new fuse(files[index],search_options);
        index++;

      })
      
    }
    else{
        //we just create the object 
        files[0] = [];
    }
    init_done = true;
    
}
catch(err){
    console.log(err);
    files[0] = [];
    init_done = true;
}
}

init();

function find_matching_words(word,try_number = 0){
    return new Promise((res,rej)=>{
        try{
            //we now search whit word through every fuse_instance
            let results = [];
            let insatnce_res;
            for (index in fuse_instances)
            {
                insatnce_res = fuse_instances[index].search(word);          
                //append first 5 results to the results
                for (i = 0; i < ((insatnce_res.length<5) ? insatnce_res.length : 5);i++)
                {
                    results.push(insatnce_res[i]);
                }
            }
            //now sort results 
            
            results = results.sort((a,b)=> parseFloat(a.score) - parseFloat(b.score));
      
            //return first five 
            res((results.length<5) ? results : results.slice(0,4));
        }
        catch(err){
            console.log(err);
            if (try_number!=3)
            find_matching_words(word,try_number+1);
            else{
                rej();
            }
        }
    })
    
}

function add_words(list){
 
       try{
           if (init_done){
    //add every word 
    //first strip all the special chars 
    list = list.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
    let words = list.split(" ");
    let ok;

    for (word in words){
        word = words[word].toLowerCase().trim();
        if (word!=""){
    //we check in every files if this word exists 
        ok = false;
    for (let file in files){
            let file_aux = files[file];
            if (file_aux.indexOf(word.trim()) !=-1 )
            {
                //we found it , 
                ok = true;
                break;
            }
        }

        if (!ok){
            //we did not find it , so we need to add it 
          
            if (files[files.length-1].length >= WORDS_LIMIT){
               
                // we can create another 
                //check if the other index is full to
                ok = false;

                for (file_index in files){
                    if (files[file_index].length<WORDS_LIMIT)
                    {
                        ok = true;
                        //add to this index      
                        files[file_index].push(word.trim());
                        //add to fuse_instance to
                        fuse_instances[index].add(word.trim()); 
                        break;
                    }
                }
                
                if (!ok){
                    //we did not find an empty index , then create a new one 
                    
                    files[files.length] = [];
                    files[files.length - 1].push(word.trim());
                    //create new fuse_instace 
                    fuse_instances[files.length - 1] = new Fuse([],search_options);
                    //add to fuse_instance to
                    fuse_instances[files.length - 1].add(word.trim()); 
                }
            }
            else{
                files[files.length-1].push(word.trim());             
                fuse_instances[files.length - 1].add(word.trim()); 
            }
        }
        //we always dump the last index, so we won't lose any word
    }
}
dump_array(files[files.length-1],files.length-1);
           }
           else{
               console.log("intiing now");
               init();
               add_words(list);
           }
       }
       catch(err){
           //we dump everything 
           for (file_index in files){
               console.log("we are dumping here");
               dump_array(files[file_index],file_index);

           }
           //after this we can re_init 
           init_done = false;
       }
      
}

    function dump_array(dictionary_part,file_index,try_number = 0){
        //write the file 
        if (dictionary_part.length!=0){

        fs.writeFile('./dic/words_'+file_index+".txt",JSON.stringify(dictionary_part),function(err){
            
            if (err){
                console.log(err);
                //we should retry
                if (try_number!=3){
                    dump_array(dictionary_part,file_index,try_number + 1);
                }
                console.log("Error writing the dictionary files!");
            }
            else{

              //  console.log("Words written successfully "+file_index)
            }
        })

    }
    }



      
workerPool.worker({
    add_words,find_matching_words
})