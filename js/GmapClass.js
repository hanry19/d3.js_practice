class gmap {
    _map;

    constructor() {

    }

    initMap() {
        const div = document.getElementById('map');
        this.map = new google.maps.Map(div, {
            zoom: 12,
            center: new google.maps.LatLng(37.556059, 126.9809),
            // center: { lat: 37.4239163, lng: -122.0947209 },
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            // restriction: {
            //     latLngBounds: SEOUL_BOUND,
            //     strictBounds: false,
            // },
            mapId: '641f3fc5cc9d2121',
            zoomControl: true,
            fullscreenControl: false,
            gestureHandling: "greedy",
            mapTypeControl: false,
            streetViewControl: false,

        });


        this.map.data.addListener("click", e => {
            setFitBounds({address: e.feature.h.SGG_NM});
            setGeoJsonStyle(e.feature.h.SGG_NM);
        });

        setSearchBox();


        const infoWindow = new google.maps.InfoWindow({
            content: "",
            disableAutoPan: true,
        });
        const markers = cycleData.map((e, i) => {
            const marker = new google.maps.Marker({
                position: {lat: e.lat, lng: e.lng},
            });

            marker.addListener("click", () => {
                infoWindow.setContent(`<div>test</div>`);
                infoWindow.open(map, marker);
            });
            return marker;
        });

        new markerClusterer.MarkerClusterer({map, markers, renderer, algorithm});

    }

}