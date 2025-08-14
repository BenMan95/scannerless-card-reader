interface Row {
    quantity: number,
    scryfall_id: string,
    card_name: string,
    set_code: string,
    collector_number: string,
    language: string,
    finish: string,
}

const rowFields: (keyof Row)[] = [
    'quantity',
    'scryfall_id',
    'card_name',
    'set_code',
    'collector_number',
    'language',
    'finish',
]

interface ImportSettings {
    skip_first: boolean,
    columns: Partial<Record<keyof Row, number>>,
}

interface ExportSettings {
    write_headers: boolean,
    columns: [keyof Row, string][],
}

export type { Row, ImportSettings, ExportSettings };
export { rowFields };