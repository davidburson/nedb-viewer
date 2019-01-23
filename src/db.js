import Datastore from 'nedb';
import path from 'path';
import _ from 'lodash';

class DB {
    constructor(dataPath, tableName, handleError) {
        this._handleError = handleError;
        this._table = new Datastore({ filename: path.join(dataPath, tableName), autoload: true });

        _.bindAll(['getTableRows', 'insertRows', 'updateRows', 'deleteRows']);
    }

    async getTableRows(findQuery) {
        if (findQuery === undefined) return;

        return await new Promise(resolve => this._table.find(findQuery, (err, docs) => {
            if (err) {
                this._handleError(err);
            } else {
                resolve(docs);
            }
        }));
    }

    async insertRows(docs) {
        if (docs === undefined) return;

        return await new Promise(resolve => this._table.insert(docs, (err, newDocs) => {
            if (err) {
                this._handleError(err);
            }

            console.log('inserted:', newDocs);
            resolve(newDocs);
        }));
    }

    async updateRows(query, update, options) {
        if (query === undefined || update === undefined || options === undefined) return;

        return await new Promise(resolve => this._table.update(query, update, options, (err, numAffected, affectedDocuments, upsert) => {
            if (err) {
                this._handleError(err);
            }

            console.log('updated:  numAffected, affectedDocuments, upsert', numAffected, affectedDocuments, upsert);
            resolve(affectedDocuments);
        }));
    }

    async deleteRows(query, options) {
        if (query === undefined || options === undefined) return;

        return await new Promise(resolve => this._table.remove(query, options, (err, numRemoved) => {
            if (err) {
                this._handleError(err);
            }

            console.log('deleted:', numRemoved);
            resolve(numRemoved);
        }));
    }
}

export default DB;
