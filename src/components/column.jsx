import React from 'react';
import propTypes from 'prop-types';
import SplitPane from 'react-split-pane';

const Columns = ({ columns, idx, rows, totalWidth, showRow }) => {
    const nextColumn = () => {
        if (idx === columns.length - 1) return (<div />);

        return Columns({
            columns,
            idx: idx + 1,
            rows,
            totalWidth,
            showRow,
        });
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
            const trimmed = trimQuotes(JSON.stringify(value));
            // we have to return something invisible that will force the div to take up space, or else the cell from
            //  from the row below is rendered in this row.  I selected zwnj (zero-width-non-joiner), x200C.
            return trimmed.length === 0 ? '\u200C' : trimmed;
        };

        return (
            rows.reduce((a, r, i) => {
                const displayValue = getDisplayValue(r[columns[idx]]);
                const style = i % 2 === 1 ? styles.stripe : {};

                return ([
                    ...a,
                    <div key={r._id} className="row w-100 mx-0 px-0" style={style} onDoubleClick={() => showRow(r)}>
                        <span className="text-truncate">{displayValue}</span>
                    </div>
                ]);
            }, [header()])
        );
    };

    const defaultWidth = Math.max(Math.floor(totalWidth / columns.length), 10);

    return (
        <SplitPane split="vertical" defaultSize={defaultWidth} minSize={5} maxSize={-5}>
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
    totalWidth: propTypes.number,
    showRow: propTypes.func,
};

export default Columns;
