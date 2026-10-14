#!/bin/zsh
REPO=${REPO_ROOT:?set REPO_ROOT}
S=${QA_SCRATCH:?set QA_SCRATCH}/qa-r2-B
SEED=${3:-$S/seeds/02-$2-*.ts}
DEST=$S/runs/$1
rm -rf $DEST && mkdir -p $DEST
rsync -a --exclude node_modules --exclude .git --exclude out --exclude .qa --exclude .planning --exclude '.env*' $REPO/ $DEST/
ln -s $REPO/node_modules $DEST/node_modules
cp $S/seeds/02-B-common-qa-comun.ts $DEST/qa-comun.ts
cp ${~SEED} $DEST/qa-run.ts
cd $DEST && LLM_EN_VIVO=0 bun qa-run.ts
