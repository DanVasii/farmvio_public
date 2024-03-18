class skeleton{
    card_skeleton_temp = `<div class = 'card'>

    <div class = 'left_col'>
        <div class = 'img skeleton'></div>

        <div class = 'long_text center_skeleton skeleton'></div>

        <div class = 'atc_but skeleton'>

        </div>
    </div>
    <div class = 'right_col'>
        <div class = 'top_infos '>

            <div class="profile_img skeleton"></div>
                <div class = 'extra_infos' style="flex-grow: 1;">
                    <div class = 'long_text skeleton' style='margin-top: 0px' ></div>
                    <div class = 'short_text skeleton' style = 'margin-top: 5px'></div>

                    <div class = 'cats_sold' style = 'margin-top: 5px'>
                        <div class = 'cat_img skeleton'></div>
                        <div class = 'cat_img skeleton'></div>
                    </div>
                </div>
        </div>
        <p class = 'farmer_desc'>
            <div class = 'very_long_text skeleton' ></div>
            <div class = 'very_long_text skeleton' ></div>
            <div class = 'long_text skeleton' ></div>


        </p>
    </div>
</div>`;

    card_skeleton(how_many,where)
    {
        let frag = document.createDocumentFragment(),temp;
        for (let i = 1;i<=how_many;i++)
        {
            temp = document.createRange().createContextualFragment(this.card_skeleton_temp);
            frag.appendChild(temp);
        }
        where.appendChild(frag);
    }
}