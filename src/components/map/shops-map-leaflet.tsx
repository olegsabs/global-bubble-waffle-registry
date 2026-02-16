"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import type { Shop } from "@/types/database";
import type { MapBounds } from "@/components/map/shops-map";

type ShopsMapProps = {
  shops: Shop[];
  tileUrl: string;
  onBoundsChanged?: (bounds: MapBounds) => void;
};

const statusClassByValue: Record<Shop["status"], string> = {
  active: "bg-emerald-100 text-emerald-800",
  closed: "bg-rose-100 text-rose-800",
  unknown: "bg-zinc-100 text-zinc-700"
};

export function ShopsMapLeaflet({ shops, tileUrl, onBoundsChanged }: ShopsMapProps) {
  const defaultIcon = useMemo(
    () =>
      L.icon({
        iconUrl: markerIcon.src,
        iconRetinaUrl: markerIcon2x.src,
        shadowUrl: markerShadow.src,
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      }),
    []
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-batter-200 bg-white shadow-xl shadow-batter-900/10">
      <MapContainer center={[20, 0]} zoom={2} minZoom={2} style={{ height: "68vh", width: "100%" }}>
        <MapBoundsReporter onBoundsChanged={onBoundsChanged} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileUrl}
        />
        <ClusteredShopLayers shops={shops} defaultIcon={defaultIcon} />
      </MapContainer>
    </div>
  );
}

type MapBoundsReporterProps = {
  onBoundsChanged?: (bounds: MapBounds) => void;
};

function MapBoundsReporter({ onBoundsChanged }: MapBoundsReporterProps) {
  const map = useMap();

  const reportBounds = useCallback(
    (currentMap: LeafletMap) => {
      if (!onBoundsChanged) {
        return;
      }

      const bounds = currentMap.getBounds();

      onBoundsChanged({
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
        zoom: currentMap.getZoom()
      });
    },
    [onBoundsChanged]
  );

  useMapEvents({
    moveend: () => reportBounds(map),
    zoomend: () => reportBounds(map)
  });

  useEffect(() => {
    reportBounds(map);
  }, [map, reportBounds]);

  return null;
}

type ClusterBucket = {
  id: string;
  latitude: number;
  longitude: number;
  shops: Shop[];
};

type ClusteredShopLayersProps = {
  shops: Shop[];
  defaultIcon: L.Icon;
};

function ClusteredShopLayers({ shops, defaultIcon }: ClusteredShopLayersProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());

  useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    }
  });

  const clusters = useMemo(() => {
    return buildClusters(shops, map, zoom);
  }, [map, shops, zoom]);

  return (
    <>
      {clusters.map((cluster) => {
        if (cluster.shops.length === 1) {
          const shop = cluster.shops[0];

          return (
            <Marker key={shop.id} icon={defaultIcon} position={[shop.latitude, shop.longitude]}>
              <Popup>
                <div className="space-y-2 text-sm text-ink">
                  <p className="text-base font-semibold">{shop.name}</p>
                  <p>
                    {shop.city}, {shop.country}
                  </p>
                  <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${statusClassByValue[shop.status]}`}>
                    {shop.status}
                  </span>
                  <div>
                    <Link className="font-semibold text-batter-700 underline" href={`/shops/${shop.slug}`}>
                      Open profile
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        }

        const radius = Math.min(28, 10 + Math.log2(cluster.shops.length) * 4);
        const previewShops = cluster.shops.slice(0, 8);

        return (
          <CircleMarker
            key={cluster.id}
            center={[cluster.latitude, cluster.longitude]}
            radius={radius}
            pathOptions={{ color: "#b55f14", fillColor: "#f89c21", fillOpacity: 0.7, weight: 2 }}
            eventHandlers={{
              click: () => {
                map.flyTo([cluster.latitude, cluster.longitude], Math.min(18, map.getZoom() + 2));
              }
            }}
          >
            <Popup>
              <div className="space-y-2 text-sm text-ink">
                <p className="text-base font-semibold">{cluster.shops.length} shops in cluster</p>
                <div className="space-y-1">
                  {previewShops.map((shop) => (
                    <div key={shop.id}>
                      <Link className="text-batter-700 underline" href={`/shops/${shop.slug}`}>
                        {shop.name}
                      </Link>
                    </div>
                  ))}
                  {cluster.shops.length > previewShops.length && (
                    <p className="text-xs text-ink/70">+{cluster.shops.length - previewShops.length} more</p>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

function getClusterCellSize(zoom: number): number {
  if (zoom <= 3) {
    return 120;
  }
  if (zoom <= 5) {
    return 90;
  }
  if (zoom <= 8) {
    return 70;
  }
  if (zoom <= 11) {
    return 50;
  }
  return 36;
}

function buildClusters(shops: Shop[], map: LeafletMap, zoom: number): ClusterBucket[] {
  const cellSize = getClusterCellSize(zoom);
  const buckets = new Map<
    string,
    {
      shops: Shop[];
      latSum: number;
      lngSum: number;
    }
  >();

  for (const shop of shops) {
    const point = map.project([shop.latitude, shop.longitude], zoom);
    const cellX = Math.floor(point.x / cellSize);
    const cellY = Math.floor(point.y / cellSize);
    const key = `${zoom}:${cellX}:${cellY}`;
    const existing = buckets.get(key);

    if (!existing) {
      buckets.set(key, {
        shops: [shop],
        latSum: shop.latitude,
        lngSum: shop.longitude
      });
      continue;
    }

    existing.shops.push(shop);
    existing.latSum += shop.latitude;
    existing.lngSum += shop.longitude;
  }

  return Array.from(buckets.entries()).map(([id, bucket]) => ({
    id,
    shops: bucket.shops,
    latitude: bucket.latSum / bucket.shops.length,
    longitude: bucket.lngSum / bucket.shops.length
  }));
}
