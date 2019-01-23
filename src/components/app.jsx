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
const updateId = 'updateId';
const doUpdate = 'doUpdate';
const doInsert = 'doInsert';
const doDelete = 'doDelete';
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

        this.db = null;

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
            query: '',
            updateDocs: '',
            options: '',
            updateType: '',
            startRowIdx: 0,
        };

        _.bindAll(this, ['showRow']);
    }

    showRow(row) {
        ipcRenderer.send('showRowWindow', row);
    }

    render() {
        const {
            dbFolder, tables, selectedTableName, selectedTableRows, findQuery, updateType, query, updateDocs, options, windowHeight, gridWidth,
            headerHeight, firstRender, startRowIdx
        } = this.state;

        const onClickBrowse = e => {
            e.preventDefault();

            remote.dialog.showOpenDialog(remote.getCurrentWindow(),
                {
                    title: 'NeDB Viewer',
                    message: 'Select folder that contains NeDB tables.',
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

                if (selectedTableName) {
                    await setTableRows(selectedTableName);
                }
            }
        };

        const onChangeFindQuery = e => {
            e.preventDefault();
            this.setState({ findQuery: e.target.value });
        };

        const onKeyDownUpdateQuery = async e => {
            if (e.key === 'Enter') {
                e.preventDefault();

                switch (this.state.updateType) {
                    case doInsert:
                        await this.db.insertRows(looseJsonParse(updateDocs, 'insert'));
                        break;
                    case doUpdate:
                        await this.db.updateRows(looseJsonParse(query, 'query'), looseJsonParse(updateDocs, 'update'), looseJsonParse(options, 'options'));
                        break;
                    case doDelete:
                        await this.db.deleteRows(looseJsonParse(query, 'query'), looseJsonParse(options, 'options'));
                        break;
                }

                setTableRows(selectedTableName);
            }
        };

        const onChangeQuery = e => {
            e.preventDefault();
            this.setState({ query: e.target.value });
        };

        const onChangeDocs = e => {
            e.preventDefault();
            this.setState({ updateDocs: e.target.value });
        };

        const onChangeOptions = e => {
            e.preventDefault();
            this.setState({ options: e.target.value });
        };

        const onUpdateTypeChange = e => {
            //e.preventDefault();
            this.setState({ updateType: e.target.value });
        };

        const looseJsonParse = (obj, fieldName) => {
            try {
                if (!obj.startsWith('{') && !(obj.startsWith('['))) {
                    throw (new Error(`${fieldName} must start with { or [`));
                }

                return Function('"use strict";return (' + obj + ')')();
            } catch (err) {
                err.message = `Syntax error in '${fieldName}:' ${err.message}`;
                this.props.handleError(err);
            }
        };

        const setTableRows = async tableName => {
            this.db = new DB(dbFolder, tableName, this.props.handleError);
            const rows = await this.db.getTableRows(looseJsonParse(findQuery, 'find'));

            if (rows) {
                this.setState({
                    selectedTableName: tableName,
                    selectedTableRows: rows,
                    startRowIdx: 0,
                });
            }
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

        const queryDisabled = updateType === doInsert || updateType === '';
        const optionsDisabled = updateType === doInsert || updateType === '';
        const updateDisabled = updateType === doDelete || updateType === '';

        const queryExtraClass = queryDisabled ? 'text-muted' : '';
        const updateExtraClass = updateDisabled ? 'text-muted' : '';
        const optionsExtraClass = optionsDisabled ? 'text-muted' : '';

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
                            <div className="col mt-1 pr-1">
                                <input type="text" id={findId} className="w-100" value={findQuery}
                                       onKeyDown={onKeyDownFindQuery} onChange={onChangeFindQuery} />
                            </div>
                        </div>
                        <div className="border border-dark m-1 py-2">
                            <div className="row mx-3 d-flex justify-content-center" onChange={onUpdateTypeChange}>
                                <div className="custom-control custom-radio custom-control-inline">
                                    <input type="radio" id="updateTypeInsert" value={doInsert} name="updateType"
                                           className="custom-control-input" />
                                    <label className="custom-control-label" htmlFor="updateTypeInsert">insert</label>
                                </div>
                                <div className="custom-control custom-radio custom-control-inline mx-5">
                                    <input type="radio" id="updateTypeUpdate" value={doUpdate} name="updateType"
                                           className="custom-control-input" />
                                    <label className="custom-control-label" htmlFor="updateTypeUpdate">update</label>
                                </div>
                                <div className="custom-control custom-radio custom-control-inline">
                                    <input type="radio" id="updateTypeDelete" value={doDelete} name="updateType"
                                           className="custom-control-input" />
                                    <label className="custom-control-label" htmlFor="updateTypeDelete">delete</label>
                                </div>
                            </div>
                            <div className="row mx-1">
                                <div className="col mt-1 pl-1">
                                    <label className={`ml-1 mr-2 ${queryExtraClass}`}>query:</label>
                                    <input type="text" id={updateId} className="w-100" value={query} disabled={queryDisabled}
                                           onKeyDown={onKeyDownUpdateQuery} onChange={onChangeQuery} />
                                </div>
                                <div className="col mt-1 pl-1">
                                    <label className={`ml-2 mr-2 ${updateExtraClass}`}>update:</label>
                                    <input type="text" id={updateId} className="w-100" value={updateDocs} disabled={updateDisabled}
                                           onKeyDown={onKeyDownUpdateQuery} onChange={onChangeDocs} />
                                </div>
                                <div className="col mt-1 pl-1">
                                    <label className={`ml-2 mr-2 ${optionsExtraClass}`}>options:</label>
                                    <input type="text" id={updateId} className="w-100" value={options} disabled={optionsDisabled}
                                           onKeyDown={onKeyDownUpdateQuery} onChange={onChangeOptions} />
                                </div>
                            </div>
                        </div>
                        <div className="row mx-1 mt-2">
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
