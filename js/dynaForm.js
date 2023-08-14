function dynaForm() {
    return {
        searchBoxForm(data) {
            const createImg = (photo) => {
                if (photo) {
                    return `<img style="width: 100px; height: 100px;" src="${photo[0].getUrl()}"  alt="img">`
                }
                return '';
            }

            return `
                ${createImg(data?.photos)}
                <table>
                   <tbody>
                   <tr>
                   <th>name</th>
                   <td>${data.name}</td>
                   </tr>
                   <tr>
                   <th>address</th>
                   <td>${data.formatted_address}</td>
                   </tr>
                   <tr>
                   <th>position</th>
                   </tr>
                </tbody>
                </table>
                `;
        },
        basicForm(data) {
            return `
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
                 </div>`
        }

    }
}