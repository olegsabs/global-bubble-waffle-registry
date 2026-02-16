import dynamic from "next/dynamic";
import type { Shop } from "@/types/database";

export type MapBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
  zoom: number;
};

type ShopsMapProps = {
  shops: Shop[];
  tileUrl: string;
  onBoundsChanged?: (bounds: MapBounds) => void;
};

const ShopsMapDynamic = dynamic(() => import("./shops-map-leaflet").then((m) => m.ShopsMapLeaflet), {
  ssr: false,
  loading: () => (
    <div className="flex h-[68vh] w-full items-center justify-center rounded-3xl border border-batter-200 bg-white shadow-xl shadow-batter-900/10">
      <div className="text-sm text-zinc-600">Loading map…</div>
    </div>
  )
});

export function ShopsMap(props: ShopsMapProps) {
  return <ShopsMapDynamic {...props} />;
}
