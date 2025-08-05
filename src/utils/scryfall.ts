type ScryfallType = 'error' | 'list' | 'card'
type ScryfallImageStatus = 'missing' | 'placeholder' | 'lowres' | 'highres_scan'

interface ScryfallError {
    object: ScryfallType,
    status: number,
    code: string,
    details: string,
    type?: string,
    warnings?: string[],
}

interface ScryfallList {
    object: ScryfallType,
    data: ScryfallCard[],
    has_more: boolean,
    next_page?: string,
    total_cards?: number,
    warnings?: string[],
}

interface ScryfallCard {
    object: ScryfallType,

    id: string,
    oracle_id: string,
    name: string;
    set_name: string,
    set: string,
    collector_number: string,
    lang: string,

    finishes: string[],
    image_status: ScryfallImageStatus,
    image_uris?: ScryfallImages,
    card_faces?: { image_uris: ScryfallImages }[],
}

interface ScryfallImages {
    small: string,
    normal: string,
    large: string,
    png: string,
    art_crop: string,
    border_crop: string,
}

interface ScryfallSearch {
    q: string[],
    unique?: string,
    include_extras?: boolean,
    include_multilingual?: boolean,
    include_variations?: boolean,
}

const API_ENDPOINT = 'https://api.scryfall.com/cards';

function encodeSearchURL(search: ScryfallSearch) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(search))
        params.set(key, String(value))
    params.set('q', search.q.join(' '))

    return `${API_ENDPOINT}/search?${params.toString()}`
}

function encodeIdURL(id: string) {
    return `${API_ENDPOINT}/${id}`
}

function encodeCodeNumURL(set_code: string, collector_number: string) {
    return `${API_ENDPOINT}/${set_code}/${collector_number}`;
}

async function* loadSearchResults(search: ScryfallSearch, signal?: AbortSignal): AsyncGenerator<ScryfallCard[]> {
    let next_url: string | undefined = encodeSearchURL(search);
    while (next_url) {
        const response: Response = await fetch(next_url, {signal})
        const json: ScryfallError | ScryfallList = await response.json();

        if (json.object === 'error') {
            const error = json as ScryfallError;
            throw new Error(`${error.status} ${error.code} error: ${error.details}`);
        }

        const list = json as ScryfallList;
        yield list.data;
        next_url = list.next_page;
    }
}

function getMainImages(card: ScryfallCard): ScryfallImages {
    let retVal;
    if (card.image_uris) {
        retVal = card.image_uris;
    } else if (card.card_faces) {
        retVal = card.card_faces[0].image_uris;
    }

    if (!retVal) {
        retVal = {
            small: 'https://errors.scryfall.com/soon.jpg',
            normal: 'https://errors.scryfall.com/soon.jpg',
            large: 'https://errors.scryfall.com/soon.jpg',
            png: 'https://errors.scryfall.com/soon.jpg',
            art_crop: 'https://errors.scryfall.com/soon.jpg',
            border_crop: 'https://errors.scryfall.com/soon.jpg',
        }
    }

    return retVal;
}

export type { ScryfallType, ScryfallError, ScryfallList, ScryfallCard, ScryfallImages, ScryfallSearch }
export { encodeSearchURL, encodeIdURL, encodeCodeNumURL, loadSearchResults, getMainImages }