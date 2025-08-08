import styles from './App.module.css';
import React, { useState, useRef, useEffect } from 'react';
import CardSelector, { type CardSelectorController } from './components/CardSelector.tsx';
import CardTable from './components/CardTable.tsx';
import RowEditor, { type RowEditorProps } from './components/RowEditor.tsx';
import { toCSV, fromCSV } from './utils/csv.ts';
import type { Row } from './utils/types.ts';
import type { ScryfallCard } from './utils/scryfall';
import Popup from './components/Popup.tsx';

function App() {
    const [rows, setRows] = useState<Row[]>([]);
    const [outURL, setOutURL] = useState<string | undefined>(undefined);
    const [editorProps, setEditorProps] = useState<RowEditorProps | null>(null)
    const [shiftHeld, setShiftHeld] = useState<boolean>(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const selectorController = useRef<CardSelectorController>(null);

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
            quantity:    1,
            scryfall_id:     cardData.id,
            card_name:   cardData.name,
            set_code:    cardData.set,
            collector_number:     cardData.collector_number,
            language:   cardData.lang,
            finish: cardData.finishes[0],
        };

        if (shiftHeld) {
            const props: RowEditorProps = {
                row: newRow,
                onCancel: () => {
                    setEditorProps(null);
                    selectorController.current!.focus();
                },
                onSave: (editedRow) => {
                    checkDuplicatesAndAdd(editedRow);
                    setEditorProps(null);
                    selectorController.current!.focus();
                    selectorController.current!.clear();
                },
            }

            setEditorProps(props)
        } else {
            checkDuplicatesAndAdd(newRow);
            selectorController.current!.focus();
            selectorController.current!.clear();
        }
    }

    async function readFile(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (files && files.length > 0) {
            const reader = new FileReader();
            reader.readAsText(files[0]);

            reader.onerror = () => alert('Failed to read file');
            reader.onloadend = () => e.target.value = '';
            reader.onload = () => {
                const array: string[][] = fromCSV(reader.result as string);

                const headers: string[] | undefined = array.shift();
                if (!headers) return;

                const mappedHeaders: (string | undefined)[] = headers.map(attr => {
                    const attrs_map: Record<string, string> = {
                        'Count':            'quantity',
                        'ID':               'scryfall_id',
                        'Name':             'card_name',
                        'Edition':          'set_code',
                        'Collector Number': 'collector_number',
                        'Language':         'language',
                        'Foil':             'finish',
                    }
                    return attrs_map[attr];
                });

                const rows: Row[] = array.map(inputRow => {
                    const rowObj: any = {};
                    for (const i in inputRow) {
                        const header = mappedHeaders[i];
                        if (header) rowObj[header] = inputRow[i];
                    }
                    rowObj.qty = parseInt(rowObj.quantity);
                    return rowObj;
                });

                setRows(rows);
            }
        }
    }

    useEffect(() => {
        const array = rows.map(card => [
            card.quantity,
            card.scryfall_id,
            card.card_name,
            card.set_code,
            card.collector_number,
            card.language,
            card.finish
        ]);
        array.unshift(['Count', 'ID', 'Name', 'Edition', 'Collector Number', 'Language', 'Foil']);

        const csv = toCSV(array);
        const blob = new Blob([csv], {type: 'text/csv'})
        const url = URL.createObjectURL(blob);

        setOutURL(url);
        return () => URL.revokeObjectURL(url);
    }, [rows]);

    function handleEdit(editIndex: number) {
        const props: RowEditorProps = {
            row: rows[editIndex],
            onDelete: () => {
                setRows(current => current.filter((_, idx) => idx !== editIndex));
                setEditorProps(null);
            },
            onCancel: () => setEditorProps(null),
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

                setEditorProps(null);
            },
        }

        setEditorProps(props);
    }

    return (
        <>
            <CardSelector onSelect={addRow} controller={selectorController}/>
            <br/>
            <CardTable rows={rows} handleClick={handleEdit}/>
            <br/>
            <div className={styles['buttons']}>
                <button onClick={() => fileInput.current?.click()}>Import</button>
                <input id="input" type="file" ref={fileInput} onChange={readFile} hidden/>
                <a href={outURL} download="cards.csv">
                    <button>Export</button>
                </a>
            </div>
            {editorProps && <Popup><RowEditor {...editorProps}/></Popup>}
        </>
    );
}

export default App;
