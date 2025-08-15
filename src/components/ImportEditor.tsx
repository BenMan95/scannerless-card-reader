import styles from './ImportEditor.module.css';
import type { ImportSettings, Row } from '../utils/types';
import React, { useState } from 'react';
import { rowFields } from '../utils/types';

const PREVIEW_ROWS: number = 3;

const PRESETS: Record<string, ImportSettings> = {
    'Default': {
        skip_first: true,
        columns: {
            quantity: 0,
            scryfall_id: 1,
            card_name: 2,
            set_code: 3,
            collector_number: 4,
            language: 5,
            finish: 6,
        },
    },
    'Moxfield': {
        skip_first: true,
        columns: {
            quantity: 0,
            card_name: 2,
            set_code: 3,
            collector_number: 9,
            language: 5,
            finish: 6,
        }
    }
}

export interface ImportEditorProps {
    data?: string[][],
    onCancel?: () => void,
    onImport?: (settings: ImportSettings) => void,
}

function ImportEditor({ data, onCancel, onImport }: ImportEditorProps) {
    const [preview, setPreview] = useState<boolean>(false);
    const [preset, setPreset] = useState<string>('Default');
    const [settings, setSettings] = useState<ImportSettings>(PRESETS['Default']);

    const rowLengths: number[] | undefined = data && data.map(row => row.length);
    const minLength: number | undefined = rowLengths && Math.min(...rowLengths);
    const maxLength: number | undefined = rowLengths && Math.max(...rowLengths);

    function getColumnOptionText(i: number | undefined) {
        if (i === undefined)
            return 'None';
        if (data && data[0] && data[0][i])
            return `Column ${i} (${data[0][i]})`;
        return `Column ${i}`;
    }

    function editPreset(e: React.ChangeEvent<HTMLSelectElement>) {
        const newPreset = e.target.value;
        setPreset(newPreset);
        if (newPreset !== 'Custom')
            setSettings(PRESETS[newPreset]);
    }


    function setColumnSettings(field: keyof Row, e: React.ChangeEvent<HTMLSelectElement>) {
        const index: number = e.target.selectedIndex;
        setSettings(current => {
            const newColumns = {...current.columns};
            newColumns[field] = index === 0 ? undefined : index-1;
            return {
                ...current,
                columns: newColumns,
            };
        });
        setPreset('Custom');
    }

    function setSkipFirst() {
        setSettings(current => ({
            ...current,
            skip_first: !current.skip_first,
        }));
        setPreset('Custom');
    }

    return (
        <>
            <h1>Import from CSV</h1>
            {minLength == maxLength ? null :
                <div className={styles['warning']}>
                    Warning: Rows have uneven lengths. May cause issues.
                </div>
            }
            {data &&
                <>
                    <div className={styles['preview']} onClick={() => setPreview(x => !x)}>
                        {preview ? '\u2212' : '+'} View input data
                    </div>
                    {preview &&
                        <div className={styles['table-wrapper']}>
                            <table border={1} rules='all' className={styles['input']}>
                                <thead>
                                    <tr>{[...Array(maxLength).keys()].map(i => <th key={i}>{i}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {[...Array(PREVIEW_ROWS).keys()].map(i =>
                                        <tr key={i}>
                                            {[...Array(maxLength).keys()].map(j => 
                                                <td key={j}>{data[i][j]}</td>
                                            )}
                                        </tr>
                                    )}
                                    <tr>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    }
                </>
            }
            <div className={styles['presets']}>
                <label htmlFor='presets'>Presets: </label>
                <select id='presets' onChange={editPreset} value={preset}>
                    {Object.keys(PRESETS).map(preset =>
                        <option key={preset}>{preset}</option>
                    )}
                    <option>Custom</option>
                </select>
            </div>
            <div>
                <input id='skip-first' type='checkbox' onChange={setSkipFirst} checked={settings.skip_first}/>
                <label htmlFor='skip-first'>Skip first row</label>
            </div>
            {rowFields.map(field =>
                <div key={field} className={styles['columns']}>
                    <label htmlFor={field}>{field}: </label>
                    <select onChange={e => setColumnSettings(field, e)}
                            value={getColumnOptionText(settings.columns[field])}
                            id={field}>
                        <option>None</option>
                        {[...Array(maxLength).keys()].map(i =>
                            <option key={i}>
                                {getColumnOptionText(i)}
                            </option>
                        )}
                    </select>
                </div>
            )}
            <div className={styles['buttons']}>
                <div>{onCancel && <button onClick={onCancel}>Cancel</button>}</div>
                <div>{onImport && <button onClick={() => onImport(settings)}>Import</button>}</div>
            </div>
        </>
    )
}

export default ImportEditor;