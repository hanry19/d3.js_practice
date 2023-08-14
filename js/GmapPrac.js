let _map;
const infoArray = [];
let _marker;
let _addMarker;
let _positionMarker;
let _mapStyle = {fillColor: 'rgba(97,162,246,1)', strokeWeight: 1, strokeColor: '#9d9d9d'};
const geocoder = new google.maps.Geocoder();
let active = false;

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
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            restriction: {
                latLngBounds: SEOUL_BOUND,
                strictBounds: false,
            },
            zoomControl: true,
            fullscreenControl: false,
            gestureHandling: "greedy",
            mapTypeControl: false,
            streetViewControl: false
        });

        _map.data.addListener("click", e => {
            console.log(e.feature.h.SGG_NM)

            setFitBounds({address: e.feature.h.SGG_NM});
            setGeoJsonStyle(e.feature.h.SGG_NM);
        })

        setSearchBox();
    }

    function setFitBounds(obj, callback) {
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
                const infoWindow = new google.maps.InfoWindow({
                    content: info,
                })

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
        const icon =
            "https://developers.google.com/maps/documentation/javascript/examples/full/images/parking_lot_maps.png";

        console.log(_map.getBounds().getSouthWest().lat());
        console.log(_map.getBounds().getSouthWest().lng());
        console.log(_map.getBounds().getNorthEast().lat());
        console.log(_map.getBounds().getNorthEast().lng());

        _addMarker = new google.maps.Marker({
            position: new google.maps.LatLng(37.556059, 126.9809),
            map: _map,
            icon,
            draggable: true,
        });

        _addMarker.addListener('mouseup', e => {
            const latLng = e.latLng.toJSON();
            reverseGeocoding(latLng);
        })
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
    };
}