// The site's own information pages, carried over from the Wix site (SEO plan P10) and rewritten
// where the old wording described Puppy Connection selling puppies itself. The directory lists
// puppies; breeders sell them. Anything only Amber can say is a visible REPLACE THIS, listed in
// the README's pending list, so the page cannot launch with a guess in it.
//
// Sources, in _harvest/copy/: about-puppy-connection.txt (facts kept: northern Indiana and the
// experience Amber publishes), tips-on-buying-a-puppy.txt (carried over almost as written),
// reviews.txt (the three reviews as published). the-puppy-connection-process.txt described
// visits, deposits and delivery arranged by Puppy Connection, so How it works is written new
// from how the directory works. Transportation is written new around Furry Freight (launch item A7).

const replace = (what) => `<span class="replace-this">REPLACE THIS: ${what}</span>`;

export const INFO_PAGES = [
  {
    file: 'about.html', name: 'About',
    title: 'About Puppy Connection | Family Dog Breeders in Indiana',
    desc: 'Puppy Connection is a directory of small family dog breeders, based in northern Indiana. See how it began and what we ask of the breeders who list here.',
    body: `<section class="band" style="padding-bottom:1.4rem"><div class="wrap"><p class="eyebrow">About</p><h1>About Puppy Connection</h1>
<p class="lede">A directory of small family dog breeders, based in northern Indiana and growing across the Midwest.</p></div></section>
<section class="band" style="padding-top:0"><div class="wrap split">
<div class="prose">
<p>Puppy Connection started in northern Indiana, built on many years of experience in showing, breeding, grooming, photographing and studying dogs, including teaching courses in grooming, breeding, conformation and genetics.</p>
<p>Today it is a directory. Small family breeders list their own puppies here, each with photos, a price, birth and go-home dates and what comes home with the puppy, and families contact the breeder directly. Every breeder is approved by Puppy Connection before their first puppy goes up.</p>
<p>${replace('a few sentences from Amber on why she started Puppy Connection and what she looks for in a breeder.')}</p>
<h2>What we ask of the breeders who list here</h2>
<ul class="includes" style="columns:1">
<li>Health testing information where they have it</li>
<li>Registration details</li>
<li>Clear, honest photographs of the actual puppy</li>
<li>Accurate dates and pricing</li>
<li>Ongoing support for the families who buy from them</li>
</ul>
<p>Puppy Connection lists puppies and does not sell them, so the sale, the paperwork and the conversation are between you and the breeder.</p>
</div>
<aside><div class="breeder-box"><p class="eyebrow">Find your puppy</p><p class="breeder-note">Browse the puppies listed now, or look by breed or by breeder.</p>
<div class="btn-row"><a class="btn btn-primary" href="puppies.html">See available puppies</a></div>
<p style="margin:.8rem 0 0"><a href="breeds.html">Browse breeds</a> · <a href="breeders.html">Meet the breeders</a></p></div></aside>
</div></section>`,
  },
  {
    file: 'how-it-works.html', name: 'How it works',
    title: 'How Puppy Connection Works | Find a Puppy from a Family Breeder',
    desc: 'How to find a puppy on Puppy Connection: browse by breed or state, see each puppy and its breeder, and contact the breeder directly. How breeders list, too.',
    body: `<section class="band" style="padding-bottom:1.4rem"><div class="wrap"><p class="eyebrow">How it works</p><h1>How Puppy Connection works</h1>
<p class="lede">Puppy Connection shows you puppies from small family breeders and puts you in touch with the breeder. The breeder does the rest.</p></div></section>
<section class="band" style="padding-top:0"><div class="wrap">
<div class="sec-head"><div><p class="eyebrow">For families</p><h2>Finding your puppy</h2></div></div>
<ol class="steps">
<li><h3>Browse</h3><p>Look through <a href="puppies.html">every available puppy</a>, or start from a <a href="breeds.html">breed</a> or a <a href="breeders.html">breeder</a>. Each breed page also answers what families ask most, such as how big the breed gets and what puppies cost here.</p></li>
<li><h3>Open a puppy</h3><p>Each puppy has its own page with its photos, price, deposit, birth and go-home dates, and what it goes home with.</p></li>
<li><h3>Contact the breeder</h3><p>Call, email or visit the breeder's website straight from the puppy's page. Your conversation is with the breeder, never with us.</p></li>
<li><h3>Arrange the rest with the breeder</h3><p>Visits, deposits, paperwork, health records and guarantees are agreed between you and the breeder. If you are not local, <a href="transportation.html">Furry Freight can deliver your puppy</a>.</p></li>
</ol>
<p class="disclaimer" style="margin-top:1.2rem">Puppy Connection does not sell puppies. Read our <a href="tips-on-buying-a-puppy.html">tips on buying a puppy</a> before you choose.</p>
</div></section>
<section class="band band-warm"><div class="wrap split">
<div><p class="eyebrow">For breeders</p><h2>Listing your puppies</h2>
<p>Breeders create an account, fill in their profile and are approved by Puppy Connection. After that they add their litters and puppies with photos, and each puppy is $14.99 to list, paid once, with no commission on the sale.</p>
<p>Every inquiry goes straight to the breeder, and the breeder portal shows how many families viewed and contacted each puppy.</p></div>
<div style="align-self:center"><div class="btn-row"><a class="btn btn-primary" href="list-with-us.html">List your puppies</a></div></div>
</div></section>`,
  },
  {
    file: 'tips-on-buying-a-puppy.html', name: 'Tips on buying a puppy',
    title: 'Tips on Buying a Puppy | Puppy Connection',
    desc: 'How to choose a reputable breeder, check health clearances and pick a well-socialized puppy, and how to get your home ready for its arrival.',
    body: `<section class="band" style="padding-bottom:1.4rem"><div class="wrap"><p class="eyebrow">Tips</p><h1>Tips on buying a puppy</h1>
<p class="lede">When buying a puppy, it's essential to make informed choices so it grows into a healthy, well-adjusted companion. These tips cover choosing a puppy and getting ready for its arrival.</p></div></section>
<section class="band" style="padding-top:0"><div class="wrap split">
<div class="prose qa">
<h2>Choose a reputable breeder or rescue</h2>
<p>Look for breeders who prioritize health, temperament and responsible breeding practices. When possible, visit the breeder's home or facility to see where the puppies are raised. If you aren't close, ask for a video call or live video so you can see how the puppy interacts. Avoid pet stores and puppy mills, which often produce unhealthy, poorly socialized dogs.</p>
<h2>Check health clearances</h2>
<p>Make sure the breeder has the adults seen regularly by a vet. It also helps if they provide health clearances for genetic conditions common to the breed, such as hip dysplasia, heart issues and eye disorders. Ask about vaccinations, deworming and vet checkups.</p>
<h2>Observe the puppy's behavior and socialization</h2>
<p>Choose a puppy that is friendly, curious and confident, and avoid puppies that seem overly shy, fearful or aggressive. Puppies should meet a range of people, sights and sounds in their first weeks of life, and a well-socialized puppy adapts better to new situations and is easier to train.</p>
<h2>Consider the breed's needs</h2>
<p>Research the breed's energy level, grooming needs and health concerns, and make sure the breed fits your lifestyle, home and experience. Each <a href="breeds.html">breed page</a> here covers size, shedding, temperament and lifespan.</p>
<h2>Prepare for your puppy's arrival</h2>
<h3>Puppy-proof your home</h3>
<p>Remove hazards like electrical cords, toxic plants and small objects a puppy could swallow, and set up a safe space, such as a crate or a gated area, for sleeping and resting.</p>
<h3>Get the right supplies</h3>
<ul class="includes" style="columns:1"><li>High-quality puppy food</li><li>Food and water bowls</li><li>A crate and bedding</li><li>Chew toys and training treats</li><li>A collar, leash and ID tag</li><li>Puppy-safe shampoo and grooming tools</li></ul>
<h3>Plan for socialization and training</h3>
<p>Introduce your puppy to new people, sounds and places gradually. Start house training straight away with a consistent routine, and reward good behavior with praise and treats.</p>
<h3>Schedule a vet visit</h3>
<p>Take your puppy to the vet within the first few days for a health check, and ask about vaccinations, deworming and flea prevention.</p>
<h3>Set a routine and boundaries</h3>
<p>Puppies thrive on predictability, so set a schedule for feeding, potty breaks, play and training. Decide as a family what the rules are, such as whether the puppy is allowed on the furniture, because consistency avoids confusion. A crate or a set space keeps your puppy safe when you can't watch closely, and it should be a happy place to rest.</p>
</div>
<aside><div class="breeder-box"><p class="eyebrow">Ready to look?</p><p class="breeder-note">Every puppy here is listed by the breeder who raised it.</p><div class="btn-row"><a class="btn btn-primary" href="puppies.html">See available puppies</a></div></div></aside>
</div></section>`,
  },
  {
    // Launch item A7 (Alex, 2026-10-17): Furry Freight, the pet transportation company in
    // Pierceton, Indiana. Families book and pay Furry Freight directly. Old /transportation 301s here.
    file: 'transportation.html', name: 'Transportation',
    title: 'Puppy Transportation and Delivery | Puppy Connection',
    desc: 'Too far to pick up your puppy? Furry Freight, a pet transportation company in Pierceton, Indiana, delivers by road and air. Book with them directly.',
    body: `<section class="band" style="padding-bottom:1.4rem"><div class="wrap wrap-mid"><p class="eyebrow">Transportation</p><h1>Getting your puppy home</h1>
<p class="lede">Most families pick their puppy up from the breeder. When the breeder is too far away, a pet transportation company can bring the puppy to you.</p></div></section>
<section class="band" style="padding-top:0" id="delivery"><div class="wrap wrap-mid">
<div class="partner">
<img class="partner-logo" src="img/brand/furry-freight-logo.png" alt="Furry Freight Pet Transportation" width="420" height="331" loading="lazy" decoding="async">
<div class="partner-copy">
<h2>Delivery with Furry Freight</h2>
<p>Furry Freight is a pet transportation company in Pierceton, Indiana. They run regular ground routes to the East Coast, the West Coast and the South, and when the timing calls for it they can fly a puppy with a chaperone or meet you at an airport.</p>
<p>You book and pay for delivery with Furry Freight directly, not through Puppy Connection. Ask them for a quote before you put down a deposit, so the whole cost is in front of you when you decide.</p>
<div class="btn-row"><a class="btn btn-primary" href="https://www.furryfreightdelivery.com/schedule-a-delivery" target="_blank" rel="noopener">Get a delivery quote</a><a class="btn btn-ghost" href="tel:+12605855209">(260) 585-5209</a></div>
<p class="fine">Or email <a href="mailto:furryfreightpetdelivery@gmail.com">furryfreightpetdelivery@gmail.com</a>.</p>
</div>
</div>
</div></section>
<section class="band band-warm"><div class="wrap wrap-mid split">
<div><p class="eyebrow">Before you ask for a quote</p><h2>What to have ready</h2>
<ul class="includes" style="columns:1">
<li>The go-home date you have agreed with the breeder</li>
<li>The breeder's town, which you will find on the puppy's page</li>
<li>Your own town, or the airport you would rather meet at</li>
</ul>
<p>Pickup and delivery are agreed between you, the breeder and Furry Freight, so check the date with the breeder before you book.</p></div>
<div style="align-self:center"><div class="btn-row"><a class="btn btn-primary" href="puppies.html">See available puppies</a></div></div>
</div></section>`,
  },
  {
    file: 'reviews.html', name: 'Reviews',
    title: 'Reviews | Puppy Connection',
    desc: 'What families say about finding their puppy through Puppy Connection.',
    body: `<section class="band" style="padding-bottom:1.4rem"><div class="wrap"><p class="eyebrow">Reviews</p><h1>What families say</h1>
<p class="lede">Reviews families have left for Puppy Connection on Google, in their own words.</p></div></section>
<section class="band" style="padding-top:0"><div class="wrap">
<div class="reviews">
<figure class="review"><blockquote><p>"We found the perfect dog for our family through Puppy Connection. Jackson is a healthy Miniature Schnauzer puppy, and it is very obvious that the breeder spent a lot of time socializing him. He is our 4th Miniature Schnauzer and he is by far the easiest for us to intergrate into our household. He is wonderful! Puppy Connection provided us with great information on how to plan for a new puppy in our home, and they kept us apprised on Jackson's travel arrangements. The transport company used to bring Jackson to us is fabulous. We did have to wait 10 days for his pick up from the breeder, but the transport company had great communication with us and the drivers truly cared about our dog. Our family highly recommends Puppy Connection for a healthy, happy puppy."</p></blockquote><figcaption>Ann, on Google</figcaption></figure>
<figure class="review"><blockquote><p>"Adopted our sweet Corbin (now Teddy) using Puppy Connection. We had a great experience from start to finish and the process was very smooth. Teddy's breeder was amazing and communicated well throughout the process until our boy was delivered. Thanks to Gabriel Helmuth for providing us with this healthy, energetic, adorable puppy. Puppy Connection will be recommended by us!"</p></blockquote><figcaption>Debbie, on Google</figcaption></figure>
<figure class="review"><blockquote><p>"I bought my puppy &ldquo;Kylie&rdquo; AKA Lucy from Perfect Match Poodles in December of 2025. She is 8 months old now, and has a great personality, and great confirmation. Her AKC Genetic Health Testing came back all clear, and we couldn't be more pleased. Gabriel Helmuth at Perfect Match Poodles had a beautiful set up and was amazing to work with from the first time I contacted them. I wouldn't hesitate to purchase from them again."</p></blockquote><figcaption>J &amp; J, on Google</figcaption></figure>
<figure class="review"><blockquote><p>"Best of the best. I was looking for pomeranian puppy for months. Internet is full of people who tried to scam me. Then I found puppy connection. Best choice I ever made. I can't decide which puppy . They made video visit with both puppy's. And few days after the puppy was delivered to my door step . I will not go with anybody else. My sweet Payton is amazing."</p></blockquote><figcaption>Míša, on Google</figcaption></figure>
<figure class="review"><blockquote><p>"We had a wonderful experience with Puppy Connection. From the very beginning, the team was incredibly helpful and supportive throughout the entire process. They stayed in touch with us regularly, arranged video calls, and took the time to show us our puppy before pickup, which made us feel confident and excited. They were always available to answer questions, provided updates, and genuinely cared about making sure everything went smoothly. The whole experience felt professional, transparent, and personal at the same time. We are so happy with our puppy Woody and grateful for all the support we received. I highly recommend Puppy Connection!"</p></blockquote><figcaption>Yeva, on Google</figcaption></figure>
<figure class="review"><blockquote><p>"Puppy Connection was extremely knowledgeable and helpful. Very organized and thorough. All paperwork was validated and explained. Sent me hope with food / small blanket / pull squeaky toy. I have passed on there information to possible future potential dog owners."</p></blockquote><figcaption>Thomas, on Google</figcaption></figure>
<figure class="review"><blockquote><p>"Our sweet Havanese - Cedric- came from Puppy Connection. Everything was well managed and organised. Cedric's brought a lot of love to our home!! We feel very blessed. Also thank you to Perry!"</p></blockquote><figcaption>Richard, on Google</figcaption></figure>
<figure class="review"><blockquote><p>"Great communication , makes sure you're well prepared , no hidden fees , all straight forward! Very nice people as well."</p></blockquote><figcaption>Kim, on Google</figcaption></figure>
<figure class="review"><blockquote><p>"Very easy to work with. Great communication and follow up afterwards. I would definitely recommend them to anyone looking for a new puppy and will use them in the future if I ever decide to get another dog. Thank you so much for your help!"</p></blockquote><figcaption>Michael, on Google</figcaption></figure>
<figure class="review"><blockquote><p>"My mini poodle is absolute perfection. She is not only sweet but in perfect health, definitely recommend!"</p></blockquote><figcaption>Alicia, on Google</figcaption></figure>
<figure class="review"><blockquote><p>"Thank you so much for your efforts to get me a new pet. You couldn't have made a better choice. Foxy (Pomeranian raised by Marion Bontrager) is the perfect fit for me at this time of my life. He is calm, quiet, walks very well on his leash and seems to like me a lot. He follows me everywhere. Before 24 hours living here he was sitting on my lap, eating and drinking and tolerating the crate, which he had to sleep in the first night. Just wanted you to know how thankful I am and how perfectly he fits into my life."</p></blockquote><figcaption>Kathy, Goshen, Indiana</figcaption></figure>
<figure class="review"><blockquote><p>"We have been wanting to adopt another sweet fur baby for a few months and finally decided to make it happen! The photography of the fur babies is top notch! We adopted our little 2 lb Cavapoo yesterday and she looks exactly like the photos show on this site. The experience of working with the breeder was also seamless. Thank you for providing high quality services for listing puppies needing a furever home! 5/5 stars!"</p></blockquote><figcaption>Allison</figcaption></figure>
<figure class="review"><blockquote><p>"I had a fantastic experience with Puppy Connection. The website was convenient and gave me a number of puppies to choose from so I found just what I was looking for. I'd heard horror stories about scams but Nero (now Grimm) was just as pictured. My breeder Rosemary Yoder was equally great to work with. He is loving, self-assured, nearly house trained after only two weeks with no crating, and the best mannered student in puppy class. He's been the greatest little guy. It's a dream!"</p></blockquote><figcaption>A Puppy Connection family</figcaption></figure>
</div>
<div class="btn-row" style="margin-top:1.4rem"><a class="btn btn-primary" href="puppies.html">See available puppies</a></div>
</div></section>`,
  },
  {
    file: 'contact.html', name: 'Contact',
    title: 'Contact Puppy Connection',
    desc: 'How to reach Puppy Connection about listing your puppies or about the directory. Questions about a puppy go to its breeder.',
    body: `<section class="band" style="padding-bottom:1.4rem"><div class="wrap"><p class="eyebrow">Contact</p><h1>Contact Puppy Connection</h1>
<p class="lede">For a question about a puppy, contact its breeder from the puppy's page, since the breeder knows the puppy and handles the sale.</p></div></section>
<section class="band" style="padding-top:0"><div class="wrap split">
<div class="prose">
<h2>Listing your puppies, or a question about the directory</h2>
<ul class="contact-list">
<li><b>Email</b> ${replace("Puppy Connection's email address")}</li>
<li><b>Phone or text</b> ${replace("Puppy Connection's phone number, if Amber wants one shown")}</li>
</ul>
<p>Breeders who already list can sign in to the <a href="https://portal.puppyconnection.workers.dev/">breeder portal</a> to change a listing, see their views and clicks, or pay to list.</p>
</div>
<aside><div class="breeder-box"><p class="eyebrow">Breeders</p><p class="breeder-note">$14.99 per puppy, paid once, with every inquiry going straight to you.</p><div class="btn-row"><a class="btn btn-primary" href="list-with-us.html">List your puppies</a></div></div></aside>
</div></section>`,
  },
];
