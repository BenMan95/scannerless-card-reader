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

interface BaseCard {
    object: ScryfallType,

    id: string,
    name: string;
    set: string,
    collector_number: string,
    lang: string,

    finishes: string[],
    image_status: ScryfallImageStatus,
}

interface SingleFaceCard extends BaseCard {
    image_uris: ScryfallImages,
}
interface DoubleFaceCard extends BaseCard {
    card_faces: { image_uris: ScryfallImages }[],
}

type ScryfallCard = SingleFaceCard | DoubleFaceCard;

interface ScryfallImages {
    small: string,
    normal: string,
    large: string,
    png: string,
    art_crop: string,
    border_crop: string,
}

interface ScryfallSearch {
    query: string[],
    unique?: string,
    include_extras?: boolean,
    include_multilingual?: boolean,
    include_variations?: boolean,
}

const API_ENDPOINT = 'https://api.scryfall.com/cards';

function encodeSearchURL(search: ScryfallSearch): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(search))
        params.set(key, String(value))
    params.set('q', search.query.join(' '))

    return `${API_ENDPOINT}/search?${params.toString()}`
}

function encodeIdURL(id: string) {
    return `${API_ENDPOINT}/${id}`
}

function encodeCodeNumURL(set_code: string, collector_number: string) {
    return `${API_ENDPOINT}/${set_code}/${collector_number}`;
}

function getMainImages(card: ScryfallCard): ScryfallImages {
    if ('image_uris' in card)
        return (card as SingleFaceCard).image_uris;
    return (card as DoubleFaceCard).card_faces[0].image_uris;
}

export type { ScryfallType, ScryfallError, ScryfallList, ScryfallCard, ScryfallImages, ScryfallSearch }
export { encodeSearchURL, encodeIdURL, encodeCodeNumURL, getMainImages }