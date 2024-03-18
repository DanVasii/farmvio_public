function tutorial()
{
    this.clones = null;
    Array.from(document.querySelectorAll("*:not(.tutorial_text p, .tutorial_background button,.tutorial_clone)")).forEach(elem=>{
        elem.style.color ="#B2B2B2";
    })
    //add the background
    this.bg = document.createElement("div");
    this.bg.className = "tutorial_background";
    //ADD THE text
    this.text_handler = document.createElement("div");
    this.text_handler.className = "tutorial_text";
    this.bg.appendChild(this.text_handler);

    //add the next_btn 
    this.next_btn = document.createElement("button");
    this.next_btn.className = "waves-effect waves-light btn btn-success-light mb-5";
    this.next_btn.textContent = "Următorul";
    this.next_btn.style.position = "fixed";
    this.next_btn.style.left = "calc(100% - 120px)";
    this.next_btn.style.bottom = "20px";
    this.next_btn.onclick = ()=>{
        this.move();
    }
    this.bg.appendChild(this.next_btn);

    //add the skip btn 
    this.skip_btn = document.createElement("button");
    this.skip_btn.className = "waves-effect waves-light btn btn-primary-light mb-5";
    this.skip_btn.textContent = "Sari peste";
    this.skip_btn.style.position = "fixed";
    this.skip_btn.style.left = "calc(100% - 240px)";
    this.skip_btn.style.bottom = "20px";
    this.bg.appendChild(this.skip_btn);

    document.querySelector("body").appendChild(this.bg);
    this.clone_buttons();


}

tutorial.prototype.move = function(total_time = 2000){
    if (this.clones){
        $(this.clones).animate({
            scrollTop: this.clones.scrollTop + this.clones.offsetHeight + 3,
            top: this.clones.offsetTop + this.clones.offsetHeight + 3
        },1000)
    }
}


tutorial.prototype.clone_buttons = function(){
    let e2,e3;
    let btns = document.querySelectorAll("button");
    let elem = btns[1];

    let parent_clone = document.createElement("div");
    parent_clone.className = "tutorial_clone";
    
    //add it to 
    let aux_elem = elem.cloneNode(true);
    let pos = this.get_real_pos(elem);
   
    //set size 
    parent_clone.style.width = elem.offsetWidth + 20 +"px";
    //set position
    parent_clone.style.top = pos.y -10 +"PX";
    parent_clone.style.left = pos.x -10 +"px";
    
    aux_elem.style.width = elem.offsetWidth + "px";

    e2 = btns[2].cloneNode(true);
    e2.style.width = btns[2].offsetWidth + "px";

    e3 = btns[3].cloneNode(true);
    e3.style.width = btns[3].offsetWidth+"px";
    //now add the buttons 
    parent_clone.appendChild(aux_elem);
    parent_clone.appendChild(e2);
    parent_clone.appendChild(e3);

    document.querySelector("body").appendChild(parent_clone);

    parent_clone.style.height = parent_clone.offsetHeight / 3 + "px";

    this.clones = parent_clone;
    //show text 

    this.show_text("Cont fermier","Formular cont fermier este ceea ce ai nevoie daca vrei sa fii fermier pe site",pos,{w:parent_clone.offsetWidth},200);
    this.show_image("assets/images/pic2.jpg");
}

tutorial.prototype.show_text = function (title = "",text,pos,sizes,delay = 0)
{

    if (title != ""){
        //show title 
        let title_elem = document.createElement("h3");
        title_elem.textContent = title;
        this.text_handler.appendChild(title_elem); 
    }
    this.text_handler.style.left = pos.x+sizes.w+50+"px";
    this.text_handler.style.top = "100px";  

    setTimeout(()=>{
            //show text 
            let p = document.createElement("p");
            p.textContent = text;
            p.className = "tut";
            p.style.color = "white";
        
            this.text_handler.appendChild(p);  
    },delay);
  
}

tutorial.prototype.show_image = function(image_name)
{
    let img = document.createElement("img");
    img.className = "tutorial_image";
    img.src = image_name;
    img.style.right = "250px";
    img.style.top = "calc((100% - 260px)/2)";
  
    this.bg.appendChild(img);


    
}

tutorial.prototype.get_real_pos = function(elem){

        var rect = elem.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top
        };
    
}