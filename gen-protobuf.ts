/*
import { spawn } from 'child_process';
import { resolve } from 'path';

const PROTOC_PATH = "./protobuf-bin/bin/protoc.exe";
const PROTOC_GEN_TS_PATH = "./node_modules/.bin/protoc-gen-ts.cmd";
const OUT_DIR = "./gen";

const INPUT_FILES = ["grid.proto"];

const child = spawn(PROTOC_PATH, [
    `--plugin=protoc-gen-ts=${resolve(PROTOC_GEN_TS_PATH)}`,
    `--js_out=import_style=commonjs,binary:${OUT_DIR}`,
    `--ts_out=${OUT_DIR}`,
    ...INPUT_FILES
]);

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

child.on('close', _ => console.log(`Finished generating files`));
*/

import { writeFile } from 'fs';
import { promisify } from 'util';

import pbjs from 'protobufjs/cli/pbjs';
import pbts from 'protobufjs/cli/pbts';

const writeFileAsync = promisify(writeFile);
const compileJS = promisify(pbjs.main);
const compileTS = promisify(pbts.main);

async function generate() {

    await compileJS([
        "--target", "static-module",
        "-w", "commonjs",
        "--es6",
        "--out", "./gen/grid.js",
        "--no-create", "--no-encode", "--no-verify", "--no-convert", "--no-delimited", "--no-beautify", // We don't need these
        "./grid.proto"
    ]);

    let out = await compileTS([
        "./gen/grid.js"
    ]);

    if (out) {
        out = out.replace(/\[ 'object' \]\.<string, any>/g, "Record<string, any>");
        out = out.replace(/\[ 'Array' \]\.<([A-Za-z0-9.-_]+)>/g, (_, type) => `${type}[]`);
        await writeFileAsync("./gen/grid.d.ts", out);
    }

}



generate();
