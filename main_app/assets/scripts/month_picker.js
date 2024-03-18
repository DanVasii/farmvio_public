var months = ["Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie","Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie"];
var last_focus = null;
$(function(){
    // /month_picker
    init();
    //listen 

    $(".month_picker").on("focus",function(){
      
        //move the elem 
        let temp = document.querySelector(".month_picker_temp");
        let left = getOffsetLeft(this);
        let top = get_top(this);
        
        temp.style.left = left+ "px";
        
        temp.style.top = (top + get_height(this)) + "px"; 

        temp.style.display = "flex";
        last_focus = this;
    })

    $(".month_picker_temp .month").on("click",function(){
        console.log("clicked");
        //select 
        if (last_focus){
        try{
            last_focus.value = this.textContent;
            last_focus.dataset.month_id = months.indexOf(this.textContent.trim());
            //hide 
            document.querySelector(".month_picker_temp").style.display = "none";        
        }
        catch
        {
            document.querySelector(".month_picker_temp").style.display = "none";        
        } 
        }
    })

    $(document).on("click",function(elem)
    {
        elem = elem.target;
        console.log(elem.className);
        if (elem.className != "month_picker_temp" && elem.className != "month" && elem.className.trim() != "month_picker")
        {
            //hide 
            document.querySelector(".month_picker_temp").style.display = "none";        
            last_focus = null;
        }
    })

 
})

function getOffsetLeft( elem )
{
    var offsetLeft = 0;
    do {
      if ( !isNaN( elem.offsetLeft ) )
      {
          offsetLeft += elem.offsetLeft;
      }
    } while( elem = elem.offsetParent );
    return offsetLeft;
}

function get_top(elem){
   return  elem.getBoundingClientRect().top + document.documentElement.scrollTop;
}

function get_height(elem)
{
    return elem.clientHeight + 10;
}

function init()
{
    let temp = document.querySelector(".month_picker_temp");
    for (index in months)
    {
        let month = document.createElement("div");
        month.className = "month";
        month.textContent = months[index];
        month.dataset.index = index;

        temp.appendChild(month);
    }
}