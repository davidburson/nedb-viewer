import electron from 'electron';
import os from 'os';

const { ipcMain, systemPreferences } = electron;

// Have to do this here or Mac will create a couple of extra unwanted Edit menu options,
//  but we can only do this on Mac or it crashes on Windows at runtime.
if (os.platform() === 'darwin') {
    systemPreferences.setUserDefault('NSDisabledDictationMenuItem', 'boolean', true);
    systemPreferences.setUserDefault('NSDisabledCharacterPaletteMenuItem', 'boolean', true);
}

process.on('uncaughtException', err => {
    console.error(err);
});

process.on('unhandledRejection', err => {
    console.error(err);
});

const { app, BrowserWindow } = electron;

if (process.env.NODE_ENV !== 'production') {
    // this allows us to debug in WebStorm.  See:  https://blog.jetbrains.com/webstorm/2016/05/getting-started-with-electron-in-webstorm/
    app.commandLine.appendSwitch('remote-debugging-port', '9222');
}

app.on('ready', async() => {
    const appWindow = new BrowserWindow({
        show: false,
        width: 1000,    // wide enough for 4 images at the default image size
        height: 800,
        minWidth: 400,
        minHeight: 460,
    });

    appWindow.once('ready-to-show', () => {
        //appWindow.maximize();   // on Windows, can't maximize before ready-to-show is called, or ready-to-show never gets called.
        appWindow.send('readyToShow');
    });

    appWindow.loadURL(`file://${__dirname}/index.html`);

    // So we can log stuff from renderer on the main console, for when we can't get to the renderer console,
    //  Such as when the window won't render at all, or when we want to log data in a function that closes a window.
    ipcMain.on('logOnMain', (e, data) => console.log(data));
});

app.on('window-all-closed', () => {
    app.quit();
});
