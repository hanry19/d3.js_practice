let _map;
const infoArray = [];
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" height="25px" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><style>svg{fill:#ff8080}</style><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>`

let _marker;
let _addMarker;
let _positionMarker;

let icon = {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(appleSvg),
};
let _mapStyle = {
    // icon,
    visible: false,
    fillColor: 'rgba(97,162,246,1)',
    strokeWeight: 1,
    strokeColor: '#9d9d9d'
};
let active = false;

let _clusterMarker;
let _clusterAdvancedMarker;
let _basicMarker = [];
let _advancedMarker = [];


function getClusterOption() {

    const renderer = {
        render: ({count, position}, stats) => {
            const color = 'red'
            const svg = window.btoa(`
                      <svg fill="${color}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
                        <circle cx="120" cy="120" opacity=".8" r="70" />    
                      </svg>`);
            
            return new google.maps.Marker({
                position,
                // icon,
                label: {
                    text: String(count),
                    color: "rgba(255,255,255,0.9)",
                    fontSize: "12px",
                },
                // adjust zIndex to be above other markers
                zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
            });
        }
    };

    const algorithm = new markerClusterer.SuperClusterAlgorithm({});

    return {renderer, algorithm}
}

function getInfoWindow(options) {
    return new google.maps.InfoWindow({
        content: "",
        disableAutoPan: true,
        ...options
    });
}

const SEOUL_BOUND = {
    north: 37.69772544437243,
    south: 37.41412272103989,
    west: 126.614746282959,
    east: 127.34705371704104,
};


function pracFn() {

    /**
     * Google Map Init Load
     */
    function initMap() {
        const div = document.getElementById('map');
        _map = new google.maps.Map(div, {
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


        _map.data.addListener("click", e => {
            if (e.feature.h.SGG_NM) {
                setFitBounds({address: e.feature.h.SGG_NM});
                setGeoJsonStyle(e.feature.h.SGG_NM);
            }
        });

        setSearchBox();
    }

    function setFitBounds(obj, callback) {
        const geocoder = new google.maps.Geocoder();

        if (!obj) {
            return false;
        }
        geocoder.geocode(obj).then(e => {
            if (!callback) {
                _map.fitBounds(e.results[0].geometry.bounds);
                return false;
            }
            callback(e);
            _map.fitBounds(new google.maps.LatLngBounds(e.results[0].geometry.location));
            _map.setZoom(13);
        });
    }


    function setSearchBox() {

        const input = document.getElementById('address');
        const searchBox = new google.maps.places.SearchBox(input);

        searchBox.addListener('places_changed', () => {
            removeMarker();
            const places = searchBox.getPlaces();
            const bounds = new google.maps.LatLngBounds();

            _positionMarker = [];

            places.forEach((p, idx) => {
                if (!p.geometry || !p.geometry.location) {
                    console.log("return place contains no geometry");
                    return;
                }

                _positionMarker.push(new google.maps.Marker({
                        map: _map,
                        title: p.name,
                        position: p.geometry.location,

                    })
                );

                const info = dynaForm().searchBoxForm(p);
                const infoWindow = getInfoWindow({content: info})

                _positionMarker[idx].addListener('click', e => {
                    infoArray.forEach(e => e?.close());
                    infoWindow.open({
                        anchor: _positionMarker[idx],
                        map: _map,
                    })
                    infoArray.push(infoWindow);
                })

                if (p.geometry.viewport) {
                    bounds.union(p.geometry.viewport);
                } else {
                    bounds.extend(p.geometry.location);
                }
            })
            _map.fitBounds(bounds);
        });
    }


    /**
     * GeoJSon 올리기
     * @param path Geojson 경로
     * @param style Gejson 스타일
     */
    function setGeoJson(path, style = _mapStyle) {
        console.log("?111?")

        _mapStyle = style;
        _map.data.loadGeoJson(path);
        _map.data.setStyle(style);
    }

    function setGeoJsonStyle(target) {
        _map.data.setStyle(function (feature) {
            if (feature.getProperty('SGG_NM') === target) {
                return {
                    fillColor: 'rgb(91,56,13)',
                    strokeWeight: 1,
                    strokeColor: '#9d9d9d'
                };
            } else {
                return _mapStyle;
            }
        })
    }


    /**
     * Info Window  실행
     * @param data
     * @param options
     */
    function addMarker(data, options = {}) {
        const {title, label} = options;
        const info = dynaForm().basicForm(data);
        const infoWindow = new google.maps.InfoWindow({
            content: info,
        })

        removeMarker();

        _marker = new google.maps.Marker({
            position: new google.maps.LatLng(data.lat, data.lng),
            map: _map,
            title,
            label,
        });

        _marker.addListener("click", () => {
            infoArray.forEach(e => e?.close());
            infoWindow.open({
                anchor: _marker,
                map: _map,
            });
            infoArray.push(infoWindow);
        });

    }

    function removeMarker() {
        _marker?.setMap(null);
        _addMarker?.setMap(null);
        _positionMarker?.forEach(e => e.setMap(null));
        _clusterMarker?.clearMarkers();
        _clusterAdvancedMarker?.clearMarkers();
        _basicMarker?.forEach(e => e.setMap(null));
        _advancedMarker?.forEach(e => e.setMap(null));
        _advancedMarker?.forEach(e => e.setMap(null));
    }


    /**
     * 아코디언 버튼 클릭 이벤트 핸들러
     */
    function accordionClickEventHandler() {

        const accBtns = document.getElementsByClassName("acc-btn");

        const setActiveItem = (me, sgg) => {
            [...accBtns].forEach(e => {
                if (e === me) {
                    me.classList.toggle("active");

                    const panel = me.nextElementSibling;

                    if (panel.style.display === "block") {
                        active = false;
                        setInitPosition();
                        panel.style.display = 'none';
                        pracFn().setGeoJsonStyle();
                    } else {
                        active = true;
                        panel.style.display = "block";
                        pracFn().setGeoJsonStyle(sgg);
                    }
                } else {
                    e.classList = e.classList[0];
                    const panel = e.nextElementSibling;
                    panel.style.display = 'none';
                }


            });
        };


        for (const el of accBtns) {
            el.addEventListener("click", function (e) {
                const sgg = this.innerText.replace(/[0-9]/g, "").trim();

                active ? setInitPosition() : setFitBounds({address: sgg});

                removeMarker();
                setActiveItem(this, sgg);

            });
        }
    }


    function dataConvert(data) {
        let obj = {};
        data.forEach(e => {
            if (obj[e.sgg]) {
                obj[e.sgg].push(e);
            } else {
                obj[e.sgg] = [e];
            }
        });
        return obj;
    }

    function addAccordionItem(data) {
        const convertedData = dataConvert(data);
        const accoDom = document.querySelector('#accordion .item-wrap');
        for (const [key, value] of Object.entries(convertedData)) {
            accoDom.innerHTML += ` 
                <button class="acc-btn">${key}
                        <span>${value.length}</span>
                </button>
                <div class="panel">
                    ${createAccItem(value)}
                </div>`;
        }
    }

    function createAccItem(value) {
        let result = [];
        for (const v of value) {

            const div = document.createElement('div');
            div.innerText = v.name;
            div.className = 'item';
            div.setAttribute('no', v.no);
            result += div.outerHTML;
        }
        return result;
    }

    /**
     * Accodion 아이템 클릭 이벤트
     */
    function addAccoItemClickEventHandler() {
        const items = document.querySelectorAll('#accordion .item');
        items.forEach(item => {

            item.addEventListener('click', e => {
                const parkNo = Number(e.target.getAttribute('no'));
                const filtered = cycleData.filter(e => e.no === parkNo)[0];
                pracFn().addMarker(filtered);
            });

        });
    }

    function addMarkerByMouse() {

        const infoWindow = getInfoWindow({
            content: "",
            disableAutoPan: true,
        });

        const color = 'blue'
        const svg = window.btoa(`
                      <svg fill="${color}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
                        <circle cx="120" cy="120" opacity=".8" r="70" />    
                      </svg>`);

        _addMarker = new google.maps.Marker({
            position: new google.maps.LatLng(37.556059, 126.9809),
            map: _map,
            icon: {
                url: `data:image/svg+xml;base64,${svg}`,
                scaledSize: new google.maps.Size(75, 75),
            },
            draggable: true,
        });

        _addMarker.addListener('mouseup', e => {
            const latLng = e.latLng.toJSON();

            const btn = document.createElement('button');
            btn.onclick = addAddress;
            btn.innerText = '추가하기'

            infoWindow.setContent(btn);
            infoWindow.open(_map, _addMarker);

            reverseGeocoding(latLng);
        })
    }

    function addAddress() {
        console.log('addddd')
    }

    function reverseGeocoding(latLng) {

        const latBox = document.getElementById('lat');
        const lngBox = document.getElementById('lng');
        const addressBox = document.getElementById('address');

        setFitBounds({location: latLng}, (e) => {
            const address = e.results[0].formatted_address;
            const sgg = address.split(' ')[2];

            setGeoJsonStyle(sgg);
            latBox.value = latLng.lat;
            lngBox.value = latLng.lng;
            addressBox.value = address;
        });
    }

    function setInitPosition() {
        _map.setZoom(12);
        _map.setCenter(new google.maps.LatLng(37.556059, 126.9809))
    }


    function setBasicMarker() {
        console.time("basic marker")
        _basicMarker = [];

        const infoWindow = getInfoWindow();

        cycleData.forEach((e, i) => {
            const marker = new google.maps.Marker({
                position: {lat: e.lat, lng: e.lng},
                icon,
                map: _map,
            });
            marker.addListener("click", () => {
                infoWindow.setContent(`<div>test</div>`);
                infoWindow.open(_map, marker);
            });

            _basicMarker.push(marker);
        });
        console.timeEnd('basic marker');
    }

    function setAdvancedMarker() {
        console.time("setAdvancedMarker")
        _advancedMarker = [];
        cycleData.forEach((e, i) => {
            const pinViewScaled = new google.maps.marker.PinView({
                // background: '#589865',s
            });

            const parser = new DOMParser();

            const pinSvg = parser.parseFromString(
                appleSvg,
                "image/svg+xml",
            ).documentElement;

            const markerView = new google.maps.marker.AdvancedMarkerView({
                map: _map,
                position: {lat: e.lat, lng: e.lng},
                // content: priceTag,
                // content: pinViewScaled.element,
                content: pinSvg,
                // collisionBehavior: google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY,
                // draggable: true,
            });
            _advancedMarker.push(markerView);
        })
        console.timeEnd("setAdvancedMarker");
    }

    function setClusteringAdvancedMarker() {
        console.time('setClusteringAdvancedMarker')
        const infoWindow = getInfoWindow();

        const markers = cycleData.map((e, i) => {
            const pinViewScaled = new google.maps.marker.PinView({
                // background: '#589865',
                // borderColor: "#868383",
                // glyphColor: "#d7ffdf",
            });


            const parser = new DOMParser();
            const pinSvg = parser.parseFromString(
                appleSvg,
                "image/svg+xml",
            ).documentElement;

            return new google.maps.marker.AdvancedMarkerView({
                position: {lat: e.lat, lng: e.lng},
                // content: priceTag,
                // content: pinViewScaled.element,
                content: pinSvg,
                // collisionBehavior: google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY,
                // draggable: true,
            });
        });


        _clusterAdvancedMarker = new markerClusterer.MarkerClusterer({map: _map, markers, ...getClusterOption()});
        console.timeEnd('setClusteringAdvancedMarker')
    }

    function setClusteringMarker() {
        console.time('setClusteringMarker');
        const infoWindow = getInfoWindow();
        
        const markers = cycleData.map((e, i) => {
            const marker = new google.maps.Marker({
                position: {lat: e.lat, lng: e.lng},
                icon
            });

            marker.addListener("click", () => {
                infoWindow.setContent(`<div>test</div>`);
                infoWindow.open(_map, marker);
            });
            return marker;
        });


        _clusterMarker = new markerClusterer.MarkerClusterer({map: _map, markers, ...getClusterOption()});

        console.timeEnd('setClusteringMarker');
    }

    function setDataLayer() {
        console.time("setDataLayer")

        _map.data.loadGeoJson('./data/geoData/cycleRent.geojson');
        _map.data.setStyle({
        })
        
        console.timeEnd("setDataLayer")
    }

    function setDataLayerClustering() {

        console.time("setDataLayerClustering")
        _map.data.setStyle({
            visible: false,
            // icon
        })
        _map.data.loadGeoJson('./data/geoData/cycleRent.geojson', null, (features) => {

            let markers = features.map((feature) => {
                const lat = feature.getGeometry().g.lat();
                const lng = feature.getGeometry().g.lng();

                return new google.maps.Marker({position: {lat, lng}});
            });

            new markerClusterer.MarkerClusterer({map: _map, markers, ...getClusterOption().algorithm});
        });

        console.timeEnd("setDataLayerClustering")

    }
    return {
        initMap() {
            initMap();
        },
        setGeoJson(path, style) {
            setGeoJson(path, style);
        },
        addMarker(position, options = {}) {
            addMarker(position, options = {});
        },
        accordionClickEventHandler() {
            accordionClickEventHandler();
        },
        addAccordionItem(data) {
            addAccordionItem(data);
        },
        addAccoItemClickEventHandler() {
            addAccoItemClickEventHandler();
        },
        setGeoJsonStyle(target) {
            setGeoJsonStyle(target);
        },
        addMarkerByMouse() {
            setInitPosition();
            removeMarker();
            setGeoJsonStyle();
            addMarkerByMouse();
        },
        setClustering() {
            setClusteringMarker();
        },
        setBasicMarker() {
            setBasicMarker();
        },
        setAdvancedMarker() {
            setAdvancedMarker();
        },
        removeMarker() {
            removeMarker();
        },
        setClusteringAdvancedMarker() {
            setClusteringAdvancedMarker();
        },
        setDataLayer() {
            setDataLayer();
        },
        setDataLayerClustering() {
            setDataLayerClustering();
        },
    };
}