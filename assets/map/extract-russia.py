"""Select the unedited Natural Earth ADM0_A3=RUS record as GeoJSON.

Requires pyshp. Coordinates, rings, parts and attributes are preserved; no
simplification, projection, border editing or styling is performed.
"""

from pathlib import Path
import json
import shapefile

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'original/ne_50m_admin_0_countries/ne_50m_admin_0_countries.shp'
TARGET = ROOT / 'derived/russia-natural-earth-50m.geojson'


def main():
    reader = shapefile.Reader(str(SOURCE), encoding='utf-8')
    selected = []
    for record in reader.iterShapeRecords():
        properties = record.record.as_dict()
        if properties.get('ADM0_A3') == 'RUS':
            selected.append({
                'type': 'Feature',
                'properties': properties,
                'geometry': record.shape.__geo_interface__,
            })
    if len(selected) != 1:
        raise RuntimeError(f'Expected exactly one ADM0_A3=RUS feature, got {len(selected)}')
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(json.dumps({'type': 'FeatureCollection', 'features': selected},
                                 ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'Wrote {TARGET}: unedited ADM0_A3=RUS feature')


if __name__ == '__main__':
    main()
