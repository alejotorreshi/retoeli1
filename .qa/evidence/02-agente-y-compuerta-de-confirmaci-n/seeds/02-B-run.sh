#!/bin/zsh
# Uso: 02-B-run.sh <directorio-scratch> <T02|T03|...>
REPO=/Users/alejo/Developer/Alejo/reto-eli-1
SEEDS=$REPO/.qa/evidence/02-agente-y-compuerta-de-confirmaci-n/seeds
DEST=$1/$2
rm -rf $DEST && mkdir -p $DEST
rsync -a --exclude node_modules --exclude .git --exclude out --exclude .qa --exclude .planning --exclude '.env*' $REPO/ $DEST/
ln -s $REPO/node_modules $DEST/node_modules
cp $SEEDS/02-B-common-qa-comun.ts $DEST/qa-comun.ts
cp $SEEDS/02-$2-*.ts $DEST/qa-run.ts
cd $DEST && bun qa-run.ts
