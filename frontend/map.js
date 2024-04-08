class Map {
    constructor(divName, position=[25.01744, 121.537372]){
        // create map
        this.map = L.map('map').setView(position, 16);

        // create markers
        this.markers = [];

        // create tiles
        this.tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);
    }

    // add restaurant
    addMarker(position=[25.01744, 121.537372], displayString="(25.01744, 121.537372)", panTo=false){
        let marker = L.marker(position).addTo(this.map);
        this.markers.push(marker);
        marker.bindPopup(displayString);
        if (panTo){
            this.map.panTo(position);
        }
        return marker;
    }

    // pan to
    panTo(position=[25.01744, 121.537372], zoom=16){
        this.map.panTo(position);
        // delay until the map is panned to the position and zoom
        // setTimeout(() => this.map.setZoom(zoom), 300);
    }

    // remove markers on the list
    removeMarkers(){
        this.markers.forEach((marker) => this.map.removeLayer(marker));
    }
}

export {
    Map
};
