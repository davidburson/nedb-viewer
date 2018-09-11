const fs = require('fs-extra-promise');
const path = require('path');
const rmrf = require('rmrf-promise');
const { omit } = require('lodash');

const doCopy = require('./doCopy');

(async function() {

    // delete and create build folder
    const buildPath = 'build';
    await rmrf(buildPath);
    await fs.ensureDirAsync(buildPath);

    doCopy();

    // create a stripped-down package.json and put it in the build folder.
    const packageJSON = await fs.readJsonAsync('package.json');
    const newPackageJSON = omit(packageJSON, [
        'build',
        'devDependencies',
        'scripts'
    ]);
    await fs.writeJsonAsync(path.join(buildPath, 'package.json'), newPackageJSON);

})();
