var about_item_template = ()=>{ 
    let temp = document.createElement("template");
    temp.innerHTML = 
    `<div class="about-item" style="height: 280px;">
<div class="about-slide-image" style="text-align: center;height: 200px;display: flex;justify-content: center;">
    <img src="/uploads/13-image-a66c8e53-9bef-4dc6-a4f7-a0a566baf078.png" alt="image" style="max-height: 200px;width: auto">
</div>
<div class="about-text">
    <h3>text</h3>
</div>
</div>`;

return temp.content.cloneNode(true);
}

export  {about_item_template}