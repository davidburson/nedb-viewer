import React from 'react';
import propTypes from 'prop-types';
import path from 'path';
import fs from 'fs-extra-promise';
import { remote, ipcRenderer, clipboard } from 'electron';

class App extends React.Component {

    constructor(props) {
        super(props);

        ipcRenderer.send('logOnMain', 'jsx 1');
        this.state = {
            test: 'hello'
        };
    }

    render() {
        ipcRenderer.send('logOnMain', 'jsx 2');
        return (
            <div>
                HI {this.state.test}
            </div>
        );
    }
}

export default App;
