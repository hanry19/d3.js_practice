let _map;
const infoArray = [];
let _marker;
let _addMarker;
let _mapStyle = {fillColor: 'rgba(97,162,246,1)', strokeWeight: 1, strokeColor: '#9d9d9d'};

function pracFn() {

    /**
     * Google Map Init Load
     */
    function initMap() {
        const div = document.getElementById('map');

        _map = new google.maps.Map(div, {
            zoom: 11.8,
            center: new google.maps.LatLng(37.556059, 126.9809),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            zoomControl: true,
            fullscreenControl: false,
            gestureHandling: "greedy",
            mapTypeControl: false,
            streetViewControl: false
        });

        
        _map.data.addListener("click",e =>{
            console.log(e.feature.h.SGG_NM)
            setGeoJsonStyle(e.feature.h.SGG_NM);
        })

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

        const info = `
                    <div>
                        <table>
                        <caption>따릉이 정류소 정보</caption>
                        <tbody>
                            <tr>
                                <th>이름</th>
                                <td>${data.name}</td>
                            </tr>
                            <tr>
                                <th>번호</th>
                                <td>${data.no}</td>
                            </tr>
                            <tr>
                                <th>위치</th>
                                <td>${data.address}</td>
                            </tr>
                            <tr>
                                <th>날짜</th>
                                <td>${data.date}</td>
                            </tr>
                        </tbody>
                    </table>
                 </div>
                        `

        const infoWindow = new google.maps.InfoWindow({
            content: info,
        })

        removeMarker()
        
        _marker = new google.maps.Marker({
            position: new google.maps.LatLng(data.lat, data.lng),
            map: _map,
            title,
            label,
        })


        _marker.addListener("click", () => {
            infoArray.forEach(e => e?.close());
            infoWindow.open({
                anchor: _marker,
                map: _map,
            })
            infoArray.push(infoWindow);
        })

    }

    function removeMarker() {
        _marker?.setMap(null);
        _addMarker?.setMap(null);
    }


    /***
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
                        panel.style.display = 'none';
                        pracFn().setGeoJsonStyle();
                    } else {
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
        console.log(_map.getBounds().getSouthWest().lat());
        console.log(_map.getBounds().getSouthWest().lng());
        
        _addMarker = new google.maps.Marker({
            position: new google.maps.LatLng(37.556059, 126.9809),
            map: _map,
            icon,
            draggable: true,
        });
        _addMarker.addListener('mouseup',e => {

            const geocoder = new google.maps.Geocoder();
            const latLng = e.latLng.toJSON();

            const latBox = document.getElementById('lat');
            const lngBox = document.getElementById('lng');
            const addressBox = document.getElementById('address');


            geocoder.geocode({location: latLng})
                .then(e => {
                    console.log(e.results);
                    const address = e.results[0].formatted_address;
                    const sgg = address.split(' ')[2];

                    setGeoJsonStyle(sgg);

                    latBox.value = latLng.lat;
                    lngBox.value = latLng.lng;
                    addressBox.value = address;

                });

        })
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
            removeMarker();
            setGeoJsonStyle();
            addMarkerByMouse();
        },
    };
}