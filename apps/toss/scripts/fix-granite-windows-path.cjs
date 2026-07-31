const fs = require('node:fs');
const path = require('node:path');

const packageJsonPath = require.resolve(
  '@granite-js/plugin-micro-frontend/package.json',
);
const packageRoot = path.dirname(packageJsonPath);
const graniteTargets = [
  {
    path: path.join(packageRoot, 'dist', 'index.js'),
    unsafe: "from '${path.resolve(modulePath)}';",
    safe: 'from ${JSON.stringify(path.resolve(modulePath))};',
  },
  {
    path: path.join(packageRoot, 'dist', 'index.cjs'),
    unsafe: "from '${path.default.resolve(modulePath)}';",
    safe: 'from ${JSON.stringify(path.default.resolve(modulePath))};',
  },
];

const compatPackageJsonPath = require.resolve(
  '@apps-in-toss/plugin-compat/package.json',
);
const compatPackageRoot = path.dirname(compatPackageJsonPath);
const compatUnsafe = [
  "const reactUsePolyfill = require('${reactUsePolyfillPath}');",
  "const reactEffectEventPolyfill = require('${reactEffectEventPolyfillPath}');",
].join('\n    ');
const compatSafe = [
  'const reactUsePolyfill = require(${JSON.stringify(reactUsePolyfillPath)});',
  'const reactEffectEventPolyfill = require(${JSON.stringify(reactEffectEventPolyfillPath)});',
].join('\n    ');
const compatTargets = ['index.js', 'index.cjs'].map((filename) => ({
  path: path.join(compatPackageRoot, 'dist', filename),
  unsafe: compatUnsafe,
  safe: compatSafe,
}));
const targets = [...graniteTargets, ...compatTargets];

let patched = false;

for (const target of targets) {
  const source = fs.readFileSync(target.path, 'utf8');

  if (source.includes(target.safe)) {
    continue;
  }

  if (!source.includes(target.unsafe)) {
    throw new Error(
      `[granite-path-fix] Granite changed ${target.path}. Review the upstream package before building.`,
    );
  }

  fs.writeFileSync(
    target.path,
    source.replace(target.unsafe, target.safe),
    'utf8',
  );
  patched = true;
}

console.log(
  patched
    ? '[granite-path-fix] Patched Granite Windows import paths.'
    : '[granite-path-fix] Windows path escaping is ready.',
);
