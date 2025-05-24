// Nexus Mods domain for the game. e.g. nexusmods.com/bloodstainedritualofthenight
const GAME_ID = 'sporegalacticadventures';

//Steam Application ID, you can get this from https://steamdb.info/apps/
const STEAMAPP_ID = '24720';

//GOG Application ID, you can get this from https://www.gogdb.org/
const GOGAPP_ID = '1948823323';
//Import some assets from Vortex we'll need.
const path = require('path');
const { fs, log, util } = require('vortex-api');
const MOD_FILE_EXT = ".package";

const moddingTools = [
    // {
    //     id: 'SMAEInstaller',
    //     name: 'Spore ModAPI Easy Installer',
    //     logo: 'Icon_EasyInstaller.png',
    //     shortName: 'SMAEIn',
    //     executable: () => 'SporeModAPILauncherKit/Spore ModAPI Easy Installer.exe',
    //     requiredFiles: [
    //         'SporeModAPILauncherKit/Spore ModAPI Easy Installer.exe',
    //     ],
    // },
    // {
    //     id: 'SMAEUninstaller',
    //     name: 'Spore ModAPI Easy Unistaller',
    //     logo: 'Icon_EasyUninstaller.png',
    //     shortName: 'SMAEUn',
    //     executable: () => 'SporeModAPILauncherKit/Spore ModAPI Easy Uninstaller.exe',
    //     requiredFiles: [
    //         'SporeModAPILauncherKit/Spore ModAPI Easy Uninstaller.exe',
    //     ],
    // },
    {
        id: 'SMALauncher',
        name: 'Spore ModAPI Launcher',
        logo: 'Icon_Launcher.png',
        shortName: 'SMAL',
        executable: () => 'SporeModAPILauncherKit/Spore ModAPI Launcher.exe',
        requiredFiles: [
            'SporeModAPILauncherKit/Spore ModAPI Launcher.exe',
        ],
    }
];

function main(context) {
    //This is the main function Vortex will run when detecting the game extension.
    context.registerGame({
        id: GAME_ID,
        name: 'Spore',
            mergeMods: true,
        queryPath: findGame,
        supportedTools: [],
        queryModPath: () => 'BloodstainedRotN/Content/Paks/~mods',
        logo: 'gameart.jpg',
        executable: () => 'BloodstainedROTN.exe',
        requiredFiles: [
            'BloodstainedRotN.exe',
            'BloodstainedROTN/Binaries/Win64/BloodstainedRotN-Win64-Shipping.exe'
        ],
        setup: prepareForModding,
        environment: {
            SteamAPPId: STEAMAPP_ID,
        },
        details: {
            steamAppId: STEAMAPP_ID,
            gogAppId: GOGAPP_ID,
        },

    });
    context.registerInstaller('smaeinstaller', 25, testSupportedContent, installContent);
    return true
}

function findGame() {
    try {
        const instPath = winapi.RegGetValue(
            'HKEY_LOCAL_MACHINE',
            'SOFTWARE\\WOW6432Node\\GOG.com\\Games\\' + GOGAPP_ID,
            'PATH');
        if (!instPath) {
            throw new Error('empty registry key');
        }
        return Promise.resolve(instPath.value);
    } catch (err) {
        return util.GameStoreHelper.findByAppId([STEAMAPP_ID, GOGAPP_ID])
            .then(game => game.gamePath);
    }
}
function prepareForModding(discovery) {
    return fs.ensureDirAsync(path.join(discovery.path, 'DataEP1'));
}

function testSupportedContent(files, gameId) {
    // Make sure we're able to support this mod.
    let supported = (gameId === GAME_ID) &&
        (files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT) !== undefined);

    return Promise.resolve({
        supported,
        requiredFiles: [],
    });
}

function installContent(files) {
    // The .pak file is expected to always be positioned in the mods directory we're going to disregard anything placed outside the root.
    const modFile = files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT);
    const idx = modFile.indexOf(path.basename(modFile));
    const rootPath = path.dirname(modFile);

    // Remove directories and anything that isn't in the rootPath.
    const filtered = files.filter(file =>
        ((file.indexOf(rootPath) !== -1)
            && (!file.endsWith(path.sep))));

    const instructions = filtered.map(file => {
        return {
            type: 'copy',
            source: file,
            destination: path.join(file.substr(idx)),
        };
    });

    return Promise.resolve({ instructions });
}

module.exports = {
    default: main,
};