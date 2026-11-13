import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import { rollupPluginHTML as html } from '@web/rollup-plugin-html';
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets';
import esbuild from 'rollup-plugin-esbuild';
import { cpSync, existsSync } from 'node:fs';

// iconsets find their icons at <bundle folder>/svgs/<set>/, so the icon files
// of every iconset that is bundled go there
const iconSvgs = [
  'node_modules/@haxtheweb/simple-icon/lib/svgs',
  'node_modules/@haxtheweb/hax-iconset/lib/svgs',
];
const copyIconSvgs = {
  name: 'copy-icon-svgs',
  writeBundle() {
    iconSvgs
      .filter((dir) => existsSync(dir))
      .forEach((dir) => cpSync(dir, 'public/svgs', { recursive: true }));
  },
};

export default {
  input: 'index.html',
  output: {
    entryFileNames: '[hash].js',
    chunkFileNames: '[hash].js',
    assetFileNames: '[hash][extname]',
    format: 'es',
    dir: 'public',
  },
  preserveEntrySignatures: false,

  plugins: [
    /** Enable using HTML as rollup entrypoint */
    html({
      minify: true,
    }),
    /** Resolve bare module imports */
    nodeResolve(),
    /** Minify JS, compile JS to a lower language target */
    esbuild({
      minify: true,
      target: ['es2022'],
    }),
    /** Bundle assets references via import.meta.url */
    importMetaAssets(),
    /** Minify html and css tagged template literals */
    babel({
      plugins: [
        [
          'babel-plugin-template-html-minifier',
          {
            modules: { lit: ['html', { name: 'css', encapsulation: 'style' }] },
            failOnError: false,
            strictCSS: true,
            htmlMinifier: {
              collapseWhitespace: true,
              conservativeCollapse: true,
              removeComments: true,
              caseSensitive: true,
              minifyCSS: true,
            },
          },
        ],
      ],
    }),
    copyIconSvgs,
  ],
};
