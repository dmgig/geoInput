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
  appendTo, attr, 'background-color', bgColor, bgColorMap, bgcolor, border,
  'border-radius', center, centerOnMarker, centerStore, centerToMarker, clear,
  clearPreferences, click, closest, color, css, cursor, data, display, empty,
  event, extend, fail, float, fn, 'font-family', 'font-size', geoCode,
  geoCodeInput, geoControls, geoInput, geocodeTextLocation, geometry, get,
  getCenter, getElementById, getInputId, getItem, getPosition,
  getStoredMapCenter, getStoredZoom, getZoom, height, hiddenInputs, hide,
  hover, html, i_centerOnMarker, i_geoCode, i_markerToCenter, i_revGeoCode,
  i_togglePrefs, id, initialize, join, lat, latInput, latLngDisplay,
  latLngGoogleToString, latLngStringToGoogle, left, length, lng, lngInput,
  location, log, long_name, map, mapCenter, mapControls, mapOptions, maps,
  margin, 'margin-bottom', marker, markerToCenter, 'min-width', name, on,
  padding, parent_form, position, precision, prefs, prefsPanel, prepend, prop,
  rGeoResults, removeItem, results, revGeoCode, revGeoCodeFoundCount,
  revGeoCodeResultsBody, revGeoCodeResultsHide,
  revGeocodeResultsAddHiddenInputs, revGeocodeResultsMakeRow,
  reverseGeocodeMarkerPosition, rgcHead, rgcTable, rgcTh1, rgcTh2, rgcTr,
  setCenter, setDraggable, setItem, setLatLngInputs, setMap, setPosition,
  short_name, show, slideToggle, spacerLeft, spacerRight, split,
  storeMapCenter, storeMarkerCount, storeZoomLevel, 'text-align', title,
  toFixed, toString, togglePrefs, txtColor, type, types, val,
  validateUniqueElementId, value, watchMarkerMove, width, 'z-index', zoom,
  zoomLevel, zoomStore
*/



(function ($, google, icons) {

  'use strict';

  $.fn.geoInput = function (options) {

    var 
      GI  = this, 
      $GI = $(this),
      $GIid = $GI.attr('id'),
      Helper, 
      Prefs,
      Layout,
      settings;

    GI.map    = null;
    GI.mapOptions = {};
    GI.marker   = new google.maps.Marker();

    /** 
     * HELPERS
     */
    Helper = {
      /**
       * latLng string to to google obj. '0,0'
       */
      latLngStringToGoogle : function (latLngString) {
        var center = latLngString.split(',');
        return new google.maps.LatLng(center[0], center[1]);
      },

      latLngGoogleToString : function (latLngGoogle) {
        return latLngGoogle.lat().toFixed(settings.precision) + ',' + latLngGoogle.lng().toFixed(settings.precision);
      },

      validateUniqueElementId : function (el) {
        return $('#'+$GIid).length === 1 ? true : false;
      }
    };

    /** 
     * SETTINGS
     */
    settings = $.extend({
      apikey       : "<APIKEY>",
      width        : "300px",
      height       : "150px",
      bgColorMap   : "#A3C3FF",
      bgColor      : '#DDD',
      txtColor     : '#000',
      precision    : 6,
      zoomLevel    : 2,
      mapCenter    : '0,0'
    }, options);


    /**
     * PREFERENCES
     */
    Prefs = function(){

      var 
        zoomStoreKey   = 'dmgig_' + $GIid + '_zoomLevel',
        centerStoreKey = 'dmgig_' + $GIid + '_mapCenter';
      
      return {

        storeZoomLevel : function (zoom) {
          sessionStorage.setItem(zoomStoreKey, zoom);
          console.log(sessionStorage);
        },

        storeMapCenter : function (center) {
          sessionStorage.setItem(centerStoreKey, Helper.latLngGoogleToString(center));
          console.log(sessionStorage);
        },

        getStoredZoom : function () {
          var zoom = sessionStorage.getItem(zoomStoreKey);
          if(zoom !== null) zoom = parseInt(zoom);
          console.log(zoom);
          return zoom;
        },

        getStoredMapCenter : function () {
          var center = sessionStorage.getItem(centerStoreKey);
          if(center != null) center = Helper.latLngStringToGoogle(center);
          console.log(center);
          return center;
        },
        
        clearPreferences : function () {
          sessionStorage.removeItem(zoomStoreKey);
          sessionStorage.removeItem(centerStoreKey);
          console.log(sessionStorage);
        }
      }
    }();

    // set prefs options
    settings.mapCenter = Helper.latLngStringToGoogle(settings.mapCenter);
    if (Prefs.getStoredZoom()     ) { settings.zoomLevel = Prefs.getStoredZoom();      }
    if (Prefs.getStoredMapCenter()) { settings.mapCenter = Prefs.getStoredMapCenter(); }

    // wipe
    $GI.empty();

    var Layout = function(){    
      /**
       * layout html */
      var t = {};
      // main template
      t.geoInput     = $('<div/>', { id : 'dmgig_geoInput_' + $GIid });
      t.map          = $('  <div/>', { id : 'dmgig_map_' + $GIid }).appendTo(t.geoInput);
      t.mapControls  = $('  <div/>').appendTo(t.geoInput);
      t.geoControls  = $('  <div/>').appendTo(t.geoInput);
      t.clear        = $('    <div style="clear:both"></div>').appendTo(t.geoControls);
      t.rGeoResults  = $('  <div/>').appendTo(t.geoInput);
      t.rgcTable     = $('    <table>').appendTo(t.rGeoResults);
      t.rgcHead      = $('      <thead>').appendTo(t.rgcTable);
      t.rgcTr        = $('        <tr>').appendTo(t.rgcHead);
      t.rgcTh1       = $('          <th>&nbsp;&nbsp;&nbsp;Result Sets Found:</th>').appendTo(t.rgcTr);
      t.rgcTh2       = $('          <th></th>').appendTo(t.rgcTr);
      $GI.append(t.geoInput); // append main template

      /**
       * CREATE interactive and other elements */
      // display
      t.latLngDisplay     = $('<div/>');
      t.revGeoCodeResultsBody = $('<tbody>');
      t.revGeoCodeFoundCount  = $('<span/>');
      t.prefsPanel      = $('<div/>');
      // buttons
      t.geoCode         = $('<div/>', { title : 'geocode from text' });
      t.revGeoCode      = $('<div/>', { title : 'reverse geocode marker location' });
      t.markerToCenter    = $('<div/>', { title : 'bring marker(s) to center' });
      t.centerOnMarker    = $('<div/>', { title : 'center map on marker(s)' });
      t.revGeoCodeResultsHide = $('<span/>', { title : 'hide results' });
      // prefs buttons
      t.togglePrefs       = $('<div/>', { title : 'toggle preferences' });
      t.storeZoomLevel    = $('<div/>', { title : 'store zoom level' });
      t.storeMapCenter    = $('<div/>', { title : 'store map center' });
      t.storeMarkerCount    = $('<div/>', { title : 'store marker count' });
      t.clearPreferences    = $('<div/>', { title : 'clear data storage' });
      // inputs, and input containers
      t.geoCodeInput      = $('<input/>');
      t.latInput        = $('<input/>', { type : 'hidden', name : 'lat' });
      t.lngInput        = $('<input/>', { type : 'hidden', name : 'lng' });
      t.hiddenInputs      = $('<div/>'); // div to contain hidden inputs from geocoding results
      // other elements
      t.spacerRight       = $('<div/>'); // layout spacers
      t.spacerLeft      = $('<div/>');

      /**
       * ATTACH interactive elements */
      t.mapControls.append(t.latLngDisplay);

      if (settings.apikey !== "<APIKEY>" && settings.apikey !== '') {
        t.geoControls.prepend(t.geoCode,
                    t.geoCodeInput,
                    t.spacerLeft,
                    t.revGeoCode,
                    t.togglePrefs,
                    t.spacerRight,
                    t.markerToCenter,
                    t.centerOnMarker);
      } else {
        t.geoControls.prepend(t.geoCode,
                    t.geoCodeInput,
                    t.spacerLeft,
                    t.togglePrefs,
                    t.spacerRight,
                    t.markerToCenter,
                    t.centerOnMarker);
      }

      t.rgcTh1.prepend(t.revGeoCodeResultsHide);
      t.rgcTh1.append(t.revGeoCodeFoundCount);

      t.rgcTable.append(t.revGeoCodeResultsBody);

      t.rGeoResults.after(t.latInput,
                t.lngInput,
                t.hiddenInputs);

      t.prefsPanel.append(t.storeZoomLevel,
                t.storeMapCenter,
                t.clearPreferences); // todo: t.storeMarkerCount

      t.geoControls.after(t.prefsPanel);

      /**
       * CSS */
      function button(selector, content, float) {
        selector.css({
          'width'       : "16px",
          'height'      : "16px",
          'padding'       : "3px 2px",
          'float'       : float,
          'color'       : settings.color,
          'background-color'  : settings.bgcolor,
          'text-align'    : 'center',
          'cursor'      : 'pointer'
        });
        content = $("<img />")
              .attr("src", content)
              .css({ width: "16px", height: "16px" });
        selector.html(content);
        return selector;
      }

      function prefsButton(selector, content) {
        selector.css({
          'height'      : '16px',
          'padding'       : '1px',
          'margin'      : '1px',
          'color'       : settings.color,
          'background-color'  : settings.bgcolor,
          'font-size'     : '12px',
          'font-family'     : 'console',
          'cursor'      : 'pointer'
        });
        selector.html(content);
        selector.hover(function () {
          selector.css({
            'color' : settings.bgcolor,
            'background-color' : settings.color
          });
        }, function () {
          selector.css({
            'color' : settings.color,
            'background-color' : settings.bgColor
          });
        });
        return selector;
      }

      function spacer(selector, float) {
        selector.css({
          'width'   : '16px',
          'height'  : '16px',
          'padding' : '1px',
          'margin'  : '1px',
          'float'   : float
        });
        return selector;
      }

      t.geoInput.css({
        'font-family': 'Arial',
        'width'    : settings.width,
        'position'   : 'relative',
        'border'   : '1px solid #AAA'
      });

      t.map.css({
        'width'      : settings.width,
        'height'       : settings.height,
        'border'       : '1px solid #CCC',
        'background-color' : settings.bgColor,
        'text-align'     : 'center'
      });
      t.map.html('<br /><br />loading...');

      t.rGeoResults.css({
        'clear'      : 'both',
        'display'      : 'none',
        'left'       : '-1px',
        'width'      : 'calc(' + settings.width + ' - 8px)',
        'background-color' : '#FFF',
        'border'       : '2px solid #CCC',
        'position'     : 'absolute',
        'z-index'      : '5555',
        'text-align'     : 'left',
        'padding'      : '3px'
      });

      t.rgcTable.css({
        'font-size'    : '12px',
        'font-family'    : 'Arial'
      });

      t.prefsPanel
      .append($("<img />").attr("src", icons.gear))
      .css({
        'clear'       : 'both',
        'display'       : 'none',
        'left'        : '-1px',
        'width'       : 'calc(' + settings.width + ' - 2px)',
        'background-color'  : '#DDD',
        'border'      : '2px solid #CCC',
        'position'      : 'absolute',
        'z-index'       : '9999'
      });

      t.latLngDisplay.css({
        'font-family'    : 'monospace',
        'font-size'    : '12px',
        'text-align'     : 'center',
        'background-color' : '#333',
        'color'      : '#FFF',
        'margin-bottom'  : '2px'
      });
      t.latLngDisplay.html('0,0');

      button(t.geoCode,    icons.plane,  'left');
      button(t.revGeoCode,   icons.find,   'left');
      button(t.markerToCenter, icons.center, 'right');
      button(t.centerOnMarker, icons.marker, 'right');
      button(t.togglePrefs,  icons.gear,   'right');

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

      t.storeZoomLevel.on('click', function () { Prefs.storeZoomLevel(GI.map.getZoom()); });
      t.storeMapCenter.on('click', function () { Prefs.storeMapCenter(GI.map.getCenter()); });
      // t.storeMarkerCount.on('click',function () { Prefs.storeMarkerCount() }); // todo
      t.clearPreferences.on('click', function () { Prefs.clearPreferences(); });

      // rev geocode result set actions
      t.revGeoCodeResultsHide.on('click', function () { t.rGeoResults.hide(); });

      t.togglePrefs.click(function () {
        var clicks = $GI.data('clicks');
        if (clicks) {
          t.prefsPanel.slideToggle();
        } else {
          t.prefsPanel.slideToggle();
        }
        $GI.data("clicks", !clicks);
      });
      
      return t;

    }();

    /**
     * MAP INITILIZATION
     */
    GI.initialize = function () {
      GI.mapOptions = {
        zoom : settings.zoomLevel,
        center : settings.mapCenter
      };

      GI.map = new google.maps.Map(document.getElementById('dmgig_map_' + $GIid), GI.mapOptions);

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
      Layout.hiddenInputs.empty(); // clear out the rev geocode inputs, just in case they exist
    });

    /**
     * sets the hidden lat/lng inputs with the current marker position, and updates the lat/lng display as well. */
    GI.setLatLngInputs = function () {

      var latLng, s_latLng;

      latLng = GI.marker.getPosition();
      s_latLng = latLng.lat().toFixed(settings.precision) + ',' + latLng.lng().toFixed(settings.precision);
      Layout.latLngDisplay.html(s_latLng);
      Layout.latInput.val(latLng.lat().toFixed(settings.precision));
      Layout.lngInput.val(latLng.lng().toFixed(settings.precision));
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
     * attempts geocode a location based on user input in the geocode search field. 
     * If successful, the map is centered on the lat/lng 
     */
    GI.geocodeTextLocation = function () {

      var uriEncodedLocation, center_to, search_input;

      search_input = Layout.geoCodeInput.val();
      uriEncodedLocation = encodeURIComponent(Layout.geoCodeInput.val());
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
     * reverse geocodes based on marker position, displays the results, if any, 
     * in a table below the input display 
     */
    GI.reverseGeocodeMarkerPosition = function () {

      var host, params = [], url, latLng, s_latLng, uriEncodedLatLng;

      latLng = GI.marker.getPosition();
      s_latLng = latLng.lat().toString() + ',' + latLng.lng().toString();
      uriEncodedLatLng = encodeURIComponent(s_latLng);

      host = 'https://maps.googleapis.com/maps/api/geocode/json';
      params.push('latlng=' + uriEncodedLatLng);
      params.push('location_type=ROOFTOP');
      params.push('result_type=street_address');
      params.push('key=' + settings.apikey);
      url = host + '?' + params.join('&');

      $.get(url, function (data) {
        var components, i;

        Layout.hiddenInputs.empty();
        Layout.revGeoCodeResultsBody.empty();
        Layout.revGeoCodeFoundCount.html(data.results.length);
        Layout.rGeoResults.show();
        if (data.results.length === 0) { return; }

        components = data.results[0].address_components;
        for (i in components) {
          $(GI.revGeocodeResultsMakeRow(components[i].long_name, components[i].types))
            .appendTo(Layout.revGeoCodeResultsBody);
          $(GI.revGeocodeResultsAddHiddenInputs(components[i].short_name, components[i].types));
        }

      }).fail(function () { alert('Failed to reverse geocode ' + s_latLng); });
    };

    /**
     *  creates table row for with long_name and type */
    GI.revGeocodeResultsMakeRow = function (long_name, types) {
      return $('<tr><td><b>' + long_name + '</b> <i>' + types.join(', ') + '</i></td><td>&square;</td></tr>');
    };

    /**
     * appends hidden input to parent div, uses first type element as name, value with short name */
    GI.revGeocodeResultsAddHiddenInputs = function (short_name, types) {
      $('<input/>', { type : "hidden", name : types[0], value : short_name }).appendTo(Layout.hiddenInputs);
    };

    /**
     * PARENT FORM CONTROL
     *
     * on submit, disable the extra inputs so they aren't serialized into the form data. 
     * because disabled elements in some browsers won't respond to jQuery, we just wait for the serialization to happen
     * and then re-enable the fields
     */
    GI.parent_form = $GI.closest('form');
    GI.parent_form.on('submit', function () {
      Layout.geoCodeInput.prop('disabled', true); // disable the search input so it doesn't appear in results
      setTimeout(function () { // re-enable the search_input field after serialize has executed
        Layout.geoCodeInput.prop('disabled', false);
      }, 300);
      return false;
    });

    /** INITIALIZE */

    if (!Helper.validateUniqueElementId($GI)) {
      console.log('geoInput Err: input elements require unique ids.');
      return false;
    }
    console.log(settings.apikey)
    GI.initialize();

  };

}(jQuery, google, dmgig_icons));
