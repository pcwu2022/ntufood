// Back to Top Button Logic
const backToTopBtn = document.getElementById('backToTopBtn');
const mainDiv = document.getElementById('main');

mainDiv.addEventListener('scroll', function() {
    if (mainDiv.scrollTop > 100) {
        backToTopBtn.style.display = 'block';
    } else {
        backToTopBtn.style.display = 'none';
    }
});

backToTopBtn.addEventListener('click', function() {
    mainDiv.scrollTo({ top: 0, behavior: 'smooth' });
});

// If #main is not scrollable (e.g. on mobile), fallback to window scroll
window.addEventListener('scroll', function() {
    if (window.innerWidth < 900) {
        if (window.scrollY > 100) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    }
});

backToTopBtn.addEventListener('click', function() {
    if (window.innerWidth < 900) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});
// import data from './data.json' assert { type: "json" };
import data from './data.js';
import { genreMapping, locationMapping, filterMapping} from './enum.js';
import { aliasing } from './aliasing.js';
import { Map } from './map.js';

const PAGINATION = false;
const BACKEND_BASE_URL = "https://ntufood-backend.onrender.com";

const defaultCoordination = [25.01744, 121.537372];

const map = new Map("map");

const containerDiv = document.getElementById("container");
const filtersDiv = document.getElementById("filtersDiv");
filtersDiv.id = "filtersDiv";
filtersDiv.style.margin = "10px 0";
const NEAR = 0.2; // km
const PANSIZE = 17;
const LOCATIONUPDATEINTERVAL = 1000; // ms

let currentCoord = map.getCenter();
let autoPan = false;

// Track selected tags for toggling
let selectedTags = [];

function hasTag(row, tag) {
    if (tag === "HotPick") {
        return row.Restaurant && hotPicks && row.Restaurant in hotPicks;
    }
    return tag in row && row[tag] === "O";
}

// Create filter buttons for each tag
function createFilterButtons() {
    filtersDiv.innerHTML = '';
    Object.entries(filterMapping).forEach(([tag, { chinese, emoji }]) => {
        const btn = document.createElement('button');
        btn.innerHTML = `${emoji} ${chinese}`;
        btn.className = 'filter-btn';
        if (selectedTags.includes(tag)) {
            btn.classList.add('active-filter');
        }
        btn.onclick = () => toggleTag(tag);
        filtersDiv.appendChild(btn);
    });
    // Add reset button
    const resetBtn = document.createElement('button');
    resetBtn.innerHTML = '❌';
    resetBtn.className = 'filter-btn';
    resetBtn.onclick = () => {
        selectedTags = [];
        createFilterButtons();
        handleSubmit();
    };
    filtersDiv.appendChild(resetBtn);
}

function toggleTag(tag) {
    if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter(t => t !== tag);
    } else {
        selectedTags.push(tag);
    }
    createFilterButtons();
    handleSubmit();
}

// Filter restaurants by tag
// filterByTag is now replaced by filterByTags
const submitButton = document.getElementById("submit") || document.createElement("button");
const genreSelect = document.getElementById("genre");
const locationSelect = document.getElementById("location");

let hotPicks = {};

/** Display Functions **/

const clearContainer = () => {
    containerDiv.innerHTML = "";
}

const displayPrice = (priceInt) => {
    let priceString = "";
    for (let i = 0; i < priceInt; i++){
        priceString += "🪙";
    }
    return priceString;
}

const displayLocation = (location) => {
    return (locationMapping[location] == undefined)?location:locationMapping[location];
}

const displayGenre = (genre) => {
    return (genreMapping[genre] == undefined)?genre:genreMapping[genre];
}

const displayEmojis = (row) => {
    const emojis = [];
    for (let key in filterMapping) {
        if (key in row && row[key] == "O") {
            emojis.push(filterMapping[key].emoji);
        }
    }
    if (row.Restaurant in hotPicks) {
        emojis.push(filterMapping["HotPick"].emoji);
    }
    return emojis.join("");
}

const renderTags = (row, htmlObj) => {
    const tags = [];
    for (let key in filterMapping) {
        if (key in row && row[key] == "O") {
            tags.push(key);
        }
    }
    if (row.Restaurant in hotPicks) {
        tags.push("HotPick");
    }
    const tagsDiv = document.createElement("div");
    htmlObj.appendChild(tagsDiv);
    if (tags.length === 0) {
        tagsDiv.innerHTML = "&nbsp;";
        return;
    }
    for (let tag of tags) {
        const { chinese, emoji } = filterMapping[tag];
        const span = document.createElement("span");
        span.innerHTML = emoji;
        span.title = chinese; // This creates tooltip on hover
        span.classList.add("tag");
        tagsDiv.appendChild(span);
    }
}

const getPosition = (coordinates) => {
    if (coordinates == undefined){
        return defaultCoordination;
    }
    let coo = coordinates.split(',');
    let ret = [parseFloat(coo[0]), parseFloat(coo[1])];
    if (ret[0] == undefined || ret[1] == undefined){
        ret = defaultCoordination;
    }
    if (isNaN(ret[0]) || isNaN(ret[1])){
        ret = defaultCoordination;
    }
    return ret;
}

const randomSelect = (array) => {
    return array[Math.floor(Math.random()*array.length)];
}

function ntufoodFetch(endpoint, bodyObj, method="POST") {
    return fetch(`${BACKEND_BASE_URL}${endpoint}`, {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "origin": "https://pcwu2022.github.io"
        },
        body: JSON.stringify(bodyObj)
    });
}

const inRange = (coord1, coord2, range = 0.5) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(coord2[0] - coord1[0]);
    const dLon = toRad(coord2[1] - coord1[1]);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(coord1[0])) * Math.cos(toRad(coord2[0])) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance <= range;
}

const appendRow = (row, withMarker=true) => {
    const newRow = document.createElement("div");
    newRow.innerHTML = `
        <h3><a href="https://www.google.com/maps/search/${row.Restaurant}/@${getPosition(row.Coordinates)[0]},${getPosition(row.Coordinates)[1]},17z">${row.Restaurant}</a></h3>
        區域：${displayLocation(row.Location)}<br>
        類別：${displayGenre(row.Genre)}<br>
        價格：${displayPrice(parseInt(row.Price))}
    `;
    renderTags(row, newRow);
    newRow.position = getPosition(row.Coordinates);
    newRow.name = 
        row.Restaurant + 
        displayEmojis(row) +
        ((getPosition(row.Coordinates) == defaultCoordination)?"（座標未設定）":"");
    newRow.withMarker = false;
    if (withMarker){
        newRow.marker = map.addMarker(getPosition(row.Coordinates), newRow.name, false);
        newRow.withMarker = true;
    }
    newRow.addEventListener("click", (e) => {
        autoPan = false;
        map.panTo(e.target.position, PANSIZE);
        if (!e.target.withMarker){
            newRow.marker = map.addMarker(e.target.position, e.target.name, false);
            e.target.withMarker = true;
        }
        newRow.marker._icon.classList.add('huechange');
        ntufoodFetch("/click", { restaurant_name: e.target.name, order: 1 });
    })
    newRow.classList.add("row");
    if (row.Restaurant in hotPicks) {
        newRow.classList.add("hot-pick");
        // console.log(row.Restaurant);
    }
    containerDiv.appendChild(newRow);
}

const handleSubmit = (withMarker=true) => {
    map.removeMarkers();
    clearContainer();
    let rawGenre = genreSelect.value;
    let location = locationSelect.value;
    ntufoodFetch("/select", { type: rawGenre, location: location });
    let rows = [];
    let aliasGenre = rawGenre in aliasing ? [rawGenre, ...aliasing[rawGenre]] : [rawGenre];
    for (let genre of aliasGenre){
        for (let row of data){
            if (location == "Random"){
                location = "All";
            }
            if (genre == "Random"){
                genre = randomSelect(genres);
            }
            if (genre !== row.Genre && genre !== "All"){
                continue;
            }
            if (location == "near"){
                // console.log(currentCoord, getPosition(row.Coordinates));
                if (!inRange(currentCoord, getPosition(row.Coordinates), NEAR)){
                    continue;
                }
            } else if (location !== row.Location && location !== "All"){
                continue;
            }
            rows.push(row);
        }
    }

    // Handle Tags
    if (selectedTags.length !== 0) {
        rows = rows.filter(row => selectedTags.every(tag => hasTag(row, tag)));
    }

    // shuffle the result
    rows = rows.sort((a, b) => (Math.random() - 0.5));
    rows.forEach((row) => appendRow(row, withMarker))
    if (rows.length == 0){
        const noResult = document.createElement("div");
        noResult.innerHTML = "無符合條件的餐廳";
        containerDiv.appendChild(noResult);
    }
    return;
}

// Add options to the select menu
const createGenreOption = (genre) => {
    let option = document.createElement("option");
    option.value = genre;
    option.innerHTML = displayGenre(genre);
    genreSelect.appendChild(option);
}

let genres = [];
const genreSelectAdd = () => {
    createGenreOption("All");
    // createGenreOption("Random");
    for (let row of data){
        let genre = row.Genre;
        if (genres.indexOf(genre) == -1){
            genres.push(genre);
            
            // add to select
            createGenreOption(genre);
        }
    }
}

const createLocationOption = (location) => {
    let option = document.createElement("option");
    option.value = location;
    option.innerHTML = displayLocation(location);
    locationSelect.appendChild(option);
}

let locations = [];
const locationSelectAdd = () => {
    createLocationOption("All");
    createLocationOption("near");
    // createLocationOption("Random");
    for (let row of data){
        let location = row.Location;
        if (locations.indexOf(location) == -1){
            locations.push(location);
            
            // add to select
            createLocationOption(location);
        }
    }
}

const loadParameters = () => {
    // load from local storage
    let genre = localStorage.getItem("genre");
    let location = localStorage.getItem("location");
    if (genre != null && genre != ""){
        genreSelect.value = genre;
    }
    if (location != null && location != ""){
        locationSelect.value = location;
    }
}

const saveParameters = () => {
    // save to local storage
    localStorage.setItem("genre", genreSelect.value);
    localStorage.setItem("location", locationSelect.value);
}

window.addEventListener("beforeunload", saveParameters);

/** Event Handlers **/

submitButton.addEventListener("click", () => {
    handleSubmit();
});

locationSelect.addEventListener("change", () => {
    handleSubmit();
});

genreSelect.addEventListener("change", () => {
    handleSubmit();
});


/** Execution **/

// load select options
genreSelectAdd();
locationSelectAdd();

// load filter buttons
createFilterButtons();

// load parameters
loadParameters();

// load default
handleSubmit(false);

ntufoodFetch("/view", { time: Math.floor(Date.now() / 1000) });

// load hot picks
fetch(`${BACKEND_BASE_URL}/hot`, {
    method: "GET"
})
.then(response => response.json())
.then(data => {
    for (let restaurant of data) {
        if ("restaurant" in restaurant && "percentage" in restaurant) {
            hotPicks[restaurant.restaurant] = restaurant.percentage;
        }
    }
    // Re-create filter buttons after hotPicks loaded
    createFilterButtons();
})
.catch(error => {
    console.error("Communication Error: ", error);
});

// Update Location
const updateLocation = () => {
    navigator.geolocation.getCurrentPosition((position) => {
        currentCoord = [position.coords.latitude, position.coords.longitude];
        if (autoPan) {
            map.panTo(currentCoord, PANSIZE);
        }
        map.updateCurrentMarker(currentCoord);
    }, (error) => {
        console.warn(`ERROR(${error.code}): ${error.message}`);
        map.displayCurrentMarker(false);
    });
}

const updateLocationBasedOnMapCenter = () => {
    currentCoord = map.getCenter();
}

navigator.geolocation.getCurrentPosition((position) => {
    currentCoord = [position.coords.latitude, position.coords.longitude];
    map.panTo(currentCoord, PANSIZE);
    map.displayCurrentMarker(true);
    map.updateCurrentMarker(currentCoord);
    setInterval(updateLocation, LOCATIONUPDATEINTERVAL);
}, (error) => {
    console.warn(`ERROR(${error.code}): ${error.message}`);
    setInterval(updateLocationBasedOnMapCenter, LOCATIONUPDATEINTERVAL);
});

// Add window resize listener to check responsive breakpoint
window.addEventListener('resize', function() {
    // Check if window width crosses the 900px threshold
    const width = window.innerWidth;
    const wasBelow = window.lastWidth < 900;
    const isBelow = width < 900;
    
    // Store current width for next comparison
    window.lastWidth = width;
    
    // If we cross the threshold in either direction, reload the page
    if ((wasBelow && !isBelow) || (!wasBelow && isBelow)) {
        location.reload();
    }
});

// Initialize lastWidth on page load
window.lastWidth = window.innerWidth;