import React from 'react';
import propTypes from 'prop-types';
import _ from 'lodash';

const first = 'first';
const last = 'last';
const middle = 'middle';
const only = 'only';

const Row = ({ row }) => {
    const displayValue = (value, arrayPosition) => {
        if (Array.isArray(value)) {
            return (
                <div>
                    [
                    {value.map((v, i) => {
                        const isLast = value.length - 1 === i;
                        const comma = isLast || Array.isArray(v) || _.isObject(v) ? '' : ',';
                        const pos = value.length === 1 ? only : i === 0 ? first : isLast ? last : middle;
                        return (
                            <span key={i}>{displayValue(v, pos)}{comma}</span>
                        );
                    })}
                    ]
                </div>
            );
        }

        if (_.isObject(value)) {
            return showObjectValues(value, arrayPosition);
        }

        return JSON.stringify(value);
    };

    const showObjectValues = (obj, arrayPosition) => {
        let prefix = '{';
        let postfix = '}';
        switch (arrayPosition) {
            case first:
                postfix = '';
                break;
            case last:
                prefix = '}, {';
                break;
            case middle:
                prefix = '}, {';
                postfix = '';
                break;
            default:
        }

        return (
            <div>
                {prefix}
                {Object.keys(obj).map(k => {
                    return(
                        <div key={k} className="row mx-2">
                            <span className="font-weight-bold">{k}:</span>
                            <span className="ml-2">{displayValue(obj[k], arrayPosition)}</span>
                        </div>
                    );
                })}
                {postfix}
            </div>
        );
    };

    return (
        <div className="container-fluid">
            {showObjectValues(row, only)}
        </div>
    );
};
Row.propTypes = {
    row: propTypes.object,
};

export default Row;
