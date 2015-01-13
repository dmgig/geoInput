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
		
		this.GMapsAPI = '<API_KEY>';
	  
		this.map;
		this.mapOptions;
		this.mapCenter = new google.maps.LatLng(0,0);
		this.marker    = new google.maps.Marker();
	  
		var settings = $.extend({
			// basic settings
			width : "300px",
			height : "150px",
			bgColor : "#A3C3FF",
			precision : 6,
			zoom : 2,
			// feature settings
			geocode_feature : true,
			rev_geocode_feature : true,
			marker_controls : true,
			latlng_display : true
		}, options );

		// wipe
		this.empty();
	  
		/** generate UI elements */
	  
	  	// set border and width for container
		this.css("border","1px solid #000")
			.css("width",settings.width)
			.css("position","relative");
	  	
	  	// make map div
		this.gmap = $('<div/>',{
			id : "gmap",
			text : "loading..."
		}).css("width",settings.width)
		  .css("height",settings.height)
		  .css("background-color",settings.bgColor)
		  .appendTo(this);
		  
		// map info div
		this.mapInfoAndControls = $('<div/>', { "name" : "mapInfoAndControls" }).css("color","#000").css("font-size","10px").appendTo(this);
		$('<div/>').css('clear','both').appendTo(this);	
	  	
	  	// add text search box for geocoding
	  	if(settings.geocode_feature)
	  	{
			this.search_input = $('<input/>',{
				type : "text", name : "dmgig_search"
			}).appendTo(this);			
			
			this.geocode_button = $('<input/>',{
				type : "button", name : "geocode", value : "FIND"
			}).appendTo(this);
	  	}
	  	
	  	// reverse geocoder feature
	  	if(settings.rev_geocode_feature)
	  	{
			this.rgeocode_button = $('<input/>',{
				type : "button", name : "rgeocode", value : "RGEO"
			}).appendTo(this);
		}	  
		
		// marker controls ( center map on marker and bring marker to center )	  
	  	if(settings.marker_controls)
	  	{
			// center map on marker 
			this.c2m_button = $('<div/>',{ // center to marker
				name : "c2m", value : "C2M"
			}).css('cursor','pointer')
			  .css('float','right')
			  .css('padding','2px')
			  .css('background-color','#CCC')
			  .css('border','1px solid #AAA')
			  .html('c&rarr;m')
			  .appendTo(this.mapInfoAndControls);
	  	
	  		// move marker to center of map
			this.m2c_button = $('<span/>',{ // marker to center
				name : "m2c", value : "M2C"
			}).css('cursor','pointer')
			  .css('float','right')
			  .css('padding','2px')
			  .css('background-color','#CCC')
			  .css('border','1px solid #AAA')
			  .html('m&rarr;c')
			  .appendTo(this.mapInfoAndControls);		  
		}
		
		// latitude and longitude
		this.lat = $('<input/>',{ type : "hidden", name : "lat" }).appendTo(this);		  
		this.lng = $('<input/>',{ type : "hidden", name : "lng" }).appendTo(this);
		if(settings.latlng_display)
			this.latLngDisplay = $('<div/>').css('float','right').css('padding','3px').appendTo(this.mapInfoAndControls);		
	  
	  	// reverse geocode result display
	  	if(settings.rev_geocode_feature)
	  	{	
	  		// create and elements
	  		this.revGeocodeResults         = $('<div/>'); // results div
	  		this.revGeocodeResultSetsPrev  = $('<span></span>'); // next set button
	  		this.revGeocodeResultSetsNext  = $('<span></span>'); // prev set button
	  		this.revGeocodeResultSetsClose = $('<span></span>'); // close button
	  		this.revGeocodeResultSetsFound = $('<span/>'); // results span
	  		this.revGeocodeResultsTable    = $('<table/>');
	  		this.revGeocodeResultsTbody    = $('<tbody/>'); // results body
	  		
	  		this.revGeocodeResultsTable.append('<thead><tr><th></th><th></th></tr></thead>');
	  		this.revGeocodeResultsTable.find('thead tr th:first').append(this.revGeocodeResultSetsClose);
	  		this.revGeocodeResultsTable.find('thead tr th:first').append('&nbsp;&nbsp;Result Sets Found: ');
	  		this.revGeocodeResultsTable.find('thead tr th:first').append(this.revGeocodeResultSetsFound);
	  		
	  		this.revGeocodeResultsTable.append(this.revGeocodeResultsTbody);
	  		this.revGeocodeResults.append(this.revGeocodeResultsTable);
	  		this.append(this.revGeocodeResults); 		
	  			  		
	  		// style elements
	  		this.revGeocodeResultSetsPrev.html('&#10094;').css('cursor','pointer');  // next set button
	  		this.revGeocodeResultSetsNext.html('&#10095;').css('cursor','pointer');  // prev set button
	  		this.revGeocodeResultSetsClose.html('&times;').css('cursor','pointer'); // close button
	  			  		
	  		this.revGeocodeResults.css('display','none')
	  							  .css('z-index','9999')
	  							  .css('border','1px solid #000')
	  							  .css('position','absolute')
	  							  .css('width',settings.width)
	  							  .css('top',this.offset())
	  							  .css('left','-1px');
	  							  
	  		this.revGeocodeResultsTable.css('width','100%')
	  		 						   .css('font-size','11px')
	  		 						   .css('background-color','#FFF');
	  		 						   
	  		// helper functions
	  		
	  		/**
	  		 *  creates table row for with long_name and type
	  		 */
	  		this.revGeocodeResultsMakeRow = function(long_name,types){
	  			return $('<tr><td><b>'+long_name+'</b> <i>'+types.join(', ')+'</i></td><td>&square;</td></tr>');
	  		}
	  		
	  		/**
	  		 * appends hidden input to parent div, uses first type element as name, value with short name
	  		 */ 
	  		this.revGeocodeResultsAddHiddenInputs = function(short_name,types){
	  			return $('<input/>',{ type : "hidden", name : types[0], value : short_name });
	  		}	  		
	  		
	  		// rev geocode result set actions
	  		this.revGeocodeResultSetsClose.on('click',function(){ GI.revGeocodeResults.hide(); });
	  	}

		/** map functions */
	  
		this.initialize = function() {
			
			GI.mapOptions = {
				zoom: settings.zoom,
				center:GI.mapCenter 
			};

			GI.map = new google.maps.Map(gmap,GI.mapOptions);
		  
			GI.marker.setPosition(GI.mapCenter);
			GI.marker.setMap(GI.map);
			GI.marker.setDraggable(true);
		  
			GI.setLatLngInputs();			   
		}

		/**
		 * marker event listener - drag end
		 */		
		this.watchMarkerMove = google.maps.event.addListener(GI.marker, 'dragend', function() {
			GI.setLatLngInputs();
		});

		/**
		 * attempts geocode a location based on user input in the geocode search field. If successful, the map is centered on the lat/lng  
		 */		
		this.geocodeTextLocation = function()
		{
			var search_input = GI.search_input.val();
			var uriEncodedLocation = encodeURIComponent(search_input);
			$.get('https://maps.googleapis.com/maps/api/geocode/json?address='+uriEncodedLocation,function(data){
				var center_to = new google.maps.LatLng( data.results[0].geometry.location.lat, data.results[0].geometry.location.lng );
				GI.map.setCenter(center_to);
				GI.markerToCenter();
			})
			.fail( function(){ alert('Failed to geocode '+search_input) } );
		}

		/**
		 * reverse geocodes based on marker position, displays the results, if any, in a table below the input display
		 */  		
		this.reverseGeocodeMarkerPosition = function()
		{	
			var latLng = GI.marker.getPosition();
			var s_latLng = latLng.lat().toString()+','+latLng.lng().toString();
			var uriEncodedLatLng = encodeURIComponent(s_latLng);
			$.get('https://maps.googleapis.com/maps/api/geocode/json?latlng='+uriEncodedLatLng+'&location_type=ROOFTOP&result_type=street_address&key='+GI.GMapsAPI,function(data){
				GI.revGeocodeResultsTbody.empty();
				GI.revGeocodeResults.show();
				GI.revGeocodeResultSetsFound.html(data.results.length);
				if( data.results.length === 0 ) return;
				var components = data.results[0].address_components;
				for(i in components){
					$(GI.revGeocodeResultsMakeRow(components[i].long_name,components[i].types)).appendTo(GI.revGeocodeResultsTable);
					$(GI.revGeocodeResultsAddHiddenInputs(components[i].short_name,components[i].types)).appendTo(GI);
				}
			})
			.fail( function(){ alert('Failed to reverse geocode '+s_latLng) } );
		}			

		/**
		 * sets the hidden lat/lng inputs with the current marker position, and updates the lat/lng display as well.
		 */  	  
		this.setLatLngInputs = function()
		{	
			var latLng = GI.marker.getPosition();
			var s_latLng = latLng.lat().toFixed(settings.precision)+','+latLng.lng().toFixed(settings.precision);
			GI.latLngDisplay.html(s_latLng);
			GI.lat.val(latLng.lat().toFixed(settings.precision));
			GI.lng.val(latLng.lng().toFixed(settings.precision));
		}
		
		/**
		 * sets the map center to the current marker position
		 */
		this.centerToMarker = function()
		{
			GI.map.setCenter(GI.marker.getPosition());
			GI.setLatLngInputs();
		}

		/**
		 * sets the marker position to the map center
		 */  
		this.markerToCenter = function(){
			GI.marker.setPosition(GI.map.getCenter());
			GI.setLatLngInputs();
		}
		
		/** form control */
		
		this.parent_form = $(this).closest('form');

		/**
		 * on submit, disable the extra inputs so they aren't serialized into the form data. 
		 * because disabled elements in some browsers won't respond to jQuery, we just wait for the serialization to happen
		 * and then re-enable the fields
		 */  	  
		this.parent_form.on('submit',function()
		{
			GI.search_input.prop('disabled',true); // disable the search input so it doesn't appear in results
			setTimeout(function() { // re-enable the search_input field after serialize has executed
				GI.search_input.prop('disabled',false);
			},300);
			return false;
		});				
		
		/** UI */
		
		this.geocode_button.on('click',function()
		{
			GI.geocodeTextLocation();
		});
	  
		this.rgeocode_button.on('click',function()
		{
			GI.reverseGeocodeMarkerPosition();
		});	
	  
		this.c2m_button.on('click',function()
		{
			GI.centerToMarker();
		});

		this.m2c_button.on('click',function()
		{
			GI.markerToCenter();
		});
	  
		/** init */
	  
		this.initialize();
	}
		
}( jQuery ));
