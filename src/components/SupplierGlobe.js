import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { useElementSize } from '../hooks/useElementSize';

const GLOBE_IMAGE = 'https://unpkg.com/three-globe/example/img/earth-night.jpg';

const DEFAULT_POV = { lat: 22, lng: -35, altitude: 2.45 };

export function SupplierGlobe({ suppliers, headquarters, focusSupplierId, onArcIssueClick }) {
  const { ref, width, height } = useElementSize();
  const globeRef = useRef();
  const [globeReady, setGlobeReady] = useState(false);

  const allArcs = useMemo(
    () =>
      suppliers.map((s) => ({
        supplierId: s.id,
        name: `${s.name} → ${headquarters.city}`,
        startLat: s.lat,
        startLng: s.lng,
        endLat: headquarters.lat,
        endLng: headquarters.lng,
        color: s.inboundStatus === 'ON TIME' ? '#22c55e' : s.inboundStatus === 'DELAYED' ? '#eab308' : '#ef4444',
        inboundLaneStatus: s.inboundStatus.toLowerCase().replace(' ', '_'),
        delayReason: s.inboundStatus === 'ON TIME' ? null : `${s.name} lane currently ${s.inboundStatus.toLowerCase()}.`,
      })),
    [suppliers, headquarters]
  );
  const allPoints = useMemo(
    () => [
      { id: 'HQ', name: `HQ — ${headquarters.city}`, lat: headquarters.lat, lng: headquarters.lng, color: '#fbbf24', altitude: 0.12, radius: 0.35 },
      ...suppliers.map((s) => ({
        id: s.id,
        name: `${s.name} (${s.country})`,
        lat: s.lat,
        lng: s.lng,
        color: s.inboundStatus === 'ON TIME' ? '#22c55e' : s.inboundStatus === 'DELAYED' ? '#eab308' : '#ef4444',
        altitude: 0.06,
        radius: 0.22,
      })),
    ],
    [suppliers, headquarters]
  );

  const arcsData = useMemo(() => {
    if (!focusSupplierId) return allArcs;
    return allArcs.filter((a) => a.supplierId === focusSupplierId);
  }, [allArcs, focusSupplierId]);

  const pointsData = useMemo(() => {
    if (!focusSupplierId) return allPoints;
    const hq = allPoints.find((p) => p.id === 'HQ');
    const one = allPoints.find((p) => p.id === focusSupplierId);
    return [hq, one].filter(Boolean);
  }, [allPoints, focusSupplierId]);

  const pointAltitude = useCallback((d) => d.altitude ?? 0.08, []);
  const pointRadius = useCallback((d) => d.radius ?? 0.2, []);
  const pointColor = useCallback((d) => d.color, []);

  const moveCamera = useCallback(() => {
    const g = globeRef.current;
    if (!g) return;
    if (focusSupplierId) {
      const s = suppliers.find((x) => x.id === focusSupplierId);
      if (s) {
        g.pointOfView({ lat: s.lat, lng: s.lng, altitude: 1.08 }, 1400);
        return;
      }
    }
    g.pointOfView(DEFAULT_POV, 1200);
  }, [focusSupplierId, suppliers]);

  useEffect(() => {
    if (!globeReady) return;
    moveCamera();
  }, [globeReady, moveCamera]);

  const handleArcClick = useCallback(
    (arc) => {
      if (!arc) return;
      const status = arc.inboundLaneStatus;
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
    const st = objData.inboundLaneStatus;
    return st === 'delayed' || st === 'stuck';
  }, []);

  return (
    <div ref={ref} className="globe-wrap">
      <Globe
        ref={globeRef}
        width={width}
        height={height}
        backgroundColor="rgba(5, 12, 28, 0.95)"
        globeImageUrl={GLOBE_IMAGE}
        showGraticules={false}
        atmosphereColor="#22c55e"
        atmosphereAltitude={0.18}
        onGlobeReady={() => setGlobeReady(true)}
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor={pointColor}
        pointAltitude={pointAltitude}
        pointRadius={pointRadius}
        pointLabel="name"
        arcsData={arcsData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcAltitude={0.28}
        arcStroke={0.35}
        arcDashLength={0.92}
        arcDashGap={2}
        arcDashAnimateTime={0}
        arcLabel="name"
        onArcClick={handleArcClick}
        showPointerCursor={pointerCursor}
      />
    </div>
  );
}
