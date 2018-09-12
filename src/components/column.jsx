import React from 'react';
import propTypes from 'prop-types';
import SplitPane from 'react-split-pane';

const Columns = ({ columns, idx, rows }) => {
    const nextColumn = () => {
        if (idx === columns.length) return (<div />);

        return Columns({ columns, idx: idx + 1, rows });
    };

    const styles = {
        stripe: {
            backgroundColor: '#EEEEEE',
        },
    };

    const createRows = () => {
        const header = () => {
            return (
                <div key="header" className="row w-100 mx-0 px-0 bg-dark text-light">
                    <span className="text-truncate d-block mx-auto">{columns[idx]}</span>
                </div>
            );
        };

        const trimQuotes = value => {
            if (!value || value.length === 0) return '';

            let result = value;

            if (result[0] === '"') {
                result = result.slice(1);
            }

            if (result[result.length - 1] === '"') {
                result = result.slice(0, result.length - 1);
            }

            return result;
        };

        const getDisplayValue = value => {
            return trimQuotes(JSON.stringify(value));
        };

        return (
            rows.reduce((a, r, i) => {
                const displayValue = getDisplayValue(r[columns[idx]]);
                const style = i % 2 === 1 ? styles.stripe : {};
                return ([
                    ...a,
                    <div key={r._id} className="row w-100 mx-0 px-0" style={style}>
                        <span className="text-truncate">{displayValue}</span>
                    </div>
                ]);
            }, [header()])
        );
    };

    return (
        <SplitPane split="vertical" defaultSize={75} minSize={5} maxSize={-5}>
            <div>
                {createRows()}
            </div>
            {nextColumn()}
        </SplitPane>
    );
};
Columns.propTypes = {
    columns: propTypes.arrayOf(propTypes.string),
    idx: propTypes.number,
    rows: propTypes.arrayOf(propTypes.object),
};

export default Columns;
