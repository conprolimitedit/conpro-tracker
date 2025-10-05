'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { FiMapPin, FiSearch, FiChevronDown, FiPlus } from 'react-icons/fi'
import LocationMap from './LocationMap'

const EnhancedLocationSelector = ({ location, onLocationChange }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [countries, setCountries] = useState([])
  const [regions, setRegions] = useState([])
  const [cities, setCities] = useState([])
  const [towns, setTowns] = useState([])
  const [filteredCountries, setFilteredCountries] = useState([])
  const [filteredRegions, setFilteredRegions] = useState([])
  const [filteredCities, setFilteredCities] = useState([])
  const [filteredTowns, setFilteredTowns] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdowns, setShowDropdowns] = useState({
    countries: false,
    regions: false,
    cities: false,
    towns: false
  })
  const [customInputs, setCustomInputs] = useState({
    region: false,
    city: false,
    town: false
  })
  const [customValues, setCustomValues] = useState({
    region: '',
    city: '',
    town: ''
  })

  // Refs for dropdown containers
  const countriesRef = useRef(null)
  const regionsRef = useRef(null)
  const citiesRef = useRef(null)
  const townsRef = useRef(null)
  
  // Refs to track if we've already fetched data
  const fetchedRegionsRef = useRef(false)
  const fetchedCitiesRef = useRef(false)

  // Click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if any dropdown is open
      const isAnyDropdownOpen = Object.values(showDropdowns).some(isOpen => isOpen)
      
      if (!isAnyDropdownOpen) return
      
      // Check if click is outside all dropdown containers
      const isOutsideCountries = !countriesRef.current || !countriesRef.current.contains(event.target)
      const isOutsideRegions = !regionsRef.current || !regionsRef.current.contains(event.target)
      const isOutsideCities = !citiesRef.current || !citiesRef.current.contains(event.target)
      const isOutsideTowns = !townsRef.current || !townsRef.current.contains(event.target)
      
      // If click is outside all dropdowns, close them
      if (isOutsideCountries && isOutsideRegions && isOutsideCities && isOutsideTowns) {
        setShowDropdowns({
          countries: false,
          regions: false,
          cities: false,
          towns: false
        })
      }
    }

    // Keyboard handler to close dropdowns on Escape key
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowDropdowns({
          countries: false,
          regions: false,
          cities: false,
          towns: false
        })
        // Also close any open custom inputs
        setCustomInputs({
          region: false,
          city: false,
          town: false
        })
      }
    }

    // Add event listeners
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showDropdowns])

  // Initialize filtered arrays when data changes
  useEffect(() => {
    setFilteredCountries(countries)
  }, [countries])

  useEffect(() => {
    // Always include current region and "Other (Custom)" option for regions
    const regionsWithCustom = [
      ...regions,
      // Include current region if it exists and is not already in the list
      ...(location.region && !regions.some(region => region.name === location.region) ? [{
        id: regions.length + 1,
        name: location.region,
        country: location.country || 'Unknown',
        type: 'Current Region',
        source: 'Database'
      }] : []),
      {
        id: regions.length + (location.region && !regions.some(region => region.name === location.region) ? 2 : 1),
        name: 'Other (Custom)',
        country: location.country || 'Unknown',
        type: 'Custom Region',
        source: 'Custom'
      }
    ]
    setFilteredRegions(regionsWithCustom)
  }, [regions, location.country, location.region])

  useEffect(() => {
    // Always include "Other (Custom)" option for cities
    // Also include the current city from location if it exists and is not already in the list
    const citiesWithCustom = [
      ...cities,
      ...(location.city && !cities.some(city => city.name === location.city) ? [{
        id: cities.length + 1,
        name: location.city,
        region: location.region || 'Unknown',
        type: 'Current City',
        source: 'Database'
      }] : []),
      {
        id: cities.length + (location.city && !cities.some(city => city.name === location.city) ? 2 : 1),
        name: 'Other (Custom)',
        region: location.region || 'Unknown',
        type: 'Custom City',
        source: 'Custom'
      }
    ]
    setFilteredCities(citiesWithCustom)
  }, [cities, location.region, location.city])

  useEffect(() => {
    // Always include "Other (Custom)" option for towns
    // Also include the current town from location if it exists and is not already in the list
    const townsWithCustom = [
      ...towns,
      ...(location.town && !towns.some(town => town.name === location.town) ? [{
        id: towns.length + 1,
        name: location.town,
        city: location.city || 'Unknown',
        type: 'Current Town',
        source: 'Database'
      }] : []),
      {
        id: towns.length + (location.town && !towns.some(town => town.name === location.town) ? 2 : 1),
        name: 'Other (Custom)',
        city: location.city || 'Unknown',
        type: 'Custom Town',
        source: 'Custom'
      }
    ]
    setFilteredTowns(townsWithCustom)
  }, [towns, location.city, location.town])

  // Initialize with "Other (Custom)" options on component mount
  useEffect(() => {
    // Set initial "Other (Custom)" options so users can add custom fields immediately
    setFilteredRegions([{
      id: 1,
      name: 'Other (Custom)',
      country: 'Unknown',
      type: 'Custom Region',
      source: 'Custom'
    }])
    
    setFilteredCities([{
      id: 1,
      name: 'Other (Custom)',
      region: 'Unknown',
      type: 'Custom City',
      source: 'Custom'
    }])
    
    setFilteredTowns([{
      id: 1,
      name: 'Other (Custom)',
      city: 'Unknown',
      type: 'Custom Town',
      source: 'Custom'
    }])
  }, [])

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (window.searchTimeout) {
        clearTimeout(window.searchTimeout)
      }
    }
  }, [])

    // Get alternative states for specific countries when the main API fails
  const getAlternativeStates = async (countryName) => {
    // Try to fetch from a different API as fallback
    try {
      // Try using the country code instead of name
      const countryCode = await getCountryCode(countryName);
      if (countryCode) {
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}?fields=subregion,region`);
        if (response.ok) {
          const data = await response.json();
          if (data.subregion) {
            const states = [{
              id: 1,
              name: data.subregion,
              country: countryName,
              type: 'Subregion',
              source: 'REST Countries API'
            }];
            
            return states;
          }
        }
      }
    } catch (error) {
      console.log('Alternative API fetch failed:', error);
    }

    return [];
  };

  // Get country code from country name
  const getCountryCode = async (countryName) => {
    try {
      const response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fields=cca2`);
      if (response.ok) {
        const data = await response.json();
        return data[0]?.cca2;
      }
    } catch (error) {
      console.log('Error getting country code:', error);
    }
    return null;
  };

  // Fetch countries from REST Countries API
  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,cca2")
      .then((res) => res.json())
      .then((data) => {
        const sorted = data
          .map((c) => c.name.common)
          .sort((a, b) => a.localeCompare(b));
        setCountries(sorted);
      })
      .catch((error) => {
        console.error('Error fetching countries:', error);
        // Set empty countries if API fails
        setCountries([]);
      });
  }, []);

    // Fetch states (regions) when country changes using countriesnow.space API
  useEffect(() => {
    if (!location.country) return;
    
    // Reset fetch flags when country changes
    fetchedRegionsRef.current = false;
    fetchedCitiesRef.current = false;
    
    setLoading(true);
    
    const fetchStates = async () => {
      try {
        // Try countriesnow.space API
        const response = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: location.country }),
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.data && data.data.states && data.data.states.length > 0) {
            const states = data.data.states;
            
            // Handle both string and object formats from the API
            const processedStates = states.map((state, index) => {
              try {
                // Check if state is an object with name property
                const stateName = typeof state === 'object' && state.name ? state.name : state;
                return {
                  id: index + 1,
                  name: stateName,
                  country: location.country,
                  type: 'State/Region',
                  source: 'API'
                };
              } catch (stateError) {
                return {
                  id: index + 1,
                  name: `State ${index + 1}`,
                  country: location.country,
                  type: 'State/Region',
                  source: 'API'
                };
              }
            }).filter(Boolean);
            
            setRegions(processedStates);
            fetchedRegionsRef.current = true;
            
            // Don't clear existing values - just fetch the regions for dropdown options
            
            return; // Success, exit early
          }
        }
        
        // If countriesnow.space fails, try alternative approach
        // Try to get states from a different source
        const alternativeStates = await getAlternativeStates(location.country);
        if (alternativeStates.length > 0) {
          setRegions(alternativeStates);
          fetchedRegionsRef.current = true;
          
          // Don't clear existing values - just fetch the regions for dropdown options
          
          return;
        }
        
        // No states data available
        setRegions([]);
        
      } catch (error) {
        console.error('Error fetching states:', error);
        
        // Set empty regions if no data available
        setRegions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStates();
  }, [location.country]);

  // Fetch cities when region (state) changes using countriesnow.space API
  useEffect(() => {
    if (!location.region || !location.country) return;
    
    // Reset fetch flag when region changes
    fetchedCitiesRef.current = false;
    
    setLoading(true);
    
    const fetchCities = async () => {
      try {
        const response = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            country: location.country,
            state: location.region,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          const cities = data.data || [];
          
          // Handle both string and object formats from the API
          const processedCities = cities.map((city, index) => {
            try {
              // Check if city is an object with name property
              const cityName = typeof city === 'object' && city.name ? city.name : city;
              return {
                id: index + 1,
                name: cityName,
                region: location.region,
                type: 'City',
                source: 'API'
              };
            } catch (cityError) {
              return {
                id: index + 1,
                name: `City ${index + 1}`,
                region: location.region,
                type: 'City',
                source: 'API'
              };
            }
          }).filter(Boolean); // Remove any undefined entries
          
          setCities(processedCities);
          fetchedCitiesRef.current = true;
          // Don't clear existing values - just fetch the cities for dropdown options
          
        } else {
          setCities([]);
        }
        
      } catch (error) {
        console.error('Error fetching cities:', error);
        // Set empty cities if no data available
        setCities([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCities();
  }, [location.region, location.country]);

  // Fetch towns for a city (placeholder for future API integration)
  const fetchTowns = async (cityName) => {
    try {
      setLoading(true)
      
      // For now, just set empty towns since we don't have a towns API
      // In the future, this could integrate with a towns/neighborhoods API
      setTowns([])
      setFilteredTowns([])
    } catch (error) {
      console.error('Error fetching towns:', error)
      setTowns([])
      setFilteredTowns([])
    } finally {
      setLoading(false)
    }
  }

  // Handle country selection
  const handleCountrySelect = (countryName) => {
    onLocationChange({
      ...location,
      country: countryName,
      region: '',
      city: '',
      town: ''
    })
    setShowDropdowns({ ...showDropdowns, countries: false })
    setCustomInputs({ region: false, city: false, town: false })
    setCustomValues({ region: '', city: '', town: '' })
  }

  // Handle region selection
  const handleRegionSelect = (region) => {
    if (region.name === 'Other (Custom)') {
      setCustomInputs({ ...customInputs, region: true })
      setCustomValues({ ...customValues, region: '' })
      setShowDropdowns({ ...showDropdowns, regions: false })
    } else {
      onLocationChange({
        ...location,
        region: region.name,
        city: '',
        town: ''
      })
      setShowDropdowns({ ...showDropdowns, regions: false })
      setCustomInputs({ city: false, town: false })
    }
  }

  // Handle city selection
  const handleCitySelect = (city) => {
    if (city.name === 'Other (Custom)') {
      setCustomInputs({ ...customInputs, city: true })
      setCustomValues({ ...customValues, city: '' })
      setShowDropdowns({ ...showDropdowns, cities: false })
    } else {
      onLocationChange({
        ...location,
        city: city.name,
        town: ''
      })
      fetchTowns(city.name)
      setShowDropdowns({ ...showDropdowns, cities: false })
      setCustomInputs({ ...customInputs, town: false })
    }
  }

  // Handle town selection
  const handleTownSelect = (town) => {
    if (town.name === 'Other (Custom)') {
      setCustomInputs({ ...customInputs, town: true })
      setCustomValues({ ...customValues, town: '' })
      setShowDropdowns({ ...showDropdowns, towns: false })
    } else {
      onLocationChange({
        ...location,
        town: town.name
      })
      setShowDropdowns({ ...showDropdowns, towns: false })
    }
  }

  // Fetch cities for custom region (placeholder for future API integration)
  const fetchCitiesForCustomRegion = (regionName) => {
    // For now, just set empty cities since we don't have a cities API for custom regions
    // In the future, this could integrate with a cities API
    setCities([])
    setFilteredCities([])
  }

  // Filter locations based on search term
  const filterLocations = (searchTerm) => {
    if (!searchTerm.trim()) {
      // Reset to show all available options
      setFilteredCountries(countries)
      
      // For regions, cities, and towns, always include "Other (Custom)" option
      const regionsWithCustom = [
        ...regions,
        {
          id: regions.length + 1,
          name: 'Other (Custom)',
          country: location.country || 'Unknown',
          type: 'Custom Region',
          source: 'Custom'
        }
      ]
      setFilteredRegions(regionsWithCustom)
      
      const citiesWithCustom = [
        ...cities,
        {
          id: cities.length + 1,
          name: 'Other (Custom)',
          region: location.region || 'Unknown',
          type: 'Custom City',
          source: 'Custom'
        }
      ]
      setFilteredCities(citiesWithCustom)
      
      const townsWithCustom = [
        ...towns,
        {
          id: towns.length + 1,
          name: 'Other (Custom)',
          city: location.city || 'Unknown',
          type: 'Custom Town',
          source: 'Custom'
        }
      ]
      setFilteredTowns(townsWithCustom)
      return
    }

    const term = searchTerm.toLowerCase()
    
    // Filter countries
    if (countries.length > 0) {
      setFilteredCountries(
        countries.filter(country => 
          country.toLowerCase().includes(term)
        )
      )
    }
    
    // Filter regions (including "Other (Custom)")
    const allRegions = [
      ...regions,
      {
        id: regions.length + 1,
        name: 'Other (Custom)',
        country: location.country || 'Unknown',
        type: 'Custom Region',
        source: 'Custom'
      }
    ]
    
    const filteredRegions = allRegions.filter(region => 
      region.name.toLowerCase().includes(term)
    )
    setFilteredRegions(filteredRegions)
    
    // Filter cities (including "Other (Custom)" and current city)
    const allCities = [
      ...cities,
      ...(location.city && !cities.some(city => city.name === location.city) ? [{
        id: cities.length + 1,
        name: location.city,
        region: location.region || 'Unknown',
        type: 'Current City',
        source: 'Database'
      }] : []),
      {
        id: cities.length + (location.city && !cities.some(city => city.name === location.city) ? 2 : 1),
        name: 'Other (Custom)',
        region: location.region || 'Unknown',
        type: 'Custom City',
        source: 'Custom'
      }
    ]
    
    const filteredCities = allCities.filter(city => 
      city.name.toLowerCase().includes(term)
    )
    setFilteredCities(filteredCities)
    
    // Filter towns (including "Other (Custom)" and current town)
    const allTowns = [
      ...towns,
      ...(location.town && !towns.some(town => town.name === location.town) ? [{
        id: towns.length + 1,
        name: location.town,
        city: location.city || 'Unknown',
        type: 'Current Town',
        source: 'Database'
      }] : []),
      {
        id: towns.length + (location.town && !towns.some(town => town.name === location.town) ? 2 : 1),
        name: 'Other (Custom)',
        city: location.city || 'Unknown',
        type: 'Custom Town',
        source: 'Custom'
      }
    ]
    
    const filteredTowns = allTowns.filter(town => 
      town.name.toLowerCase().includes(term)
    )
    setFilteredTowns(filteredTowns)
  }

  // Handle search input change with debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    
    // Clear previous timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout)
    }
    
    // Debounce search to improve performance
    window.searchTimeout = setTimeout(() => {
      filterLocations(value)
    }, 300)
  }

  // Toggle dropdown visibility
  const toggleDropdown = (type) => {
    setShowDropdowns(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  // Get current country name
  const getCurrentCountryName = () => {
    return location.country || 'Select Country'
  }

  // Get current region name
  const getCurrentRegionName = () => {
    return location.region || 'Select Region'
  }

  // Get current city name
  const getCurrentCityName = () => {
    return location.city || 'Select City'
  }

  // Get current town name
  const getCurrentTownName = () => {
    return location.town || 'Select Town'
  }

  // Safety check for rendering text
  const safeRenderText = (text) => {
    if (typeof text === 'string') return text;
    if (typeof text === 'object' && text !== null && text.name) return text.name;
    if (typeof text === 'number') return text.toString();
    return 'Invalid Value';
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search for countries, regions, cities, or towns..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Selected Country Info */}
      {location.country && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <FiMapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Selected: {getCurrentCountryName()}
            </span>
          </div>
        </div>
      )}

      {/* Location Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Country Dropdown */}
        <div className="relative" ref={countriesRef}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Country *
          </label>
          <button
            type="button"
            onClick={() => toggleDropdown('countries')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white flex items-center justify-between"
          >
            <span className={location.country ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
              {getCurrentCountryName()}
            </span>
            <FiChevronDown className="w-4 h-4" />
          </button>
          
          {showDropdowns.countries && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredCountries.map((country, index) => (
                <button
                  key={index}
                  onClick={() => handleCountrySelect(country)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                >
                  {safeRenderText(country)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Region Dropdown */}
        <div className="relative" ref={regionsRef}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Region *
          </label>
          <button
            type="button"
            onClick={() => toggleDropdown('regions')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white flex items-center justify-between"
          >
            <span className={location.region ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
              {getCurrentRegionName()}
            </span>
            <FiChevronDown className="w-4 h-4" />
          </button>
          
          {showDropdowns.regions && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredRegions.length > 0 ? (
                filteredRegions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => handleRegionSelect(region)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{safeRenderText(region.name)}</span>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        {region.type && <span>{safeRenderText(region.type)}</span>}
                        {region.source && (
                          <span className={`px-1 py-0.5 rounded text-xs ${
                            region.source === 'API' ? 'bg-green-100 text-green-800' :
                            region.source === 'Fallback' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {safeRenderText(region.source)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No regions found. Use "Other (Custom)" to add your own.
                </div>
              )}
            </div>
          )}
          
          {/* Region Custom Input - positioned directly under the dropdown */}
          {customInputs.region && (
            <div className="mt-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter custom region/state name"
                  value={customValues.region}
                  onChange={(e) => setCustomValues({ ...customValues, region: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customValues.region.trim()) {
                      onLocationChange({
                        ...location,
                        region: customValues.region.trim(),
                        city: '',
                        town: ''
                      });
                      fetchCitiesForCustomRegion(customValues.region.trim());
                      setCustomInputs({ ...customInputs, region: false });
                    } else if (e.key === 'Escape') {
                      setCustomInputs({ ...customInputs, region: false });
                      setCustomValues({ ...customValues, region: '' });
                    }
                  }}
                  onBlur={() => {
                    if (customValues.region.trim()) {
                      onLocationChange({
                        ...location,
                        region: customValues.region.trim(),
                        city: '',
                        town: ''
                      });
                      fetchCitiesForCustomRegion(customValues.region.trim());
                    }
                    // Don't close on blur - let user click Cancel or press Enter
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomInputs({ ...customInputs, region: false });
                    setCustomValues({ ...customValues, region: '' });
                  }}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* City Dropdown */}
        <div className="relative" ref={citiesRef}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            City *
          </label>
          <button
            type="button"
            onClick={() => toggleDropdown('cities')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white flex items-center justify-between"
          >
            <span className={location.city ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
              {location.city || 'Select City'}
            </span>
            <FiChevronDown className="w-4 h-4" />
          </button>
          
          {showDropdowns.cities && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {/* ALWAYS show current city if it exists */}
              {location.city && (
                <button
                  onClick={() => handleCitySelect({ name: location.city, id: 'current-city' })}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 border-b"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{location.city}</span>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Current City</span>
                      <span className="px-1 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                        Database
                      </span>
                    </div>
                  </div>
                </button>
              )}
              
              {filteredCities.length > 0 ? (
                filteredCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{safeRenderText(city.name)}</span>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        {city.type && <span>{safeRenderText(city.type)}</span>}
                        {city.source && city.source === 'Custom' && (
                          <span className="px-1 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No cities found. Use "Other (Custom)" to add your own.
                </div>
              )}
            </div>
          )}
          
          {/* City Custom Input - positioned directly under the dropdown */}
          {customInputs.city && (
            <div className="mt-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter custom city name"
                  value={customValues.city}
                  onChange={(e) => setCustomValues({ ...customValues, city: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customValues.city.trim()) {
                      onLocationChange({
                        ...location,
                        city: customValues.city.trim(),
                        town: ''
                      });
                      fetchTowns(customValues.city.trim());
                      setCustomInputs({ ...customInputs, city: false });
                    } else if (e.key === 'Escape') {
                      setCustomInputs({ ...customInputs, city: false });
                      setCustomValues({ ...customValues, city: '' });
                    }
                  }}
                  onBlur={() => {
                    if (customValues.city.trim()) {
                      onLocationChange({
                        ...location,
                        city: customValues.city.trim(),
                        town: ''
                      });
                      fetchTowns(customValues.city.trim());
                    }
                    // Don't close on blur - let user click Cancel or press Enter
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomInputs({ ...customInputs, city: false });
                    setCustomValues({ ...customValues, city: '' });
                  }}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Town Dropdown */}
        <div className="relative" ref={townsRef}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Town
          </label>
          <button
            type="button"
            onClick={() => toggleDropdown('towns')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white flex items-center justify-between"
          >
            <span className={location.town ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
              {location.town || 'Select Town'}
            </span>
            <FiChevronDown className="w-4 h-4" />
          </button>
          
          {showDropdowns.towns && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {/* ALWAYS show current town if it exists */}
              {location.town && (
                <button
                  onClick={() => handleTownSelect({ name: location.town, id: 'current-town' })}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 border-b"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{location.town}</span>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Current Town</span>
                      <span className="px-1 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                        Database
                      </span>
                    </div>
                  </div>
                </button>
              )}
              
              {filteredTowns.length > 0 ? (
                filteredTowns.map((town) => (
                  <button
                    key={town.id}
                    onClick={() => handleTownSelect(town)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{safeRenderText(town.name)}</span>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        {town.type && <span>{safeRenderText(town.type)}</span>}
                        {town.population && <span>• {safeRenderText(town.population)}</span>}
                        {town.source && town.source === 'Custom' && (
                          <span className="px-1 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No towns found. Use "Other (Custom)" to add your own.
                </div>
              )}
            </div>
          )}
          
          {/* Town Custom Input - positioned directly under the dropdown */}
          {customInputs.town && (
            <div className="mt-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter custom town name"
                  value={customValues.town}
                  onChange={(e) => setCustomValues({ ...customValues, town: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customValues.town.trim()) {
                      onLocationChange({
                        ...location,
                        town: customValues.town.trim()
                      });
                      setCustomInputs({ ...customInputs, town: false });
                    } else if (e.key === 'Escape') {
                      setCustomInputs({ ...customInputs, town: false });
                      setCustomValues({ ...customValues, town: '' });
                    }
                  }}
                  onBlur={() => {
                    if (customValues.town.trim()) {
                      onLocationChange({
                        ...location,
                        town: customValues.town.trim()
                      });
                    }
                    // Don't close on blur - let user click Cancel or press Enter
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomInputs({ ...customInputs, town: false });
                    setCustomValues({ ...customValues, town: '' });
                  }}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GPS Coordinates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
             Latitude
           </label>
           <input
             type="text"
             placeholder="e.g., 5.5600"
             value={location.gpsCoordinates.lat}
             onChange={(e) => onLocationChange({
               ...location,
               gpsCoordinates: { ...location.gpsCoordinates, lat: e.target.value }
             })}
             className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
           />
         </div>
         <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
             Longitude
           </label>
           <input
             type="text"
             placeholder="e.g., -0.2057"
             value={location.gpsCoordinates.lng}
             onChange={(e) => onLocationChange({
               ...location,
               gpsCoordinates: { ...location.gpsCoordinates, lng: e.target.value }
             })}
             className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
           />
         </div>
       </div>

      {/* Location Map */}
      <LocationMap 
        location={location} 
        onLocationChange={onLocationChange}
        className="mt-6"
      />

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-500">Loading...</span>
        </div>
      )}
    </div>
  )
}

export default EnhancedLocationSelector
