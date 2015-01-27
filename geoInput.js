/**
 * geoInput
 * 
 * add location details to html forms. lat, lng, text. 
 *
 * requires google maps v3 api code. 
 *
 * @author   Dave M. Giglio <dave.m.giglio@gmail.com>
 */

/*
The MIT License (MIT)

    Copyright (c) 2015 Dave M. Giglio <dave.m.giglio@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*global google: true, jQuery: true */
/*jslint browser: true, todo: true, devel: true */
/*properties
    LatLng, Map, Marker, addListener, address_components, after, apikey, append,
    appendTo, 'background-color', bgColor, bgColorMap, bgcolor, border,
    'border-radius', center, centerOnMarker, centerToMarker, clear,
    clearPreferences, click, closest, color, css, cursor, data, display,
    dmgig_mapCenter, dmgig_zoomLevel, empty, event, extend, fail, float, fn,
    'font-family', 'font-size', geoCode, geoCodeInput, geoControls, geoInput,
    geocodeTextLocation, geometry, get, getCenter, getElementById, getItem,
    getMapId, getPosition, getStoredMapCenter, getStoredZoom, getZoom, height,
    hiddenInputs, hide, hover, html, id, initialize, join, lat, latInput,
    latLngDisplay, latLngGoogleToString, latLngStringToGoogle, left, length, lng,
    lngInput, location, log, long_name, map, mapCenter, mapControls, mapOptions,
    mapid, maps, margin, 'margin-bottom', marker, markerToCenter, name, on,
    padding, parent_form, position, precision, prefs, prefsPanel, prepend, prop,
    rGeoControls, rGeoResults, random, removeItem, results, revGeoCode,
    revGeoCodeFoundCount, revGeoCodeResultsBody, revGeoCodeResultsHide,
    revGeocodeResultsAddHiddenInputs, revGeocodeResultsMakeRow,
    reverseGeocodeMarkerPosition, rgcHead, rgcTable, rgcTh1, rgcTh2, rgcTr,
    rgctHead, setCenter, setDraggable, setLatLngInputs, setMap, setPosition,
    short_name, show, slideToggle, spacer, split, storeMapCenter,
    storeMarkerCount, storeZoomLevel, substring, 'text-align', title, toFixed,
    toString, togglePrefs, txtColor, type, types, val, value, watchMarkerMove,
    width, 'z-index', zoom, zoomLevel
*/


(function ($) {

    'use strict';

    $.fn.geoInput = function (options) {

        var GI, helper, settings, t;

        GI = this;

        GI.map        = null;
        GI.mapOptions = {};
        GI.marker     = new google.maps.Marker();

        settings = $.extend({
            apikey           : "<APIKEY>",
            width            : "300px",
            height           : "150px",
            bgColorMap       : "#A3C3FF",
            bgColor          : '#DDD',
            txtColor         : '#000',
            precision        : 6,
            zoomLevel        : 2,
            mapCenter        : '0,0',
            i_geoCode        : '&#9992;',
            i_revGeoCode     : '&#9873;?',
            i_markerToCenter : '&#9873;',
            i_centerOnMarker : '&#x2750;',
            i_togglePrefs    : '&#9881;'
        }, options);

        /** 
         * HELPERS
         */
        helper = {

            /**
             * google maps requires a distinct id, so if someone wants more than one on a page, we'll need to generate random id
             */
            getMapId : function () {
                return 'dmgig_' + (Math.random() + 1).toString(36).substring(2, 7);
            },

            /**
             * latLng string to to google obj. '0,0'
             */
            latLngStringToGoogle : function (latLngString) {
                var center;
                center = latLngString.split(',');
                return new google.maps.LatLng(center[0], center[1]);
            },

            latLngGoogleToString : function (latLngGoogle) {
                return latLngGoogle.lat().toFixed(settings.precision) + ',' + latLngGoogle.lng().toFixed(settings.precision);
            }
        };

        /**
         * PREFERENCES
         */
        GI.prefs = {

            storeZoomLevel : function () {
                sessionStorage.dmgig_zoomLevel = GI.map.getZoom();
                console.log(sessionStorage);
            },

            storeMapCenter : function () {
                sessionStorage.dmgig_mapCenter = helper.latLngGoogleToString(GI.map.getCenter());
                console.log(sessionStorage);
            },

            //storeMarkerCount : function () {}, // todo

            getStoredZoom : function () {
                return parseInt(sessionStorage.dmgig_zoomLevel, 10);
            },

            getStoredMapCenter : function () {
                return helper.latLngStringToGoogle(sessionStorage.dmgig_mapCenter);
            },

            //getMarkerCount : function () {}, // todo

            clearPreferences : function () {
                sessionStorage.removeItem('dmgig_zoomLevel');
                sessionStorage.removeItem('dmgig_mapCenter');
                sessionStorage.removeItem('dmgig_markerCount');
                console.log(sessionStorage);
            }
        };

        // set prefs options
        settings.mapCenter = helper.latLngStringToGoogle(settings.mapCenter);
        if (sessionStorage.getItem('dmgig_zoomLevel') !== null) { settings.zoomLevel = GI.prefs.getStoredZoom(); }
        if (sessionStorage.getItem('dmgig_mapCenter') !== null) { settings.mapCenter = GI.prefs.getStoredMapCenter(); }

        // wipe
        this.empty();

        /**
         * layout html */
        t = {};
        // main template
        t.mapid = helper.getMapId();

        t.geoInput     = $('<div/>', { id : 'dmgig_geoInput' });
        t.map          = $('    <div/>', { id : t.mapid }).appendTo(t.geoInput);
        t.mapControls  = $('    <div/>').appendTo(t.geoInput);
        t.geoControls  = $('    <div/>').appendTo(t.geoInput);
        t.clear        = $('        <div style="clear:both"></div>').appendTo(t.geoControls);
        t.rGeoResults  = $('    <div/>').appendTo(t.geoInput);
        t.rgcTable     = $('        <table>').appendTo(t.rGeoResults);
        t.rgcHead      = $('            <thead>').appendTo(t.rgcTable);
        t.rgcTr        = $('                <tr>').appendTo(t.rgcHead);
        t.rgcTh1       = $('                    <th>&nbsp;&nbsp;&nbsp;Result Sets Found:</th>').appendTo(t.rgcTr);
        t.rgcTh2       = $('                    <th></th>').appendTo(t.rgcTr);
        this.append(t.geoInput); // append main template

        /**
         * CREATE interactive and other elements */
        // display
        t.latLngDisplay         = $('<div/>');
        t.revGeoCodeResultsBody = $('<tbody>');
        t.revGeoCodeFoundCount  = $('<span/>');
        t.prefsPanel            = $('<div/>');
        // buttons
        t.geoCode               = $('<div/>', { title : 'geocode from text' });
        t.revGeoCode            = $('<div/>', { title : 'reverse geocode marker location' });
        t.markerToCenter        = $('<div/>', { title : 'bring marker(s) to center' });
        t.centerOnMarker        = $('<div/>', { title : 'center map on marker(s)' });
        t.revGeoCodeResultsHide = $('<span/>', { title : 'hide results' });
        // prefs buttons
        t.togglePrefs           = $('<div/>', { title : 'toggle preferences' });
        t.storeZoomLevel        = $('<div/>', { title : 'store zoom level' });
        t.storeMapCenter        = $('<div/>', { title : 'store map center' });
        t.storeMarkerCount      = $('<div/>', { title : 'store marker count' });
        t.clearPreferences      = $('<div/>', { title : 'clear data storage' });
        // inputs, and input containers
        t.geoCodeInput          = $('<input/>');
        t.latInput              = $('<input/>', { type : 'hidden', name : 'lat' });
        t.lngInput              = $('<input/>', { type : 'hidden', name : 'lng' });
        t.hiddenInputs          = $('<div/>'); // div to contain hidden inputs from geocoding results
        // other elements
        t.spacerRight           = $('<div/>'); // layout spacers
        t.spacerLeft            = $('<div/>');

        /**
         * ATTACH interactive elements */
        $(t.mapControls).append(t.latLngDisplay);

        $(t.geoControls).prepend(t.geoCode, t.geoCodeInput, t.spacerLeft, t.revGeoCode, t.togglePrefs, t.spacerRight, t.markerToCenter, t.centerOnMarker);

        $(t.rgcTh1).prepend(t.revGeoCodeResultsHide);
        $(t.rgcTh1).append(t.revGeoCodeFoundCount);

        $(t.rgcTable).append(t.revGeoCodeResultsBody);
        $(t.rGeoResults).after(t.latInput, t.lngInput, t.hiddenInputs);

        t.prefsPanel.append(t.storeZoomLevel, t.storeMapCenter, t.clearPreferences); // todo: t.storeMarkerCount
        $(t.geoControls).after(t.prefsPanel);

        /**
         * CSS */
        function button(selector, content, float) {
            selector.css({
                'float'             : float,
                'height'            : '12px',
                'min-width'         : '12px',
                'padding'           : '1px',
                'margin'            : '1px',
                'border'            : '1px solid #999',
                'border-radius'     : '4px',
                'color'             : settings.color,
                'background-color'  : settings.bgcolor,
                'text-align'        : 'center',
                'font-size'         : '12px',
                'font-family'       : 'console',
                'cursor'            : 'pointer'
            });
            selector.html(content);
            selector.hover(function () {
                $(this).css({
                    'color' : settings.bgcolor,
                    'background-color' : settings.color
                });
            }, function () {
                $(this).css({
                    'color' : settings.color,
                    'background-color' : settings.bgColor
                });
            });
            return selector;
        }

        function prefsButton(selector, content) {
            selector.css({
                'height'            : '12px',
                'padding'           : '1px',
                'margin'            : '1px',
                'border'            : '1px solid #999',
                'border-radius'     : '4px',
                'color'             : settings.color,
                'background-color'  : settings.bgcolor,
                'font-size'         : '12px',
                'font-family'       : 'console',
                'cursor'            : 'pointer'
            });
            selector.html(content);
            selector.hover(function () {
                $(this).css({
                    'color' : settings.bgcolor,
                    'background-color' : settings.color
                });
            }, function () {
                $(this).css({
                    'color' : settings.color,
                    'background-color' : settings.bgColor
                });
            });
            return selector;
        }

        function spacer(selector, float) {
            selector.css({
                'width'   : '12px',
                'height'  : '12px',
                'padding' : '1px',
                'margin'  : '1px',
                'float'   : float
            });
            return selector;
        }


        t.geoInput.css({
            'width'    : settings.width,
            'position' : 'relative',
            'border'   : '1px solid #AAA'
        });

        t.map.css({
            'width'            : settings.width,
            'height'           : settings.height,
            'border'           : '1px solid #CCC',
            'background-color' : settings.bgColor,
            'text-align'       : 'center'
        });
        t.map.html('<br /><br />loading...');

        t.rGeoResults.css({
            'clear'            : 'both',
            'display'          : 'none',
            'left'             : '-1px',
            'width'            : 'calc(' + settings.width + ' - 8px)',
            'background-color' : '#FFF',
            'border'           : '2px solid #CCC',
            'position'         : 'absolute',
            'z-index'          : '5555',
            'text-align'       : 'left',
            'padding'          : '3px'
        });
        
        t.rgcTable.css({
            'font-size'        : '12px',
            'font-family'      : 'Arial'
        });        

        t.prefsPanel.css({
            'clear'             : 'both',
            'display'           : 'none',
            'left'              : '-1px',
            'width'             : 'calc(' + settings.width + ' - 2px)',
            'background-color'  : '#DDD',
            'border'            : '2px solid #CCC',
            'position'          : 'absolute',
            'z-index'           : '9999'
        });

        t.latLngDisplay.css({
            'font-size'        : '12px',
            'text-align'       : 'center',
            'background-color' : '#666',
            'color'            : '#FFF',
            'margin-bottom'    : '2px'
        });
        t.latLngDisplay.html('0,0');

        button(t.geoCode, settings.i_geoCode, 'left');
        button(t.revGeoCode, settings.i_revGeoCode, 'left');
        button(t.markerToCenter, settings.i_markerToCenter, 'right');
        button(t.centerOnMarker, settings.i_centerOnMarker, 'right');
        button(t.togglePrefs, settings.i_togglePrefs, 'right');

        t.revGeoCodeResultsHide.html('&times;').css('cursor', 'pointer');

        prefsButton(t.storeZoomLevel, 'store zoom level');
        prefsButton(t.storeMapCenter, 'store map center position');
        prefsButton(t.storeMarkerCount, 'store markers count');
        prefsButton(t.clearPreferences, 'clear storage data');

        t.geoCodeInput.css({ 'float' : 'left' });

        // other elements
        spacer(t.spacerRight, 'right');
        spacer(t.spacerLeft, 'left');

        /**
         * attach events
         */
        t.geoCode.on('click', function () {
            GI.geocodeTextLocation();
        });

        t.revGeoCode.on('click', function () {
            GI.reverseGeocodeMarkerPosition();
        });

        t.centerOnMarker.on('click', function () {
            GI.centerToMarker();
        });

        t.markerToCenter.on('click', function () {
            GI.markerToCenter();
        });

        t.storeZoomLevel.on('click', function () { GI.prefs.storeZoomLevel(); });
        t.storeMapCenter.on('click', function () { GI.prefs.storeMapCenter(); });
        // t.storeMarkerCount.on('click',function () { GI.prefs.storeMarkerCount() }); // todo
        t.clearPreferences.on('click', function () { GI.prefs.clearPreferences(); });

        // rev geocode result set actions
        t.revGeoCodeResultsHide.on('click', function () { t.rGeoResults.hide(); });

        t.togglePrefs.click(function () {
            var clicks = $(this).data('clicks');
            if (clicks) {
                t.prefsPanel.slideToggle();
            } else {
                t.prefsPanel.slideToggle();
            }
            $(this).data("clicks", !clicks);
        });

        /**
         * MAP INITILIZATION
         */
        this.initialize = function () {
            GI.mapOptions = {
                zoom : settings.zoomLevel,
                center : settings.mapCenter
            };

            GI.map = new google.maps.Map(document.getElementById(t.mapid), GI.mapOptions);

            GI.marker.setPosition(settings.mapCenter);
            GI.marker.setMap(GI.map);
            GI.marker.setDraggable(true);

            GI.setLatLngInputs();
        };

        /**
         * MARKER FUNCTIONS
         */

        /**
         * marker event listener - drag end */
        GI.watchMarkerMove = google.maps.event.addListener(GI.marker, 'dragend', function () {
            GI.setLatLngInputs();
            t.hiddenInputs.empty(); // clear out the rev geocode inputs, just in case they exist
        });

        /**
         * sets the hidden lat/lng inputs with the current marker position, and updates the lat/lng display as well. */
        GI.setLatLngInputs = function () {

            var latLng, s_latLng;

            latLng = GI.marker.getPosition();
            s_latLng = latLng.lat().toFixed(settings.precision) + ',' + latLng.lng().toFixed(settings.precision);
            t.latLngDisplay.html(s_latLng);
            t.latInput.val(latLng.lat().toFixed(settings.precision));
            t.lngInput.val(latLng.lng().toFixed(settings.precision));
        };

        /**
         * sets the map center to the current marker position */
        GI.centerToMarker = function () {
            GI.map.setCenter(GI.marker.getPosition());
            GI.setLatLngInputs();
        };

        /**
         * sets the marker position to the map center */
        GI.markerToCenter = function () {
            GI.marker.setPosition(GI.map.getCenter());
            GI.setLatLngInputs();
        };

        /**
         * GEOCODE FUNCTIONS
         */

        /**
         * attempts geocode a location based on user input in the geocode search field. If successful, the map is centered on the lat/lng */
        GI.geocodeTextLocation = function () {

            var uriEncodedLocation, center_to, search_input;

            search_input = t.geoCodeInput.val();
            uriEncodedLocation = encodeURIComponent(t.geoCodeInput.val());
            $.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + uriEncodedLocation, function (data) {
                center_to = new google.maps.LatLng(data.results[0].geometry.location.lat, data.results[0].geometry.location.lng);
                GI.map.setCenter(center_to);
                GI.markerToCenter();
            }).fail(function () { alert('Failed to geocode ' + search_input); });
        };

        /**
         * REVERSE GEOCODE FUNCTIONS
         */

        /**
         * reverse geocodes based on marker position, displays the results, if any, in a table below the input display */
        GI.reverseGeocodeMarkerPosition = function () {

            var latLng, s_latLng, uriEncodedLatLng;

            latLng = GI.marker.getPosition();
            s_latLng = latLng.lat().toString() + ',' + latLng.lng().toString();
            uriEncodedLatLng = encodeURIComponent(s_latLng);

            $.get('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + uriEncodedLatLng + '&location_type=ROOFTOP&result_type=street_address&key=' + settings.apikey, function (data) {

                var components, i;

                t.hiddenInputs.empty();
                t.revGeoCodeResultsBody.empty();
                t.revGeoCodeFoundCount.html(data.results.length);
                t.rGeoResults.show();
                if (data.results.length === 0) { return; }

                components = data.results[0].address_components;
                for (i in components) {
                    $(GI.revGeocodeResultsMakeRow(components[i].long_name, components[i].types)).appendTo(t.revGeoCodeResultsBody);
                    $(GI.revGeocodeResultsAddHiddenInputs(components[i].short_name, components[i].types));
                }

            }).fail(function () { alert('Failed to reverse geocode ' + s_latLng); });
        };

        /**
         *  creates table row for with long_name and type */
        this.revGeocodeResultsMakeRow = function (long_name, types) {
            return $('<tr><td><b>' + long_name + '</b> <i>' + types.join(', ') + '</i></td><td>&square;</td></tr>');
        };

        /**
         * appends hidden input to parent div, uses first type element as name, value with short name */
        this.revGeocodeResultsAddHiddenInputs = function (short_name, types) {
            $('<input/>', { type : "hidden", name : types[0], value : short_name }).appendTo(t.hiddenInputs);
        };

        /**
         * PARENT FORM CONTROL
         *
         * on submit, disable the extra inputs so they aren't serialized into the form data. 
         * because disabled elements in some browsers won't respond to jQuery, we just wait for the serialization to happen
         * and then re-enable the fields
         */
        GI.parent_form = $(this).closest('form');
        GI.parent_form.on('submit', function () {
            t.geoCodeInput.prop('disabled', true); // disable the search input so it doesn't appear in results
            setTimeout(function () { // re-enable the search_input field after serialize has executed
                t.geoCodeInput.prop('disabled', false);
            }, 300);
            return false;
        });

        /** INITIALIZE */
        this.initialize();

    };

}(jQuery));
