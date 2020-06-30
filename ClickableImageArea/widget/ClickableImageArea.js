/*global logger*/
/*
    ClickableImageArea
    ========================

    @file      : ClickableImageArea.js
    @version   : 1.0.0
    @author    : Glarius
    @date      : 2020-02-19
    @copyright : Mansystems 2020
    @license   : Apache 2

    Documentation
    ========================
    Describe your widget here.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",

    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",

    
    "ClickableImageArea/lib/jquery-1.11.2",

    "dojo/text!ClickableImageArea/widget/template/ClickableImageArea.html"
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent, _jQuery, widgetTemplate,) {
    "use strict";

    var $ = _jQuery.noConflict(true);

    // Declare widget's prototype.
    return declare("ClickableImageArea.widget.ClickableImageArea", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // DOM elements
        inputNodes: null,
        colorSelectNode: null,
        colorInputNode: null,
        infoTextNode: null,

        mapNode: null,
        imgNode: null,
        divNode: null,
        svgNode: null,

        // Parameters configured in the Modeler.

        /** Map region category */
		//entity : '',
		//objects : [],

        /** Static location category*/
        

        /** Map image category */
        mapImage : null,
        ImageRegions : '',
        imgWidth : 50,
        imgHeight : 50,

        /** Context Object category */
        static:false,
        RegionNameAttribute:'',
        RegionCoordinatesAttribute:'',
        RegionColorAttribute:'',

        /** Dynamic location category */
        inputParameterEntity: null,
        locationsEntity:null,
        dataSourceMicroflow: null,
        dataSourceNanoflow: null,

        /** Map style category */
        fillColor: '',
        selectColor: '',
        borderColor:'',
        borderthickness: 1,



        mfToExecute: "",
        mfToExecuteName: '',
        messageString: "",
        backgroundColor: "",
       

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _contextObj: null,
        _alertDiv: null,
        _readOnly: false,
        _associatedEntityJSON : {},
        _locations:[],
    

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
            logger.debug(this.id + ".constructor");
            this._handles = [];
            this.fillColor = this.fillColor == '' && "rgba(255, 255, 255, 0)";
            this.selectColor = this.selectColor == '' && "rgb(255, 0, 0)";
            this.borderColor = this.borderColor == '' && "rgb(255, 0, 0)";
            this.borderthickness = this.borderthickness == undefined && 1;
            
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            logger.debug(this.id + ".postCreate");

            if (this.readOnly || this.get("disabled") || this.readonly) {
              this._readOnly = true;
            }
            this._updateRendering();
            this._setupEvents();
        },

        setupMapWidget : function(){
            logger.debug(this.id + "..SetupMapWidget");
            this.domNode.style.outline = "1px";            
            this.handleDivNode();
            this.getLocationsFromList();

            if(this.static == true){
                this.addPolygonNodeStatic(this.ImageRegions);
            }
        },  

        handleDivNode: function(){
            logger.debug(this.id + ".handleDivNode");
            this.divNode.style = `border: 1px solid black;
                                  background:url(${this.mapImage}); 
                                  width: ${this.imgWidth}px;
                                  height: ${this.imgHeight}px;
                                  background-repeat: no-repeat`;
        },       
        
        // CreateMapRegions: function(){
        //     logger.debug(this.id + ".CreateMapRegions");
        //     var svg_Node = document.getElementById('svgID');
        //     logger.debug('Expect SVG: ', svg_Node);

        //     this.ImageRegions.forEach(function(region){
        //         var regionName = region.RegionName;
        //         var coordinates = region.regionCoordinate;
        //         console.log(regionName);
        //         console.log(coordinates);
        //         var shape = this.defineShapeType(coordinates)
        //         console.log(shape)
        //         this.addPolygonNodeNS(regionName, coordinates, shape);
        //     }, this)
        // },

        // defineShapeType: function(coordinates){
        //     var coordinateArray = coordinates.split(',');
        //     console.log(coordinateArray.length);

        //     var shapetype = '';
        //     if(coordinateArray.length === 4){
        //         shapetype = 'rect'
        //     }
        //     else{
        //         shapetype = 'polygon'
        //     }

        //     return shapetype;
        // },

        // changePolygonTemplatebyMxObject: function(regions){
        //     console.log('LocationObjects: ' + regions);
        //     var i = 0;
        //     for(i = 0; i<regions.length; i++){
        //         var polygonNode = document.getElementsByTagName('polygon')[i]; 
        //         console.log('This is polygonNode: ' + polygonNode)
        //         polygonNode.setAttribute('name', regions[i].Name.value);
        //         polygonNode.setAttribute('points', regions[i].Coordinate.value);
        //         polygonNode.setAttribute('title', regions[i].Name.value);
        //         polygonNode.setAttribute('data-dojo-attach-point', regions[i].Name.value);
        //         polygonNode.style.fill = regions[i].LocationColor.value;

        //     }
        // },

        // changePolygonTemplate: function(regions){
        //     console.log(regions);
        //     var i=0;
        //     for(i = 0; i<regions.length; i++){
        //         var polygonNode = document.getElementsByTagName('polygon')[i]; 
        //         console.log('This is polygonNode: ' + polygonNode)
        //         polygonNode.setAttribute('name', regions[i].RegionName);
        //         polygonNode.setAttribute('points', regions[i].regionCoordinate);
        //         polygonNode.setAttribute('title', regions[i].RegionName);
        //         polygonNode.setAttribute('data-dojo-attach-point', regions[i].RegionName);
        //         polygonNode.style.fill = regions[i].regionColor;

        //     }
        // },

        addPolygonNodeStatic: function(regions){
            console.log(regions);
            var svg = document.getElementById('svgID')
            var polygon = document.getElementsByTagName('polygon')[0];
            var polygonNodeToClone = document.getElementById('PolyID');
            var i=0;
            for(i = 0; i<regions.length; i++){
                var polygonNode = polygonNodeToClone.cloneNode(true);
                polygonNode.id = regions[i].RegionName;
                polygonNode.name = regions[i].RegionName
                polygonNode.setAttribute('points', regions[i].regionCoordinate);
                polygonNode.setAttribute('data-dojo-attach-point', regions[i].RegionName);
                polygonNode.style.fill = regions[i].regionColor;
                svg.appendChild(polygonNode);
            }

            svg.removeChild(polygonNodeToClone);
        },

        addPolygonNodeDynamic: function(regions){
            console.log(regions);
            var svg = document.getElementById('svgID')
            var polygon = document.getElementsByTagName('polygon')[0];
            var polygonNodeToClone = document.getElementById('PolyID');
            var i=0;
            for(i = 0; i<regions.length; i++){
                var polygonNode = polygonNodeToClone.cloneNode(true);
                polygonNode.id = regions[i].Name.value;
                polygonNode.name =  regions[i].Name.value;
                polygonNode.setAttribute('points', regions[i].Coordinate.value );
                polygonNode.setAttribute('data-dojo-attach-point', regions[i].Name.value);
                polygonNode.style.fill = regions[i].LocationColor.value;
                svg.appendChild(polygonNode);
            }

            svg.removeChild(polygonNodeToClone);
        },

        getLocationsFromList: function(){
            logger.debug(this.id + "._getLocations")

            mx.ui.action(this.dataSourceMicroflow, {
                params: {
                  applyto: "selection",
                  guids: [this._contextObj.getGuid()]
                },
                callback: lang.hitch(this, this.processLocationData),
                error: lang.hitch(this, function (error) {
                  console.log(this.id + '_getChartData ' + error);
                })
              }, this);
        },

        processLocationData: function(itemList){
            itemList.forEach(function(item){
                var attributes = item.jsonData.attributes;
                this._locations.push(attributes);
            }, this)
            
            if(this.static == false){
                console.log('Locations: ', this._locations);
                this.addPolygonNodeDynamic(this._locations);
            }
            
            this.clickPolygon();
        },

        // addPolygonNodeNS: function(regionName, coordinates, shape){
        //     var polygonNode = document.createElementNS('http://www.w3.org/2000/svg', shape);
        //     polygonNode.setAttributeNS('http://www.w3.org/2000/svg', 'style', 'style="fill:lime;stroke:purple;stroke-width:1"');
        //     polygonNode.setAttributeNS('http://www.w3.org/2000/svg', 'name', regionName);
        //     polygonNode.setAttributeNS('http://www.w3.org/2000/svg', 'points', coordinates);
        //     polygonNode.setAttributeNS('http://www.w3.org/2000/svg', 'data-dojo-attach-point', regionName);
        //     var svgElement = document.getElementById('svgID');
        //     svgElement.appendChild(polygonNode);
        // },




        // handleImgNode: function(){
        //     logger.debug(this.id + ".handleImgNode");
        //     this.imgNode.src = this.mapImage;
        //     this.imgNode.width= this.imgWidth;
        //     this.imgNode.height= this.imgHeight;
        // },

        // div Node to hold background image
 

        // handleImageRegions: function(){
        //     this.ImageRegions.forEach(function(region){
        //         var regionName = region.RegionName;
        //         var coordinates = region.regionCoordinate;

        //         console.log(regionName);
        //         console.log(coordinates);
        //         var shape = this.shapeType(coordinates)
        //         this.addAreaNode(coordinates, regionName, shape);
        //         var shape = this.shapeType(coordinates)

        //     }, this)
        // },

 

        // shapeType: function(coordinates){
        //     var coordinateArray = coordinates.split(',');
        //     console.log(coordinateArray.length);

        //     var shapetype = '';

        //     if(coordinateArray.length === 3){
        //         shapetype = 'circle'
        //     }
        //     else if(coordinateArray.length === 4){
        //         shapetype = 'rect'
        //     }
        //     else{
        //         shapetype = 'poly'
        //     }

        //     return shapetype;
        // },

     

        // addAreaNode: function(coordinates, regionName, shape){

        //     var areaNode = dojo.create("AREA", { shape: shape,
        //                                          title:regionName, 
        //                                          name:regionName,
        //                                          coords: coordinates,
        //                                          //href:'https://www.abeautifulsite.net/adding-and-removing-elements-on-the-fly-using-javascript',
        //                                          'data-dojo-attach-point': regionName
        //                                         }, "mapId" )
        //     var parent = dojo.byId("mapId");
        //     console.log(parent);
        //     console.log(areaNode);
        //     return parent; 

        // },

        // Create SVG element

        // CreateSVGNode:  function(){
        //     logger.debug(this.id + ".createSVGNode");
        //     console.log("Check this: "+ newSVG)
        //     var svgNode = this.addSVGNode(this.divNode, this.imgHeight, this.imgWidth);
        //     //var defNode = this.addDefsNode(svgNode);
        //     //var patternNode = this.addPatternNode(defNode);
        //     //this.CreateMapRegions(svgNode);
        // },

        // Add polygon element
        // addPolygonNode: function(parentNode, coordinates, regionName, shape){
        //     var polygonNode = dojo.create(shape, {  style:"fill:lime;stroke:purple;stroke-width:1",
        //                                             name:regionName,
        //                                             height:"100%",
        //                                             width:"100%",
        //                                             points: coordinates,
        //                                             'data-dojo-attach-point': regionName
        //                                         }, parentNode.id )
        //     var parent = dojo.byId(parentNode.id);
        //     // console.log(parent);
        //     // console.log(polygonNode);
        //     return polygonNode;                                     
        // },   
        
        // Create svg element

        // addSVGNode: function(parentNode, height, width){
        //     var svgNode = dojoConstruct.create("svg", {
        //                                         id:"svgID", 
        //                                         height:"450",
        //                                         width: "500",
        //                                      }, parentNode.id )
        //     var parent = dojo.byId(parentNode.id);
        //     // console.log(parent);
        //     // console.log(svgNode);
        //     return svgNode;                                     
        // },   

        // Create defs element

        // addDefsNode: function(parentNode){
        //     var defsNode = dojo.create("defs", {id:"defsID"
        //                                         }, parentNode.id )
        //     var parent = dojo.byId(parentNode.id);
        //     console.log(parent);
        //     console.log(defsNode);
        //     return defsNode;                                     
        // },   

        // Create pattern element
        // addPatternNode: function(parentNode){
        //     var patternNode = dojo.create("pattern", {id:"patternID",
        //                                         height: "100%",
        //                                         width:"100%",
        //                                         patternContentUnits:"objectBoundingBox"
        //                                         }, parentNode.id )
        //     var parent = dojo.byId(parentNode.id);
        //     console.log(parent);
        //     console.log(patternNode);
        //     return patternNode;                                     
        // }, 
        
        // Create image element
        // addImageNode: function(){
        //     var imageNode = dojo.create("image", {height: "1",
        //                                         width:"1",
        //                                         'xlink:href':"images/vegetables.jpg",
        //                                         }, "patternID" )
        //     var parent = dojo.byId("patternID");
        //     console.log(parent);
        //     console.log(imageNode);
        //     return parent;                                     
        // }, 

        clickPolygon: function(){
            var same = this;
            document.addEventListener('click', function(e){
                if(e.target.tagName == 'polygon'){
                    console.log('fill color: ', e.target.style.fill)
                    if (e.target.style.fill == 'rgba(255, 255, 255, 0)'){
                        e.target.style.fill = '#FF0000';
                        console.log('New fill color: ', e.target.style.fill)
                    }else{
                        e.target.style.fill = 'rgba(255, 255, 255, 0)';
                    }

                    same._contextObj.set(same.RegionNameAttribute, e.target.name);
                    same._contextObj.set(same.RegionCoordinatesAttribute, e.target.points);
                    same._contextObj.set(same.RegionColorAttribute, e.target.style.fill);
                    same._execMf(same.mfToExecute, same._contextObj.getGuid());
                }     
            })
        },

        clickArea: function(){
            this.connect(this.divNode, "click", lang.hitch(this, function (e) {

                if (dojoDom.isDescendant(e.target, this.svgNode)){
                    console.log('name of current element: ' + e.target.title);   
                    this._execMf(this.mfToExecute, this._contextObj.getGuid());   
                }
              
                
            }));
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function (obj, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = obj;
            this._resetSubscriptions();
            this._updateRendering(callback); // We're passing the callback to updateRendering to be called after DOM-manipulation
        },

        // mxui.widget._WidgetBase.enable is called when the widget should enable editing. Implement to enable editing if widget is input widget.
        enable: function () {
          logger.debug(this.id + ".enable");
        },

        // mxui.widget._WidgetBase.enable is called when the widget should disable editing. Implement to disable editing if widget is input widget.
        disable: function () {
          logger.debug(this.id + ".disable");
        },

        // mxui.widget._WidgetBase.resize is called when the page's layout is recalculated. Implement to do sizing calculations. Prefer using CSS instead.
        // resize: function (box) {
        //   logger.debug(this.id + ".resize");
        // },

        // // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        // uninitialize: function () {
        //   logger.debug(this.id + ".uninitialize");
        //     // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
        // },

        // We want to stop events on a mobile device
        _stopBubblingEventOnMobile: function (e) {
            logger.debug(this.id + "._stopBubblingEventOnMobile");
            if (typeof document.ontouchstart !== "undefined") {
                dojoEvent.stop(e);
            }
        },

        // Attach events to HTML dom elements
        _setupEvents: function () {
            logger.debug(this.id + "._setupEvents");

            /* Modified starts */
            this.setupMapWidget();
            this.clickPolygon()
            
            //this.clickArea();
            
        },

        _execMf: function (mf, guid, cb) {
            logger.debug(this.id + "._execMf");

            if (mf) {
                mx.ui.action(mf, {
                    params: {
                        applyto: "selection",
                        guids: [guid]
                    },
                    callback: lang.hitch(this, function (objs) {
                        if (cb && typeof cb === "function") {
                            cb(objs);
                        }
                    }),
                    error: function (error) {
                        console.debug(error.description);
                    }
                }, this);
            }
        },

        // Rerender the interface.
        _updateRendering: function (callback) {
            logger.debug(this.id + "._updateRendering");

            // Important to clear all validations!
            this._clearValidations();
            //this.getLocationsFromList();
            this.setupMapWidget();

            // The callback, coming from update, needs to be executed, to let the page know it finished rendering
            this._executeCallback(callback, "_updateRendering");
        },

        // Handle validations.
        _handleValidation: function (validations) {
            logger.debug(this.id + "._handleValidation");
            this._clearValidations();
           
        },

        // Clear validations.
        _clearValidations: function () {
            logger.debug(this.id + "._clearValidations");
            dojoConstruct.destroy(this._alertDiv);
            this._alertDiv = null;
        },

        // Show an error message.
        _showError: function (message) {
            logger.debug(this.id + "._showError");
            if (this._alertDiv !== null) {
                dojoHtml.set(this._alertDiv, message);
                return true;
            }
            this._alertDiv = dojoConstruct.create("div", {
                "class": "alert alert-danger",
                "innerHTML": message
            });
            dojoConstruct.place(this._alertDiv, this.domNode);
        },

        // Add a validation.
        _addValidation: function (message) {
            logger.debug(this.id + "._addValidation");
            this._showError(message);
        },

        // Reset subscriptions.
        _resetSubscriptions: function () {
            logger.debug(this.id + "._resetSubscriptions");
            // Release handles on previous object, if any.
            this.unsubscribeAll();

            // When a mendix object exists create subscribtions.
            if (this._contextObj) {
                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: lang.hitch(this, function (guid) {
                        this._updateRendering();
                    })
                });

                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    val: true,
                    callback: lang.hitch(this, this._handleValidation)
                });
            }
        },

        _executeCallback: function (cb, from) {
            logger.debug(this.id + "._executeCallback" + (from ? " from " + from : ""));
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["ClickableImageArea/widget/ClickableImageArea"]);
