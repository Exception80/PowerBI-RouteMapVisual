/*
 *  Power BI Visual CLI
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
    import DataViewObjects = powerbi.DataViewObjects;
    import DataViewValueColumn = powerbi.DataViewValueColumn;
	
	import Selection = d3.Selection;
    import UpdateSelection = d3.selection.Update;
    
    import tooltip = powerbi.extensibility.utils.tooltip;
    import TooltipEnabledDataPoint = powerbi.extensibility.utils.tooltip.TooltipEnabledDataPoint;
    import TooltipEventArgs = powerbi.extensibility.utils.tooltip.TooltipEventArgs;    
    import ITooltipServiceWrapper = powerbi.extensibility.utils.tooltip.ITooltipServiceWrapper;    
    import createTooltipServiceWrapper = powerbi.extensibility.utils.tooltip.createTooltipServiceWrapper;
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;
    import ValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    
    // powerbi.extensibility.utils.svg
    import IMargin = powerbi.extensibility.utils.svg.IMargin;
    import translate = powerbi.extensibility.utils.svg.translate;
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;

    // powerbi.extensibility.utils.type
    import pixelConverterFromPoint = powerbi.extensibility.utils.type.PixelConverter.fromPoint;

    // powerbi.extensibility.utils.formatting
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;

    const labelSelector = ".route-map-label";
    const labelClassName = "route-map-label";
    const labelMarkerClass = "airplane";
    const labelMarkerSelector = ".airplane";
    export class Visual implements IVisual {
        
        private routeMapDataView: RouteMapDataView;
        private targetHtmlElement: HTMLElement;
        private hostContainer: JQuery;
        private map: any;
        private dataIsNotEmpty: boolean;
        private isDataValid: boolean = false;
        private selectionManager: ISelectionManager;
        private host: IVisualHost;
        private isFirstMultipleSelection: boolean = true;
        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private leafletVectorMarker : any;

        private root: Selection<any>;
        
        private settings: RouteMapSettings;

        constructor(options: VisualConstructorOptions) {
            this.init(options);
        }

        public init(options: VisualConstructorOptions): void {
            this.selectionManager = options.host.createSelectionManager();
            this.host = options.host;            
            
            this.targetHtmlElement = options.element;

            this.addMapDivToDocument();         
            this.tooltipServiceWrapper = createTooltipServiceWrapper(
                this.host.tooltipService,
                options.element);

            this.hostContainer = $(this.targetHtmlElement).css('overflow-x', 'hidden');                        

            this.root = d3.select(this.targetHtmlElement);
            this.initMap();
        }
    
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            debugger;
            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {
                case 'routes':
                    objectEnumeration.push({
                        objectName: objectName,
                        displayName: "Routes",
                        properties: {
                            airplaneColor: this.settings.routes.getAirplaneColor()             
                        },
                        selector: null
                    });
                    break;
                case 'state1': 
                    objectEnumeration.push({
                        objectName: objectName,
                        displayName: "State 1",
                        properties: {
                            stateColor: this.settings.state1.getStateColor()
                        },
                        selector: null
                    });
                    break;
                case 'state2': 
                    objectEnumeration.push({
                        objectName: objectName,
                        displayName: "State 2",
                        properties: {
                            stateColor: this.settings.state2.getStateColor()
                        },
                        selector: null
                    });
                    break;
                case 'state3': 
                    objectEnumeration.push({
                        objectName: objectName,
                        displayName: "State 3",
                        properties: {
                            stateColor: this.settings.state3.getStateColor()
                        },
                        selector: null
                    });
                    break;
            };

            return objectEnumeration;
        }
        
        private mapGotActiveSelections(): boolean {
            return this.selectionManager.hasSelection();
        }

        private addMapDivToDocument(): void {
            var div = document.createElement('div');
            div.setAttribute("id", "map");
            div.setAttribute("style", "height:550px");
            div.setAttribute("class", "none");

            this.targetHtmlElement.appendChild(div);
        }

        public initMap(): void {

            this.map = L.map('map').setView([33.9415839, -118.4435494], 3);                      

            //add map tile
            var layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
                        maxZoom: 18
            }).addTo(this.map);

            this.routeMapDataView = {
                planes: {},
                planesLayer: L.featureGroup(),
            };

            this.setMapHandlers();
        }

        public update(options: VisualUpdateOptions): void {
            // render new data if dataset was changed
            if (options.type == VisualUpdateType.Data || options.type == VisualUpdateType.All) {
                let dataView: DataView = options
                    && options.dataViews
                    && options.dataViews[0];
                
                this.clearMap();
                this.routeMapDataView = this.converter(dataView);
                this.render();
            }
            
            let bounds = this.routeMapDataView.planesLayer.getBounds();
            
            if(bounds && bounds.isValid()) {
                this.map.fitBounds(bounds);    
            }       

            this.map.invalidateSize();
            this.updateContainerViewports(options.viewport);
        }

        private parseSettings(dataView: DataView): RouteMapSettings {
            return RouteMapSettings.parse<RouteMapSettings>(dataView);
        }
        
        private createPlaneMarker(direction: Direction,  settings: RouteMapSettings) : L.Marker{
            let stateValue = direction.stateValue;
            let airplaneColor = settings.routes.getAirplaneColor();                 
            if(stateValue !== undefined && stateValue !== null) {
                let state1Min = direction.stateValueMin1 !== null ? direction.stateValueMin1 : -Number.MAX_VALUE,
                    state1Max = direction.stateValueMax1 !== null ? direction.stateValueMax1 : Number.MAX_VALUE,
                    state2Min = direction.stateValueMin2 !== null ? direction.stateValueMin2 : -Number.MAX_VALUE,
                    state2Max = direction.stateValueMax2 !== null ? direction.stateValueMax2 : Number.MAX_VALUE,
                    state3Min = direction.stateValueMin3 !== null ? direction.stateValueMin3 : -Number.MAX_VALUE,
                    state3Max = direction.stateValueMax3 !== null ? direction.stateValueMax3 : Number.MAX_VALUE;                                                  
                if (stateValue <= state1Max && stateValue >= state1Min && state1Min !== -state1Max) {
                    airplaneColor = settings.state1.getStateColor();
                } else if (stateValue <= state2Max && stateValue >= state2Min && state2Min !== -state2Max) {
                    airplaneColor = settings.state2.getStateColor();
                } else if (stateValue <= state3Max && stateValue >= state3Min && state3Min !== -state3Max) {
                    airplaneColor = settings.state3.getStateColor();
                }
            }
            let svgrect = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="30px" viewBox="0 0 500 500" enable-background="new 0 0 500 500" xml:space="preserve">    <g transform="rotate(45 250 250)"><path transform="rotate(' + direction.heading + ' 250 250)" id="path6" fill="' + airplaneColor + '" d="M61.925,60.729c12.008-12.011,31.235-2.873,43.023,4.532c13.794,8.665,25.993,19.841,37.474,31.321l66.963,66.964l208.147-39.9c1.233-0.618,3.14-0.279,4.407,0.074c1.396,0.388,2.66,1.134,3.684,2.158l17.857,17.857c2.201,2.202,2.87,5.395,2.349,8.403c-0.485,.808-2.273,4.955-4.86,6.104l-160.436,76.451l68.359,68.358c18.595-5.313,37.19-10.65,55.888-15.595c3.688-0.975,7.382-1.954,11.105-2.788c0.895-0.2,1.794-0.403,2.702-0.532c2.527-0.359,5.252,0.671,7.035,2.454l17.856,18.135c2.116,2.117,2.855,5.195,2.379,8.107	    c-0.446,2.733-2.196,4.845-4.61,6.123l-78.125,43.248l-43.248,78.125c-1.447,2.314-3.645,3.984-6.385,4.367c-2.839,0.397-5.792-0.36-7.846-2.414l-17.857-17.857c-1.888-1.887-2.842-4.712-2.403-7.356c0.211-1.274,0.511-2.535,0.808-3.792c1.221-5.165,2.609-10.292,3.994-15.414c4.532-16.765,9.293-33.469,4.064-50.167l-68.359-68.359l-76.451,160.437c-1.107,2.49-3.146,4.268-5.84,4.811c-3.074,0.619-6.408-0.039-8.668-2.3l-17.857-17.856c-1.674-1.674-2.511-3.813-2.511-6.418	    l0.279-1.674l39.898-208.146l-66.965-66.964c-8.304-8.304-16.31-16.962-23.472-26.28c-5.323-6.926-10.284-14.277-13.852-22.277C55.979,82.639,53.229,69.417,61.925,60.729C65.737,56.915,58.108,64.542,61.925,60.729z" />    </g>    </svg>';
            let url = encodeURI("data:image/svg+xml," + svgrect).replace('#','%23');
            let icon = L.icon({iconUrl: url, className: labelMarkerClass });

            return L.marker(L.latLng(direction.latitude, direction.longitude), {icon: icon}).addTo(this.map); 
        }   

        public updateContainerViewports(viewport: IViewport) {
            // handle resize            
            var width = viewport.width;
            var height = viewport.height;
            this.hostContainer.css({
                'height': height,
                'width': width
            });
            // resize map     
            document.getElementById('map').style.width = viewport.width.toString() + "px";
            document.getElementById('map').style.height = viewport.height.toString() + "px";
        }

        private setLabelToElement(content: string, element: any): void {
            element.bindTooltip(content, { permanent: true, className: "route-map-label", offset: [0, 0] });
        }

        private setSelectionStyle(selected: boolean, element: L.Path): void {
            let opacity: number = selected ? 1 : 0.3;

            element.setStyle({
                opacity: opacity,
                fillOpacity: opacity
            });
        }
  
        private createCustomizableMarker(latLng: L.LatLng, settings: RouteMapSettings): L.CircleMarker {

            let marker = L.circleMarker(latLng, {
                color: settings.markers.getMarkerColor(),
                fillColor:  settings.markers.getMarkerColor(),
                fillOpacity: 1,
                radius: settings.markers.radius
            });

            return marker;
        }

        private setLabelFontColor(color: string) {
            $(labelSelector).css("color", color);
        }

        public render(): void {
            this.map.addLayer(this.routeMapDataView.planesLayer);            
            this.setLabelFontColor(this.settings.markers.getLabelFontColor());        
        }
       
        public clearMap(): void {
            let dataView = this.routeMapDataView;
            if (dataView && dataView.planesLayer) {
                dataView.planesLayer.clearLayers();
            }
        }
        
        private parseDataViewToDirections(dataView: DataView): Direction[] {
            let directions: Direction[] = [];
            let planecodes: any[] = dataView.categorical.categories[0].values;

            let latitude: any[] = dataView.categorical.values[0].values,
                longitude: any[] = dataView.categorical.values[1].values,
                heading: any[] = dataView.categorical.values[2].values,
                stateValues: any[],
                stateValuesMin1: any[],
                stateValuesMax1: any[],
                stateValuesMin2: any[],
                stateValuesMax2: any[],
                stateValuesMin3: any[],
                stateValuesMax3: any[]           
                
            let tooltipColumns: DataViewValueColumn[] = [];
            
            for(var i in dataView.categorical.values) {
                let column = dataView.categorical.values[i];
                if(column.source && column.source.roles["tooltips"]) {
                    tooltipColumns.push(column);
                } 
                
                if(column.source && column.source.roles["stateValue"]) {
                    stateValues = column.values;
                } 
                
                if(column.source && column.source.roles["stateValueMin1"]) {
                    stateValuesMin1 = column.values;
                } 
                
                if(column.source && column.source.roles["stateValueMax1"]) {
                    stateValuesMax1 = column.values;
                } 
                
                if(column.source && column.source.roles["stateValueMin2"]) {
                    stateValuesMin2 = column.values;
                } 
                
                if(column.source && column.source.roles["stateValueMax2"]) {
                    stateValuesMax2 = column.values;
                } 
                
                if(column.source && column.source.roles["stateValueMin3"]) {
                    stateValuesMin3 = column.values;
                } 
                
                if(column.source && column.source.roles["stateValueMax3"]) {
                    stateValuesMax3 = column.values;
                }                 
            }    

            planecodes.forEach((item: any, index: number) => {           
                let tooltipInfo: VisualTooltipDataItem[] = [];
                tooltipColumns.forEach((column) => {                    
                    let format = ValueFormatter.getFormatStringByColumn(column.source, true),
                    name = column.source.displayName,
                    value = column.values[index] ? column.values[index] : "";                                   
                    
                    tooltipInfo.push({displayName: name, value: ValueFormatter.format(value, format)});
                });                         
                                   
                    directions.push({
                        planecode: planecodes[index],
                        latitude: latitude[index],
                        longitude: longitude[index],
                        heading: heading[index],
                        stateValue: stateValues ? stateValues[index] : null,
                        stateValueMin1: stateValuesMin1 ? stateValuesMin1[index] : null,
                        stateValueMax1: stateValuesMax1 ? stateValuesMax1[index] : null,
                        stateValueMin2: stateValuesMin2 ? stateValuesMin2[index] : null,
                        stateValueMax2: stateValuesMax2 ? stateValuesMax2[index] : null,
                        stateValueMin3: stateValuesMin3 ? stateValuesMin3[index] : null,
                        stateValueMax3: stateValuesMax3 ? stateValuesMax3[index] : null,
                        tooltipInfo: tooltipInfo
                    });
                });                                  
            return directions;
       }
                   
       private createRouteMapPlane(direction: Direction, settings: RouteMapSettings): RouteMapPlane {                                                                                             
            let plane = this.createPlaneMarker(direction, settings);                     
            return {
                location: L.latLng(direction.latitude, direction.longitude),
                marker : plane
            };
        }

       
        public converter(dataView: DataView): RouteMapDataView {
            debugger;
            this.isDataValid = false;
            let settings = this.settings = this.parseSettings(dataView);
            
            if (!dataView
                || !dataView.categorical
                || !dataView.categorical.categories
                || !dataView.categorical.categories[0]
                || !dataView.categorical.values
                || !dataView.categorical.values[0]
                || !dataView.categorical.values[1]
                || !dataView.categorical.values[2]
                || !dataView.categorical.values[3]
                || dataView.categorical.values[3].source.roles["tooltips"]) {

                return {
                    planes: {},
                    planesLayer: L.featureGroup()
                };
            }                  

            let directions = this.parseDataViewToDirections(dataView),
                planeCategory = dataView.categorical.categories[0];

            let processedPlanes: RouteMapPlanesList = {}

            let planeLayer: L.FeatureGroup = L.featureGroup();

            for (var item in directions) {
                let direction = directions[item],
                    keyArc = direction.planecode;                
                if(!keyArc) {
                    continue;
                } 
                let planesMap = this.createRouteMapPlane(direction,settings);
                processedPlanes[keyArc] = planesMap;
                planeLayer.addLayer(processedPlanes[keyArc].marker);
            }        
            this.isDataValid = true;                              
            return {
                planes : processedPlanes,
                planesLayer: planeLayer
            };
        }

        private handleMove(): void {
            if (!this.isDataValid) {
                return;
            }
        }

        private setMapHandlers(): void {
            let me = this;

            this.map.on('zoom', function (e) {
                me.handleMove();
            });

            this.map.on('moveend', function (e) {
                me.handleMove();
            });

            this.map.on('click', function (e) {                
                let multipleSelection = (e as L.MouseEvent).originalEvent.ctrlKey;
                let defaultPrevented = (e as L.MouseEvent).originalEvent.defaultPrevented;
                
                if(multipleSelection || defaultPrevented) {
                    return;
                }
                
                if (me.mapGotActiveSelections()) {
                    me.selectionManager.clear();
                }
            });
        }
    }
}