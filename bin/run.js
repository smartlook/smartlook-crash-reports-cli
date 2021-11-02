#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const project = path.join(__dirname, '../tsconfig.json');
const dev = fs.existsSync(project);

if (dev) {
    require('ts-node').register({project});
    console.warn("WARNING: You're running in development mode.")
}

process.env.ENV = dev ? 'DEV' : 'PROD';

// in development mode imports from src folder, otherwise from build in `lib` folder
require(`../${dev ? 'src' : 'lib'}`)
    .default()
