
const notification_template = "<div class = 'not_container'><div class = 'notification_notify success'><div class = 'icon_notify'><i class='far fa-check-circle'></i></div><div class = 'content_notify'><p class = 'title'>This is the title</p>	<p class = 'message'>This is the message </p></div></div></div>";
const notification_template_error = "<div class = 'not_container'><div class = 'notification_notify error'><div class = 'icon_notify'><i class='far fa-times-circle'></i></div><div class = 'content_notify'><p class = 'title'>This is the title</p>	<p class = 'message'>This is the message </p></div></div></div>";

function Notify()
{

	//here we create and set up the parents  

	//first we need to create the parent where the notification wil be appended 
	
	this.parent = document.createElement("div");
	this.parent.className = "notify_parent";
	
	document.getElementsByTagName("body")[0].appendChild(this.parent);	
	
	console.log("initiated");
}


Notify.prototype.check = function(){
	try{
		let nots = document.querySelectorAll(".not_container");
		console.log(nots.length);
		if (nots.length == 0)
		{
			//maxheight 0
			document.querySelector(".notify_parent").style.height = "0px";
		}
		else{
			if (nots.length<=2)
			{
				document.querySelector(".notify_parent").style.height = "150px";
			}
			else {
				document.querySelector(".notify_parent").style.height = "300px";
			}
		}
	}
	catch{
	
	}
}

Notify.prototype.show_success = function (title,message){
	
	//create a notification 
	let temp = document.createRange().createContextualFragment(notification_template);
	

	temp.querySelector(".title").textContent = title;
	temp.querySelector(".message").textContent = message;
	
	this.parent.appendChild(temp);
	//after we append it,let's start the animation
	let notifications = this.parent.querySelectorAll(".not_container").length;
	if (notifications>2){
		notifications = 2;
	}
	this.parent.style.height = notifications*150 + "px";
	let last_index = this.parent.querySelectorAll(".not_container").length;
	let e = this.parent.querySelectorAll(".not_container")[last_index-1];
	//force the document to repaint 
	window.getComputedStyle(e).opacity; // added	

	e.style.maxHeight = "160px";
	e.querySelector(".notification_notify").style.left = "0px";
	//now we should set the delete timeout 
	setTimeout(()=>{this.delete_this_notification(e); },4500);
	//set the onclick 
	e.onclick = ()=>{ this.delete_this_notification(e);  };
	

}


Notify.prototype.show_error = function(title,message){
	try{
		
	//create a notification error
	let temp = document.createRange().createContextualFragment(notification_template_error);
	

	temp.querySelector(".title").textContent = title;
	temp.querySelector(".message").textContent = message;
	
	this.parent.appendChild(temp);
	//after we append it,let's start the animation
	let notifications = this.parent.querySelectorAll(".not_container").length;
	if (notifications>2){
		notifications = 2;
	}
	this.parent.style.height = notifications*150 + "px";
	let last_index = this.parent.querySelectorAll(".not_container").length;
	let e = this.parent.querySelectorAll(".not_container")[last_index-1];
	//force the document to repaint 
	window.getComputedStyle(e).opacity; // added	

	e.style.maxHeight = "160px";
	e.querySelector(".notification_notify").style.left = "0px";
	//now we should set the delete timeout 0
	setTimeout(()=>{this.delete_this_notification(e); },4500);
	//set the onclick 
	e.onclick = ()=>{ this.delete_this_notification(e); };
	

	}
	catch{

	}
}

Notify.prototype.delete_this_notification = function(elem){
	try{
		//first animate 
		elem.className += " fade_out_notification";
		setTimeout(()=>{elem.remove();this.check()},780);
		
	}
	catch{
		//element already removed error maybe
		elem.remove(); 
	}
}

Notify.prototype.check_height = function(){
	//get how many notifies are 
	let count = document.querySelectorAll(".not_container").length;
	if (count == 0){
		document.querySelector(".notify_parent").style.height = "0px";

	}
	else if (count < 3){
		document.querySelector(".notify_parent").style.height = count*150 + "px";
	}
	else if (count>=3){
		document.querySelector(".notify_parent").style.height = "300px";
	}
}