# GeoInput jQuery Plugin
### latitude, longitude input type with world map
Geolocation input type for html forms. jQuery plugin. Requires on Google Maps v3 API and, for reverse geocoding, an API key.

[**DEMO**](http://dmgig.com/geoInput/)

A "geolocation" type input for html forms. Provides Google Map and marker. Adds hidden lat/lng fields containing marker postion.

User to provide location as text input. This will be geocoded and marker placed at user specified point. Alternately, the user may drag the marker to the desired location, and then reverse geocode based on marker position.

Creates hidden inputs for lat and lng at all times based on marker position. If reverse geocoding has occurred, creates hidden inputs for each returned address_component.

[code review @ codereview.stackexchange.com] (http://codereview.stackexchange.com/questions/78463/geoinput-jquery-plugin)

*Input shown inside demo html form*

![geoinput screencap](/geoinput_screencap.png)

*Reverse Geocode*

![geoinput during reverse geocode screencap](/geoinput_revgeo_screencap.png)

#### Change Log

_8/10/16_ Refactor
* add svg icons
* code refactor
* add npm, gulp

_1/27/15_ New Features
* Multiple maps
* UI adjusts dependent on apikey being used

_1/22/15_ New Features!
* Control panel for session storage of zoom and map center
* Update icons and buttons
* Cleaner, clearer code
