
const select_template = `        <div class = 'cool_select_body' tabindex="0" onfocus="focus_in(this)" onfocusout = "focus_out(this)">

<div class = 'cool_select_head'>
    <span>Alege punctul de livrare</span>
    <i class="fa-duotone fa-truck-ramp-box"></i>
</div>

<div class = 'cool_select_options'>

</div>
</div>`;
const option_template = `<div class = 'cool_select_option'>
<label></label>
<div class = 'round'>
    <input type="radio" />
    <label ></label>
</div>
</div>`;

(function() {
    orig = $.fn.css;
    $.fn.css = function() {
        if (this.length!=0 && this[0].tagName == "SELECT"){            
            var ev = new $.Event('cool_select_style_change');       
             $(document).trigger(ev,[this,arguments]);
        }
        else
             orig.apply(this, arguments);
    }
})();

function cool_select (elems,styles = {}){
    
    if (elems instanceof NodeList)
    elems.forEach((select,index) => {
        cool_select_replace(select,index,styles);
        cool_select_hide_this(select);
    });
    else{
        cool_select_replace(elems,1,styles);
        cool_select_hide_this(elems);
    }
}


function cool_select_replace(select,index = 1,styles,refresh = false)
{
 
   
    const sel_name = refresh ? select.dataset.cool_select_target : `cool_select_${index}`;
    let new_select = refresh ? document.querySelector(`.cool_select_body[data-cool_select_name='${sel_name}']`) : document.createRange().createContextualFragment(select_template);

    
    if (refresh){
        if (!select.dataset.cool_select_target){
            return;
        }
        cool_select_remove_old_opts(select);
        //we should reset the header to
    }
    else{
        new_select.querySelector("div").dataset.cool_select_name = sel_name;
        select.dataset.cool_select_init = true;
        select.dataset.cool_select_target = sel_name;
    }

   
   let {option_frag,width,header} = cool_select_add_opts(select,index,styles,sel_name);

   new_select.querySelector("span").textContent = header;

    new_select.querySelector(".cool_select_options").appendChild(option_frag);

    if (!refresh){
        new_select.querySelector("div").style.width = styles.width ? styles.width : width + "px";
        select.parentNode.insertBefore(new_select,select);
    }
}


function cool_select_remove_old_opts(select)
{
    try{
        if (!select.dataset.cool_select_target){
            return;
        }
        let target = document.querySelector(`.cool_select_body[data-cool_select_name='${select.dataset.cool_select_target}']`);
        Array.from(target.querySelectorAll(".cool_select_option")).forEach(opt=>opt.remove());
    }
    catch{
        
    }
}



function cool_select_add_opts(select,index = 1,styles = {},sel_name)
{
    let width = 0;
    let option_frag = document.createDocumentFragment(),option_temp,header = "";

    Array.from(select.querySelectorAll("option")).forEach((option,option_index)=>{
       
        option_temp = document.createRange().createContextualFragment(option_template);
        let value = option?.value || option.textContent;
        let textContent = option.textContent;

        let input = option_temp.querySelector("input");

        if (!styles?.width && width < getTextWidth(textContent,"18px Sora, sans-serif"))
        {
            width = getTextWidth(textContent,"18px Sora, sans-serif");
        }

        option_temp.querySelector("label").textContent = option.textContent;
        

        input.id = sel_name+"_"+option_index;
        input.name = "cool_select_"+index;
        input.checked = header == "" ? true : false;

        option_temp.querySelector("label").setAttribute("for",sel_name+"_"+option_index);
        option_temp.querySelector("label:nth-child(2)").setAttribute("for",sel_name+"_"+option_index);

        option_temp.querySelector("div").onclick = (evt)=>{   
            let i;
            for(i = 0;i<evt.path.length;i++)
            {
                if (evt.path[i].className == "cool_select_body" && evt.path[0].localName=="input")
                {
                    //change the header  value 
                    evt.path[i].querySelector("span").textContent = textContent; 
                    break;
                }
            }
            send_event(select,evt.path,value);
        }

        if (header == "")
             header = textContent;

        option_frag.appendChild(option_temp);
    })

    return {option_frag,width,header};
}




function cool_select_hide_this(select){
    select.style.width = "0px";
    select.style.position = "absolute";
    select.style.top = "0px";
    select.style.border = "none";
}

function focus_in(elem)
{
    let options_handle = elem.querySelector(".cool_select_options");
    options_handle.style.maxHeight = "150px";
    options_handle.style.borderStyle = "solid";



    //let's calculate where to open(up or down)
    //everytime open where we have more space 
    let scrollTop = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop
    let height = elem.clientHeight + 2;
    let compStyle = getComputedStyle(elem);    
    let bottom_dist = (window.innerHeight + scrollTop) - elem.offsetTop - parseInt(height) - parseInt(compStyle.marginTop);

    if(bottom_dist<=150)
    {
        //movetoTop
        options_handle.style.bottom = `${height}`;
        options_handle.style.top = `auto`;

        elem.style.borderTopRightRadius = "0px";
        elem.style.borderTopLeftRadius = "0px";

        options_handle.style.borderTop = "1px solid";
        options_handle.style.borderBottom = "0px solid";

    }
    else{
        options_handle.style.top = `${height-2}`;
        options_handle.style.bottom = `auto`;

        elem.style.borderBottomRightRadius = "0px";
        elem.style.borderBottomLeftRadius = "0px";

        options_handle.style.borderTop = "0px solid";
        options_handle.style.borderBottom = "1px solid";
    }



}


function focus_out(elem)
{
    let options_handle = elem.querySelector(".cool_select_options");
    options_handle.style.maxHeight = "0px";
    setTimeout(()=>{
        options_handle.style.borderStyle = "hidden";
    },400)

    elem.style.borderBottomRightRadius = "5px";
    elem.style.borderBottomLeftRadius = "5px";
    elem.style.borderTopRightRadius = "5px";
    elem.style.borderTopLeftRadius = "5px";
}

function send_event(element,path,value){
   
    //double click event because label, so only count one click event
    //path is different
    if (path && path[0].localName!="input" && !path[0].checked)
    return ;
    select_option(element,value);
    if ("createEvent" in document) {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", false, true);
        element.dispatchEvent(evt);
        evt.preventDefault();
    }
    else
        element.fireEvent("onchange");
   
}

function select_option(elem,value){
    elem.value = value;
}

function getTextWidth(text, font) {
    // re-use canvas object for better performance
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    //10 is the margin
    //22 is the rounded checkbox 
    //40 is the icon from the header, because we need to show the selected vaalue in head,
    return metrics.width + 10 + 22 + 40;
  }


$(document).on("cool_select_style_change",function(ev,...args){
    let elem = null, props = null;
    if (args.length!=0 && args[0].length!=0)
        elem = args[0][0];
    props = args?.[1];
    
    if (elem.dataset?.cool_select_init)
    {
        let cool_sel = document.querySelector(`.cool_select_body[data-cool_select_name='${elem.dataset?.cool_select_target}']`);
        let obj_prop = true;
        Array.from(props).forEach((prop)=>{
            if (typeof prop === "string")
            {
                obj_prop = false;
            }
            else{
                let key = Object.keys(prop)[0];
                let val = prop[key];
                cool_sel.style[key] = val;
            }
        })
        cool_sel.style[props[0]] = props[1];
    }
})