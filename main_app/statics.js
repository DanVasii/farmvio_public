const farmer_profile_default = `   

<section class = 'prods_section prb-100' style="margin: 55px;">
<div class = 'container'>
    <div class="tab shop-list-tab">        
        <div class="tab_content">
            <div class="tabs_item">
                <div class="row align-items-center" id = 'shop_prods'>

                    <!--Farmer's prods -->

    </div>
    </div>
    </div>
    </div>
</div>

</section>



<section class="about-section ptb-100">
<div class="container">



    

    <div class="about-title-area">
        <div class="row">
            <div class="col-lg-7 col-md-12">
                <div class="about-title">
                    <span>Despre noi</span>
                    <h2></h2>
                </div>
            </div>

            <div class="col-lg-5 col-md-12">
                <div class="about-text">
                    <p>{{desc}}
                        {{#admin}}
                        <a href = '/dashboard#settings'><i class="fas fa-edit"></i>Editează text</a>
                        {{/admin}}
                    </p>
                </div>
            </div>
        </div>
    </div>

    <div class="row align-items-center">
        <div class="col-lg-6" style="text-align: center;">
            <div class="about-image">
                <img src="assets/img/about/about-2.jpg" alt="image" style="max-height: 500px;">
            </div>
        </div>

        <div class="col-lg-6">
            <div class="about-slider owl-carousel owl-theme">


    
            </div>
            {{#admin}}
            <a href = '/dashboard#farm_pics'><i class="fas fa-file-upload"></i>Incarcă poze</a>
            {{/admin}}
            <div class="about-content-area">
                <div class="about-content">
                    <h3>Trasabilitatea fermei {{bis_name}}</h3>
                    <p>Fermierii de pe Farmvio.com sunt verificați de către echipa Farmvio prin intermediul certificatelor de mai jos:</p>
                </div>

                <ul class="about-list">
                   
                </ul>
            </div>
        </div>
    </div>
</div>
</section>
<!-- End About Section -->
<div class = 'container list_wpoints'>
<div class = 'row justify-content-center mb-3 mt-3'>
    <div class = 'col-auto'>
        <h3>Puncte de lucru</h3>
    </div>
</div>
<div class = 'row justify-content-center mb-5'>

<div class = 'col-4 del_points'>
    <ul>
    </ul>
</div>
<div class = 'col-auto'>
        <img src = '/assets/images/apppictures/pngtree-delivery-banner-poster-background-image_12237.jpg'/>
</div>
</div>
</div>



<!-- Start Testimonials Section -->
<section class="testimonials-section pt-100">
<div class="container-fluid p-0">
    <div class="testimonials-title">
        <span>Testimoniale</span>
        <h3>Clienții noștri o spun cel mai bine</h3>
    </div>

    <div class="testimonials-slider owl-carousel owl-theme">

    </div>
</div>
</section>
<!-- End Testimonials Section -->
<function>populate_prods</function>
<function>populate_about_slider</function>
<function>parse_avize</function>
<function>get_working_points</function>
<function>load_reviews</function>

<function>sadsa</function>

`;
const not_activated_farmer = `    <!-- Start Services Details Area -->
<section class="services-details-area ptb-100">
    <div class="container">
        <div class="services-details-overview">
            <div class="row align-items-center">
              <div class="col-lg-6 col-md-12">
                <div class="services-details-image">
                    <img src="assets/img/home-three/1.webp" alt="image">
                </div>
            </div>
                <div class="col-lg-6 col-md-12">
                  <div class="services-details-desc">
                    <h3>Hai să ne cunoaștem</h3>
                    <p>Dacă ești în căutarea unor noi piețe de desfacere pentru produsele tale, ai ajuns în locul potrivit. Trebuie doar să-ți activezi contul de mai jos, pentru a-ți crea propriul magazin virtual.</p>

                    <div class="features-text">
                        <p>Te vom ajuta să-ți prezinți produsele către potențiali clienți HoReCa și companii din zona ta, dar și către persoane fizice. </p>
                    </div>

                    <div class="features-text">
                        <p>Vom gestiona solicitările companiilor și îți vom pune la dispoziție servicii de transport și urmărire a comenzilor. </p>
                    </div>
                </div>
                </div>

  
            </div>
        </div>


        <div class="container">
          <div class="services-details-overview">
              <div class="row align-items-center">
                  <div class="col-lg-8 col-md-12 order-md-first order-last">
                      <div class="services-details-desc">
                        <div class="features-text">
                          <h4>De ce să ne fii alături</h4>
                          <p>Crearea, utilizarea și administrarea magazinului online sunt și vor rămâne gratuite pe toată perioada în care vei face parte din comunitatea Farmvio. Odată cu lansarea, am pregătit numeroase campanii de promovare către persoane fizice, HoReCa si procesatori și ne-am dori să ne fii alături cât mai repede, pentru a beneficia din plin de ele.  </p>
                      </div>
                 
                      </div>
                  </div>

                  <div class="col-lg-4 col-md-12">
                      <div class="services-details-image">
                          <img src="assets/img/ILLUSTRATIONS FARM 500x400 delivery.png" alt="image">
                      </div>
                  </div>
              </div>
          </div>



        <div class="services-details-overview">
            <div class="row align-items-center">
                <div class="col-lg-6 col-md-12">
                    <div class="services-details-image">
                        <img src="assets/img/about/familie_adobespark-min.webp" alt="image">
                    </div>
                </div>

                <div class="col-lg-6 col-md-12">
                    <div class="services-details-desc">
                        <h3>Ce trebuie sa faci</h3>
                        <p>Îți creezi contul pe platformă, dând click pe butonul din josul paginii și urmând câțiva pași simpli:</p>

                        <div class="services-details-accordion">
                        <ul class="accordion">
                                <li class="accordion-item">
                                    <a class="accordion-title" >
                                        <i class="fas fa-plus"></i>
                                        Creare cont
                                    </a>

                                    <p class="accordion-content show" style="display: none;"> Introdu datele solicitate, începând cu numele prin care vei fi cunoscut pe platforma Farmvio și dă click pe “Creează cont”. <a href = '/register'>Înregistrează-te</a></a></p>
                                </li>
                                
                                <li class="accordion-item">
                                    <a class="accordion-title">
                                        <i class="fas fa-plus"></i>
                                        Creare cont fermier
                                    </a>

                                    <p class="accordion-content" style="">Spune-ne care este activitatea ta și bifează cărei categorii îi aparții: fermier, producător local (ex: de sucuri, gemuri, conserve etc.)</p>
                                </li>

                                <li class="accordion-item">
                                    <a class="accordion-title" >
                                        <i class="fas fa-plus"></i>
                                        Validare cont
                                    </a>

                                    <p class="accordion-content" style="">Completează-ți profilul cu poze, punctul de lucru, produse și descrierea fermei, iar apoi noi îți vom valida contul!</p>
                                </li>
                            </ul>
                            <h3 class="mt-5">Beneficii imediate</h3>
                            <ul class='custom_list'>
                              <li>
                                Reducere de 12% pentru transportul prin curier al produselor neperisabile
                              </li>
                              <li>
                                Vei fi parte din campania de promovare regională a Farmvio, pentru următoarele 30 de zile
                              </li>
                            </ul>
                            <h4>
                              Te așteptăm alături de noi!<br>
                              Echipa Farmvio
                            </h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>   
        <div style="text-align: center;">
        <a href="/register" class="default-btn" style="transform: scale(1.2);">
          Activează contul
          <i class="flaticon-plus"></i>
          <span style="top: 222px; left: 151.5px;"></span>
      </a>
    </div>
    </div>
    
</section>

<!-- End Services Details Area -->

<!-- Start Partner Section -->
<section class="partner-section">
    <div class="container">
        <div class="partner-list">
            <div class="partner-item">
                <a href="partner.html">
                    <img src="assets/img/partner/1.png" alt="image">
                </a>
            </div>

            <div class="partner-item">
                <a href="partner.html">
                    <img src="assets/img/partner/2.png" alt="image">
                </a>
            </div>

            <div class="partner-item">
                <a href="partner.html">
                    <img src="assets/img/partner/3.png" alt="image">
                </a>
            </div>

            <div class="partner-item">
                <a href="partner.html">
                    <img src="assets/img/partner/4.png" alt="image">
                </a>
            </div>

            <div class="partner-item">
                <a href="partner.html">
                    <img src="assets/img/partner/5.png" alt="image">
                </a>
            </div>

            <div class="partner-item">
                <a href="partner.html">
                    <img src="assets/img/partner/6.png" alt="image">
                </a>
            </div>

            <div class="partner-item">
                <a href="partner.html">
                    <img src="assets/img/partner/7.png" alt="image">
                </a>
            </div>

            <div class="partner-item">
                <a href="partner.html">
                    <img src="assets/img/partner/8.png" alt="image">
                </a>
            </div>
        </div>
    </div>
</section>

`;

let forgot_pass_email = `<!DOCTYPE html>
<html>
<head>
<title></title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<style type="text/css">
    /* FONTS */
    @import url('https://fonts.googleapis.com/css?family=Poppins:100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i');

    /* CLIENT-SPECIFIC STYLES */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }

    /* RESET STYLES */
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

    /* iOS BLUE LINKS */
    a[x-apple-data-detectors] {
        color: inherit !important;
        text-decoration: none !important;
        font-size: inherit !important;
        font-family: inherit !important;
        font-weight: inherit !important;
        line-height: inherit !important;
    }

    /* MOBILE STYLES */
    @media screen and (max-width:600px){
        h1 {
            font-size: 32px !important;
            line-height: 32px !important;
        }
    }

    /* ANDROID CENTER FIX */
    div[style*="margin: 16px 0;"] { margin: 0 !important; }
</style>
</head>
<body style="background-color: #f3f5f7; margin: 0 !important; padding: 0 !important;">



<table border="0" cellpadding="0" cellspacing="0" width="100%">
    <!-- LOGO -->
    <tr>
        <td align="center">
            <!--[if (gte mso 9)|(IE)]>
            <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
            <tr>
            <td align="center" valign="top" width="600">
            <![endif]-->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                <tr>
                    <td align="center" valign="top" style="padding: 40px 10px 10px 10px;">
                        <a href="#" target="_blank" style="text-decoration: none;">
                            <span style="display: block; font-family: 'Poppins', sans-serif; color: #3e8ef7; font-size: 36px;" border="0"><img src ='/views/assets/img/Logo+FARMVIO12.png'></span>
                        </a>
                    </td>
                </tr>
            </table>
            <!--[if (gte mso 9)|(IE)]>
            </td>
            </tr>
            </table>
            <![endif]-->
        </td>
    </tr>
    <!-- HERO -->
    <tr>
        <td align="center" style="padding: 0px 10px 0px 10px;">
            <!--[if (gte mso 9)|(IE)]>
            <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
            <tr>
            <td align="center" valign="top" width="600">
            <![endif]-->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                <tr>
                    <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Poppins', sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 2px; line-height: 48px;">
                      <h1 style="font-size: 36px; font-weight: 600; margin: 0;">Salut, {{username}} </h1>
                    </td>
                </tr>
            </table>
            <!--[if (gte mso 9)|(IE)]>
            </td>
            </tr>
            </table>
            <![endif]-->
        </td>
    </tr>
    <!-- COPY BLOCK -->
    <tr>
        <td align="center" style="padding: 0px 10px 0px 10px;">
            <!--[if (gte mso 9)|(IE)]>
            <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
            <tr>
            <td align="center" valign="top" width="600">
            <![endif]-->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
              <!-- COPY -->
              <tr>
                <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 20px 30px; color: #666666; font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">Acesta este codul tău pentru recuperarea parolei</p>
                </td>
              </tr>
              <!-- BULLETPROOF BUTTON -->
              <tr>
                <td bgcolor="#ffffff" align="left">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td bgcolor="#ffffff" align="center" style="padding: 20px 30px 30px 30px;">
                        <table border="0" cellspacing="0" cellpadding="0">
                          <tr>
                              <td align="center" style="border-radius: 3px;" bgcolor="#17b3a3"><span  style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; color: #ffffff; text-decoration: none; padding: 12px 50px; border-radius: 2px; border: 1px solid #17b3a3; display: inline-block;">{{code}}</span></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- COPY -->
              <tr>
                <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 0px 30px; color: #666666; font-family: &apos;Lato&apos;, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">Dacă ai închis fereastra precedentă sau dacă codul nu funcționează te rugăm să apeși pe acest link:</p>
                </td>
              </tr>
              <!-- COPY -->
                <tr>
                  <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 20px 30px; color: #666666; font-family: &apos;Lato&apos;, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 400; line-height: 25px;">
                  <a href='https://{{links}}' target="_blank" style="color: #17b3a3;"> Apasă aici </a>
                  </td>
                </tr>
              <!-- COPY -->
              <tr>
                <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 20px 30px; color: #666666; font-family: &apos;Lato&apos;, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">Pentru mai multe detalii si informații te rugăm sa ne contactezi la office@farmvio.ro</p>
                </td>
              </tr>
              <!-- COPY -->
              <tr>
                <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 0px 0px; color: #666666; font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">Mulțumim,<br>echipa Farmvio</p>
                </td>
              </tr>
            </table>
            <!--[if (gte mso 9)|(IE)]>
            </td>
            </tr>
            </table>
            <![endif]-->
        </td>
    </tr>

</table>

</body>
</html>`;

const agent_form_email = `<!DOCTYPE html>
<html>
<head>
<title></title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<style type="text/css">
    /* FONTS */
    @import url('https://fonts.googleapis.com/css?family=Poppins:100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i');

    /* CLIENT-SPECIFIC STYLES */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }

    /* RESET STYLES */
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

    /* iOS BLUE LINKS */
    a[x-apple-data-detectors] {
        color: inherit !important;
        text-decoration: none !important;
        font-size: inherit !important;
        font-family: inherit !important;
        font-weight: inherit !important;
        line-height: inherit !important;
    }

    /* MOBILE STYLES */
    @media screen and (max-width:600px){
        h1 {
            font-size: 32px !important;
            line-height: 32px !important;
        }
    }

    /* ANDROID CENTER FIX */
    div[style*="margin: 16px 0;"] { margin: 0 !important; }
</style>
</head>
<body style="background-color: #f3f5f7; margin: 0 !important; padding: 0 !important;">



<table border="0" cellpadding="0" cellspacing="0" width="100%">
    <!-- LOGO -->
    <tr>
        <td align="center">
            <!--[if (gte mso 9)|(IE)]>
            <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
            <tr>
            <td align="center" valign="top" width="600">
            <![endif]-->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                <tr>
                    <td align="center" valign="top" style="padding: 40px 10px 10px 10px;">
                        <a href="#" target="_blank" style="text-decoration: none;">
                            <span style="display: block; font-family: 'Poppins', sans-serif; color: #3e8ef7; font-size: 36px;" border="0"><img src ='/views/assets/img/Logo+FARMVIO12.png'></span>
                        </a>
                    </td>
                </tr>
            </table>
            <!--[if (gte mso 9)|(IE)]>
            </td>
            </tr>
            </table>
            <![endif]-->
        </td>
    </tr>
    <!-- HERO -->
    <tr>
        <td align="center" style="padding: 0px 10px 0px 10px;">
            <!--[if (gte mso 9)|(IE)]>
            <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
            <tr>
            <td align="center" valign="top" width="600">
            <![endif]-->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                <tr>
                    <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Poppins', sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 2px; line-height: 48px;">
                      <h1 style="font-size: 36px; font-weight: 600; margin: 0;">Salut, {{name}} </h1>
                    </td>
                </tr>
            </table>
            <!--[if (gte mso 9)|(IE)]>
            </td>
            </tr>
            </table>
            <![endif]-->
        </td>
    </tr>
    <!-- COPY BLOCK -->
    <tr>
        <td align="center" style="padding: 0px 10px 0px 10px;">
            <!--[if (gte mso 9)|(IE)]>
            <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
            <tr>
            <td align="center" valign="top" width="600">
            <![endif]-->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
              <!-- COPY -->
              <tr>
                <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 20px 30px; color: #666666; font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">Acesta este codul tău pentru recuperarea parolei</p>
                </td>
              </tr>      
              <!-- COPY -->
                <tr>
                  <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 20px 30px; color: #666666; font-family: &apos;Lato&apos;, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 400; line-height: 25px;">
                  <a href='https://{{links}}' target="_blank" style="color: #17b3a3;"> Apasă aici </a>
                  </td>
                </tr>
              <!-- COPY -->
              <tr>
                <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 20px 30px; color: #666666; font-family: &apos;Lato&apos;, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">Pentru mai multe detalii si informații te rugăm sa ne contactezi la office@farmvio.ro</p>
                </td>
              </tr>
              <!-- COPY -->
              <tr>
                <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 0px 0px; color: #666666; font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">Mulțumim,<br>echipa Farmvio</p>
                </td>
              </tr>
            </table>
        
            </td>
            </tr>
            </table>
            <![endif]-->
        </td>
    </tr>

</table>

</body>
</html>`;
module.exports = {
    farmer_profile_default,not_activated_farmer,forgot_pass_email,agent_form_email
}