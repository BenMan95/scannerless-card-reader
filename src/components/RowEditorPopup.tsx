import styles from './RowEditorPopup.module.css';
import React, { useEffect, useState, useRef } from 'react';
import type { Row } from '../utils/types';
import type { ScryfallCard, ScryfallSearch } from '../utils/scryfall';
import { encodeIdURL, getMainImages, loadSearchResults } from '../utils/scryfall';

export interface RowEditorProps {
    row: Row,
    onDelete?: () => void,
    onCancel?: () => void,
    onSave?: (newCard: Row) => void,
}

function RowEditor({row, onDelete, onCancel, onSave}: RowEditorProps) {
    const [newRow, setNewRow] = useState<Row>({...row});
    const [cardData, setCardData] = useState<ScryfallCard | null>(null);
    const [printingOptions, setPrintingOptions] = useState<ScryfallCard[]>([]);
    const [languageOptions, setLanguageOptions] = useState<ScryfallCard[]>([]);
    const form = useRef<HTMLFormElement>(null)

    useEffect(() => {
        const controller: AbortController = new AbortController();

        fetch(encodeIdURL(row.id), {signal: controller.signal})
        .then(resp => resp.json())
        .then(async (card: ScryfallCard) => {
            setCardData(card);

            const search: ScryfallSearch = {
                q: [`oracle_id:${card.oracle_id}`],
                unique: 'prints',
                include_extras: true,
                include_variations: true,
            }

            for await (const page of loadSearchResults(search, controller.signal)) {
                setPrintingOptions(current => [...current, ...page]);
            }
        }).catch(e => {
            if (e.name !== 'AbortError') {
                console.error(e);
            }
        });


        function downHandler(e: KeyboardEvent) {
            if (onCancel && e.key === 'Escape') onCancel();
        }

        addEventListener('keydown', downHandler);
        return () => {
            controller.abort();
            setPrintingOptions([]);
            removeEventListener('keydown', downHandler);
        }
    }, []);

    useEffect(() => {
        if (!cardData) return;

        const search: ScryfallSearch = {
            q: [`set:'${cardData.set}'`, `cn:'${cardData.collector_number}'`],
            unique: 'prints',
            include_extras: true,
            include_multilingual: true,
            include_variations: true,
        }

        const controller: AbortController = new AbortController();

        async function loadLanguages() {
            for await (const page of loadSearchResults(search)) {
                setLanguageOptions(current => [...current, ...page]);
            }
        }

        loadLanguages();

        return () => {
            controller.abort();
            setLanguageOptions([]);
        }
    }, [cardData]);

    function changeQuantity(e: React.ChangeEvent<HTMLInputElement>) {
        const qty: number = parseInt(e.target.value);
        setNewRow(current => ({...current, qty}));
    }

    function changePrinting(e: React.ChangeEvent<HTMLSelectElement>) {
        const index = e.target.selectedIndex;
        const newData = printingOptions[index];
        setCardData(newData);
        setNewRow(current => ({
            ...current,
            id: newData.id,
            set: newData.set,
            cn: newData.collector_number,
            lang: newData.lang,
            finish: newData.finishes[0],
        }));
    }

    function changeLanguage(e: React.ChangeEvent<HTMLSelectElement>) {
        const index = e.target.selectedIndex;
        const newData = languageOptions[index];
        setCardData(newData);
        setNewRow(current => ({
            ...current,
            id: newData.id,
            lang: newData.lang,
        }));
    }

    function changeFinish(e: React.ChangeEvent<HTMLSelectElement>) {
        const index = e.target.selectedIndex;
        const finish = cardData!.finishes[index];
        setNewRow(current => ({
            ...current,
            finish,
        }))
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (onSave) onSave(newRow);
    }

    return (
        <div className={styles['background']}>
            <div className={styles['window']}>
                <div className={styles['main']}>
                    <img className={styles['card']} src={cardData ? getMainImages(cardData).large : undefined}></img>
                    <form className={styles['options']} onSubmit={handleSubmit} ref={form}>
                        <p>
                            <label htmlFor='quantity'>Quantity:</label>
                            <br/>
                            <input
                                className={styles['quantity']}
                                id='quantity'
                                type='number'
                                value={newRow.qty}
                                onChange={changeQuantity}
                                autoFocus>
                            </input>
                        </p>
                        <p>
                            <label htmlFor='printing'>Printing:</label>
                            <br/>
                            <select
                                id='printing'
                                onChange={changePrinting}
                                value={`(${newRow.set}) ${newRow.cn}`}
                            >
                                {printingOptions.map(card => (
                                    <option key={card.id}>
                                        {`(${card.set}) ${card.collector_number}`}
                                    </option>
                                ))}
                            </select>
                        </p>
                        <p>
                            <label htmlFor='language'>Language:</label>
                            <br/>
                            <select id='language' onChange={changeLanguage} value={newRow.lang}>
                                {languageOptions.map(card => (
                                    <option key={card.id}>{card.lang}</option>
                                ))}
                            </select>
                        </p>
                        <p>
                            <label htmlFor='finish'>Finish:</label>
                            <br/>
                            <select id='finish' onChange={changeFinish} value={newRow.finish}>
                                {cardData?.finishes.map(finish => (
                                    <option key={finish}>{finish}</option>
                                ))}
                            </select>
                        </p>
                        <input type="submit" hidden/>
                    </form>
                </div>
                <div className={styles['buttons']}>
                    <div className={styles['left']}>
                        {onDelete && <button onClick={onDelete}>Delete</button>}
                    </div>
                    <div className={styles['right']}>
                        {onCancel && <button onClick={onCancel}>Cancel</button>}
                        {onSave && <button onClick={() => onSave(newRow)}>Save</button>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RowEditor;