function intersect(data1,data2)
{
    let aux_data = [];
    if (data1!=null && data2!=null && data1.length!=0 && data2.length!=0){
    data1.forEach(element => {
        
        //if we find an id from data1 in data2, then we add it 
        if (contains(data2,element.id))
        {
            aux_data.push(element);
        }
    });
    return aux_data;}
    else
    return data1;
}
function remove_intersect(data1,data2){
    if (data1!=null && data2!=null && data1.length!=0 && data2.length!=0){
    let aux_data = [];
    data1.forEach(element=>{
        if (!contains(data2,element.id)){
            aux_data.push(element);
        }
    })
    return aux_data;}
    else
    return data1;
}
function contains(arr,value){
    let find = false;
    arr.forEach(elem=>{
        if (elem.id == value)
        {
            find = true;
        return ;}
    })


    return find;
}

function distance(lat1, lon1, lat2, lon2)  {
    var R = 6371; // km
      var dLat = toRad(lat2-lat1);
      var dLon = toRad(lon2-lon1);
      var lat1 = toRad(lat1);
      var lat2 = toRad(lat2);

      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c;
      return d;

    }

function min(val1,val2){
    return (val1<=val2) ? val1 : val2;
}
function toRad(value)
{
    return Math.PI * value/180;
}