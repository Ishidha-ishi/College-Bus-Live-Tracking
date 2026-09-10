import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { CAMPUS_CENTER } from '../data/mockData';
import { 
  Navigation, Play, Pause, FastForward, Users, Clock, 
  MapPin, AlertCircle, Layers, ZoomIn, ZoomOut, CheckCircle2 
} from 'lucide-react';

export const MapView: React.FC<{
  heightClass?: string;
  showControls?: boolean;
  focusedBusId?: string | null;
  onBusClick?: (busId: string) => void;
}> = ({ 
  heightClass = 'h-[500px]', 
  showControls = true, 
  focusedBusId,
  onBusClick 
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const busMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const routePolylinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const stopMarkersRef = useRef<L.Marker[]>([]);
  const campusMarkerRef = useRef<L.Marker | null>(null);

  const { 
    buses, 
    routes, 
    activeRouteId, 
    setActiveRouteId, 
    selectedBusId, 
    setSelectedBusId,
    isSimulating,
    setIsSimulating,
    simSpeed,
    setSimSpeed,
    currentUser
  } = useApp();

  const [showStops, setShowStops] = useState(true);

  // Initialize Map with Salem, Tamil Nadu Center
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center in Salem metropolitan corridor (connecting New Bus Stand, 5 Roads, Suramangalam & Karuppur Campus)
    const map = L.map(mapContainerRef.current, {
      center: [11.6850, 78.1250],
      zoom: 12.5,
      zoomControl: false,
    });

    // CartoDB Voyager clean vector-style raster tiles (reliable, fast, high contrast)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Add Salem Campus Destination Portico Landmark Marker
    const campusIcon = L.divIcon({
      html: `
        <div class="relative flex flex-col items-center">
          <div class="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white shadow-xl flex items-center justify-center text-white ring-4 ring-indigo-500/30">
            <span class="text-sm">🏛️</span>
          </div>
          <div class="px-2 py-0.5 mt-1 rounded bg-slate-900 border border-slate-700 text-[9px] font-extrabold text-amber-400 whitespace-nowrap shadow-lg">
            SALEM CAMPUS
          </div>
        </div>
      `,
      className: 'custom-campus-marker',
      iconSize: [80, 50],
      iconAnchor: [40, 20],
    });

    const campusMarker = L.marker([CAMPUS_CENTER.lat, CAMPUS_CENTER.lng], { icon: campusIcon }).addTo(map);
    campusMarker.bindPopup(`
      <div class="p-1.5 space-y-1">
        <h4 class="font-bold text-xs text-white">🏛️ Salem University Campus</h4>
        <p class="text-[11px] text-slate-300">Karuppur / NH-44 Salem-Bangalore Highway</p>
        <p class="text-[10px] text-emerald-400 font-semibold">Destination Terminal for all SLM Routes</p>
      </div>
    `);
    campusMarkerRef.current = campusMarker;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Routes (Polylines)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old polylines
    routePolylinesRef.current.forEach(line => line.remove());
    routePolylinesRef.current.clear();

    routes.forEach(route => {
      const isSelected = activeRouteId === route.id || activeRouteId === 'all';
      const polyline = L.polyline(route.pathCoordinates, {
        color: route.color,
        weight: isSelected ? 6 : 3,
        opacity: isSelected ? 0.9 : 0.35,
        dashArray: isSelected ? undefined : '5, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polyline.on('click', () => {
        setActiveRouteId(route.id);
        const bus = buses.find(b => b.routeId === route.id);
        if (bus) setSelectedBusId(bus.id);
      });

      routePolylinesRef.current.set(route.id, polyline);
    });
  }, [routes, activeRouteId, setActiveRouteId, buses, setSelectedBusId]);

  // Render Stops
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    stopMarkersRef.current.forEach(m => m.remove());
    stopMarkersRef.current = [];

    if (!showStops) return;

    routes.forEach(route => {
      if (activeRouteId !== 'all' && activeRouteId !== route.id) return;

      route.stops.forEach((stop, index) => {
        const isUserStop = currentUser.assignedStopId === stop.id;

        const stopHtml = `
          <div class="relative flex items-center justify-center">
            <div class="w-6 h-6 rounded-full ${isUserStop ? 'bg-amber-400 ring-4 ring-amber-400/30' : 'bg-slate-900 border-2 border-white'} shadow-md flex items-center justify-center text-[10px] font-bold ${isUserStop ? 'text-slate-950' : 'text-white'}">
              ${index + 1}
            </div>
            ${isUserStop ? '<div class="absolute -top-6 px-1.5 py-0.5 rounded bg-amber-500 text-[9px] font-extrabold text-slate-950 whitespace-nowrap shadow">MY STOP</div>' : ''}
          </div>
        `;

        const icon = L.divIcon({
          html: stopHtml,
          className: 'custom-stop-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div class="p-1 space-y-1">
            <div class="flex items-center gap-1.5 text-xs font-bold text-white">
              <span class="w-2 h-2 rounded-full" style="background:${route.color}"></span>
              ${stop.name}
            </div>
            <p class="text-[11px] text-slate-300">${stop.landmark}</p>
            <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700">
              <span>Scheduled: <b class="text-white">${stop.scheduledTime}</b></span>
              <span>Waiting: <b class="text-amber-400">${stop.studentCountWaiting} pax</b></span>
            </div>
          </div>
        `);

        stopMarkersRef.current.push(marker);
      });
    });
  }, [routes, activeRouteId, showStops, currentUser]);

  // Render & Update Live Buses
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    buses.forEach(bus => {
      const route = routes.find(r => r.id === bus.routeId);
      const isDelayed = bus.delayMinutes > 0;
      const isSelected = selectedBusId === bus.id;

      let marker = busMarkersRef.current.get(bus.id);

      const busHtml = `
        <div class="relative cursor-pointer transition-transform duration-300">
          <div class="relative flex flex-col items-center">
            <!-- Pulsing Halo for active buses -->
            <div class="absolute -inset-2 rounded-full ${isDelayed ? 'bg-rose-500/30' : 'bg-emerald-500/30'} ${isSimulating ? 'animate-ping' : ''} opacity-75"></div>
            
            <!-- Main Bus Pill -->
            <div class="relative z-10 flex items-center gap-1 px-2.5 py-1 rounded-full shadow-2xl border ${
              isSelected 
                ? 'bg-amber-500 text-slate-950 border-white ring-4 ring-amber-500/40 font-bold scale-110' 
                : isDelayed
                  ? 'bg-rose-600 text-white border-rose-400'
                  : 'bg-slate-900 text-white border-slate-700'
            } transition-all">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.6 19.1 6 18 6H4c-1.1 0-2.1.6-2.4 1.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/><circle cx="7" cy="18" r="2"/><circle cx="15" cy="18" r="2"/>
              </svg>
              <span class="text-[11px] whitespace-nowrap font-bold">${bus.busNumber.split(' ')[1] || bus.busNumber}</span>
              <span class="text-[9px] px-1 rounded ${isDelayed ? 'bg-rose-800 text-white' : 'bg-slate-800 text-emerald-400 font-mono'}">
                ${bus.speed}k
              </span>
            </div>

            <!-- Delay Badge -->
            ${isDelayed ? `
              <div class="absolute -bottom-4 px-1.5 py-0.2 rounded bg-rose-500 text-white font-extrabold text-[9px] whitespace-nowrap shadow-md flex items-center gap-0.5">
                +${bus.delayMinutes}m DELAY
              </div>
            ` : ''}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: busHtml,
        className: 'custom-bus-marker',
        iconSize: [70, 36],
        iconAnchor: [35, 18],
      });

      if (!marker) {
        marker = L.marker([bus.currentLat, bus.currentLng], { icon }).addTo(map);

        marker.on('click', () => {
          setSelectedBusId(bus.id);
          setActiveRouteId(bus.routeId);
          if (onBusClick) onBusClick(bus.id);
        });

        busMarkersRef.current.set(bus.id, marker);
      } else {
        marker.setLatLng([bus.currentLat, bus.currentLng]);
        marker.setIcon(icon);
      }

      // Popup details
      marker.bindPopup(`
        <div class="p-2 space-y-2 min-w-[200px]">
          <div class="flex items-center justify-between border-b border-slate-700 pb-1.5">
            <div>
              <h4 class="font-bold text-sm text-white">${bus.busNumber}</h4>
              <p class="text-[11px] text-slate-400">${bus.plateNumber}</p>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              isDelayed ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
            }">
              ${isDelayed ? `+${bus.delayMinutes}m Delayed` : 'On Time'}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div>
              <p class="text-[10px] text-slate-400">Driver</p>
              <p class="font-semibold text-white">${bus.driverName}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400">Live Speed</p>
              <p class="font-semibold text-amber-400">${bus.speed} km/h</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400">Occupancy</p>
              <p class="font-semibold text-white">${bus.currentOccupancy} / ${bus.capacity} seats</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400">Next Stop ETA</p>
              <p class="font-semibold text-emerald-400">~${bus.estimatedNextStopMins} mins</p>
            </div>
          </div>

          ${bus.delayReason ? `
            <div class="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300">
              <b>Delay note:</b> ${bus.delayReason}
            </div>
          ` : ''}

          <div class="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
            <span>Route: <b class="text-white">${route?.code || 'Campus'}</b></span>
            <span>AC: <b class="${bus.isAc ? 'text-sky-400' : 'text-slate-400'}">${bus.isAc ? 'Active' : 'Standard'}</b></span>
          </div>
        </div>
      `);
    });
  }, [buses, routes, selectedBusId, isSimulating, setSelectedBusId, setActiveRouteId, onBusClick]);

  // Center on focused bus if requested
  const focusOnBus = useCallback((busId: string) => {
    const bus = buses.find(b => b.id === busId);
    const map = mapInstanceRef.current;
    if (bus && map) {
      map.flyTo([bus.currentLat, bus.currentLng], 15, { animate: true, duration: 1.2 });
      setSelectedBusId(bus.id);
      setActiveRouteId(bus.routeId);
    }
  }, [buses, setSelectedBusId, setActiveRouteId]);

  useEffect(() => {
    if (focusedBusId) {
      focusOnBus(focusedBusId);
    }
  }, [focusedBusId, focusOnBus]);

  // Zoom controls helper
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  // Reset to full overview (Salem City & Campus Corridor)
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([11.6850, 78.1250], 12.5);
  };

  const selectedBus = buses.find(b => b.id === selectedBusId);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Interactive Leaflet Map DOM Element */}
      <div ref={mapContainerRef} className={`w-full ${heightClass} z-0`} />

      {/* Floating Header Overlay: Route Selector & Live Info */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Route switcher pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl pointer-events-auto overflow-x-auto max-w-full">
          <button
            id="map-filter-all"
            onClick={() => setActiveRouteId('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              activeRouteId === 'all'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Lines
          </button>
          {routes.map(r => (
            <button
              key={r.id}
              id={`map-filter-${r.id}`}
              onClick={() => {
                setActiveRouteId(r.id);
                const bus = buses.find(b => b.routeId === r.id);
                if (bus) setSelectedBusId(bus.id);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                activeRouteId === r.id
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
              <span>{r.code}</span>
            </button>
          ))}
        </div>

        {/* Selected Bus Quick Status Chip */}
        {selectedBus && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl pointer-events-auto text-xs">
            <span className={`w-2 h-2 rounded-full ${selectedBus.delayMinutes > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`}></span>
            <span className="font-bold text-white">{selectedBus.busNumber}</span>
            <span className="text-slate-400">|</span>
            <span className="text-amber-400 font-mono font-medium">{selectedBus.speed} km/h</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">ETA: ~{selectedBus.estimatedNextStopMins}m</span>
          </div>
        )}
      </div>

      {/* Floating Bottom Left: Simulation controls */}
      {showControls && (
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-2xl text-xs text-white">
          <button
            id="btn-toggle-simulation"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold transition ${
              isSimulating ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
            }`}
            title={isSimulating ? 'Pause GPS tracking simulation' : 'Resume GPS simulation'}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5 fill-emerald-300" /> : <Play className="w-3.5 h-3.5 fill-amber-300" />}
            <span className="hidden sm:inline">{isSimulating ? 'Sim Active' : 'Paused'}</span>
          </button>

          {/* Speed multiplier */}
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => setSimSpeed(speed)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                  simSpeed === speed ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          {/* Toggle Stops */}
          <button
            onClick={() => setShowStops(!showStops)}
            className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition flex items-center gap-1 ${
              showStops ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Bus Stops visibility"
          >
            <MapPin className="w-3 h-3 text-amber-400" />
            <span className="hidden md:inline">Stops</span>
          </button>
        </div>
      )}

      {/* Floating Bottom Right: Navigation Tools (Zoom, Recenter, Focus My Bus) */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1.5">
        {currentUser.assignedRouteId && (
          <button
            id="btn-focus-my-bus"
            onClick={() => {
              const myBus = buses.find(b => b.routeId === currentUser.assignedRouteId);
              if (myBus) focusOnBus(myBus.id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-xl transition transform active:scale-95"
            title="Jump to my assigned bus"
          >
            <Navigation className="w-3.5 h-3.5 fill-slate-950" />
            <span>Track My Bus</span>
          </button>
        )}

        <div className="flex flex-col bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden shadow-xl text-white">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-slate-800 transition text-slate-300 hover:text-white"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-full h-[1px] bg-slate-800" />
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-slate-800 transition text-slate-300 hover:text-white"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-full h-[1px] bg-slate-800" />
          <button
            onClick={handleFitBounds}
            className="p-2 hover:bg-slate-800 transition text-slate-300 hover:text-white text-[10px] font-bold"
            title="Reset overview"
          >
            FIT
          </button>
        </div>
      </div>
    </div>
  );
};
