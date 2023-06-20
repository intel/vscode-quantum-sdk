/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Intel Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Represents a single quantum gate
interface QGate {
    name: string,
    qubits: number[],
    attributes?: string[],
    position?: number
}

// Holds all of the data necessary to create
// a quantum circuit board
interface QCircuitData {
    title: string,
    numQbits: number,
    qbitNames: string[],
    gates: QGate[]
}

// Represents a single collapsed quantum state ie. 110
interface QState {
    value: string,
    probability: number
}

// Holds all of the data necessary to create
// a histogram of quantum states
interface QHistogramData {
    title: string,
    states: QState[]
}