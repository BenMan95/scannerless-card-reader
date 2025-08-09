import styles from './ExportEditor.module.css';
import React, { useState, useEffect } from 'react';
import type { ExportSettings } from '../utils/types';
import { rowFields } from '../utils/types';

const PRESETS: Record<string, ExportSettings> = {
    'Default': {
        write_headers: true,
        columns: [
            ['quantity', '#'],
            ['scryfall_id', 'Scryfall ID'],
            ['card_name', 'Name'],
            ['set_code', 'Set'],
            ['collector_number', 'Num'],
            ['language', 'Lang'],
            ['finish', 'Finish'],
        ],
    },
    'Moxfield': {
        write_headers: true,
        columns: [
            ['quantity', 'Count'],
            ['card_name', 'Name'],
            ['set_code', 'Edition'],
            ['language', 'Language'],
            ['finish', 'Foil'],
            ['collector_number', 'Collector Number'],
        ],
    },
}

export interface ExportEditorProps {
    onCancel?: () => void,
    onExport?: (settings: ExportSettings) => void,
}

function ExportEditor({ onCancel, onExport }: ExportEditorProps) {
    const [preset, setPreset] = useState<string>('Default');
    const [settings, setSettings] = useState<ExportSettings>(PRESETS['Default']);

    useEffect(() => {
        function downHandler(e: KeyboardEvent) {
            if (onCancel && e.key === 'Escape') onCancel();
        }

        addEventListener('keydown', downHandler);
        return () => {
            removeEventListener('keydown', downHandler);
        }
    }, []);


    function editPreset(e: React.ChangeEvent<HTMLSelectElement>) {
        const newPreset = e.target.value;
        setPreset(newPreset);
        if (newPreset !== 'Custom')
            setSettings(PRESETS[newPreset]);
    }

    function toggleHeaders() {
        setSettings(current => ({
            ...current,
            write_headers: !current.write_headers,
        }));
        setPreset('Custom');
    }

    function editColumnData(editIdx: number, e: React.ChangeEvent<HTMLSelectElement>) {
        setSettings(current => ({
            ...current,
            columns: current.columns.map((column, idx) =>
                idx === editIdx
                ? [rowFields[e.target.selectedIndex], column[1]]
                : column
            )
        }));
        setPreset('Custom');
    }

    function editColumnHeader(editIdx: number, e: React.ChangeEvent<HTMLInputElement>) {
        setSettings(current => ({
            ...current,
            columns: current.columns.map((column, idx) =>
                idx === editIdx
                ? [column[0], e.target.value]
                : column
            )
        }));
        setPreset('Custom');
    }

    function deleteColumn(deletedIdx: number) {
        setSettings(current => ({
            ...current,
            columns: current.columns.filter((_, idx) => idx !== deletedIdx),
        }));
        setPreset('Custom');
    }

    function addColumn() {
        setSettings(current => ({
            ...current,
            columns: [
                ...current.columns,
                [rowFields[0], ''],
            ],
        }));
        setPreset('Custom');
    }

    return (
        <>
            <h1>Export to CSV</h1>
            <div className={styles['presets']}>
                <label htmlFor='preset'>Preset: </label>
                <select id='preset' onChange={editPreset} value={preset}>
                    {Object.keys(PRESETS).map(preset =>
                        <option key={preset}>{preset}</option>
                    )}
                    <option onChange={() => setPreset('Custom')}>Custom</option>
                </select>
            </div>
            <table border={1} rules='rows' className={styles['columns']}>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Column Data</th>
                        <th>Column Header</th>
                        <th>Delete</th>
                    </tr>
                </thead>
                <tbody>
                    {settings.columns.map((column, idx) => 
                        <tr key={idx}>
                            <td>{idx}</td>
                            <td>
                                <select
                                    value={column[0]}
                                    onChange={e => editColumnData(idx, e)}
                                >
                                    {rowFields.map(field => 
                                        <option key={field}>{field}</option>
                                    )}
                                </select>
                            </td>
                            <td>
                                <input
                                    value={column[1]}
                                    onChange={e => editColumnHeader(idx, e)}
                                />
                            </td>
                            <td onClick={() => deleteColumn(idx)}>&#x2715;</td>
                        </tr>
                    )}
                </tbody>
            </table>
            <div
                className={styles['add-column']}
                onClick={addColumn}
                tabIndex={0}
            >
                + Add column
            </div>
            <div>
                <input
                    type='checkbox'
                    id='headers'
                    checked={settings.write_headers}
                    onChange={toggleHeaders}
                />
                <label htmlFor='headers'>Add header row</label>
            </div>
            <div className={styles['buttons']}>
                <div>{onCancel && <button onClick={onCancel}>Cancel</button>}</div>
                <div>{onExport && <button onClick={() => onExport(settings)}>Export</button>}</div>
            </div>
        </>
    )
}

export default ExportEditor;