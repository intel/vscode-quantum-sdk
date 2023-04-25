/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Intel Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const backgroundLight = 'fill: #f7f7f7;'
export const backgroundDark = 'fill: #262626;'
export const line = 'stroke: #808080; stroke-width: 0.7;'
export const textLight = `fill: #202020; text-anchor: end; font-family: 'Source Sans Pro', sans-serif; font-size: 5;`
export const textDark = `fill: #808080; text-anchor: end; font-family: 'Source Sans Pro', sans-serif; font-size: 5;`
export const gateText = `text-anchor: middle; dominant-baseline: middle; fill: black !important; font: Courier;`
export const gate = 'border: none; padding: 0; outline-width: 0;'

/* Gate Colors */
export function gateFill(name: string): string {
    switch (name) {
        case 'H':
            return 'fill: #00C7FD;'
        case 'X':
            return 'fill: #FF8F51;'
        case 'Z':
            return 'fill: #CC94DA'
        case 'Meas':
            return 'fill: #B1D272;'
        case 'Prep':
            return 'fill: rgb(247, 132, 132);'
        default:
            return 'fill: #00C7FD;'
    }
}