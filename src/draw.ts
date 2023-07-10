/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Intel Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// This file is used to generate the inside of the
// circuit board svg with the given json data
import { QGate, QCircuitData, GateData, ColorMethod } from './types'

var data: QCircuitData
var exporting: boolean

const gateMap = new Map<string, GateData>()

//Constants for spacing
const yPos = 20
const xPos = 20
var lineWidth: number
const gateWidth = 10
const gateHeight = 10
const textFontSize = 5

var positionCounter: number[]
const linePadding = 5
const gateSpacing = 15

var longestName: number
var padName: number

var backgroundWidth: number
var backgroundHeight: number

var maxGatesInOneLine: number

export function initData(content: QCircuitData, isExporting: boolean): void {
    data = content
    exporting = isExporting
    setGateMap()
    if (data.gateColorMethod === undefined) { data.gateColorMethod = 'default' }
    init()
}

/**
 * Creates the contents of the quantum circuit board svg
 * @param content the plain text of an json object. the function will convert this to an object and pull the required values to fill in the circuit board
 * @returns a string that contains html elements for creating the quantum circuit board that are to be placed inside an svg element
 */
export function drawBoard(): string {
    return background() + drawNames() + drawLines() + drawGates()
}

export function getCircuitWidth(): number {
    if (longestName !== 0) {
        return maxGatesInOneLine + longestName / 4.0;
    }

    return maxGatesInOneLine + 1
}

export function getNumQbits(): number {
    return data.numQbits
}

export function getBackgroundWidth(): number {
    return backgroundWidth
}

export function getBackgroundHeight(): number {
    return backgroundHeight
}

function setGateMap() {
    gateMap.set('H', { name: 'H', subscript: '', colors: ['blue', 'green', 'green', 'blue'] })
    gateMap.set('X', { name: 'X', subscript: '', colors: ['orange', 'green', 'yellow', 'orange'] })
    gateMap.set('CNOT', { name: 'X', subscript: '', colors: ['purple', 'green', 'yellow', 'orange'] })
    gateMap.set('Toffoli', { name: 'X', subscript: '', colors: ['purple', 'green', 'yellow', 'orange'] })
    gateMap.set('Y', { name: 'Y', subscript: '', colors: ['orange', 'green', 'red', 'yellow'] })
    gateMap.set('Z', { name: 'Z', subscript: '', colors: ['orange', 'green', 'blue', 'purple'] })
    gateMap.set('CZ', { name: 'Z', subscript: '', colors: ['purple', 'green', 'blue', 'purple'] })
    gateMap.set('S', { name: 'S', subscript: '', colors: ['red', 'green', 'blue', 'gray'] })
    gateMap.set('Sdag', { name: 'S', subscript: 'I', colors: ['red', 'green', 'blue', 'gray'] })
    gateMap.set('CPhase', { name: 'P', subscript: '', colors: ['purple', 'red', 'blue', 'gray'] })
    gateMap.set('RX', { name: 'R', subscript: 'X', colors: ['red', 'red', 'yellow', 'gray'] })
    gateMap.set('RY', { name: 'R', subscript: 'Y', colors: ['red', 'red', 'red', 'gray'] })
    gateMap.set('RZ', { name: 'R', subscript: 'Z', colors: ['red', 'red', 'blue', 'gray'] })
    gateMap.set('RXY', { name: 'R', subscript: 'XY', colors: ['red', 'red', 'orange', 'gray'] })
    gateMap.set('T', { name: 'T', subscript: '', colors: ['red', 'red', 'blue', 'gray'] })
    gateMap.set('Tdag', { name: 'T', subscript: 'I', colors: ['red', 'red', 'blue', 'gray'] })
    gateMap.set('SWAP', { name: 'Swap', subscript: '', colors: ['yellow', 'green', 'gray', 'gray'] })
    gateMap.set('SwapA', { name: 'Swap', subscript: 'A', colors: ['yellow', 'green', 'gray', 'gray'] })
    gateMap.set('MeasX', { name: 'Meas', subscript: 'X', colors: ['green', 'blue', 'yellow', 'red'] })
    gateMap.set('MeasY', { name: 'Meas', subscript: 'Y', colors: ['green', 'blue', 'red', 'red'] })
    gateMap.set('MeasZ', { name: 'Meas', subscript: 'Z', colors: ['green', 'blue', 'blue', 'red'] })
    gateMap.set('PrepX', { name: 'Prep', subscript: 'X', colors: ['green', 'blue', 'yellow', 'green'] })
    gateMap.set('PrepY', { name: 'Prep', subscript: 'Y', colors: ['green', 'blue', 'red', 'green'] })
    gateMap.set('PrepZ', { name: 'Prep', subscript: 'Z', colors: ['green', 'blue', 'blue', 'green'] })
}

function init(): void {

    positionCounter = new Array<number>(data.numQbits)

    //Set position counter to zero
    for (let i = 0; i < positionCounter.length; i++) {
        positionCounter[i] = 0
    }

    //Set x positions of qbits
    let curMax = 0
    for (let i = 0; i < data.gates.length; i++) {

        //Find range of qbits that a multi-qbit gate crosses over
        let minQbit = Math.min(...data.gates[i].qubits)
        let maxQbit = Math.max(...data.gates[i].qubits)

        if (data.gates[i].qubits.length > 1) {



            //Find the leftmost open spot for this gate
            curMax = 0
            for (let j = minQbit; j <= maxQbit; j++) {
                curMax = Math.max(curMax, positionCounter[j])
            }
        } else {
            curMax = positionCounter[data.gates[i].qubits[0]]
        }

        //Set the position for the gate and mark that this space is taken
        data.gates[i].position = curMax + 1
        for (let j = minQbit; j <= maxQbit; j++) {
            positionCounter[j] = data.gates[i].position!
        }
    }

    //Find longetst name for background spacing
    longestName = 0
    for (let i = 0; i < data.qbitNames.length; i++) {
        if (data.qbitNames[i].length > longestName) {
            longestName = data.qbitNames[i].length
        }
    }
    if (longestName === 0) {
        longestName = 2
    }
    padName = (longestName - 2) * 3

    //define length of line
    curMax = Math.max(...positionCounter)
    maxGatesInOneLine = curMax
    lineWidth = curMax * gateSpacing + linePadding

    backgroundWidth = lineWidth + 25 + padName
    backgroundHeight = yPos * data.numQbits + 20
}

function background(): string {
    let output = `<rect onclick="pos(evt)" id="background" class="background" width="${backgroundWidth}" height="${backgroundHeight}"/>`

    if (!exporting) {
        output = `<rect class="backbackground" width="100%" height="100%"/>` + output
    }

    return output
}

function drawNames(): string {
    let output = ""

    for (let i = 1; i <= data.qbitNames.length; i++) {
        if (data.qbitNames[i - 1] === "") {
            data.qbitNames[i - 1] = "0"
        }

        output += `<text x="${15 + padName}" y="${yPos * (i)}">|${data.qbitNames[i - 1]}⟩</text>`
    }

    return output
}

function drawLines(): string {
    let output = ""

    for (let i = 1; i <= data.numQbits; i++) {
        output += `
        <line class="line" x1="${xPos + padName}" y1="${yPos * i}" x2="${xPos + lineWidth + padName}" y2="${yPos * i}"/>`
    }

    return output
}

function drawGates(): string {
    let output = ""

    for (let i = 0; i < data.gates.length; i++) {
        output += drawGate(data.gates[i])
    }

    return output
}

function drawGate(gate: QGate): string {
    let output = ""

    let x = (xPos + linePadding) + gateSpacing * (gate.position! - 1) + padName
    let y = (gate.qubits[gate.qubits.length - 1] + 1) * yPos - gateHeight / 2

    //Parse gate
    let [gateName, gateSubscript, gateColor] = parseGate(gate.name)

    // Check name length to make sure it fits
    let fontSizeNum = textFontSize
    let extraSpaceForSubscript = 0
    if (gateName.length > 3) {
        fontSizeNum -= 1.5
        if (gateSubscript !== '') {
            extraSpaceForSubscript = 1
        }
    }

    let fontSize = `style="font-size: ${fontSizeNum}"`

    // Add potential attributes
    let attributes = ""
    let attrFunctionCall = ""
    if (!exporting && gate.attributes !== null && gate.attributes !== undefined) {
        for (var attr of gate.attributes) {
            attributes += attr + '<br>'
        }
        attrFunctionCall = `onmousemove="showAttributes(evt, '${attributes}');" onmouseout="hideAttributes();"`
    }

    //Allows for manual organization of circuit
    if (gate.name === "SPACE") {
        return ""
    }

    //Draw lines to connect multi-qbit gates
    if (gate.qubits.length > 1) {
        //draw line to connect furthest qbits
        output += `<line class="line" x1="${x + gateWidth / 2}" y1="${(Math.min(...gate.qubits) + 1) * yPos}" x2="${x + gateWidth / 2}" y2="${(Math.max(...gate.qubits) + 1) * yPos}"/>`

        //draw dots on target qbits
        for (let i = 0; i < gate.qubits.length - 1; i++) {
            output += `<circle class="line" cx="${x + gateWidth / 2}" cy="${(gate.qubits[i] + 1) * yPos}" r="3"/>`
        }
    }

    //draw gate 
    output += `<rect class="gate" x="${x}" y="${y}" rx="1" ry="1" width="${gateWidth}" height="${gateHeight}" id="${gateColor}" ${attrFunctionCall}/>`

    switch (gateName) {
        case "Meas":
            // Meas icon
            output += `
            <path transform="translate(${x}, ${y + 2})" d="M1 3C2.31073 1.49075 5.74576 -0.622193 9 3" stroke="black" stroke-width="0.3" fill="none"/>
            <path transform="translate(${x}, ${y + 2})" d="M9 5.49794e-07L7.3867 0.630302L8.73921 1.71231L9 5.49794e-07ZM5.11713 5.0937L8.27379 1.14788L8.03953 0.960469L4.88287 4.9063L5.11713 5.0937Z" fill="black"/>`
            break
        default:
            // Print gate name
            output += `<text class="gateText" x="${x + gateWidth / 2}" y="${y - extraSpaceForSubscript + gateHeight / 2}" ${fontSize} ${attrFunctionCall}>${gateName}</text>`
    }

    switch (gateSubscript) {
        case 'X':
            output += `<path transform="translate(${x}, ${y + 2})" d="M9.196 5.332L8.472 5.988L9.188 6.66L9.428 6.78V7H8.524V6.78L8.756 6.66L8.22 6.16L7.708 6.66L7.94 6.78V7H7.1V6.78L7.34 6.66L8.056 6.004L7.332 5.332L7.1 5.22V4.992H8V5.22L7.768 5.332L8.304 5.836L8.828 5.332L8.596 5.22V4.992H9.428V5.22L9.196 5.332Z" fill="black"/>`
            break
        case 'Y':
            output += `<path transform="translate(${x}, ${y + 2})" d="M9.508 4.992V5.216L9.18 5.328L8.296 7.3C8.22933 7.452 8.15467 7.56933 8.072 7.652C7.992 7.73733 7.88933 7.79867 7.764 7.836C7.64133 7.876 7.48133 7.896 7.284 7.896H7.204V7.6C7.30533 7.608 7.40267 7.612 7.496 7.612C7.59733 7.612 7.67733 7.59867 7.736 7.572C7.79733 7.54533 7.85733 7.48933 7.916 7.404C7.97733 7.32133 8.05067 7.188 8.136 7.004L7.368 5.328L7.04 5.216V4.992H8.06V5.216L7.736 5.324L8.312 6.616L8.88 5.324L8.556 5.216V4.992H9.508Z" fill="black"/>`
            break
        case 'Z':
            output += `<path transform="translate(${x}, ${y + 2})" d="M9.132 6.38V7H7.2V6.692L8.684 5.272H7.504L7.42 5.612H7.212V4.992H9.104V5.3L7.62 6.72H8.848L8.924 6.38H9.132Z" fill="black"/>`
            break
        case 'I':
            output += `<line transform="translate(${x}, ${y})" x1="7.5" y1="1" x2="7.5" y2="4" stroke="black" stroke-width="0.2"/>
                       <line transform="translate(${x}, ${y})"x1="6.5" y1="2" x2="8.5" y2="2" stroke="black" stroke-width="0.2"/>`
            break
        case 'A':
            output += `<path transform="translate(${x}, ${y})" d="M9.3 8.78V9H8.824L8.72 8.712C8.61067 8.824 8.492 8.90667 8.364 8.96C8.23867 9.01333 8.09733 9.04 7.94 9.04C7.684 9.04 7.49467 8.99067 7.372 8.892C7.24933 8.79333 7.188 8.63333 7.188 8.412C7.188 8.17733 7.26133 8.008 7.408 7.904C7.55467 7.79733 7.79067 7.744 8.116 7.744C8.244 7.744 8.356 7.756 8.452 7.78C8.55067 7.80133 8.63067 7.828 8.692 7.86V7.704C8.692 7.58133 8.676 7.48667 8.644 7.42C8.61467 7.35067 8.56 7.30133 8.48 7.272C8.40267 7.24 8.28933 7.224 8.14 7.224C7.87067 7.224 7.59067 7.256 7.3 7.32V7.032C7.596 6.968 7.87867 6.936 8.148 6.936C8.39867 6.936 8.58667 6.96133 8.712 7.012C8.84 7.06267 8.924 7.136 8.964 7.232C9.00667 7.328 9.028 7.46133 9.028 7.632V8.66L9.3 8.78ZM7.54 8.388C7.54 8.51867 7.572 8.612 7.636 8.668C7.70267 8.724 7.82267 8.752 7.996 8.752C8.124 8.752 8.24667 8.72933 8.364 8.684C8.484 8.636 8.59333 8.57067 8.692 8.488V8.088C8.54267 8.04533 8.36267 8.024 8.152 8.024C7.92 8.024 7.76 8.05333 7.672 8.112C7.584 8.17067 7.54 8.26267 7.54 8.388Z" fill="black"/>`
            break
        case 'XY':
            output += `<path transform="translate(${x - 2.5}, ${y + 2})" d="M9.196 5.332L8.472 5.988L9.188 6.66L9.428 6.78V7H8.524V6.78L8.756 6.66L8.22 6.16L7.708 6.66L7.94 6.78V7H7.1V6.78L7.34 6.66L8.056 6.004L7.332 5.332L7.1 5.22V4.992H8V5.22L7.768 5.332L8.304 5.836L8.828 5.332L8.596 5.22V4.992H9.428V5.22L9.196 5.332Z" fill="black"/>`
            output += `<path transform="translate(${x}, ${y + 2})" d="M9.508 4.992V5.216L9.18 5.328L8.296 7.3C8.22933 7.452 8.15467 7.56933 8.072 7.652C7.992 7.73733 7.88933 7.79867 7.764 7.836C7.64133 7.876 7.48133 7.896 7.284 7.896H7.204V7.6C7.30533 7.608 7.40267 7.612 7.496 7.612C7.59733 7.612 7.67733 7.59867 7.736 7.572C7.79733 7.54533 7.85733 7.48933 7.916 7.404C7.97733 7.32133 8.05067 7.188 8.136 7.004L7.368 5.328L7.04 5.216V4.992H8.06V5.216L7.736 5.324L8.312 6.616L8.88 5.324L8.556 5.216V4.992H9.508Z" fill="black"/>`
    }

    return output
}

// Takes a gate name and returns the visible gate name, subscript and  color
function parseGate(name: string): [name: string, subscript: string, color: string] {
    if (gateMap.has(name)) {
        const gate = gateMap.get(name)
        return [gate!.name, gate!.subscript, gate!.colors[ColorMethod[data.gateColorMethod as keyof typeof ColorMethod]]]
    } else {
        return [name, '', 'gray']
    }
}