import React from 'react';
import propTypes from 'prop-types';
import fs from 'fs-extra-promise';
import { remote, ipcRenderer } from 'electron';
import SplitPane from 'react-split-pane';
import _ from 'lodash';

import DB from '../db';
import Columns from './column';

const dbFolderId = 'dbFolderId';
const findId = 'findId';
const startRowId = 'startRowId';
const maxRowsToShow = 60;   // Needs to be bigger than the most rows that can be visible.  On my big monitor, that's about 53.

class App extends React.Component {
    constructor(props) {
        super(props);

        // Handle window resize
        const currentWindow = remote.getCurrentWindow();
        currentWindow.on('resize', _.debounce(e => {
            const newHeight = e.sender.getContentSize()[1];

            this.setState({
                windowHeight: newHeight,
                gridWidth: this.gridDiv.offsetWidth,
            });
        }, 10));

        const initialSize = remote.getCurrentWindow().getContentSize();

        this.state = {
            windowHeight: initialSize[1],
            gridWidth: 0,
            firstRender: true,
            headerHeight: 40,
            dbFolder: '',
            tables: [],
            selectedTableName: '',
            selectedTableRows: [],
            findQuery: '{}',
            startRowIdx: 0,
        };

        _.bindAll(this, ['showRow']);
    }

    showRow(row) {
        ipcRenderer.send('showRowWindow', row);
    }

    render() {
        const {
            dbFolder, tables, selectedTableName, selectedTableRows, findQuery, windowHeight, gridWidth,
            headerHeight, firstRender, startRowIdx
        } = this.state;

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
                startRowIdx: 0,
            });
        };

        const onChangeStartRowIdx = e => {
            e.preventDefault();
            this.setState({ startRowIdx: parseInt(e.target.value, 10) });
        };

        const onClickTableName = async e => {
            e.preventDefault();

            const tableName = e.target.id;
            await setTableRows(tableName);
        };

        const onChangeMainSplit = () => {
            setTimeout(() => {
                this.setState({
                    gridWidth: this.gridDiv.offsetWidth,
                });
            });
        };

        const tableNamesHeight = windowHeight - headerHeight - 10;
        const styles = {
            selectedBtn: {
                backgroundColor: '#DDDDDD',
            },
            allSplits: {
                maxHeight: tableNamesHeight,
            },
            scrollableTables: {
                height: 'auto',
                maxHeight: tableNamesHeight,
                minHeight: tableNamesHeight,
                overflowX: 'hidden'
            },
            startRow: {
                minWidth: 100,
                maxWidth: 100,
            }
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

            return Columns({
                columns,
                idx: 0,
                rows: selectedTableRows.slice(startRowIdx, startRowIdx + maxRowsToShow),
                totalWidth: gridWidth,
                showRow: this.showRow,
            });
        };

        if (firstRender) {
            setTimeout(() => this.setState({
                firstRender: false,
                headerHeight: this.headerDiv.offsetHeight,
                gridWidth: this.gridDiv.offsetWidth,
            }));
        }

        return (
            <div className="container-fluid">
                <div ref={node => this.headerDiv = node} className="row mt-1">
                    <label htmlFor={dbFolderId} className="ml-2 mt-2">Database Folder: </label>
                    <div className="col mt-1">
                        <input type="text" id={dbFolderId} className="w-100" value={dbFolder}
                               onChange={onChangeDbFolder} />
                    </div>
                    <button className="btn btn-outline-primary mr-2" onClick={onClickBrowse}>...</button>
                </div>
                <SplitPane split="vertical" defaultSize={200} minSize={150} maxSize={-100} style={styles.allSplits} onChange={onChangeMainSplit}>
                    <div style={styles.scrollableTables}>
                        {listTableNames()}
                    </div>
                    <div ref={node => this.gridDiv = node}>
                        <div className="row mt-1 mx-1">
                            <label htmlFor={findId} className="ml-2 mt-2">find: </label>
                            <div className="col mt-1">
                                <input type="text" id={findId} className="w-100" value={findQuery}
                                       onKeyDown={onKeyDownFindQuery} onChange={onChangeFindQuery} />
                            </div>
                        </div>
                        <div className="row mx-1">
                            <label htmlFor={startRowId} className="mt-1 mx-2">Row start index: </label>
                            <span>
                                <input type="number" id={startRowId} style={styles.startRow} min={0}
                                       max={selectedTableRows.length - 1} step={10} value={startRowIdx}
                                       onChange={onChangeStartRowIdx} />
                                <label className="mx-2">Total rows: {selectedTableRows.length}</label>
                            </span>
                        </div>
                        <div className="m-0 p-0">
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
