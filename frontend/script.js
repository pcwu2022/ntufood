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
const submitButton = document.getElementById("submit");
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
        map.panTo(e.target.position, 17);
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
            if (location !== row.Location && location !== "All"){
                continue;
            }
            rows.push(row);
        }
    }

    // shuffle the result
    rows = rows.sort((a, b) => (Math.random() - 0.5));
    // Pagination implementation
    const itemsPerPage = 5;
    let currentPage = 1;
    const totalPages = Math.ceil(rows.length / itemsPerPage);

    const displayPage = (pageNumber) => {
        // Clear existing content
        clearContainer();
        
        // Calculate start and end indices
        const startIndex = (pageNumber - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, rows.length);
        
        // Create container for items with navigation
        const itemsContainer = document.createElement("div");
        itemsContainer.classList.add("items-container");
        containerDiv.appendChild(itemsContainer);
        
        
        
        // Display current page items
        const resultsDiv = document.createElement("div");
        resultsDiv.classList.add("results");

        // Add "Previous" button before items
        if (pageNumber > 1) {
            const prevButton = document.createElement("button");
            prevButton.innerHTML = "◀"; // Left arrow
            prevButton.classList.add("nav-arrow", "prev-arrow");
            prevButton.addEventListener("click", () => displayPage(pageNumber - 1));
            resultsDiv.appendChild(prevButton);
        }

        for (let i = startIndex; i < endIndex; i++) {
            const newRow = document.createElement("div");
            newRow.innerHTML = `
                <h3><a href="https://www.google.com/maps/search/${rows[i].Restaurant}/@${getPosition(rows[i].Coordinates)[0]},${getPosition(rows[i].Coordinates)[1]},17z">${rows[i].Restaurant}</a></h3>
                區域：${displayLocation(rows[i].Location)}<br>
                類別：${displayGenre(rows[i].Genre)}<br>
                價格：${displayPrice(parseInt(rows[i].Price))}
            `;
            newRow.position = getPosition(rows[i].Coordinates);
            newRow.name = rows[i].Restaurant + ((getPosition(rows[i].Coordinates) == defaultCoordination)?"（座標未設定）":"");
            newRow.withMarker = false;
            if (withMarker){
                newRow.marker = map.addMarker(getPosition(rows[i].Coordinates), rows[i].Restaurant, false);
                newRow.withMarker = true;
            }
            newRow.addEventListener("click", (e) => {
                map.panTo(e.target.position, 17);
                if (!e.target.withMarker){
                    newRow.marker = map.addMarker(e.target.position, e.target.name, false);
                    e.target.withMarker = true;
                }
                newRow.marker._icon.classList.add('huechange');
                ntufoodFetch("/click", { restaurant_name: e.target.name, order: 1 });
            })
            newRow.classList.add("row");
            resultsDiv.appendChild(newRow);
        }
        
        // Add "Next" button after items
        if (pageNumber < totalPages) {
            const nextButton = document.createElement("button");
            nextButton.innerHTML = "▶"; // Right arrow
            nextButton.classList.add("nav-arrow", "next-arrow");
            nextButton.addEventListener("click", () => displayPage(pageNumber + 1));
            resultsDiv.appendChild(nextButton);
        }

        itemsContainer.appendChild(resultsDiv);
    };

    // Display first page initially
    if (!PAGINATION){
        for (let row of rows){
            appendRow(row, withMarker);
        }
        if (rows.length == 0){
            const noResult = document.createElement("div");
            noResult.innerHTML = "無符合條件的餐廳";
            containerDiv.appendChild(noResult);
        }
        return;
    }
    displayPage(1);
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
})
.catch(error => {
    console.error("Communication Error: ", error);
});