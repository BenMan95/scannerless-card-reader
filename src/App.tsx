import styles from './App.module.css';
import React, { useState, useRef, useEffect } from 'react';
import CardSelector, { type CardSelectorController } from './components/CardSelector.tsx';
import CardTable from './components/CardTable.tsx';
import { toCSV, fromCSV } from './utils/csv.ts';
import { rowFields, type PartialRow, type Row } from './utils/types.ts';
import type { ScryfallCard } from './utils/scryfall';
import Popup from './components/Popup.tsx';
import RowEditor, { type RowEditorProps } from './components/RowEditor.tsx';
import ExportEditor, { type ExportEditorProps } from './components/ExportEditor.tsx';
import ImportEditor, { type ImportEditorProps } from './components/ImportEditor.tsx';

type PopupState = null | 'rowEdit' | 'importEdit' | 'exportEdit';
type PopupProps = null | RowEditorProps | ImportEditorProps | ExportEditorProps;

function App() {
    const [rows, setRows] = useState<Row[]>([]);
    const [shiftHeld, setShiftHeld] = useState<boolean>(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const selectorController = useRef<CardSelectorController>(null);

    const [popupState, setPopupState] = useState<PopupState>(null);
    const [popupProps, setPopupProps] = useState<PopupProps>(null);

    useEffect(() => {
        function downHandler(e: KeyboardEvent) {
            if (e.key === 'Shift') setShiftHeld(true);
        }

        function upHandler(e: KeyboardEvent) {
            if (e.key === 'Shift') setShiftHeld(false);
        }

        window.addEventListener('keydown', downHandler);
        window.addEventListener('keyup', upHandler);
        return () => {
            window.removeEventListener('keydown', downHandler);
            window.removeEventListener('keyup', upHandler);
        };
    }, []);

    function addRow(cardData: ScryfallCard) {
        function checkDuplicatesAndAdd(newRow: Row) {
            setRows(current => {
                const newRowCopy: Row = {...newRow};
                const newRows = current.filter(row => {
                    if (row.scryfall_id === newRow.scryfall_id && row.finish === newRow.finish) {
                        newRowCopy.quantity += row.quantity;
                        return false;
                    }
                    return true;
                })

                newRows.unshift(newRowCopy);
                return newRows;
            });
        }

        let newRow: Row = {
            quantity:         1,
            scryfall_id:      cardData.id,
            card_name:        cardData.name,
            set_code:         cardData.set,
            collector_number: cardData.collector_number,
            language:         cardData.lang,
            finish:           cardData.finishes[0],
        };

        if (shiftHeld) {
            const props: RowEditorProps = {
                row: newRow,
                onCancel: () => {
                    setPopupState(null);
                    selectorController.current!.focus();
                },
                onSave: (editedRow) => {
                    setPopupState(null);
                    checkDuplicatesAndAdd(editedRow);
                    selectorController.current!.focus();
                    selectorController.current!.clear();
                },
            }

            setPopupState('rowEdit');
            setPopupProps(props);
        } else {
            checkDuplicatesAndAdd(newRow);
            selectorController.current!.focus();
            selectorController.current!.clear();
        }
    }

    function handleEdit(editIndex: number) {
        setPopupState('rowEdit');
        setPopupProps({
            row: rows[editIndex],
            onDelete: () => {
                setRows(current => current.filter((_, idx) => idx !== editIndex));
                setPopupState(null);
                setPopupProps(null);
            },
            onCancel: () => setPopupState(null),
            onSave: (newRow: Row) => {
                setRows(current => {
                    const newRowCopy: Row = {...newRow};
                    return current.map((row, idx) => {
                        if (idx === editIndex)
                            return newRowCopy;

                        if (row.scryfall_id === newRow.scryfall_id && row.finish === newRow.finish) {
                            newRowCopy.quantity += row.quantity;
                            return null;
                        }

                        return row;
                    }).filter(row => row !== null)
                })

                setPopupState(null);
            },
        });
    }

    async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (files && files.length > 0) {
            const reader = new FileReader();
            reader.readAsText(files[0]);

            reader.onerror = () => alert('Failed to read file');
            reader.onload = () => {
                const array: string[][] = fromCSV(reader.result as string);

                setPopupState('importEdit');
                setPopupProps({
                    data: array,
                    onCancel: () => setPopupState(null),
                    onImport: settings => {
                        if (settings.skip_first)
                            array.shift();

                        const partials: PartialRow[] = array.map(row => {
                            const partial: PartialRow = {};
                            for (const field of rowFields)
                                if (settings.columns[field] !== undefined)
                                    partial[field] = row[settings.columns[field]];
                            return partial;
                        });

                        // TODO: Fill in potential undefined values

                        const newRows: Row[] = partials.map(partial => ({
                            ...partial,
                            quantity: parseInt(partial.quantity!),
                        } as Row))

                        setRows(newRows);
                        setPopupState(null);
                    },
                });
            }
        }
    }

    function handleExport() {
        setPopupState('exportEdit');
        setPopupProps({
            onCancel: () => setPopupState(null),
            onExport: settings => {
                const output: any[][] = []

                if (settings.write_headers) {
                    const outputRow: string[] = []
                    for (const column of settings.columns)
                        outputRow.push(column[1]);
                    output.push(outputRow);
                }

                for (const row of rows) {
                    const outputRow: any[] = settings.columns.map(column => row[column[0]]);
                    output.push(outputRow);
                }

                const csv = toCSV(output);
                const blob = new Blob([csv], {type: 'text/csv'});
                const url = URL.createObjectURL(blob);

                // Workaround to trigger download
                const link = document.createElement('a');
                link.href = url;
                link.download = 'cards.csv';
                link.click();

                URL.revokeObjectURL(url);
                setPopupState(null);
            }
        })
    }

    function getPopupElement() {
        switch (popupState) {
            case 'rowEdit':
                return <Popup><RowEditor {...popupProps as RowEditorProps}/></Popup>;
            case 'importEdit':
                return <Popup><ImportEditor {...popupProps as ImportEditorProps}/></Popup>;
            case 'exportEdit':
                return <Popup><ExportEditor {...popupProps as ExportEditorProps}/></Popup>;
            default:
                return null;
        }
    }

    return (
        <>
            <CardSelector onSelect={addRow} controller={selectorController}/>
            <br/>
            <CardTable rows={rows} handleClick={handleEdit}/>
            <br/>
            <div className={styles['buttons']}>
                <button onClick={() => fileInput.current?.click()}>Import</button>
                <input id="input" type="file" ref={fileInput} onChange={handleImport} value='' hidden/>
                <button onClick={handleExport}>Export</button>
            </div>
            {getPopupElement()}
        </>
    );
}

export default App;
