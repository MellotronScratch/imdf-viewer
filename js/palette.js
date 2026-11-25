"use strict";
// Kleurpaletten per thema en categoriegroepen (OGC 20-094).

// ---------- Styling per category ----------
// Kaartpaletten per thema. Koele, rustige neutralen; functie-ruimtes krijgen een zachte tint
// (verticaal transport = blauw, sanitair = lavendel, verblijf = zand, groen = salie).
const PALETTE = {
  light: {
    bg: "#e9edf2", venueFill: "#ffffff", venueLine: "#4c5fd5", levelFill: "#fbfcfd", levelLine: "#8a95a5", hl: "#4c5fd5",
    line: "#c3cbd6", detail: "#a3adbb", opening: "#fbfcfd", text: "#1d2330", halo: "#ffffff",
    unitOpacity: 1, sectionGlow: 0.32, fixtureOpacity: 1, kiosk: "#c9d1dc",
    raster: { opacity: 0.6, sat: 0, min: 0, max: 1 },
    unit: { walkway: "#fbfcfd", room: "#eef1f6", nonpublic: "#e1e5eb", structure: "#c5ccd6", unspecified: "#f1f3f7",
      glass: "#d9eef5", brick: "#e7d6ca", stairs: "#dde5ff", escalator: "#dde5ff", elevator: "#d0dbff",
      movingwalkway: "#e4eaff", ramp: "#e4eaff", restroom: "#ece5fb", lounge: "#f6eddc", parking: "#e6e9ee",
      platform: "#e8e2d6", terrace: "#e2efe1", road: "#d9dde3", opentobelow: "rgba(0,0,0,0)" },
    // Section-kleuren: alleen de rand + een zachte gloed naar binnen, het midden blijft transparant
    section: { seating: "#b98545", security: "#e03e52", presecurity: "#f08c3c", postsecurity: "#1b9aaa", walkway: "#7f95ae",
      vegetation: "#4fa64a", parking: "#5f6fd1", road: "#87909c", baggageclaim: "#2f86d6", platform: "#a5794f",
      gate: "#e0a800", service: "#ae3ec9", retail: "#e64980", leisure: "#7c5cdb", _: "#94a0b0" },
    fixture: { furniture: "#d5dbe4", "checkin.desk": "#b9c6ec", desk: "#d0d6df", baggagecarousel: "#aebbd8", _: "#cdd4de" }
  },
  dark: {
    bg: "#0b0f15", venueFill: "#111720", venueLine: "#8d9bff", levelFill: "#121821", levelLine: "#556277", hl: "#8d9bff",
    line: "#3a4659", detail: "#465367", opening: "#232c39", text: "#e7ebf2", halo: "#0b0f15",
    unitOpacity: 1, sectionGlow: 0.4, fixtureOpacity: 1, kiosk: "#36404f",
    raster: { opacity: 0.5, sat: -1, min: 0.8, max: 0.06 },   // min>max keert de grijze BRT-tegels om → donkere ondergrond
    unit: { walkway: "#232c39", room: "#2c3647", nonpublic: "#1d2530", structure: "#465266", unspecified: "#283241",
      glass: "#1d3641", brick: "#3a2e28", stairs: "#25305a", escalator: "#25305a", elevator: "#2b3870",
      movingwalkway: "#243050", ramp: "#243050", restroom: "#302a4c", lounge: "#382f22", parking: "#232a34",
      platform: "#332e26", terrace: "#1f3324", road: "#2a313b", opentobelow: "rgba(0,0,0,0)" },
    section: { seating: "#d6a566", security: "#ff6b7d", presecurity: "#ffa860", postsecurity: "#3cc6d4", walkway: "#8fa3bd",
      vegetation: "#73c46d", parking: "#8c9bff", road: "#7d8794", baggageclaim: "#5eaaf2", platform: "#c4986a",
      gate: "#ffd43b", service: "#da77f2", retail: "#f783ac", leisure: "#a28bff", _: "#8a96a8" },
    fixture: { furniture: "#333d4b", "checkin.desk": "#354679", desk: "#343e4c", baggagecarousel: "#3b4a72", _: "#323b48" }
  }
};
// Section-categorieën (OGC 20-094) → kleurgroep
const SECTION_GROUPS = [
  ["seating", /^seating/], ["security", /^security$/], ["presecurity", /^presecurity$/], ["postsecurity", /^(postsecurity|paidarea)$/],
  ["walkway", /^walkway$/], ["vegetation", /^vegetation$/], ["parking", /^(parking|parkandride|carrental)/], ["road", /^road$/],
  ["baggageclaim", /^baggageclaim/], ["platform", /^platform$/], ["gate", /^(gatearea|recomposearea)/],
  ["service", /^(checkin|ticketing|information|servicearea|immigration)/],
  ["retail", /^(retail|dutyfree|concessions|eatingdrinking|rental)/],
  ["leisure", /^(entertainmentarea|gambling|recreation|exhibit|arcade)/],
];
const sectionGroup = c => (SECTION_GROUPS.find(([, re]) => re.test(c || "")) || ["_"])[0];
// restroom.* erft de restroom-kleur
for (const p of Object.values(PALETTE)) for (const k of ["male", "female", "wheelchair", "family", "unisex", "transgender"]) p.unit["restroom." + k] = p.unit.restroom;

// Puntkleuren (gebaseerd op Open Color): helder genoeg voor beide thema's
const AMENITY_GROUPS = [
  { name: "Sanitair",  color: "#7950f2", test: c => /^(restroom|babychanging|shower|mothersroom|handsanitizerstation|caregiver)/.test(c) },
  { name: "Reizen",    color: "#1c7ed6", test: c => /^(boardinggate|arrivalgate|checkin|ticketing\.airline|security|baggage|immigration|customs|gatearea|paidarea|faregate)/.test(c) },
  { name: "Vervoer",   color: "#0c8599", test: c => /^(carrental|bus|taxi|parking|parkandride|traintrack|train|rail|transit|shuttle|limo|rideshare|valet|groundtransportation|peoplemover|platform|vendingmachine\.trainticket|ticketing|information\.transit)/.test(c) },
  { name: "Veiligheid",color: "#e03131", test: c => /^(defibrillator|firstaid|police|fire|emergencyshelter|healthscreening|mobilityrescue|phone\.emergency)/.test(c) },
  { name: "Service",   color: "#f08c00", test: c => true },
];
// Occupantgroepen volgens de IMDF-occupantcategorieën (OGC 20-094). Keukens (chinese, italian, …) vallen onder eten & drinken.
const FOOD_RE = new RegExp("^(" + [
  "restaurant","cafe","cafeteria","canteen","coffee","tea","bubbletea","juicebar","milkbar","milkshakes","bar","beerbar","beergarden","beerhall","pub","irishpub","gastropubs",
  "brewery","brewpub","distillery","cider","winebar","winery","winetasting","champagnebar","cocktailbar","loungebar","airportloungebar","hotelbar","pianobar","sportsbar","divebar",
  "tikibar","whiskeybar","sakebar","hookahbar","cigarbar","oxygenbar","food","foodcourt","foodstand","foodtruck","fastfood","kiosk\\.food","bakedgoods","bagels","bistro","buffet",
  "burgers","barbecue","barfood","breakfastandbrunch","cakes","cupcakes","customcakes","candy","chocolate","crepes","churros","chimneycakes","delicatessen","desserts","diner",
  "donuts","dumplings","falafel","fish","fishandchips","gelato","hotdogs","icecream","shavedice","shavedsnow","macaron","noodles","pasta","pizza","poke","pretzels","salad",
  "sandwiches","seafood","soup","steak","sushi","conveyorsushi","tacos","tapas","waffles","wok","wraps","kebab","donair","pita","flatbread","popcorn","potatoes","poutineries",
  "rotisseriechicken","chickenshop","chickenwings","cheesesteaks","comfortfood","soulfood","nightfood","rawfood","healthyfoods","glutenfree","halal","kosher","vegan","vegetarian",
  "familyrestaurant","trattoria","taberna","izakaya","kaiseki","robatayaki","rodizio","riceshop","congee","hotpot","fondue","giblets","meatballs","tofu","themedcafe","internetcafe",
  "supperclub","dinnertheater","eatertainment","catering","acai","beverage","cheese","cheese","grocery","grocerystore","supermarket","hypermarket","conveniencestore","gourmet",
  "specialtyfood","importedfood","internationalfood","ethnicgrocerystore","organicfood","frozenfoods","fruitandvegetables","seafoodmarket","butcher","honey","oliveoil","herbsandspices",
  "beerwine","afghani","african","american","arabian","argentine","armenian","asianfusion","asturian","australian","austrian","bangladeshi","belgian","bengali","biryani","blacksea",
  "brazilian","british","bulgarian","burmese","cajun","cambodian","canadian","caribbean","chilean","chinese","colombian","corsican","cuban","cypriot","czech","danish","dominican",
  "easterneuropean","egyptian","ethiopian","european","filipino","french","freiduria","friterie","german","georgian","greek","haitian","hawaiian","himalayan","hongkong","hungarian",
  "iberian","indian","indonesian","irish","israeli","italian","japanese","jewish","korean","kurdish","laotian","latinamerican","lebanese","ligurian","malaysian","mamak","mauritian",
  "mediterranean","mexican","middleeastern","mongolian","moroccan","mughlai","naga","nasilemak","nepalese","newzealand","nicaraguan","northamerican","norwegian","nyonya","okinawan",
  "oriental","ottoman","paella","pakistani","parma","parsi","persian","peruvian","piadina","polish","portuguese","puertorican","punjabi","reunionnese","romanian","russian",
  "salvadoran","scandinavian","scottish","senegalese","serbianandcroatian","singaporean","slovakian","southafrican","southernunitedstates","southwestunitedstates","spanish",
  "srilankan","swedish","swiss","syrian","taiwanese","taiyaki","tamales","texmex","thai","tibetan","trinidadian","turkish","ukrainian","uzbek","venezuelan","venison","vietnamese",
  "welsh","yugoslav","kopitiam","kashmiri","opensandwiches","empanadas","beisl","japanesesweets","diyfood","fooddelivery"].join("|") + ")([.]|$)");
const SERVICE_RE = /^(bank|atm|financialservices|investmentbanking|moneytransfer|currencyexchange|coincashing|pawn|paydayloan|installmentloan|titleloan|insurance|accounting|tax|lawyer|legalservices|notarypublic|pharmacy|hotel|hostel|bedbreakfast|vacationhome|massage|dayspa|spa|beautysalon|beautyspas|medicalspa|barber|hair|manicurists|makeupartist|eyelashes|tanning|tattoo|bodypiercing|skincare|sauna|floatspa|cryotherapy|reflexology|clinic|medicalcenter|hospital|healthcare|physician|urgentcare|walkinclinic|emergencymedicine|dent|orthodontics|optometry|opthamalogy|chiropractic|physicaltherapy|acupuncture|psych|dermatology|pediatrics|veterinarian|pets\.|laboratorytesting|diagnostic|blooddonation|postoffice|courier|shipping|packagelocker|mailboxcenter|packing|luggagestorage|travelagent|travelservices|tours|airline|airportshuttle|carrental|auto\.|taxi|limo|rideshare|towncarservice|valetservices|busrental|truckrental|bicyclerental|ferry|publictransport|trainstation|subwaystation|busstop|terminal|transitlounge|apmstop|parking|fuelstation|phonechargingstation|corporate|officebuilding|sharedofficespace|businesscampus|professionalservices|businessconsulting|advertising|marketing|employmentagency|realestate|propertymanagement|informationtechnology|telecommunications|internetserviceprovider|copyshop|printing|laundr|drycleaning|sewingalterations|repair|electronicsrepair|mobilephonerepair|shoerepair|watchrepair|jewelryrepair|clockrepair|locksmith|keys|engraving|photography|childcare|gym|fitness|yoga|pilates|martialarts|boxing|danceschool|school|college|education|tutoring|languageschool|library|publiclibrary|museum|artgallery|cinema|theater|performingarts|musicvenue|comedyclub|danceclub|karaoke|arcade|bowlingalley|escapegame|virtualreality|playcenter|playground|kidsactivities|amusementpark|casino|bingo|pachinko|placeofworship|policestation|cityhall|publicservices|socialservices|nonprofit|communitycenter|visitorcenter|touristattraction|landmark|eventspace|eventplanning|weddingplanning|funeralservices|vendingmachine|internetbooth|lotterystand|tickets)/;
const OCC_GROUPS = [
  { name: "Eten & drinken", color: "#f76707", icon: "_food",    test: c => FOOD_RE.test(c) },
  { name: "Diensten",       color: "#0ca678", icon: "_service", test: c => SERVICE_RE.test(c) },
  { name: "Winkels",        color: "#d6336c", icon: "_shop",    test: c => true },
];
const groupColor = (groups, c) => groups.find(g => g.test(c || "")).color;
