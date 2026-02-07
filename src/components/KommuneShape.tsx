// src/components/KommuneShape.tsx

import { memo } from "react";

interface KommuneShapeProps {
  d: string;
  kommunenummer: string;
  onSelect: (kommunenummer: string) => void;
}

export const KommuneShape = memo(function KommuneShape({
                                                         d,
                                                         kommunenummer,
                                                         onSelect,
                                                       }: KommuneShapeProps) {
  return (
      <path
          d={d}
          className="kommune-shape"
          data-id={kommunenummer}
          onClick={() => onSelect(kommunenummer)}
      />
  );
});