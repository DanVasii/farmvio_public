        var doc,half;
        var x,y;

        function crop_text(list,length,target_width,x = 5,returned_data = [])
        {

        let text = concat_index(list,length);


        if (list.length!=0)
        {
        if (doc.getTextWidth(text) + x >= target_width + 2)
        {
            //recursive 
            return crop_text(list,length-1,target_width,x);
        }
        else if (length>1){              
            //push 
            returned_data.push(text);
            //remove first n(length) from list 
            list = remvove_items(list,length);
            //reset 
            return crop_text(list,list.length,target_width,x,returned_data);
        }
        else{
          

            let final_w = doc.getTextWidth(list[0]) + x;
            
        

            let chars = list[0].length;

            let times_bigger = parseInt(final_w/target_width);

            

            if (parseInt(final_w/target_width) != final_w/target_width)
            times_bigger++;
        
            let incr = chars/times_bigger;
            let t = list[0];

            for (let i = 0;i<=times_bigger;i++)
            {
            
            returned_data.push(t.slice(0,incr));

            t = t.substring(incr, t.length);


            }
        
            return returned_data;

        }
        }
        else
        return returned_data;

        }




        function remvove_items(list,end_index)
        {
        
        let i,aux= [];
        for (i=end_index;i<list.length;i++)
        {
            aux.push(list[i])
        }

        return aux;
        }


        function concat_index(list,end_index)
        {
        console.log(list);
        let i;
        let text = "";
        console.log(list);
        for (i=0;i<end_index;i++){
            text+=list[i]+" ";
        }
        return text;
        }



        function init_pdf(){
            doc = new jsPDF();
             half = (doc.internal.pageSize.width)/2;
            x = 5;
            y = 10;
        }

        function add_image(){
            return new Promise((res,rej)=>{
                var img = new Image();
            
                img.addEventListener('load', () => {
                    doc.addImage(img, 'jpg', 5, 10, 75, 30)
                    res();
                  });

                  img.src = '/assets/images/icons/Logo FARMVIO11.jpg';
                  
               
            })
        }

        
        function gen(from,to,adresa_from,adresa_to,main_data,type = 0){

        y = 45;
        x = 5;
        doc.setFontStyle("bold");
        doc.text(x,y,"De la ");

        x=half;
        doc.text(x,y,"Catre");
        y+=5;
        doc.setFontType("normal");

        x=5;
        display_text(from,14)
        y = 50;
        x = half ;
        display_text(to,14)



        x =5;
        display_text(adresa_from);   

        x = half;
        y = 55;
        display_text(adresa_to);   

        if (type==0){
        create_rect();
         set_main_data(main_data)
        }
        else{
            create_rect_res();
            set_main_data_reserve(main_data);
        }
        y+=10;
     

        }


        function display_text(text,size = 12,max_width = 105.05,type = "normal")
        {
          text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

        doc.setFontStyle(type);
        doc.setFontSize(size);
        let words,cropped,incr = 0 ;
        words = text.split(" ");
        
        cropped = crop_text(words,words.length,max_width);        

        cropped.map(crop=>{
        if (crop.trim()!=""){
            if (doc.getTextWidth(crop)>incr)
            {
            incr = doc.getTextWidth(crop);
            }
            doc.text(x, y, crop);

            y+=5;
        }
        })
        return incr;
        }

        function create_row(produs,cantitate,pret,total)
        {
        if (y+15>doc.internal.pageSize.height)
        {
            //add new page 
            doc.addPage();

            y = 3;
        }
        x = 5;
        
        doc.line(x,y,200,y,'F');
        console.log("line")
        y+=5;
        let aux_y = y;

        x+=10;

        x+= display_text(produs,14,80) + 10;
        
        y = aux_y;
        x+= display_text(cantitate,14,50,"bold") + 10;

        y = aux_y;
        x+= display_text(pret,14,50) + 10;

        y = aux_y;
        x+= display_text(total,14,50) + 10;
        
        }



        function create_rect()
        {
        x=5
        y = 70;
        doc.setFillColor(255,255,200);
        doc.rect(0, y, 210, 20, 'F');

        }

        function create_rect_res()
        {
        x=5
        y = 70;
        doc.setFillColor(255,255,200);
        doc.rect(0, y, 210, 20, 'F');

        }


        function create_need_pay()
        {
            x=5;
            y=70+22;
            doc.setFillColor(255,255,200);
            doc.rect(0, y, 210, 10, 'F');  

            doc.setFontSize(14);
            y=y+6;
            let text = "Fermierul a cerut plata in avans a produselor!";  
            doc.text(x,y,text);
            x+= doc.getTextWidth(text) + 5;
            
        }

        function set_main_data_reserve(data){
            
            doc.setFontSize(11);
            x = 5;
            y = 77;
            let text;
            //set order_id 
            text = "Id rezervare: "+data[0];  
            doc.text(x,y,text);
            x+= doc.getTextWidth(text) + 5;
    
    
            text = "Data rezervare: "+data[1];  
            doc.text(x,y,text);
            x+= doc.getTextWidth(text) + 5;
    
                
    
            text = "Data livrare: "+data[2];  
            doc.text(x,y,text);
            x+= doc.getTextWidth(text) + 5;
            x=5;
            y+=8;

            text = "Cost transport: "+data[3];  
            doc.text(x,y,text);
            x+= doc.getTextWidth(text) + 5;

            text = "Cont bancar: "+data[4];  
            doc.text(x,y,text);
            x+= doc.getTextWidth(text) + 5;

            y+=10;

            }

        function set_main_data(data){
        doc.setFontSize(11);
        x = 5;
        y = 77;
        let text;
        //set order_id 
        text = "Id comanda: "+data[0];  
        doc.text(x,y,text);
        x+= doc.getTextWidth(text) + 5;

        text = "Id sub-comanda: "+data[1];  
        doc.text(x,y,text);
        x+= doc.getTextWidth(text) + 5;

        text = "Data comanda: "+data[2];  
        doc.text(x,y,text);
        x+= doc.getTextWidth(text) + 5;

        x = 5;
        y+=8;

        text = "Metoda transport: "+data[3];  
        doc.text(x,y,text);
        x+= doc.getTextWidth(text) + 5;

        text = "Cost transport: "+data[4];  
        doc.text(x,y,text);
        x+= doc.getTextWidth(text) + 5;

        }


        function done(name)
        {
            doc.save(`${name}.pdf`);         

        }