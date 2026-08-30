# Page bodies for the concept build. Composed by genpages.py.

PUPPIES = """<section class="band" style="padding-bottom:1.5rem">
  <div class="wrap">
    <p class="eyebrow">Listings</p>
    <h1 id="browseTitle">All available puppies</h1>
    <p class="lede">Every puppy below is raised and sold by the breeder named on its page. Puppy Connection lists them, then hands you straight over.</p>
  </div>
</section>

<section class="band" style="padding-top:0">
  <div class="wrap rail-layout">
    <button type="button" class="rail-trigger" id="railOpen" aria-expanded="false" aria-controls="rail">
      Filters
    </button>
    <div class="rail-backdrop" id="railBackdrop" hidden></div>
    <aside class="rail" id="rail">
      <div class="rail-head">
        <span>Filters</span>
        <button type="button" class="rail-close" id="railClose" aria-label="Close filters">Close</button>
      </div>
      <h3>Breed</h3>
      <div id="filterBreeds"></div>
      <h3>Price up to</h3>
      <label><input type="radio" name="max" value="1500"><span>$1,500</span></label>
      <label><input type="radio" name="max" value="2000"><span>$2,000</span></label>
      <label><input type="radio" name="max" value="2500"><span>$2,500</span></label>
      <label><input type="radio" name="max" value="3500"><span>$3,500</span></label>
      <h3>Availability</h3>
      <label><input type="checkbox" name="avail"><span>Hide adopted puppies</span></label>
      <button type="button" class="rail-reset" id="reset">Clear all filters</button>
      <button type="button" class="btn btn-primary rail-done" id="railDone">Show results</button>
    </aside>
    <div>
      <div class="result-bar">
        <span class="count" id="resultCount"></span>
        <span class="count">Sorted by price</span>
      </div>
      <div class="grid grid-4" id="results"></div>
      <div class="more-row" id="moreRow"></div>
    </div>
  </div>
</section>"""

PUPPY = """<main id="detail">
<section class="band" style="padding-bottom:0">
  <div class="wrap detail-grid">
    <div class="d-title">
      <p class="eyebrow" id="dBreed"></p>
      <div class="name-row">
        <h1 id="dName"></h1>
        <span class="price" id="dPrice"></span>
      </div>
    </div>
    <div class="d-media">
      <div class="gallery-main" id="dMain"></div>
      <div class="thumbs" id="dGallery"></div>
      <section class="about-block">
        <p class="eyebrow">About this puppy</p>
        <p id="dDesc"></p>
        <p class="disclaimer" id="dNote"></p>
      </section>
    </div>
    <div class="d-detail">
      <dl class="facts" id="dFacts"></dl>

      <section>
        <p class="eyebrow">Goes home with</p>
        <ul class="includes" id="dIncludes"></ul>
      </section>

      <div class="breeder-box" id="dBreeder"></div>
      <p class="disclaimer">Puppy Connection does not sell puppies, take deposits, or handle payment. Health records, guarantees and delivery are agreed directly between you and the breeder.</p>
    </div>
  </div>
</section>

<section class="band band-warm">
  <div class="wrap">
    <div class="sec-head">
      <div>
        <p class="eyebrow">Same litter</p>
        <h2><span id="dMatesCount"></span> littermates also available</h2>
      </div>
      <a class="link-more" href="puppies.html">All puppies</a>
    </div>
    <div class="grid grid-4" id="dMates"></div>
  </div>
</section>
</main>"""

BREEDERS_INDEX = """<main id="breederIndex-page">
<section class="band" style="padding-bottom:1.4rem">
  <div class="wrap">
    <p class="eyebrow">Directory</p>
    <h1>The breeders behind the listings</h1>
    <p class="lede">Every puppy on this site is raised and sold by one of these breeders. We list their puppies. They handle the sale, the paperwork and the conversation with your family.</p>
  </div>
</section>

<section class="band" style="padding-top:0">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="eyebrow">Currently listing</p><h2><span id="breederIndexCount"></span> breeders</h2></div>
      <a class="link-more" href="puppies.html">Browse all puppies</a>
    </div>
    <div class="grid grid-4" id="breederIndex"></div>
  </div>
</section>

<section class="band band-warm">
  <div class="wrap">
    <div class="sec-head">
      <div>
        <p class="eyebrow">Profiles</p>
        <h2>Written breeder profiles</h2>
      </div>
    </div>
    <p class="lede" style="margin-bottom:1.5rem">Puppy Connection has written profiles for these breeders. In the live catalog they are not yet linked to listings, which is one of the joins worth making.</p>
    <div class="grid grid-3" id="profileExamples"></div>
  </div>
</section>
</main>"""

BREEDER = """<main id="profile">
<section class="band" style="padding-bottom:1.6rem">
  <div class="wrap">
    <p class="eyebrow"><a href="breeders.html" style="color:inherit">Breeders</a></p>
    <div class="profile-head">
      <h1 id="pName"></h1>
      <p class="meta" id="pPeople"></p>
    </div>
  </div>
</section>

<section class="band" style="padding-top:0">
  <div class="wrap split">
    <div class="prose" id="pBody"></div>
    <aside>
      <figure class="breeder-logo" id="pLogo"></figure>
      <div class="breeder-box" id="pContact"></div>
      <div class="btn-row"><a class="btn btn-primary" href="#their">See their puppies</a></div>
    </aside>
  </div>
</section>

<section class="band band-warm" id="their">
  <div class="wrap">
    <div class="sec-head">
      <div>
        <p class="eyebrow">Currently listed</p>
        <h2><span id="pCount"></span> puppies from this breeder</h2>
      </div>
      <a class="link-more" href="puppies.html">All puppies</a>
    </div>
    <div class="grid grid-4" id="pListings"></div>
  </div>
</section>

<section class="band">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">Directory</p><h2>Other breeders</h2></div>
      <a class="link-more" href="breeders.html">All breeders</a></div>
    <div class="grid grid-3" id="pAll"></div>
  </div>
</section>
</main>"""

BREEDS_INDEX = """<main id="breedIndex-page">
<section class="band" style="padding-bottom:1.4rem">
  <div class="wrap">
    <p class="eyebrow">Breeds</p>
    <h1>Find the breed that suits your family</h1>
    <p class="lede">Every breed currently listed, with what is available now and a guide where one has been written.</p>
  </div>
</section>

<section class="band" style="padding-top:0">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="eyebrow">Listed here</p><h2><span id="breedIndexCount"></span> breeds</h2></div>
      <a class="link-more" href="puppies.html">Browse all puppies</a>
    </div>
    <div class="grid grid-4" id="breedIndex"></div>
  </div>
</section>
</main>"""

BREED = """<main id="breedPage">
<section class="band" style="padding-bottom:1.4rem">
  <div class="wrap">
    <p class="eyebrow"><a href="breeds.html" style="color:inherit">Breeds</a></p>
    <h1 id="bName"></h1>
    <p class="meta" id="bCount"></p>
  </div>
</section>

<section class="band" style="padding-top:0">
  <div class="wrap split">
    <div class="guide" id="bGuide"></div>
    <aside>
      <figure class="breed-photo" id="bPhoto"></figure>
      <div class="breeder-box">
        <p class="eyebrow">How this works</p>
        <p class="breeder-note">Choose a puppy, then contact its breeder directly. Puppy Connection lists puppies. It does not sell them, take deposits or handle payment.</p>
        <div class="btn-row"><a class="btn btn-primary" href="#available">See what is available</a></div>
      </div>
    </aside>
  </div>
</section>

<section class="band band-warm" id="available">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="eyebrow">Available now</p><h2>Puppies of this breed</h2></div>
      <a class="link-more" href="puppies.html">All puppies</a>
    </div>
    <div class="grid grid-4" id="bListings"></div>
  </div>
</section>

<section class="band">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">Also popular</p><h2>Other breeds</h2></div>
      <a class="link-more" href="breeds.html">All breeds</a></div>
    <div class="grid grid-4" id="bOthers"></div>
  </div>
</section>
</main>"""

LIST = """<section class="band band-dark">
  <div class="wrap split">
    <div>
      <p class="eyebrow eyebrow-light">For breeders</p>
      <h2 style="font-size:clamp(2rem,4.4vw,3.2rem)">Helping responsible breeders connect with the right families</h2>
      <p>Good breeders deserve good marketing. List your puppies where families are already searching, keep control of your pricing and your process, and talk to buyers yourself.</p>
      <div class="btn-row"><a class="btn btn-gold" href="#pricing">Start listing</a></div>
    </div>
    <div style="align-self:center">
      <div class="price-card" id="pricing" style="background:transparent;border-color:var(--gold);color:var(--cream-text)">
        <div class="price-big" style="color:var(--gold)"><sup>$</sup>14.99</div>
        <p class="meta" style="color:var(--cream-text)">per puppy listed</p>
        <p style="font-size:.95rem;margin:1rem 0 0">No commission. No cut of your sale. Add a whole litter and pay for it in one checkout.</p>
      </div>
    </div>
  </div>
</section>

<section class="band" id="how">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">How it works</p><h2>Five steps, start to finish</h2></div></div>
    <ol class="steps">
      <li><h3>Create your account</h3><p>Register as a breeder. It takes a few minutes and costs nothing.</p></li>
      <li><h3>Build your profile</h3><p>Tell families about your program, your experience, your health testing, and what makes your puppies special.</p></li>
      <li><h3>Add your puppies</h3><p>Photos, dates, registration, pricing and health details. Add a whole litter at once and reuse everything they share.</p></li>
      <li><h3>Pay and publish</h3><p>$14.99 per puppy, paid for the litter in one checkout. Listings go live once reviewed.</p></li>
      <li><h3>Talk to families</h3><p>Interested buyers contact you directly through your listing. We are not part of the conversation or the sale.</p></li>
    </ol>
  </div>
</section>

<section class="band band-warm">
  <div class="wrap split">
    <div>
      <p class="eyebrow">Why list here</p>
      <h2>An audience that is already looking</h2>
      <p>Puppy Connection has been listing puppies since 2020. Families arrive searching for a breed rather than browsing a marketplace, so the people who reach your listing already want what you raise.</p>
      <p>Your listing carries your kennel name, your profile and your contact details. Every enquiry goes to you.</p>
    </div>
    <div>
      <p class="eyebrow">What we ask of you</p>
      <ul class="includes" style="columns:1">
        <li>Health testing information where you have it</li>
        <li>Registration details</li>
        <li>Clear, honest photographs of the actual puppy</li>
        <li>Accurate dates and pricing</li>
        <li>Ongoing support for the families who buy from you</li>
      </ul>
      <p style="margin-top:1rem;font-size:.95rem;color:var(--ink-soft)">Families appreciate transparency. The more you share, the more confidence they have in choosing your program.</p>
    </div>
  </div>
</section>

<section class="band band-dark">
  <div class="wrap" style="text-align:center">
    <h2>Ready to list your litter?</h2>
    <p style="margin-inline:auto">Create your breeder account and add your first puppies today.</p>
    <div class="btn-row" style="justify-content:center"><a class="btn btn-gold" href="#pricing">Create my breeder account</a></div>
  </div>
</section>"""
