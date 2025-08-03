type ScryfallType = 'error' | 'list' | 'card'
type ScryfallImageStatus = 'missing' | 'placeholder' | 'lowres' | 'highres_scan'

interface ScryfallError {
    object: ScryfallType,
    status: number,
    code: string,
    details: string,
    type: string | null,
    warnings: string[] | null,
}

interface ScryfallList {
    object: ScryfallType,
    data: ScryfallCard[],
    has_more: boolean,
    next_page: string | null,
    total_cards: number | null,
    warnings: string[] | null,
}

interface ScryfallCard {
    object: ScryfallType,

    id: string,
    name: string;
    set: string,
    collector_number: string,
    lang: string,

    image_status: ScryfallImageStatus,
    image_uris: ScryfallImages | null,
    card_faces: { image_uris: ScryfallImages }[],
    finishes: string[],
}

interface ScryfallImages {
    small: string,
    normal: string,
    large: string,
    png: string,
    art_crop: string,
    border_crop: string,
}

export type { ScryfallType, ScryfallError, ScryfallList, ScryfallCard, ScryfallImages }