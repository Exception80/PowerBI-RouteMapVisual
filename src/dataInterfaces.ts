/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {
    
    import TooltipEnabledDataPoint = powerbi.extensibility.utils.tooltip.TooltipEnabledDataPoint;
    
    export interface RouteMapDataView {
        planes: RouteMapPlanesList,
        planesLayer: L.FeatureGroup
    }
    
    export interface RouteMapPlanesList {
        [key: string]: RouteMapPlane;
    }

    export interface RouteMapPlane {
        marker: L.Marker,
        location: L.LatLng,
        isSelected: boolean,
        selectionId: ISelectionId
    }
      
    export interface FromToLatLng {
        toLatLng: L.LatLng,
        fromLatLng: L.LatLng,
        isFromLngMinus360: boolean,
        isToLngMinus360: boolean
    }
       
    export interface RouteMapPoint {
        name: string,
        latitude: number,
        longitude: number
    }
    
    export interface ThicknessOptions {
        minValue: number,
        coeficient: number
    } 
    
    export interface Direction {
        index: number,
        planecode: string,
        latitude: number,
        longitude: number,
        heading: number,
        stateValue: number,
        stateValueMin1: number,
        stateValueMax1: number,
        stateValueMin2: number,
        stateValueMax2: number,
        stateValueMin3: number,
        stateValueMax3: number,
        tooltipInfo: VisualTooltipDataItem[]  
    }
}