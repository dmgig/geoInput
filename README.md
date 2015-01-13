# geoInput
Geolocation input type for html forms. jQuery plugin. Requires on Google Maps v3 API.

A "geolocation" type input for html forms. Provides Google Map and marker. Adds hidden lat/lng fields containing marker postion.

User to provide location as text input. This will be geocoded and marker placed at user specified point. Alternately, the user may drag the marker to the desired location, and then reverse geocode based on marker position.

Creates hidden inputs for lat and lng at all times based on marker position. If reverse geocoding has occurred, creates hidden inputs for each returned address_component.
