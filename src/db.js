import Datastore from 'nedb';
import path from 'path';
import _ from 'lodash';

class DB {
    constructor(dataPath, tableName, handleError) {
        this._handleError = handleError;
        this._table = new Datastore({ filename: path.join(dataPath, tableName), autoload: true });

        _.bindAll(['getTableRows']);
    }

    async getTableRows(findQuery) {
        return await new Promise(resolve => this._table.find(findQuery, (err, docs) => {
            if (err) {
                this._handleError(err);
            } else {
                resolve(docs);
            }
        }));
    }
}

export default DB;
