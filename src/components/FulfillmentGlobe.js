import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { useElementSize } from '../hooks/useElementSize';

const GLOBE_IMAGE = 'https://unpkg.com/three-globe/example/img/earth-night.jpg';

const DEFAULT_POV = { lat: 18, lng: -25, altitude: 2.5 };

export function FulfillmentGlobe({ shipments, focusShipmentId, onArcIssueClick }) {
  const { ref, width, height } = useElementSize();
  const globeRef = useRef();
  const [globeReady, setGlobeReady] = useState(false);

  const allArcs = useMemo(
    () =>
      shipments.map((s) => ({
        shipmentId: s.id,
        name: `${s.id}: ${s.origin} → ${s.destination}`,
        startLat: s.lat1,
        startLng: s.lng1,
        endLat: s.lat2,
        endLng: s.lng2,
        color: s.status === 'ON TIME' ? '#22c55e' : s.status === 'DELAYED' ? '#eab308' : '#ef4444',
        routeStatus: s.status.toLowerCase(),
        delayReason: s.delayReason,
      })),
    [shipments]
  );

  const arcsData = useMemo(() => {
    if (!focusShipmentId) return allArcs;
    return allArcs.filter((a) => a.shipmentId === focusShipmentId);
  }, [allArcs, focusShipmentId]);

  const moveCamera = useCallback(() => {
    const g = globeRef.current;
    if (!g) return;
    if (focusShipmentId) {
      const s = shipments.find((x) => x.id === focusShipmentId);
      if (s) {
        const lat = (s.lat1 + s.lat2) / 2;
        const lng = (s.lng1 + s.lng2) / 2;
        g.pointOfView({ lat, lng, altitude: 1.12 }, 1400);
        return;
      }
    }
    g.pointOfView(DEFAULT_POV, 1200);
  }, [focusShipmentId, shipments]);

  useEffect(() => {
    if (!globeReady) return;
    moveCamera();
  }, [globeReady, moveCamera]);

  const arcColor = useCallback((d) => d.color, []);

  const handleArcClick = useCallback(
    (arc) => {
      if (!arc) return;
      const status = arc.routeStatus;
      if (status === 'delayed' || status === 'stuck') {
        onArcIssueClick?.({
          title: arc.name,
          status,
          reason: arc.delayReason || 'No detail on file.',
        });
      }
    },
    [onArcIssueClick]
  );

  const pointerCursor = useCallback((_objType, objData) => {
    if (!objData) return false;
    const st = objData.routeStatus;
    return st === 'delayed' || st === 'stuck';
  }, []);

  return (
    <div ref={ref} className="globe-wrap globe-wrap--routes">
      <Globe
        ref={globeRef}
        width={width}
        height={height}
        backgroundColor="rgba(5, 12, 28, 0.95)"
        globeImageUrl={GLOBE_IMAGE}
        showGraticules={false}
        atmosphereColor="#34d399"
        atmosphereAltitude={0.16}
        onGlobeReady={() => setGlobeReady(true)}
        arcsData={arcsData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={arcColor}
        arcAltitude={0.32}
        arcStroke={0.45}
        arcDashLength={0.12}
        arcDashGap={0.12}
        arcDashAnimateTime={2200}
        arcLabel="name"
        onArcClick={handleArcClick}
        showPointerCursor={pointerCursor}
      />
    </div>
  );
}
