import { useEffect, useState } from 'react';

function Selector(props) {
    const [formVals, setVals] = useState({name:'', set:'', cn:''});
    const [results, setResults] = useState([]);
    const [hovered, setHovered] = useState(null);
    const [shift, setShift] = useState(false);

    useEffect(() => {
        const press = e => {if (e.key === 'Shift') setShift(true)};
        const unpress = e => {if (e.key === 'Shift') setShift(false)};

        document.addEventListener('keydown', press);
        document.addEventListener('keyup', unpress);

        return () => {
            document.removeEventListener('keydown', press);
            document.removeEventListener('keyup', unpress);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const filters = [];
        if (formVals.name) filters.push(`name:'${formVals.name}'`);
        if (formVals.set) filters.push(`s:'${formVals.set}'`);
        if (formVals.cn) filters.push(`cn:'${formVals.cn}'`);

        if (formVals.name || formVals.set || formVals.cn) {
            const query = filters.join(' ');
            let next_url = encodeURI(`https://api.scryfall.com/cards/search?unique=prints&q=not:digital ${query}`);
            setTimeout(async () => {
                try {
                    do {
                        let response = await fetch(next_url, {signal:controller.signal});
                        let json = await response.json();

                        if (json.object === 'error') {
                            alert(`${json.status} Error: ${json.code}\n${json.details}`);
                            return;
                        }

                        setResults(current => [...current, ...json.data]);
                        setHovered(current => current || json.data[0]);

                        next_url = json.has_next && json.next_page;
                    } while (next_url);
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        console.log(e);
                    }
                }
            }, 500);
        }

        return () => {
            controller.abort();
            setResults([]);
            setHovered(null);
        };
    }, [formVals]);

    function updateSearch(e) {
        const target = e.target;
        const newVals = {...formVals};
        newVals[target.id] = target.value;
        setVals(newVals);
    }

    function selectCard(card) {
        if (card != null) {
            props.onSelect(card);
        }

        console.log(shift);
        setVals({name:'', set:'', cn:''});
        setResults([]);
        setHovered(null);
    }

    function handleSubmit(e) {
        e.preventDefault();
        selectCard(hovered);
    }

    return (
        <div id='outer'>
            <div id='inner'>
                <form id='search' autoComplete='off' onSubmit={handleSubmit}>
                    <p>
                        <label htmlFor='name'>Card Name: </label>
                        <input value={formVals.name} id='name' placeholder='Card Name' onChange={updateSearch} autoFocus/>
                    </p>
                    <p>
                        <label htmlFor='set'>Set Code: </label>
                        <input value={formVals.set} id='set' placeholder='Set Code' onChange={updateSearch}/>
                    </p>
                    <p>
                        <label htmlFor='cn'>Number: </label>
                        <input value={formVals.cn} id='cn' placeholder='Collector Number' onChange={updateSearch}/>
                    </p>
                    <input type='submit' hidden/>
                </form>
                <div id='big-card-container'>
                    {hovered && (
                        <img className='card' id='big-card' alt='Selected Card'
                             src={(hovered.image_uris ?? hovered.card_faces[0].image_uris).large}/>
                    )}
                </div>
            </div>
            <div id='small-cards'>
                {results.map(card => {
                    const images = card.image_uris ?? card.card_faces[0].image_uris;
                    return (<img className='card'
                                 src={images.small}
                                 key={card.id}
                                 alt={card.name}
                                 onMouseOver={() => setHovered(card)}
                                 onClick={() => selectCard(card)}/>)
                })}
            </div>
        </div>
    );
}

export default Selector;