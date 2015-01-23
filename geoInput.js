/**
 * geoInput
 * 
 * add location details to html forms. lat, lng, text. 
 *
 * requires google maps v3 api code. 
 *
 * @author   Dave M. Giglio <dave.m.giglio@gmail.com>
 */

(function ( $ ) {

	$.fn.geoInput = function( options ) {

		GI = this;

		/**
		 * PREFERENCES
		 */		
		GI.prefs = {
			
			storeZoomLevel : function(){
				sessionStorage.dmgig_zoomLevel = GI.map.getZoom();
				console.log(sessionStorage);
			},
			
			storeMapCenter : function(){
				sessionStorage.dmgig_mapCenter = helper.latLngGoogleToString(GI.map.getCenter());
				console.log(sessionStorage);
			},
			
			storeMarkerCount : function(){}, // todo
			
			getStoredZoom : function(){
				return parseInt(sessionStorage.dmgig_zoomLevel);
			},
			
			getStoredMapCenter : function(){
				return helper.latLngStringToGoogle(sessionStorage.dmgig_mapCenter);
			},
			
			getMarkerCount : function(){}, // todo
			
			clearPreferences : function(){
				sessionStorage.removeItem('dmgig_zoomLevel');
				sessionStorage.removeItem('dmgig_mapCenter');
				sessionStorage.removeItem('dmgig_markerCount');
				console.log(sessionStorage);		
			}			
		}
		
		/** 
		 * HELPERS
		 */
		helper = {
			/**
			 * latLng string to to google obj. '0,0'
			 */
			latLngStringToGoogle : function(latLngString){
				var s_center = latLngString;
				var center = s_center.split(',');
				return new google.maps.LatLng(center[0],center[1]);
			},
			
			latLngGoogleToString : function(latLngGoogle){
				console.log(latLngGoogle);
				var s_center = latLngGoogle.lat().toFixed(settings.precision)+','+latLngGoogle.lng().toFixed(settings.precision);
				return s_center;		
			}
		}
		 
	  
		this.map;
		this.mapOptions;
		this.marker    = new google.maps.Marker();
	  
		var settings = $.extend({
			apikey : "<APIKEY>",
			width : "300px",
			height : "150px",
			bgColor : "#A3C3FF",
			precision : 6,
			zoomLevel : 2,
			zoom: '',
			mapCenter : '0,0'
		}, options );

		// set prefs options
		settings.mapCenter = helper.latLngStringToGoogle(settings.mapCenter);
 		if( sessionStorage.getItem('dmgig_zoomLevel') !== null ) settings.zoomLevel = GI.prefs.getStoredZoom();
		if( sessionStorage.getItem('dmgig_mapCenter') !== null ) settings.mapCenter = GI.prefs.getStoredMapCenter();
		
		// wipe
		this.empty();
		
		/**
		 * layout html */
		t = {};
		// main template
		t.main = [];
		t.main.push('<div id="dmgig_main">');
		t.main.push('	<div id="dmgig_map"></div>');
		t.main.push('	<div id="dmgig_mapInfoAndControls"></div>');
		t.main.push('	<div id="dmgig_geoCodingControls">');
		t.main.push('		<div style="clear:both"></div>');		
		t.main.push('	</div>');
		t.main.push('	<div id="dmgig_revGeoCodeResults">');
		t.main.push('		<table>');
		t.main.push('			<thead>');
		t.main.push('				<tr>');
		t.main.push('					<th id="dmgig_revGeoCodeResultsTh">&nbsp;&nbsp;&nbsp;Result Sets Found:</th>');
		t.main.push('					<th></th>');
		t.main.push('				</tr>');
		t.main.push('			</thead>');
		t.main.push('		</table>');
		t.main.push('	</div>');
		t.main.push('</div>');
		t.main = $(t.main.join("\n"));
		this.append(t.main); // append main template
	
		/**
		 * CREATE interactive and other elements */
		// display
		t.latLngDisplay         = $('<div/>', {});
		t.revGeoCodeResultsBody = $('<tbody>', {});
		t.revGeoCodeFoundCount  = $('<span/>', {});
		t.prefsPanel            = $('<div/>', {});
		// buttons
		t.geoCode               = $('<div/>', { title : 'geocode from text' });
		t.revGeoCode            = $('<div/>', { title : 'reverse geocode marker location' });
		t.markerToCenter        = $('<div/>', { title : 'bring marker(s) to center' });
		t.centerOnMarker        = $('<div/>', { title : 'center map on marker(s)' });		
		t.revGeoCodeResultsHide = $('<span/>', { title : 'hide results' });
		// prefs buttons
		t.togglePrefs        = $('<div/>', { title : 'toggle preferences' });
		t.storeZoomLevel     = $('<div/>', { title : 'store zoom level' });
		t.storeMapCenter     = $('<div/>', { title : 'store map center' });
		t.storeMarkerCount   = $('<div/>', { title : 'store marker count' });	
		t.clearPreferences   = $('<div/>', { title : 'clear data storage' });						
		// inputs, and input containers
		t.geoCodeInput       = $('<input/>', {});
		t.latInput           = $('<input/>', { type : 'hidden', name : 'lat' });
		t.lngInput           = $('<input/>', { type : 'hidden', name : 'lng' });
		t.hiddenInputs       = $('<div/>', {}); // div to contain hidden inputs from geocoding results
		// other elements
		t.spacer             = $('<div/>', {}); // layout spacer

		/**
		 * ATTACH interactive elements */
		$("#dmgig_mapInfoAndControls").append( t.latLngDisplay );
		
		$("#dmgig_geoCodingControls").prepend( t.geoCode, t.geoCodeInput, t.revGeoCode, t.togglePrefs, t.spacer, t.markerToCenter, t.centerOnMarker );
		
		$("#dmgig_revGeoCodeResultsTh").prepend( t.revGeoCodeResultsHide );
		$("#dmgig_revGeoCodeResultsTh").append( t.revGeoCodeFoundCount );
		
		$("#dmgig_revGeoCodeResults").append( t.revGeoCodeResultsBody );
		$("#dmgig_revGeoCodeResults").after( t.latInput, t.lngInput, t.hiddenInputs );
		
		t.prefsPanel.append( t.storeZoomLevel, t.storeMapCenter, t.clearPreferences ); // todo: t.storeMarkerCount
		$("#dmgig_main").find("#dmgig_geoCodingControls").after(t.prefsPanel);

		/**
		 * CSS */
		var color = '#000';
		var bgcolor = '#DDD';
		
		function button(selector,content,float)
		{				
			selector.css('float',float)
					.css('height','12px')
					.css('width','12px')
					.css('padding','1px')
					.css('margin','1px')
					.css('border','1px solid #999')
					.css('border-radius','4px')
					.css('color',color)
					.css('background-color',bgcolor)
					.css('text-align','center')
					.css('font-size','12px')
					.css('font-family','console')
					.css('cursor','pointer')
					.html(content)
					.hover(function(){
						$(this).css('color',bgcolor)
						       .css('background-color',color);
					},function(){
						$(this).css('color',color)
						       .css('background-color',bgcolor);					
					});
			return selector;
		}
		
		function prefsButton(selector,content)
		{				
			selector.css('height','12px')
					.css('padding','1px')
					.css('margin','1px')
					.css('border','1px solid #999')
					.css('border-radius','4px')
					.css('color',color)
					.css('background-color',bgcolor)
					.css('text-align','center')
					.css('font-size','12px')
					.css('font-family','console')
					.css('cursor','pointer')
					.html(content)
					.hover(function(){
						$(this).css('color',bgcolor)
						       .css('background-color',color);
					},function(){
						$(this).css('color',color)
						       .css('background-color',bgcolor);					
					});
			return selector;
		}		
		
		$("#dmgig_main").css('width',settings.width)
						.css('position','relative')
						.css('border','1px solid #AAA');
		
		$("#dmgig_map").css('width',settings.width)
			 		   .css('height',settings.height)
					   .css('border','1px solid #CCC')
			 		   .css('background-color',settings.bgColor)
			 		   .css('text-align','center')
			 	       .html('<br /><br />loading...');
		
		$("#dmgig_revGeoCodeResults").css('clear','both')
									 .css('display','none')
							    	 .css('left','-1px')
									 .css('width','calc('+settings.width+' - 8px)')
									 .css('background-color','#FFF')
									 .css('border','2px solid #CCC')
									 .css('position','absolute')
									 .css('z-index','5555')
									 .css('font-size','12px')
									 .css('font-family','Arial')
									 .css('padding','3px');
		
		t.prefsPanel.css('clear','both')
					.css('display','none')
					.css('left','-1px')
					.css('width','calc('+settings.width+' - 2px)')
					.css('background-color','#DDD')
					.css('border','2px solid #CCC')
					.css('position','absolute')
					.css('z-index','9999');
		
		t.latLngDisplay.css('font-size','12px')
					   .css('text-align','center')
					   .css('background-color',color)
					   .css('color',bgcolor)
					   .css('margin-bottom','2px')
					   .html('0,0');
		
		button(t.geoCode,'&#9992;','left');
		button(t.revGeoCode,'?','left');
		button(t.markerToCenter,'&#9873;','right');
		button(t.centerOnMarker,'&#x2750;','right');
		button(t.togglePrefs,'&#9881;','right');
		t.revGeoCodeResultsHide.html('&times;').css('cursor','pointer');
		
		prefsButton(t.storeZoomLevel,'store zoom level');
		prefsButton(t.storeMapCenter,'store map center position');
		prefsButton(t.storeMarkerCount,'store markers count');
		prefsButton(t.clearPreferences,'clear storage data');
		
		t.geoCodeInput.css('float','left');
		
		// other elements
		t.spacer.css('width','12px').css('height','12px').css('padding','1px').css('margin','1px').css('float','right');

		/**
		 * attach events
		 */
		t.geoCode.on('click',function(){
			GI.geocodeTextLocation();
		});
	  
		t.revGeoCode.on('click',function(){
			GI.reverseGeocodeMarkerPosition();
		});	
	  
		t.centerOnMarker.on('click',function(){
			GI.centerToMarker();
		});

		t.markerToCenter.on('click',function(){
			GI.markerToCenter();
		});
		
		t.storeZoomLevel.on('click',function(){ GI.prefs.storeZoomLevel() });
		t.storeMapCenter.on('click',function(){ GI.prefs.storeMapCenter() });
		// t.storeMarkerCount.on('click',function(){ GI.prefs.storeMarkerCount() }); // todo
		t.clearPreferences.on('click',function(){ GI.prefs.clearPreferences() });

		// rev geocode result set actions
		t.revGeoCodeResultsHide.on('click',function(){ $("#dmgig_revGeoCodeResults").hide(); });

		t.togglePrefs.click(function() {
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
		this.initialize = function() 
		{	
			GI.mapOptions = {
				zoom : settings.zoomLevel,
				center : settings.mapCenter 
			};
					
			GI.map = new google.maps.Map(dmgig_map,GI.mapOptions);
		  
			GI.marker.setPosition(settings.mapCenter);
			GI.marker.setMap(GI.map);
			GI.marker.setDraggable(true);
		  
			GI.setLatLngInputs();			   
		}

		/**
		 * MARKER FUNCTIONS
		 */
		
		/**
		 * marker event listener - drag end */		
		GI.watchMarkerMove = google.maps.event.addListener(GI.marker, 'dragend', function() {
			GI.setLatLngInputs();
			t.hiddenInputs.empty(); // clear out the rev geocode inputs, just in case they exist
		});

		/**
		 * sets the hidden lat/lng inputs with the current marker position, and updates the lat/lng display as well. */  	  
		GI.setLatLngInputs = function()
		{	
			var latLng = GI.marker.getPosition();
			var s_latLng = latLng.lat().toFixed(settings.precision)+','+latLng.lng().toFixed(settings.precision);
			t.latLngDisplay.html(s_latLng);
			t.latInput.val(latLng.lat().toFixed(settings.precision));
			t.lngInput.val(latLng.lng().toFixed(settings.precision));
		}
		
		/**
		 * sets the map center to the current marker position */
		GI.centerToMarker = function(){
			GI.map.setCenter(GI.marker.getPosition());
			GI.setLatLngInputs();
		}

		/**
		 * sets the marker position to the map center */  
		GI.markerToCenter = function(){
			GI.marker.setPosition(GI.map.getCenter());
			GI.setLatLngInputs();
		}

		/**
		 * GEOCODE FUNCTIONS
		 */

		/**
		 * attempts geocode a location based on user input in the geocode search field. If successful, the map is centered on the lat/lng */		
		GI.geocodeTextLocation = function()
		{
			var search_input = t.geoCodeInput.val();
			var uriEncodedLocation = encodeURIComponent(search_input);
			$.get('https://maps.googleapis.com/maps/api/geocode/json?address='+uriEncodedLocation,function(data){
				
				console.log(data);
				
				var center_to = new google.maps.LatLng( data.results[0].geometry.location.lat, data.results[0].geometry.location.lng );
				GI.map.setCenter(center_to);
				GI.markerToCenter();
			})
			.fail( function(){ alert('Failed to geocode '+search_input) } );
		}

		/**
		 * REVERSE GEOCODE FUNCTIONS
		 */

		/**
		 * reverse geocodes based on marker position, displays the results, if any, in a table below the input display */  		
		GI.reverseGeocodeMarkerPosition = function()
		{	
			var latLng = GI.marker.getPosition();
			var s_latLng = latLng.lat().toString()+','+latLng.lng().toString();
			var uriEncodedLatLng = encodeURIComponent(s_latLng);
			$.get('https://maps.googleapis.com/maps/api/geocode/json?latlng='+uriEncodedLatLng+'&location_type=ROOFTOP&result_type=street_address&key='+settings.apikey,function(data){
				
				console.log(data);
				
				t.hiddenInputs.empty();
				t.revGeoCodeResultsBody.empty();
				t.revGeoCodeFoundCount.html(data.results.length);
				$('#dmgig_revGeoCodeResults').show();
				if( data.results.length === 0 ) return;
				var components = data.results[0].address_components;
				for(i in components){
					$(GI.revGeocodeResultsMakeRow(components[i].long_name,components[i].types)).appendTo(t.revGeoCodeResultsBody);
					$(GI.revGeocodeResultsAddHiddenInputs(components[i].short_name,components[i].types));
				}
			})
			.fail( function(){ alert('Failed to reverse geocode '+s_latLng) } );
		}
		
		/**
		 *  creates table row for with long_name and type */
		this.revGeocodeResultsMakeRow = function(long_name,types){
			return $('<tr><td><b>'+long_name+'</b> <i>'+types.join(', ')+'</i></td><td>&square;</td></tr>');
		}
		
		/**
		 * appends hidden input to parent div, uses first type element as name, value with short name */
		this.revGeocodeResultsAddHiddenInputs = function(short_name,types){
			$('<input/>',{ type : "hidden", name : types[0], value : short_name }).appendTo( t.hiddenInputs );
		}	
		
		/**
		 * PARENT FORM CONTROL
         *
		 * on submit, disable the extra inputs so they aren't serialized into the form data. 
		 * because disabled elements in some browsers won't respond to jQuery, we just wait for the serialization to happen
		 * and then re-enable the fields
		 */  	  
		GI.parent_form = $(this).closest('form');
		GI.parent_form.on('submit',function()
		{
			t.geoCodeInput.prop('disabled',true); // disable the search input so it doesn't appear in results
			setTimeout(function() { // re-enable the search_input field after serialize has executed
				t.geoCodeInput.prop('disabled',false);
			},300);
			return false;
		});

		/** INITIALIZE */
		this.initialize();

	}
	
}( jQuery ));
