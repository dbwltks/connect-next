"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import { Label } from "./label";

interface AddressAutocompleteProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string, address?: {
    street_address: string;
    address_detail?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    country?: string;
  }) => void;
  required?: boolean;
}

export function AddressAutocomplete({
  id,
  name,
  label,
  value,
  onChange,
  required = false,
}: AddressAutocompleteProps) {
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Google Maps API 스크립트 로드
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initServices;
      document.head.appendChild(script);

      console.log("Google Maps API 스크립트 로드 중...");
    } else {
      initServices();
    }

    function initServices() {
      if (window.google) {
        autocompleteService.current = new google.maps.places.AutocompleteService();
        if (!mapRef.current) {
          mapRef.current = document.createElement("div");
        }
        placesService.current = new google.maps.places.PlacesService(mapRef.current);
      }
    }
  }, []);

  useEffect(() => {
    // 입력값이 변경될 때 자동완성 결과 가져오기
    const fetchPredictions = async () => {
      if (!value || value.length < 3 || !autocompleteService.current) {
        setPredictions([]);
        return;
      }

      setIsLoading(true);
      try {
        autocompleteService.current.getPlacePredictions(
          {
            input: value,
            componentRestrictions: { country: "ca" }, // 캐나다로 제한
            types: ["address"],
          },
          (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              setPredictions(predictions);
              setShowDropdown(true);
            } else {
              setPredictions([]);
            }
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error("주소 검색 중 오류 발생:", error);
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchPredictions();
    }, 300);

    return () => clearTimeout(debounce);
  }, [value]);

  const handlePredictionClick = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["address_components", "formatted_address"],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          // 주소 컴포넌트 파싱
          const addressComponents = place.address_components || [];
          
          const streetNumber = addressComponents.find(c => c.types.includes("street_number"))?.long_name || "";
          const route = addressComponents.find(c => c.types.includes("route"))?.long_name || "";
          const city = addressComponents.find(c => c.types.includes("locality"))?.long_name || "";
          const province = addressComponents.find(c => c.types.includes("administrative_area_level_1"))?.long_name || "";
          const postalCode = addressComponents.find(c => c.types.includes("postal_code"))?.long_name || "";
          const country = addressComponents.find(c => c.types.includes("country"))?.long_name || "Canada";

          // 도로명 주소 구성
          const streetAddress = `${streetNumber} ${route}`.trim();
          
          // 부모 컴포넌트에 전체 주소 정보 전달
          onChange(place.formatted_address || prediction.description, {
            street_address: streetAddress,
            city,
            province,
            postal_code: postalCode,
            country,
          });
        } else {
          onChange(prediction.description);
        }
        
        setPredictions([]);
        setShowDropdown(false);
      }
    );
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete="off"
      />
      
      {/* 로딩 인디케이터 */}
      {isLoading && (
        <div className="absolute right-3 top-9">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      )}
      
      {/* 자동완성 드롭다운 */}
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-10 w-full bg-white shadow-lg rounded-md border border-gray-200 mt-1 max-h-60 overflow-auto">
          {predictions.map((prediction: any) => (
            <div
              key={prediction.place_id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handlePredictionClick(prediction)}
            >
              {prediction.description}
            </div>
          ))}
        </div>
      )}
      
      {/* 숨겨진 맵 참조 */}
      <div ref={mapRef} className="hidden" />
    </div>
  );
}
