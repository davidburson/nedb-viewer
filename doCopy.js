const fs = require('fs-extra-promise');
const path = require('path');

const doCopy = async () => {
    // I believe the file copying below could be run asynchronously, but I use await to make sure that when this code finishes,
    //  everything is truly copied.  That way we know everything is ready to go for the next step in the build script.

    const copyFolderIntoBuild = async function(sourceFolder, destFolder) {
        const publicFiles = await fs.readdirAsync(sourceFolder);
        for (const file of publicFiles) {
            await fs.copyAsync(path.join(sourceFolder, file), path.join(destFolder, file));
        }
    };

    // copy public folder into build folder
    const buildPath = 'build';
    await copyFolderIntoBuild('public', buildPath);

    // NOTE: we do not copy the src folder b/c our build script runs babel against it, and puts the output in the build folder.

    //await fs.copyAsync('.env', path.join(buildPath, '.env'));

};

module['exports'] = doCopy;
