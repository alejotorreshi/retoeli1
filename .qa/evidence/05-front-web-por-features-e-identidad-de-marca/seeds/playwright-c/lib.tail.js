  } catch (e) { R.fatal = cap(String(e.stack || e), 900); }
  for (const c of ctxs) await c.close().catch(() => {});
  return JSON.stringify(R, null, 1);
}
