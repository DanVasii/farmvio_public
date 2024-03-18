var cats;
$(document).ready(function(){

    populate_cats();

    $(".cats_holder").on("click",".fa-times",function(elem){
        let c = confirm("Sigur vrei sa stergi categoria si toate sub-categoriile sale?");

        if (c)
        {
            delete_cat(elem.currentTarget.parentElement);
           // elem.currentTarget.parentElement.remove();
        }
    })

    $(".cats_holder").on("click",".confirm_cat",function(elem){
        
        let cat = elem.currentTarget.parentElement.querySelector("input").value;
        console.log(cat);
        let parent_id = elem.currentTarget.parentElement.parentElement.parentElement.dataset.parent_id;
        
        insert_cat(cat,parent_id,elem);
        
        //remove this input group 
        
    })

    $(".cats_holder").on("click",".confirm_cat_main",function(elem){
        
        let cat = elem.currentTarget.parentElement.querySelector("input").value;
        
        insert_cat(cat,0,elem);
        
    })


    $(".cats_holder").on("click",".add_cat",function(elem){
        let parent = elem.currentTarget.parentElement;
        //add the input 
       // console.log(parent);
        //add 
        let cat_level,input,group,button;
        //add the delete 

        cat_level = document.createElement("div");
        cat_level.className = "cat_level";

        let del;
        del = document.createElement("i");
        del.className = "fas fa-times";

        cat_level.appendChild(del);


        group = document.createElement("div");
        group.className = "input-group";

        button = document.createElement("button");
        button.className = "btn btn-xs btn-primary confirm_cat";
        let t = document.createTextNode("\u2713");
        button.appendChild(t);
        group.appendChild(button);
        
        input = document.createElement("input");

        input.type = 'text';
        input.className = "form-control form-control-sm";
        group.appendChild(input);
        
        cat_level.appendChild(group);

        console.log(parent.querySelectorAll(".add_cat")[0]);
        let len = parent.querySelectorAll(".add_cat").length;
        parent.insertBefore(cat_level,parent.querySelectorAll(".add_cat")[len-1])

    })

    $(".cats_holder").on("mouseover",".cat_level",function(elem){
        if (elem.target.className != "cat_level")
        {
            elem.target.parentElement.style.backgroundColor = "rgba(100, 149, 237,0.4)";
            elem.target.parentElement.querySelector(".fa-times").style.display = "block";
        }
            else{
        elem.target.style.backgroundColor = "rgba(100, 149, 237,0.4)";
        elem.target.querySelector(".fa-times").style.display = "block";
            }
    })
    
    $(".cats_holder").on("mouseout",".cat_level",function(elem){
        if (elem.target.className != "cat_level"){
        elem.target.parentElement.style.backgroundColor = "white";
        elem.target.parentElement.querySelector(".fa-times").style.display = "none";    
    }
            else{
        elem.target.style.backgroundColor = "white";
        elem.target.querySelector(".fa-times").style.display = "none";
            }
    })
})


function populate_cats()
{
    $.ajax({
        url: "/get_cats_all",
        type: "POST",
        contentType: "application/json",
        success: function (data){
            cats = data;
            //console.log(cats);
            get_adjacent();
        }
    })
}


function insert_cat(cat,parent_id,elem){
    $.ajax({
        url: "/insert_cat",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"parent":parent_id,"cat":cat}),
        success: function(data){
            if (data.id)
            {
                //add
                
        let span,button;
        span = document.createElement("span");
        span.textContent = cat;
        span.className = "main_cat";
        
        button = document.createElement("button");
        button.className = "btn btn-primary btn-xs add_cat";
        button.textContent = "Adauga categorie";
        button.title = "Adauga la "+cat;

        elem.currentTarget.parentElement.parentElement.dataset.parent_id = data.id;

        let del;
        del = document.createElement("i");
        del.className = "fas fa-times";

        elem.currentTarget.parentElement.parentElement.appendChild(del);
        elem.currentTarget.parentElement.parentElement.appendChild(span);
        elem.currentTarget.parentElement.parentElement.appendChild(button);
        //append he button to
        elem.currentTarget.parentElement.remove();

            }
        },error: function(){
            alert("Eroare !");
        }
    })
}

function get_adjacent()
{
    $.ajax({
        url: "/get_adjacent",
        type: "POST",
        contentType: "application/json",
        success: function(data){
            let span,cat_level,button,frag;

            frag = document.createDocumentFragment();

                data.map(pair=>{
                //for each pair we create a cat_level
                let parent,child;
                parent = pair.parent;
                child = pair.child;

                    cat_level = document.createElement("div");
                    cat_level.className = "cat_level";
                    cat_level.dataset.parent_id = child;

                    let del;
                    del = document.createElement("i");
                    del.className = "fas fa-times";

                    cat_level.appendChild(del);
                    //add the span 
                    span = document.createElement("span");
                    span.className = "main_cat";
                    span.textContent = get_cat_name(child);
                    
                    //add the button 
                    
                    button = document.createElement("button");
                    button.className = "btn btn-primary btn-xs add_cat";
                    button.textContent = "Adauga categorie";
                    button.dataset.parent_id = child;
                    button.title = "Adauga la "+get_cat_name(child);

                    cat_level.appendChild(span);

                    cat_level.appendChild(button);

                    if (parent == 0)
                    {
                        //just add 
                        frag.appendChild(cat_level);    
                    }
                    else{
                        //add to parent 
                        frag.querySelector(".cat_level[data-parent_id='"+parent+"']").insertBefore(cat_level,frag.querySelector(".cat_level[data-parent_id='"+parent+"'] button[data-parent_id='"+parent+"']"));
                    }

                })

                //append the frag 
                document.querySelector(".cats_holder").insertBefore(frag,document.querySelector(".cats_holder .btn-success"));

        }
    })
}


function delete_cat(cat)
{
    let cat_id = cat.dataset.parent_id;


    $.ajax({
        url: "/delete_cat",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({"cat_id":cat_id}),
        success: function ()
        {
            cat.remove();
        },error: function(){
            alert("Eroare!");
        }
    })
}

function get_cat_name(cat_id)
{
    for (index in cats)
    {
        if (cats[index].id == cat_id)
        return cats[index].categorie;
    }
    
}


function insert_main_cat()
{
    
    let cat_level,input,group,button;
    //add the delete 
    cat_level = document.createElement("div");
    cat_level.className = "cat_level";

    let del;
    del = document.createElement("i");
    del.className = "fas fa-times";

    cat_level.appendChild(del);

    group = document.createElement("div");
    group.className = "input-group";

    button = document.createElement("button");
    button.className = "btn btn-xs btn-primary confirm_cat_main";
    let t = document.createTextNode("\u2713");
    button.appendChild(t);
    group.appendChild(button);
    
    input = document.createElement("input");

    input.type = 'text';
    input.className = "form-control form-control-sm";
    group.appendChild(input);
    
    cat_level.appendChild(group);

    document.querySelector(".cats_holder").insertBefore(cat_level, document.querySelector(".cats_holder .btn-success"));
}