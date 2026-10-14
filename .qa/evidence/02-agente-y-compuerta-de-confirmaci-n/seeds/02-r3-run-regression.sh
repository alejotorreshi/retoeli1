#!/bin/zsh
REPO=${REPO_ROOT:?set REPO_ROOT}
S=${QA_SCRATCH:?set QA_SCRATCH}/B
SEEDS=$REPO/.qa/evidence/02-agente-y-compuerta-de-confirmaci-n/seeds
SEED=${3:-$SEEDS/02-$2-*.ts}
DEST=$S/runs/$1
rm -rf $DEST && mkdir -p $DEST
rsync -a --exclude node_modules --exclude .git --exclude out --exclude .qa --exclude .planning --exclude '.env*' $REPO/ $DEST/
ln -s $REPO/node_modules $DEST/node_modules
cp $SEEDS/02-B-common-qa-comun.ts $DEST/qa-comun.ts
cp ${~SEED} $DEST/qa-run.ts
cd $DEST && LLM_EN_VIVO=0 bun --no-env-file qa-run.ts
