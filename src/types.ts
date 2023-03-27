/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Intel Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

interface QGate {
    name: string,
    qubits: number[],
    attributes?: string[],
    position?: number
}

interface QData {
    title: string,
    numQbits: number,
    qbitNames: string[],
    gates: QGate[]
}