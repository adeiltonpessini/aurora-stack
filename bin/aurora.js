#!/usr/bin/env node
// Entry point invocado pelo `npm install -g`. Loader minimal — resolve
// o build em dist/ e delega. Sem isso, o `aurora` no PATH não acharia
// o módulo ESM.
import "../dist/index.js"
