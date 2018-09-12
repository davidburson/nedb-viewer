import React from 'react';
import propTypes from 'prop-types';
import fs from 'fs-extra-promise';
import { remote } from 'electron';
import SplitPane from 'react-split-pane';
import _ from 'lodash';

import DB from '../db';
import Columns from './column';

const dbFolderId = 'dbFolderId';
const findId = 'findId';

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            dbFolder: '/Users/david/Downloads/iftest/db',  //'',
            tables: [],
            selectedTableName: '',
            selectedTableRows: [],
            findQuery: '{}',
        };
    }

    render() {
        const { dbFolder, tables, selectedTableName, selectedTableRows, findQuery } = this.state;

        const onClickBrowse = e => {
            e.preventDefault();

            remote.dialog.showOpenDialog(remote.getCurrentWindow(),
                {
                    title: 'nedb viewer',
                    message: 'Select folder that contains nedb tables.',
                    properties: ['openDirectory', 'createDirectory']
                }, dirName => {
                    if (!dirName) return;

                    folderChanged(dirName[0]);
                });
        };

        const folderChanged = newFolder => {
            const newTables = fs.existsSync(newFolder) ? fs.readdirSync(newFolder) : tables;

            this.setState({
                dbFolder: newFolder,
                tables: newTables,
            });
        };

        const onChangeDbFolder = e => {
            e.preventDefault();
            const newFolder = e.target.value;
            folderChanged(newFolder);
        };

        const onKeyDownFindQuery = async e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                await setTableRows(selectedTableName);
            }
        };

        const onChangeFindQuery = e => {
            e.preventDefault();
            this.setState({ findQuery: e.target.value });
        };


        const setTableRows = async tableName => {
            const looseJsonParse = obj => {
                return Function('"use strict";return (' + obj + ')')();
            };

            const db = new DB(dbFolder, tableName, this.props.handleError);
            const rows = await db.getTableRows(looseJsonParse(findQuery));

            this.setState({
                selectedTableName: tableName,
                selectedTableRows: rows,
            });
        };

        const onClickTableName = async e => {
            e.preventDefault();

            const tableName = e.target.id;
            await setTableRows(tableName);
        };

        const styles = {
            selectedBtn: {
                backgroundColor: '#DDDDDD',
            },
            scrollableRows: {
                height: 'auto',
                maxHeight: 600,
                //minHeight: regionSplitSize,
                overflowX: 'hidden'
            },
        };

        const listTableNames = () => {
            return (
                tables.map(t => {
                    const btnStyle = t === selectedTableName ? styles.selectedBtn : {};
                    return (
                        <div key={t} className="row w-100 mx-0 px-0" style={btnStyle}>
                            <button id={t} className="btn btn-link" onClick={onClickTableName}>{t}</button>
                        </div>
                    );
                })
            );
        };

        const showSelectedTable = () => {
            if (selectedTableRows.length === 0) return (<div />);

            const columns = selectedTableRows.reduce((a, r) => {
                const keys = Object.keys(r);
                return _.uniq([...a, ...keys]);
            }, []);

            return Columns( { columns, idx: 0, rows: selectedTableRows });
        };

        return (
            <div className="container-fluid">
                <div className="row mt-1">
                    <label htmlFor={dbFolderId} className="ml-2 mt-2">Database Folder: </label>
                    <div className="col mt-1">
                        <input type="text" id={dbFolderId} className="w-100" value={dbFolder} onChange={onChangeDbFolder} />
                    </div>
                    <button className="btn btn-outline-primary mr-2" onClick={onClickBrowse}>...</button>
                </div>
                <SplitPane split="vertical" defaultSize={200} minSize={150} maxSize={-100}>
                    <div>
                        {listTableNames()}
                    </div>
                    <div>
                        <div className="row mt-1 mx-1">
                            <label htmlFor={findId} className="ml-2 mt-2">find: </label>
                            <div className="col mt-1">
                                <input type="text" id={findId} className="w-100" value={findQuery} onKeyDown={onKeyDownFindQuery} onChange={onChangeFindQuery} />
                            </div>
                        </div>
                        <div className="m-0 p-0" style={styles.scrollableRows}>
                            {showSelectedTable()}
                        </div>
                    </div>
                </SplitPane>
            </div>
        );
    }
}
App.propTypes = {
    handleError: propTypes.func,
};

export default App;
