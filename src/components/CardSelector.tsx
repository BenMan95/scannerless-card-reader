import styles from './CardSelector.module.css';
import React, { useEffect, useState, useRef } from 'react';
import type { ScryfallCard, ScryfallSearch } from '../utils/scryfall';
import { loadSearchResults, getMainImages } from '../utils/scryfall';

export interface CardSelectorProps {
    onSelect: (card: ScryfallCard) => void,
    controller?: React.RefObject<CardSelectorController | null>,
}

export interface CardSelectorController {
    focus: () => void,
    clear: () => void,
}

function CardSelector({ onSelect, controller }: CardSelectorProps) {
    const [searchName, setSearchName] = useState<string>('');
    const [searchSet, setSearchSet] = useState<string>('');
    const [searchNum, setSearchNum] = useState<string>('');
    const [searchExtras, setSearchExtras] = useState<boolean>(false);
    const [searchVariations, setSearchVariations] = useState<boolean>(false);

    const [results, setResults] = useState<ScryfallCard[]>([]);
    const [hovered, setHovered] = useState<ScryfallCard | null>(null);
    const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
    const [setLocked, setSetLocked] = useState<boolean>(false);
    const [autofocused, setAutofocused] = useState<number>(0);

    const inputs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ]

    if (controller && inputs[autofocused].current) {
        controller.current = {
            focus: () => inputs[autofocused].current!.focus(),
            clear: () => {
                setSearchName('');
                if (!setLocked) setSearchSet('');
                setSearchNum('');

                setResults([]);
                setHovered(null);
            }
        }
    }

    useEffect(() => {
        const controller: AbortController = new AbortController();

        const search: ScryfallSearch = {
            q: ['not:digital'],
            unique: 'prints',
            include_extras: searchExtras,
            include_variations: searchVariations,
        }
        if (searchName) {
            // Disabled for now, since using regex for the name causes extras to be included
            // const escaped: string = searchName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            search.q.push(`name:"${searchName}"`);
        }
        if (searchSet) search.q.push(`s:"${searchSet}"`);
        if (searchNum) search.q.push(`cn:"${searchNum}"`);

        // If query is not empty, search for cards and add them to the results
        if (search.q.length > 1) {
            setTimeout(async () => {
                try {
                    for await (const page of loadSearchResults(search, controller.signal)) {
                        setResults(current => [...current, ...page])
                        setHovered(current => current || page[0])
                    }
                } catch (e) {
                    if (e instanceof Error && e.name !== 'AbortError') {
                        alert(e.message);
                    }
                }
            }, 500);
        }

        // Cancel search if input values are still being edited
        return () => {
            controller.abort();
            setResults([]);
            setHovered(null);
        };
    }, [searchName, searchSet, searchNum, searchExtras, searchVariations]);

    // Functions for updating and checking form values
    function updateName(e: React.ChangeEvent<HTMLInputElement>) {
        setSearchName(e.target.value.replaceAll('"',''));
    }
    function updateSet(e: React.ChangeEvent<HTMLInputElement>) {
        setSearchSet(e.target.value.replaceAll(/[ "]/g,''));
    }
    function updateNum(e: React.ChangeEvent<HTMLInputElement>) {
        setSearchNum(e.target.value.replaceAll(/[ "]/g,''));
    }

    function updateAutofocus(e: React.ChangeEvent<HTMLSelectElement>) {
        setAutofocused(e.target.selectedIndex);
    }

    // When submitted through the form, select the hovered card
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (hovered !== null)
            onSelect(hovered);
    }

    return (
        <div className={styles['outer']}>
            <div className={styles['inner']}>
                <form className={styles['search']} autoComplete="off" onSubmit={handleSubmit}>
                    <p>
                        <label htmlFor="name">Card Name: </label>
                        <input
                            value={searchName}
                            id="name"
                            placeholder="Storm Crow"
                            onChange={updateName}
                            ref={inputs[0]}
                            autoFocus={autofocused === 0}
                        />
                    </p>
                    <p>
                        <label htmlFor="set">Set Code: </label>
                        <input
                            value={searchSet}
                            id="set"
                            placeholder="9ED"
                            onChange={updateSet}
                            ref={inputs[1]}
                            autoFocus={autofocused === 1}
                        />
                    </p>
                    <p>
                        <label htmlFor="cn">Number: </label>
                        <input
                            value={searchNum}
                            id="cn"
                            placeholder="100"
                            onChange={updateNum}
                            ref={inputs[2]}
                            autoFocus={autofocused === 2}
                        />
                    </p>
                    <div className={styles['settings']}>
                        <p onClick={() => setOptionsOpen(current => !current)}
                           onKeyDown={(e) => [' ','Enter'].includes(e.key) && e.currentTarget.click()}
                           tabIndex={0}>
                            {optionsOpen ? '\u2212' : '+'} Settings
                        </p>
                        {
                            optionsOpen && <div>
                                <div>
                                    <input
                                        type='checkbox'
                                        id='extras'
                                        checked={searchExtras}
                                        onChange={() => setSearchExtras(current => !current)}
                                    />
                                    <label htmlFor='extras'>Include extras</label>
                                </div>
                                <div>
                                    <input
                                        type='checkbox'
                                        id='variations'
                                        checked={searchVariations}
                                        onChange={() => setSearchVariations(current => !current)}
                                    />
                                    <label htmlFor='variations'>Include variations</label>
                                </div>
                                <div>
                                    <input
                                        type='checkbox'
                                        id='lock'
                                        checked={setLocked}
                                        onChange={() => setSetLocked(current => !current)}
                                    />
                                    <label htmlFor='lock'>Lock set code</label>
                                </div>
                                <div>
                                    <label htmlFor='autofocus'>Autofocus: </label>
                                    <select
                                        id='autofocus'
                                        onChange={updateAutofocus}
                                        value={['Name', 'Set', 'Number'][autofocused]}
                                    >
                                        <option>Name</option>
                                        <option>Set</option>
                                        <option>Number</option>
                                    </select>
                                </div>
                            </div>
                        }
                    </div>
                    <input type="submit" hidden/>
                </form>
                <div className={styles['big-card-container']}>
                    {hovered && (
                        <img className={`${styles['card']} ${styles['big-card']}`} alt="Selected Card"
                             src={getMainImages(hovered).large}/>
                    )}
                </div>
            </div>
            <div className={styles['small-cards']}>
                {results.map(card => <div key={card.id}>
                    <img className={styles['card']}
                         src={getMainImages(card).small}
                         alt={card.name}
                         onMouseOver={() => setHovered(card)}
                         onClick={() => onSelect(card)}/>
                </div>)}
            </div>
        </div>
    );
}

export default CardSelector;