$(document).ready(function(){
   var tractor = function(obj, path) {
	this.obj = obj;
	this.pos = 0;
	this.path = path;
	this.length = path.getTotalLength();
	this.speed = path.getTotalLength() / 1000;
	this.box = obj.getBBox();
};
    
tractor.prototype.update = function() {
	this.pos += this.speed;
	this.pos = this.pos >= this.length ? 0 : this.pos;
	this.render();
};
tractor.prototype.pathDir = function(path) {
	// path direction
	var pt1 = path.getPointAtLength(this.pos - 2);
	var pt2 = path.getPointAtLength(this.pos + 2);
	var angle = Math.atan2(pt1.y - pt2.y, pt1.x - pt2.x) * (180 / Math.PI);
	return angle;
};
tractor.prototype.render = function() {
	// as the tractor doesn't start at 0,0 we need to calculate its centre
	var X = +(this.box.x + (this.box.width / 2)).toFixed(1),
		 Y = +(this.box.y + (this.box.height / 2)).toFixed(1);
	// find out it's point along the path, then calculate the new X and Y positions:
	var mp = this.path.getPointAtLength(this.pos),
		tX = mp.x - X,
		tY = mp.y - Y-14;
    //console.log(mp);
	// get the rotation at the path point:
	var tR = this.pathDir(this.path) - 180; // adjusted to face the correct direction
	// apply the new attributes - note: setting X and Y on the rotate is essential if not at 0,0! 
	this.obj.setAttribute('transform', 'translate(' + tX + ', ' + tY + ') rotate(' + tR + ' ' + X + ' ' + Y + ')');
	this.obj.setAttribute('opacity', 1);
};
    var raf, interval = NaN,path,tractor;
// objects
    setTimeout(function(){
        //add the spin wheel anims 
 

 path = document.getElementsByTagName("object")[0].contentDocument.getElementById("path");

 tractor = new tractor(document.getElementsByTagName("object")[0].contentDocument.getElementById("g1993"), path);
         play();

    },2000);
// animator


function animator() {
	var now = new Date().getTime(),
		dt = now - (interval || now);
	interval = now;
	raf = window.requestAnimationFrame(animator);
	tractor.update(dt); // update the tractor on each call
}
// buttons
function play() {
	window.requestAnimationFrame(animator);
}
function pause() {
	window.cancelAnimationFrame(raf);
	interval = NaN;
}
})
