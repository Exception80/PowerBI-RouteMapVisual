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
    import DataViewObjectsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;
    
    export class CustomColor {
        public solid: { color: string }
        
        constructor(color: string) {
            this.solid = { color: color };
        }
    }

    export class PlanesVisPlanesSettings {
        public airplaneColor: CustomColor = new CustomColor("red");         
        public getAirplaneColor() {
            return this.airplaneColor.solid.color;
        }              
    }
    
    export class PlanesVisMarkersSettings {
        static minimunPossibleRadius: number = 0.1;
        static maximumPossibleRadius: number = 20;
        
        public labelFontColor: CustomColor = new CustomColor("black");
        public markerColor: CustomColor = new CustomColor("blue");
        public radius: number = 6;
        
        public getLabelFontColor() {
            return this.labelFontColor.solid.color;
        }
        
        public getMarkerColor() {
            return this.markerColor.solid.color;
        }
    }
    
    export class PlanesVisStateSettings {
        public stateColor: CustomColor;
        
        public getStateColor() {
            return this.stateColor.solid.color;
        }
        
        public constructor(color: string) {
            this.stateColor = new CustomColor(color);
        }
    }

    export class PlanesVisSettings extends DataViewObjectsParser {
        public planes: PlanesVisPlanesSettings = new PlanesVisPlanesSettings();
        public markers: PlanesVisMarkersSettings = new PlanesVisMarkersSettings();
        public state1: PlanesVisStateSettings = new PlanesVisStateSettings("red");
        public state2: PlanesVisStateSettings = new PlanesVisStateSettings("yellow");
        public state3: PlanesVisStateSettings = new PlanesVisStateSettings("green");
    }    
}