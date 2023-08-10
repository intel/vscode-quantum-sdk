/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Intel Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Panzoom
function initializePanzoom(backgroundWidth, backgroundHeight) {
    var circuitBoard = document.getElementById('circuitBoard')

    // Calculate where the zoom lock should be based
    // on the size of the circuit board
    const largestMinZoomSize = 10
    var minZoomSizeHeight = Math.min(largestMinZoomSize, 450.0 / backgroundHeight)
    var minZoomSizeWidth = Math.min(largestMinZoomSize, 700.0 / backgroundWidth)
    var minZoomSize = Math.min(minZoomSizeHeight, minZoomSizeWidth)

    var pz = panzoom(circuitBoard, {
        bounds: true,
        boundsPadding: 0,
        minZoom: minZoomSize,
        maxZoom: 10,
        smoothScroll: false,
        zoomSpeed: 0.3
    })

    var scene = document.getElementById('scene')

    //Find a starting position for the cicuit board
    var startX = 0
    var startY = 0
    if (scene.clientWidth > (backgroundWidth * minZoomSize)) {
        startX = (scene.clientWidth - backgroundWidth) / 2
    }
    if (scene.clientHeight > (backgroundHeight * minZoomSize)) {
        startY = (scene.clientHeight - backgroundHeight) / 2
    }

    pz.moveTo(startX, startY)

    let zoomX = 0
    let zoomY = 0
    if (startX !== 0) {
        zoomX = scene.clientWidth / 2
    }
    if (startY !== 0) {
        zoomY = scene.clientHeight / 2
    }
    if (minZoomSize > 1) {
        pz.zoomTo(zoomX, zoomY, 9)
    }
    pz.smoothZoom(zoomX, zoomY, minZoomSize / 10)
}

// Attributes
function showAttributes(evt, text) {
    if (text.length > 0) {
        let attrBlock = document.getElementById("attributes");
        attrBlock.innerHTML = text;
        attrBlock.style.display = "block";
        attrBlock.style.left = evt.pageX + 'px';
        attrBlock.style.top = evt.pageY + 'px';
    }
}

function hideAttributes() {
    var attrBlock = document.getElementById("attributes");
    attrBlock.style.display = "none";
}

function exportImage(boardWidth, boardHeight) {
    var circuitBoard = document.querySelector("#capture")
    circuitBoard.style.display = "block"

    html2canvas(circuitBoard, {
        scale: 5,
        width: boardWidth,
        height: boardHeight,
        logging: true
    }).then(canvas => {
        //document.body.appendChild(canvas)

        const dataURL = canvas.toDataURL("image/png");
        const anchor = document.createElement("a");
        anchor.href = dataURL;
        anchor.download = "image.png";
        anchor.click();
    });
    circuitBoard.style.display = "none"
}