import React from 'react';
import ReactDOM from 'react-dom';
import { ipcRenderer } from 'electron';
import Swal from 'sweetalert2';

import Row from './components/row';

ipcRenderer.on('data', async (e, { row }) => {
    const handleError = err => {
        console.error(err);
        Swal({
            title: 'Oops',
            text: err.message,
            type: 'error',
            confirmButtonText: 'OK',
        });
    };

    (async function() {
        try {
            ReactDOM.render(
                <Row row={row} />,
                document.getElementById('js-row')
            );

        } catch(err) {
            handleError(err);
        }
    })();
});
