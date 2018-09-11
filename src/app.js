import React from 'react';
import ReactDOM from 'react-dom';
import Swal from 'sweetalert2';
import { ipcRenderer, remote } from 'electron';
import fs from 'fs-extra-promise';
import path from 'path';

import App from './components/app';

ipcRenderer.on('readyToShow', async() => {
    // this is how to log breadcrumbs on the main process to debug the renderer process, when we can't see the renderer console.
    //require('electron').ipcRenderer.send('logOnMain', 'ready1');

    ipcRenderer.send('logOnMain', 'js 1');
    // *****************************************
    // Global error handler for renderer process
    // *****************************************
    const handleError = err => {
        console.log('global error');
        console.error(err);
        // swal.setDefaults doesn't seem to work anymore.  Now we have to specify the button text explicitly, if we want it localized.
        //  (I just switched to sweetalert2 - maybe setDefaults would work now, but no need to change all the code at this point.)
        //  see https://sweetalert.js.org/guides/ and search for confirmButtonText
        Swal({
            title: 'Oops',
            text: err.message,
            type: 'error',
            confirmButtonText: 'OK',
        });
    };

    ipcRenderer.send('logOnMain', 'js 2');

    try {
        ReactDOM.render(
            <App />,
            document.getElementById('js-app')
        );
    } catch (err) {
        handleError(err);
    }

    remote.getCurrentWindow().show();
});
