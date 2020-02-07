const test = false;


$('#currentLoc').on("click", function () {

  if (test) console.log("in getCurLocation");


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
    navigator.geolocation.getCurrentPosition(success, error);
  }
});

function getDistance(currentLat, currentLon, trailLat, trailLon) {
  return (Math.sqrt(Math.pow(parseFloat(currentLat) - parseFloat(trailLat), 2) + Math.pow(parseFloat(currentLon) - parseFloat(trailLon), 2))).toFixed(2);
}

function getFood(trailsArr) {

  if (test) console.log("in getFood");
  if (test) console.log(" getFood arg trails:", trailsArr);
  if (test) console.log(" trails.length:", trailsArr.length);

  const apiKey = "d1a7b86c59260f52f781566904c71fb1";
  let url = `https://developers.zomato.com/api/v2.1/search`;
  const radius = parseInt($('#distanceToFood').val()) * 1600;
  if (test) console.log(" radius", radius);

  const srt = "real_distance";
  const odr = "asc";
  const cusine = "mex"; 
  const cnt = "20"; 

  let suggestedRest = [];


  for (let i = 0; i < trailsArr.length; i++) {

    if (test) console.log(" considering trail:", trailsArr[i]);
    
    let t = trailsArr[i];
    const tLat = t.latitude;
    const tLon = t.longitude;

    let drawObj = {};

    let queryString = `?q=${cusine}&lat=${tLat}&lon=${tLon}&radius=${radius}&sort=${srt}&order=${odr}&count=${cnt}`;
   
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

      if (test) console.log("   trail id", trailsArr[i].id);

   
      let closestRestDist = 1000;

      for (let j = 0; j < response.restaurants.length; j++) {

        if (test) console.log("new rest check");

        const r = response.restaurants[j].restaurant;

        if (r.name == null) { continue; }

        const rLat = r.location.latitude;
        const rLon = r.location.longitude;


       

    
        let rDist = getDistance(tLat, tLon, rLat, rLon);
        if (test) console.log("rdist", rDist);

       
        if (rDist > closestRestDist) {
          if (test) console.log("distance rejected: rDist > closestRestDist",rDist,closestRestDist);
          continue;
        }

        if (test) console.log("distance accepted: rDist > closestRestDist",rDist,closestRestDist);

        if ( ( suggestedRest.includes(r.name)) ) {
          if (test) console.log("suggestedRest failed",suggestedRest,r.name);
          continue;
        }

        suggestedRest.push(r.name);

        closestRestDist = rDist;

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

 
}

function getTrails(loc) {

  if (test) console.log("In getTrails");
  if (test) console.log("getTrail arg - loc:", loc);
  const apiKey = "200680256-25fdb8fcf8643e0cd152f1128ff3f508";

  const latitude = loc.latitude;
  const longitude = loc.longitude;

  const maxDistance = $("#maxdistance").val();
  if (test) console.log("maxDistance",maxDistance);
  const maxResults = "10";

  const url = `https://cors-anywhere.herokuapp.com/https://www.mtbproject.com//data/`;
  const resource = "get-trails";
  let queryString = `?lat=${latitude}&lon=${longitude}&maxDistance=${maxDistance}&maxResults=${maxResults}&key=${apiKey}`;
  queryURL = (url + resource + queryString);

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

  
      if (trail.name == null) { continue; }

      let d = getDistance(loc.latitude, loc.longitude, trail.latitude, trail.longitude);

      if (miles > maxDistance) { continue; }

      if (validTrails.length >= maxResults) { continue; }
      trail.dist2Trail = parseFloat(miles.toFixed(1)); 

      validTrails.push(trail);
    }

    validTrails.sort( (a,b) => a.dist2Trail - b.dist2Trail );

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

  let existingRow = $(".row")[4]; 
  let html = existingRow.innerHTML; 

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

  if (restName == undefined) return;

  $('.results-container')[0].appendChild(newRow)
}

$(document).ready(function () {
  $('select').formSelect();


});

$("#icon_prefix").keydown(function (event) {
  if (event.keyCode === 13) {

    if (test) console.log("enter keydown duh");

    cityState();
  }
});


$("#search").click(function () {
  if (test) console.log("search duh");

  cityState();

});

function cityState() {
  const url = `https://api.opencagedata.com/geocode/v1/json?q=`;
  let place = $("#icon_prefix").val();
  let cageKey = "71d042c6415048dfa43baaaa58e46e6d";
  let queryString = `${place}&key=${cageKey}`;
  queryURL = (url + queryString);


  $(".results-container").empty();


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