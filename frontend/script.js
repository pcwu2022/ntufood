// import data from './data.json' assert { type: "json" };
import data from './data.js';
import { genreMapping, locationMapping } from './enum.js';
import { Map } from './map.js';

const defaultCoordination = [25.01744, 121.537372];

const map = new Map("map");

const containerDiv = document.getElementById("container");
const submitButton = document.getElementById("submit");
const genreSelect = document.getElementById("genre");
const locationSelect = document.getElementById("location");

/** Display Functions **/

const clearContainer = () => {
    containerDiv.innerHTML = "";
}

const displayPrice = (priceInt) => {
    let priceString = "";
    for (let i = 0; i < priceInt; i++){
        priceString += "$";
    }
    return priceString;
}

const displayLocation = (location) => {
    return (locationMapping[location] == undefined)?location:locationMapping[location];
}

const displayGenre = (genre) => {
    return (genreMapping[genre] == undefined)?genre:genreMapping[genre];
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

const appendRow = (row, withMarker=true) => {
    const newRow = document.createElement("div");
    newRow.innerHTML = `
        <h3><a href="https://www.google.com/maps/search/${row.Restaurant}/@${getPosition(row.Coordinates)[0]},${getPosition(row.Coordinates)[1]},17z">${row.Restaurant}</a></h3>
        區域：${displayLocation(row.Location)}<br>
        類別：${displayGenre(row.Genre)}<br>
        價格：${displayPrice(parseInt(row.Price))}
    `;
    newRow.position = getPosition(row.Coordinates);
    newRow.name = row.Restaurant + ((getPosition(row.Coordinates) == defaultCoordination)?"（座標未設定）":"");
    newRow.withMarker = false;
    if (withMarker){
        newRow.marker = map.addMarker(getPosition(row.Coordinates), row.Restaurant, false);
        newRow.withMarker = true;
    }
    newRow.addEventListener("click", (e) => {
        map.panTo(e.target.position, 17);
        if (!e.target.withMarker){
            newRow.marker = map.addMarker(e.target.position, e.target.name, false);
        }
        newRow.marker._icon.classList.add('huechange');
    })
    newRow.classList.add("row");
    containerDiv.appendChild(newRow);
}

const handleSubmit = (withMarker=true) => {
    map.removeMarkers();
    clearContainer();
    let genre = genreSelect.value;
    let location = locationSelect.value;
    let rows = [];
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

    // shuffle the result
    rows = rows.sort((a, b) => (Math.random() - 0.5));
    rows.forEach((row) => appendRow(row, withMarker));
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
    createGenreOption("Random");
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
    createLocationOption("Random");
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
