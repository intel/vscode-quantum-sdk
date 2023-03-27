"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Intel Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBackgroundHeight = exports.getBackgroundWidth = exports.getNumQbits = exports.getCircuitWidth = exports.drawBoard = exports.initData = void 0;
// This file is used to generate the inside of the
// circuit board svg with the given json data
var data;
//Constants for spacing
const yPos = 20;
const xPos = 20;
var lineWidth;
const gateWidth = 10;
const gateHeight = 10;
var positionCounter;
const linePadding = 5;
const gateSpacing = 15;
var longestName;
var padName;
var backgroundWidth;
var backgroundHeight;
var maxGatesInOneLine;
function initData(content) {
    data = content;
    init();
}
exports.initData = initData;
/**
 * Creates the contents of the quantum circuit board svg
 * @param content the plain text of an json object. the function will convert this to an object and pull the required values to fill in the circuit board
 * @returns a string that contains html elements for creating the quantum circuit board that are to be placed inside an svg element
 */
function drawBoard() {
    return background() + drawNames() + drawLines() + drawGates();
}
exports.drawBoard = drawBoard;
function getCircuitWidth() {
    if (longestName !== 0) {
        return maxGatesInOneLine + longestName / 4.0;
    }
    return maxGatesInOneLine + 1;
}
exports.getCircuitWidth = getCircuitWidth;
function getNumQbits() {
    return data.numQbits;
}
exports.getNumQbits = getNumQbits;
function getBackgroundWidth() {
    return backgroundWidth;
}
exports.getBackgroundWidth = getBackgroundWidth;
function getBackgroundHeight() {
    return backgroundHeight;
}
exports.getBackgroundHeight = getBackgroundHeight;
function init() {
    positionCounter = new Array(data.numQbits);
    //Set position counter to zero
    for (let i = 0; i < positionCounter.length; i++) {
        positionCounter[i] = 0;
    }
    //Set x positions of qbits
    let curMax = 0;
    for (let i = 0; i < data.gates.length; i++) {
        //Find the leftmost open spot for this gate
        curMax = 0;
        for (let j = 0; j < data.gates[i].qubits.length; j++) {
            curMax = Math.max(curMax, positionCounter[data.gates[i].qubits[j]]);
        }
        //Set the position for the gate and mark that this space is taken
        data.gates[i].position = curMax + 1;
        for (let j = Math.min(...data.gates[i].qubits); j <= Math.max(...data.gates[i].qubits); j++) {
            positionCounter[j] = data.gates[i].position;
        }
    }
    //Find longetst name for background spacing
    longestName = 0;
    for (let i = 0; i < data.qbitNames.length; i++) {
        if (data.qbitNames[i].length > longestName) {
            longestName = data.qbitNames[i].length;
        }
    }
    if (longestName === 0) {
        longestName = 2;
    }
    padName = (longestName - 2) * 3;
    //define length of line
    curMax = Math.max(...positionCounter);
    maxGatesInOneLine = curMax;
    lineWidth = curMax * gateSpacing + linePadding;
    backgroundWidth = lineWidth + 25 + padName;
    backgroundHeight = yPos * data.numQbits + 20;
}
function background() {
    return `<rect class="backbackground" width="100%" height="100%"/>` +
        `<rect onclick="pos(evt)" id="background" class="background" width="${backgroundWidth}" height="${backgroundHeight}"/>`;
}
function drawNames() {
    let output = "";
    for (let i = 1; i <= data.qbitNames.length; i++) {
        if (data.qbitNames[i - 1] === "") {
            data.qbitNames[i - 1] = "0";
        }
        output += `<text x="${15 + padName}" y="${yPos * (i)}">|${data.qbitNames[i - 1]}⟩</text>`;
    }
    return output;
}
function drawLines() {
    let output = "";
    for (let i = 1; i <= data.numQbits; i++) {
        output += `
        <line class="line" x1="${xPos + padName}" y1="${yPos * i}" x2="${xPos + lineWidth + padName}" y2="${yPos * i}"/>`;
    }
    return output;
}
function drawGates() {
    let output = "";
    for (let i = 0; i < data.gates.length; i++) {
        output += drawGate(data.gates[i]);
    }
    return output;
}
function drawGate(gate) {
    let output = "";
    let x = (xPos + linePadding) + gateSpacing * (gate.position - 1) + padName;
    let y = (gate.qubits[gate.qubits.length - 1] + 1) * yPos - gateHeight / 2;
    // TODO: Account for more font sizes
    // Check name length to make sure it fits
    let fontsize = "";
    if (gate.name.length > 3) {
        fontsize = `style="font-size:4"`;
    }
    // Add potential attributes
    let attributes = "";
    let attrFunctionCall = "";
    if (gate.attributes !== null && gate.attributes !== undefined) {
        for (var attr of gate.attributes) {
            attributes += attr + '<br>';
        }
        attrFunctionCall = `onmousemove="showAttributes(evt, '${attributes}');" onmouseout="hideAttributes();"`;
    }
    //Allows for manual organization of circuit
    if (gate.name === "SPACE") {
        return "";
    }
    //Draw lines to connect multi-qbit gates
    if (gate.qubits.length > 1) {
        //draw line to connect furthest qbits
        output += `<line class="line" x1="${x + gateWidth / 2}" y1="${(Math.min(...gate.qubits) + 1) * yPos}" x2="${x + gateWidth / 2}" y2="${(Math.max(...gate.qubits) + 1) * yPos}"/>`;
        //draw dots on target qbits
        for (let i = 0; i < gate.qubits.length - 1; i++) {
            output += `<circle class="line" cx="${x + gateWidth / 2}" cy="${(gate.qubits[i] + 1) * yPos}" r="3"/>`;
        }
    }
    //Find subscript
    let subscript = '?';
    if (gate.name.length > 1) {
        subscript = gate.name.slice(-1);
        if (subscript === 'X' || subscript === 'Y' || subscript === 'Z') {
            gate.name = gate.name.slice(0, -1);
        }
    }
    //draw gate
    output += `<rect class="gate" x="${x}" y="${y}" rx="1" ry="1" width="${gateWidth}" height="${gateHeight}" id="${gate.name}" ${attrFunctionCall}/>`;
    switch (gate.name) {
        case "Meas":
            // Meas icon
            output += `
            <path transform="translate(${x}, ${y + 2})" d="M1 3C2.31073 1.49075 5.74576 -0.622193 9 3" stroke="black" stroke-width="0.3" fill="none"/>
            <path transform="translate(${x}, ${y + 2})" d="M9 5.49794e-07L7.3867 0.630302L8.73921 1.71231L9 5.49794e-07ZM5.11713 5.0937L8.27379 1.14788L8.03953 0.960469L4.88287 4.9063L5.11713 5.0937Z" fill="black"/>`;
            break;
        default:
            // Print gate name
            output += `<text class="gateText" x="${x + gateWidth / 2}" y="${y + gateHeight / 2}" ${fontsize} ${attrFunctionCall} >${gate.name}</text>`;
    }
    switch (subscript) {
        case 'X':
            output += `<path transform="translate(${x}, ${y + 2})" d="M9.196 5.332L8.472 5.988L9.188 6.66L9.428 6.78V7H8.524V6.78L8.756 6.66L8.22 6.16L7.708 6.66L7.94 6.78V7H7.1V6.78L7.34 6.66L8.056 6.004L7.332 5.332L7.1 5.22V4.992H8V5.22L7.768 5.332L8.304 5.836L8.828 5.332L8.596 5.22V4.992H9.428V5.22L9.196 5.332Z" fill="black"/>`;
            break;
        case 'Y':
            output += `<path transform="translate(${x}, ${y + 2})" d="M9.508 4.992V5.216L9.18 5.328L8.296 7.3C8.22933 7.452 8.15467 7.56933 8.072 7.652C7.992 7.73733 7.88933 7.79867 7.764 7.836C7.64133 7.876 7.48133 7.896 7.284 7.896H7.204V7.6C7.30533 7.608 7.40267 7.612 7.496 7.612C7.59733 7.612 7.67733 7.59867 7.736 7.572C7.79733 7.54533 7.85733 7.48933 7.916 7.404C7.97733 7.32133 8.05067 7.188 8.136 7.004L7.368 5.328L7.04 5.216V4.992H8.06V5.216L7.736 5.324L8.312 6.616L8.88 5.324L8.556 5.216V4.992H9.508Z" fill="black"/>`;
            break;
        case 'Z':
            output += `<path transform="translate(${x}, ${y + 2})" d="M9.132 6.38V7H7.2V6.692L8.684 5.272H7.504L7.42 5.612H7.212V4.992H9.104V5.3L7.62 6.72H8.848L8.924 6.38H9.132Z" fill="black"/>`;
    }
    return output;
}
//# sourceMappingURL=draw.js.map