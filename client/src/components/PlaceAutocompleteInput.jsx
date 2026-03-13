import { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '../services/googleMaps';

function PlaceAutocompleteInput({
  id,
  label,
  value,
  placeholder,
  onChange,
  onPlaceSelected,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const onPlaceSelectedRef = useRef(onPlaceSelected);

  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  useEffect(() => {
    let autocomplete;
    let listener;
    let isMounted = true;

    loadGoogleMaps()
      .then((google) => {
        if (!isMounted || !inputRef.current) {
          return;
        }

        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry', 'name', 'place_id'],
          componentRestrictions: { country: 'us' },
        });

        listener = autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          const location = place.geometry?.location;

          if (!location) {
            return;
          }

          onPlaceSelectedRef.current?.({
            label: place.formatted_address || place.name || '',
            placeId: place.place_id || null,
            lat: location.lat(),
            lng: location.lng(),
          });
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      if (listener) {
        window.google?.maps?.event?.removeListener(listener);
      }
    };
  }, []);

  return (
    <label className="nyc-field" htmlFor={id}>
      <span className="nyc-field-label">{label}</span>
      <input
        id={id}
        ref={inputRef}
        className="nyc-input"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </label>
  );
}

export default PlaceAutocompleteInput;
