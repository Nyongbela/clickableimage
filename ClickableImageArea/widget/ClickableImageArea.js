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

        mapNode: null,
        imgNode: null,
        divNode: null,
        svgNode: null,

        // Parameters configured in the Modeler.       

        /** Map image category */
        mapImage : null,
        ImageRegions : '',
        imgWidth : 50,
        imgHeight : 50,

        /** Context Object category */
        RegionNameAttribute:'',
        RegionCoordinatesAttribute:'',
        RegionColorAttribute:'',
        inputParameterEntity: null,
        locationsEntity:null,
        dataSourceMicroflow: null,
        dataSourceNanoflow: null,



        mfToExecute: "",
        mfToExecuteName: '',
        messageString: "",
        backgroundColor: "",
       

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _contextObj: null,
        _readOnly: false,
        _locations:[],
    

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
            logger.debug(this.id + ".constructor");
            this._handles = [];
            
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
        },  

        handleDivNode: function(){
            logger.debug(this.id + ".handleDivNode");
            this.divNode.style = `background:url(${this.mapImage}); 
                                  width: ${this.imgWidth}px;
                                  height: ${this.imgHeight}px;
                                  background-repeat: no-repeat`;
        },       

        addPolygonNodeDynamic: function(regions){
            console.log(regions);
            var svg = document.getElementById('svgID')
            var childNodes = svg.children;
            console.log('Child nodes', childNodes[0].id)

            console.log('SVG', svg.childElementCount)

            var svgWidth = svg.setAttribute('width', this.imgWidth);
            var svgHeight = svg.setAttribute('height', this.imgHeight);
            console.log("SVG height: " + svgHeight + ' ' + "SVG width: " + svgWidth )
            var polygonNodeToClone = document.getElementById('PolyID');

            var i=0;
            for(i = 0; i<regions.length; i++){
                var Id = regions[i]._RegionName.value;
                if(document.getElementById(Id) != null){
                    this.updatePolygon(regions[i], document.getElementById(Id))
                }
                else {
                    this.createPolygon(regions[i], polygonNodeToClone, svg)
                }
            }

            polygonNodeToClone.style.display = "none";
        },

        updatePolygon: function(region, node){
            node.style.fill = region._RegionColor.value
        },

        createPolygon: function(region, polygonNodeToClone, svg){
            var polygonNode = polygonNodeToClone.cloneNode(true);
            polygonNode.id = region._RegionName.value;
            polygonNode.setAttribute('points', region._RegionCoordinate.value );
            polygonNode.setAttribute('data-dojo-attach-point', region._RegionName.value);
            polygonNode.style.fill = region._RegionColor.value;
            svg.appendChild(polygonNode);
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
            this._locations = [];
            itemList.forEach(function(item){
                var attributes = item.jsonData.attributes;
                this._locations.push(attributes);
            }, this)

            console.log('Locations: ', this._locations);
            this.addPolygonNodeDynamic(this._locations);
        },


        clickPolygon: function(){
            var same = this;
            document.addEventListener('click', function(e){
                if(e.target.tagName == 'polygon'){
                    same._contextObj.set(same.RegionNameAttribute, e.target.id);
                    same._contextObj.set(same.RegionCoordinatesAttribute, e.target.points);
                    same._contextObj.set(same.RegionColorAttribute, e.target.style.fill);
                    var selectedPolygon = e.target.id;
                    console.log('selected ploygon name', selectedPolygon)
                    same._execMf(same.mfToExecute, same._contextObj.getGuid(), selectedPolygon);
                    
                }     
            })
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function (obj, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = obj;
            this._resetSubscriptions();
            this._updateRendering(callback); // We're passing the callback to updateRendering to be called after DOM-manipulation
            this.setupMapWidget();
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
        resize: function (box) {
          logger.debug(this.id + ".resize");
        },

        // // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function () {
          logger.debug(this.id + ".uninitialize");
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
        },

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
            this.clickPolygon();
            
        },

        _execMf: function (mf, guid, cb, itemName) {
            logger.debug(this.id + "._execMf");
            console.log('Item name', itemName)
            var same = this;
            if (mf) {
                mx.ui.action(mf, {
                    params: {
                        applyto: "selection",
                        guids: [guid]
                    },
                    callback: lang.hitch(this, this.getLocationsFromList),
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
