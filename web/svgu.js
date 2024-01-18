var SVGU = {};

SVGU.matterBodyDataFromSvgDoc = function (svgDoc) {

    const rectBodyGenFromSvgElem = (elem) => {
        let w = elem.width.baseVal.value;
        let h = elem.height.baseVal.value;
        bodyGen = (x, y, options) => Matter.Bodies.rectangle(x, y, w, h, options);
        return bodyGen;
    };

    const circleBodyGenFromSvgElem = (elem) => {
        let r  = elem.r.baseVal.value;
        bodyGen = (x, y, options, maxSides) => Matter.Bodies.circle(x, y, r, options, maxSides);
        return bodyGen;
    };

    const verticesBodyGenFromPolygons = (polygons) => {
        bodyGen = (x, y, options, flagInternal, removeCollinear, minimumArea, removeDuplicatePoints) =>
            Matter.Bodies.fromVertices(x, y, polygons, options, flagInternal, removeCollinear, minimumArea, removeDuplicatePoints);
        return bodyGen;
    };

    const getPaths = (elem) => {
        let result = [];
        let pathDataList = SVGU.pathDataListFromSvgGeoElem(elem);
        pathDataList.forEach((pathData) => {
            let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setPathData(pathData);
            result.push(path);
        });
        return result;
    };

    const getPolygons = (paths) => {
        let result = [];
        paths.forEach((path) => {
            let polygon = SVGU.polygonDataFromSvgGeoElem(path);
            result.push(polygon);
        });
        return result;
    };

    let elemG = svgDoc.querySelector("g"); // read only 1st g element
    let elems = elemG.querySelectorAll("path, polygon, rect, circle, ellipse");
    if (elems.length == 1) {
        let elem = elems[0];
        let paths = getPaths (elem);
        let bodyGen;
        if (elem.tagName === "rect") {
            bodyGen = rectBodyGenFromSvgElem(elem);
        } else if  (elem.tagName === "circle") {
            bodyGen = circleBodyGenFromSvgElem(elem);
        } else {
            let polygons = getPolygons(paths);
            bodyGen = verticesBodyGenFromPolygons(polygons);
        }
        return {paths:paths, bodyGen:bodyGen};
    } else {
        let paths = [];
        let polygons = [];
        elems.forEach((elem) => {
            let paths0 = getPaths (elem);
            let polygons0 = getPolygons(paths0);
            paths0.forEach((path) => paths.push(path));
            polygons0.forEach((polygon) => polygons.push(polygon));
        });
        bodyGen = verticesBodyGenFromPolygons(polygons);
        return {paths:paths, bodyGen: bodyGen};
    }
};


SVGU.contourDataFromSvgDoc = function (svgDoc) {

    const getPaths = (elem) => {
        let result = [];
        let pathDataList = SVGU.pathDataListFromSvgGeoElem(elem);
        pathDataList.forEach((pathData) => {
            let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setPathData(pathData);
            result.push(path);
        });
        return result;
    };

    const getPolygons = (paths) => {
        let result = [];
        paths.forEach((path) => {
            let polygon = SVGU.polygonDataFromSvgGeoElem(path);
            result.push(polygon);
        });
        return result;
    };

    let elemG = svgDoc.querySelector("g"); // read only 1st g element
    let elems = elemG.querySelectorAll("path, polygon, rect, circle, ellipse");
    let paths = [];
    let polygons = [];
    elems.forEach((elem) => {
        let paths0 = getPaths (elem);
        let polygons0 = getPolygons(paths0);
        paths0.forEach((path) => paths.push(path));
        polygons0.forEach((polygon) => polygons.push(polygon));
    });
    return {paths:paths, polygons: polygons};
};



SVGU.polygonDataFromSvgGeoElem = function (elem, gain = 10) {
    let result = [];
    let len = 0;
    while(len < elem.getTotalLength()) {
        let p = elem.getPointAtLength(len);
        result.push({x:p.x,y:p.y});
        len += gain;
    }
    return result;
};

SVGU.pathDataListFromSvgGeoElem = function (elem) {

    const closedPathListFromPath = (path) =>  {
        let result = [];
        let tmpPathData = [];
        let orgPathData = path.getPathData();
        for (let i = 0; i < orgPathData.length; i++) {
            let pathDataElem = orgPathData [i];
            tmpPathData.push(pathDataElem);
            if (pathDataElem.type === "z" || pathDataElem.type === "Z") {
                result.push(tmpPathData);
                tmpPathData = [];
            }
        }
        return result;
    };

    const polygonToPath = (points) => {
        let result = [];
        result.push({ type: "M", values: [points[0].x, points[0].y]});
        for(let i = 0; i < points.length; i++) {
            result.push({ type: "L", values: [points[i].x, points[i].y]});
        }
        result.push({ type: "Z"});
        return result;
    };

    const rectToPath = (x, y, w, h) => [
        { type: "M", values: [x, y]},
        { type: "l", values: [w, 0]},
        { type: "l", values: [0, h]},
        { type: "l", values: [-w,0]},
        { type: "Z" }
    ];

    //const circleToPath  = (cx, cy, r)   => `M ${cx-r}  ${cy} a ${r}  ${r}  0 1 1 ${r*2}  0 a ${r}  ${r}  0 1 1 -${r*2}  0 Z`;
    const circleToPath = (cx, cy, r) => [
        { type: "M", values: [cx-r, cy]},
        { type: "a", values: [r, r, 0, 1, 1,  r*2, 0]},
        { type: "a", values: [r, r, 0, 1, 1, -r*2, 0]},
        { type: "Z" }
    ];

    //const ellipseToPath = (cx,cy,rx,ry) => `M ${cx-rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx*2} 0 a ${rx} ${ry} 0 1 0 -${rx*2} 0 Z`;
    const ellipseToPath = (cx,cy,rx,ry) => [
        { type: "M", values: [cx-rx, cy]},
        { type: "a", values: [rx, ry, 0, 1, 0,  rx*2, 0]},
        { type: "a", values: [rx, ry, 0, 1, 0, -rx*2, 0]},
        { type: "Z" }
    ];
    
    if (elem.tagName === "path") {
        return closedPathListFromPath(elem);
    } else {
        if (elem.tagName === "polygon") {
            return [polygonToPath(elem.points)];
        } else if (elem.tagName === "rect") {
            let x = elem.x.baseVal.value;
            let y = elem.y.baseVal.value;
            let w = elem.width.baseVal.value;
            let h = elem.height.baseVal.value;
            return [rectToPath(x,y,w,h)];
        } else if (elem.tagName === "circle") {
            let cx = elem.cx.baseVal.value;
            let cy = elem.cy.baseVal.value;
            let r  = elem.r.baseVal.value;
            return [circleToPath(cx,cy,r)]
        } else if (elem.tagName === "ellipse") {
            let cx = elem.cx.baseVal.value;
            let cy = elem.cy.baseVal.value;
            let rx = elem.rx.baseVal.value;
            let ry = elem.ry.baseVal.value;
            return [ellipseToPath(cx,cy,rx,ry)];
        } else {
            return [];
        }
    }
};


SVGU.fillPaths = function (context, paths, color) {
    const fillItem = (path) => {
        let pathData = path.getPathData({normalize: true});
        context.beginPath();
        for (let i = 0; i < pathData.length; i++) {
            let pathElem = pathData[i];
            switch(pathElem.type) {
            case "M" : {
                context.moveTo(pathElem.values[0], pathElem.values[1]);
                break;
            }
            case "L" : {
                context.lineTo(pathElem.values[0], pathElem.values[1]);
                break;
            }
            case "C" : {
                context.bezierCurveTo(pathElem.values[0], pathElem.values[1],
                                      pathElem.values[2], pathElem.values[3],
                                      pathElem.values[4], pathElem.values[5]);
                break;
            }
            case "Z" : {
                break;
            }
            }
        }
        context.fillStyle = color;
        context.fill();
    };

    for(let i = 0; i < paths.length; i++) {
        fillItem(paths[i]);
    }
};

SVGU.fillPolygons = function (context, polygons, color) {
    const fillItem = (polygon) => {
        let vertice0 = polygon[0];
        context.beginPath();
        context.moveTo(vertice0.x, vertice0.y);
        for (let i = 1; i < polygon.length; i++) {
            let vertice = polygon[i];
            context.lineTo(vertice.x, vertice.y);
        }
        context.lineTo(vertice0.x, vertice0.y);
        context.fillStyle = color;
        context.fill();
    };

    for(let i = 0; i < polygons.length; i++) {
        fillItem(polygons[i]);
    }
};


SVGU.fillBodyModel = function (context, body, color) {
    const fillItem = (vertices) => {
        let vertice0 = vertices[0];
        context.beginPath();
        context.moveTo(vertice0.x, vertice0.y);
        for (let i = 1; i < vertices.length; i++) {
            let vertice = vertices[i];
            context.lineTo(vertice.x, vertice.y);
        }
        context.lineTo(vertice0.x, vertice0.y);
        context.fillStyle = color;
        context.fill();
    };

    if(body.parts.length == 1) {
        fillItem(body.vertices);
    } else {
        for(let i = 0; i < body.parts.length; i++) {
            if (i != 0 ){ // parts[0] self reference
                fillItem(body.parts[i].vertices);
            }
        }
    }
}

SVGU.drawBodyImage = function (context, body, image) {
    let w = image.width;
    let h = image.height;
    let x = body.position.x - (w/2);
    let y = body.position.y - (h/2);
    let tx = x+(w/2);
    let ty = y+(h/2);
    context.translate(tx,ty);
    context.rotate(body.angle);
    context.translate(-tx,-ty);
    context.drawImage(image,x,y,w,h);
    context.setTransform(1, 0, 0, 1, 0, 0);
}

