#!/bin/sh
set -eu
DEST="${1:?scratch copy root required}"
SLUG="co-industrias-delta-sucursal-norte-con-nombre-muy-largo-qaxx"
CASOS="$DEST/reto-01/fixtures/reto-01/casos"
ORIGEN="$CASOS/co-industrias-delta"
DESTINO="$CASOS/$SLUG"
cp -R "$ORIGEN" "$DESTINO"
sed "s/\"id\": \"co-industrias-delta\"/\"id\": \"$SLUG\"/" "$ORIGEN/solicitud.json" > "$DESTINO/solicitud.json"
echo "$SLUG"
