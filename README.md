# geoInput
Geolocation input type for html forms. jQuery plugin. Requires on Google Maps v3 API and, for reverse geocoding, an API key.

1/22/15 - New Features!
* Control panel for session storage of zoom and map center
* Update icons and buttons
* Cleaner, clearer code

[geoInput](http://dmgig.com/geoInput/)

[code review] (http://codereview.stackexchange.com/questions/78463/geoinput-jquery-plugin)

A "geolocation" type input for html forms. Provides Google Map and marker. Adds hidden lat/lng fields containing marker postion.

User to provide location as text input. This will be geocoded and marker placed at user specified point. Alternately, the user may drag the marker to the desired location, and then reverse geocode based on marker position.

Creates hidden inputs for lat and lng at all times based on marker position. If reverse geocoding has occurred, creates hidden inputs for each returned address_component.

![alt tag](http://dmgig.com/geoInput/geoInput.png?12345)
