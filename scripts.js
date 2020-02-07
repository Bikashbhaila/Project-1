// change test value to false will turn off all of the debugging
const test = false;

// on click listens for the click of the current location button

$('#currentLoc').on("click", function () {
  // TODO look into this function to find if we can disable to alert
  // CITATION: This function is based on geoFindMe function found at
  //https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
  //this function return an object with the lat and lon of current location

  if (test) console.log("in getCurLocation");

  // initiallizing location object to store the results
  let location = {};

  function success(position) {
    if (test) { console.log(" success"); }
    if (test) { console.log("  latitude: ", position.coords.latitude); }
    if (test) { console.log("  longitude: ", position.coords.longitude); }

    location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      success: true
    }
    getTrails(location);
  }



  function error() {
    location = { success: false }
    console.log('Could not get location');
    return;
  }

  if (!navigator.geolocation) {
    console.log('Geolocation is not supported by your browser');
  } else {
    // broswer function? which pulllocation information and calls success or error functions 
    navigator.geolocation.getCurrentPosition(success, error);
  }
});

function getDistance(currentLat, currentLon, trailLat, trailLon) {
  return (Math.sqrt(Math.pow(parseFloat(currentLat) - parseFloat(trailLat), 2) + Math.pow(parseFloat(currentLon) - parseFloat(trailLon), 2))).toFixed(2);
}

function getFood(trailsArr) {
  // function to query the zomato return food results and compare with the trail results

  if (test) console.log("in getFood");
  if (test) console.log(" getFood arg trails:", trailsArr);
  if (test) console.log(" trails.length:", trailsArr.length);

  // these variables are here since they dont change each time through the loop
  const apiKey = "d1a7b86c59260f52f781566904c71fb1";
  let url = `https://developers.zomato.com/api/v2.1/search`;
  // need to get value of selected option and convert from miles to meters (approximate)
  const radius = parseInt($('#distanceToFood').val()) * 1600;
  if (test) console.log(" radius", radius);

  // these could be pulled from the form if we want to get fancy
  const srt = "real_distance";
  const odr = "asc";
  const cusine = "mex"; // sticking with tacos, may need to change if not enough results
  const cnt = "20"; // sticking with tacos, may need to change if not enough results

  // keep track of suggested restaurants for all trails
  let suggestedRest = [];

  // loop through all the entries in the trail array
  // trails.forEach( function(e) {
  for (let i = 0; i < trailsArr.length; i++) {

    if (test) console.log(" considering trail:", trailsArr[i]);
    // pulling out information we need into new variables so I dont accedenatlly change the original data source
    let t = trailsArr[i];
    const tLat = t.latitude;
    const tLon = t.longitude;

    // will contain information about object to draw
    let drawObj = {};

    let queryString = `?q=${cusine}&lat=${tLat}&lon=${tLon}&radius=${radius}&sort=${srt}&order=${odr}&count=${cnt}`;
    // let queryString = `?lat=${trailLat}&lon=${trailLon}&radius=${radius}`;
    queryURL = (url + queryString);
    if (test) console.log(" trails queryURL: ", queryURL);

    $.ajax({
      url: queryURL,
      method: 'GET',
      headers: {
        "user-key": apiKey,
        "Accept": "application/json"
      }
    }).then(function (response) {
      if (test) console.log(" in zomato response");
      if (test) console.log("  zomato response", response);

      // need to associate results
      if (test) console.log("   trail id", trailsArr[i].id);

      //track closed restaurant
      let closestRestDist = 1000;

      for (let j = 0; j < response.restaurants.length; j++) {

        if (test) console.log("new rest check");

        const r = response.restaurants[j].restaurant;

        // skip if restaurant is not defined
        if (r.name == null) { continue; }

        const rLat = r.location.latitude;
        const rLon = r.location.longitude;


        // if (test) console.log("   restaurant arr", r);

        // get distanct to from trail to rest
        let rDist = getDistance(tLat, tLon, rLat, rLon);
        if (test) console.log("rdist", rDist);

        // checks to see if its closer, if not goes to next restaurant
        if (rDist > closestRestDist) {
          if (test) console.log("distance rejected: rDist > closestRestDist",rDist,closestRestDist);
          continue;
        }

        if (test) console.log("distance accepted: rDist > closestRestDist",rDist,closestRestDist);

        // will skip to next restaurand sugestion if there are more and the suggestion has already been used
        // if ( (r.name in suggestedRest) && j < (response.restaurants.length) ) continue;
        if ( ( suggestedRest.includes(r.name)) ) {
          if (test) console.log("suggestedRest failed",suggestedRest,r.name);
          continue;
        }

        suggestedRest.push(r.name);
        // if (test) console.log("suggestedRest",suggestedRest);

        // sets new closest trail
        closestRestDist = rDist;

        // populate draw object 
        drawObj = {
          tName: t.name,
          tDistTo: t.dist2Trail,
          tLength: t.length,
          tElevGain: t.ascent,
          tImg: t.imgSmallMed,
          tLink: t.url,
          tImg: t.imgSqSmall,
          rName: r.name,
          rThumb: r.thumb,
          rDistTo: rDist,
          rStars: r.user_rating.aggregate_rating,
          rType: r.cuisines,
          rImg: r.thumb,
          rLink: r.url
        }

        if (drawObj.tImg === "") {
          drawObj.tImg = 'https://cdn-files.apstatic.com/hike/7048859_smallMed_1555540136.jpg';
        }

        if (drawObj.rImg === "") {
          drawObj.rImg = 'assets/generic_food.png';
        }

        if (test) console.log("   drawObject:", drawObj);
      }
      if (test) console.log("   finalDist:", drawObj.tDistTo);
      drawResults(drawObj.tName, drawObj.tDistTo, drawObj.tLength, drawObj.tElevGain, drawObj.tImg, drawObj.tLink, drawObj.rName, drawObj.rDistTo, drawObj.rStars, drawObj.rType, drawObj.rImg, drawObj.rLink);
    });

  }

  // call draw result this is going to be a race condition.
  // how do we get all the results back before we draw?
}

function getTrails(loc) {
  // function to query the zomato return food results and compare with the trail results

  if (test) console.log("In getTrails");
  if (test) console.log("getTrail arg - loc:", loc);
  // NOTICE: const is safer than var it narrows the scope for things which wont change
  const apiKey = "200680256-25fdb8fcf8643e0cd152f1128ff3f508";

  // input array need to be mapped to these hard coded values
  const latitude = loc.latitude;
  const longitude = loc.longitude;

  //TODO need to tie in max Distance
  const maxDistance = $("#maxdistance").val();
  if (test) console.log("maxDistance",maxDistance);
  const maxResults = "10";

  // uses heroku app as proxy? which provides valid server mitigating CORS error. can be slow
  const url = `https://cors-anywhere.herokuapp.com/https://www.mtbproject.com//data/`;
  const resource = "get-trails";
  let queryString = `?lat=${latitude}&lon=${longitude}&maxDistance=${maxDistance}&maxResults=${maxResults}&key=${apiKey}`;
  queryURL = (url + resource + queryString);

  // NOTICE: if does not need  {} if it is one line
  if (test) console.log("queryURL: ", queryURL);

  $.ajax({
    url: queryURL,
    method: 'GET',
    dataType: "json",
    headers: { "x-Requested-with": "xhr" }
  }).then(function (response) {
    let validTrails  = [];
    for (let index = 0; index < response.trails.length; index++) {
      const trail = response.trails[index];

      // skip if trail is not defined
      if (trail.name == null) { continue; }

      let d = getDistance(loc.latitude, loc.longitude, trail.latitude, trail.longitude);
      let miles = d * 69; // ~69 miles is 1 lat/long degree difference (approximate)

      // checks to see if we exceed maxDIstance
      if (miles > maxDistance) { continue; }

      // checks to see if we exceed max results
      if (validTrails.length >= maxResults) { continue; }
      /// adds distnace toarray to be returned
      trail.dist2Trail = parseFloat(miles.toFixed(1)); // make miles only 1 decimal point

      // adds trail to valid trails if it does not exceed the maxDistance and is not null
      validTrails.push(trail);
    }

    // sort by distance order create an anonymous function which returns truthy vs falsy used by the sort function
    // works but does not matter because when we draw it is notdrawing them in a differne torder, i gues some are faster then othres?
    validTrails.sort( (a,b) => a.dist2Trail - b.dist2Trail );

    // TODO, logic here cull the response data to limit it to what we need
    getFood(validTrails);
  }).catch(function (error) {
    console.log("error", error);
  });
}

let trailPics = [];
let restPics = [];

function drawResults(trailName, distToTrail, trailLength, elevGain, trailImg, trailLink,
  restName, distToRest, starsOnYelp, typeOfFood, restImg, restLink) {

  $('#results').attr('style', '');
  let newRow = document.createElement('div');
  newRow.className = "row";

  let existingRow = $(".row")[4]; // get the existing row from the HTML
  let html = existingRow.innerHTML; // original HTML

  // Replace all the old text with new values
  html = html.replace('Trail Name',  trailName);
  html = html.replace('Dist to trail', 'Dist to trail: ' + distToTrail);
  html = html.replace('Trail Length', 'Trail Length: ' + trailLength);
  html = html.replace('Elev Gain', 'Elev Gain: ' + elevGain);
  html = html.replace('imgSmall" src="#', 'imgSmall" src="' + trailImg);
  html = html.replace('#">Link to H-Proj', trailLink + '">Link to H-Proj');

  html = html.replace('Restaurant Name', restName);
  html = html.replace('Dist to restaurant', 'Dist to restaurant: ' + distToRest);
  html = html.replace('Stars on yelp', 'Stars on yelp: ' + starsOnYelp);
  html = html.replace('Type of food', 'Type of food: ' + typeOfFood);
  html = html.replace('imgRest" src="#', 'imgRest" src="' + restImg);
  html = html.replace('#">Link to Restaurant', restLink + '">Link to Restaurant');

  newRow.innerHTML = html;

  // this is undefined sometimes drop out to not draw undefined results. but why?
  if (restName == undefined) return;

  $('.results-container')[0].appendChild(newRow)
}

// Listener for form dropdowns
$(document).ready(function () {
  $('select').formSelect();


});

// Listener for search button keydown
$("#icon_prefix").keydown(function (event) {
  if (event.keyCode === 13) {

    if (test) console.log("enter keydown duh");

    cityState();
  }
});


// Listener for search button click
$("#search").click(function () {
  // print the search button
  if (test) console.log("search duh");

  cityState();

});
// set variables for cagedata API call

function cityState() {
  const url = `https://api.opencagedata.com/geocode/v1/json?q=`;
  let place = $("#icon_prefix").val();
  let cageKey = "71d042c6415048dfa43baaaa58e46e6d";
  let queryString = `${place}&key=${cageKey}`;
  queryURL = (url + queryString);

  // empty results div
  $(".results-container").empty();

  // call cagedata API
  $.ajax({
    url: queryURL,
    method: 'GET',
  }).then(function (response) {

    if (test) console.log(" in cagedata response");
    if (test) console.log("  cagedata response", response);

    let lat = response.results[0].geometry.lat;
    let lon = response.results[0].geometry.lng;

    let location = {
      latitude: lat,
      longitude: lon,
      success: true
    }

    getTrails(location);
  })
};